import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export function updateEnvFile(updates: Record<string, string>) {
  // 1. Atualizar em memória imediatamente para o processo Node atual
  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
  }

  // 2. Persistir no arquivo .env se acessível no ambiente
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    let lines = content ? content.split(/\r?\n/) : [];
    const handledKeys = new Set<string>();

    lines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) return line;

      const key = line.slice(0, eqIdx).trim();
      if (key in updates) {
        handledKeys.add(key);
        return `${key}="${updates[key]}"`;
      }
      return line;
    });

    for (const [key, value] of Object.entries(updates)) {
      if (!handledKeys.has(key)) {
        lines.push(`${key}="${value}"`);
      }
    }

    fs.writeFileSync(envPath, lines.join("\n"), "utf-8");
  } catch (err) {
    console.warn("Não foi possível persistir no arquivo .env em disco:", err);
  }
}

export async function getMetaCredentialsForUser(supabase: any, userId: string) {
  // Query user settings
  const { data, error } = await supabase
    .from("user_settings")
    .select("meta_credential_profile, custom_meta_app_id, custom_meta_app_secret")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar configurações de credenciais da Meta:", error);
  }

  const profile = data?.meta_credential_profile || "guilherme";

  let appId = "";
  let appSecret = "";

  if (profile === "custom") {
    appId =
      data?.custom_meta_app_id ||
      process.env.META_APP_ID_CUSTOM ||
      process.env.META_APP_ID ||
      "";
    appSecret =
      data?.custom_meta_app_secret ||
      process.env.META_APP_SECRET_CUSTOM ||
      process.env.META_APP_SECRET ||
      "";
  } else if (profile === "matheus") {
    appId = process.env.META_APP_ID_MATHEUS || "";
    appSecret = process.env.META_APP_SECRET_MATHEUS || "";
  } else if (profile === "pedro") {
    appId = process.env.META_APP_ID_PEDRO || "";
    appSecret = process.env.META_APP_SECRET_PEDRO || "";
  } else if (profile === "antonio") {
    appId = process.env.META_APP_ID_ANTONIO || "";
    appSecret = process.env.META_APP_SECRET_ANTONIO || "";
  } else if (profile === "greg") {
    appId = process.env.META_APP_ID_GREG || "";
    appSecret = process.env.META_APP_SECRET_GREG || "";
  } else if (profile === "esperanca") {
    appId = process.env.META_APP_ID_ESPERANCA || "";
    appSecret = process.env.META_APP_SECRET_ESPERANCA || "";
  } else {
    // default/guilherme
    appId =
      process.env.META_APP_ID_GUILHERME ||
      process.env.META_APP_ID ||
      import.meta.env.VITE_META_APP_ID ||
      "";
    appSecret = process.env.META_APP_SECRET_GUILHERME || process.env.META_APP_SECRET || "";
  }

  // Clean the app ID
  const cleanedAppId = appId?.toString()?.match(/\d+/)?.[0] ?? null;

  return { appId: cleanedAppId, appSecret, profile };
}

// Returns the public Meta App ID and profile so the client can build the OAuth URL.
export const getMetaAppId = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { appId, profile } = await getMetaCredentialsForUser(supabase, userId);
    return { appId, profile };
  });

// ─── Método 1 (Instagram Login direto) ──────────────────────────────────────────
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
    const { supabase, userId } = context;
    const { appId, appSecret } = await getMetaCredentialsForUser(supabase, userId);
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
      throw new Error(
        "Falha na troca do código por token. Verifique as permissões ou redirect URI no app Meta.",
      );
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

    // 3. Buscar profile do usuário para obter o username, instagram_user_id e foto de perfil
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!meRes.ok) {
      const err = await meRes.text();
      console.error("Instagram profile fetch failed:", err);
      throw new Error("Não foi possível buscar as informações de perfil do Instagram.");
    }
    const meJson = (await meRes.json()) as {
      id: string;
      username: string;
      profile_picture_url?: string;
    };

    const instagramUserId = meJson.id;
    const username = meJson.username;
    const profilePictureUrl = meJson.profile_picture_url || null;
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { error } = await supabase.from("instagram_accounts").upsert(
      {
        user_id: userId,
        instagram_user_id: instagramUserId,
        username: username,
        profile_picture_url: profilePictureUrl,
        access_token: accessToken,
        token_expires_at: expiresAt,
        token_invalid: false,
      },
      { onConflict: "user_id,instagram_user_id" } as never,
    );
    if (error) {
      // Fallback: insert simples se não houver unique constraint
      const { error: insErr } = await supabase.from("instagram_accounts").insert({
        user_id: userId,
        instagram_user_id: instagramUserId,
        username: username,
        profile_picture_url: profilePictureUrl,
        access_token: accessToken,
        token_expires_at: expiresAt,
        token_invalid: false,
      });
      if (insErr) throw new Error(insErr.message);
    }

    return { username, instagramUserId };
  });

// ─── Método 2 (Facebook Login → IG Business via Page) ───────────────────────────
// Exchanges Facebook OAuth `code` for access_token, finds the user's Facebook
// Page, resolves the linked Instagram Business account, and persists it.
export const connectFacebookAccount = createServerFn({ method: "POST" })
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
    const { supabase, userId } = context;
    const { appId, appSecret } = await getMetaCredentialsForUser(supabase, userId);
    if (!appId || !appSecret) {
      throw new Error("Meta App credentials não configuradas no servidor.");
    }

    // 1. Trocar code por access_token via Facebook Graph API
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", data.redirectUri);
    tokenUrl.searchParams.set("code", data.code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Facebook token exchange failed:", err);
      throw new Error("Falha na troca do código Facebook por token.");
    }
    const tokenJson = (await tokenRes.json()) as {
      access_token: string;
      token_type: string;
      expires_in?: number;
    };

    const userAccessToken = tokenJson.access_token;
    const userExpiresIn = tokenJson.expires_in ?? 0;

    // 2. Trocar por long-lived user token
    let longLivedUserToken = userAccessToken;
    let longLivedExpiresIn = userExpiresIn;
    try {
      const llUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
      llUrl.searchParams.set("grant_type", "fb_exchange_token");
      llUrl.searchParams.set("client_id", appId);
      llUrl.searchParams.set("client_secret", appSecret);
      llUrl.searchParams.set("fb_exchange_token", userAccessToken);
      const llRes = await fetch(llUrl.toString());
      if (llRes.ok) {
        const llJson = (await llRes.json()) as { access_token: string; expires_in?: number };
        longLivedUserToken = llJson.access_token;
        longLivedExpiresIn = llJson.expires_in ?? 5184000; // default 60 days
      } else {
        console.warn("Long-lived user token exchange failed, using short-lived token.");
      }
    } catch (e) {
      console.warn("Long-lived user token exchange error:", e);
    }

    // 3. Buscar as Páginas do Facebook do usuário
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(longLivedUserToken)}`,
    );
    if (!pagesRes.ok) {
      const err = await pagesRes.text();
      console.error("Facebook pages fetch failed:", err);
      throw new Error("Não foi possível buscar as Páginas do Facebook. Verifique as permissões.");
    }
    const pagesJson = (await pagesRes.json()) as {
      data: Array<{
        id: string;
        name: string;
        access_token: string;
        instagram_business_account?: { id: string };
      }>;
    };

    if (!pagesJson.data || pagesJson.data.length === 0) {
      throw new Error(
        "Nenhuma Página do Facebook encontrada. Crie uma Página e vincule ao Instagram Business.",
      );
    }

    // 4. Encontrar a primeira página com conta IG Business vinculada
    const pageWithIg = pagesJson.data.find((p) => p.instagram_business_account?.id);
    if (!pageWithIg || !pageWithIg.instagram_business_account) {
      throw new Error(
        "Nenhuma das suas Páginas do Facebook possui uma conta Instagram Business vinculada. " +
          "Vincule sua conta Instagram Business a uma Página do Facebook e tente novamente.",
      );
    }

    const pageAccessToken = pageWithIg.access_token; // Page token (EAA...), never expires while page exists
    const igBusinessId = pageWithIg.instagram_business_account.id;

    // 5. Buscar username e foto de perfil da conta IG Business
    const igRes = await fetch(
      `https://graph.facebook.com/v21.0/${igBusinessId}?fields=id,username,profile_picture_url&access_token=${encodeURIComponent(pageAccessToken)}`,
    );
    if (!igRes.ok) {
      const err = await igRes.text();
      console.error("IG Business account fetch failed:", err);
      throw new Error("Não foi possível buscar as informações da conta Instagram Business.");
    }
    const igJson = (await igRes.json()) as {
      id: string;
      username: string;
      profile_picture_url?: string;
    };

    const instagramUserId = igJson.id;
    const username = igJson.username;
    const profilePictureUrl = igJson.profile_picture_url || null;
    const expiresAt =
      longLivedExpiresIn > 0
        ? new Date(Date.now() + longLivedExpiresIn * 1000).toISOString()
        : null;

    // 6. Salvar na tabela instagram_accounts (usando o Page access token)
    const { error } = await supabase.from("instagram_accounts").upsert(
      {
        user_id: userId,
        instagram_user_id: instagramUserId,
        username: username,
        profile_picture_url: profilePictureUrl,
        access_token: pageAccessToken,
        token_expires_at: expiresAt,
        token_invalid: false,
      },
      { onConflict: "user_id,instagram_user_id" } as never,
    );
    if (error) {
      // Fallback: insert simples
      const { error: insErr } = await supabase.from("instagram_accounts").insert({
        user_id: userId,
        instagram_user_id: instagramUserId,
        username: username,
        profile_picture_url: profilePictureUrl,
        access_token: pageAccessToken,
        token_expires_at: expiresAt,
        token_invalid: false,
      });
      if (insErr) throw new Error(insErr.message);
    }

    return { username, instagramUserId };
  });

export const saveCustomMetaCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        appId: z.string().trim().min(4, "Meta App ID inválido (deve conter pelo menos 4 dígitos)"),
        appSecret: z.string().trim().min(8, "Chave API / App Secret inválida"),
        setActive: z.boolean().optional().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cleanedAppId = data.appId.replace(/\D/g, "");
    const cleanedSecret = data.appSecret.trim();

    if (!cleanedAppId) {
      throw new Error("O Meta App ID deve conter números válidos.");
    }

    // 1. Atualizar no banco de dados na tabela user_settings
    const updatePayload: any = {
      user_id: userId,
      custom_meta_app_id: cleanedAppId,
      custom_meta_app_secret: cleanedSecret,
      updated_at: new Date().toISOString(),
    };

    if (data.setActive) {
      updatePayload.meta_credential_profile = "custom";
    }

    const { error: dbError } = await supabase
      .from("user_settings")
      .upsert(updatePayload, { onConflict: "user_id" });

    if (dbError) {
      console.error("Erro ao salvar credenciais personalizadas no Supabase:", dbError);
      throw new Error("Erro ao salvar no banco de dados: " + dbError.message);
    }

    // 2. Atualizar no arquivo .env e em process.env
    try {
      updateEnvFile({
        VITE_META_APP_ID: cleanedAppId,
        META_APP_ID: cleanedAppId,
        META_APP_SECRET: cleanedSecret,
        META_APP_ID_CUSTOM: cleanedAppId,
        META_APP_SECRET_CUSTOM: cleanedSecret,
      });
    } catch (envError: any) {
      console.warn("Erro ao atualizar variáveis de ambiente (.env):", envError);
    }

    return {
      success: true,
      appId: cleanedAppId,
      profile: data.setActive ? "custom" : undefined,
    };
  });

export const getUserCustomMetaSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_settings")
      .select("meta_credential_profile, custom_meta_app_id, custom_meta_app_secret")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar configurações personalizadas da Meta:", error);
    }

    const customAppId =
      data?.custom_meta_app_id ||
      process.env.META_APP_ID_CUSTOM ||
      process.env.META_APP_ID ||
      "";
    const customAppSecret =
      data?.custom_meta_app_secret ||
      process.env.META_APP_SECRET_CUSTOM ||
      process.env.META_APP_SECRET ||
      "";

    return {
      profile: (data?.meta_credential_profile || "guilherme") as string,
      customAppId,
      customAppSecret,
      hasCustomCredentials: Boolean(customAppId && customAppSecret),
    };
  });

export const getAvailableMetaAppIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const rawGuilherme =
      process.env.META_APP_ID_GUILHERME ||
      process.env.META_APP_ID ||
      import.meta.env.VITE_META_APP_ID ||
      "";
    const rawMatheus = process.env.META_APP_ID_MATHEUS || "";
    const rawPedro = process.env.META_APP_ID_PEDRO || "";
    const rawAntonio = process.env.META_APP_ID_ANTONIO || "";
    const rawGreg = process.env.META_APP_ID_GREG || "";
    const rawEsperanca = process.env.META_APP_ID_ESPERANCA || "";
    const guilhermeAppId = rawGuilherme.match(/\d+/)?.[0] ?? null;
    const matheusAppId = rawMatheus.match(/\d+/)?.[0] ?? null;
    const pedroAppId = rawPedro.match(/\d+/)?.[0] ?? null;
    const antonioAppId = rawAntonio.match(/\d+/)?.[0] ?? null;
    const gregAppId = rawGreg.match(/\d+/)?.[0] ?? null;
    const esperancaAppId = rawEsperanca.match(/\d+/)?.[0] ?? null;

    let customAppId: string | null = null;
    try {
      const { data } = await supabase
        .from("user_settings")
        .select("custom_meta_app_id")
        .eq("user_id", userId)
        .maybeSingle();
      customAppId =
        data?.custom_meta_app_id?.match(/\d+/)?.[0] ||
        process.env.META_APP_ID_CUSTOM?.match(/\d+/)?.[0] ||
        null;
    } catch (_) {
      customAppId = process.env.META_APP_ID_CUSTOM?.match(/\d+/)?.[0] || null;
    }

    return {
      guilherme: guilhermeAppId,
      matheus: matheusAppId,
      pedro: pedroAppId,
      antonio: antonioAppId,
      greg: gregAppId,
      esperanca: esperancaAppId,
      custom: customAppId,
    };
  });
