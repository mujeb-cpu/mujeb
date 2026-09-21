import { corsHeaders, env, json } from "../_shared/http.ts";
import { userClient } from "../_shared/supabase.ts";

const categories = ["window", "reasons", "conditions", "exclusions", "order_status", "quantity", "fallback"] as const;
const allowedCategories = new Set<string>(categories);

type ProposedRule = {
  category: typeof categories[number];
  name: string;
  description: string;
  value: string;
  sourceExcerpt: string;
};

function parseContent(content: string) {
  const clean = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(clean) as { rules?: ProposedRule[]; warnings?: string[] };
}

function validate(sourceText: string, value: ReturnType<typeof parseContent>) {
  if (!Array.isArray(value.rules) || value.rules.length === 0 || value.rules.length > 20) {
    throw new Error("invalid_rules");
  }
  const seen = new Set<string>();
  const rules = value.rules.map((rule, index) => {
    if (!rule || !allowedCategories.has(rule.category) || seen.has(rule.category)) throw new Error("invalid_category");
    seen.add(rule.category);
    for (const field of [rule.name, rule.description, rule.value, rule.sourceExcerpt]) {
      if (typeof field !== "string" || !field.trim()) throw new Error("invalid_rule");
    }
    const start = sourceText.indexOf(rule.sourceExcerpt);
    if (start < 0) throw new Error("source_excerpt_not_found");
    if (rule.category === "window" && !/^\d{1,3}$/.test(rule.value)) throw new Error("invalid_window");
    if (rule.category === "quantity" && !/^\d{1,4}$/.test(rule.value)) throw new Error("invalid_quantity");
    if (rule.category === "fallback" && rule.value !== "manual_review") throw new Error("invalid_fallback");
    return {
      id: crypto.randomUUID(), category: rule.category,
      name: rule.name.trim(), description: rule.description.trim(), value: rule.value.trim(),
      creator: "ai", approvalState: "pending",
      sourceExcerpt: rule.sourceExcerpt,
      sourceRange: { start, end: start + rule.sourceExcerpt.length },
      extractionOrder: index,
    };
  });
  return { rules, warnings: Array.isArray(value.warnings) ? value.warnings.filter((item) => typeof item === "string").slice(0, 10) : [] };
}

function prompt(sourceText: string, retry = false) {
  return `You extract a merchant return policy into proposed deterministic rules. The policy may be Arabic or English.
Return JSON only: {"rules":[{"category":"window|reasons|conditions|exclusions|order_status|quantity|fallback","name":"short merchant-friendly label in the policy language","description":"plain-language meaning in the policy language","value":"engine value","sourceExcerpt":"exact verbatim substring from the policy"}],"warnings":["ambiguity or missing fact in the policy language"]}.

Rules:
- Never invent a rule. Every rule must cite an exact, character-for-character sourceExcerpt.
- At most one rule per category. Omit unsupported categories and add a warning.
- window value: integer days only.
- reasons value: comma-separated codes from defective,wrong_item,not_as_described,changed_mind,damaged_in_transit.
- conditions value: comma-separated codes from new_unopened,opened_unused,used.
- exclusions value: comma-separated exact SKU prefixes/codes explicitly stated.
- order_status value: comma-separated codes from delivered,shipped,processing,cancelled.
- quantity value: integer maximum only.
- fallback value: manual_review only when the policy says missing/uncertain cases need review.
- AI only proposes. A merchant will approve, edit, or reject every rule.
${retry ? "Your previous response failed validation. Check exact excerpts and JSON syntax carefully." : ""}

POLICY:\n${sourceText}`;
}

async function extract(sourceText: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://ollama.com/api/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${env("OLLAMA_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-v4.1-flash",
          messages: [{ role: "user", content: prompt(sourceText, attempt > 0) }],
          stream: false,
          options: { temperature: 0 },
        }),
      });
      if (!response.ok) throw new Error(`ollama_${response.status}`);
      const body = await response.json();
      if (typeof body?.message?.content !== "string") throw new Error("ollama_response_invalid");
      return validate(sourceText, parseContent(body.message.content));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("extraction_failed");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "authentication_required" }, 401);
    const client = userClient(authorization);
    const { data: { user } } = await client.auth.getUser();
    if (!user) return json({ error: "authentication_required" }, 401);
    const { storeId, name, sourceText } = await request.json();
    if (typeof storeId !== "string" || typeof sourceText !== "string" || sourceText.trim().length < 40 || sourceText.length > 30_000) {
      return json({ error: "invalid_policy" }, 400);
    }
    const { data: membership } = await client.from("memberships").select("role")
      .eq("store_id", storeId).eq("user_id", user.id).maybeSingle();
    if (!membership) return json({ error: "insufficient_permission" }, 403);

    const extracted = await extract(sourceText);
    const { data: draft, error } = await client.from("policy_drafts").insert({
      store_id: storeId,
      name: typeof name === "string" && name.trim() ? name.trim().slice(0, 120) : "Returns Policy",
      source_text: sourceText,
      rules: extracted.rules,
      extraction_state: "ready",
      created_by: user.id,
    }).select("id, name, source_text, rules, extraction_state").single();
    if (error) throw error;
    return json({ draft, warnings: extracted.warnings });
  } catch (error) {
    console.error("policy_extraction_failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "policy_extraction_failed" }, 502);
  }
});
