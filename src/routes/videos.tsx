import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Folder,
  FolderPlus,
  Video,
  Upload,
  Trash2,
  Edit2,
  Check,
  X,
  Play,
  Film,
  HardDrive,
  Clock,
  Layers,
  ChevronRight,
  MoreVertical,
  Search,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUploadPresignedUrl } from "@/lib/r2.functions";
import { sanitizeAndMutateMp4 } from "@/lib/media-sanitizer";

export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Biblioteca de Vídeos — Reelary" }] }),
  component: () => (
    <AppShell>
      <VideosPage />
    </AppShell>
  ),
});

export interface VideoFolder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface LibraryVideo {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  video_url: string;
  size_bytes: number | null;
  duration_seconds: number | null;
  created_at: string;
}

const FOLDER_COLORS = [
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#06b6d4", // Cyan
];

function VideosPage() {
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [videos, setVideos] = useState<LibraryVideo[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = "Todos"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal pasta
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<VideoFolder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview video modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [foldersRes, videosRes] = await Promise.all([
        supabase.from("video_folders").select("*").order("name", { ascending: true }),
        supabase.from("library_videos").select("*").order("created_at", { ascending: false }),
      ]);

      if (foldersRes.error) throw foldersRes.error;
      if (videosRes.error) throw videosRes.error;

      const loadedFolders: VideoFolder[] = (foldersRes.data as any) || [];
      const loadedVideos: LibraryVideo[] = (videosRes.data as any) || [];

      setFolders(loadedFolders);
      setVideos(loadedVideos);

      setSelectedFolderId((current) => {
        if (current && loadedFolders.some((f) => f.id === current)) {
          return current;
        }
        return loadedFolders.length > 0 ? loadedFolders[0].id : null;
      });
    } catch (err: any) {
      console.error("Erro ao carregar dados de vídeos:", err);
      toast.error("Não foi possível carregar os vídeos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Criar ou Editar Pasta
  const handleSaveFolder = async () => {
    if (!folderName.trim()) {
      toast.error("Digite o nome da pasta.");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      if (editingFolder) {
        const { error } = await supabase
          .from("video_folders")
          .update({ name: folderName.trim(), color: folderColor, updated_at: new Date().toISOString() })
          .eq("id", editingFolder.id);

        if (error) throw error;
        toast.success("Pasta atualizada com sucesso!");
      } else {
        const { data: newFolder, error } = await supabase
          .from("video_folders")
          .insert({
            user_id: uid,
            name: folderName.trim(),
            color: folderColor,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Pasta criada com sucesso!");
        if (newFolder) {
          setSelectedFolderId(newFolder.id);
        }
      }

      setFolderDialogOpen(false);
      setEditingFolder(null);
      setFolderName("");
      loadData();
    } catch (err: any) {
      console.error("Erro ao salvar pasta:", err);
      toast.error(err.message || "Erro ao salvar pasta.");
    }
  };

  // Excluir Pasta e seus vídeos
  const handleDeleteFolder = async (folderId: string) => {
    const targetFolder = folders.find((f) => f.id === folderId);
    if (!confirm(`Tem certeza que deseja excluir a pasta "${targetFolder?.name || ""}" e todos os vídeos dentro dela?`)) return;
    try {
      await supabase.from("library_videos").delete().eq("folder_id", folderId);
      const { error } = await supabase.from("video_folders").delete().eq("id", folderId);
      if (error) throw error;
      toast.success("Pasta e seus vídeos excluídos!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir pasta.");
    }
  };

  // Disparar seleção de arquivos (bloqueia se não tiver pasta)
  const handleUploadClick = () => {
    if (folders.length === 0) {
      toast.error("Crie uma pasta primeiro para carregar vídeos.");
      setEditingFolder(null);
      setFolderName("");
      setFolderColor(FOLDER_COLORS[0]);
      setFolderDialogOpen(true);
      return;
    }
    if (!selectedFolderId) {
      toast.error("Selecione uma pasta para enviar os vídeos.");
      return;
    }
    fileInputRef.current?.click();
  };

  // Upload de vídeos para a pasta atualmente selecionada
  const handleUploadVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!selectedFolderId) {
      toast.error("Crie ou selecione uma pasta primeiro.");
      setFolderDialogOpen(true);
      return;
    }
    const currentFolderId = selectedFolderId;
    const files = Array.from(e.target.files);

    try {
      setUploading(true);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) throw new Error("Usuário não autenticado.");

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Processando ${i + 1} de ${files.length}: ${file.name}...`);

        // Sanitização de metadados
        const sanitizedVideo = await sanitizeAndMutateMp4(file, undefined, {
          applyVisualJitter: true,
          applyAudioJitter: true,
        });

        setUploadProgressText(`Enviando ${i + 1} de ${files.length} para a nuvem...`);
        const uploadInfo = await getUploadPresignedUrl({
          data: {
            fileName: sanitizedVideo.name,
            contentType: sanitizedVideo.type || "video/mp4",
          },
        });

        const uploadRes = await fetch(uploadInfo.uploadUrl, {
          method: "PUT",
          body: sanitizedVideo,
          headers: {
            "Content-Type": sanitizedVideo.type || "video/mp4",
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Falha no upload do vídeo ${file.name}`);
        }

        // Registrar na tabela library_videos com folder_id da pasta
        await supabase.from("library_videos").insert({
          user_id: uid,
          folder_id: currentFolderId,
          name: file.name,
          video_url: uploadInfo.publicUrl,
          size_bytes: file.size,
        });
      }

      toast.success(`${files.length} vídeo(s) adicionado(s) à pasta!`);
      loadData();
    } catch (err: any) {
      console.error("Erro no upload:", err);
      toast.error(err.message || "Erro ao fazer upload dos vídeos.");
    } finally {
      setUploading(false);
      setUploadProgressText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Excluir vídeo da biblioteca
  const handleDeleteVideo = async (video: LibraryVideo) => {
    if (!confirm(`Excluir o vídeo "${video.name}" da biblioteca?`)) return;
    try {
      const { error } = await supabase.from("library_videos").delete().eq("id", video.id);
      if (error) throw error;
      toast.success("Vídeo removido da biblioteca.");
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir vídeo.");
    }
  };

  // Mover vídeo para outra pasta
  const handleMoveVideo = async (videoId: string, targetFolderId: string) => {
    try {
      const { error } = await supabase
        .from("library_videos")
        .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
        .eq("id", videoId);
      if (error) throw error;
      toast.success("Vídeo movido!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao mover vídeo.");
    }
  };

  // Filtragem (somente vídeos da pasta selecionada)
  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  const filteredVideos = videos.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    return v.folder_id === selectedFolderId;
  });

  const getFolderVideoCount = (folderId: string) => {
    return videos.filter((v) => v.folder_id === folderId).length;
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Film className="size-6 text-amber-500" /> Biblioteca de Vídeos
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Organize seus Reels por pastas temáticas para agendamentos rápidos em massa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setEditingFolder(null);
              setFolderName("");
              setFolderColor(FOLDER_COLORS[0]);
              setFolderDialogOpen(true);
            }}
            variant="outline"
            size="sm"
            className="h-9 border-[#27272a] bg-[#18181b] hover:bg-[#202024] text-zinc-200 text-xs gap-1.5 cursor-pointer"
          >
            <FolderPlus className="size-4 text-amber-400" />
            Nova Pasta
          </Button>

          <Button
            onClick={handleUploadClick}
            size="sm"
            disabled={uploading}
            className="h-9 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="size-4" />
            {uploading ? "Enviando..." : "Carregar Vídeos"}
          </Button>

          <input
            type="file"
            multiple
            accept="video/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleUploadVideos}
            disabled={uploading}
          />
        </div>
      </div>

      {uploading && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 animate-pulse">
          <div className="size-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
          <span className="text-xs font-semibold text-amber-400">{uploadProgressText}</span>
        </div>
      )}

      {/* Main Grid: Pastas à Esquerda, Vídeos à Direita */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Painel Lateral de Pastas */}
        <div className="space-y-2 md:col-span-1">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Pastas</span>
            <span className="text-[11px] text-zinc-400 font-mono">{folders.length}</span>
          </div>

          <div className="space-y-1">
            {folders.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-[#27272a] rounded-xl bg-[#0c0c0e] space-y-2">
                <Folder className="size-6 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">Nenhuma pasta criada.</p>
                <Button
                  onClick={() => {
                    setEditingFolder(null);
                    setFolderName("");
                    setFolderColor(FOLDER_COLORS[0]);
                    setFolderDialogOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 h-7 cursor-pointer"
                >
                  <Plus className="size-3.5 mr-1" /> Criar Pasta
                </Button>
              </div>
            ) : (
              folders.map((folder) => {
                const active = selectedFolderId === folder.id;
                const count = getFolderVideoCount(folder.id);
                return (
                  <div
                    key={folder.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      active
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold"
                        : "text-zinc-300 hover:bg-[#18181b] hover:text-white"
                    }`}
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <span
                        className="size-3 rounded-full shrink-0 ring-1 ring-white/10"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {count}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="size-5 rounded hover:bg-zinc-700/50 grid place-items-center opacity-0 group-hover:opacity-100 transition text-zinc-400 hover:text-white">
                            <MoreVertical className="size-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#18181b] border-[#27272a] text-zinc-200">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingFolder(folder);
                              setFolderName(folder.name);
                              setFolderColor(folder.color || FOLDER_COLORS[0]);
                              setFolderDialogOpen(true);
                            }}
                            className="text-xs cursor-pointer gap-2"
                          >
                            <Edit2 className="size-3.5" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="text-xs cursor-pointer text-destructive focus:text-destructive gap-2"
                          >
                            <Trash2 className="size-3.5" /> Excluir Pasta e Vídeos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lista / Grid de Vídeos */}
        <div className="md:col-span-3 space-y-4">
          {/* Barra de Busca */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar vídeos por nome..."
                className="pl-9 h-9 text-xs bg-[#121215] border-[#27272a] text-zinc-200 placeholder:text-zinc-400 rounded-lg"
              />
            </div>
          </div>

          {/* Grid de Cards de Vídeo */}
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-xs">Carregando vídeos...</div>
          ) : folders.length === 0 ? (
            <div className="border border-dashed border-[#27272a] rounded-2xl p-12 text-center bg-[#0c0c0e]">
              <FolderPlus className="size-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-200">Crie sua primeira pasta</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Para carregar e organizar seus vídeos, você precisa criar uma pasta primeiro.
              </p>
              <Button
                onClick={() => {
                  setEditingFolder(null);
                  setFolderName("");
                  setFolderColor(FOLDER_COLORS[0]);
                  setFolderDialogOpen(true);
                }}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs gap-1.5 h-9 cursor-pointer"
              >
                <Plus className="size-4" /> Criar Pasta Agora
              </Button>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="border border-dashed border-[#27272a] rounded-2xl p-12 text-center bg-[#0c0c0e]">
              <Video className="size-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-200">Pasta vazia</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                A pasta <strong className="text-amber-400 font-semibold">"{currentFolder?.name}"</strong> ainda não tem vídeos. Carregue vídeos diretamente para esta pasta.
              </p>
              <Button
                onClick={handleUploadClick}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs gap-1.5 h-9 cursor-pointer"
              >
                <Upload className="size-4" /> Carregar Vídeos nesta Pasta
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredVideos.map((video) => {
                const folder = folders.find((f) => f.id === video.folder_id);
                return (
                  <div
                    key={video.id}
                    className="group relative bg-[#121215] border border-[#27272a] hover:border-amber-500/50 rounded-xl overflow-hidden flex flex-col transition duration-150"
                  >
                    {/* Preview / Thumbnail */}
                    <div
                      onClick={() => setPreviewVideoUrl(video.video_url)}
                      className="aspect-[9/16] bg-black/60 relative flex items-center justify-center cursor-pointer overflow-hidden group-hover:opacity-90"
                    >
                      <video
                        src={video.video_url}
                        className="w-full h-full object-cover pointer-events-none"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition">
                        <div className="size-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 grid place-items-center text-white group-hover:scale-110 transition shadow-lg">
                          <Play className="size-4 ml-0.5" />
                        </div>
                      </div>

                      {folder && (
                        <div
                          className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white/90 backdrop-blur-md shadow-sm border border-white/10 truncate max-w-[100px]"
                          style={{ backgroundColor: `${folder.color}cc` }}
                        >
                          {folder.name}
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
                      <div>
                        <span
                          className="text-xs font-semibold text-zinc-200 line-clamp-1 group-hover:text-amber-400 transition"
                          title={video.name}
                        >
                          {video.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                          {video.size_bytes && <span>{(video.size_bytes / 1024 / 1024).toFixed(1)} MB</span>}
                          <span>•</span>
                          <span>{new Date(video.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1f1f23]">
                        {folders.length > 1 ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-[11px] text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1 cursor-pointer">
                                <Folder className="size-3 text-amber-500" />
                                <span className="truncate max-w-[70px]">Mover</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-[#18181b] border-[#27272a] text-zinc-200">
                              {folders
                                .filter((f) => f.id !== video.folder_id)
                                .map((f) => (
                                  <DropdownMenuItem
                                    key={f.id}
                                    onClick={() => handleMoveVideo(video.id, f.id)}
                                    className="text-xs cursor-pointer gap-2"
                                  >
                                    <span
                                      className="size-2 rounded-full shrink-0"
                                      style={{ backgroundColor: f.color }}
                                    />
                                    <span>{f.name}</span>
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div />
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVideo(video)}
                          className="size-6 text-zinc-500 hover:text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar Pasta */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="bg-[#121215] border-[#27272a] text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingFolder ? "Editar Pasta" : "Nova Pasta de Vídeos"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Nome da Pasta</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Ex: Humor, Notícias, Motivação..."
                className="h-9 text-xs bg-[#18181b] border-[#27272a] text-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Cor da Tag</Label>
              <div className="flex items-center gap-2 pt-1">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFolderColor(c)}
                    className={`size-6 rounded-full transition grid place-items-center ring-offset-2 ring-offset-[#121215] cursor-pointer ${
                      folderColor === c ? "ring-2 ring-white scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {folderColor === c && <Check className="size-3 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFolderDialogOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveFolder}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Reprodução de Vídeo */}
      <Dialog open={!!previewVideoUrl} onOpenChange={(open) => !open && setPreviewVideoUrl(null)}>
        <DialogContent className="bg-black/95 border-[#27272a] p-2 max-w-md">
          {previewVideoUrl && (
            <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
