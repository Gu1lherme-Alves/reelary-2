import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Check,
  UserCircle2,
  ChevronDown,
  Settings,
  Layers,
  AlertTriangle,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";
import { useEffect, useState, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Account {
  id: string;
  username: string;
  category_id: string | null;
  account_categories: { id: string; name: string; color: string } | null;
}

interface NavSection {
  title: string;
  items: {
    to: string;
    label: string;
    icon: any;
  }[];
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  // Collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Load Instagram Accounts & Selected Active Account
  const loadAccounts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("id, username, category_id, account_categories(id, name, color)")
        .eq("hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data as any) || [];
      setAccounts(list);

      const storedId = localStorage.getItem("active_ig_account_id");
      let active = list.find((a: Account) => a.id === storedId);

      if (!active && list.length > 0) {
        active = list[0];
        localStorage.setItem("active_ig_account_id", list[0].id);
      }

      setActiveAccount(active || null);
    } catch (err) {
      console.error("Error loading accounts in AppShell:", err);
    }
  };

  useEffect(() => {
    loadAccounts();

    const handleActiveAccountChange = () => {
      loadAccounts();
    };

    window.addEventListener("active-account-changed", handleActiveAccountChange);
    return () => {
      window.removeEventListener("active-account-changed", handleActiveAccountChange);
    };
  }, [user]);

  const selectActiveAccount = (account: Account) => {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400">
            <Sparkles className="size-5" />
          </div>
          <div className="size-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const navSections: NavSection[] = [
    {
      title: "VISÃO GERAL",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/performance", label: "Performance", icon: TrendingUp },
      ],
    },
    {
      title: "PUBLICAÇÃO",
      items: [
        { to: "/calendar", label: "Calendário", icon: Calendar },
        { to: "/bulk", label: "Postar em Massa", icon: Layers },
        { to: "/posts", label: "Excluir Reels", icon: Trash2 },
      ],
    },
    {
      title: "CONFIGURAÇÃO",
      items: [
        { to: "/accounts", label: "Contas", icon: Instagram },
        { to: "/failed", label: "Falhas", icon: AlertTriangle },
        { to: "/settings", label: "Configurações", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#09090b] text-[#f4f4f5] antialiased">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r border-[#1f1f23] bg-[#0c0c0e] shrink-0 transition-all duration-200 relative z-30 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Header da Sidebar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#1f1f23]">
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 rounded-md bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400 shrink-0">
              <Sparkles className="size-3.5" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-sm tracking-tight text-white truncate">
                  REELARY
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  PRO
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="size-6 rounded hover:bg-[#18181c] grid place-items-center text-zinc-400 hover:text-white transition cursor-pointer"
              title="Recolher menu"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          )}
        </div>

        {/* Botão de Expandir se recolhido */}
        {collapsed && (
          <div className="flex justify-center py-2.5 border-b border-[#1f1f23]">
            <button
              onClick={toggleSidebar}
              className="size-7 rounded bg-[#161619] hover:bg-[#202024] grid place-items-center text-zinc-400 hover:text-white transition cursor-pointer"
              title="Expandir menu"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}

        {/* Menu de Navegação com Seções */}
        <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 px-2.5 block mb-1">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => {
                const active = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between px-2.5 h-8.5 rounded-md text-xs transition-colors duration-150 ${
                      active
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] font-medium"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon
                        className={`size-4 shrink-0 ${
                          active ? "text-amber-400" : "text-zinc-400"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && active && (
                      <ChevronRight className="size-3 text-amber-400/80 shrink-0 ml-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Rodapé da Sidebar (Status Sistema & Logout) */}
        <div className="p-3 border-t border-[#1f1f23] space-y-2.5 bg-[#09090b]/80">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1 text-[11px]">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="text-zinc-400 font-medium">SISTEMA</span>
              <span className="text-emerald-400 font-bold ml-auto text-[10px]">Operacional</span>
            </div>
          )}

          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : "px-1"}`}>
            <UserCircle2 className="size-6 text-zinc-500 shrink-0" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium truncate text-zinc-300">
                  {user.email?.split("@")[0]}
                </p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className={`w-full hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 rounded-md h-8 text-xs font-medium cursor-pointer ${
              collapsed ? "justify-center px-0" : "justify-start px-2 gap-2"
            }`}
            title="Sair da conta"
          >
            <LogOut className="size-3.5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 border-b border-[#1f1f23] bg-[#0c0c0e]/90 backdrop-blur-md flex items-center justify-between px-6">
          {/* Mobile Menu Logo */}
          <div className="flex items-center gap-2.5 md:hidden">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400">
                <Sparkles className="size-3.5" />
              </div>
              <span className="font-bold text-sm text-white">REELARY</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
              BOT :: ATIVO
            </span>
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>

          {/* Account Selector in Topbar */}
          <div className="flex items-center gap-3">
            {accounts.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#26262b] bg-[#141417] hover:bg-[#1c1c20] hover:border-amber-500/40 text-xs font-semibold rounded-md px-3 h-8.5 gap-2 text-zinc-200 cursor-pointer flex items-center"
                  >
                    {activeAccount?.account_categories ? (
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: activeAccount.account_categories.color }}
                      />
                    ) : (
                      <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                    <span>
                      Conta:{" "}
                      <strong className="text-amber-400 font-bold">@{activeAccount?.username}</strong>
                    </span>
                    <ChevronDown className="size-3 text-zinc-400 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#121215] border border-[#26262b] text-xs">
                  <DropdownMenuLabel className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Alternar Conta Ativa
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#202024]" />
                  {accounts.map((acc) => (
                    <DropdownMenuItem
                      key={acc.id}
                      onClick={() => selectActiveAccount(acc)}
                      className="flex items-center justify-between py-2 cursor-pointer text-xs hover:bg-[#1a1a1f] rounded"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        {acc.account_categories ? (
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: acc.account_categories.color }}
                          />
                        ) : (
                          <Instagram className="size-3.5 text-amber-400" />
                        )}
                        <span>@{acc.username}</span>
                      </span>
                      {activeAccount?.id === acc.id && <Check className="size-3.5 text-emerald-400" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-[#202024]" />
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/accounts" })}
                    className="py-1.5 text-center text-amber-400 hover:underline font-semibold cursor-pointer justify-center"
                  >
                    Gerenciar Contas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/accounts" })}
                className="border-dashed border-zinc-700 text-xs text-zinc-400 rounded-md px-3 h-8 gap-1.5"
              >
                <Instagram className="size-3.5" />
                Sem contas
              </Button>
            )}

            {/* Mobile Logout */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth" });
                }}
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 border-t border-[#1f1f23] bg-[#0c0c0e]/95 backdrop-blur-md flex items-center justify-around px-2">
          {navSections.flatMap((s) => s.items).slice(0, 5).map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-1 text-[9px] font-semibold transition ${
                  active ? "text-amber-400 font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 px-4 md:px-8 py-6 pb-20 md:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
