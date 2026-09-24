import { sha256 } from "../_shared/crypto.ts";
import { env, json } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppText, sentMessageId, verifyWhatsAppSignature, type WhatsAppSendResult } from "../_shared/whatsapp.ts";

type Admin = ReturnType<typeof adminClient>;
type MetaMessage = { id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string }; interactive?: { button_reply?: { id?: string }; list_reply?: { id?: string } } };
type Item = { id: string; name: string; sku: string; quantity: number; price: number };
type Context = { verificationToken?: string; order?: { orderId: string; customerName: string; items: Item[] }; itemId?: string; quantity?: number; reason?: string; condition?: string; decisionId?: string };

const textOf = (message: MetaMessage) => message.text?.body?.trim() || message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || "";

async function invoke(name: string, body: Record<string, unknown>) {
  const key = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? env("SUPABASE_ANON_KEY");
  const response = await fetch(`${env("SUPABASE_URL")}/functions/v1/${name}`, {
    method: "POST", headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${name}_${payload?.error ?? response.status}`);
  return payload;
}

async function getFlow(admin: Admin, id: string) {
  const { data, error } = await admin.rpc("get_whatsapp_flow_state", { p_conversation_id: id });
  if (error) throw error;
  return (data?.[0] ?? { step: "MENU", context: {} }) as { step: string; context: Context };
}

async function setFlow(admin: Admin, id: string, step: string, context: Context = {}) {
  const { error } = await admin.rpc("set_whatsapp_flow_state", { p_conversation_id: id, p_step: step, p_context: context });
  if (error) throw error;
}

async function saveOutbound(admin: Admin, storeId: string, conversationId: string, result: WhatsAppSendResult, body: string, type: "TEXT" | "INTERACTIVE") {
  const { error } = await admin.from("whatsapp_messages").upsert({
    store_id: storeId, conversation_id: conversationId, external_message_id: sentMessageId(result), direction: "OUTBOUND",
    message_type: type, body, status: "SENT", occurred_at: new Date().toISOString(),
  }, { onConflict: "external_message_id", ignoreDuplicates: true });
  if (error) throw error;
}

async function claim(admin: Admin, storeId: string, messageId: string, eventType: string) {
  const { data: existing } = await admin.from("integration_events").select("id,status,attempts")
    .eq("provider", "whatsapp").eq("external_event_id", messageId).maybeSingle();
  if (existing?.status === "PROCESSED") return false;
  if (existing) {
    const { error } = await admin.from("integration_events").update({ status: "PROCESSING", attempts: Number(existing.attempts) + 1, last_error: null }).eq("id", existing.id);
    if (error) throw error;
    return true;
  }
  const { error } = await admin.from("integration_events").insert({
    store_id: storeId, provider: "whatsapp", external_event_id: messageId, event_type: eventType,
    payload_digest: await sha256(messageId), status: "PROCESSING", attempts: 1,
  });
  if (error) throw error;
  return true;
}

async function menu(to: string, language: "ar" | "en") {
  const body = language === "ar" ? "مرحبًا بك في ريلود. كيف يمكننا مساعدتك؟" : "Welcome to Relod. What would you like to do?";
  const buttons = language === "ar"
    ? [{ id: "start_return", title: "بدء طلب إرجاع" }, { id: "merchant_setup", title: "ربط متجري" }, { id: "human_help", title: "التحدث مع موظف" }]
    : [{ id: "start_return", title: "Start a return" }, { id: "merchant_setup", title: "Connect my store" }, { id: "human_help", title: "Talk to a person" }];
  return { body, result: await sendWhatsAppButtons(to, body, buttons), type: "INTERACTIVE" as const };
}

async function reasons(to: string, language: "ar" | "en") {
  const body = language === "ar" ? "ما سبب الإرجاع؟" : "Why are you returning this item?";
  const values = language === "ar"
    ? [["defective", "المنتج معيب"], ["wrong_item", "منتج غير صحيح"], ["not_as_described", "غير مطابق للوصف"], ["changed_mind", "تغيير الرأي"], ["damaged_in_transit", "تضرر أثناء الشحن"]]
    : [["defective", "Defective"], ["wrong_item", "Wrong item"], ["not_as_described", "Not as described"], ["changed_mind", "Changed my mind"], ["damaged_in_transit", "Damaged in transit"]];
  return { body, result: await sendWhatsAppList(to, body, language === "ar" ? "اختيار السبب" : "Choose reason", values.map(([id, title]) => ({ id: `reason:${id}`, title }))), type: "INTERACTIVE" as const };
}

async function processFlow(admin: Admin, store: { id: string; return_code: string }, conversation: { id: string; language: string }, to: string, input: string) {
  let language: "ar" | "en" = conversation.language === "en" ? "en" : "ar";
  const normalized = input.trim().toLowerCase();
  if (["english", "en", "language_en"].includes(normalized) || ["العربية", "عربي", "ar", "language_ar"].includes(normalized)) {
    language = ["english", "en", "language_en"].includes(normalized) ? "en" : "ar";
    await admin.from("whatsapp_conversations").update({ language }).eq("id", conversation.id);
    await setFlow(admin, conversation.id, "MENU");
    return menu(to, language);
  }
  if (["menu", "start", "مرحبا", "مرحباً", "ابدأ"].includes(normalized)) {
    await setFlow(admin, conversation.id, "MENU");
    return menu(to, language);
  }
  if (normalized === "human_help") {
    await admin.from("whatsapp_conversations").update({ state: "HANDED_TO_HUMAN" }).eq("id", conversation.id);
    const body = language === "ar" ? "تم تحويل المحادثة إلى الفريق. سيتواصل معك أحد الموظفين قريبًا." : "This conversation has been handed to the team. Someone will follow up shortly.";
    return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
  }
  if (normalized === "merchant_setup") {
    const link = `${env("APP_URL").replace(/\/$/, "")}/app/integrations`;
    const body = language === "ar" ? `اربط متجرك في سلة بأمان من هنا:\n${link}` : `Connect your Salla store securely here:\n${link}`;
    return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
  }
  if (normalized === "start_return") {
    await setFlow(admin, conversation.id, "AWAITING_ORDER");
    await admin.from("whatsapp_conversations").update({ state: "VERIFYING_ORDER" }).eq("id", conversation.id);
    const body = language === "ar" ? "أرسل رقم الطلب للبدء." : "Send your order number to begin.";
    return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
  }

  const flow = await getFlow(admin, conversation.id);
  if (flow.step === "AWAITING_ORDER") {
    try {
      const lookup = await invoke("salla-order-lookup", { returnCode: store.return_code, orderNumber: input.trim(), verifier: to });
      const order = lookup.order as Context["order"];
      if (!order?.items?.length || typeof lookup.verificationToken !== "string") throw new Error("order_not_verified");
      const context = { order, verificationToken: lookup.verificationToken };
      await setFlow(admin, conversation.id, "AWAITING_ITEM", context);
      await admin.from("whatsapp_conversations").update({ state: "CAPTURING_RETURN" }).eq("id", conversation.id);
      const body = language === "ar" ? `تم التحقق من الطلب ${order.orderId}. اختر المنتج.` : `Order ${order.orderId} verified. Choose the item.`;
      return { body, result: await sendWhatsAppList(to, body, language === "ar" ? "اختيار المنتج" : "Choose item", order.items.slice(0, 10).map((item) => ({ id: `item:${item.id}`, title: item.name, description: `${item.sku || "SKU —"} · Qty ${item.quantity}` }))), type: "INTERACTIVE" as const };
    } catch {
      const body = language === "ar" ? "تعذر التحقق. استخدم رقم الجوال المسجل في طلب سلة ثم أرسل رقم الطلب مرة أخرى." : "We could not verify that order. Use the WhatsApp number saved on the Salla order, then try again.";
      return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
    }
  }
  if (flow.step === "AWAITING_ITEM") {
    const itemId = normalized.startsWith("item:") ? input.slice(5) : "";
    const item = flow.context.order?.items.find((entry) => entry.id === itemId);
    if (!item) return { body: language === "ar" ? "اختر منتجًا من القائمة." : "Choose an item from the list.", result: await sendWhatsAppText(to, language === "ar" ? "اختر منتجًا من القائمة." : "Choose an item from the list."), type: "TEXT" as const };
    const context = { ...flow.context, itemId };
    if (item.quantity > 1) {
      await setFlow(admin, conversation.id, "AWAITING_QUANTITY", context);
      const body = language === "ar" ? "كم قطعة تريد إرجاعها؟" : "How many units would you like to return?";
      return { body, result: await sendWhatsAppList(to, body, language === "ar" ? "اختيار الكمية" : "Choose quantity", Array.from({ length: Math.min(item.quantity, 10) }, (_, index) => ({ id: `qty:${index + 1}`, title: String(index + 1) }))), type: "INTERACTIVE" as const };
    }
    await setFlow(admin, conversation.id, "AWAITING_REASON", { ...context, quantity: 1 });
    return reasons(to, language);
  }
  if (flow.step === "AWAITING_QUANTITY") {
    const quantity = normalized.startsWith("qty:") ? Number(input.slice(4)) : Number(input);
    const item = flow.context.order?.items.find((entry) => entry.id === flow.context.itemId);
    if (!Number.isInteger(quantity) || quantity < 1 || !item || quantity > item.quantity) {
      const body = language === "ar" ? "اختر كمية صحيحة." : "Choose a valid quantity.";
      return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
    }
    await setFlow(admin, conversation.id, "AWAITING_REASON", { ...flow.context, quantity });
    return reasons(to, language);
  }
  if (flow.step === "AWAITING_REASON") {
    const reason = normalized.startsWith("reason:") ? input.slice(7) : "";
    if (!["defective", "wrong_item", "not_as_described", "changed_mind", "damaged_in_transit"].includes(reason)) return reasons(to, language);
    await setFlow(admin, conversation.id, "AWAITING_CONDITION", { ...flow.context, reason });
    const body = language === "ar" ? "ما حالة المنتج؟" : "What is the item condition?";
    const buttons = language === "ar"
      ? [{ id: "condition:new_unopened", title: "جديد وغير مفتوح" }, { id: "condition:opened_unused", title: "مفتوح دون استخدام" }, { id: "condition:used", title: "مستخدم" }]
      : [{ id: "condition:new_unopened", title: "New, unopened" }, { id: "condition:opened_unused", title: "Opened, unused" }, { id: "condition:used", title: "Used" }];
    return { body, result: await sendWhatsAppButtons(to, body, buttons), type: "INTERACTIVE" as const };
  }
  if (flow.step === "AWAITING_CONDITION") {
    const condition = normalized.startsWith("condition:") ? input.slice(10) : "";
    if (!["new_unopened", "opened_unused", "used"].includes(condition)) {
      const body = language === "ar" ? "اختر حالة المنتج من الأزرار." : "Choose the condition using the buttons.";
      return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
    }
    const context = { ...flow.context, condition };
    const evaluated = await invoke("return-decide", { verificationToken: context.verificationToken, itemId: context.itemId, quantity: context.quantity, reason: context.reason, condition, action: "evaluate" });
    let caseId: string | null = null;
    if (["ELIGIBLE", "MANUAL_REVIEW"].includes(evaluated.decision?.outcome)) {
      const created = await invoke("return-decide", { verificationToken: context.verificationToken, decisionId: evaluated.decisionId, itemId: context.itemId, quantity: context.quantity, reason: context.reason, condition, action: "create_case" });
      caseId = created.caseId ?? null;
      if (caseId) await admin.from("whatsapp_conversations").update({ return_case_id: caseId }).eq("id", conversation.id);
    }
    await setFlow(admin, conversation.id, "COMPLETE", { ...context, decisionId: evaluated.decisionId });
    await admin.from("whatsapp_conversations").update({ state: "ANSWERED" }).eq("id", conversation.id);
    const outcome = evaluated.decision?.outcome;
    const body = language === "ar"
      ? outcome === "ELIGIBLE" ? `طلبك مؤهل. تم إنشاء الحالة تلقائيًا${caseId ? `: ${caseId}` : ""}.` : outcome === "MANUAL_REVIEW" ? `يحتاج الطلب إلى مراجعة بشرية. تم إنشاء الحالة${caseId ? `: ${caseId}` : ""}.` : `الطلب غير مؤهل. ${evaluated.decision?.explanation ?? ""}`
      : outcome === "ELIGIBLE" ? `Your return is eligible. Case${caseId ? ` ${caseId}` : ""} was created automatically.` : outcome === "MANUAL_REVIEW" ? `The request needs human review. Case${caseId ? ` ${caseId}` : ""} was created automatically.` : `This return is not eligible. ${evaluated.decision?.explanation ?? ""}`;
    return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
  }
  const body = language === "ar" ? "اكتب «ابدأ» لفتح القائمة." : "Type “start” to open the menu.";
  return { body, result: await sendWhatsAppText(to, body), type: "TEXT" as const };
}

async function handleMessage(phoneNumberId: string, message: MetaMessage, profileName?: string) {
  const messageId = message.id ?? "";
  const waId = (message.from ?? "").replace(/\D/g, "");
  if (!messageId || !waId) return;
  const admin = adminClient();
  const { data: connection } = await admin.from("whatsapp_connections").select("store_id").eq("phone_number_id", phoneNumberId).eq("status", "CONNECTED").maybeSingle();
  if (!connection) throw new Error("whatsapp_connection_not_found");
  if (!await claim(admin, connection.store_id, messageId, `MESSAGE_${String(message.type ?? "unknown").toUpperCase()}`)) return;
  try {
    const { data: store, error: storeError } = await admin.from("stores").select("id,return_code").eq("id", connection.store_id).single();
    if (storeError || !store?.return_code) throw storeError ?? new Error("store_return_code_missing");
    const { data: contact, error: contactError } = await admin.from("whatsapp_contacts").upsert({ store_id: store.id, wa_id: waId, display_name: profileName?.slice(0, 120) || null, updated_at: new Date().toISOString() }, { onConflict: "store_id,wa_id" }).select("id,locale").single();
    if (contactError) throw contactError;
    let { data: conversation } = await admin.from("whatsapp_conversations").select("id,state,language").eq("store_id", store.id).eq("contact_id", contact.id).neq("state", "CLOSED").order("last_message_at", { ascending: false }).limit(1).maybeSingle();
    if (!conversation) {
      const created = await admin.from("whatsapp_conversations").insert({ store_id: store.id, contact_id: contact.id, state: "VERIFYING_ORDER", language: contact.locale, service_window_expires_at: new Date(Date.now() + 86_400_000).toISOString() }).select("id,state,language").single();
      if (created.error) throw created.error;
      conversation = created.data;
    } else await admin.from("whatsapp_conversations").update({ service_window_expires_at: new Date(Date.now() + 86_400_000).toISOString(), last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversation.id);
    const input = textOf(message);
    const { error: messageError } = await admin.from("whatsapp_messages").insert({ store_id: store.id, conversation_id: conversation.id, external_message_id: messageId, direction: "INBOUND", message_type: message.type === "interactive" ? "INTERACTIVE" : message.type === "text" ? "TEXT" : "UNSUPPORTED", body: input.slice(0, 4096) || null, status: "RECEIVED", occurred_at: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString() });
    if (messageError) throw messageError;
    const response = await processFlow(admin, store, conversation, waId, input);
    await saveOutbound(admin, store.id, conversation.id, response.result, response.body, response.type);
    await admin.from("integration_events").update({ status: "PROCESSED", processed_at: new Date().toISOString() }).eq("provider", "whatsapp").eq("external_event_id", messageId);
  } catch (error) {
    await admin.from("integration_events").update({ status: "FAILED", last_error: error instanceof Error ? error.message.slice(0, 180) : "unknown", processed_at: new Date().toISOString() }).eq("provider", "whatsapp").eq("external_event_id", messageId);
    throw error;
  }
}

Deno.serve(async (request) => {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const valid = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === env("WHATSAPP_VERIFY_TOKEN");
    return valid ? new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 }) : json({ error: "verification_failed" }, 403);
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const rawBody = await request.text();
  try {
    if (!await verifyWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256") ?? "")) return json({ error: "invalid_signature" }, 401);
    const payload = JSON.parse(rawBody);
    const admin = adminClient();
    for (const entry of payload.entry ?? []) for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const phoneNumberId = String(value.metadata?.phone_number_id ?? "");
      for (const status of value.statuses ?? []) {
        const next = String(status.status ?? "").toUpperCase();
        if (["SENT", "DELIVERED", "READ", "FAILED"].includes(next)) await admin.from("whatsapp_messages").update({ status: next, failure_code: status.errors?.[0]?.code ? String(status.errors[0].code) : null }).eq("external_message_id", String(status.id ?? ""));
      }
      for (const message of value.messages ?? []) await handleMessage(phoneNumberId, message, value.contacts?.[0]?.profile?.name);
      if (phoneNumberId) await admin.from("whatsapp_connections").update({ last_webhook_at: new Date().toISOString() }).eq("phone_number_id", phoneNumberId);
    }
    return json({ received: true });
  } catch (error) {
    console.error("whatsapp_webhook_failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "webhook_processing_failed" }, 500);
  }
});
