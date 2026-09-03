import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  Flame,
  Users,
  RefreshCw,
  Search,
  Instagram,
  Filter,
  ExternalLink,
  Play,
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
import { toast } from "sonner";
import {
  getCachedInsightsFn,
  syncAccountInsightsFn,
  syncAllAccountsInsightsFn,
} from "@/lib/instagram.insights";

export const Route = createFileRoute("/performance")({
  head: () => ({ meta: [{ title: "Ranking de Performance de Contas — Reelary" }] }),
  component: () => (
    <AppShell>
      <PerformancePage />
    </AppShell>
  ),
});

type SortField =
  | "engagementRate"
  | "totalViews"
  | "totalReach"
  | "followersCount"
  | "pendingCount";

function formatNumber(num: number | null | undefined): string {
  if (!num) return "0";
  return num.toLocaleString("pt-BR");
}

function formatCompactNumber(num: number | null | undefined): string {
  if (!num) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toLocaleString("pt-BR");
}

function PerformancePage() {
  const [data, setData] = useState<{
    accounts: any[];
    topMedia: any[];
    summary: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("totalViews");

  const navigate = useNavigate();

  async function loadData() {
    try {
      const res = await getCachedInsightsFn();
      setData(res as any);
    } catch (err: any) {
      console.error("Error loading insights:", err);
      toast.error(err.message || "Erro ao carregar métricas de performance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSyncAll() {
    setSyncingAll(true);
    toast.info("Sincronizando todas as contas com a Meta...");
    try {
      const res = await syncAllAccountsInsightsFn();
      await loadData();
      toast.success(
        `Sincronização concluída! ${res.synced} conta(s) atualizada(s)${
          res.failed > 0 ? `, ${res.failed} com falha.` : "."
        }`,
      );
    } catch (err: any) {
      console.error("Sync all error:", err);
      toast.error(err.message || "Erro ao sincronizar contas com o Instagram.");
    } finally {
      setSyncingAll(false);
    }
  }

  async function handleSyncSingle(accountId: string, username: string) {
    setSyncingAccountId(accountId);
    try {
      await syncAccountInsightsFn({ data: { accountId } });
      await loadData();
      toast.success(`Métricas de @${username} atualizadas!`);
    } catch (err: any) {
      console.error(`Sync account error for ${username}:`, err);
      toast.error(err.message || `Erro ao sincronizar @${username}.`);
    } finally {
      setSyncingAccountId(null);
    }
  }

  // Distinct categories from accounts
  const categories = useMemo(() => {
    if (!data?.accounts) return [];
    const catMap = new Map<string, { id: string; name: string; color: string }>();
    data.accounts.forEach((acc) => {
      if (acc.account_categories) {
        catMap.set(acc.account_categories.id, acc.account_categories);
      }
    });
    return Array.from(catMap.values());
  }, [data?.accounts]);

  // Max views across accounts for relative progress bars
  const maxViews = useMemo(() => {
    if (!data?.accounts || data.accounts.length === 0) return 1;
    const max = Math.max(...data.accounts.map((a) => Number(a.totalViews) || 0));
    return max > 0 ? max : 1;
  }, [data?.accounts]);

  // Filtered and sorted accounts list
  const filteredAndSortedAccounts = useMemo(() => {
    if (!data?.accounts) return [];
    return data.accounts
      .filter((acc) => {
        const matchesSearch = acc.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" ||
          (categoryFilter === "none" && !acc.category_id) ||
          acc.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const valA = Number(a[sortField]) || 0;
        const valB = Number(b[sortField]) || 0;
        return valB - valA;
      });
  }, [data?.accounts, searchQuery, categoryFilter, sortField]);

  // Global average engagement rate
  const avgEngagementRate = useMemo(() => {
    if (!data?.accounts || data.accounts.length === 0) return "0.00";
    const sum = data.accounts.reduce((acc, a) => acc + (Number(a.engagementRate) || 0), 0);
    return (sum / data.accounts.length).toFixed(1);
  }, [data?.accounts]);

  return (
    <div className="space-y-5 max-w-7xl pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="size-8 rounded-md bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400 shrink-0">
              <TrendingUp className="size-4" />
            </span>
            Performance e Rankings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Visão consolidada de desempenho e métricas das contas conectadas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleSyncAll}
            disabled={syncingAll || loading || data?.accounts?.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-zinc-950 font-bold text-xs h-9 px-3.5 gap-2 cursor-pointer rounded-md shadow-sm"
          >
            <RefreshCw className={`size-3.5 ${syncingAll ? "animate-spin" : ""}`} />
            {syncingAll ? "Sincronizando..." : "Sincronizar Todas"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-[#121215] border border-[#232328] animate-pulse"
              />
            ))}
          </div>
          <div className="h-[450px] rounded-lg bg-[#121215] border border-[#232328] animate-pulse" />
        </div>
      ) : !data?.accounts || data.accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#26262b] p-10 text-center bg-[#101013] space-y-3">
          <div className="size-12 rounded-lg bg-[#16161a] grid place-items-center mx-auto text-zinc-400">
            <Instagram className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhuma conta conectada</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Conecte suas contas do Instagram para acompanhar o ranking de visualizações e engajamento.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/accounts" })}
            className="bg-amber-600 hover:bg-amber-700 text-zinc-950 font-bold text-xs rounded-md"
          >
            Gerenciar Contas
          </Button>
        </div>
      ) : (
        <>
          {/* Top KPI Cards (3 cards: Views, Engajamento, Seguidores — sem comentários) */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Card 1: Total de Visualizações */}
            <div className="rounded-lg border border-[#232328] bg-[#121215] p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1.5">
                <div className="size-6 rounded bg-amber-500/10 grid place-items-center text-amber-400">
                  <Play className="size-3 fill-current" />
                </div>
                <span className="uppercase tracking-wider text-[10px] font-bold">
                  Visualizações Totais
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {formatCompactNumber(data.summary?.globalViews)}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  plays de reels
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Total de reproduções em todas as contas.
              </p>
            </div>

            {/* Card 2: Taxa Média de Engajamento */}
            <div className="rounded-lg border border-[#232328] bg-[#121215] p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1.5">
                <div className="size-6 rounded bg-amber-500/10 grid place-items-center text-amber-400">
                  <Flame className="size-3" />
                </div>
                <span className="uppercase tracking-wider text-[10px] font-bold">
                  Engajamento Médio
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">
                  {avgEngagementRate}%
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  taxa média
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Interações médias por alcance/plays.
              </p>
            </div>

            {/* Card 3: Base de Seguidores */}
            <div className="rounded-lg border border-[#232328] bg-[#121215] p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1.5">
                <div className="size-6 rounded bg-emerald-500/10 grid place-items-center text-emerald-400">
                  <Users className="size-3" />
                </div>
                <span className="uppercase tracking-wider text-[10px] font-bold">
                  Base de Seguidores
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {formatCompactNumber(data.summary?.globalFollowers)}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  seguidores
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Audiência somada de todas as contas ativas.
              </p>
            </div>
          </div>

          {/* Ranking Container (Estilo Minimalista e Sóbrio) */}
          <div className="rounded-lg border border-[#232328] bg-[#101013] p-4 md:p-5 shadow-sm space-y-4">
            {/* Header da Seção */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1c1c20] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-md bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400 shrink-0">
                  <span className="text-sm">🏆</span>
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
                    Ranking de Performance de Contas
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Listagem completa das {data.accounts.length} contas conectadas, ordenadas por desempenho.
                  </p>
                </div>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-44">
                  <Search className="size-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Buscar conta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 bg-[#141417] border-[#26262b] text-xs text-white placeholder:text-zinc-500 rounded-md"
                  />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32 bg-[#141417] border-[#26262b] text-xs text-zinc-300 rounded-md h-8">
                    <Filter className="size-3 mr-1 text-zinc-500" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141417] border-[#26262b] text-xs text-white">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort Field */}
                <Select value={sortField} onValueChange={(val) => setSortField(val as SortField)}>
                  <SelectTrigger className="w-36 bg-[#141417] border-[#26262b] text-xs text-zinc-300 rounded-md h-8">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141417] border-[#26262b] text-xs text-white">
                    <SelectItem value="totalViews">Visualizações</SelectItem>
                    <SelectItem value="engagementRate">Engajamento</SelectItem>
                    <SelectItem value="totalReach">Alcance</SelectItem>
                    <SelectItem value="followersCount">Seguidores</SelectItem>
                    <SelectItem value="pendingCount">Agendados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista do Ranking (Cards Horizontais Minimalistas) */}
            <div className="space-y-2">
              {filteredAndSortedAccounts.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  Nenhuma conta encontrada para os filtros selecionados.
                </div>
              ) : (
                filteredAndSortedAccounts.map((acc, index) => {
                  const isTop1 = index === 0;
                  const isTop2 = index === 1;
                  const isTop3 = index === 2;
                  const isSyncing = syncingAccountId === acc.id;

                  const viewsPercent = Math.min(
                    100,
                    Math.max(6, Math.round(((Number(acc.totalViews) || 0) / maxViews) * 100)),
                  );

                  return (
                    <div
                      key={acc.id}
                      className={`relative rounded-md transition-colors border ${
                        isTop1
                          ? "bg-[#141418] border-amber-500/30"
                          : "bg-[#121215] border-[#202024] hover:border-[#2a2a30] hover:bg-[#151519]"
                      } p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5`}
                    >
                      {/* Borda vertical dourada para o 1º lugar */}
                      {isTop1 && (
                        <div className="hidden xl:block absolute -left-[1px] top-2 bottom-2 w-1 bg-amber-500 rounded-r" />
                      )}

                      {/* Lado Esquerdo: Posição + Avatar + Nome + Top 1 Badge + Status */}
                      <div className="flex items-center gap-3 min-w-[220px]">
                        {/* Posição / Medalha */}
                        <div className="w-6 text-center shrink-0 flex items-center justify-center font-bold">
                          {isTop1 ? (
                            <span className="text-base" title="1º Lugar">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="text-base" title="2º Lugar">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="text-base" title="3º Lugar">
                              🥉
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-mono text-xs font-semibold">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="size-9 rounded-full bg-[#18181c] border border-zinc-700/50 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                          {acc.profile_picture_url ? (
                            <img
                              src={acc.profile_picture_url}
                              alt={acc.username}
                              className="size-full rounded-full object-cover"
                            />
                          ) : (
                            <Instagram className="size-4 text-amber-400" />
                          )}
                        </div>

                        {/* Nome & Badges */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={`https://instagram.com/${acc.username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-white hover:text-amber-400 transition text-xs flex items-center gap-1 truncate"
                            >
                              @{acc.username}
                              <ExternalLink className="size-2.5 opacity-40 hover:opacity-100" />
                            </a>

                            {/* Badge Top 1 */}
                            {isTop1 && (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1 shrink-0">
                                <span>🏆</span> Top 1
                              </span>
                            )}
                          </div>

                          {/* Status / Categoria */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {acc.account_categories ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-medium"
                                style={{ color: acc.account_categories.color }}
                              >
                                <span
                                  className="size-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: acc.account_categories.color }}
                                />
                                {acc.account_categories.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                                Saudável
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: 5 Colunas de Métricas */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 xl:gap-6 items-center flex-1 justify-between pt-2 xl:pt-0 border-t xl:border-t-0 border-[#1a1a1f]">
                        {/* 1. VISUALIZAÇÕES */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                            Visualizações
                          </span>
                          <div className="text-xs md:text-sm font-bold text-white">
                            {formatNumber(acc.totalViews)}
                          </div>
                          {/* Barra de Progresso Âmbar */}
                          <div className="w-16 md:w-20 h-1 bg-[#1a1a1e] rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                              style={{ width: `${viewsPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* 2. AGENDADOS */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">
                            Agendados
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs md:text-sm font-bold text-rose-400">
                              {acc.pendingCount}
                            </span>
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-bold px-1 py-0.2 rounded">
                              Fila
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-500 block truncate">
                            {acc.pendingCount} {acc.pendingCount === 1 ? "reel na fila" : "reels na fila"}
                          </span>
                        </div>

                        {/* 3. ALCANCE */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                            Alcance
                          </span>
                          <div className="text-xs md:text-sm font-bold text-white">
                            {formatNumber(acc.totalReach)}
                          </div>
                          <span className="text-[9px] text-zinc-500 block truncate">
                            contas únicas
                          </span>
                        </div>

                        {/* 4. SEGUIDORES */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                            Seguidores
                          </span>
                          <div className="text-xs md:text-sm font-bold text-white">
                            {formatNumber(acc.followersCount)}
                          </div>
                          <span className="text-[9px] text-zinc-500 block truncate">
                            {acc.mediaCount || 0} posts
                          </span>
                        </div>

                        {/* 5. ENGAJAMENTO */}
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                            Engajamento
                          </span>
                          <div className="text-xs md:text-sm font-bold text-white flex items-center gap-1">
                            {acc.engagementRate}%{" "}
                            {Number(acc.engagementRate) > 0 && <span>🔥</span>}
                          </div>
                          <span className="text-[9px] text-zinc-500 block truncate">
                            {formatNumber(acc.totalInteractions)} interações
                          </span>
                        </div>
                      </div>

                      {/* Botão de sincronização individual */}
                      <div className="flex justify-end xl:justify-center shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSyncing || syncingAll}
                          onClick={() => handleSyncSingle(acc.id, acc.username)}
                          className="h-7 px-2 text-[10px] text-zinc-400 hover:text-amber-400 hover:bg-[#1a1a1f] gap-1 font-medium rounded cursor-pointer"
                          title="Sincronizar esta conta"
                        >
                          <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
                          {isSyncing ? "Sync..." : "Atualizar"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
