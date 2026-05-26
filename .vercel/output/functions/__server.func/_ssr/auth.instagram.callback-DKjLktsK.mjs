import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, g as getInstagramRedirectUri, c as connectInstagramAccount } from "./instagram.functions-2J8nGUyq.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import { n as LoaderCircle, h as CircleAlert, i as CircleCheck } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function CallbackPage() {
  const [state, setState] = reactExports.useState("loading");
  const [errorMsg, setErrorMsg] = reactExports.useState(null);
  const [username, setUsername] = reactExports.useState(null);
  const navigate = useNavigate();
  const connect = useServerFn(connectInstagramAccount);
  const ran = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error_description") ?? params.get("error");
    const code = params.get("code");
    console.log("[Callback] Params:", {
      error,
      code: code ? `${code.slice(0, 20)}...` : null
    });
    if (error) {
      console.error("[Callback] OAuth error from Meta:", error);
      setErrorMsg(error);
      setState("error");
      return;
    }
    if (!code) {
      console.error("[Callback] No code param in URL");
      setErrorMsg("Nenhum código recebido do Meta.");
      setState("error");
      return;
    }
    (async () => {
      try {
        console.log("[Callback] Calling connectInstagramAccount...");
        const res = await connect({
          data: {
            code,
            redirectUri: getInstagramRedirectUri()
          }
        });
        console.log("[Callback] Success:", res);
        setUsername(res.username);
        setState("done");
        toast.success(`@${res.username} conectada!`);
        setTimeout(() => navigate({
          to: "/dashboard"
        }), 1200);
      } catch (e) {
        const msg = e?.message ?? e?.toString?.() ?? "Erro desconhecido";
        console.error("[Callback] Server function error:", msg, e);
        setErrorMsg(msg);
        setState("error");
      }
    })();
  }, [connect, navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-card", children: [
    state === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-8 animate-spin text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Conectando sua conta do Instagram…" })
    ] }),
    state === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "size-10 text-destructive mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-semibold text-lg", children: "Erro na conexão" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-2 break-words", children: errorMsg }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-6 w-full", onClick: () => navigate({
        to: "/dashboard"
      }), children: "Voltar ao Dashboard" })
    ] }),
    state === "done" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-10 text-success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium", children: [
        "@",
        username,
        " conectada"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Redirecionando…" })
    ] })
  ] }) });
}
export {
  CallbackPage as component
};
