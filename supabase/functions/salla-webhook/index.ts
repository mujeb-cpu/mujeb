import { sha256, verifySallaSignature } from "../_shared/crypto.ts";
import { env, json } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const rawBody = await request.text();
  const signature = request.headers.get("X-Salla-Signature") ?? "";

  try {
    if (!await verifySallaSignature(rawBody, signature, env("SALLA_WEBHOOK_SECRET"))) {
      return json({ error: "invalid_signature" }, 401);
    }

    const payload = JSON.parse(rawBody);
    const eventType = String(payload.event ?? payload.type ?? "unknown");
    const merchantId = String(payload.merchant ?? payload.merchant_id ?? payload.data?.merchant_id ?? "");
    const digest = await sha256(rawBody);
    const externalEventId = String(payload.id ?? payload.event_id ?? digest);
    const admin = adminClient();
    let storeId: string | null = null;

    if (merchantId) {
      const { data: connection } = await admin
        .from("commerce_connections")
        .select("id, store_id")
        .eq("platform", "salla")
        .eq("external_store_id", merchantId)
        .maybeSingle();
      storeId = connection?.store_id ?? null;

      if (connection && ["app.store.uninstalled", "app.uninstalled"].includes(eventType)) {
        await admin.from("commerce_connections").update({ status: "REVOKED", updated_at: new Date().toISOString() }).eq("id", connection.id);
      }
    }

    const { error } = await admin.from("integration_events").upsert({
      store_id: storeId,
      provider: "salla",
      external_event_id: externalEventId,
      event_type: eventType,
      payload_digest: digest,
      status: storeId ? "PROCESSED" : "IGNORED",
      attempts: 1,
      processed_at: new Date().toISOString(),
    }, { onConflict: "provider,external_event_id", ignoreDuplicates: true });
    if (error) throw error;

    return json({ received: true });
  } catch (error) {
    console.error("salla_webhook_failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "webhook_processing_failed" }, 500);
  }
});
