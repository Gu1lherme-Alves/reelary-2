import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-DLagrhjI.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { s as supabase } from "./client-BME84eyn.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import {
  p as Plus,
  a as CalendarClock,
  k as CircleX,
  i as CircleCheck,
  l as Clock,
  T as Trash2,
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
const statusMeta = {
  pending: {
    label: "Agendado",
    icon: Clock,
    cls: "bg-warning/15 text-warning border-warning/30",
  },
  published: {
    label: "Publicado",
    icon: CircleCheck,
    cls: "bg-success/15 text-success border-success/30",
  },
  failed: {
    label: "Falhou",
    icon: CircleX,
    cls: "bg-destructive/15 text-destructive border-destructive/30",
  },
};
function PostsPage() {
  const [posts, setPosts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  async function load() {
    const { data, error } = await supabase
      .from("scheduled_posts")
      .select(
        "id, caption, video_url, scheduled_at, status, error_message, instagram_accounts(username)",
      )
      .order("scheduled_at", {
        ascending: true,
      });
    if (error) toast.error(error.message);
    setPosts(data ?? []);
    setLoading(false);
  }
  reactExports.useEffect(() => {
    load();
  }, []);
  async function remove(id) {
    if (!confirm("Excluir este agendamento?")) return;
    const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agendamento excluído");
    load();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
        className: "flex items-center justify-between mb-8",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", {
                className: "text-3xl font-bold tracking-tight",
                children: "Reels agendados",
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                className: "text-muted-foreground mt-1",
                children: "Acompanhe o status de cada publicação",
              }),
            ],
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, {
            to: "/schedule",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, {
              className: "bg-gradient-brand text-primary-foreground border-0 hover:opacity-90",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
                " Novo Reel",
              ],
            }),
          }),
        ],
      }),
      loading
        ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
            className: "space-y-3",
            children: [1, 2, 3].map((i) =>
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                { className: "h-24 rounded-2xl bg-card animate-pulse" },
                i,
              ),
            ),
          })
        : posts.length === 0
          ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
              className:
                "rounded-2xl border border-dashed border-border/80 p-16 text-center bg-card/30",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                  className:
                    "size-14 rounded-2xl bg-secondary grid place-items-center mx-auto mb-4",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, {
                    className: "size-7 text-muted-foreground",
                  }),
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", {
                  className: "font-semibold text-lg",
                  children: "Nada agendado",
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                  className: "text-muted-foreground text-sm mt-2",
                  children: "Crie seu primeiro agendamento de Reel.",
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Link, {
                  to: "/schedule",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, {
                    className: "mt-6 bg-gradient-brand text-primary-foreground border-0",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
                      " Agendar Reel",
                    ],
                  }),
                }),
              ],
            })
          : /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
              className: "space-y-3",
              children: posts.map((p) => {
                const meta = statusMeta[p.status];
                const Icon = meta.icon;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className:
                      "rounded-2xl border border-border/60 bg-card p-4 flex gap-4 shadow-card",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("video", {
                        src: p.video_url,
                        className: "size-24 rounded-xl object-cover bg-background shrink-0",
                        muted: true,
                      }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                        className: "flex-1 min-w-0",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                          className: "flex items-start justify-between gap-3",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                              className: "min-w-0",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                  className:
                                    "flex items-center gap-2 text-xs text-muted-foreground",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                                      className: "font-medium text-foreground",
                                      children: ["@", p.instagram_accounts?.username ?? "—"],
                                    }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      children: "•",
                                    }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      children: new Date(p.scheduled_at).toLocaleString("pt-BR", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      }),
                                    }),
                                  ],
                                }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                                  className: "mt-1.5 text-sm line-clamp-2 text-foreground/90",
                                  children:
                                    p.caption ||
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className: "text-muted-foreground italic",
                                      children: "Sem legenda",
                                    }),
                                }),
                                p.error_message &&
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                                    className: "mt-1 text-xs text-destructive",
                                    children: p.error_message,
                                  }),
                              ],
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                              className: "flex items-center gap-2 shrink-0",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                                  className: `inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${meta.cls}`,
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, {
                                      className: "size-3",
                                    }),
                                    " ",
                                    meta.label,
                                  ],
                                }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
                                  variant: "ghost",
                                  size: "icon",
                                  onClick: () => remove(p.id),
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, {
                                    className:
                                      "size-4 text-muted-foreground hover:text-destructive",
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    ],
                  },
                  p.id,
                );
              }),
            }),
    ],
  });
}
const SplitComponent = () =>
  /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, {
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(PostsPage, {}),
  });
export { SplitComponent as component };
