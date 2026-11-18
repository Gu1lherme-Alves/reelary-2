import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Key,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Save,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Smartphone,
  Globe,
  Link2,
  Instagram,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  saveCustomMetaCredentials,
  getUserCustomMetaSettings,
} from "@/lib/instagram.functions";
import { toast } from "sonner";
import { INSTAGRAM_REDIRECT_PATH } from "@/lib/instagram";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações da Conexão — Reelary" }] }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "tutorial") return "tutorial";
    }
    return "credentials";
  });

  // Campos do formulário de credenciais do Instagram
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchCustomSettings = useServerFn(getUserCustomMetaSettings);
  const saveCustomFn = useServerFn(saveCustomMetaCredentials);

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://reelary-2.vercel.app";
  const defaultRedirectUri = `${originUrl}${INSTAGRAM_REDIRECT_PATH}`;

  async function loadSettings() {
    try {
      const customData = await fetchCustomSettings();

      if (customData) {
        if (customData.customAppId) {
          setAppId(customData.customAppId);
        }
        if (customData.customAppSecret) {
          setAppSecret(customData.customAppSecret);
        }
        if (customData.customRedirectUri) {
          setRedirectUri(customData.customRedirectUri);
        } else {
          setRedirectUri(defaultRedirectUri);
        }
        setIsConfigured(Boolean(customData.hasCustomCredentials));
      }
    } catch (err: any) {
      console.error("Erro ao carregar configurações:", err);
      toast.error("Erro ao carregar credenciais do Instagram.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const cleanedId = appId.replace(/\D/g, "").trim();
    const cleanedSecret = appSecret.trim();
    const cleanedRedirect = redirectUri.trim() || defaultRedirectUri;

    if (!cleanedId) {
      toast.error("Por favor, informe o ID do App do Instagram (apenas números).");
      return;
    }

    if (!cleanedSecret) {
      toast.error("Por favor, informe a Chave Secreta do App do Instagram.");
      return;
    }

    setSaving(true);
    try {
      const res = await saveCustomFn({
        data: {
          appId: cleanedId,
          appSecret: cleanedSecret,
          redirectUri: cleanedRedirect,
          setActive: true,
        },
      });

      if (res?.success) {
        setIsConfigured(true);
        toast.success(
          "Credenciais e URI de redirecionamento do Instagram salvas com sucesso!",
        );
      }
    } catch (err: any) {
      console.error("Erro ao salvar credenciais:", err);
      toast.error(err.message || "Erro ao salvar credenciais do Instagram.");
    } finally {
      setSaving(false);
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
        <p className="text-sm text-muted-foreground">Carregando configurações…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#f09433]/15 via-[#e6683c]/15 to-[#dc2743]/15 border border-[#e6683c]/30 text-[#e6683c] text-xs font-bold uppercase tracking-wider mb-2">
            <Instagram className="size-3.5" />
            <span>API Oficial do Instagram</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Conexão do Instagram</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure o seu ID, Chave Secreta e URI de redirecionamento para habilitar a conexão direta em 1 clique.
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
            <span>Credenciais do Instagram</span>
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
            ABA 1: CREDENCIAIS DO INSTAGRAM
        ════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="credentials" className="space-y-6 mt-0 animate-in fade-in duration-200">
          {/* Card de Atalho para o Tutorial */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/30 grid place-items-center shrink-0 text-amber-400">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">É a sua primeira vez configurando?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preparamos um guia passo a passo ensinando a criar seu app, pegar o ID e a Chave Secreta do Instagram e cadastrar o URI de redirecionamento.
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

          {/* Formulário Principal: ID, Chave Secreta e URI de Redirecionamento */}
          <div className="rounded-2xl border border-primary/30 bg-card p-6 md:p-7 shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-[#f09433]/20 via-[#e6683c]/20 to-[#dc2743]/20 border border-[#e6683c]/30 grid place-items-center shrink-0 mt-0.5">
                  <Instagram className="size-5 text-[#e6683c]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground">
                      Credenciais da API do Instagram
                    </h2>
                    {isConfigured && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider inline-flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Ativo e Conectado
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Insira o <strong>ID do app do Instagram</strong>, a <strong>Chave secreta do app do Instagram</strong> e a <strong>URI de redirecionamento</strong> configurada no portal{" "}
                    <a
                      href="https://developers.facebook.com/apps/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Meta for Developers <ExternalLink className="size-3 inline" />
                    </a>.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Campo 1: ID do App do Instagram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>ID do App do Instagram</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Apenas números</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Key className="size-4" />
                    </div>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 984157640915216"
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-border/70 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Encontrado em <em>Casos de uso &gt; API do Instagram &gt; Configuração da API com login do Instagram</em>.
                  </p>
                </div>

                {/* Campo 2: Chave Secreta do App do Instagram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Chave Secreta do App do Instagram</span>
                    <span className="text-[10px] text-muted-foreground font-normal">App Secret</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Shield className="size-4" />
                    </div>
                    <input
                      type={showSecret ? "text" : "password"}
                      value={appSecret}
                      onChange={(e) => setAppSecret(e.target.value)}
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
                    Encontrado clicando no botão <em>"Mostrar"</em> ao lado do ID do app do Instagram.
                  </p>
                </div>
              </div>

              {/* Campo 3: URI de Redirecionamento configurada pelo usuário */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Link2 className="size-3.5 text-primary" />
                    <span>URI de Redirecionamento do OAuth (Callback URL)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setRedirectUri(defaultRedirectUri)}
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCcw className="size-3" />
                    Restaurar URL padrão
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Globe className="size-4" />
                  </div>
                  <input
                    type="text"
                    value={redirectUri}
                    onChange={(e) => setRedirectUri(e.target.value)}
                    placeholder={defaultRedirectUri}
                    className="w-full pl-10 pr-24 py-2.5 bg-secondary/30 border border-border/70 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                  <div className="absolute inset-y-0 right-1.5 flex items-center">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(redirectUri || defaultRedirectUri, "URI de Redirecionamento")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-sans text-xs font-semibold transition"
                      title="Copiar URL"
                    >
                      <Copy className="size-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Informe exatamente a URL que você cadastrou no seu app da Meta. O Reelary usará esta URL como callback no momento de autorizar a conexão.
                </p>
              </div>

              {/* Box de Orientação para Configurar no Meta */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-foreground">
                    Onde cadastrar esta URL no portal da Meta:
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No Meta Developers, acesse: <strong>Casos de uso &gt; API do Instagram &gt; Configuração da API com login do Instagram</strong>, role até a seção <strong>4. Configurar o login da empresa no Instagram</strong> e clique em <strong>[Configurações do login da empresa]</strong>. No campo <em>URIs de redirecionamento do OAuth válidos</em>, cole a URL acima e salve.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>As credenciais são salvas com segurança no seu perfil do Reelary.</span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Salvando Credenciais…</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Salvar Credenciais do Instagram</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
                  Como Configurar seu App do Instagram e Conectar em 1 Clique
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Siga este passo a passo simples. Você só precisa fazer isso <strong>uma única vez</strong>. Depois de salvar, todas as suas contas do Instagram serão conectadas instantaneamente com o botão "Permitir".
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
                    Acesse o portal do Meta Developers com o seu perfil do Facebook. No canto superior direito, clique em <strong>"Meus Apps"</strong> e depois no botão verde <strong>"Criar aplicativo"</strong>.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-1">
                    <p>• <strong>Caso de uso:</strong> Escolha <em>"Outro"</em> e selecione o tipo <strong>"Empresa"</strong> (ou <em>Consumidor</em>).</p>
                    <p>• <strong>Nome do app:</strong> Digite um nome para o seu app (exemplo: <code>Reelary - Minha Operação</code>).</p>
                    <p>• Confirme a criação inserindo a sua senha se solicitado.</p>
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
                    <h3 className="font-bold text-base text-foreground">Acessar a API do Instagram e Copiar o ID e a Chave Secreta</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                      Chaves da API
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No menu lateral esquerdo do seu aplicativo, clique em <strong>"Casos de uso"</strong> e selecione o produto <strong>"API do Instagram"</strong>. Em seguida, clique em <strong>"Configuração da API com login do Instagram"</strong>.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-1.5">
                    <p className="font-semibold text-foreground">Você verá exatamente estes dois campos no topo da página:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="p-2.5 rounded-lg bg-background/80 border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Campo 1</span>
                        <strong className="text-foreground text-xs">ID do app do Instagram</strong>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Exemplo: <code>984157640915216</code></p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background/80 border border-border/60">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Campo 2</span>
                        <strong className="text-foreground text-xs">Chave secreta do app do Instagram</strong>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Clique em <em>"Mostrar"</em> para copiar o segredo.</p>
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
                      Modo de Desenvolvimento
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enquanto o seu app estiver em desenvolvimento, a Meta exige que cada conta do Instagram que irá conectar seja cadastrada como testador.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-2">
                    <p>1. No menu lateral do Meta Developers, clique em <strong>"Funções do app" → "Funções"</strong>.</p>
                    <p>2. Clique em <strong>"Adicionar pessoas"</strong>, marque <strong>"Testador do Instagram"</strong> e digite o <code>@username</code> da conta.</p>
                    
                    <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-400 text-xs">
                        <Smartphone className="size-3.5" />
                        <span>AÇÃO NO APLICATIVO DO INSTAGRAM:</span>
                      </div>
                      <p className="text-[11px] text-foreground/90 leading-relaxed">
                        Abra o Instagram no celular ou navegador com a conta convidada, acesse: <br />
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
                    <h3 className="font-bold text-base text-foreground">Cadastrar o URI de Redirecionamento na Meta</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                      Segurança OAuth
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A Meta precisa saber exatamente qual endereço web deve receber o retorno seguro do login do Instagram.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-2">
                    <p>1. No Meta Developers, vá em: <strong>Casos de uso → API do Instagram → Configuração da API com login do Instagram</strong>.</p>
                    <p>2. Role até <strong>"4. Configurar o login da empresa no Instagram"</strong> e clique no botão <strong>[Configurações do login da empresa]</strong>.</p>
                    <p>3. No campo <strong>"URIs de redirecionamento do OAuth válidos"</strong>, cole a URL abaixo:</p>

                    <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg border border-border font-mono text-xs">
                      <span className="truncate text-primary font-bold">{defaultRedirectUri}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(defaultRedirectUri, "URL de Redirecionamento")}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-primary text-primary-foreground font-sans font-bold text-xs hover:opacity-90 transition shrink-0"
                      >
                        <Copy className="size-3.5" />
                        <span>Copiar URL</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground pt-1">
                      4. Role até o final da página e clique em <strong>"Salvar alterações"</strong>.
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
                    <h3 className="font-bold text-base text-foreground">Salvar suas Credenciais e a URI no Reelary</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 uppercase">
                      Vinculação
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Agora pegue o ID, a Chave Secreta e a URI de Redirecionamento e salve no formulário do Reelary.
                  </p>
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs text-foreground space-y-2">
                    <p>• Cole o <strong>ID do app do Instagram</strong> no campo correspondente.</p>
                    <p>• Cole a <strong>Chave secreta do app do Instagram</strong>.</p>
                    <p>• Confirme ou informe a <strong>URI de Redirecionamento</strong> que você cadastrou no seu app da Meta.</p>
                    <p>• Clique em <strong>"Salvar Credenciais do Instagram"</strong>.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("credentials")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-500 transition cursor-pointer mt-1"
                  >
                    <span>Ir para a aba Credenciais</span>
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
                    Tudo pronto! Com a conta do Instagram conectada na outra aba do navegador:
                  </p>
                  <div className="p-3 bg-secondary/40 rounded-xl border border-border/50 text-xs text-foreground space-y-1.5">
                    <p>1. Vá até a tela de <strong>Contas do Instagram</strong> no Reelary.</p>
                    <p>2. Clique no botão gradiente: <strong>"Conectar via Instagram"</strong>.</p>
                    <p>3. A janela oficial do Instagram abrirá solicitando autorização. Basta clicar em <strong>"Permitir"</strong>.</p>
                    <p className="text-emerald-400 font-semibold pt-1">
                      ✓ Pronto! Sua conta será vinculada instantaneamente com token de 60 dias sem precisar copiar nada manualmente.
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
