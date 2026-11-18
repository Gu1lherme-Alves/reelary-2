import { createFileRoute, Link } from "@tanstack/react-router";
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
  BookOpen,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Globe,
  Info,
  CheckCheck,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "tutorial") return "tutorial";
    }
    return "credentials";
  });

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Meta</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as credenciais da Meta Developers para login e conexões automatizadas do Instagram
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-xl h-12 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger
            value="credentials"
            className="rounded-lg font-semibold text-xs sm:text-sm gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <Key className="size-4" />
            <span>Credenciais da Meta</span>
          </TabsTrigger>
          <TabsTrigger
            value="tutorial"
            className="rounded-lg font-semibold text-xs sm:text-sm gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-black transition-all relative"
          >
            <BookOpen className="size-4" />
            <span>Passo a Passo (Tutorial)</span>
            <span className="hidden md:inline-flex text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 uppercase font-black tracking-wider">
              Guia
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════════════
            ABA 1: CREDENCIAIS DA META
        ════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="credentials" className="space-y-8 mt-0 animate-in fade-in duration-200">
          {/* Card de Alerta/Atalho para o Tutorial */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 grid place-items-center shrink-0 text-amber-400">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">É a sua primeira vez configurando?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preparamos um guia passo a passo ilustrado ensinando a criar seu app na Meta, adicionar testadores e ativar a conexão em 1 clique.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("tutorial")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition shrink-0 cursor-pointer shadow-sm"
            >
              <span>Ver Passo a Passo</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>

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
                    Insira o seu <strong>ID do app do Instagram</strong> e a <strong>Chave secreta do app</strong> gerados no portal{" "}
                    <a
                      href="https://developers.facebook.com/apps/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Meta for Developers <ExternalLink className="size-3 inline" />
                    </a>
                    . Os valores são salvos com segurança para a sua conta.
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
                    <span>ID do App do Instagram (Client ID)</span>
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
                      placeholder="Ex: 984157640915216"
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border/70 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Encontrado em <em>Casos de uso &gt; API do Instagram</em> (ex: 984157640915216).
                  </p>
                </div>

                {/* Campo Chave API / App Secret */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Chave Secreta do App do Instagram</span>
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
                      placeholder="Ex: 3776224bab1473f194b6c8dea76f1e7d"
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
                    Encontrado ao clicar no botão <em>"Mostrar"</em> ao lado do ID do seu app do Instagram.
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
                  No portal da Meta, acesse <strong>Casos de uso &gt; API do Instagram &gt; Configurações do login da empresa</strong> e cadastre a URL abaixo no campo{" "}
                  <em>URIs de redirecionamento do OAuth válidos</em>:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2 bg-background/80 rounded-lg border border-border/50 text-xs font-mono">
                    <span className="truncate text-foreground/90 font-semibold">{igRedirectUri}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(igRedirectUri, "URI do Instagram")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition shrink-0 font-sans font-bold text-[11px]"
                      title="Copiar URL"
                    >
                      <Copy className="size-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Salvar ativa automaticamente o seu aplicativo próprio para conexões em 1 clique.</span>
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
                  Perfis Compartilhados Pré-Configurados
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Se você fizer parte de uma conta de equipe com painel já cadastrado pelo administrador, você pode selecionar um dos perfis prontos abaixo:
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
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════════
            ABA 2: PASSO A PASSO / TUTORIAL INTERATIVO
        ════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="tutorial" className="space-y-6 mt-0 animate-in fade-in duration-200">
          {/* Header do Guia */}
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary/30 p-6 md:p-8 shadow-card relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="size-3.5" /> Tutorial Completo
                </div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                  Como Configurar seu Meta App e Conectar em 1 Clique
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Siga este passo a passo simples. Você só precisa fazer isso <strong>uma única vez</strong>. Depois disso, todas as suas contas do Instagram serão conectadas instantaneamente com o botão azul "Permitir", sem nunca mais precisar gerar nem copiar tokens manualmente!
                </p>
              </div>

              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 transition shrink-0 shadow-md"
              >
                <span>Abrir Meta Developers</span>
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>

          {/* Grade de Passos */}
          <div className="space-y-5">
            {/* PASSO 1 */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-border transition relative">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-base grid place-items-center shrink-0">
                  01
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground">Criar o Aplicativo no Meta for Developers</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60 uppercase">
                      Início
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Acesse o portal da Meta com o seu perfil do Facebook. No canto superior direito, clique em <strong>"Meus Apps"</strong> e depois no botão verde <strong>"Criar aplicativo"</strong>.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-1">
                    <p>• <strong>Caso de uso:</strong> Escolha <em>"Outro"</em> e selecione o tipo <strong>"Empresa"</strong> (ou <em>Consumidor</em>).</p>
                    <p>• <strong>Nome de exibição:</strong> Digite um nome amigável para o seu app (exemplo: <code>Reelary - Minha Operação</code>).</p>
                    <p>• Confirme a criação inserindo a sua senha do Facebook se solicitado.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 2 */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-border transition relative">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black text-base grid place-items-center shrink-0">
                  02
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground">Ativar o Caso de Uso da API do Instagram</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                      Chaves da API
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dentro do painel do seu app recém-criado, clique em <strong>"Casos de uso"</strong> no menu lateral esquerdo e procure pelo produto <strong>"API do Instagram"</strong> (ou <em>"Manage messaging & content on Instagram"</em>).
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-1.5">
                    <p className="font-semibold text-foreground">Na aba <em>"Configuração da API com login do Instagram"</em>, você verá dois dados cruciais:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="p-2.5 rounded-lg bg-background/80 border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Dado 1</span>
                        <strong className="text-foreground text-xs">ID do app do Instagram</strong>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Um número de 15 a 16 dígitos.</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background/80 border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Dado 2</span>
                        <strong className="text-foreground text-xs">Chave secreta do app do Instagram</strong>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Clique no botão <em>"Mostrar"</em> para copiar.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 3 */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-border transition relative">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-black text-base grid place-items-center shrink-0">
                  03
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground">Adicionar suas Contas como Testadores</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">
                      Obrigatório em Modo de Teste
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Como o seu aplicativo está em desenvolvimento (modo seguro), a Meta exige que você convide o @ das contas do Instagram que irão utilizar o app.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-2">
                    <p>1. No menu lateral esquerdo da Meta, clique em <strong>"Funções do app" → "Funções"</strong>.</p>
                    <p>2. Clique em <strong>"Adicionar pessoas"</strong>, marque a opção <strong>"Testador do Instagram"</strong>.</p>
                    <p>3. Digite o <code>@username</code> exato da conta do Instagram e clique em Adicionar.</p>
                    
                    {/* Alerta de aceitação */}
                    <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-400 text-xs">
                        <Smartphone className="size-3.5" />
                        <span>AÇÃO OBRIGATÓRIA NO INSTAGRAM:</span>
                      </div>
                      <p className="text-[11px] text-foreground/90 leading-relaxed">
                        Abra o Instagram da conta convidada (no celular ou computador) e acesse: <br />
                        <strong>Configurações e atividade → Permissões do site → Apps e sites → Convites de testador</strong> e clique em <strong>Aceitar</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 4 */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-border transition relative">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-base grid place-items-center shrink-0">
                  04
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground">Configurar a URL de Redirecionamento (Callback)</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                      Segurança OAuth
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A Meta precisa saber para onde enviar o usuário com segurança após ele clicar em "Permitir" no Instagram.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-2">
                    <p>1. No Meta Developers, vá em: <strong>Casos de uso → API do Instagram → Configuração da API com login do Instagram</strong>.</p>
                    <p>2. Role a tela até a seção <strong>"4. Configurar o login da empresa no Instagram"</strong> e clique no botão <strong>[Configurações do login da empresa]</strong>.</p>
                    <p>3. No campo <strong>"URIs de redirecionamento do OAuth válidos"</strong>, cole exatamente a URL abaixo:</p>

                    <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg border border-border font-mono text-xs">
                      <span className="truncate text-primary font-bold">{igRedirectUri}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(igRedirectUri, "URL de Callback")}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground font-sans font-bold text-xs hover:opacity-90 transition shrink-0"
                      >
                        <Copy className="size-3.5" />
                        <span>Copiar URL</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground pt-1">
                      4. Role até o final da tela da Meta e clique em <strong>"Salvar alterações"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PASSO 5 */}
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:border-border transition relative">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-black text-base grid place-items-center shrink-0">
                  05
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground">Salvar suas Credenciais no Reelary</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 uppercase">
                      Vinculação
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Agora pegue os dados do <strong>Passo 2</strong> e salve na aba de Credenciais do Reelary.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-2">
                    <p>• Cole o <strong>ID do app do Instagram</strong> no campo <em>ID do App do Instagram</em>.</p>
                    <p>• Cole a <strong>Chave secreta do app</strong> no campo <em>Chave Secreta</em>.</p>
                    <p>• Clique no botão <strong>"Salvar e Ativar Meu App"</strong>.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("credentials")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-500 transition cursor-pointer mt-1"
                  >
                    <span>Ir para a aba Credenciais agora</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* PASSO 6 */}
            <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-md relative">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-primary text-primary-foreground font-black text-base grid place-items-center shrink-0 shadow-md">
                  06
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground">Conectar sua Conta com 1 Clique!</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase">
                      Finalizado
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tudo pronto! Com a sua conta do Instagram já aberta na outra aba do navegador:
                  </p>
                  <div className="p-3 bg-secondary/40 rounded-xl border border-border/50 text-xs text-foreground space-y-1.5">
                    <p>1. Acesse a tela de <strong>Contas do Instagram</strong> no Reelary.</p>
                    <p>2. Clique no botão com gradiente colorido: <strong>"Conectar via Instagram"</strong>.</p>
                    <p>3. A janela oficial da Meta abrirá pedindo permissão. Clique no botão azul <strong>"Permitir"</strong>.</p>
                    <p className="text-emerald-400 font-semibold pt-1">
                      ✓ Pronto! A conta será adicionada imediatamente com token válido por 60 dias sem copiar nada.
                    </p>
                  </div>
                  <Link
                    to="/accounts"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] text-white font-bold text-xs hover:opacity-90 transition shadow-md"
                  >
                    <span>Ir para Conectar Contas</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
