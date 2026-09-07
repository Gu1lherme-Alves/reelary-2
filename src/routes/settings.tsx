import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Shield, User, Loader2, Key } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getAvailableMetaAppIds } from "@/lib/instagram.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — Reelary" }] }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

type ProfileType = "guilherme" | "matheus" | "pedro" | "antonio" | "greg" | "esperanca";

interface ProfileConfig {
  id: ProfileType;
  title: string;
  description: string;
  badge?: string;
  badgeStyle?: string;
  iconBg: string;
  iconColor: string;
}

const PROFILES: ProfileConfig[] = [
  {
    id: "guilherme",
    title: "Guilherme",
    description: "Configuração padrão do projeto utilizando as credenciais principais da Meta do Guilherme.",
    badge: "Padrão",
    badgeStyle: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    iconBg: "bg-amber-500/10 border border-amber-500/20",
    iconColor: "text-amber-500",
  },
  {
    id: "matheus",
    title: "Matheus",
    description: "Configuração secundária utilizando as credenciais da Meta do Matheus para testes ou produção própria.",
    iconBg: "bg-blue-500/10 border border-blue-500/20",
    iconColor: "text-blue-500",
  },
  {
    id: "pedro",
    title: "Pedro",
    description: "Configuração utilizando as credenciais da Meta do Pedro.",
    iconBg: "bg-violet-500/10 border border-violet-500/20",
    iconColor: "text-violet-500",
  },
  {
    id: "antonio",
    title: "Antonio",
    description: "Configuração utilizando as credenciais da Meta do Antonio.",
    iconBg: "bg-sky-500/10 border border-sky-500/20",
    iconColor: "text-sky-500",
  },
  {
    id: "greg",
    title: "Greg",
    description: "Configuração utilizando as credenciais da Meta do Greg.",
    iconBg: "bg-teal-500/10 border border-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    id: "esperanca",
    title: "Esperança",
    description: "Configuração utilizando as credenciais da Meta de Esperança.",
    badge: "Novo",
    badgeStyle: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    iconBg: "bg-rose-500/10 border border-rose-500/20",
    iconColor: "text-rose-500",
  },
];

function SettingsPage() {
  const [profile, setProfile] = useState<ProfileType>("guilherme");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appIds, setAppIds] = useState<Record<ProfileType, string | null>>({
    guilherme: null,
    matheus: null,
    pedro: null,
    antonio: null,
    greg: null,
    esperanca: null,
  });

  const fetchAppIds = useServerFn(getAvailableMetaAppIds);

  async function loadSettings() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("meta_credential_profile")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.meta_credential_profile) {
        setProfile(data.meta_credential_profile as ProfileType);
      }

      const ids = await fetchAppIds();
      setAppIds(ids as any);
    } catch (err: any) {
      console.error("Erro ao carregar configurações:", err);
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave(selectedProfile: ProfileType) {
    if (selectedProfile === profile) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          meta_credential_profile: selectedProfile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" } as any,
      );

      if (error) throw error;
      setProfile(selectedProfile);
      const profileNames: Record<ProfileType, string> = {
        guilherme: "Guilherme",
        matheus: "Matheus",
        pedro: "Pedro",
        antonio: "Antonio",
        greg: "Greg",
        esperanca: "Esperança",
      };
      toast.success(`Perfil de credenciais "${profileNames[selectedProfile]}" selecionado!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando configurações de credenciais…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as credenciais da Meta Developers para conexões do Instagram
        </p>
      </div>

      <div className="space-y-6">
        {/* Escolha do Perfil */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-7 shadow-card">
          <div className="flex items-start gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center shrink-0 mt-0.5">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Selecione o Painel da Meta Developers
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Escolha qual aplicativo de desenvolvedor da Meta será responsável pelo fluxo de login e
                conexão do Instagram.
              </p>
            </div>
          </div>

          {/* Cards Horizontais */}
          <div className="flex flex-col gap-3">
            {PROFILES.map((item) => {
              const isSelected = profile === item.id;
              const appIdValue = appIds[item.id];
              const isConfigured = Boolean(appIdValue);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSave(item.id)}
                  disabled={saving}
                  className={`w-full text-left rounded-2xl border p-4 sm:p-4.5 transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? "border-primary/80 bg-primary/10 shadow-glow ring-1 ring-primary/40"
                      : "border-border/60 bg-secondary/15 hover:bg-secondary/40 hover:border-border-hover"
                  }`}
                >
                  {/* Lado Esquerdo: Ícone + Título + Descrição */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Avatar / Ícone */}
                    <div
                      className={`size-11 rounded-xl ${item.iconBg} grid place-items-center shrink-0 transition-transform duration-300 group-hover:scale-105`}
                    >
                      <User className={`size-5 ${item.iconColor}`} />
                    </div>

                    {/* Dados do Perfil */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-bold text-base text-foreground tracking-tight">
                          Painel: {item.title}
                        </h3>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${item.badgeStyle}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 sm:line-clamp-2">
                        {item.description}
                      </p>

                      {/* App ID visível no mobile */}
                      <div className="sm:hidden mt-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded bg-background/80 border border-border/50 inline-block ${
                            !isConfigured ? "text-warning" : "text-muted-foreground"
                          }`}
                        >
                          App ID: {appIdValue || "Pendente no .env"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: App ID no Desktop + Badge de Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background/60 border border-border/50">
                      <Key className="size-3 text-muted-foreground" />
                      <span
                        className={`text-xs font-mono ${
                          !isConfigured ? "text-warning" : "text-muted-foreground"
                        }`}
                      >
                        {isConfigured ? `App ID: ${appIdValue}` : "Configuração pendente"}
                      </span>
                    </div>

                    {/* Status Ativo ou Indicador de Seleção */}
                    {isSelected ? (
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-success/20 text-success border border-success/30 font-bold text-xs shadow-sm">
                        <Check className="size-3.5 stroke-[3]" />
                        <span>ATIVO</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors px-2 py-1">
                        <span className="text-xs hidden sm:inline">Selecionar</span>
                        <div className="size-5 rounded-full border border-border/80 group-hover:border-primary/60 flex items-center justify-center transition-colors">
                          <div className="size-2 rounded-full bg-transparent group-hover:bg-primary/60 transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
