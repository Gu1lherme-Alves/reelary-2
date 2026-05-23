import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function getConfiguredMetaAppId() {
  const rawAppId = process.env.META_APP_ID ?? import.meta.env.VITE_META_APP_ID;
  return rawAppId?.match(/\d+/)?.[0] ?? null;
}

// Returns the public Meta App ID so the client can build the OAuth URL.
export const getMetaAppId = createServerFn({ method: "GET" }).handler(async () => {
  return { appId: getConfiguredMetaAppId() };
});

// Exchanges the OAuth `code` for an access_token, fetches the IG account
// info, and persists the connection in `instagram_accounts`.
export const connectInstagramAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        code: z.string().min(1).max(2000),
        redirectUri: z.string().url().max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const appId = getConfiguredMetaAppId();
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error("Meta App credentials não configuradas no servidor.");
    }

    // 1. Trocar code por short-lived access token (Facebook Login)
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
    const tokenJson = (await tokenRes.json()) as {
      access_token: string;
      expires_in?: number;
    };

    let accessToken = tokenJson.access_token;
    let expiresIn = tokenJson.expires_in ?? 0;

    // 2. Trocar por long-lived token (60 dias)
    try {
      const llUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
      llUrl.searchParams.set("grant_type", "fb_exchange_token");
      llUrl.searchParams.set("client_id", appId);
      llUrl.searchParams.set("client_secret", appSecret);
      llUrl.searchParams.set("fb_exchange_token", accessToken);
      const llRes = await fetch(llUrl.toString());
      if (llRes.ok) {
        const llJson = (await llRes.json()) as { access_token: string; expires_in?: number };
        accessToken = llJson.access_token;
        expiresIn = llJson.expires_in ?? expiresIn;
      }
    } catch (e) {
      console.warn("Long-lived token exchange skipped:", e);
    }

    // 3. Buscar Pages do usuário → instagram_business_account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!pagesRes.ok) {
      const err = await pagesRes.text();
      console.error("Pages fetch failed:", err);
      throw new Error("Não foi possível buscar as páginas conectadas.");
    }
    const pagesJson = (await pagesRes.json()) as {
      data: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: { id: string; username: string };
      }>;
    };

    console.log("[Meta API] /me/accounts raw response:", JSON.stringify(pagesJson, null, 2));

    const pageWithIg = pagesJson.data.find((p) => p.instagram_business_account);
    if (!pageWithIg || !pageWithIg.instagram_business_account) {
      const pageDetails = pagesJson.data
        .map((p) => `Página "${p.name}" (ID: ${p.id}) -> IG Vinculado: ${p.instagram_business_account ? `@${p.instagram_business_account.username}` : "NENHUM"}`)
        .join(" | ");
      
      const errorMsg = pagesJson.data.length === 0
        ? "Nenhuma página do Facebook foi retornada pelo Meta para esta conta. Verifique se você selecionou a Página na tela de permissões do Facebook."
        : `Nenhuma conta Instagram Business encontrada vinculada às suas páginas. Páginas encontradas: [ ${pageDetails} ]. Conecte uma conta IG profissional (Business ou Creator) à sua Página do Facebook nas configurações da Página.`;
        
      throw new Error(errorMsg);
    }

    const ig = pageWithIg.instagram_business_account;
    // Para publicar Reels usamos o Page Access Token (longa duração).
    const pageAccessToken = pageWithIg.access_token;

    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { supabase, userId } = context;
    const { error } = await supabase.from("instagram_accounts").upsert(
      {
        user_id: userId,
        instagram_user_id: ig.id,
        username: ig.username,
        access_token: pageAccessToken,
        token_expires_at: expiresAt,
      },
      { onConflict: "user_id,instagram_user_id" } as never,
    );
    if (error) {
      // Fallback: insert simples se não houver unique constraint
      const { error: insErr } = await supabase.from("instagram_accounts").insert({
        user_id: userId,
        instagram_user_id: ig.id,
        username: ig.username,
        access_token: pageAccessToken,
        token_expires_at: expiresAt,
      });
      if (insErr) throw new Error(insErr.message);
    }

    return { username: ig.username, instagramUserId: ig.id };
  });
