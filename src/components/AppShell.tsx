import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Calendar, LayoutDashboard, LogOut, Sparkles, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";
import { useEffect, type ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Contas", icon: LayoutDashboard },
  { to: "/posts", label: "Agendados", icon: Calendar },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="size-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Reelary</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => {
              const active = location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 px-3 h-9 rounded-lg text-sm transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <n.icon className="size-4" />
                  <span className="hidden sm:inline">{n.label}</span>
                </Link>
              );
            })}
            <Link to="/schedule">
              <Button size="sm" className="ml-2 bg-gradient-brand text-primary-foreground hover:opacity-90 border-0">
                <Plus className="size-4" /> <span className="hidden sm:inline">Novo Reel</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-1"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
