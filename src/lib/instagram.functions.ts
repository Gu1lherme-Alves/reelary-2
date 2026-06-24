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
    const tokenParams = new URLSearchParams();
    tokenParams.set("client_id", appId);
    tokenParams.set("client_secret", appSecret);
    tokenParams.set("grant_type", "authorization_code");
    tokenParams.set("redirect_uri", data.redirectUri);
    tokenParams.set("code", data.code);

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenParams,
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Short-lived token exchange failed:", err);
      throw new Error("Falha na troca do código por token. Verifique as permissões ou redirect URI no app Meta.");
    }
    const tokenJson = (await tokenRes.json()) as {
      access_token: string;
      user_id: string | number;
    };

    let accessToken = tokenJson.access_token;
    let expiresIn = 0;

    // 2. Trocar por long-lived token (60 dias)
    try {
      const llUrl = new URL("https://graph.instagram.com/access_token");
      llUrl.searchParams.set("grant_type", "ig_exchange_token");
      llUrl.searchParams.set("client_secret", appSecret);
      llUrl.searchParams.set("access_token", accessToken);
      const llRes = await fetch(llUrl.toString());
      if (llRes.ok) {
        const llJson = (await llRes.json()) as { access_token: string; expires_in?: number };
        accessToken = llJson.access_token;
        expiresIn = llJson.expires_in ?? 0;
      } else {
        const err = await llRes.text();
        console.error("Long-lived token exchange failed:", err);
        throw new Error("Falha ao obter token de longa duração.");
      }
    } catch (e: any) {
      console.error("Long-lived token exchange failed:", e);
      throw new Error("Falha ao obter token de longa duração: " + (e?.message ?? e));
    }

    // 3. Buscar profile do usuário para obter o username e instagram_user_id
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!meRes.ok) {
      const err = await meRes.text();
      console.error("Instagram profile fetch failed:", err);
      throw new Error("Não foi possível buscar as informações de perfil do Instagram.");
    }
    const meJson = (await meRes.json()) as {
      id: string;
      username: string;
    };

    const instagramUserId = meJson.id;
    const username = meJson.username;
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { supabase, userId } = context;
    const { error } = await supabase.from("instagram_accounts").upsert(
      {
        user_id: userId,
        instagram_user_id: instagramUserId,
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
        instagram_user_id: instagramUserId,
        username: username,
        access_token: accessToken,
        token_expires_at: expiresAt,
      });
      if (insErr) throw new Error(insErr.message);
    }

    return { username, instagramUserId };
  });
