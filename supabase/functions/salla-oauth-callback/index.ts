import { encrypt, sha256 } from "../_shared/crypto.ts";
import { env } from "../_shared/http.ts";
import { adminClient } from "../_shared/supabase.ts";

function redirect(path: string, status: string) {
  const target = new URL(path, env("APP_URL"));
  target.searchParams.set("salla", status);
  return Response.redirect(target.toString(), 302);
}

Deno.serve(async (request) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  if (requestUrl.searchParams.has("error") || !code || !state) return redirect("/app/integrations", "cancelled");

  try {
    const admin = adminClient();
    const { data: states, error: stateError } = await admin.rpc("consume_salla_oauth_state", {
      p_state_hash: await sha256(state),
    });
    const savedState = states?.[0];
    if (stateError || !savedState) return redirect("/app/integrations", "invalid_state");

    const tokenResponse = await fetch("https://accounts.salla.sa/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env("SALLA_CLIENT_ID"),
        client_secret: env("SALLA_CLIENT_SECRET"),
        redirect_uri: env("SALLA_REDIRECT_URI"),
        code,
      }),
    });
    if (!tokenResponse.ok) throw new Error(`token_exchange_${tokenResponse.status}`);
    const token = await tokenResponse.json();
    if (typeof token.access_token !== "string") throw new Error("token_response_missing_access_token");

    const userResponse = await fetch("https://accounts.salla.sa/oauth2/user/info", {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
    });
    if (!userResponse.ok) throw new Error(`user_info_${userResponse.status}`);
    const userInfo = await userResponse.json();
    const data = userInfo.data ?? userInfo;
    const merchant = data.merchant ?? data.store ?? data;
    const externalStoreId = String(merchant.id ?? data.merchant_id ?? "");
    if (!externalStoreId) throw new Error("user_info_missing_store_id");
    const externalStoreName = String(merchant.name ?? merchant.username ?? data.name ?? "Salla Store");
    const scopes = String(token.scope ?? "orders.read offline_access").split(/[\s,]+/).filter(Boolean);
    const expiresAt = new Date(Date.now() + Number(token.expires_in ?? 1_209_600) * 1000).toISOString();

    const { error: saveError } = await admin.rpc("finalize_salla_connection", {
      p_store_id: savedState.store_id,
      p_external_store_id: externalStoreId,
      p_external_store_name: externalStoreName,
      p_scopes: scopes,
      p_token_expires_at: expiresAt,
      p_access_token_ciphertext: await encrypt(token.access_token),
      p_refresh_token_ciphertext: typeof token.refresh_token === "string" ? await encrypt(token.refresh_token) : null,
    });
    if (saveError) throw saveError;
    return redirect(savedState.redirect_path, "connected");
  } catch (error) {
    console.error("salla_oauth_callback_failed", error instanceof Error ? error.message : "unknown");
    return redirect("/app/integrations", "error");
  }
});
