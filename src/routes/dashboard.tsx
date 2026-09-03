import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Instagram,
  Plus,
  Calendar as CalendarIcon,
  CheckCircle2,
  Layers,
  ChevronRight,
  ChevronDown,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  category_id: string | null;
  account_categories: { id: string; name: string; color: string } | null;
}

interface Post {
  id: string;
  caption: string;
  video_url: string;
  cover_url: string | null;
  scheduled_at: string;
  status: "pending" | "published" | "failed";
  instagram_account_id: string;
  instagram_accounts: { username: string } | null;
}

function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [scheduledPending, setScheduledPending] = useState(0);
  const [totalPublished, setTotalPublished] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [upcomingPosts, setUpcomingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const navigate = useNavigate();

  async function loadData() {
    try {
      // 1. Fetch instagram accounts - only visible (non-hidden) ones!
      const { data: accs, error: accsErr } = await supabase
        .from("instagram_accounts")
        .select("id, username, category_id, account_categories(id, name, color)")
        .eq("hidden", false)
        .order("created_at", { ascending: false });
      if (accsErr) throw accsErr;

      const loadedAccounts = accs || [];
      setAccounts(loadedAccounts);

      // Pre-fill selectedAccountIds with loaded visible accounts on first load
      setSelectedAccountIds((prev) => {
        if (prev.length === 0) {
          return loadedAccounts.map((a) => a.id);
        }
        return prev.filter((id) => loadedAccounts.some((a) => a.id === id));
      });
    } catch (err: any) {
      console.error("Dashboard error:", err);
      toast.error(err.message || "Erro ao carregar contas do painel");
    }
  }

  async function loadMetricsAndUpcoming(
    accountIds: string[],
    filter: string,
    range: DateRange | undefined,
  ) {
    setLoading(true);
    try {
      const nowStr = new Date().toISOString();
      const { start: filterStart, end: filterEnd } = getFilterDateRange();

      // 1. Pending count query
      let pendingQuery = supabase
        .from("scheduled_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (accountIds.length > 0) {
        pendingQuery = pendingQuery.in("instagram_account_id", accountIds);
      }
      if (filterStart) {
        pendingQuery = pendingQuery.gte("scheduled_at", filterStart.toISOString());
      }
      if (filterEnd) {
        pendingQuery = pendingQuery.lte("scheduled_at", filterEnd.toISOString());
      }
      const { count: pendingCount, error: pendingErr } = await pendingQuery;
      if (pendingErr) throw pendingErr;
      setScheduledPending(pendingCount || 0);

      // 2. Published count query
      let publishedQuery = supabase
        .from("scheduled_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      if (accountIds.length > 0) {
        publishedQuery = publishedQuery.in("instagram_account_id", accountIds);
      }
      if (filterStart) {
        publishedQuery = publishedQuery.gte("scheduled_at", filterStart.toISOString());
      }
      if (filterEnd) {
        publishedQuery = publishedQuery.lte("scheduled_at", filterEnd.toISOString());
      }
      const { count: publishedCount, error: publishedErr } = await publishedQuery;
      if (publishedErr) throw publishedErr;
      setTotalPublished(publishedCount || 0);

      // 3. Failed count query
      let failedQuery = supabase
        .from("scheduled_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

      if (accountIds.length > 0) {
        failedQuery = failedQuery.in("instagram_account_id", accountIds);
      }
      if (filterStart) {
        failedQuery = failedQuery.gte("scheduled_at", filterStart.toISOString());
      }
      if (filterEnd) {
        failedQuery = failedQuery.lte("scheduled_at", filterEnd.toISOString());
      }
      const { count: failedCount, error: failedErr } = await failedQuery;
      if (failedErr) throw failedErr;
      setTotalFailed(failedCount || 0);

      // 4. Upcoming posts query
      let upcomingQuery = supabase
        .from("scheduled_posts")
        .select(
          "id, caption, video_url, cover_url, scheduled_at, status, instagram_account_id, instagram_accounts(username)",
        )
        .eq("status", "pending")
        .gt("scheduled_at", nowStr)
        .order("scheduled_at", { ascending: true })
        .limit(3);

      if (accountIds.length > 0) {
        upcomingQuery = upcomingQuery.in("instagram_account_id", accountIds);
      }
      const { data: upcomingData, error: upcomingErr } = await upcomingQuery;
      if (upcomingErr) throw upcomingErr;
      setUpcomingPosts((upcomingData as any) || []);
    } catch (err: any) {
      console.error("Metrics load error:", err);
      toast.error("Erro ao atualizar métricas do painel");
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

  useEffect(() => {
    if (accounts.length > 0) {
      loadMetricsAndUpcoming(selectedAccountIds, dateFilter, dateRange);
    }
  }, [accounts, selectedAccountIds, dateFilter, dateRange]);

  // Compute date range for filtering
  const getFilterDateRange = () => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    if (dateFilter === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (dateFilter === "yesterday") {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (dateFilter === "7d") {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (dateFilter === "30d") {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (dateFilter === "custom" && dateRange?.from) {
      const s = new Date(dateRange.from);
      s.setHours(0, 0, 0, 0);
      const e = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    return { start: null, end: null };
  };

  const totalAccounts = accounts.length;

  // Dynamic titles based on selected filter
  const getScheduledCardTitle = () => {
    if (dateFilter === "today") return "Reels Agendados (Hoje)";
    if (dateFilter === "yesterday") return "Reels Agendados (Ontem)";
    if (dateFilter === "7d") return "Reels Agendados (7d)";
    if (dateFilter === "30d") return "Reels Agendados (30d)";
    if (dateFilter === "custom") return "Reels Agendados (Período)";
    return "Reels Agendados";
  };

  const getPublishedCardTitle = () => {
    if (dateFilter === "today") return "Reels Publicados (Hoje)";
    if (dateFilter === "yesterday") return "Reels Publicados (Ontem)";
    if (dateFilter === "7d") return "Reels Publicados (7d)";
    if (dateFilter === "30d") return "Reels Publicados (30d)";
    if (dateFilter === "custom") return "Reels Publicados (Período)";
    return "Reels Publicados";
  };

  const getScheduledLabel = () => {
    if (dateFilter === "today") return "reels hoje";
    if (dateFilter === "yesterday") return "reels ontem";
    if (dateFilter === "7d") return "reels em 7 dias";
    if (dateFilter === "30d") return "reels em 30 dias";
    return "reels agendados";
  };

  return (
    <div className="space-y-5">
      {/* Header com Filtro */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">Painel Geral</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Acompanhe as métricas de postagem dos seus Reels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro por Conta */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium shrink-0">Conta:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-[#26262b] bg-[#141417] hover:bg-[#1c1c20] rounded-md text-xs font-medium h-8 gap-2 cursor-pointer w-48 justify-between text-zinc-300"
                >
                  <span className="truncate">
                    {selectedAccountIds.length === accounts.length
                      ? "Todas as contas"
                      : selectedAccountIds.length === 0
                        ? "Nenhuma conta"
                        : `${selectedAccountIds.length} selecionada(s)`}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#121215] border border-[#26262b]">
                <DropdownMenuLabel className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Selecionar Contas</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccountIds(accounts.map((a) => a.id));
                      }}
                      className="text-[10px] text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Todas
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccountIds([]);
                      }}
                      className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {accounts.map((a) => {
                  const isChecked = selectedAccountIds.includes(a.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={a.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAccountIds((prev) => [...prev, a.id]);
                        } else {
                          setSelectedAccountIds((prev) => prev.filter((id) => id !== a.id));
                        }
                      }}
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer font-medium text-xs py-2"
                    >
                      <span className="flex items-center gap-2">
                        {a.account_categories && (
                          <span
                            className="size-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                            style={{ backgroundColor: a.account_categories.color }}
                          />
                        )}
                        @{a.username}
                      </span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filtro por Período */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium shrink-0">Período:</span>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-44 bg-[#141417] border-[#26262b] rounded-md h-8 text-xs text-zinc-300">
                <SelectValue placeholder="Qualquer período" />
              </SelectTrigger>
              <SelectContent className="bg-[#141417] border-[#26262b] text-xs">
                <SelectItem value="all" className="cursor-pointer">
                  Qualquer período
                </SelectItem>
                <SelectItem value="today" className="cursor-pointer">
                  Hoje
                </SelectItem>
                <SelectItem value="yesterday" className="cursor-pointer">
                  Ontem
                </SelectItem>
                <SelectItem value="7d" className="cursor-pointer">
                  Últimos 7 dias
                </SelectItem>
                <SelectItem value="30d" className="cursor-pointer">
                  Últimos 30 dias
                </SelectItem>
                <SelectItem value="custom" className="cursor-pointer">
                  Personalizado...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Calendário para Período Personalizado */}
      {dateFilter === "custom" && (
        <div className="flex flex-col md:flex-row items-start gap-6 p-4 rounded-lg border border-[#232328] bg-[#121215]">
          <div className="space-y-3 shrink-0">
            <h3 className="text-sm font-bold text-white">Intervalo de datas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[200px]">
              Selecione o dia inicial e o dia final clicando diretamente no calendário para filtrar
              as métricas do painel.
            </p>
            {dateRange?.from && (
              <div className="p-3 rounded-md bg-[#18181c] border border-[#26262b] space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block">
                  Período selecionado:
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {dateRange.from.toLocaleDateString("pt-BR")}
                  {dateRange.to
                    ? ` — ${dateRange.to.toLocaleDateString("pt-BR")}`
                    : " (Clique no dia de término)"}
                </span>
              </div>
            )}
          </div>

          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            className="rounded-lg border border-[#232328] bg-[#141417] p-3"
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-[#121215] border border-[#232328] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Métricas */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Card 1: Agendados pro Dia/Período */}
            <div className="rounded-lg border border-[#232328] bg-[#121215] p-4 hover:bg-[#151519] transition relative overflow-hidden">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1.5">
                <div className="size-6 rounded bg-amber-500/10 grid place-items-center text-amber-400">
                  <CalendarIcon className="size-3" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold">{getScheduledCardTitle()}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">
                  {scheduledPending}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{getScheduledLabel()}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Prontos para postagem automática.
              </p>
            </div>

            {/* Card 2: Já Postados */}
            <div className="rounded-lg border border-[#232328] bg-[#121215] p-4 hover:bg-[#151519] transition relative overflow-hidden">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1.5">
                <div className="size-6 rounded bg-emerald-500/10 grid place-items-center text-emerald-400">
                  <CheckCircle2 className="size-3" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold">{getPublishedCardTitle()}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">{totalPublished}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">publicados</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                {totalFailed > 0 ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="size-3 inline shrink-0" />
                    {totalFailed} falhas
                  </span>
                ) : (
                  <span>Sem falhas registradas.</span>
                )}
              </p>
            </div>

            {/* Card 3: Contas Conectadas */}
            <div className="rounded-lg border border-[#232328] bg-[#121215] p-4 hover:bg-[#151519] transition relative overflow-hidden">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1.5">
                <div className="size-6 rounded bg-amber-500/10 grid place-items-center text-amber-400">
                  <Instagram className="size-3" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold">Contas Conectadas</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{totalAccounts}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">perfis ativos</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Gerenciadas a partir de um único painel.
              </p>
            </div>
          </div>

          {/* Seção Inferior: Próximas Postagens e Ações */}
          <div className="grid gap-3 lg:grid-cols-3">
            {/* Próximos Reels */}
            <div className="lg:col-span-2 rounded-lg border border-[#232328] bg-[#101013] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-white">
                    <Clock className="size-4 text-amber-400" /> Próximas Publicações
                  </h3>
                  <Link
                    to="/calendar"
                    className="text-[11px] text-amber-400 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    Ver calendário <ChevronRight className="size-3" />
                  </Link>
                </div>

                {upcomingPosts.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-[#26262b] rounded-md bg-[#0e0e11]">
                    <p className="text-zinc-500 text-xs">
                      Nenhum Reel agendado para o futuro.
                    </p>
                    <Link to="/calendar" className="inline-block mt-3">
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-zinc-950 font-bold text-xs rounded-md"
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
                        className="flex gap-3 p-3 rounded-md bg-[#121215] border border-[#202024] hover:border-[#2a2a30] transition"
                      >
                        {p.video_url ? (
                          <video
                            src={p.video_url}
                            className="size-14 rounded-md object-cover bg-[#09090b] shrink-0"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <div
                            className="size-14 rounded-md bg-[#18181c] flex flex-col items-center justify-center shrink-0 border border-[#26262b] gap-1"
                            title="Vídeo removido para economizar espaço"
                          >
                            <span className="text-[8px] text-muted-foreground/80 font-bold">
                              Limpo
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-amber-400 flex items-center gap-1.5">
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
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded max-w-max">
                            <Clock className="size-2.5" /> Agendado
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {upcomingPosts.length > 0 && (
                <div className="pt-3 border-t border-[#1c1c20] mt-3 flex justify-end">
                  <Link to="/calendar">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                    >
                      Gerenciar Agendamentos ({scheduledPending}) →
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="rounded-lg border border-[#232328] bg-[#101013] p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="size-9 rounded-md bg-amber-500/15 border border-amber-500/30 grid place-items-center">
                  <Sparkles className="size-4 text-amber-400" />
                </div>
                <h3 className="font-bold text-base text-white">Agendamento Automático</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Agende Reels com vídeos, legendas e horários personalizados de postagem.
                </p>
              </div>

              <div className="space-y-2 mt-6">
                {totalAccounts > 0 ? (
                  <Link to="/calendar" className="block w-full">
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-zinc-950 font-bold h-9 text-xs rounded-md">
                      <Plus className="size-3.5 mr-1.5" /> Agendar Novo Reel
                    </Button>
                  </Link>
                ) : (
                  <Link to="/accounts" className="block w-full">
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-zinc-950 font-bold h-9 text-xs rounded-md">
                      <Instagram className="size-3.5 mr-1.5" /> Conectar Conta
                    </Button>
                  </Link>
                )}

                <Link to="/accounts" className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full border-[#26262b] hover:bg-[#18181c] h-9 font-medium text-xs rounded-md text-zinc-300"
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
