import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell } from "./AppShell-DLagrhjI.mjs";
import { B as Button, c as cn } from "./button-DjOZMqFS.mjs";
import { L as Label, I as Input } from "./label-BJaHSwYl.mjs";
import { T as Textarea } from "./textarea-F69quoCd.mjs";
import {
  S as Select,
  c as SelectTrigger,
  d as SelectValue,
  a as SelectContent,
  b as SelectItem,
} from "./select-aG-zsZPc.mjs";
import {
  R as Root,
  C as Close,
  P as Portal,
  a as Content,
  T as Title,
  D as Description,
  O as Overlay,
} from "../_libs/radix-ui__react-dialog.mjs";
import { s as supabase } from "./client-BME84eyn.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import {
  p as Plus,
  C as Calendar,
  d as ChevronLeft,
  e as ChevronRight,
  V as Video,
  T as Trash2,
  h as CircleAlert,
  X,
  S as Sparkles,
  U as Upload,
  n as LoaderCircle,
  P as Play,
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
const Dialog = Root;
const DialogPortal = Portal;
const DialogClose = Close;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) =>
  /* @__PURE__ */ jsxRuntimeExports.jsx(Overlay, {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    ),
    ...props,
  }),
);
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) =>
  /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, {
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Content, {
        ref,
        className: cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
          className,
        ),
        ...props,
        children: [
          children,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, {
            className:
              "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                className: "sr-only",
                children: "Close",
              }),
            ],
          }),
        ],
      }),
    ],
  }),
);
DialogContent.displayName = Content.displayName;
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) =>
  /* @__PURE__ */ jsxRuntimeExports.jsx(Title, {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props,
  }),
);
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) =>
  /* @__PURE__ */ jsxRuntimeExports.jsx(Description, {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props,
  }),
);
DialogDescription.displayName = Description.displayName;
function CalendarPage() {
  const [currentMonth, setCurrentMonth] = reactExports.useState(/* @__PURE__ */ new Date());
  const [selectedDate, setSelectedDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [accounts, setAccounts] = reactExports.useState([]);
  const [posts, setPosts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showModal, setShowModal] = reactExports.useState(false);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [accountId, setAccountId] = reactExports.useState("");
  const [caption, setCaption] = reactExports.useState("");
  const [scheduledAt, setScheduledAt] = reactExports.useState("");
  const [videoFile, setVideoFile] = reactExports.useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = reactExports.useState(null);
  const [isPlaying, setIsPlaying] = reactExports.useState(false);
  const videoRef = reactExports.useRef(null);
  const navigate = useNavigate();
  async function loadData() {
    try {
      const { data: accs } = await supabase
        .from("instagram_accounts")
        .select("id, username")
        .order("created_at", {
          ascending: false,
        });
      setAccounts(accs || []);
      const activeId = localStorage.getItem("active_ig_account_id");
      if (activeId) {
        setAccountId(activeId);
      } else if (accs && accs.length > 0) {
        setAccountId(accs[0].id);
      }
      const { data: postsData } = await supabase
        .from("scheduled_posts")
        .select(
          "id, caption, video_url, scheduled_at, status, instagram_account_id, instagram_accounts(username)",
        )
        .order("scheduled_at", {
          ascending: true,
        });
      setPosts(postsData || []);
    } catch (err) {
      toast.error(err.message || "Erro ao carregar dados do calendário");
    } finally {
      setLoading(false);
    }
  }
  reactExports.useEffect(() => {
    loadData();
    const syncActiveAccount = () => {
      const activeId = localStorage.getItem("active_ig_account_id");
      if (activeId) setAccountId(activeId);
    };
    window.addEventListener("active-account-changed", syncActiveAccount);
    return () => window.removeEventListener("active-account-changed", syncActiveAccount);
  }, []);
  reactExports.useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setIsPlaying(false);
      toast.success("Vídeo carregado com sucesso para visualização.");
    }
  };
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => console.error("Error playing video:", err));
    }
    setIsPlaying(!isPlaying);
  };
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !accountId || !scheduledAt) {
      toast.error("Por favor, preencha todos os campos e selecione um vídeo.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada. Faça login novamente.");
      const ext = videoFile.name.split(".").pop() ?? "mp4";
      const path = `${uid}/${Date.now()}.${ext}`;
      const uploadResult = await supabase.storage.from("reels").upload(path, videoFile, {
        contentType: videoFile.type || "video/mp4",
      });
      if (uploadResult.error) throw uploadResult.error;
      const { data: publicUrlData } = supabase.storage.from("reels").getPublicUrl(path);
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: uid,
        instagram_account_id: accountId,
        video_url: publicUrlData.publicUrl,
        caption,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: "pending",
      });
      if (error) throw error;
      toast.success("Reel agendado com sucesso!");
      setCaption("");
      setVideoFile(null);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoPreviewUrl(null);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Ocorreu um erro ao agendar o Reel.");
    } finally {
      setSubmitting(false);
    }
  };
  const deletePost = async (id) => {
    if (!confirm("Excluir este agendamento de Reel definitivamente?")) return;
    try {
      const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Agendamento excluído.");
      loadData();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir agendamento.");
    }
  };
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevMonthPadding = Array.from(
    {
      length: firstDayOfWeek,
    },
    (_, i) => {
      const day = prevMonthDays - firstDayOfWeek + i + 1;
      return {
        day,
        isCurrentMonth: false,
        date: new Date(year, month - 1, day),
      };
    },
  );
  const currentMonthDays = Array.from(
    {
      length: daysInMonth,
    },
    (_, i) => {
      const day = i + 1;
      return {
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      };
    },
  );
  const totalSlots = prevMonthPadding.length + currentMonthDays.length;
  const remainingSlots = (7 - (totalSlots % 7)) % 7;
  const nextMonthPadding = Array.from(
    {
      length: remainingSlots,
    },
    (_, i) => {
      const day = i + 1;
      return {
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day),
      };
    },
  );
  const allCalendarDays = [...prevMonthPadding, ...currentMonthDays, ...nextMonthPadding];
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const dayOfWeekNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };
  const postsOnSelectedDay = posts.filter((p) => isSameDay(new Date(p.scheduled_at), selectedDate));
  const minDateTime = new Date(Date.now() + 5 * 6e4).toISOString().slice(0, 16);
  const openScheduleForDay = (date) => {
    setSelectedDate(date);
    const futureDate = new Date(date);
    const nowTime = /* @__PURE__ */ new Date();
    futureDate.setHours(nowTime.getHours() + 1, 0, 0, 0);
    const timezoneOffset = futureDate.getTimezoneOffset() * 6e4;
    const localISODate = new Date(futureDate.getTime() - timezoneOffset).toISOString().slice(0, 16);
    setScheduledAt(localISODate);
    setShowModal(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
    className: "space-y-6",
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
        className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", {
                className: "text-3xl font-extrabold tracking-tight",
                children: "Calendário Editorial",
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                className: "text-muted-foreground mt-1.5",
                children:
                  "Visualize o fluxo do seu conteúdo e agende novas postagens clicando nos dias correspondentes.",
              }),
            ],
          }),
          accounts.length > 0 &&
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, {
              onClick: () => openScheduleForDay(selectedDate),
              className:
                "bg-gradient-brand text-primary-foreground border-0 hover:opacity-95 font-semibold shadow-glow shrink-0",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 mr-2" }),
                " Agendar Reel",
              ],
            }),
        ],
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
        className: "grid gap-6 lg:grid-cols-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
            className:
              "lg:col-span-2 rounded-2xl border border-border/50 bg-card/45 p-5 shadow-card flex flex-col justify-between",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                    className: "flex items-center justify-between mb-6",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", {
                        className: "font-extrabold text-lg flex items-center gap-2",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, {
                            className: "size-5 text-primary",
                          }),
                          monthNames[month],
                          " ",
                          year,
                        ],
                      }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                        className: "flex gap-1",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
                            variant: "outline",
                            size: "icon",
                            onClick: () => navigateMonth("prev"),
                            className: "size-8 rounded-lg hover:bg-secondary cursor-pointer",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, {
                              className: "size-4",
                            }),
                          }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
                            variant: "outline",
                            size: "icon",
                            onClick: () => navigateMonth("next"),
                            className: "size-8 rounded-lg hover:bg-secondary cursor-pointer",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, {
                              className: "size-4",
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-7 gap-1 text-center mb-2",
                    children: dayOfWeekNames.map((name) =>
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "div",
                        {
                          className: "text-xs font-bold text-muted-foreground py-1.5",
                          children: name,
                        },
                        name,
                      ),
                    ),
                  }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                    className: "grid grid-cols-7 gap-2",
                    children: allCalendarDays.map((cell, idx) => {
                      const dayPosts = posts.filter((p) =>
                        isSameDay(new Date(p.scheduled_at), cell.date),
                      );
                      const isSelected = isSameDay(cell.date, selectedDate);
                      const isTodayDate = isSameDay(cell.date, /* @__PURE__ */ new Date());
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          onClick: () => setSelectedDate(cell.date),
                          className: `aspect-square rounded-xl p-2 flex flex-col justify-between items-start transition cursor-pointer border ${!cell.isCurrentMonth ? "text-muted-foreground/45 border-transparent bg-transparent" : isSelected ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" : isTodayDate ? "bg-secondary/40 border-primary/45 font-bold" : "bg-card border-border/45 hover:border-muted-foreground/45"}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                              className: "text-sm font-semibold",
                              children: cell.day,
                            }),
                            dayPosts.length > 0 &&
                              /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                                className: "w-full flex flex-wrap gap-1 justify-end mt-1",
                                children: dayPosts.map((p, pIdx) => {
                                  const statusColors = {
                                    pending: "bg-warning",
                                    published: "bg-success",
                                    failed: "bg-destructive",
                                  };
                                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "span",
                                    {
                                      className: `size-2 rounded-full ${statusColors[p.status] || "bg-primary"}`,
                                      title: `${p.status === "published" ? "Publicado" : p.status === "failed" ? "Falhou" : "Agendado"}: @${p.instagram_accounts?.username || "Reel"}`,
                                    },
                                    pIdx,
                                  );
                                }),
                              }),
                          ],
                        },
                        idx,
                      );
                    }),
                  }),
                ],
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                className:
                  "mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground flex gap-4 justify-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                    className: "flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                        className: "size-2 rounded-full bg-warning",
                      }),
                      " Agendado",
                    ],
                  }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                    className: "flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                        className: "size-2 rounded-full bg-success",
                      }),
                      " Publicado",
                    ],
                  }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                    className: "flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                        className: "size-2 rounded-full bg-destructive",
                      }),
                      " Falhou",
                    ],
                  }),
                ],
              }),
            ],
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
            className:
              "rounded-2xl border border-border/50 bg-card/45 p-5 shadow-card flex flex-col justify-between",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", {
                    className: "font-extrabold text-lg border-b border-border/40 pb-4 mb-4",
                    children: [
                      "Reels para o dia ",
                      selectedDate.toLocaleDateString("pt-BR", {
                        dateStyle: "medium",
                      }),
                    ],
                  }),
                  loading
                    ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                        className: "space-y-4",
                        children: [1, 2].map((i) =>
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            { className: "h-20 bg-secondary animate-pulse rounded-xl" },
                            i,
                          ),
                        ),
                      })
                    : postsOnSelectedDay.length === 0
                      ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                          className:
                            "text-center py-12 px-4 border border-dashed border-border/60 rounded-xl bg-card/10",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Video, {
                              className: "size-8 text-muted-foreground/60 mx-auto mb-3",
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                              className: "text-sm text-muted-foreground",
                              children: "Nenhum Reel agendado para este dia.",
                            }),
                            accounts.length > 0
                              ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
                                  onClick: () => openScheduleForDay(selectedDate),
                                  size: "sm",
                                  className:
                                    "mt-4 border-primary text-primary hover:bg-primary/5 bg-transparent border rounded-lg text-xs",
                                  children: "Agendar para este dia",
                                })
                              : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
                                  onClick: () =>
                                    navigate({
                                      to: "/accounts",
                                    }),
                                  size: "sm",
                                  className:
                                    "mt-4 border-dashed border-muted-foreground text-muted-foreground bg-transparent border rounded-lg text-xs",
                                  children: "Vincular conta primeiro",
                                }),
                          ],
                        })
                      : /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                          className: "space-y-4 max-h-[350px] overflow-y-auto pr-1.5",
                          children: postsOnSelectedDay.map((post) => {
                            const statusLabel = {
                              pending: {
                                text: "Agendado",
                                cls: "bg-warning/15 text-warning border-warning/30",
                              },
                              published: {
                                text: "Publicado",
                                cls: "bg-success/15 text-success border-success/30",
                              },
                              failed: {
                                text: "Falhou",
                                cls: "bg-destructive/15 text-destructive border-destructive/30",
                              },
                            };
                            const st = statusLabel[post.status] || {
                              text: "Pendente",
                              cls: "bg-secondary text-foreground",
                            };
                            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "div",
                              {
                                className:
                                  "p-3.5 rounded-xl bg-card border border-border/50 hover:bg-card/75 transition shadow-sm flex gap-3 relative group",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("video", {
                                    src: post.video_url,
                                    className:
                                      "size-16 rounded-lg object-cover bg-background shrink-0",
                                    muted: true,
                                  }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                    className:
                                      "min-w-0 flex-1 flex flex-col justify-between py-0.5",
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                        children: [
                                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                            className: "flex items-center gap-1.5 text-[10px]",
                                            children: [
                                              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", {
                                                className: "text-primary truncate",
                                                children: [
                                                  "@",
                                                  post.instagram_accounts?.username || "instagram",
                                                ],
                                              }),
                                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                                className: "text-muted-foreground",
                                                children: "•",
                                              }),
                                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                                className: "text-muted-foreground font-semibold",
                                                children: new Date(
                                                  post.scheduled_at,
                                                ).toLocaleTimeString("pt-BR", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                }),
                                              }),
                                            ],
                                          }),
                                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                                            className:
                                              "text-xs text-foreground/80 mt-1 line-clamp-1",
                                            children:
                                              post.caption ||
                                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                                className: "text-muted-foreground italic",
                                                children: "Sem legenda",
                                              }),
                                          }),
                                        ],
                                      }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                                        className: "flex items-center gap-2 mt-2",
                                        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                          className: `inline-flex items-center text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${st.cls}`,
                                          children: st.text,
                                        }),
                                      }),
                                    ],
                                  }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
                                    variant: "ghost",
                                    size: "icon",
                                    onClick: () => deletePost(post.id),
                                    className:
                                      "size-7 text-muted-foreground hover:text-destructive absolute right-2 bottom-2 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer",
                                    title: "Excluir",
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, {
                                      className: "size-3.5",
                                    }),
                                  }),
                                ],
                              },
                              post.id,
                            );
                          }),
                        }),
                ],
              }),
              accounts.length === 0 &&
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                  className:
                    "rounded-xl border border-warning/30 bg-warning/5 p-4 flex gap-3 text-xs mt-6",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, {
                      className: "size-4 text-warning shrink-0 mt-0.5",
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", {
                      className: "text-muted-foreground",
                      children: [
                        "Você deve ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, {
                          to: "/accounts",
                          className: "text-warning underline font-semibold",
                          children: "conectar uma conta do Instagram",
                        }),
                        " na aba de Contas antes de poder agendar seus Reels.",
                      ],
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, {
        open: showModal,
        onOpenChange: setShowModal,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, {
          className:
            "sm:max-w-4xl bg-card border border-border/60 max-h-[90vh] overflow-y-auto rounded-2xl grid md:grid-cols-2 gap-6 p-6",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogClose, {
              className:
                "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                  className: "sr-only",
                  children: "Fechar",
                }),
              ],
            }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
              className: "space-y-5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, {
                      className: "text-xl font-extrabold flex items-center gap-2 text-foreground",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, {
                          className: "size-5 text-primary animate-pulse",
                        }),
                        "Agendar Novo Reel",
                      ],
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, {
                      className: "text-xs text-muted-foreground mt-1",
                      children:
                        "Forneça o arquivo de vídeo (.mp4/mov), escreva a legenda e selecione o horário ideal.",
                    }),
                  ],
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("form", {
                  onSubmit: handleScheduleSubmit,
                  className: "space-y-4",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                      className: "space-y-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, {
                          className: "text-sm font-bold",
                          children: "Arquivo de Vídeo",
                        }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", {
                          className: "block cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("input", {
                              type: "file",
                              accept: "video/*",
                              className: "sr-only",
                              required: true,
                              onChange: handleVideoChange,
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                              className:
                                "rounded-xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-secondary/10 hover:bg-secondary/20 transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px]",
                              children: videoFile
                                ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                    className: "flex flex-col items-center gap-2 text-foreground",
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(Video, {
                                        className: "size-6 text-primary",
                                      }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                        className: "font-semibold text-xs truncate max-w-[250px]",
                                        children: videoFile.name,
                                      }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                                        className: "text-[10px] text-muted-foreground",
                                        children: [
                                          (videoFile.size / 1024 / 1024).toFixed(1),
                                          " MB",
                                        ],
                                      }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                        className:
                                          "text-[10px] text-primary underline mt-1 font-medium",
                                        children: "Trocar arquivo",
                                      }),
                                    ],
                                  })
                                : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                    className:
                                      "flex flex-col items-center gap-1.5 text-muted-foreground",
                                    children: [
                                      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, {
                                        className: "size-6 text-muted-foreground/60",
                                      }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                        className: "text-xs font-semibold text-foreground",
                                        children: "Clique para enviar um vídeo",
                                      }),
                                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                        className: "text-[10px]",
                                        children: "MP4, MOV (até 100MB)",
                                      }),
                                    ],
                                  }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                      className: "space-y-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, {
                          htmlFor: "modalAccount",
                          className: "text-sm font-bold",
                          children: "Conta do Instagram",
                        }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, {
                          value: accountId,
                          onValueChange: setAccountId,
                          required: true,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, {
                              id: "modalAccount",
                              className:
                                "bg-secondary/40 border-border/60 rounded-xl h-10 font-medium",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {
                                placeholder: "Selecione a conta de postagem",
                              }),
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, {
                              className: "bg-card border-border/60",
                              children: accounts.map((a) =>
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                  SelectItem,
                                  {
                                    value: a.id,
                                    className: "cursor-pointer font-medium",
                                    children: ["📸 @", a.username],
                                  },
                                  a.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                      className: "space-y-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, {
                          htmlFor: "modalScheduled",
                          className: "text-sm font-bold",
                          children: "Data e Hora de Publicação",
                        }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, {
                          id: "modalScheduled",
                          type: "datetime-local",
                          required: true,
                          min: minDateTime,
                          value: scheduledAt,
                          onChange: (e) => setScheduledAt(e.target.value),
                          className: "bg-secondary/40 border-border/60 rounded-xl h-10",
                        }),
                      ],
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                      className: "space-y-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, {
                          htmlFor: "modalCaption",
                          className: "text-sm font-bold",
                          children: "Legenda do Post",
                        }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, {
                          id: "modalCaption",
                          value: caption,
                          onChange: (e) => setCaption(e.target.value),
                          rows: 4,
                          placeholder:
                            "Escreva a legenda incrível para o seu Reels... Insira #hashtags e marque @amigos.",
                          className: "bg-secondary/40 border-border/60 rounded-xl",
                        }),
                      ],
                    }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, {
                      type: "submit",
                      disabled: submitting,
                      className:
                        "w-full bg-gradient-brand text-primary-foreground border-0 hover:opacity-95 font-bold h-11 transition shadow-glow rounded-xl",
                      children: submitting
                        ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                            className: "flex items-center gap-2 justify-center",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, {
                                className: "size-4 animate-spin",
                              }),
                              " Uploading & Agendando...",
                            ],
                          })
                        : "Concluir Agendamento",
                    }),
                  ],
                }),
              ],
            }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
              className:
                "flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border/50 pt-6 md:pt-0 md:pl-6",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", {
                  className:
                    "text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider",
                  children: "PRÉ-VISUALIZAÇÃO EM TEMPO REAL",
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                  className:
                    "w-[280px] h-[550px] rounded-[40px] border-[10px] border-secondary bg-black shadow-2xl relative overflow-hidden flex flex-col select-none ring-4 ring-card-foreground/5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                      className:
                        "absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-20 flex justify-center items-center gap-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                          className: "size-1 rounded-full bg-neutral-800",
                        }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                          className: "w-10 h-1 bg-neutral-900 rounded-full",
                        }),
                      ],
                    }),
                    videoPreviewUrl
                      ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                          className:
                            "relative w-full h-full bg-neutral-950 flex items-center justify-center group/video",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("video", {
                              ref: videoRef,
                              src: videoPreviewUrl,
                              className: "w-full h-full object-cover",
                              loop: true,
                              playsInline: true,
                              onClick: togglePlay,
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                              className:
                                "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none z-10",
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                              className:
                                "absolute bottom-5 left-4 right-10 text-white z-15 space-y-2 pointer-events-none",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                  className: "flex items-center gap-2",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                                      className:
                                        "size-7 rounded-full bg-gradient-brand grid place-items-center font-bold text-[10px] text-white",
                                      children: "R",
                                    }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", {
                                      className: "font-semibold text-xs",
                                      children: [
                                        "@",
                                        accounts.find((a) => a.id === accountId)?.username ||
                                          "usuario",
                                      ],
                                    }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className:
                                        "text-[10px] bg-white/20 border border-white/30 px-1.5 py-0.5 rounded-md font-bold",
                                      children: "Seguir",
                                    }),
                                  ],
                                }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                                  className:
                                    "text-[11px] leading-relaxed line-clamp-3 text-neutral-100/90 font-medium",
                                  children:
                                    caption ||
                                    "A legenda do seu Reels aparecerá aqui quando você começar a digitar no formulário ao lado...",
                                }),
                              ],
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                              className:
                                "absolute bottom-16 right-2 text-white z-15 flex flex-col gap-4 items-center pointer-events-none",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                  className: "flex flex-col items-center gap-0.5",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className: "text-base",
                                      children: "❤️",
                                    }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className: "text-[8px]",
                                      children: "Curtir",
                                    }),
                                  ],
                                }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                  className: "flex flex-col items-center gap-0.5",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className: "text-base",
                                      children: "💬",
                                    }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className: "text-[8px]",
                                      children: "Comentar",
                                    }),
                                  ],
                                }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                                  className: "flex flex-col items-center gap-0.5",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className: "text-base",
                                      children: "✈️",
                                    }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                                      className: "text-[8px]",
                                      children: "Enviar",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("button", {
                              onClick: togglePlay,
                              className:
                                "absolute inset-0 flex items-center justify-center z-15 cursor-pointer bg-black/10 hover:bg-black/25",
                              children:
                                !isPlaying &&
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                                  className:
                                    "size-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white scale-90 hover:scale-100 transition animate-in zoom-in-50 duration-200",
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, {
                                    className: "size-6 fill-white text-white translate-x-0.5",
                                  }),
                                }),
                            }),
                          ],
                        })
                      : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                          className:
                            "w-full h-full bg-neutral-900/95 flex flex-col items-center justify-center text-center p-6 space-y-4",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("div", {
                              className:
                                "size-16 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground animate-pulse",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Video, {
                                className: "size-8",
                              }),
                            }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", {
                              className: "space-y-1",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("h5", {
                                  className: "font-bold text-sm text-foreground",
                                  children: "Aguardando Vídeo",
                                }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("p", {
                                  className: "text-xs text-muted-foreground leading-relaxed",
                                  children:
                                    "Faça o upload de um arquivo de vídeo para vê-lo tocar ao vivo neste mockup do Instagram.",
                                }),
                              ],
                            }),
                          ],
                        }),
                  ],
                }),
                videoPreviewUrl &&
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", {
                    className: "text-[10px] text-muted-foreground mt-3 flex items-center gap-1",
                    children:
                      "💡 Clique em qualquer lugar no vídeo para reproduzir/pausar localmente.",
                  }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
const SplitComponent = () =>
  /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, {
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarPage, {}),
  });
export { SplitComponent as component };
