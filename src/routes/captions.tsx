import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Sparkles,
  Search,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasSpintax } from "@/lib/spintax";

export const Route = createFileRoute("/captions")({
  head: () => ({ meta: [{ title: "Modelos de Legenda — Reelary" }] }),
  component: () => (
    <AppShell>
      <CaptionsPage />
    </AppShell>
  ),
});

export interface CaptionTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

const DEFAULT_CATEGORIES = ["Geral", "Engajamento", "Notícias", "Humor", "Vendas", "Curiosidades"];

function CaptionsPage() {
  const [captions, setCaptions] = useState<CaptionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCaption, setEditingCaption] = useState<CaptionTemplate | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("Geral");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCaptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("caption_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCaptions((data as any) || []);
    } catch (err: any) {
      console.error("Erro ao carregar legendas:", err);
      toast.error("Não foi possível carregar as legendas salvas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaptions();
  }, []);

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error("Preencha o título e o conteúdo da legenda.");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      if (editingCaption) {
        const { error } = await supabase
          .from("caption_templates")
          .update({
            title: formTitle.trim(),
            content: formContent,
            category: formCategory.trim() || "Geral",
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCaption.id);

        if (error) throw error;
        toast.success("Legenda atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("caption_templates").insert({
          user_id: uid,
          title: formTitle.trim(),
          content: formContent,
          category: formCategory.trim() || "Geral",
        });

        if (error) throw error;
        toast.success("Modelo de legenda criado!");
      }

      setDialogOpen(false);
      setEditingCaption(null);
      setFormTitle("");
      setFormContent("");
      setFormCategory("Geral");
      loadCaptions();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar legenda.");
    }
  };

  const handleDelete = async (caption: CaptionTemplate) => {
    if (!confirm(`Deseja excluir o modelo "${caption.title}"?`)) return;
    try {
      const { error } = await supabase.from("caption_templates").delete().eq("id", caption.id);
      if (error) throw error;
      toast.success("Legenda excluída!");
      setCaptions((prev) => prev.filter((c) => c.id !== caption.id));
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir legenda.");
    }
  };

  const handleCopy = (caption: CaptionTemplate) => {
    navigator.clipboard.writeText(caption.content);
    setCopiedId(caption.id);
    toast.success("Legenda copiada para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openNewModal = () => {
    setEditingCaption(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory(selectedCategory || "Geral");
    setDialogOpen(true);
  };

  const openEditModal = (cap: CaptionTemplate) => {
    setEditingCaption(cap);
    setFormTitle(cap.title);
    setFormContent(cap.content);
    setFormCategory(cap.category || "Geral");
    setDialogOpen(true);
  };

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...captions.map((c) => c.category).filter(Boolean)]));

  const filteredCaptions = captions.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory && c.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6 text-amber-500" /> Modelos de Legenda
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Crie e salve modelos de legendas prontos (com suporte a Spintax) para agendar em massa com 1 clique.
          </p>
        </div>

        <Button
          onClick={openNewModal}
          size="sm"
          className="h-9 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="size-4" />
          Nova Legenda
        </Button>
      </div>

      {/* Categorias & Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
              selectedCategory === null
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-[#18181b] text-zinc-400 hover:text-white hover:bg-[#202024] border border-[#27272a]"
            }`}
          >
            Todas ({captions.length})
          </button>
          {categories.map((cat) => {
            const count = captions.filter((c) => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-[#18181b] text-zinc-400 hover:text-white hover:bg-[#202024] border border-[#27272a]"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar legendas..."
            className="pl-9 h-9 text-xs bg-[#121215] border-[#27272a] text-zinc-200 placeholder:text-zinc-400 rounded-lg"
          />
        </div>
      </div>

      {/* Grid de Cards de Legenda */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-xs">Carregando modelos de legenda...</div>
      ) : filteredCaptions.length === 0 ? (
        <div className="border border-dashed border-[#27272a] rounded-2xl p-12 text-center bg-[#0c0c0e]">
          <FileText className="size-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-200">Nenhuma legenda encontrada</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Nenhum modelo corresponde à sua busca."
              : "Você ainda não cadastrou modelos de legenda. Clique em 'Nova Legenda' para salvar seus textos frequentes."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCaptions.map((cap) => {
            const isSpintax = hasSpintax(cap.content);
            return (
              <div
                key={cap.id}
                className="bg-[#121215] border border-[#27272a] hover:border-amber-500/40 rounded-xl p-4 flex flex-col justify-between gap-3 transition group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition truncate">
                      {cap.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50 shrink-0">
                      {cap.category || "Geral"}
                    </span>
                  </div>

                  <div className="relative">
                    <p className="text-xs text-zinc-400 line-clamp-4 whitespace-pre-wrap font-sans leading-relaxed">
                      {cap.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1f1f23]">
                  <div className="flex items-center gap-1.5">
                    {isSpintax && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Sparkles className="size-2.5" /> Spintax
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400">
                      {cap.content.length} caracteres
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(cap)}
                      className="size-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white grid place-items-center transition cursor-pointer"
                      title="Copiar texto"
                    >
                      {copiedId === cap.id ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(cap)}
                      className="size-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white grid place-items-center transition cursor-pointer"
                      title="Editar legenda"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cap)}
                      className="size-7 rounded hover:bg-destructive/20 text-zinc-400 hover:text-destructive grid place-items-center transition cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Legenda */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#121215] border-[#27272a] text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingCaption ? "Editar Modelo de Legenda" : "Novo Modelo de Legenda"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-zinc-300">Título de Identificação</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Notícia Viral, Dicas de Beleza..."
                  className="h-9 text-xs bg-[#18181b] border-[#27272a] text-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Categoria</Label>
                <Input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Ex: Geral"
                  className="h-9 text-xs bg-[#18181b] border-[#27272a] text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-300">Conteúdo da Legenda</Label>
                {hasSpintax(formContent) && (
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <Sparkles className="size-3" /> Spintax detectado
                  </span>
                )}
              </div>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={7}
                placeholder="Escreva sua legenda aqui... Suporta spintax como {Olá|Oi|E aí}! Use quebras de linha e hashtags."
                className="text-xs bg-[#18181b] border-[#27272a] text-zinc-200 resize-none font-sans"
              />
              <span className="text-[10px] text-zinc-400 block">
                Dica: Use {"{opção 1|opção 2}"} para o sistema alternar automaticamente o texto entre cada conta agendada.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Salvar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
