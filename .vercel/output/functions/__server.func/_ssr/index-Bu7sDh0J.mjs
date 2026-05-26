import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { u as useAuth } from "./use-auth-C2Kl6jq7.mjs";
import {
  S as Sparkles,
  A as ArrowRight,
  I as Instagram,
  a as CalendarClock,
  Z as Zap,
} from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./client-BME84eyn.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (!loading && user)
      navigate({
        to: "/dashboard",
      });
  }, [user, loading, navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
    className: "min-h-screen relative overflow-hidden",
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
        className: "absolute inset-0 -z-10",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
            className: "absolute -top-40 -left-40 size-[600px] rounded-full bg-primary/20 blur-3xl",
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
            className:
              "absolute -bottom-40 -right-40 size-[600px] rounded-full bg-accent/20 blur-3xl",
          }),
        ],
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", {
        className: "mx-auto max-w-6xl px-6 h-16 flex items-center justify-between",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                className:
                  "size-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, {
                  className: "size-4 text-primary-foreground",
                }),
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                className: "font-display text-lg font-semibold",
                children: "Reelary",
              }),
            ],
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, {
            to: "/auth",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
              variant: "ghost",
              size: "sm",
              children: "Entrar",
            }),
          }),
        ],
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", {
        className: "mx-auto max-w-4xl px-6 pt-24 pb-20 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
            className:
              "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground mb-8",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                className: "size-1.5 rounded-full bg-success",
              }),
              " Beta privado aberto",
            ],
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", {
            className: "text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight",
            children: [
              "Agende seus ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                className: "text-gradient-brand",
                children: "Reels",
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              "sem abrir o Instagram.",
            ],
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
            className: "mt-6 text-lg text-muted-foreground max-w-xl mx-auto",
            children:
              "Conecte sua conta, faça upload do vídeo, escolha a hora — e a gente publica. Calendário de conteúdo profissional para criadores que vivem de Reels.",
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
            className: "mt-10 flex items-center justify-center gap-3",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, {
              to: "/auth",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, {
                size: "lg",
                className:
                  "bg-gradient-brand text-primary-foreground border-0 shadow-glow hover:opacity-90 h-12 px-6",
                children: [
                  "Começar grátis ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "size-4" }),
                ],
              }),
            }),
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
            className: "mt-24 grid gap-4 md:grid-cols-3 text-left",
            children: [
              {
                icon: Instagram,
                title: "Conecte em 1 clique",
                desc: "Login direto via Meta. Sem complicações.",
              },
              {
                icon: CalendarClock,
                title: "Calendário inteligente",
                desc: "Visualize, edite e reorganize tudo.",
              },
              {
                icon: Zap,
                title: "Publicação automática",
                desc: "Configure e esqueça. Publicamos por você.",
              },
            ].map((f) =>
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className:
                    "rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur shadow-card",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                      className: "size-10 rounded-lg bg-secondary grid place-items-center mb-4",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(f.icon, {
                        className: "size-5 text-primary",
                      }),
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", {
                      className: "font-semibold mb-1",
                      children: f.title,
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                      className: "text-sm text-muted-foreground",
                      children: f.desc,
                    }),
                  ],
                },
                f.title,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
export { Landing as component };
