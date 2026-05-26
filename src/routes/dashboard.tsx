import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Instagram,
  Plus,
  Calendar,
  CheckCircle2,
  Layers,
  ChevronRight,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Painel de Controle — Reelary" }] }),
  component: () => (
    <AppShell>
      <DashboardPage />
    </AppShell>
  ),
});

interface Account {
  id: string;
  username: string;
}

interface Post {
  id: string;
  caption: string;
  video_url: string;
  scheduled_at: string;
  status: "pending" | "published" | "failed";
  instagram_account_id: string;
  instagram_accounts: { username: string } | null;
}

function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAccountId, setFilterAccountId] = useState<string>("all");
  const navigate = useNavigate();

  async function loadData() {
    try {
      // 1. Fetch instagram accounts
      const { data: accs, error: accsErr } = await supabase
        .from("instagram_accounts")
        .select("id, username")
        .order("created_at", { ascending: false });
      if (accsErr) throw accsErr;
      setAccounts(accs || []);

      // 2. Fetch scheduled posts
      const { data: postsData, error: postsErr } = await supabase
        .from("scheduled_posts")
        .select(
          "id, caption, video_url, scheduled_at, status, instagram_account_id, instagram_accounts(username)",
        )
        .order("scheduled_at", { ascending: true });
      if (postsErr) throw postsErr;
      setPosts((postsData as any) || []);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      toast.error(err.message || "Erro ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    // Listen to changes (e.g. if account is added/removed)
    const handleSync = () => {
      loadData();
    };
    window.addEventListener("active-account-changed", handleSync);
    return () => window.removeEventListener("active-account-changed", handleSync);
  }, []);

  // Filter calculations
  const filteredPosts = posts.filter((p) =>
    filterAccountId === "all" ? true : p.instagram_account_id === filterAccountId,
  );

  const totalAccounts = accounts.length;

  // Calculate today range in local time
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const scheduledToday = filteredPosts.filter((p) => {
    const d = new Date(p.scheduled_at);
    return p.status === "pending" && d >= startOfToday && d <= endOfToday;
  }).length;

  const totalPublished = filteredPosts.filter((p) => p.status === "published").length;
  const totalFailed = filteredPosts.filter((p) => p.status === "failed").length;

  // Get upcoming posts (scheduled after now, pending)
  const now = new Date();
  const upcomingPosts = filteredPosts
    .filter((p) => p.status === "pending" && new Date(p.scheduled_at) > now)
    .slice(0, 3); // Get top 3

  return (
    <div className="space-y-8">
      {/* Header com Filtro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Painel Geral</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as métricas de postagem dos seus Reels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium shrink-0">
            Filtrar por conta:
          </span>
          <Select value={filterAccountId} onValueChange={setFilterAccountId}>
            <SelectTrigger className="w-56 bg-card border-border/60 rounded-xl h-10 font-medium">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/60">
              <SelectItem value="all" className="cursor-pointer">
                ✨ Todas as contas
              </SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id} className="cursor-pointer">
                  📸 @{acc.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-card border border-border/50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Agendados pro Dia */}
            <div className="rounded-2xl border border-border/50 bg-card/45 p-6 shadow-card hover:bg-card/75 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
                <Calendar className="size-20 text-primary" />
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm font-semibold mb-3">
                <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                  <Calendar className="size-4" />
                </div>
                Reels Agendados (Hoje)
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-gradient-brand">
                  {scheduledToday}
                </span>
                <span className="text-xs text-muted-foreground">reels hoje</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Prontos para postagem automática nas próximas horas.
              </p>
            </div>

            {/* Card 2: Já Postados */}
            <div className="rounded-2xl border border-border/50 bg-card/45 p-6 shadow-card hover:bg-card/75 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
                <CheckCircle2 className="size-20 text-success" />
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm font-semibold mb-3">
                <div className="size-8 rounded-lg bg-success/10 grid place-items-center text-success">
                  <CheckCircle2 className="size-4" />
                </div>
                Reels Publicados
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-success">{totalPublished}</span>
                <span className="text-xs text-muted-foreground">publicados com sucesso</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed flex items-center gap-1">
                {totalFailed > 0 ? (
                  <span className="text-destructive font-semibold flex items-center gap-0.5">
                    ⚠️ {totalFailed} falhas registradas
                  </span>
                ) : (
                  <span>Sem falhas de publicação.</span>
                )}
              </p>
            </div>

            {/* Card 3: Contas Conectadas */}
            <div className="rounded-2xl border border-border/50 bg-card/45 p-6 shadow-card hover:bg-card/75 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300">
                <Instagram className="size-20 text-accent" />
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm font-semibold mb-3">
                <div className="size-8 rounded-lg bg-accent/10 grid place-items-center text-accent">
                  <Instagram className="size-4" />
                </div>
                Contas Conectadas
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-accent">{totalAccounts}</span>
                <span className="text-xs text-muted-foreground">perfis ativos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Todas gerenciadas a partir de um único painel.
              </p>
            </div>
          </div>

          {/* Seção Inferior: Próximas Postagens e Ações */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Próximos Reels */}
            <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Clock className="size-5 text-primary" /> Próximas Publicações
                  </h3>
                  <Link
                    to="/calendar"
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5"
                  >
                    Ver calendário completo <ChevronRight className="size-3" />
                  </Link>
                </div>

                {upcomingPosts.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-card/10">
                    <p className="text-muted-foreground text-sm">
                      Nenhum Reel agendado para o futuro.
                    </p>
                    <Link to="/calendar" className="inline-block mt-4">
                      <Button
                        size="sm"
                        className="bg-gradient-brand text-primary-foreground border-0"
                      >
                        Agendar Primeiro Reel
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingPosts.map((p) => (
                      <div
                        key={p.id}
                        className="flex gap-4 p-3 rounded-xl bg-card/65 border border-border/40 hover:bg-card/90 transition shadow-sm"
                      >
                        <video
                          src={p.video_url}
                          className="size-16 rounded-lg object-cover bg-background shrink-0"
                          muted
                        />
                        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-primary">
                                @{p.instagram_accounts?.username || "instagram"}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {new Date(p.scheduled_at).toLocaleString("pt-BR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                            <p className="text-sm font-medium mt-1 truncate text-foreground/90">
                              {p.caption || (
                                <span className="text-muted-foreground italic">Sem legenda</span>
                              )}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full max-w-max">
                            <Clock className="size-2.5 animate-pulse" /> Agendado
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {upcomingPosts.length > 0 && (
                <div className="pt-4 border-t border-border/40 mt-4 flex justify-end">
                  <Link to="/calendar">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                    >
                      Gerenciar Agendamentos (
                      {filteredPosts.filter((p) => p.status === "pending").length}) →
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="rounded-2xl border border-border/50 bg-gradient-brand/5 p-6 flex flex-col justify-between shadow-card">
              <div className="space-y-4">
                <div className="size-12 rounded-xl bg-gradient-brand grid place-items-center">
                  <Sparkles className="size-6 text-primary-foreground" />
                </div>
                <h3 className="font-extrabold text-xl">Agendamento Automático</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Agende novos Reels adicionando arquivos de vídeo locais, legendas personalizadas e
                  escolhendo o dia e hora exatos de postagem.
                </p>
              </div>

              <div className="space-y-3 mt-8">
                {totalAccounts > 0 ? (
                  <Link to="/calendar" className="block w-full">
                    <Button className="w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow font-bold h-11 hover:opacity-95">
                      <Plus className="size-4 mr-2" /> Agendar Novo Reel
                    </Button>
                  </Link>
                ) : (
                  <Link to="/accounts" className="block w-full">
                    <Button className="w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow font-bold h-11 hover:opacity-95">
                      <Instagram className="size-4 mr-2" /> Conectar Conta
                    </Button>
                  </Link>
                )}

                <Link to="/accounts" className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full border-border hover:bg-secondary h-11 font-semibold text-sm rounded-xl"
                  >
                    Ver Contas Vinculadas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
