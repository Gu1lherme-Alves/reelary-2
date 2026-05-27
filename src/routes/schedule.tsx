import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Loader2, Video } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("instagram_accounts")
      .select("id, username")
      .order("created_at", { ascending: false })
      .then(({ data }) => setAccounts(data ?? []));
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !accountId || (publishMode === "schedule" && !scheduledAt)) return;
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

      let coverUrl = null;
      if (coverFile) {
        const coverExt = coverFile.name.split(".").pop() ?? "jpg";
        const coverPath = `${uid}/${Date.now()}_cover.${coverExt}`;
        const coverUp = await supabase.storage.from("reels").upload(coverPath, coverFile, {
          contentType: coverFile.type || "image/jpeg",
        });
        if (coverUp.error) throw coverUp.error;
        const { data: coverPub } = supabase.storage.from("reels").getPublicUrl(coverPath);
        coverUrl = coverPub.publicUrl;
      }

      const scheduledDate = publishMode === "now"
        ? new Date().toISOString()
        : new Date(scheduledAt).toISOString();

      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: uid,
        instagram_account_id: accountId,
        video_url: pub.publicUrl,
        cover_url: coverUrl,
        caption,
        scheduled_at: scheduledDate,
        status: "pending",
      });
      if (error) throw error;

      if (publishMode === "now") {
        toast.info("Publicando Reel imediatamente...");
        try {
          await supabase.functions.invoke("publish-reels");
          toast.success("Reel enviado com sucesso!");
        } catch (fnErr) {
          console.error("Erro ao disparar publicação imediata:", fnErr);
          toast.success("Reel enviado para processamento!");
        }
      } else {
        toast.success("Reel agendado!");
      }
      navigate({ to: "/posts" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  }

  const tzOffset = new Date().getTimezoneOffset() * 60_000;
  const minDateTime = new Date(Date.now() + 5 * 60_000 - tzOffset).toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agendar Reel</h1>
        <p className="text-muted-foreground mt-1">Envie o vídeo, escolha quando publicar.</p>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/30">
          <p className="font-medium">Nenhuma conta conectada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte uma conta do Instagram primeiro.
          </p>
          <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>
            Ir para contas
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card"
        >
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
            <Label>Foto de Capa (Opcional)</Label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setCoverFile(f);
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setCoverPreviewUrl(url);
                  } else {
                    setCoverPreviewUrl(null);
                  }
                }}
              />
              <div className="rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition p-6 text-center bg-card/50 flex flex-col items-center justify-center min-h-[100px]">
                {coverFile ? (
                  <div className="flex flex-col items-center gap-2">
                    {coverPreviewUrl && (
                      <img
                        src={coverPreviewUrl}
                        alt="Capa preview"
                        className="w-20 h-28 object-cover rounded-lg border border-border/80 shadow-md"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground truncate max-w-[200px]">{coverFile.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {(coverFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <span className="text-[10px] text-primary underline font-medium">Trocar imagem</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="size-5" />
                    <span className="text-xs font-semibold text-foreground">Escolher Foto de Capa</span>
                    <span className="text-[10px]">Formato JPG, PNG (Aspecto 9:16 recomendado)</span>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    @{a.username}
                  </SelectItem>
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
            <Label>Método de Publicação</Label>
            <Tabs
              value={publishMode}
              onValueChange={(val) => setPublishMode(val as "now" | "schedule")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-secondary/60">
                <TabsTrigger value="now" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">⚡ Postar Agora</TabsTrigger>
                <TabsTrigger value="schedule" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">📅 Agendar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {publishMode === "schedule" && (
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
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-brand text-primary-foreground border-0 hover:opacity-90 h-11"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enviando…
              </>
            ) : publishMode === "now" ? (
              "Publicar agora"
            ) : (
              "Agendar publicação"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
