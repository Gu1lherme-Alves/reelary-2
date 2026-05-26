import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, a as getMetaAppId, b as buildInstagramAuthUrl } from "./instagram.functions-2J8nGUyq.mjs";
import { A as AppShell } from "./AppShell-DLagrhjI.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { s as supabase } from "./client-BME84eyn.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import { I as Instagram, h as CircleAlert, T as Trash2, q as Star, p as Plus } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "./server-5VHo_4WK.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DxRENTyW.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
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
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function AccountsPage() {
  const [accounts, setAccounts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [appId, setAppId] = reactExports.useState(null);
  const [connecting, setConnecting] = reactExports.useState(false);
  const [activeAccountId, setActiveAccountId] = reactExports.useState(null);
  const fetchAppId = useServerFn(getMetaAppId);
  async function load() {
    try {
      const {
        data,
        error
      } = await supabase.from("instagram_accounts").select("id, username, instagram_user_id, token_expires_at, created_at").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setAccounts(data ?? []);
      const storedId = localStorage.getItem("active_ig_account_id");
      if (storedId) {
        setActiveAccountId(storedId);
      } else if (data && data.length > 0) {
        setActiveAccountId(data[0].id);
        localStorage.setItem("active_ig_account_id", data[0].id);
      }
    } catch (err) {
      toast.error(err.message || "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }
  reactExports.useEffect(() => {
    load();
    fetchAppId().then((r) => setAppId(r.appId)).catch(() => setAppId(null));
    const handleActiveAccountChange = () => {
      const storedId = localStorage.getItem("active_ig_account_id");
      if (storedId) {
        setActiveAccountId(storedId);
      }
    };
    window.addEventListener("active-account-changed", handleActiveAccountChange);
    return () => window.removeEventListener("active-account-changed", handleActiveAccountChange);
  }, [fetchAppId]);
  async function disconnect(id) {
    if (!confirm("Desconectar esta conta do Instagram? Os agendamentos pendentes dela serão removidos.")) return;
    try {
      const {
        error
      } = await supabase.from("instagram_accounts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Conta desconectada com sucesso!");
      const storedId = localStorage.getItem("active_ig_account_id");
      if (storedId === id) {
        localStorage.removeItem("active_ig_account_id");
        window.dispatchEvent(new Event("active-account-changed"));
      }
      load();
    } catch (err) {
      toast.error(err.message || "Erro ao desconectar conta");
    }
  }
  function makeActive(account) {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-extrabold tracking-tight", children: "Contas do Instagram" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1.5", children: "Conecte suas contas comerciais do Instagram para agendar Reels automaticamente." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: connect, disabled: connecting, className: "bg-gradient-brand text-primary-foreground border-0 hover:opacity-95 font-semibold shadow-glow shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-4 mr-2" }),
        " Conectar Novo Instagram"
      ] })
    ] }),
    !configured && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-warning/30 bg-warning/10 p-5 flex gap-4 animate-in fade-in duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "size-5 text-warning shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-foreground", children: "Configuração da Meta pendente" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mt-1.5 leading-relaxed", children: [
          "Adicione os secrets ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono", children: "META_APP_ID" }),
          " e",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs bg-secondary px-1.5 py-0.5 rounded text-foreground font-mono", children: "META_APP_SECRET" }),
          " nas variáveis de ambiente da Lovable Cloud para ativar o login do Instagram."
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-44 rounded-2xl bg-card border border-border/50 animate-pulse" }, i)) }) : accounts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-dashed border-border/80 p-16 text-center bg-card/25 backdrop-blur-sm max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-2xl bg-gradient-brand grid place-items-center mx-auto mb-6 shadow-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-8 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-xl", children: "Nenhuma conta vinculada" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-2.5 max-w-md mx-auto leading-relaxed", children: "Vincule sua primeira conta do Instagram para desbloquear o agendamento de Reels e acompanhar suas publicações em nosso calendário integrado." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: connect, className: "mt-8 bg-gradient-brand text-primary-foreground border-0 font-semibold shadow-glow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-4 mr-2" }),
        " Conectar Conta Comercial"
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: accounts.map((a) => {
      const isActive = activeAccountId === a.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl border transition-all duration-300 p-5 shadow-card group bg-card/45 relative flex flex-col justify-between ${isActive ? "border-primary/80 ring-1 ring-primary/45 bg-primary/[0.02]" : "border-border/50 hover:border-muted-foreground/40 hover:bg-card/75"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-2xl bg-gradient-brand grid place-items-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-6 text-primary-foreground" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-base truncate flex items-center gap-1.5", children: [
                  "@",
                  a.username,
                  isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-2 rounded-full bg-success animate-pulse", title: "Conta ativa" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-0.5 truncate", children: [
                  "ID: ",
                  a.instagram_user_id
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => disconnect(a.id), className: "size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition", title: "Desconectar conta", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Vinculada em ",
              new Date(a.created_at).toLocaleDateString("pt-BR")
            ] }),
            a.token_expires_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-warning", children: [
              "Expira em ",
              new Date(a.token_expires_at).toLocaleDateString("pt-BR")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 pt-3 border-t border-border/40 flex gap-2", children: [
          isActive ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: true, className: "flex-1 bg-primary/10 text-primary hover:bg-primary/10 border border-primary/20 h-9 font-semibold text-xs rounded-xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "size-3.5 mr-1.5 fill-primary text-primary" }),
            " Conta Selecionada"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => makeActive(a), variant: "outline", className: "flex-1 border-border hover:border-primary/50 text-muted-foreground hover:text-foreground h-9 font-semibold text-xs rounded-xl transition cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "size-3.5 mr-1.5 text-muted-foreground" }),
            " Tornar Ativa"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/calendar", className: "shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", className: "size-9 bg-secondary hover:bg-secondary/70 text-foreground border border-border/60 rounded-xl", title: "Ir para o calendário de postagens", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 text-primary" }) }) })
        ] })
      ] }, a.id);
    }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccountsPage, {}) });
export {
  SplitComponent as component
};
