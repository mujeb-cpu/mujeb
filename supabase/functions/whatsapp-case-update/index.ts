import { sha256 } from "../_shared/crypto.ts";
import { json } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendWhatsAppText, sentMessageId } from "../_shared/whatsapp.ts";

type CaseStatus = "AWAITING_ITEM" | "RECEIVED" | "RESOLVED" | "CANCELLED";

const copy: Record<CaseStatus, { en: string; ar: string }> = {
  AWAITING_ITEM: {
    en: "Your return was approved. Please send or deliver the item using the instructions from the store.",
    ar: "تمت الموافقة على طلب الإرجاع. يرجى إرسال المنتج أو تسليمه وفق تعليمات المتجر.",
  },
  RECEIVED: {
    en: "The store has received your returned item. Your refund is awaiting final confirmation.",
    ar: "استلم المتجر المنتج المرتجع. المبلغ المسترد بانتظار التأكيد النهائي.",
  },
  RESOLVED: {
    en: "Your return is complete and the merchant has confirmed the refund.",
    ar: "اكتمل طلب الإرجاع وأكد المتجر عملية استرداد المبلغ.",
  },
  CANCELLED: {
    en: "Your return case was cancelled. Reply to this message if you need help.",
    ar: "تم إلغاء طلب الإرجاع. أرسل رداً على هذه الرسالة إذا كنت بحاجة إلى مساعدة.",
  },
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let eventId: string | null = null;
  try {
    const body = await request.json();
    const caseId = typeof body?.caseId === "string" ? body.caseId : "";
    const status = typeof body?.status === "string" ? body.status as CaseStatus : null;
    const changedAt = typeof body?.changedAt === "string" ? body.changedAt : "";
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(caseId) || !status || !copy[status]) {
      return json({ error: "invalid_request" }, 400);
    }

    const admin = adminClient();
    const externalEventId = `case-update:${caseId}:${status}:${changedAt}`;
    const { data: claimed, error: claimError } = await admin.from("integration_events").insert({
      provider: "whatsapp",
      external_event_id: externalEventId,
      event_type: "RETURN_CASE_STATUS_NOTIFICATION",
      payload_digest: await sha256(externalEventId),
      status: "PROCESSING",
      attempts: 1,
    }).select("id").maybeSingle();
    if (claimError?.code === "23505") return json({ received: true, duplicate: true });
    if (claimError || !claimed) throw claimError ?? new Error("notification_claim_failed");
    eventId = claimed.id;

    const { data: conversation, error: conversationError } = await admin
      .from("whatsapp_conversations")
      .select("id, store_id, language, service_window_expires_at, whatsapp_contacts!inner(wa_id)")
      .eq("return_case_id", caseId)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) {
      await admin.from("integration_events").update({
        status: "PROCESSED",
        processed_at: new Date().toISOString(),
        last_error: "no_whatsapp_conversation",
      }).eq("id", eventId);
      return json({ sent: false, reason: "no_whatsapp_conversation" });
    }

    if (!conversation.service_window_expires_at || new Date(conversation.service_window_expires_at) <= new Date()) {
      await admin.from("integration_events").update({
        store_id: conversation.store_id,
        status: "FAILED",
        processed_at: new Date().toISOString(),
        last_error: "service_window_expired_template_required",
      }).eq("id", eventId);
      return json({ sent: false, reason: "template_required" });
    }

    const contact = Array.isArray(conversation.whatsapp_contacts)
      ? conversation.whatsapp_contacts[0]
      : conversation.whatsapp_contacts;
    const recipient = contact?.wa_id;
    if (!recipient) throw new Error("whatsapp_contact_missing");
    const language = conversation.language === "en" ? "en" : "ar";
    const message = copy[status][language];
    const result = await sendWhatsAppText(recipient, message);
    const messageId = sentMessageId(result);

    await admin.from("whatsapp_messages").insert({
      store_id: conversation.store_id,
      conversation_id: conversation.id,
      external_message_id: messageId,
      direction: "OUTBOUND",
      message_type: "TEXT",
      body: message,
      status: "SENT",
      safe_metadata: { case_id: caseId, case_status: status },
      occurred_at: new Date().toISOString(),
    });
    await admin.from("integration_events").update({
      store_id: conversation.store_id,
      status: "PROCESSED",
      processed_at: new Date().toISOString(),
      last_error: null,
    }).eq("id", eventId);
    return json({ sent: true, messageId });
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 180) : "unknown";
    console.error("whatsapp_case_update_failed", reason);
    if (eventId) {
      await adminClient().from("integration_events").update({
        status: "FAILED",
        last_error: reason,
        processed_at: new Date().toISOString(),
      }).eq("id", eventId);
    }
    return json({ error: "notification_delivery_failed" }, 502);
  }
});
