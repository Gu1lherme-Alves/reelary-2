import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Shield,
  User,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Save,
  CheckCircle2,
  Code2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  getAvailableMetaAppIds,
  saveCustomMetaCredentials,
  getUserCustomMetaSettings,
} from "@/lib/instagram.functions";
import { toast } from "sonner";
import { INSTAGRAM_REDIRECT_PATH, FACEBOOK_REDIRECT_PATH } from "@/lib/instagram";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — Reelary" }] }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

type ProfileType = "custom" | "guilherme" | "matheus" | "pedro" | "antonio" | "greg" | "esperanca";

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
    id: "custom",
    title: "Meu App Personalizado",
    description:
      "Aplicativo próprio configurado por você através do painel. Utiliza seu App ID e Chave Secreta da API personalizados.",
    badge: "Seu App",
    badgeStyle: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    iconBg: "bg-emerald-500/10 border border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
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
    badge: "Equipe",
    badgeStyle: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    iconBg: "bg-rose-500/10 border border-rose-500/20",
    iconColor: "text-rose-500",
  },
];

function SettingsPage() {
  const [profile, setProfile] = useState<ProfileType>("guilherme");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);

  // Form custom credentials
  const [customAppId, setCustomAppId] = useState("");
  const [customAppSecret, setCustomAppSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [hasCustomSaved, setHasCustomSaved] = useState(false);

  const [appIds, setAppIds] = useState<Record<ProfileType, string | null>>({
    custom: null,
    guilherme: null,
    matheus: null,
    pedro: null,
    antonio: null,
    greg: null,
    esperanca: null,
  });

  const fetchAppIds = useServerFn(getAvailableMetaAppIds);
  const fetchCustomSettings = useServerFn(getUserCustomMetaSettings);
  const saveCustomFn = useServerFn(saveCustomMetaCredentials);

  const originUrl = typeof window !== "undefined" ? window.location.origin : "";
  const igRedirectUri = `${originUrl}${INSTAGRAM_REDIRECT_PATH}`;
  const fbRedirectUri = `${originUrl}${FACEBOOK_REDIRECT_PATH}`;

  async function loadSettings() {
    try {
      const [customData, ids] = await Promise.all([
        fetchCustomSettings(),
        fetchAppIds(),
      ]);

      if (customData) {
        if (customData.profile) {
          setProfile(customData.profile as ProfileType);
        }
        if (customData.customAppId) {
          setCustomAppId(customData.customAppId);
        }
        if (customData.customAppSecret) {
          setCustomAppSecret(customData.customAppSecret);
        }
        setHasCustomSaved(Boolean(customData.hasCustomCredentials));
      }

      setAppIds(ids as any);
    } catch (err: any) {
      console.error("Erro ao carregar configurações:", err);
      toast.error("Erro ao carregar configurações de credenciais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSaveCustomCredentials(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const cleanedId = customAppId.replace(/\D/g, "").trim();
    const cleanedSecret = customAppSecret.trim();

    if (!cleanedId) {
      toast.error("Por favor, informe um Meta App ID válido (apenas números).");
      return;
    }

    if (!cleanedSecret) {
      toast.error("Por favor, informe a Chave API (App Secret) da Meta.");
      return;
    }

    setSavingCustom(true);
    try {
      const res = await saveCustomFn({
        data: {
          appId: cleanedId,
          appSecret: cleanedSecret,
          setActive: true,
        },
      });

      if (res?.success) {
        setProfile("custom");
        setHasCustomSaved(true);
        setAppIds((prev) => ({
          ...prev,
          custom: cleanedId,
        }));
        toast.success(
          "Credenciais da Meta salvas com sucesso! Atualizadas nas variáveis de ambiente e ativadas no seu perfil.",
        );
      }
    } catch (err: any) {
      console.error("Erro ao salvar credenciais da Meta:", err);
      toast.error(err.message || "Erro ao salvar credenciais personalizadas.");
    } finally {
      setSavingCustom(false);
    }
  }

  async function handleSelectProfile(selectedProfile: ProfileType) {
    if (selectedProfile === profile) return;

    if (selectedProfile === "custom" && !customAppId && !appIds.custom) {
      toast.info(
        "Preencha seu App ID e Chave API no formulário acima para ativar seu App Personalizado.",
      );
      return;
    }

    setSavingProfile(true);
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
        custom: "Meu App Personalizado",
        guilherme: "Guilherme",
        matheus: "Matheus",
        pedro: "Pedro",
        antonio: "Antonio",
        greg: "Greg",
        esperanca: "Esperança",
      };
      toast.success(`Painel da Meta "${profileNames[selectedProfile]}" ativado!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copiado para a área de transferência!`);
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
    <div className="max-w-4xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as credenciais da Meta Developers para login e conexões do Instagram
        </p>
      </div>

      <div className="space-y-8">
        {/* Bloco 1: Inserir ID e Chave API Personalizados */}
        <div className="rounded-2xl border border-primary/30 bg-card p-6 md:p-7 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
            <div className="flex items-start gap-3">
              <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center shrink-0 mt-0.5">
                <Code2 className="size-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground">
                    Seu Próprio Meta Developers (App ID e Chave API)
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border bg-primary/15 text-primary border-primary/30">
                    Personalizado
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Insira o seu <strong>Meta App ID</strong> e a <strong>Chave API (App Secret)</strong> gerados no portal{" "}
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Meta for Developers <ExternalLink className="size-3 inline" />
                  </a>
                  . Os valores são salvos no seu perfil e atualizados nas variáveis de ambiente.
                </p>
              </div>
            </div>

            {profile === "custom" && (
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                <CheckCircle2 className="size-3.5" />
                <span>EM USO ATUALMENTE</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveCustomCredentials} className="space-y-5 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Campo Meta App ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Meta App ID (Client ID)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Apenas números</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Key className="size-4" />
                  </div>
                  <input
                    type="text"
                    value={customAppId}
                    onChange={(e) => setCustomAppId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 1919721542062088"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border/70 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Localizado no topo do seu painel no Meta Developers ou em Configurações &gt; Básico.
                </p>
              </div>

              {/* Campo Chave API / App Secret */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Chave API (Meta App Secret)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Chave secreta</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Shield className="size-4" />
                  </div>
                  <input
                    type={showSecret ? "text" : "password"}
                    value={customAppSecret}
                    onChange={(e) => setCustomAppSecret(e.target.value)}
                    placeholder="Ex: 714a96aa24fc2baa717ea62146c1a8b4"
                    className="w-full pl-10 pr-10 py-2.5 bg-secondary/30 border border-border/70 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title={showSecret ? "Ocultar chave" : "Mostrar chave"}
                  >
                    {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Encontrado em <em>Configurações do App &gt; Básico &gt; Chave Secreta do Aplicativo</em>.
                </p>
              </div>
            </div>

            {/* URIs de Redirecionamento (Redirect URIs) para configurar no Meta Developers */}
            <div className="rounded-xl border border-border/50 bg-secondary/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">
                  URIs de Redirecionamento OAuth (Obrigatório configurar no seu Meta App):
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                No portal da Meta, adicione os produtos <strong>Instagram Login</strong> e{" "}
                <strong>Facebook Login</strong> e cadastre exatamente as URLs abaixo no campo{" "}
                <em>URIs de redirecionamento do OAuth válidos</em>:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 p-2 bg-background/80 rounded-lg border border-border/50 text-xs font-mono">
                  <span className="truncate text-foreground/90">{igRedirectUri}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(igRedirectUri, "URI do Instagram")}
                    className="p-1 text-muted-foreground hover:text-primary transition shrink-0"
                    title="Copiar URL"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 bg-background/80 rounded-lg border border-border/50 text-xs font-mono">
                  <span className="truncate text-foreground/90">{fbRedirectUri}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(fbRedirectUri, "URI do Facebook")}
                    className="p-1 text-muted-foreground hover:text-primary transition shrink-0"
                    title="Copiar URL"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Salvar atualiza o banco de dados e as variáveis no arquivo .env e em memória.</span>
              </div>

              <button
                type="submit"
                disabled={savingCustom}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {savingCustom ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Salvando Credenciais…</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Salvar e Ativar Meu App</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bloco 2: Seleção de Perfis Existentes / Alternância */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-7 shadow-card">
          <div className="flex items-start gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center shrink-0 mt-0.5">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Alternar Painel Ativo da Meta Developers
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Você pode alternar a qualquer momento entre seu aplicativo próprio personalizado ou um dos
                perfis pré-configurados.
              </p>
            </div>
          </div>

          {/* Cards Horizontais */}
          <div className="flex flex-col gap-3">
            {PROFILES.map((item) => {
              const isSelected = profile === item.id;
              const appIdValue = appIds[item.id] || (item.id === "custom" ? customAppId : null);
              const isConfigured = Boolean(appIdValue);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectProfile(item.id)}
                  disabled={savingProfile}
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
                          App ID: {appIdValue || "Não configurado"}
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
