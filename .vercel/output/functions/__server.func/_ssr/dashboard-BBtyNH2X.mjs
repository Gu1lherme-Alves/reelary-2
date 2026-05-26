import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-DLagrhjI.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { S as Select, c as SelectTrigger, d as SelectValue, a as SelectContent, b as SelectItem } from "./select-aG-zsZPc.mjs";
import { s as supabase } from "./client-BME84eyn.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { C as Calendar, i as CircleCheck, I as Instagram, l as Clock, e as ChevronRight, S as Sparkles, p as Plus } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "./use-auth-C2Kl6jq7.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
function DashboardPage() {
  const [accounts, setAccounts] = reactExports.useState([]);
  const [posts, setPosts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filterAccountId, setFilterAccountId] = reactExports.useState("all");
  useNavigate();
  async function loadData() {
    try {
      const {
        data: accs,
        error: accsErr
      } = await supabase.from("instagram_accounts").select("id, username").order("created_at", {
        ascending: false
      });
      if (accsErr) throw accsErr;
      setAccounts(accs || []);
      const {
        data: postsData,
        error: postsErr
      } = await supabase.from("scheduled_posts").select("id, caption, video_url, scheduled_at, status, instagram_account_id, instagram_accounts(username)").order("scheduled_at", {
        ascending: true
      });
      if (postsErr) throw postsErr;
      setPosts(postsData || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error(err.message || "Erro ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  }
  reactExports.useEffect(() => {
    loadData();
    const handleSync = () => {
      loadData();
    };
    window.addEventListener("active-account-changed", handleSync);
    return () => window.removeEventListener("active-account-changed", handleSync);
  }, []);
  const filteredPosts = posts.filter((p) => filterAccountId === "all" ? true : p.instagram_account_id === filterAccountId);
  const totalAccounts = accounts.length;
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = /* @__PURE__ */ new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const scheduledToday = filteredPosts.filter((p) => {
    const d = new Date(p.scheduled_at);
    return p.status === "pending" && d >= startOfToday && d <= endOfToday;
  }).length;
  const totalPublished = filteredPosts.filter((p) => p.status === "published").length;
  const totalFailed = filteredPosts.filter((p) => p.status === "failed").length;
  const now = /* @__PURE__ */ new Date();
  const upcomingPosts = filteredPosts.filter((p) => p.status === "pending" && new Date(p.scheduled_at) > now).slice(0, 3);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-extrabold tracking-tight", children: "Painel Geral" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Acompanhe as métricas de postagem dos seus Reels." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground font-medium shrink-0", children: "Filtrar por conta:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterAccountId, onValueChange: setFilterAccountId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-56 bg-card border-border/60 rounded-xl h-10 font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Todas as contas" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "bg-card border-border/60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", className: "cursor-pointer", children: "✨ Todas as contas" }),
            accounts.map((acc) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: acc.id, className: "cursor-pointer", children: [
              "📸 @",
              acc.username
            ] }, acc.id))
          ] })
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 rounded-2xl bg-card border border-border/50 animate-pulse" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/50 bg-card/45 p-6 shadow-card hover:bg-card/75 transition relative overflow-hidden group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "size-20 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-muted-foreground text-sm font-semibold mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 rounded-lg bg-primary/10 grid place-items-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "size-4" }) }),
            "Reels Agendados (Hoje)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-extrabold text-gradient-brand", children: scheduledToday }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "reels hoje" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-4 leading-relaxed", children: "Prontos para postagem automática nas próximas horas." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/50 bg-card/45 p-6 shadow-card hover:bg-card/75 transition relative overflow-hidden group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-20 text-success" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-muted-foreground text-sm font-semibold mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 rounded-lg bg-success/10 grid place-items-center text-success", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-4" }) }),
            "Reels Publicados"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-extrabold text-success", children: totalPublished }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "publicados com sucesso" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-4 leading-relaxed flex items-center gap-1", children: totalFailed > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-destructive font-semibold flex items-center gap-0.5", children: [
            "⚠️ ",
            totalFailed,
            " falhas registradas"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sem falhas de publicação." }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/50 bg-card/45 p-6 shadow-card hover:bg-card/75 transition relative overflow-hidden group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-20 text-accent" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-muted-foreground text-sm font-semibold mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 rounded-lg bg-accent/10 grid place-items-center text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-4" }) }),
            "Contas Conectadas"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-extrabold text-accent", children: totalAccounts }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "perfis ativos" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-4 leading-relaxed", children: "Todas gerenciadas a partir de um único painel." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 p-6 flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-5 text-primary" }),
                " Próximas Publicações"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/calendar", className: "text-xs text-primary hover:underline font-semibold flex items-center gap-0.5", children: [
                "Ver calendário completo ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3" })
              ] })
            ] }),
            upcomingPosts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-10 border border-dashed border-border/60 rounded-xl bg-card/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Nenhum Reel agendado para o futuro." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/calendar", className: "inline-block mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "bg-gradient-brand text-primary-foreground border-0", children: "Agendar Primeiro Reel" }) })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: upcomingPosts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 p-3 rounded-xl bg-card/65 border border-border/40 hover:bg-card/90 transition shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: p.video_url, className: "size-16 rounded-lg object-cover bg-background shrink-0", muted: true }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 flex flex-col justify-between py-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-primary", children: [
                      "@",
                      p.instagram_accounts?.username || "instagram"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "•" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: new Date(p.scheduled_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short"
                    }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium mt-1 truncate text-foreground/90", children: p.caption || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground italic", children: "Sem legenda" }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full max-w-max", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-2.5 animate-pulse" }),
                  " Agendado"
                ] })
              ] })
            ] }, p.id)) })
          ] }),
          upcomingPosts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4 border-t border-border/40 mt-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/calendar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "text-muted-foreground hover:text-foreground text-xs font-semibold", children: [
            "Gerenciar Agendamentos (",
            filteredPosts.filter((p) => p.status === "pending").length,
            ") →"
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/50 bg-gradient-brand/5 p-6 flex flex-col justify-between shadow-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-xl bg-gradient-brand grid place-items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-6 text-primary-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-extrabold text-xl", children: "Agendamento Automático" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: "Agende novos Reels adicionando arquivos de vídeo locais, legendas personalizadas e escolhendo o dia e hora exatos de postagem." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 mt-8", children: [
            totalAccounts > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/calendar", className: "block w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow font-bold h-11 hover:opacity-95", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 mr-2" }),
              " Agendar Novo Reel"
            ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/accounts", className: "block w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow font-bold h-11 hover:opacity-95", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-4 mr-2" }),
              " Conectar Conta"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/accounts", className: "block w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "w-full border-border hover:bg-secondary h-11 font-semibold text-sm rounded-xl", children: "Ver Contas Vinculadas" }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPage, {}) });
export {
  SplitComponent as component
};
