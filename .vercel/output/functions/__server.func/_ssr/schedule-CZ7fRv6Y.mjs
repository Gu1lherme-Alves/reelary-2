import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-DLagrhjI.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { L as Label, I as Input } from "./label-BJaHSwYl.mjs";
import { T as Textarea } from "./textarea-F69quoCd.mjs";
import { S as Select, c as SelectTrigger, d as SelectValue, a as SelectContent, b as SelectItem } from "./select-aG-zsZPc.mjs";
import { s as supabase } from "./client-BME84eyn.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { V as Video, U as Upload, n as LoaderCircle } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-label.mjs";
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
function SchedulePage() {
  const [accounts, setAccounts] = reactExports.useState([]);
  const [accountId, setAccountId] = reactExports.useState("");
  const [caption, setCaption] = reactExports.useState("");
  const [scheduledAt, setScheduledAt] = reactExports.useState("");
  const [file, setFile] = reactExports.useState(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    supabase.from("instagram_accounts").select("id, username").order("created_at", {
      ascending: false
    }).then(({
      data
    }) => setAccounts(data ?? []));
  }, []);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !accountId || !scheduledAt) return;
    setSubmitting(true);
    try {
      const {
        data: userData
      } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${uid}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("reels").upload(path, file, {
        contentType: file.type || "video/mp4"
      });
      if (up.error) throw up.error;
      const {
        data: pub
      } = supabase.storage.from("reels").getPublicUrl(path);
      const {
        error
      } = await supabase.from("scheduled_posts").insert({
        user_id: uid,
        instagram_account_id: accountId,
        video_url: pub.publicUrl,
        caption,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: "pending"
      });
      if (error) throw error;
      toast.success("Reel agendado!");
      navigate({
        to: "/posts"
      });
    } catch (err) {
      toast.error(err.message ?? "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  }
  const minDateTime = new Date(Date.now() + 5 * 6e4).toISOString().slice(0, 16);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Agendar Reel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Envie o vídeo, escolha quando publicar." })
    ] }),
    accounts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "Nenhuma conta conectada" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Conecte uma conta do Instagram primeiro." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-4", onClick: () => navigate({
        to: "/dashboard"
      }), children: "Ir para contas" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Vídeo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "video/*", className: "sr-only", required: true, onChange: (e) => setFile(e.target.files?.[0] ?? null) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition p-8 text-center", children: file ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "size-5 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: file.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              (file.size / 1024 / 1024).toFixed(1),
              " MB"
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Clique para enviar um vídeo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "MP4, MOV — até 100MB" })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Conta" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: accountId, onValueChange: setAccountId, required: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Escolha uma conta" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: accounts.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: a.id, children: [
            "@",
            a.username
          ] }, a.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "caption", children: "Legenda" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "caption", value: caption, onChange: (e) => setCaption(e.target.value), rows: 4, placeholder: "Escreva a legenda do seu Reel… #hashtags" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "scheduled", children: "Data e hora" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "scheduled", type: "datetime-local", required: true, min: minDateTime, value: scheduledAt, onChange: (e) => setScheduledAt(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: submitting, className: "w-full bg-gradient-brand text-primary-foreground border-0 hover:opacity-90 h-11", children: submitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
        " Enviando…"
      ] }) : "Agendar publicação" })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SchedulePage, {}) });
export {
  SplitComponent as component
};
