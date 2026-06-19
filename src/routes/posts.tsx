import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Clock, XCircle, Trash2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/posts")({
  head: () => ({ meta: [{ title: "Agendados — Reelary" }] }),
  component: () => (
    <AppShell>
      <PostsPage />
    </AppShell>
  ),
});

type Post = {
  id: string;
  caption: string;
  video_url: string;
  scheduled_at: string;
  status: "pending" | "published" | "failed";
  error_message: string | null;
  instagram_accounts: {
    username: string;
    category_id: string | null;
    account_categories: { color: string } | null;
  } | null;
};

const statusMeta = {
  pending: { label: "Agendado", icon: Clock, cls: "bg-warning/15 text-warning border-warning/30" },
  published: {
    label: "Publicado",
    icon: CheckCircle2,
    cls: "bg-success/15 text-success border-success/30",
  },
  failed: {
    label: "Falhou",
    icon: XCircle,
    cls: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data, error } = await supabase
      .from("scheduled_posts")
      .select(
        "id, caption, video_url, scheduled_at, status, error_message, instagram_accounts(username, category_id, account_categories(color))",
      )
      .order("scheduled_at", { ascending: true });
    if (error) toast.error(error.message);
    setPosts((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Excluir este agendamento?")) return;
    const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agendamento excluído");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reels agendados</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o status de cada publicação</p>
        </div>
        <Link to="/schedule">
          <Button className="bg-gradient-brand text-primary-foreground border-0 hover:opacity-90">
            <Plus className="size-4" /> Novo Reel
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-16 text-center bg-card/30">
          <div className="size-14 rounded-2xl bg-secondary grid place-items-center mx-auto mb-4">
            <CalendarClock className="size-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">Nada agendado</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Crie seu primeiro agendamento de Reel.
          </p>
          <Link to="/schedule">
            <Button className="mt-6 bg-gradient-brand text-primary-foreground border-0">
              <Plus className="size-4" /> Agendar Reel
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const meta = statusMeta[p.status];
            const Icon = meta.icon;
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-border/60 bg-card p-4 flex gap-4 shadow-card"
              >
                <video
                  src={p.video_url}
                  className="size-24 rounded-xl object-cover bg-background shrink-0"
                  muted
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          {p.instagram_accounts?.account_categories?.color && (
                            <span
                              className="size-2 rounded-full shrink-0 ring-1 ring-white/10"
                              style={{
                                backgroundColor: p.instagram_accounts.account_categories.color,
                              }}
                            />
                          )}
                          @{p.instagram_accounts?.username ?? "—"}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(p.scheduled_at).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm line-clamp-2 text-foreground/90">
                        {p.caption || (
                          <span className="text-muted-foreground italic">Sem legenda</span>
                        )}
                      </p>
                      {p.error_message && (
                        <p className="mt-1 text-xs text-destructive">{p.error_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${meta.cls}`}
                      >
                        <Icon className="size-3" /> {meta.label}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
