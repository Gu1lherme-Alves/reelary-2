import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  Flame,
  Users,
  RefreshCw,
  Search,
  Instagram,
  Filter,
  ExternalLink,
  Play,
  Heart,
  Calendar,
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
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 grid place-items-center text-white shadow-glow">
              <TrendingUp className="size-5" />
            </span>
            Performance e Rankings
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Visão detalhada do desempenho de todas as contas conectadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSyncAll}
            disabled={syncingAll || loading || data?.accounts?.length === 0}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-glow font-bold text-xs h-10 px-4 gap-2 cursor-pointer rounded-xl"
          >
            <RefreshCw className={`size-3.5 ${syncingAll ? "animate-spin" : ""}`} />
            {syncingAll ? "Sincronizando..." : "Sincronizar Todas as Contas"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-[#120d1c] border border-[#261d36] animate-pulse"
              />
            ))}
          </div>
          <div className="h-[500px] rounded-2xl bg-[#120d1c] border border-[#261d36] animate-pulse" />
        </div>
      ) : !data?.accounts || data.accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2d2242] p-12 text-center bg-[#100b19] space-y-4">
          <div className="size-16 rounded-2xl bg-[#1a1329] grid place-items-center mx-auto text-zinc-400">
            <Instagram className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Nenhuma conta conectada</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
              Conecte suas contas do Instagram para acompanhar o ranking de visualizações,
              engajamento e os melhores Reels.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/accounts" })}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 font-bold rounded-xl"
          >
            Gerenciar Contas
          </Button>
        </div>
      ) : (
        <>
          {/* Top KPI Cards (3 cards: Views, Engajamento, Seguidores — SEM card de comentários) */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card 1: Total de Visualizações */}
            <div className="rounded-2xl border border-[#261d36] bg-[#120d1c]/80 backdrop-blur-md p-5 shadow-lg relative overflow-hidden group">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-2">
                <div className="size-7 rounded-lg bg-pink-500/10 grid place-items-center text-pink-400">
                  <Play className="size-3.5 fill-current" />
                </div>
                <span className="uppercase tracking-wider text-[11px] font-bold">
                  Visualizações Totais
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {formatCompactNumber(data.summary?.globalViews)}
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  plays de reels
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Total de reproduções em todas as contas conectadas.
              </p>
            </div>

            {/* Card 2: Taxa Média de Engajamento */}
            <div className="rounded-2xl border border-[#261d36] bg-[#120d1c]/80 backdrop-blur-md p-5 shadow-lg relative overflow-hidden group">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-2">
                <div className="size-7 rounded-lg bg-amber-500/10 grid place-items-center text-amber-400">
                  <Flame className="size-3.5" />
                </div>
                <span className="uppercase tracking-wider text-[11px] font-bold">
                  Engajamento Médio
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-400">
                  {avgEngagementRate}%
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  taxa média
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Média de interações por visualização e alcance.
              </p>
            </div>

            {/* Card 3: Base de Seguidores */}
            <div className="rounded-2xl border border-[#261d36] bg-[#120d1c]/80 backdrop-blur-md p-5 shadow-lg relative overflow-hidden group">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-2">
                <div className="size-7 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-400">
                  <Users className="size-3.5" />
                </div>
                <span className="uppercase tracking-wider text-[11px] font-bold">
                  Base de Seguidores
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">
                  {formatCompactNumber(data.summary?.globalFollowers)}
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  seguidores
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Audiência somada de todas as contas ativas.
              </p>
            </div>
          </div>

          {/* Ranking Container (Exatamente como a imagem) */}
          <div className="rounded-2xl md:rounded-3xl border border-[#231934] bg-[#0e0a16] p-5 md:p-7 shadow-2xl space-y-6">
            {/* Header da Seção com Ícone Rosa */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1f162e] pb-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 grid place-items-center text-white shadow-glow shrink-0">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-white tracking-tight">
                    Ranking de Performance de Contas
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Listagem completa das {data.accounts.length} contas conectadas, ordenadas por
                    desempenho.
                  </p>
                </div>
              </div>

              {/* Filtros e Busca Rápidos */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="size-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Buscar conta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 bg-[#150f22] border-[#291e3d] text-xs text-white placeholder:text-zinc-500 rounded-xl"
                  />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36 bg-[#150f22] border-[#291e3d] text-xs text-zinc-300 rounded-xl h-9">
                    <Filter className="size-3 mr-1 text-zinc-500" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#150f22] border-[#291e3d] text-xs text-white">
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
                  <SelectTrigger className="w-40 bg-[#150f22] border-[#291e3d] text-xs text-zinc-300 rounded-xl h-9">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#150f22] border-[#291e3d] text-xs text-white">
                    <SelectItem value="totalViews">Visualizações</SelectItem>
                    <SelectItem value="engagementRate">Engajamento</SelectItem>
                    <SelectItem value="totalReach">Alcance</SelectItem>
                    <SelectItem value="followersCount">Seguidores</SelectItem>
                    <SelectItem value="pendingCount">Agendados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista do Ranking (Estilo Cards Horizontais da Imagem) */}
            <div className="space-y-2.5">
              {filteredAndSortedAccounts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
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
                      className={`relative rounded-xl md:rounded-2xl transition-all duration-200 border ${
                        isTop1
                          ? "bg-[#140e21] border-[#382756] shadow-glow"
                          : "bg-[#110c1c] border-[#201633] hover:border-[#332252] hover:bg-[#150e24]"
                      } p-4 md:py-4.5 md:px-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4`}
                    >
                      {/* Borda vertical amarela para o 1º lugar (igual imagem) */}
                      {isTop1 && (
                        <div className="hidden xl:block absolute -left-[1px] top-3 bottom-3 w-1 bg-amber-400 rounded-r" />
                      )}

                      {/* Lado Esquerdo: Posição + Avatar + Nome + Top 1 Badge + Status */}
                      <div className="flex items-center gap-3.5 min-w-[240px]">
                        {/* Posição / Medalha */}
                        <div className="w-7 text-center shrink-0 flex items-center justify-center font-black">
                          {isTop1 ? (
                            <span className="text-lg" title="1º Lugar">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="text-lg" title="2º Lugar">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="text-lg" title="3º Lugar">
                              🥉
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-mono text-xs font-bold">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="size-11 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 p-0.5 shrink-0 shadow-md">
                          <div className="size-full rounded-full bg-[#181126] grid place-items-center overflow-hidden">
                            <Instagram className="size-5 text-pink-400" />
                          </div>
                        </div>

                        {/* Nome & Badges */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={`https://instagram.com/${acc.username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-black text-white hover:text-pink-400 transition text-sm flex items-center gap-1 truncate"
                            >
                              @{acc.username}
                              <ExternalLink className="size-3 opacity-40 hover:opacity-100" />
                            </a>

                            {/* Badge Top 1 (igual imagem) */}
                            {isTop1 && (
                              <span className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm shrink-0">
                                <span>🏆</span> Top 1
                              </span>
                            )}
                          </div>

                          {/* Status / Categoria */}
                          <div className="flex items-center gap-2 mt-0.5">
                            {acc.account_categories ? (
                              <span
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold"
                                style={{ color: acc.account_categories.color }}
                              >
                                <span
                                  className="size-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: acc.account_categories.color }}
                                />
                                {acc.account_categories.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                                Saudável
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: As 5 Colunas de Métricas da Imagem */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 xl:gap-8 items-center flex-1 justify-between pt-3 xl:pt-0 border-t xl:border-t-0 border-[#1f162e]">
                        {/* 1. VISUALIZAÇÕES */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Visualizações
                          </span>
                          <div className="text-sm md:text-base font-black text-white">
                            {formatNumber(acc.totalViews)}
                          </div>
                          {/* Barra de Progresso Rosa */}
                          <div className="w-20 md:w-24 h-1.5 bg-[#231738] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
                              style={{ width: `${viewsPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* 2. AGENDADOS */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                            Agendados
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm md:text-base font-black text-rose-400">
                              {acc.pendingCount}
                            </span>
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                              Fila
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {acc.pendingCount} {acc.pendingCount === 1 ? "reel na fila" : "reels na fila"}
                          </span>
                        </div>

                        {/* 3. ALCANCE */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Alcance
                          </span>
                          <div className="text-sm md:text-base font-black text-white">
                            {formatNumber(acc.totalReach)}
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            contas únicas
                          </span>
                        </div>

                        {/* 4. SEGUIDORES */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Seguidores
                          </span>
                          <div className="text-sm md:text-base font-black text-white">
                            {formatNumber(acc.followersCount)}
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {acc.mediaCount || 0} posts
                          </span>
                        </div>

                        {/* 5. ENGAJAMENTO */}
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Engajamento
                          </span>
                          <div className="text-sm md:text-base font-black text-white flex items-center gap-1">
                            {acc.engagementRate}%{" "}
                            {Number(acc.engagementRate) > 0 && <span>🔥</span>}
                          </div>
                          <span className="text-[10px] text-zinc-400 block truncate">
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
                          className="h-8 px-2.5 text-[11px] text-zinc-400 hover:text-pink-400 hover:bg-[#201534] gap-1 font-semibold rounded-lg cursor-pointer"
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
