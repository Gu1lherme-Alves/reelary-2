import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import http from "node:http";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface UserProxySettings {
  proxy_host: string;
  proxy_username: string;
  proxy_password: string;
  proxy_port_start: number;
  proxy_port_end: number;
  proxy_enabled: boolean;
}

export interface ProxyAccountItem {
  id: string;
  username: string;
  profile_picture_url: string | null;
  proxy_port: number | null;
  token_invalid: boolean;
  created_at: string;
}

// ─── Buscar configurações de proxy do usuário atual ───────────────────────────
export const getUserProxySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("user_settings")
      .select("proxy_host, proxy_username, proxy_password, proxy_port_start, proxy_port_end, proxy_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar configurações de proxy do usuário:", error);
    }

    return {
      proxy_host: data?.proxy_host || "sv2.allanproxys.com",
      proxy_username: data?.proxy_username || "",
      proxy_password: data?.proxy_password || "",
      proxy_port_start: data?.proxy_port_start ?? 11000,
      proxy_port_end: data?.proxy_port_end ?? 15000,
      proxy_enabled: data?.proxy_enabled ?? true,
      hasCustomProxy: Boolean(data?.proxy_username && data?.proxy_password),
    };
  });

// ─── Salvar configurações de proxy do usuário ─────────────────────────────────
export const saveUserProxySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        proxy_host: z.string().min(1).max(255),
        proxy_username: z.string().max(255),
        proxy_password: z.string().max(255),
        proxy_port_start: z.number().int().min(1000).max(65535).default(11000),
        proxy_port_end: z.number().int().min(1000).max(65535).default(15000),
        proxy_enabled: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { supabase, userId } = context;

    const payload = {
      user_id: userId,
      proxy_host: input.proxy_host.trim(),
      proxy_username: input.proxy_username.trim(),
      proxy_password: input.proxy_password.trim(),
      proxy_port_start: input.proxy_port_start,
      proxy_port_end: input.proxy_port_end,
      proxy_enabled: input.proxy_enabled,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("Erro ao salvar configurações de proxy:", error);
      throw new Error("Erro ao salvar configurações: " + error.message);
    }

    return { success: true };
  });

// ─── Testar conexão de uma porta do proxy em tempo real ───────────────────────
export const testProxyConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        host: z.string().min(1).default("sv2.allanproxys.com"),
        username: z.string().min(1),
        password: z.string().min(1),
        port: z.number().int().min(1).max(65535).default(11000),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    const { host, username, password, port } = input;
    const startTime = Date.now();

    return new Promise<{
      ok: boolean;
      ip?: string;
      latencyMs?: number;
      statusCode?: number;
      error?: string;
    }>((resolve) => {
      const auth = Buffer.from(`${username}:${password}`).toString("base64");

      const req = http.get(
        {
          host,
          port,
          path: "http://api.ipify.org?format=json",
          headers: {
            Host: "api.ipify.org",
            "Proxy-Authorization": `Basic ${auth}`,
            "User-Agent": "ReelaryProxyTester/1.0",
          },
          timeout: 4500,
        },
        (res) => {
          let rawData = "";
          res.on("data", (chunk) => {
            rawData += chunk;
          });

          res.on("end", () => {
            const latencyMs = Date.now() - startTime;
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(rawData);
                resolve({
                  ok: true,
                  ip: parsed.ip || rawData.trim(),
                  latencyMs,
                  statusCode: res.statusCode,
                });
              } catch (_) {
                resolve({
                  ok: true,
                  ip: rawData.trim(),
                  latencyMs,
                  statusCode: res.statusCode,
                });
              }
            } else if (res.statusCode === 407) {
              resolve({
                ok: false,
                statusCode: 407,
                error: "Falha de autenticação no proxy (Usuário ou senha incorretos).",
              });
            } else if (res.statusCode === 402 || res.statusCode === 429) {
              resolve({
                ok: false,
                statusCode: res.statusCode,
                error: "Franquia de dados do proxy esgotada ou limite atingido.",
              });
            } else {
              resolve({
                ok: false,
                statusCode: res.statusCode,
                error: `Proxy retornou status HTTP ${res.statusCode}: ${rawData.slice(0, 100)}`,
              });
            }
          });
        },
      );

      req.on("error", (err: any) => {
        resolve({
          ok: false,
          error: `Erro ao conectar com ${host}:${port} — ${err.message}`,
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          ok: false,
          error: `Timeout: A porta ${port} não respondeu em 4.5 segundos.`,
        });
      });
    });
  });

// ─── Buscar contas do usuário com suas respectivas portas ─────────────────────
export const getUserAccountsWithPorts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("instagram_accounts")
      .select("id, username, profile_picture_url, proxy_port, token_invalid, created_at")
      .eq("user_id", userId)
      .order("proxy_port", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Erro ao buscar contas e portas:", error);
      throw new Error(error.message);
    }

    return (data || []) as ProxyAccountItem[];
  });

// ─── Reatribuir / Atualizar porta de uma conta específica ─────────────────────
export const updateAccountProxyPort = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        accountId: z.string().uuid(),
        newPort: z.number().int().min(1000).max(65535),
      })
      .parse(input),
  )
  .handler(async ({ data: input, context }) => {
    const { supabase, userId } = context;

    // Garante que a conta pertence ao usuário
    const { data: acc } = await supabase
      .from("instagram_accounts")
      .select("id")
      .eq("id", input.accountId)
      .eq("user_id", userId)
      .single();

    if (!acc) {
      throw new Error("Conta não encontrada ou sem permissão.");
    }

    const { error } = await supabase
      .from("instagram_accounts")
      .update({ proxy_port: input.newPort })
      .eq("id", input.accountId)
      .eq("user_id", userId);

    if (error) {
      if (error.code === "23505") {
        throw new Error(`A porta ${input.newPort} já está em uso por outra conta sua.`);
      }
      throw new Error(error.message);
    }

    return { success: true };
  });
