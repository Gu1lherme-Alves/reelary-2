import { T as TSS_SERVER_FUNCTION, a as createServerFn } from "./server-5VHo_4WK.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DxRENTyW.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
function getConfiguredMetaAppId() {
  const rawAppId = process.env.META_APP_ID ?? "1503958561506871";
  return rawAppId?.match(/\d+/)?.[0] ?? null;
}
const getMetaAppId_createServerFn_handler = createServerRpc({
  id: "2127f32bbafdbc247a48f7824e13a5760991fb577779fe58db919d1ccfc5aa23",
  name: "getMetaAppId",
  filename: "src/lib/instagram.functions.ts"
}, (opts) => getMetaAppId.__executeServer(opts));
const getMetaAppId = createServerFn({
  method: "GET"
}).handler(getMetaAppId_createServerFn_handler, async () => {
  return {
    appId: getConfiguredMetaAppId()
  };
});
const connectInstagramAccount_createServerFn_handler = createServerRpc({
  id: "41383486c2fa86cede87f45c84053abfc0df7059bd8fe2d129ebf819231343c3",
  name: "connectInstagramAccount",
  filename: "src/lib/instagram.functions.ts"
}, (opts) => connectInstagramAccount.__executeServer(opts));
const connectInstagramAccount = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  code: stringType().min(1).max(2e3),
  redirectUri: stringType().url().max(500)
}).parse(input)).handler(connectInstagramAccount_createServerFn_handler, async ({
  data,
  context
}) => {
  const appId = getConfiguredMetaAppId();
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Meta App credentials não configuradas no servidor.");
  }
  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", data.redirectUri);
  tokenUrl.searchParams.set("code", data.code);
  const tokenRes = await fetch(tokenUrl.toString());
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Token exchange failed:", err);
    throw new Error("Falha na troca do código por token. Verifique o redirect URI no app Meta.");
  }
  const tokenJson = await tokenRes.json();
  let accessToken = tokenJson.access_token;
  let expiresIn = tokenJson.expires_in ?? 0;
  try {
    const llUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    llUrl.searchParams.set("grant_type", "fb_exchange_token");
    llUrl.searchParams.set("client_id", appId);
    llUrl.searchParams.set("client_secret", appSecret);
    llUrl.searchParams.set("fb_exchange_token", accessToken);
    const llRes = await fetch(llUrl.toString());
    if (llRes.ok) {
      const llJson = await llRes.json();
      accessToken = llJson.access_token;
      expiresIn = llJson.expires_in ?? expiresIn;
    }
  } catch (e) {
    console.warn("Long-lived token exchange skipped:", e);
  }
  const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(accessToken)}`);
  if (!pagesRes.ok) {
    const err = await pagesRes.text();
    console.error("Pages fetch failed:", err);
    throw new Error("Não foi possível buscar as páginas conectadas.");
  }
  const pagesJson = await pagesRes.json();
  console.log("[Meta API] /me/accounts raw response:", JSON.stringify(pagesJson, null, 2));
  const pageWithIg = pagesJson.data.find((p) => p.instagram_business_account);
  if (!pageWithIg || !pageWithIg.instagram_business_account) {
    let permDetails = "Não foi possível verificar permissões";
    try {
      const permRes = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(accessToken)}`);
      if (permRes.ok) {
        const permJson = await permRes.json();
        permDetails = permJson.data.map((p) => `${p.permission}: ${p.status}`).join(" | ");
      }
    } catch (pe) {
      console.error("Failed to fetch permissions:", pe);
    }
    const pageDetails = pagesJson.data.map((p) => `Página "${p.name}" (ID: ${p.id}) -> IG Vinculado: ${p.instagram_business_account ? `@${p.instagram_business_account.username}` : "NENHUM"}`).join(" | ");
    const errorMsg = pagesJson.data.length === 0 ? `Nenhuma página do Facebook foi retornada pelo Meta para esta conta. Verifique se você selecionou a Página na tela de permissões do Facebook. Permissões ativas no Token: [ ${permDetails} ].` : `Nenhuma conta Instagram Business encontrada vinculada às suas páginas. Páginas encontradas: [ ${pageDetails} ]. Permissões ativas no Token: [ ${permDetails} ]. Conecte uma conta IG profissional (Business ou Creator) à sua Página do Facebook nas configurações da Página.`;
    throw new Error(errorMsg);
  }
  const ig = pageWithIg.instagram_business_account;
  const pageAccessToken = pageWithIg.access_token;
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1e3).toISOString() : null;
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("instagram_accounts").upsert({
    user_id: userId,
    instagram_user_id: ig.id,
    username: ig.username,
    access_token: pageAccessToken,
    token_expires_at: expiresAt
  }, {
    onConflict: "user_id,instagram_user_id"
  });
  if (error) {
    const {
      error: insErr
    } = await supabase.from("instagram_accounts").insert({
      user_id: userId,
      instagram_user_id: ig.id,
      username: ig.username,
      access_token: pageAccessToken,
      token_expires_at: expiresAt
    });
    if (insErr) throw new Error(insErr.message);
  }
  return {
    username: ig.username,
    instagramUserId: ig.id
  };
});
export {
  connectInstagramAccount_createServerFn_handler,
  getMetaAppId_createServerFn_handler
};
