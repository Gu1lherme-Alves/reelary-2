import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Instagram, Plus, Trash2, AlertCircle, CheckCircle2, Star, Sparkles, Eye, EyeOff } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildInstagramAuthUrl } from "@/lib/instagram";
import { getMetaAppId } from "@/lib/instagram.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/accounts")({
  head: () => ({ meta: [{ title: "Contas do Instagram — Reelary" }] }),
  component: () => (
    <AppShell>
      <AccountsPage />
    </AppShell>
  ),
});

type IgAccount = {
  id: string;
  username: string;
  instagram_user_id: string;
  token_expires_at: string | null;
  created_at: string;
  hidden: boolean;
};

function AccountsPage() {
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [appId, setAppId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [showHiddenList, setShowHiddenList] = useState(false);
  const fetchAppId = useServerFn(getMetaAppId);

  async function hideAccount(id: string, username: string) {
    try {
      const { error } = await supabase
        .from("instagram_accounts")
        .update({ hidden: true })
        .eq("id", id);
      if (error) throw error;

      toast.success(`Conta @${username} oculta com sucesso!`);

      // If the hidden account was active, switch to first visible one
      const storedActiveId = localStorage.getItem("active_ig_account_id");
      if (storedActiveId === id) {
        const nextActive = accounts.find((a) => a.id !== id && !a.hidden);
        if (nextActive) {
          localStorage.setItem("active_ig_account_id", nextActive.id);
          setActiveAccountId(nextActive.id);
        } else {
          localStorage.removeItem("active_ig_account_id");
          setActiveAccountId(null);
        }
        window.dispatchEvent(new Event("active-account-changed"));
      }

      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao ocultar conta");
    }
  }

  async function unhideAccount(id: string, username: string) {
    try {
      const { error } = await supabase
        .from("instagram_accounts")
        .update({ hidden: false })
        .eq("id", id);
      if (error) throw error;

      toast.success(`Conta @${username} visível novamente!`);

      // If there is no active account now, set this one active
      const storedActiveId = localStorage.getItem("active_ig_account_id");
      if (!storedActiveId) {
        localStorage.setItem("active_ig_account_id", id);
        setActiveAccountId(id);
        window.dispatchEvent(new Event("active-account-changed"));
      }

      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao reexibir conta");
    }
  }

  async function load() {
    try {
      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("id, username, instagram_user_id, token_expires_at, created_at, hidden")
        .order("created_at", { ascending: false });
      if (error) throw error;

      setAccounts(data ?? []);

      // Load current active account
      const storedId = localStorage.getItem("active_ig_account_id");
      if (storedId) {
        setActiveAccountId(storedId);
      } else if (data && data.length > 0) {
        setActiveAccountId(data[0].id);
        localStorage.setItem("active_ig_account_id", data[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetchAppId()
      .then((r) => setAppId(r.appId))
      .catch(() => setAppId(null));

    // Sync active account if changed elsewhere (e.g. topbar)
    const handleActiveAccountChange = () => {
      const storedId = localStorage.getItem("active_ig_account_id");
      if (storedId) {
        setActiveAccountId(storedId);
      }
    };
    window.addEventListener("active-account-changed", handleActiveAccountChange);
    return () => window.removeEventListener("active-account-changed", handleActiveAccountChange);
  }, [fetchAppId]);

  async function disconnect(id: string) {
    if (
      !confirm(
        "Desconectar esta conta do Instagram? Os agendamentos pendentes dela serão removidos.",
      )
    )
      return;
    try {
      const { error } = await supabase.from("instagram_accounts").delete().eq("id", id);
      if (error) throw error;

      toast.success("Conta desconectada com sucesso!");

      // If the disconnected account was the active one, clear/change active account
      const storedId = localStorage.getItem("active_ig_account_id");
      if (storedId === id) {
        localStorage.removeItem("active_ig_account_id");
        window.dispatchEvent(new Event("active-account-changed"));
      }

      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao desconectar conta");
    }
  }

  function makeActive(account: IgAccount) {
    localStorage.setItem("active_ig_account_id", account.id);
    setActiveAccountId(account.id);
    window.dispatchEvent(new Event("active-account-changed"));
    toast.success(`Conta ativa alterada para @${account.username}`);
  }

  function connect() {
    if (!appId) {
      toast.error("Meta App ID não configurado no servidor");
      return;
    }
    setConnecting(true);
    window.location.href = buildInstagramAuthUrl(appId);
  }

  const configured = !!appId;
  const visibleAccounts = accounts.filter((a) => !a.hidden);
  const hiddenAccounts = accounts.filter((a) => a.hidden);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Contas do Instagram</h1>
          <p className="text-muted-foreground mt-1.5">
            Conecte suas contas comerciais do Instagram para agendar Reels automaticamente.
          </p>
        </div>
        <Button
          onClick={connect}
          disabled={connecting}
          className="bg-gradient-brand text-primary-foreground border-0 hover:opacity-95 font-semibold shadow-glow shrink-0"
        >
          <Instagram className="size-4 mr-2" /> Conectar Novo Instagram
        </Button>
      </div>

      {!configured && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 flex gap-4 animate-in fade-in duration-300">
          <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-foreground">Configuração da Meta pendente</p>
            <p className="text-muted-foreground mt-1.5 leading-relaxed">
              Adicione os secrets{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">
                META_APP_ID
              </code>{" "}
              e{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono">
                META_APP_SECRET
              </code>{" "}
              nas variáveis de ambiente da Lovable Cloud para ativar o login do Instagram.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-card border border-border/50 animate-pulse"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 p-16 text-center bg-card/25 backdrop-blur-sm max-w-2xl mx-auto">
          <div className="size-16 rounded-2xl bg-gradient-brand grid place-items-center mx-auto mb-6 shadow-glow">
            <Instagram className="size-8 text-primary-foreground" />
          </div>
          <h3 className="font-bold text-xl">Nenhuma conta vinculada</h3>
          <p className="text-muted-foreground text-sm mt-2.5 max-w-md mx-auto leading-relaxed">
            Vincule sua primeira conta do Instagram para desbloquear o agendamento de Reels e
            acompanhar suas publicações em nosso calendário integrado.
          </p>
          <Button
            onClick={connect}
            className="mt-8 bg-gradient-brand text-primary-foreground border-0 font-semibold shadow-glow"
          >
            <Instagram className="size-4 mr-2" /> Conectar Conta Comercial
          </Button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {visibleAccounts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/25 backdrop-blur-sm max-w-2xl mx-auto">
              <div className="size-16 rounded-2xl bg-secondary grid place-items-center mx-auto mb-6 shadow-sm">
                <EyeOff className="size-8 text-muted-foreground animate-pulse" />
              </div>
              <h3 className="font-bold text-xl">Todas as contas estão ocultas</h3>
              <p className="text-muted-foreground text-sm mt-2.5 max-w-md mx-auto leading-relaxed">
                Você ocultou todas as suas contas do Instagram deste painel. Você pode gerenciá-las ou reexibi-las na seção de contas ocultas abaixo.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleAccounts.map((a) => {
                const isActive = activeAccountId === a.id;
                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl border transition-all duration-300 p-5 shadow-card group bg-card/45 relative flex flex-col justify-between ${
                      isActive
                        ? "border-primary/80 ring-1 ring-primary/45 bg-primary/[0.02]"
                        : "border-border/50 hover:border-muted-foreground/40 hover:bg-card/75"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="size-12 rounded-2xl bg-gradient-brand grid place-items-center shrink-0">
                            <Instagram className="size-6 text-primary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-base truncate flex items-center gap-1.5">
                              @{a.username}
                              {isActive && (
                                <span
                                  className="size-2 rounded-full bg-success animate-pulse"
                                  title="Conta ativa"
                                />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              ID: {a.instagram_user_id}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => hideAccount(a.id, a.username)}
                            className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"
                            title="Ocultar conta do painel"
                          >
                            <EyeOff className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => disconnect(a.id)}
                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                            title="Desconectar conta"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Vinculada em {new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                        {a.token_expires_at && (
                          <span className="text-warning">
                            Expira em {new Date(a.token_expires_at).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-border/40 flex gap-2">
                      {isActive ? (
                        <Button
                          disabled
                          className="flex-1 bg-primary/10 text-primary hover:bg-primary/10 border border-primary/20 h-9 font-semibold text-xs rounded-xl"
                        >
                          <Star className="size-3.5 mr-1.5 fill-primary text-primary" /> Conta
                          Selecionada
                        </Button>
                      ) : (
                        <Button
                          onClick={() => makeActive(a)}
                          variant="outline"
                          className="flex-1 border-border hover:border-primary/50 text-muted-foreground hover:text-foreground h-9 font-semibold text-xs rounded-xl transition cursor-pointer"
                        >
                          <Star className="size-3.5 mr-1.5 text-muted-foreground" /> Tornar Ativa
                        </Button>
                      )}
                      <Link to="/calendar" className="shrink-0">
                        <Button
                          size="icon"
                          className="size-9 bg-secondary hover:bg-secondary/70 text-foreground border border-border/60 rounded-xl"
                          title="Ir para o calendário de postagens"
                        >
                          <Plus className="size-4 text-primary" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hiddenAccounts.length > 0 && (
            <div className="pt-6 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={() => setShowHiddenList(!showHiddenList)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition cursor-pointer"
              >
                {showHiddenList ? (
                  <>
                    <Eye className="size-4 text-primary" />
                    <span>Ocultar contas ocultas ({hiddenAccounts.length})</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="size-4 text-muted-foreground" />
                    <span>Mostrar contas ocultas ({hiddenAccounts.length})</span>
                  </>
                )}
              </Button>

              {showHiddenList && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in slide-in-from-top-2 fade-in duration-300">
                  {hiddenAccounts.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-border/50 bg-card/30 p-4 flex items-center justify-between gap-3 shadow-sm hover:border-border transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-xl bg-secondary grid place-items-center shrink-0">
                          <Instagram className="size-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">@{a.username}</p>
                          <p className="text-[10px] text-muted-foreground truncate">ID: {a.instagram_user_id}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unhideAccount(a.id, a.username)}
                        className="h-8 text-xs font-semibold px-3 rounded-xl border border-border/80 hover:border-primary/50 text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 shrink-0"
                        title="Tornar conta visível no painel"
                      >
                        <Eye className="size-3.5 text-primary" />
                        <span>Reexibir</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
