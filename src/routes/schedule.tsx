import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Loader2, Video } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/schedule")({
  head: () => ({ meta: [{ title: "Novo Reel — Reelary" }] }),
  component: () => (
    <AppShell>
      <SchedulePage />
    </AppShell>
  ),
});

type Account = { id: string; username: string };

function SchedulePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("instagram_accounts").select("id, username")
      .order("created_at", { ascending: false })
      .then(({ data }) => setAccounts(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !accountId || !scheduledAt) return;
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Sessão expirada");

      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${uid}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("reels").upload(path, file, {
        contentType: file.type || "video/mp4",
      });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("reels").getPublicUrl(path);

      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: uid,
        instagram_account_id: accountId,
        video_url: pub.publicUrl,
        caption,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: "pending",
      });
      if (error) throw error;

      toast.success("Reel agendado!");
      navigate({ to: "/posts" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  }

  const minDateTime = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agendar Reel</h1>
        <p className="text-muted-foreground mt-1">Envie o vídeo, escolha quando publicar.</p>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/30">
          <p className="font-medium">Nenhuma conta conectada</p>
          <p className="text-sm text-muted-foreground mt-1">Conecte uma conta do Instagram primeiro.</p>
          <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>Ir para contas</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label>Vídeo</Label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition p-8 text-center">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <Video className="size-5 text-primary" />
                    <span className="font-medium text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="size-6" />
                    <span className="text-sm">Clique para enviar um vídeo</span>
                    <span className="text-xs">MP4, MOV — até 100MB</span>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger><SelectValue placeholder="Escolha uma conta" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>@{a.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Legenda</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              placeholder="Escreva a legenda do seu Reel… #hashtags"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled">Data e hora</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              required
              min={minDateTime}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-brand text-primary-foreground border-0 hover:opacity-90 h-11"
          >
            {submitting ? <><Loader2 className="size-4 animate-spin" /> Enviando…</> : "Agendar publicação"}
          </Button>
        </form>
      )}
    </div>
  );
}
