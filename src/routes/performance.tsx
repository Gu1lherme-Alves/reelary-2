import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  Flame,
  Eye,
  Heart,
  MessageCircle,
  Users,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Search,
  Instagram,
  Filter,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getCachedInsightsFn,
  syncAccountInsightsFn,
  syncAllAccountsInsightsFn,
} from "@/lib/instagram.insights";

export const Route = createFileRoute("/performance")({
  head: () => ({ meta: [{ title: "Performance e Ranking de Contas — Reelary" }] }),
  component: () => (
    <AppShell>
      <PerformancePage />
    </AppShell>
  ),
});

type SortField =
  | "engagementRate"
  | "totalViews"
  | "followersCount"
  | "totalLikes"
  | "totalComments"
  | "mediaCount";

type SortOrder = "asc" | "desc";

function formatNumber(num: number | null | undefined): string {
  if (!num) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toLocaleString("pt-BR");
}

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "Nunca sincronizado";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Agora mesmo";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
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
  const [sortField, setSortField] = useState<SortField>("engagementRate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const navigate = useNavigate();

  async function loadData(showToast = false) {
    try {
      const res = await getCachedInsightsFn();
      setData(res as any);
      if (showToast) {
        toast.success("Métricas atualizadas com sucesso!");
      }
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
    toast.info("Iniciando sincronização de todas as contas com a Meta...");
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
      toast.success(`Métricas de @${username} atualizadas com sucesso!`);
    } catch (err: any) {
      console.error(`Sync account error for ${username}:`, err);
      toast.error(err.message || `Erro ao sincronizar @${username}.`);
    } finally {
      setSyncingAccountId(null);
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

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
        let valA = Number(a[sortField]) || 0;
        let valB = Number(b[sortField]) || 0;

        if (sortOrder === "asc") {
          return valA - valB;
        } else {
          return valB - valA;
        }
      });
  }, [data?.accounts, searchQuery, categoryFilter, sortField, sortOrder]);

  // Leaders / Podium Highlights
  const bestEngagementAccount = useMemo(() => {
    if (!data?.accounts || data.accounts.length === 0) return null;
    const sorted = [...data.accounts].sort(
      (a, b) => (Number(b.engagementRate) || 0) - (Number(a.engagementRate) || 0),
    );
    return sorted[0]?.engagementRate > 0 ? sorted[0] : null;
  }, [data?.accounts]);

  const mostViewsAccount = useMemo(() => {
    if (!data?.accounts || data.accounts.length === 0) return null;
    const sorted = [...data.accounts].sort(
      (a, b) => (Number(b.totalViews) || 0) - (Number(a.totalViews) || 0),
    );
    return sorted[0]?.totalViews > 0 ? sorted[0] : null;
  }, [data?.accounts]);

  const mostFollowersAccount = useMemo(() => {
    if (!data?.accounts || data.accounts.length === 0) return null;
    const sorted = [...data.accounts].sort(
      (a, b) => (Number(b.followersCount) || 0) - (Number(a.followersCount) || 0),
    );
    return sorted[0]?.followersCount > 0 ? sorted[0] : null;
  }, [data?.accounts]);

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Header com Título e Ação de Sync */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground shadow-glow shrink-0">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Performance e Rankings</h1>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                Descubra qual perfil está performando melhor em visualizações, engajamento e alcance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSyncAll}
            disabled={syncingAll || loading || data?.accounts?.length === 0}
            className="bg-gradient-brand text-primary-foreground border-0 hover:opacity-95 shadow-glow font-bold text-xs h-10 px-4 gap-2 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${syncingAll ? "animate-spin" : ""}`} />
            {syncingAll ? "Sincronizando com a Meta..." : "Sincronizar Todas as Contas"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-card border border-border/50 animate-pulse"
              />
            ))}
          </div>
          <div className="h-96 rounded-2xl bg-card border border-border/50 animate-pulse" />
        </div>
      ) : !data?.accounts || data.accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/30 space-y-4">
          <div className="size-16 rounded-2xl bg-secondary/80 grid place-items-center mx-auto text-muted-foreground">
            <Instagram className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Nenhuma conta conectada</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              Conecte suas contas do Instagram para acompanhar o ranking de visualizações,
              engajamento e os melhores Reels.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/accounts" })}
            className="bg-gradient-brand text-primary-foreground border-0 font-bold"
          >
            Gerenciar Contas
          </Button>
        </div>
      ) : (
        <>
          {/* Global Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Visualizações Totais */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-5 shadow-card hover:bg-card/80 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition duration-300">
                <Play className="size-16 text-primary" />
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs font-semibold mb-2">
                <div className="size-7 rounded-lg bg-primary/10 grid place-items-center text-primary">
                  <Play className="size-3.5 fill-current" />
                </div>
                <span>Total de Visualizações</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gradient-brand">
                  {formatNumber(data.summary?.globalViews)}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  plays de reels
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Soma de reproduções em todas as contas conectadas.
              </p>
            </div>

            {/* Card 2: Curtidas Totais */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-5 shadow-card hover:bg-card/80 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition duration-300">
                <Heart className="size-16 text-rose-500" />
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs font-semibold mb-2">
                <div className="size-7 rounded-lg bg-rose-500/10 grid place-items-center text-rose-500">
                  <Heart className="size-3.5 fill-current" />
                </div>
                <span>Curtidas Totais</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-500">
                  {formatNumber(data.summary?.globalLikes)}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  likes
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Interações diretas nos Reels monitorados.
              </p>
            </div>

            {/* Card 3: Comentários Totais */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-5 shadow-card hover:bg-card/80 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition duration-300">
                <MessageCircle className="size-16 text-blue-500" />
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs font-semibold mb-2">
                <div className="size-7 rounded-lg bg-blue-500/10 grid place-items-center text-blue-500">
                  <MessageCircle className="size-3.5" />
                </div>
                <span>Comentários Totais</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-400">
                  {formatNumber(data.summary?.globalComments)}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  respostas
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Engajamento direto e conversas nos posts.
              </p>
            </div>

            {/* Card 4: Base de Seguidores */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-5 shadow-card hover:bg-card/80 transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition duration-300">
                <Users className="size-16 text-emerald-500" />
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground text-xs font-semibold mb-2">
                <div className="size-7 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-500">
                  <Users className="size-3.5" />
                </div>
                <span>Base Total de Seguidores</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">
                  {formatNumber(data.summary?.globalFollowers)}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  seguidores
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Audiência somada de todos os perfis ativos.
              </p>
            </div>
          </div>

          {/* Destaques / Pódio das Melhores Contas */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Top 1 Engajamento */}
            <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card/60 to-card/40 p-5 shadow-glow relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/15 px-2.5 py-1 rounded-full border border-primary/30">
                  <Award className="size-3" /> Campeã em Engajamento
                </span>
                <span className="text-2xl">🏆</span>
              </div>
              {bestEngagementAccount ? (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-gradient-brand p-0.5 shrink-0 shadow-sm">
                      <div className="size-full rounded-full bg-card grid place-items-center">
                        <Instagram className="size-5 text-primary" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-base truncate text-foreground flex items-center gap-1.5">
                        @{bestEngagementAccount.username}
                        {bestEngagementAccount.account_categories && (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: bestEngagementAccount.account_categories.color,
                            }}
                          />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(bestEngagementAccount.followersCount)} seguidores
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pt-2 border-t border-border/30">
                    <span className="text-3xl font-black text-primary">
                      {bestEngagementAccount.engagementRate}%
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      taxa de engajamento média
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  Sincronize as contas para calcular o engajamento.
                </p>
              )}
            </div>

            {/* Top 1 Mais Visualizada */}
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-card/60 to-card/40 p-5 shadow-card relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                  <Flame className="size-3" /> Mais Visualizada
                </span>
                <span className="text-2xl">🔥</span>
              </div>
              {mostViewsAccount ? (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shrink-0 shadow-sm">
                      <div className="size-full rounded-full bg-card grid place-items-center">
                        <Play className="size-5 text-amber-400 fill-current" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-base truncate text-foreground flex items-center gap-1.5">
                        @{mostViewsAccount.username}
                        {mostViewsAccount.account_categories && (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: mostViewsAccount.account_categories.color,
                            }}
                          />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(mostViewsAccount.followersCount)} seguidores
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pt-2 border-t border-border/30">
                    <span className="text-3xl font-black text-amber-400">
                      {formatNumber(mostViewsAccount.totalViews)}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      reproduções de reels
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  Sincronize as contas para obter visualizações.
                </p>
              )}
            </div>

            {/* Top 1 Maior Audiência */}
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-card/60 to-card/40 p-5 shadow-card relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <Users className="size-3" /> Maior Audiência
                </span>
                <span className="text-2xl">👑</span>
              </div>
              {mostFollowersAccount ? (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shrink-0 shadow-sm">
                      <div className="size-full rounded-full bg-card grid place-items-center">
                        <Users className="size-5 text-emerald-400" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-base truncate text-foreground flex items-center gap-1.5">
                        @{mostFollowersAccount.username}
                        {mostFollowersAccount.account_categories && (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: mostFollowersAccount.account_categories.color,
                            }}
                          />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mostFollowersAccount.mediaCount} mídias publicadas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pt-2 border-t border-border/30">
                    <span className="text-3xl font-black text-emerald-400">
                      {formatNumber(mostFollowersAccount.followersCount)}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      seguidores ativos
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  Nenhum dado de seguidores disponível.
                </p>
              )}
            </div>
          </div>

          {/* Tabela de Ranking das Contas */}
          <div className="space-y-4 bg-card/40 border border-border/50 p-6 rounded-2xl shadow-card backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-xl flex items-center gap-2">
                  <Award className="size-5 text-primary" /> Tabela de Comparação e Rankings
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique no cabeçalho de qualquer coluna para reordenar a classificação.
                </p>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-56">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Buscar por @conta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 bg-card text-xs font-semibold rounded-xl"
                  />
                </div>

                {/* Filtro de Categoria */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-44 bg-card border-border/60 rounded-xl h-10 text-xs font-semibold">
                    <Filter className="size-3.5 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60 text-xs">
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
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
              </div>
            </div>

            {/* Tabela Responsiva */}
            <div className="overflow-x-auto rounded-xl border border-border/40 bg-card/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">Pos.</th>
                    <th className="py-3.5 px-4">Conta</th>
                    <th
                      onClick={() => handleSort("engagementRate")}
                      className="py-3.5 px-4 cursor-pointer hover:text-foreground transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Taxa Engajamento
                        <ArrowUpDown className="size-3 text-primary shrink-0" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("totalViews")}
                      className="py-3.5 px-4 cursor-pointer hover:text-foreground transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Visualizações
                        <ArrowUpDown className="size-3 text-amber-400 shrink-0" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("followersCount")}
                      className="py-3.5 px-4 cursor-pointer hover:text-foreground transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Seguidores
                        <ArrowUpDown className="size-3 text-emerald-400 shrink-0" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("totalLikes")}
                      className="py-3.5 px-4 cursor-pointer hover:text-foreground transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Curtidas
                        <ArrowUpDown className="size-3 text-rose-500 shrink-0" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("totalComments")}
                      className="py-3.5 px-4 cursor-pointer hover:text-foreground transition select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Comentários
                        <ArrowUpDown className="size-3 text-blue-400 shrink-0" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Última Sinc.</th>
                    <th className="py-3.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-xs">
                  {filteredAndSortedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-muted-foreground">
                        Nenhuma conta encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedAccounts.map((acc, index) => {
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;
                      const isSyncing = syncingAccountId === acc.id;

                      return (
                        <tr
                          key={acc.id}
                          className="hover:bg-secondary/40 transition-colors group"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center font-black">
                            {isTop1 ? (
                              <span className="inline-grid place-items-center size-6 rounded-full bg-amber-400/20 text-amber-400 font-extrabold text-xs">
                                🥇
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-grid place-items-center size-6 rounded-full bg-slate-400/20 text-slate-300 font-extrabold text-xs">
                                🥈
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-grid place-items-center size-6 rounded-full bg-amber-700/20 text-amber-600 font-extrabold text-xs">
                                🥉
                              </span>
                            ) : (
                              <span className="text-muted-foreground/70 font-mono">
                                #{index + 1}
                              </span>
                            )}
                          </td>

                          {/* Account */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-full bg-secondary/80 border border-border/50 grid place-items-center shrink-0">
                                <Instagram className="size-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <a
                                  href={`https://instagram.com/${acc.username}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-foreground hover:text-primary transition flex items-center gap-1 truncate"
                                >
                                  @{acc.username}
                                  <ExternalLink className="size-2.5 opacity-40 group-hover:opacity-100" />
                                </a>
                                {acc.account_categories ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold"
                                    style={{ color: acc.account_categories.color }}
                                  >
                                    <span
                                      className="size-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: acc.account_categories.color }}
                                    />
                                    {acc.account_categories.name}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/70">
                                    Sem categoria
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Engagement Rate */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="font-extrabold text-primary text-sm">
                                {acc.engagementRate}%
                              </span>
                              <div className="w-20 bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-primary h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, Number(acc.engagementRate) * 10)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Views */}
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {formatNumber(acc.totalViews)}
                          </td>

                          {/* Followers */}
                          <td className="py-3.5 px-4 font-semibold text-foreground/90">
                            {formatNumber(acc.followersCount)}
                          </td>

                          {/* Likes */}
                          <td className="py-3.5 px-4 font-semibold text-foreground/90">
                            {formatNumber(acc.totalLikes)}
                          </td>

                          {/* Comments */}
                          <td className="py-3.5 px-4 font-semibold text-foreground/90">
                            {formatNumber(acc.totalComments)}
                          </td>

                          {/* Last Synced */}
                          <td className="py-3.5 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(acc.lastSyncedAt)}
                          </td>

                          {/* Single Sync Button */}
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isSyncing || syncingAll}
                              onClick={() => handleSyncSingle(acc.id, acc.username)}
                              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-primary gap-1 font-semibold cursor-pointer"
                              title="Sincronizar esta conta"
                            >
                              <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
                              {isSyncing ? "Sync..." : "Atualizar"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Galeria dos Top Reels Mais Visualizados */}
          {data.topMedia && data.topMedia.length > 0 && (
            <div className="space-y-4 bg-card/40 border border-border/50 p-6 rounded-2xl shadow-card backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xl flex items-center gap-2">
                    <Sparkles className="size-5 text-amber-400" /> Melhores Reels em Destaque
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vídeos com melhor tração e engajamento capturados recentemente.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {data.topMedia.map((media: any) => (
                  <a
                    key={media.id}
                    href={media.permalink || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-border/40 bg-card/70 hover:bg-card hover:border-primary/50 transition duration-200 overflow-hidden group shadow-sm flex flex-col justify-between"
                  >
                    <div className="aspect-[9/16] max-h-56 relative bg-secondary/50 overflow-hidden flex items-center justify-center">
                      {media.thumbnail_url ? (
                        <img
                          src={media.thumbnail_url}
                          alt="Reel thumbnail"
                          className="size-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <Play className="size-8 text-muted-foreground opacity-50" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                      {/* Views Badge Overlay */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-extrabold text-foreground border border-white/10">
                        <Play className="size-2.5 text-primary fill-current" />
                        {formatNumber(media.views_count)} views
                      </div>

                      {/* Engagement Rate Badge */}
                      {media.engagement_rate > 0 && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/90 text-primary-foreground backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                          {media.engagement_rate}%
                        </div>
                      )}

                      {/* Account Name */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-foreground drop-shadow truncate">
                          @{media.instagram_accounts?.username}
                        </span>
                        <ExternalLink className="size-3 text-muted-foreground opacity-70 shrink-0" />
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-snug">
                        {media.caption || (
                          <span className="text-muted-foreground italic">Sem legenda</span>
                        )}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/30">
                        <span className="flex items-center gap-1 text-rose-500 font-bold">
                          <Heart className="size-3 fill-current" />
                          {formatNumber(media.like_count)}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400 font-bold">
                          <MessageCircle className="size-3" />
                          {formatNumber(media.comments_count)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatRelativeTime(media.published_at)}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Info Card / Dicas sobre a API da Meta */}
          <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs text-muted-foreground">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-foreground block">
                Sobre a frequência de atualização da Meta
              </span>
              <p className="leading-relaxed">
                As métricas de seguidores, curtidas e comentários são obtidas em tempo real a cada
                sincronização. As métricas agregadas de visualizações e alcance de Reels são
                processadas pela Meta em intervalos de 1 a 4 horas. Para manter a navegação no site
                instantânea, todos os dados são cacheados e atualizados sob demanda.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
