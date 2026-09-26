import { sha256 } from "../_shared/crypto.ts";
import { corsHeaders, json } from "../_shared/http.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";
import { sendWhatsAppButtons, sendWhatsAppText } from "../_shared/whatsapp.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const authorization = request.headers.get("Authorization") ?? "";
    const client = userClient(authorization);
    const { data: { user } } = await client.auth.getUser();
    if (!user) return json({ error: "authentication_required" }, 401);
    const { token, action } = await request.json();
    if (typeof token !== "string" || token.length < 40) return json({ error: "invalid_token" }, 400);
    const admin = adminClient();
    const hash = await sha256(token);
    const { data: context } = await admin.rpc("get_whatsapp_onboarding_token", { p_token_hash: hash });
    const current = context?.[0];
    if (!current) return json({ error: "onboarding_expired" }, 410);
    const { data: membership } = await client.from("memberships").select("role").eq("store_id", current.store_id).eq("user_id", user.id).maybeSingle();
    if (!membership || !["owner", "admin"].includes(membership.role)) return json({ error: "insufficient_permission" }, 403);
    if (action === "status") return json({ stage: current.stage });
    if (action === "salla_connected") {
      if (current.stage === "POLICY_PENDING") return json({ stage: current.stage });
      if (current.stage !== "SALLA_PENDING") return json({ error: "invalid_stage" }, 409);
      const { data: connection } = await client.from("commerce_connections").select("external_store_name,status").eq("store_id", current.store_id).eq("platform", "salla").maybeSingle();
      if (connection?.status !== "CONNECTED") return json({ error: "salla_required" }, 409);
      const { data: advanced } = await admin.rpc("advance_whatsapp_onboarding_token", {
        p_token_hash: hash, p_expected_stage: "SALLA_PENDING", p_next_stage: "POLICY_PENDING",
        p_extend_until: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      });
      if (!advanced?.[0]) return json({ error: "invalid_stage" }, 409);
      const { data: conversation } = await admin.from("whatsapp_conversations").select("language,whatsapp_contacts!inner(wa_id)").eq("id", current.conversation_id).maybeSingle();
      const contact = Array.isArray(conversation?.whatsapp_contacts) ? conversation.whatsapp_contacts[0] : conversation?.whatsapp_contacts;
      if (contact?.wa_id) {
        const name = connection.external_store_name || (conversation?.language === "en" ? "Your store" : "متجرك");
        await admin.rpc("set_whatsapp_flow_state", { p_conversation_id: current.conversation_id, p_step: "POLICY_READY", p_context: { onboardingToken: token } });
        await sendWhatsAppButtons(contact.wa_id, conversation?.language === "en"
          ? `${name} is already connected ✅\n\nYou can close this page—we’ll continue right here. Next, let’s set up your return policy.`
          : `${name} مرتبط بالفعل ✅\n\nتقدر تقفل الصفحة، ونكمل من هنا. الخطوة الجاية: نجهّز سياسة الإرجاع.`, conversation?.language === "en"
          ? [{ id: "policy_continue", title: "Continue" }, { id: "onboarding_later", title: "Do this later" }]
          : [{ id: "policy_continue", title: "متابعة" }, { id: "onboarding_later", title: "أكمل لاحقًا" }]);
      }
      return json({ stage: "POLICY_PENDING", notified: Boolean(contact?.wa_id) });
    }
    if (action !== "policy_published" || current.stage !== "POLICY_PENDING") return json({ error: "invalid_stage" }, 409);
    const { data: advanced } = await admin.rpc("advance_whatsapp_onboarding_token", {
      p_token_hash: hash, p_expected_stage: "POLICY_PENDING", p_next_stage: "TEST_PENDING",
      p_extend_until: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    });
    if (!advanced?.[0]) return json({ error: "invalid_stage" }, 409);
    const { data: conversation } = await admin.from("whatsapp_conversations").select("language,whatsapp_contacts!inner(wa_id)").eq("id", current.conversation_id).maybeSingle();
    const contact = Array.isArray(conversation?.whatsapp_contacts) ? conversation.whatsapp_contacts[0] : conversation?.whatsapp_contacts;
    if (contact?.wa_id) {
      const body = conversation?.language === "en"
        ? "Your return policy is approved and live ✅\n\nYour store is ready for its first controlled return test. Use a real Salla test order whose customer mobile matches this WhatsApp number."
        : "تم اعتماد سياسة الإرجاع ونشرها ✅\n\nمتجرك جاهز لأول تجربة إرجاع. استخدم طلبًا تجريبيًا فعليًا من سلة ويكون رقم العميل فيه مطابقًا لرقم واتساب هذا.";
      await sendWhatsAppButtons(contact.wa_id, body, conversation?.language === "en"
        ? [{ id: "start_return", title: "Run first test" }, { id: "human_help", title: "I need help" }]
        : [{ id: "start_return", title: "بدء أول تجربة" }, { id: "human_help", title: "أحتاج مساعدة" }]);
    }
    return json({ stage: "TEST_PENDING", notified: Boolean(contact?.wa_id) });
  } catch (error) {
    console.error("whatsapp_onboarding_failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "onboarding_failed" }, 500);
  }
});
