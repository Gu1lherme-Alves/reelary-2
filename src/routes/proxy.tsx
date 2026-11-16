import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
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
  Zap,
  Instagram,
  Edit2,
  Check,
  ClipboardPaste,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

// Helper de parsing robusto no estilo AdsPower / Dolphin Anty
function parseAdsPowerProxyString(raw: string) {
  if (!raw) return null;
  const clean = raw
    .trim()
    .replace(/^['"`]|['"`]$/g, "")
    .replace(/^[a-zA-Z0-9]+:\/\//, "");

  if (!clean) return null;

  // Formato: user:pass@host:port
  if (clean.includes("@")) {
    const [authPart, hostPart] = clean.split("@");
    if (!authPart || !hostPart) return null;

    const [user, ...passParts] = authPart.split(":");
    const pass = passParts.join(":");
    const [h, portStr] = hostPart.split(":");
    const port = portStr ? parseInt(portStr.replace(/\D/g, ""), 10) : undefined;

    return {
      host: h ? h.trim() : "",
      port: port && !isNaN(port) ? port : undefined,
      username: user ? user.trim() : "",
      password: pass ? pass.trim() : "",
    };
  }

  // Formato clássico AdsPower: host:port:user:pass
  const parts = clean.split(":");
  if (parts.length >= 4) {
    const h = parts[0].trim();
    const port = parseInt(parts[1].replace(/\D/g, ""), 10);
    const user = parts[2].trim();
    const pass = parts.slice(3).join(":").trim();

    return {
      host: h,
      port: !isNaN(port) ? port : undefined,
      username: user,
      password: pass,
    };
  }

  // Formato: host:port (sem autenticação)
  if (parts.length === 2 && !isNaN(parseInt(parts[1], 10))) {
    return {
      host: parts[0].trim(),
      port: parseInt(parts[1], 10),
      username: "",
      password: "",
    };
  }

  return null;
}

function ProxyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Input completo no estilo AdsPower
  const [fullProxyInput, setFullProxyInput] = useState("");

  // Campos individuais sincronizados
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

  // Status de teste individual por linha da tabela de contas
  const [rowTestResults, setRowTestResults] = useState<Record<string, {
    testing: boolean;
    ok?: boolean;
    ip?: string;
    latencyMs?: number;
    error?: string;
  }>>({});
  const [testingAll, setTestingAll] = useState(false);

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
        const h = settings.proxy_host || "sv2.allanproxys.com";
        const u = settings.proxy_username || "";
        const p = settings.proxy_password || "";
        const pStart = settings.proxy_port_start || 11000;
        const pEnd = settings.proxy_port_end || 15000;

        setHost(h);
        setUsername(u);
        setPassword(p);
        setPortStart(pStart);
        setPortEnd(pEnd);
        setProxyEnabled(settings.proxy_enabled !== false);
        setHasCustomProxy(Boolean(settings.hasCustomProxy));
        setTestPort(pStart);

        // Se já tiver credenciais, monta a string completa do AdsPower
        if (u && p) {
          setFullProxyInput(`${h}:${pStart}:${u}:${p}`);
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

  // Manipula a digitação ou paste no campo completo do AdsPower
  function handleFullProxyChange(val: string) {
    setFullProxyInput(val);
    const parsed = parseAdsPowerProxyString(val);

    if (parsed) {
      if (parsed.host) setHost(parsed.host);
      if (parsed.username) setUsername(parsed.username);
      if (parsed.password) setPassword(parsed.password);
      // A porta inicial para postagens residenciais sempre inicia em 11000
      setPortStart(11000);
      setTestPort(11000);
      setPortEnd(15000);
    }
  }

  // Permite colar diretamente da área de transferência com feedback
  async function handlePasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.error("Área de transferência vazia.");
        return;
      }
      handleFullProxyChange(text);
      const parsed = parseAdsPowerProxyString(text);
      if (parsed) {
        toast.success(`Proxy detectado: ${parsed.host} (Porta inicial: 11000 | Usuário: ${parsed.username})`);
      } else {
        toast.info("Texto colado. Verifique se o formato é host:porta:usuário:senha");
      }
    } catch (_) {
      toast.error("Não foi possível ler a área de transferência automaticamente. Pressione Ctrl+V no campo.");
    }
  }

  // Sincroniza a string completa quando campos manuais são editados
  function syncFullProxyString(newHost: string, newPort: number, newUser: string, newPass: string) {
    if (newUser || newPass) {
      setFullProxyInput(`${newHost}:11000:${newUser}:${newPass}`);
    } else {
      setFullProxyInput(`${newHost}:11000`);
    }
  }

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();

    // Se o usuário digitou no campo AdsPower e não salvou os campos, faz o parse preventivo
    const parsed = parseAdsPowerProxyString(fullProxyInput);
    const finalHost = (parsed?.host || host).trim();
    const finalUser = (parsed?.username || username).trim();
    const finalPass = (parsed?.password || password).trim();
    const finalPort = 11000; // Sempre 11000 como porta inicial residencial

    if (!finalHost) {
      toast.error("Informe o host do servidor de proxy.");
      return;
    }

    try {
      setSaving(true);
      await saveSettingsFn({
        data: {
          proxy_host: finalHost,
          proxy_username: finalUser,
          proxy_password: finalPass,
          proxy_port_start: Number(finalPort) || 11000,
          proxy_port_end: Number(portEnd) || 15000,
          proxy_enabled: proxyEnabled,
        },
      });

      setHost(finalHost);
      setUsername(finalUser);
      setPassword(finalPass);
      setPortStart(finalPort);
      setHasCustomProxy(Boolean(finalUser && finalPass));

      toast.success("Configurações de proxy salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar proxy:", err);
      toast.error(err.message || "Erro ao salvar configurações de proxy.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection(customPort?: number) {
    // Garante que pega dados atualizados do campo AdsPower se houver
    const parsed = parseAdsPowerProxyString(fullProxyInput);
    const targetHost = (parsed?.host || host).trim() || "sv2.allanproxys.com";
    const targetUser = (parsed?.username || username).trim();
    const targetPass = (parsed?.password || password).trim();
    const targetPort = customPort || 11000;

    if (!targetUser || !targetPass) {
      toast.error("Cole ou informe o proxy completo (com usuário e senha) antes de testar.");
      return;
    }

    try {
      setTesting(true);
      setTestResult({ tested: false, ok: false });

      const res = await testConnFn({
        data: {
          host: targetHost,
          username: targetUser,
          password: targetPass,
          port: Number(targetPort),
        },
      });

      if (res.ok) {
        setTestResult({
          tested: true,
          ok: true,
          ip: res.ip,
          latencyMs: res.latencyMs,
        });
        toast.success(`Porta ${targetPort} conectada com sucesso! IP Residencial: ${res.ip}`);
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

  // Testa a porta de uma conta específica na tabela e exibe o resultado diretamente na linha
  async function handleTestAccountPort(accountId: string, port: number) {
    const parsed = parseAdsPowerProxyString(fullProxyInput);
    const targetHost = (parsed?.host || host).trim() || "sv2.allanproxys.com";
    const targetUser = (parsed?.username || username).trim();
    const targetPass = (parsed?.password || password).trim();

    if (!targetUser || !targetPass) {
      toast.error("Informe o Usuário e a Senha do proxy antes de testar.");
      return;
    }

    setRowTestResults((prev) => ({
      ...prev,
      [accountId]: { testing: true },
    }));

    try {
      const res = await testConnFn({
        data: {
          host: targetHost,
          username: targetUser,
          password: targetPass,
          port: Number(port),
        },
      });

      if (res.ok) {
        setRowTestResults((prev) => ({
          ...prev,
          [accountId]: {
            testing: false,
            ok: true,
            ip: res.ip,
            latencyMs: res.latencyMs,
          },
        }));
        toast.success(`Porta ${port} conectada! IP: ${res.ip}`);
      } else {
        setRowTestResults((prev) => ({
          ...prev,
          [accountId]: {
            testing: false,
            ok: false,
            error: res.error || "Falha na conexão",
          },
        }));
        toast.error(`Porta ${port}: ${res.error}`);
      }
    } catch (err: any) {
      setRowTestResults((prev) => ({
        ...prev,
        [accountId]: {
          testing: false,
          ok: false,
          error: err.message || "Erro ao conectar",
        },
      }));
      toast.error(`Erro ao testar porta ${port}: ${err.message}`);
    }
  }

  // Testa todas as contas da tabela em lote
  async function handleTestAllAccounts() {
    if (!accounts.length) return;
    setTestingAll(true);
    toast.info(`Iniciando teste das ${accounts.length} contas...`);

    for (const acc of accounts) {
      if (acc.proxy_port) {
        await handleTestAccountPort(acc.id, acc.proxy_port);
      }
    }

    setTestingAll(false);
    toast.success("Teste de todas as contas concluído!");
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
      const refreshed = await fetchAccounts();
      setAccounts(refreshed);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar a porta.");
    } finally {
      setUpdatingPort(false);
    }
  }

  const parsedCurrent = useMemo(() => {
    return parseAdsPowerProxyString(fullProxyInput);
  }, [fullProxyInput]);

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
                Cole a linha de proxy no estilo AdsPower (<code>host:porta:usuário:senha</code>). O sistema interpreta tudo automaticamente.
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

      {/* Card Principal: Importação Rápida Estilo AdsPower */}
      <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1f1f23] pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Importação Rápida de Proxy (Estilo AdsPower)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Auto-detecção de Host, Porta, Usuário e Senha
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-zinc-300">
              Cole a Linha Completa do seu Proxy
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePasteClipboard}
              className="h-6 px-2 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1 cursor-pointer"
            >
              <ClipboardPaste className="size-3" />
              Colar da Área de Transferência
            </Button>
          </div>

          <div className="relative">
            <Input
              value={fullProxyInput}
              onChange={(e) => handleFullProxyChange(e.target.value)}
              placeholder="ex: sv2.allanproxys.com:823:26769afd5b916fcb3787:fe412ef49294f1de"
              className="bg-[#141417] border-[#26262b] text-xs font-mono h-11 px-3.5 focus-visible:ring-amber-500/30 text-amber-300 placeholder:text-zinc-600"
            />
          </div>

          <p className="text-[11px] text-zinc-400">
            Formatos suportados: <code>host:porta:usuário:senha</code> ou <code>usuário:senha@host:porta</code>.
          </p>

          {/* Cards de visualização do parsing em tempo real */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {/* Host */}
            <div className="p-3 rounded-lg bg-[#141417] border border-[#222227] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                Host
              </span>
              <span className="text-xs font-mono font-semibold text-white truncate block">
                {parsedCurrent?.host || host || "—"}
              </span>
            </div>

            {/* Porta Inicial */}
            <div className="p-3 rounded-lg bg-[#141417] border border-[#222227] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                Porta Inicial
              </span>
              <span className="text-xs font-mono font-semibold text-amber-400 truncate block">
                11000 (Fixa)
              </span>
            </div>

            {/* Usuário */}
            <div className="p-3 rounded-lg bg-[#141417] border border-[#222227] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                Usuário
              </span>
              <span className="text-xs font-mono font-semibold text-zinc-200 truncate block">
                {parsedCurrent?.username || username ? `${(parsedCurrent?.username || username).slice(0, 10)}...` : "—"}
              </span>
            </div>

            {/* Senha */}
            <div className="p-3 rounded-lg bg-[#141417] border border-[#222227] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Senha
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-300 truncate block">
                {parsedCurrent?.password || password
                  ? showPassword
                    ? (parsedCurrent?.password || password)
                    : "••••••••••••"
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Botão de Teste Direto */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1f1f23]">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => handleTestConnection()}
              disabled={testing || (!username && !parsedCurrent?.username)}
              className="bg-[#1c1c21] hover:bg-[#25252b] text-white border border-[#2d2d35] font-semibold text-xs h-9 px-4 gap-2 cursor-pointer"
            >
              {testing ? (
                <Loader2 className="size-3.5 animate-spin text-amber-400" />
              ) : (
                <Wifi className="size-3.5 text-amber-400" />
              )}
              Testar Conexão Deste Proxy
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-zinc-400 hover:text-white text-xs h-9 gap-1 cursor-pointer"
            >
              <Sliders className="size-3.5" />
              {showAdvanced ? "Ocultar Campos Manuais" : "Editar Campos Manualmente"}
              {showAdvanced ? <ChevronUp className="size-3 ml-1" /> : <ChevronDown className="size-3 ml-1" />}
            </Button>
          </div>

          {/* Resultado do Teste Inline */}
          {testResult.tested && (
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                testResult.ok
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-300"
              }`}
            >
              {testResult.ok ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Conectado! IP: <strong className="text-white font-mono">{testResult.ip}</strong> ({testResult.latencyMs}ms)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="size-3.5 text-rose-400 shrink-0" />
                  <span>{testResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Campos Manuais / Avançados (Colapsável) */}
        {showAdvanced && (
          <div className="pt-4 border-t border-[#1f1f23] space-y-4 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Ajuste Individual dos Parâmetros
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">Host</Label>
                <Input
                  value={host}
                  onChange={(e) => {
                    setHost(e.target.value);
                    syncFullProxyString(e.target.value, portStart, username, password);
                  }}
                  className="bg-[#141417] border-[#26262b] text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">Usuário</Label>
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    syncFullProxyString(host, portStart, e.target.value, password);
                  }}
                  className="bg-[#141417] border-[#26262b] text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">Senha</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    syncFullProxyString(host, portStart, username, e.target.value);
                  }}
                  className="bg-[#141417] border-[#26262b] text-xs font-mono h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-300">Porta Inicial</Label>
                  <Input
                    type="number"
                    value={portStart}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPortStart(val);
                      syncFullProxyString(host, val, username, password);
                    }}
                    className="bg-[#141417] border-[#26262b] text-xs font-mono h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-300">Porta Final</Label>
                  <Input
                    type="number"
                    value={portEnd}
                    onChange={(e) => setPortEnd(Number(e.target.value))}
                    className="bg-[#141417] border-[#26262b] text-xs font-mono h-9"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proteção Anti-Shadowban Toggle */}
        <div className="pt-3 border-t border-[#1f1f23]">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  Proteção Anti-Shadowban (Bloqueio de Datacenter)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Se a franquia de dados esgotar ou a porta não responder, o Reelary pausará o post em vez de publicar pelo IP de servidor da nuvem (evitando vídeos com 0 views).
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

      {/* Tabela de Contas x Portas Atribuídas */}
      <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f23] pb-4">
          <div className="flex items-center gap-2">
            <Instagram className="size-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Portas Atribuídas às Suas Contas ({accounts.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 hidden md:inline">
              Cada conta possui uma porta fixa para manter o mesmo IP residencial em todos os posts.
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={testingAll || accounts.length === 0}
              onClick={handleTestAllAccounts}
              className="h-7 px-3 text-[11px] font-medium border-[#2e2e36] bg-[#18181c] hover:bg-[#222228] text-amber-400 hover:text-amber-300 gap-1.5 cursor-pointer"
            >
              {testingAll ? (
                <Loader2 className="size-3 animate-spin text-amber-400" />
              ) : (
                <Wifi className="size-3" />
              )}
              {testingAll ? "Testando Todas..." : "Testar Todas"}
            </Button>
          </div>
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
                  <th className="py-3 px-3">Status da Conexão / IP Residencial</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181c]">
                {accounts.map((acc) => {
                  const isEditing = editingAccountId === acc.id;
                  const res = rowTestResults[acc.id];

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

                      {/* Status da Conexão / IP Residencial na mesma linha */}
                      <td className="py-3 px-3">
                        {res?.testing ? (
                          <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                            <Loader2 className="size-3.5 animate-spin text-amber-400 shrink-0" />
                            <span>Testando porta :{acc.proxy_port || 11000}...</span>
                          </div>
                        ) : res?.ok ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-semibold">
                              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                              <span>{res.ip}</span>
                              <span className="text-zinc-500 font-normal">({res.latencyMs}ms)</span>
                            </span>
                          </div>
                        ) : res && res.ok === false ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] max-w-[260px] truncate"
                              title={res.error}
                            >
                              <AlertCircle className="size-3.5 text-rose-400 shrink-0" />
                              <span className="truncate">{res.error}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px] italic">
                            Não testada
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={res?.testing || testingAll}
                          onClick={() => {
                            const portToTest = acc.proxy_port || 11000;
                            handleTestAccountPort(acc.id, portToTest);
                          }}
                          className="h-7 px-2.5 text-[11px] font-medium border-[#27272d] bg-[#141417] hover:bg-[#1f1f25] text-zinc-300 gap-1.5 cursor-pointer"
                        >
                          {res?.testing ? (
                            <Loader2 className="size-3 animate-spin text-amber-400" />
                          ) : (
                            <Wifi className="size-3 text-amber-400" />
                          )}
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
