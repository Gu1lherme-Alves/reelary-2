import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/instagram/callback")({
  head: () => ({ meta: [{ title: "Conectando Instagram — Reelary" }] }),
  component: CallbackPage,
});

function CallbackPage() {
  const [state, setState] = useState<"loading" | "manual" | "error" | "done">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [igUserId, setIgUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error_description") ?? params.get("error");
    const code = params.get("code");
    if (error) {
      setErrorMsg(error);
      setState("error");
      return;
    }
    if (code) {
      // A troca real do code por access_token requer META_APP_SECRET no servidor.
      // Por ora, exibimos o code e pedimos confirmação manual para validar o fluxo.
      setState("manual");
    } else {
      setState("manual");
    }
  }, []);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const { error } = await supabase.from("instagram_accounts").insert({
        user_id: uid,
        instagram_user_id: igUserId,
        username,
        access_token: accessToken,
        token_expires_at: null,
      });
      if (error) throw error;
      toast.success("Conta conectada!");
      setState("done");
      setTimeout(() => navigate({ to: "/dashboard" }), 800);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-card">
        {state === "loading" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processando autorização…</p>
          </div>
        )}

        {state === "error" && (
          <div className="text-center">
            <AlertCircle className="size-10 text-destructive mx-auto" />
            <h2 className="mt-4 font-semibold text-lg">Erro na autorização</h2>
            <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
            <Button className="mt-6 w-full" onClick={() => navigate({ to: "/dashboard" })}>
              Voltar
            </Button>
          </div>
        )}

        {state === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="size-10 text-success" />
            <p className="font-medium">Conta conectada</p>
            <p className="text-sm text-muted-foreground">Redirecionando…</p>
          </div>
        )}

        {state === "manual" && (
          <>
            <h2 className="font-semibold text-lg">Confirmar conexão</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A troca do <code>code</code> por <code>access_token</code> precisa do
              app secret no servidor. Por enquanto, preencha os dados manualmente
              para validar o fluxo.
            </p>
            <form onSubmit={saveAccount} className="space-y-3 mt-6">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username do Instagram</Label>
                <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu.usuario" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="igid">Instagram User ID</Label>
                <Input id="igid" required value={igUserId} onChange={(e) => setIgUserId(e.target.value)} placeholder="17841…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="token">Access Token</Label>
                <Input id="token" required value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAAB…" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-gradient-brand text-primary-foreground border-0 hover:opacity-90">
                {submitting ? "Salvando…" : "Salvar conta"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate({ to: "/dashboard" })}>
                Cancelar
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
