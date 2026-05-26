import { h as s, u as h, t as p, j as e } from "./index-CDMAuvnc.js";
import { u as b, c as j, g as N } from "./instagram.functions-DyDQqZvx.js";
import { B as C } from "./button-BCDv24mv.js";
import { L as k } from "./loader-circle-seK7i1c-.js";
import { C as v } from "./circle-alert-WZ3Kx3vi.js";
import { C as w } from "./circle-check-KfMURPra.js";
function I() {
  const [c, a] = s.useState("loading"),
    [x, n] = s.useState(null),
    [g, f] = s.useState(null),
    l = h(),
    m = b(j),
    d = s.useRef(!1);
  return (
    s.useEffect(() => {
      if (d.current) return;
      d.current = !0;
      const i = new URLSearchParams(window.location.search),
        t = i.get("error_description") ?? i.get("error"),
        o = i.get("code");
      if (
        (console.log("[Callback] Params:", { error: t, code: o ? `${o.slice(0, 20)}...` : null }),
        t)
      ) {
        (console.error("[Callback] OAuth error from Meta:", t), n(t), a("error"));
        return;
      }
      if (!o) {
        (console.error("[Callback] No code param in URL"),
          n("Nenhum código recebido do Meta."),
          a("error"));
        return;
      }
      (async () => {
        try {
          console.log("[Callback] Calling connectInstagramAccount...");
          const r = await m({ data: { code: o, redirectUri: N() } });
          (console.log("[Callback] Success:", r),
            f(r.username),
            a("done"),
            p.success(`@${r.username} conectada!`),
            setTimeout(() => l({ to: "/dashboard" }), 1200));
        } catch (r) {
          const u = r?.message ?? r?.toString?.() ?? "Erro desconhecido";
          (console.error("[Callback] Server function error:", u, r), n(u), a("error"));
        }
      })();
    }, [m, l]),
    e.jsx("div", {
      className: "min-h-screen flex items-center justify-center p-6",
      children: e.jsxs("div", {
        className: "w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-card",
        children: [
          c === "loading" &&
            e.jsxs("div", {
              className: "flex flex-col items-center gap-3 py-6",
              children: [
                e.jsx(k, { className: "size-8 animate-spin text-primary" }),
                e.jsx("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Conectando sua conta do Instagram…",
                }),
              ],
            }),
          c === "error" &&
            e.jsxs("div", {
              className: "text-center",
              children: [
                e.jsx(v, { className: "size-10 text-destructive mx-auto" }),
                e.jsx("h2", {
                  className: "mt-4 font-semibold text-lg",
                  children: "Erro na conexão",
                }),
                e.jsx("p", {
                  className: "text-sm text-muted-foreground mt-2 break-words",
                  children: x,
                }),
                e.jsx(C, {
                  className: "mt-6 w-full",
                  onClick: () => l({ to: "/dashboard" }),
                  children: "Voltar ao Dashboard",
                }),
              ],
            }),
          c === "done" &&
            e.jsxs("div", {
              className: "flex flex-col items-center gap-3 py-6",
              children: [
                e.jsx(w, { className: "size-10 text-success" }),
                e.jsxs("p", { className: "font-medium", children: ["@", g, " conectada"] }),
                e.jsx("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Redirecionando…",
                }),
              ],
            }),
        ],
      }),
    })
  );
}
export { I as component };
