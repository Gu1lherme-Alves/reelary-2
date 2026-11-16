import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Network,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Server,
  Key,
  Eye,
  EyeOff,
  Wifi,
  ExternalLink,
  RefreshCw,
  Zap,
  Instagram,
  Edit2,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getUserProxySettings,
  saveUserProxySettings,
  testProxyConnection,
  getUserAccountsWithPorts,
  updateAccountProxyPort,
  type ProxyAccountItem,
} from "@/lib/proxy.functions";

export const Route = createFileRoute("/proxy")({
  head: () => ({ meta: [{ title: "Proxy Residencial — Reelary" }] }),
  component: () => (
    <AppShell>
      <ProxyPage />
    </AppShell>
  ),
});

function ProxyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [host, setHost] = useState("sv2.allanproxys.com");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [portStart, setPortStart] = useState(11000);
  const [portEnd, setPortEnd] = useState(15000);
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [hasCustomProxy, setHasCustomProxy] = useState(false);

  // Test states
  const [testPort, setTestPort] = useState(11000);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    ip?: string;
    latencyMs?: number;
    error?: string;
  }>({ tested: false, ok: false });

  // Accounts list
  const [accounts, setAccounts] = useState<ProxyAccountItem[]>([]);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editPortValue, setEditPortValue] = useState<number>(11000);
  const [updatingPort, setUpdatingPort] = useState(false);

  // Server functions
  const fetchSettings = useServerFn(getUserProxySettings);
  const saveSettingsFn = useServerFn(saveUserProxySettings);
  const testConnFn = useServerFn(testProxyConnection);
  const fetchAccounts = useServerFn(getUserAccountsWithPorts);
  const updatePortFn = useServerFn(updateAccountProxyPort);

  async function loadData() {
    try {
      setLoading(true);
      const [settings, accs] = await Promise.all([
        fetchSettings(),
        fetchAccounts(),
      ]);

      if (settings) {
        setHost(settings.proxy_host || "sv2.allanproxys.com");
        setUsername(settings.proxy_username || "");
        setPassword(settings.proxy_password || "");
        setPortStart(settings.proxy_port_start || 11000);
        setPortEnd(settings.proxy_port_end || 15000);
        setProxyEnabled(settings.proxy_enabled !== false);
        setHasCustomProxy(Boolean(settings.hasCustomProxy));
        if (settings.proxy_port_start) {
          setTestPort(settings.proxy_port_start);
        }
      }

      setAccounts(accs || []);
    } catch (err: any) {
      console.error("Erro ao carregar dados de proxy:", err);
      toast.error("Erro ao carregar dados do proxy.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!host.trim()) {
      toast.error("Informe o host do servidor de proxy.");
      return;
    }

    try {
      setSaving(true);
      await saveSettingsFn({
        data: {
          proxy_host: host.trim(),
          proxy_username: username.trim(),
          proxy_password: password.trim(),
          proxy_port_start: Number(portStart) || 11000,
          proxy_port_end: Number(portEnd) || 15000,
          proxy_enabled: proxyEnabled,
        },
      });

      setHasCustomProxy(Boolean(username.trim() && password.trim()));
      toast.success("Configurações de proxy salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar proxy:", err);
      toast.error(err.message || "Erro ao salvar configurações de proxy.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection(customPort?: number) {
    const targetPort = customPort || testPort;
    if (!username.trim() || !password.trim()) {
      toast.error("Informe o Usuário e a Senha do proxy antes de testar.");
      return;
    }

    try {
      setTesting(true);
      setTestResult({ tested: false, ok: false });

      const res = await testConnFn({
        data: {
          host: host.trim() || "sv2.allanproxys.com",
          username: username.trim(),
          password: password.trim(),
          port: Number(targetPort) || 11000,
        },
      });

      if (res.ok) {
        setTestResult({
          tested: true,
          ok: true,
          ip: res.ip,
          latencyMs: res.latencyMs,
        });
        toast.success(`Porta ${targetPort} conectada com sucesso! IP: ${res.ip}`);
      } else {
        setTestResult({
          tested: true,
          ok: false,
          error: res.error || "Falha na conexão com o proxy.",
        });
        toast.error(`Falha no teste: ${res.error}`);
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        ok: false,
        error: err.message || "Erro inesperado ao testar o proxy.",
      });
      toast.error(`Erro ao testar: ${err.message}`);
    } finally {
      setTesting(false);
    }
  }

  async function handleUpdatePort(accountId: string) {
    try {
      setUpdatingPort(true);
      await updatePortFn({
        data: {
          accountId,
          newPort: Number(editPortValue),
        },
      });

      toast.success(`Porta atualizada para ${editPortValue}!`);
      setEditingAccountId(null);
      // Recarrega as contas
      const refreshed = await fetchAccounts();
      setAccounts(refreshed);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar a porta.");
    } finally {
      setUpdatingPort(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="size-8 text-amber-400 animate-spin" />
        <span className="text-xs text-zinc-400 font-medium">Carregando configurações de proxy...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f1f23] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-400">
              <Network className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Proxy Residencial Exclusivo
                {hasCustomProxy ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    Proxy Próprio Ativo
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    Usando Proxy Global
                  </span>
                )}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure as credenciais do seu proxy residencial para que seus Reels sejam postados de forma 100% isolada, protegendo o alcance orgânico da sua conta contra shadowban.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-9 px-4 gap-2 cursor-pointer shrink-0 shadow-lg shadow-amber-500/10"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar Configurações
        </Button>
      </div>

      {/* Grid: Configuração + Testador */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Formulário de Credenciais */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-4">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Credenciais do Proxy (Allan Proxys)
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                Sticky Session por Porta
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold text-zinc-300">
                  Host do Servidor
                </Label>
                <div className="relative">
                  <Input
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="sv2.allanproxys.com"
                    className="bg-[#141417] border-[#26262b] text-xs font-mono h-9 focus-visible:ring-amber-500/30"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Endereço do gateway de conexão residencial (padrão: <code>sv2.allanproxys.com</code>).
                </p>
              </div>

              {/* Usuário */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">
                  Usuário do Proxy
                </Label>
                <div className="relative">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: 26769afd5b916fcb3787"
                    className="bg-[#141417] border-[#26262b] text-xs font-mono h-9 focus-visible:ring-amber-500/30"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  Seu login exclusivo na Allan Proxys.
                </p>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">
                  Senha do Proxy
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="bg-[#141417] border-[#26262b] text-xs font-mono h-9 pr-9 focus-visible:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Sua senha de autenticação da porta residencial.
                </p>
              </div>

              {/* Faixa de Portas */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">
                  Porta Inicial
                </Label>
                <Input
                  type="number"
                  value={portStart}
                  onChange={(e) => setPortStart(Number(e.target.value))}
                  placeholder="11000"
                  className="bg-[#141417] border-[#26262b] text-xs font-mono h-9 focus-visible:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">
                  Porta Final
                </Label>
                <Input
                  type="number"
                  value={portEnd}
                  onChange={(e) => setPortEnd(Number(e.target.value))}
                  placeholder="15000"
                  className="bg-[#141417] border-[#26262b] text-xs font-mono h-9 focus-visible:ring-amber-500/30"
                />
              </div>
            </div>

            {/* Proteção anti-queda / Datacenter Fallback */}
            <div className="pt-2 border-t border-[#1f1f23]">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      Proteção Anti-Shadowban (Bloqueio de Datacenter)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Se a franquia de dados esgotar ou a porta não responder, o Reelary pausará o post em vez de publicar pelo IP de servidor da nuvem (o que evitará vídeos com 0 views).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={proxyEnabled}
                  onChange={(e) => setProxyEnabled(e.target.checked)}
                  className="size-4 accent-amber-400 rounded cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Testador de Conexão em Tempo Real */}
        <div className="space-y-6">
          <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1f1f23] pb-3">
              <Zap className="size-4 text-amber-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Testador de Conexão
              </h2>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Verifique em tempo real se suas credenciais são válidas, se a franquia de GBs está disponível e qual é o IP residencial emitido.
            </p>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-300">
                Porta para Teste
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={testPort}
                  onChange={(e) => setTestPort(Number(e.target.value))}
                  placeholder="11000"
                  className="bg-[#141417] border-[#26262b] text-xs font-mono h-9"
                />
                <Button
                  onClick={() => handleTestConnection()}
                  disabled={testing}
                  className="bg-[#1c1c21] hover:bg-[#25252b] text-white border border-[#2d2d35] font-semibold text-xs h-9 px-3 gap-1.5 cursor-pointer shrink-0"
                >
                  {testing ? (
                    <Loader2 className="size-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Wifi className="size-3.5 text-amber-400" />
                  )}
                  Testar
                </Button>
              </div>
            </div>

            {/* Resultado do Teste */}
            {testResult.tested && (
              <div
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                  testResult.ok
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/25 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {testResult.ok ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      <span>Conexão Residencial OK!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-4 text-rose-400 shrink-0" />
                      <span>Falha de Conexão</span>
                    </>
                  )}
                </div>

                {testResult.ok ? (
                  <div className="text-[11px] space-y-0.5 text-zinc-300 pt-1">
                    <div>
                      <span className="text-zinc-400">IP de Saída:</span>{" "}
                      <strong className="text-white font-mono">{testResult.ip}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400">Latência:</span>{" "}
                      <strong className="text-emerald-400 font-mono">{testResult.latencyMs} ms</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-rose-200 pt-1 leading-snug">
                    {testResult.error}
                  </div>
                )}
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#141417] border border-[#202025] text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300 flex items-center gap-1">
                <span>Dica de Uso:</span>
              </div>
              <p>
                Cada requisição na porta primária conecta a um IP residencial limpo da sua assinatura. Se precisar de mais dados, recarregue no painel da Allan Proxys.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Contas x Portas Atribuídas */}
      <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f23] pb-4">
          <div className="flex items-center gap-2">
            <Instagram className="size-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Portas Atribuídas às Suas Contas ({accounts.length})
            </h2>
          </div>
          <span className="text-xs text-zinc-400">
            Cada conta do Instagram possui uma porta fixa para manter o mesmo IP residencial em todos os posts.
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Nenhuma conta do Instagram conectada para este usuário. Conecte contas na aba "Contas".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1f1f23] text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Conta</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Porta Residencial</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181c]">
                {accounts.map((acc) => {
                  const isEditing = editingAccountId === acc.id;

                  return (
                    <tr key={acc.id} className="hover:bg-[#141417]/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {acc.profile_picture_url ? (
                            <img
                              src={acc.profile_picture_url}
                              alt={acc.username}
                              className="size-7 rounded-full object-cover border border-[#26262b]"
                            />
                          ) : (
                            <div className="size-7 rounded-full bg-zinc-800 border border-zinc-700 grid place-items-center text-zinc-400">
                              <Instagram className="size-3.5" />
                            </div>
                          )}
                          <span className="font-semibold text-white">
                            @{acc.username}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {acc.token_invalid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                            Token Expirado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                            Ativa
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              value={editPortValue}
                              onChange={(e) => setEditPortValue(Number(e.target.value))}
                              className="w-24 h-7 text-xs font-mono bg-[#18181c] border-[#2c2c33]"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePort(acc.id)}
                              disabled={updatingPort}
                              className="h-7 px-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold cursor-pointer"
                            >
                              {updatingPort ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingAccountId(null)}
                              className="h-7 px-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-[#18181c] border border-[#26262b] font-mono text-amber-400 font-bold text-xs">
                              :{acc.proxy_port || "Não atribuída"}
                            </span>
                            <button
                              onClick={() => {
                                setEditingAccountId(acc.id);
                                setEditPortValue(acc.proxy_port || 11000);
                              }}
                              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                              title="Alterar Porta"
                            >
                              <Edit2 className="size-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (acc.proxy_port) {
                              setTestPort(acc.proxy_port);
                              handleTestConnection(acc.proxy_port);
                            }
                          }}
                          className="h-7 px-2.5 text-[11px] font-medium border-[#27272d] bg-[#141417] hover:bg-[#1f1f25] text-zinc-300 gap-1 cursor-pointer"
                        >
                          <Wifi className="size-3 text-amber-400" />
                          Testar Porta
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
