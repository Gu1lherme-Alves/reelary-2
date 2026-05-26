import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useNavigate, e as useRouterState, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-BME84eyn.mjs";
import { B as Button, c as cn } from "./button-DjOZMqFS.mjs";
import { u as useAuth } from "./use-auth-C2Kl6jq7.mjs";
import { c as Root2, T as Trigger, P as Portal2, a as Content2, L as Label2, S as Separator2, I as Item2, e as SubTrigger2, d as SubContent2, C as CheckboxItem2, b as ItemIndicator2, R as RadioItem2 } from "../_libs/radix-ui__react-dropdown-menu.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as Sparkles, d as ChevronLeft, e as ChevronRight, L as LayoutDashboard, C as Calendar, I as Instagram, j as CircleUserRound, o as LogOut, c as ChevronDown, b as Check, g as Circle } from "../_libs/lucide-react.mjs";
const DropdownMenu = Root2;
const DropdownMenuTrigger = Trigger;
const DropdownMenuSubTrigger = reactExports.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SubTrigger2,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
const DropdownMenuSubContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SubContent2,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = SubContent2.displayName;
const DropdownMenuContent = reactExports.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = Content2.displayName;
const DropdownMenuItem = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Item2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = Item2.displayName;
const DropdownMenuCheckboxItem = reactExports.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  CheckboxItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
const DropdownMenuRadioItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  RadioItem2,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ItemIndicator2, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
const DropdownMenuLabel = reactExports.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Label2,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = Label2.displayName;
const DropdownMenuSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Separator2,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = Separator2.displayName;
function AppShell({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [collapsed, setCollapsed] = reactExports.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });
  const [accounts, setAccounts] = reactExports.useState([]);
  const [activeAccount, setActiveAccount] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);
  const loadAccounts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("instagram_accounts").select("id, username").order("created_at", { ascending: false });
      if (error) throw error;
      const list = data || [];
      setAccounts(list);
      const storedId = localStorage.getItem("active_ig_account_id");
      let active = list.find((a) => a.id === storedId);
      if (!active && list.length > 0) {
        active = list[0];
        localStorage.setItem("active_ig_account_id", list[0].id);
      }
      setActiveAccount(active || null);
    } catch (err) {
      console.error("Error loading accounts in AppShell:", err);
    }
  };
  reactExports.useEffect(() => {
    loadAccounts();
    const handleActiveAccountChange = () => {
      loadAccounts();
    };
    window.addEventListener("active-account-changed", handleActiveAccountChange);
    return () => {
      window.removeEventListener("active-account-changed", handleActiveAccountChange);
    };
  }, [user]);
  const selectActiveAccount = (account) => {
    localStorage.setItem("active_ig_account_id", account.id);
    setActiveAccount(account);
    window.dispatchEvent(new Event("active-account-changed"));
    toast.success(`Conta ativa alterada para @${account.username}`);
  };
  const toggleSidebar = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", String(nextState));
  };
  if (loading || !user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-2xl bg-gradient-brand grid place-items-center animate-bounce shadow-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-6 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" })
    ] }) });
  }
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/calendar", label: "Calendário", icon: Calendar },
    { to: "/accounts", label: "Contas", icon: Instagram }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex bg-background text-foreground transition-all duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "aside",
      {
        className: `hidden md:flex flex-col border-r border-border/50 bg-card/60 backdrop-blur-xl shrink-0 transition-all duration-300 relative z-30 ${collapsed ? "w-20" : "w-64"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-16 flex items-center justify-between px-6 border-b border-border/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", className: "flex items-center gap-3 group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow shrink-0 transition group-hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4.5 text-primary-foreground" }) }),
              !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-lg font-bold tracking-tight text-gradient-brand animate-in fade-in duration-200", children: "Reelary" })
            ] }),
            !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: toggleSidebar,
                className: "size-7 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground hover:text-foreground transition cursor-pointer",
                title: "Recolher menu",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4" })
              }
            )
          ] }),
          collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-4 border-b border-border/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: toggleSidebar,
              className: "size-8 rounded-lg bg-secondary/80 hover:bg-secondary grid place-items-center text-muted-foreground hover:text-foreground transition cursor-pointer",
              title: "Expandir menu",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4" })
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 px-3 py-6 space-y-1.5", children: navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: item.to,
                className: `flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-all duration-200 group ${active ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: `size-5 shrink-0 transition-transform group-hover:scale-105 ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}` }),
                  !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "animate-in fade-in slide-in-from-left-2 duration-200", children: item.label })
                ]
              },
              item.to
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border-t border-border/40 space-y-3 bg-secondary/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleUserRound, { className: "size-8 text-muted-foreground shrink-0" }),
              !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold truncate text-foreground/95", children: user.user_metadata?.full_name || user.email?.split("@")[0] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground truncate", children: user.email })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "ghost",
                onClick: async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                },
                className: `w-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center ${collapsed ? "justify-center h-10 px-0" : "justify-start px-3 h-10 gap-3"}`,
                title: "Sair da conta",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "size-5 shrink-0" }),
                  !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sair" })
                ]
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0 min-h-screen", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-20 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4 text-primary-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-bold tracking-tight", children: "Reelary" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-medium", children: "Calendário profissional de Reels" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          accounts.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-xs md:text-sm font-semibold rounded-full px-4 h-9 gap-2 shadow-sm text-foreground flex items-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1.5 rounded-full bg-success animate-pulse shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Estou na conta: ",
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "text-primary font-bold", children: [
                      "@",
                      activeAccount?.username
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "size-3 text-muted-foreground" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", className: "w-56 bg-card border border-border/60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuLabel, { className: "text-xs text-muted-foreground font-medium", children: "Alternar Conta Ativa" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
              accounts.map((acc) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                DropdownMenuItem,
                {
                  onClick: () => selectActiveAccount(acc),
                  className: "flex items-center justify-between py-2 cursor-pointer text-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2 font-medium", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-4 text-primary" }),
                      "@",
                      acc.username
                    ] }),
                    activeAccount?.id === acc.id && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4 text-success" })
                  ]
                },
                acc.id
              )),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuItem, { onClick: () => navigate({ to: "/accounts" }), className: "py-2 text-center text-xs text-primary hover:underline font-semibold cursor-pointer", children: "Gerenciar Contas" })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => navigate({ to: "/accounts" }),
              className: "border-dashed border-muted-foreground/40 text-xs text-muted-foreground rounded-full px-3 h-8.5 gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { className: "size-3.5" }),
                "Sem contas conectadas"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:hidden flex items-center gap-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              },
              className: "text-muted-foreground",
              "aria-label": "Sair",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "size-4" })
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-border bg-card/90 backdrop-blur-md flex items-center justify-around px-4", children: navItems.map((item) => {
        const active = location.pathname.startsWith(item.to);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: item.to,
            className: `flex flex-col items-center gap-1 py-1 text-[10px] font-semibold transition ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "size-5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
            ]
          },
          item.to
        );
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 px-4 md:px-8 py-8 pb-24 md:pb-8 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-300", children }) })
    ] })
  ] });
}
export {
  AppShell as A
};
