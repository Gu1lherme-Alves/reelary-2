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

    // 1. Trocar code por short-lived access token (Instagram Login)
    const tokenBody = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: data.redirectUri,
      code: data.code,
    });

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody,
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      throw new Error(`Falha na troca do código por token: ${err}`);
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token: string;
      user_id: number | string;
    };

    const shortLivedToken = tokenJson.access_token;
    const initialUserId = String(tokenJson.user_id);

    // 2. Trocar por long-lived token (60 dias)
    let accessToken = shortLivedToken;
    let expiresIn = 0;

    try {
      const llUrl = new URL("https://graph.instagram.com/access_token");
      llUrl.searchParams.set("grant_type", "ig_exchange_token");
      llUrl.searchParams.set("client_secret", appSecret);
      llUrl.searchParams.set("access_token", shortLivedToken);

      const llRes = await fetch(llUrl.toString());
      if (!llRes.ok) {
        const err = await llRes.text();
        console.error("Long-lived token exchange failed:", err);
        throw new Error(`Erro na API do Instagram ao gerar token de longa duração: ${err}`);
      }
      const llJson = (await llRes.json()) as { access_token: string; expires_in?: number };
      accessToken = llJson.access_token;
      expiresIn = llJson.expires_in ?? 0;
    } catch (e: any) {
      console.error("Long-lived token exchange failed:", e);
      throw new Error(e.message || "Falha ao gerar token de longa duração.");
    }

    // 3. Buscar informações do perfil do usuário no Instagram (username e ID definitivo)
    const profileUrl = new URL("https://graph.instagram.com/me");
    profileUrl.searchParams.set("fields", "id,username");
    profileUrl.searchParams.set("access_token", accessToken);

    const profileRes = await fetch(profileUrl.toString());
    if (!profileRes.ok) {
      const err = await profileRes.text();
      console.error("Profile fetch failed:", err);
      throw new Error(`Não foi possível buscar as informações do perfil do Instagram: ${err}`);
    }

    const profileJson = (await profileRes.json()) as {
      id: string;
      username: string;
    };

    const igUserId = profileJson.id || initialUserId;
    const username = profileJson.username;

    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { supabase, userId } = context;
    const { error } = await supabase.from("instagram_accounts").upsert(
      {
        user_id: userId,
        instagram_user_id: igUserId,
        username: username,
        access_token: accessToken,
        token_expires_at: expiresAt,
      },
      { onConflict: "user_id,instagram_user_id" } as never,
    );
    if (error) {
      // Fallback: insert simples se não houver unique constraint
      const { error: insErr } = await supabase.from("instagram_accounts").insert({
        user_id: userId,
        instagram_user_id: igUserId,
        username: username,
        access_token: accessToken,
        token_expires_at: expiresAt,
      });
      if (insErr) throw new Error(insErr.message);
    }

    return { username, instagramUserId: igUserId };
  });
