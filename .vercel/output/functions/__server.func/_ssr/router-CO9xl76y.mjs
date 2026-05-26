import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { b as createRouter, a as createRootRouteWithContext, d as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, c as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { T as Toaster } from "../_libs/sonner.mjs";
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
const appCss = "/assets/styles-DfG0kxWi.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-gradient-brand", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Página não encontrada" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "A página que você procura não existe." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90", children: "Voltar" })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "Algo deu errado" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          router.invalidate();
          reset();
        },
        className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90",
        children: "Tentar novamente"
      }
    )
  ] }) });
}
const Route$8 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Reelary — Agende Reels do Instagram" },
      { name: "description", content: "Plataforma SaaS para agendar Reels do Instagram." },
      { property: "og:title", content: "Reelary — Agende Reels do Instagram" },
      { name: "twitter:title", content: "Reelary — Agende Reels do Instagram" },
      { property: "og:description", content: "Plataforma SaaS para agendar Reels do Instagram." },
      { name: "twitter:description", content: "Plataforma SaaS para agendar Reels do Instagram." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/98b006f9-9a00-4901-9584-49504efb6e26/id-preview-e3535d44--8f05f671-d947-4d26-87cc-74bca09bf695.lovable.app-1779211878909.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/98b006f9-9a00-4901-9584-49504efb6e26/id-preview-e3535d44--8f05f671-d947-4d26-87cc-74bca09bf695.lovable.app-1779211878909.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" }
    ],
    links: [{ rel: "stylesheet", href: appCss }]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "pt-BR", className: "dark", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$8.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { theme: "dark", position: "top-right", richColors: true })
  ] });
}
const $$splitComponentImporter$7 = () => import("./schedule-CZ7fRv6Y.mjs");
const Route$7 = createFileRoute("/schedule")({
  head: () => ({
    meta: [{
      title: "Novo Reel — Reelary"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./posts-pAVEXBH4.mjs");
const Route$6 = createFileRoute("/posts")({
  head: () => ({
    meta: [{
      title: "Agendados — Reelary"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard-BBtyNH2X.mjs");
const Route$5 = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{
      title: "Painel de Controle — Reelary"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./calendar-DVyxK6At.mjs");
const Route$4 = createFileRoute("/calendar")({
  head: () => ({
    meta: [{
      title: "Calendário Editorial — Reelary"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./accounts-B1vlx7-S.mjs");
const Route$3 = createFileRoute("/accounts")({
  head: () => ({
    meta: [{
      title: "Contas do Instagram — Reelary"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./index-Bu7sDh0J.mjs");
const Route$2 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Reelary — Agende Reels do Instagram em segundos"
    }, {
      name: "description",
      content: "Plataforma SaaS para agendar Reels do Instagram. Conecte sua conta, faça upload do vídeo e deixe que publicamos para você."
    }, {
      property: "og:title",
      content: "Reelary — Agende Reels do Instagram"
    }, {
      property: "og:description",
      content: "Conecte, agende e publique Reels sem esforço."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./auth.index-DnahkIiG.mjs");
const Route$1 = createFileRoute("/auth/")({
  head: () => ({
    meta: [{
      title: "Acessar o Reelary — Agendador de Reels"
    }, {
      name: "description",
      content: "Faça login ou crie sua conta para começar a agendar seus Reels do Instagram."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./auth.instagram.callback-DKjLktsK.mjs");
const Route = createFileRoute("/auth/instagram/callback")({
  head: () => ({
    meta: [{
      title: "Conectando Instagram — Reelary"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const ScheduleRoute = Route$7.update({
  id: "/schedule",
  path: "/schedule",
  getParentRoute: () => Route$8
});
const PostsRoute = Route$6.update({
  id: "/posts",
  path: "/posts",
  getParentRoute: () => Route$8
});
const DashboardRoute = Route$5.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$8
});
const CalendarRoute = Route$4.update({
  id: "/calendar",
  path: "/calendar",
  getParentRoute: () => Route$8
});
const AccountsRoute = Route$3.update({
  id: "/accounts",
  path: "/accounts",
  getParentRoute: () => Route$8
});
const IndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$8
});
const AuthIndexRoute = Route$1.update({
  id: "/auth/",
  path: "/auth/",
  getParentRoute: () => Route$8
});
const AuthInstagramCallbackRoute = Route.update({
  id: "/auth/instagram/callback",
  path: "/auth/instagram/callback",
  getParentRoute: () => Route$8
});
const rootRouteChildren = {
  IndexRoute,
  AccountsRoute,
  CalendarRoute,
  DashboardRoute,
  PostsRoute,
  ScheduleRoute,
  AuthIndexRoute,
  AuthInstagramCallbackRoute
};
const routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router;
};
export {
  getRouter
};
