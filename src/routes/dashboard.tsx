import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Instagram, Plus, Trash2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildInstagramAuthUrl } from "@/lib/instagram";
import { getMetaAppId } from "@/lib/instagram.functions";
import { toast } from "sonner";


export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Contas — Reelary" }] }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

type IgAccount = {
  id: string;
  username: string;
  instagram_user_id: string;
  token_expires_at: string | null;
  created_at: string;
};

function Dashboard() {
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [appId, setAppId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const fetchAppId = useServerFn(getMetaAppId);

  async function load() {
    const { data, error } = await supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id, token_expires_at, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAccounts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetchAppId().then((r) => setAppId(r.appId)).catch(() => setAppId(null));
  }, [fetchAppId]);

  async function disconnect(id: string) {
    if (!confirm("Desconectar esta conta?")) return;
    const { error } = await supabase.from("instagram_accounts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Conta desconectada");
    load();
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suas contas</h1>
          <p className="text-muted-foreground mt-1">Conecte contas do Instagram para agendar Reels</p>
        </div>
        <Button onClick={connect} disabled={connecting} className="bg-gradient-brand text-primary-foreground border-0 hover:opacity-90">
          <Plus className="size-4" /> Conectar Instagram
        </Button>
      </div>

      {!configured && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 mb-6 flex gap-3">
          <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Configuração pendente</p>
            <p className="text-muted-foreground mt-1">
              Adicione os secrets <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">META_APP_ID</code> e{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">META_APP_SECRET</code> em Lovable Cloud para ativar o login do Instagram.
            </p>
          </div>
        </div>
      )}


      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-16 text-center bg-card/30">
          <div className="size-14 rounded-2xl bg-gradient-brand grid place-items-center mx-auto mb-4 shadow-glow">
            <Instagram className="size-7 text-primary-foreground" />
          </div>
          <h3 className="font-semibold text-lg">Nenhuma conta conectada</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
            Conecte sua primeira conta do Instagram para começar a agendar publicações.
          </p>
          <Button onClick={connect} className="mt-6 bg-gradient-brand text-primary-foreground border-0">
            <Instagram className="size-4" /> Conectar Instagram
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-gradient-brand grid place-items-center">
                    <Instagram className="size-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">@{a.username}</div>
                    <div className="text-xs text-muted-foreground">ID {a.instagram_user_id.slice(0, 12)}…</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => disconnect(a.id)}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {a.token_expires_at ? `Expira ${new Date(a.token_expires_at).toLocaleDateString("pt-BR")}` : "Token longo"}
                </span>
                <Link to="/schedule" className="text-primary hover:underline font-medium">
                  Agendar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
