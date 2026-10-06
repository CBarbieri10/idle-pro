"use client";

import { useState, useTransition } from "react";
import {
  Video,
  Play,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  Tv,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createVideoLink, deleteVideoLink } from "@/lib/actions/video-links";
import { detectVideoHost, TACTICAL_VIDEO_CATEGORIES } from "@/lib/video-links";
import { cn } from "@/lib/utils";

export interface AthleteVideoItem {
  id: string;
  url: string;
  title: string | null;
  category: string;
  description: string | null;
  createdAt: Date | string;
  match: {
    id: string;
    round: string | null;
    competition: string;
    opponentName: string;
    date: Date | string;
  } | null;
}

interface AthleteVideoLinksProps {
  athleteId: string;
  athleteName: string;
  videos: AthleteVideoItem[];
  matchOptions: Array<{
    id: string;
    label: string;
  }>;
}

function HostIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "YOUTUBE":
      return (
        <span className={cn("flex items-center justify-center text-red-500", className)}>
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      );
    case "GOOGLE_DRIVE":
      return (
        <span className={cn("flex items-center justify-center text-sky-400", className)}>
          <FolderOpen className="h-3.5 w-3.5" />
        </span>
      );
    case "VIMEO":
      return (
        <span className={cn("flex items-center justify-center text-cyan-400", className)}>
          <Tv className="h-3.5 w-3.5" />
        </span>
      );
    case "WYSCOUT":
      return (
        <span className={cn("flex items-center justify-center text-emerald-400", className)}>
          <Video className="h-3.5 w-3.5" />
        </span>
      );
    default:
      return (
        <span className={cn("flex items-center justify-center text-zinc-400", className)}>
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      );
  }
}

export function AthleteVideoLinks({
  athleteId,
  athleteName,
  videos,
  matchOptions,
}: AthleteVideoLinksProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(TACTICAL_VIDEO_CATEGORIES[0]);
  const [matchId, setMatchId] = useState<string>("none");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const detectedHost = url ? detectVideoHost(url) : null;

  // Categories present in videos + count
  const categoryCounts = videos.reduce<Record<string, number>>((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {});

  const presentCategories = Object.keys(categoryCounts);

  const filteredVideos =
    selectedCategory === "ALL"
      ? videos
      : videos.filter((v) => v.category === selectedCategory);

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setErrorMsg("A URL deve começar com http:// ou https://");
      return;
    }

    startTransition(async () => {
      try {
        await createVideoLink({
          athleteId,
          url,
          title,
          category,
          matchId: matchId === "none" ? undefined : matchId,
          description: description || undefined,
        });

        // Reset
        setUrl("");
        setTitle("");
        setCategory(TACTICAL_VIDEO_CATEGORIES[0]);
        setMatchId("none");
        setDescription("");
        setIsAddOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao salvar vídeo";
        setErrorMsg(msg);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este link de vídeo?")) return;

    startTransition(async () => {
      await deleteVideoLink(id, athleteId);
    });
  }

  return (
    <Card className="rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-md" id="athlete-videos">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-indigo-500/10 to-transparent border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xs">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-foreground font-serif">
                Videoteca Tática & Decupagens
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-white/10 text-muted-foreground">
                {videos.length} {videos.length === 1 ? "clipe" : "clipes"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acervo de clipes externos (Google Drive, YouTube, Wyscout) categorizados por momento tático
            </p>
          </div>
        </div>

        {/* Add Button */}
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shadow-sm shadow-indigo-600/20 rounded-xl"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Clipe Tático
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[540px] bg-[#0d1017] border border-white/15 text-foreground shadow-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2 font-serif">
                <Video className="h-4 w-4 text-indigo-400" />
                Novo Clipe Tático &bull; {athleteName}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span>URL do Vídeo Externo *</span>
                  {detectedHost && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 normal-case">
                      <HostIcon type={detectedHost.type} className="h-3 w-3" />
                      Host: {detectedHost.label}
                    </span>
                  )}
                </label>
                <Input
                  type="url"
                  placeholder="https://drive.google.com/... ou https://youtube.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="bg-black/30 border-white/10 text-xs focus:border-indigo-500"
                />
                <p className="text-[10px] text-zinc-500">
                  Suporta Google Drive, YouTube, Vimeo, Wyscout ou qualquer link direto.
                </p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Título do Clipe / Ação *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Saída sob pressão e quebra de linhas vs Santos"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-black/30 border-white/10 text-xs focus:border-indigo-500"
                />
              </div>

              {/* Category & Match in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Categoria Tática *
                  </label>
                  <Select value={category} onValueChange={(val) => setCategory(val ?? TACTICAL_VIDEO_CATEGORIES[0])}>
                    <SelectTrigger className="bg-black/30 border-white/10 text-xs w-full">
                      <SelectValue placeholder="Selecione categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12151e] border-white/15 text-foreground">
                      {TACTICAL_VIDEO_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Jogo Vinculado (Opcional)
                  </label>
                  <Select value={matchId} onValueChange={(val) => setMatchId(val ?? "none")}>
                    <SelectTrigger className="bg-black/30 border-white/10 text-xs w-full">
                      <SelectValue placeholder="Sem vínculo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#12151e] border-white/15 text-foreground max-h-56">
                      <SelectItem value="none" className="text-xs">
                        Sem vínculo específico
                      </SelectItem>
                      {matchOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs truncate">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Parecer Tático do Scout (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Excelente tomada de decisão no 1v1. Utilizou pé direito para fixar o lateral e acelerou na diagonal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg bg-black/30 border border-white/10 p-2.5 text-xs text-foreground placeholder:text-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Salvando...
                    </>
                  ) : (
                    "Registrar Clipe"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Category Pills Filter */}
      {videos.length > 0 && presentCategories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "rounded-lg text-xs font-bold px-3 py-1 h-7 shrink-0 transition-colors",
              selectedCategory === "ALL"
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            Todos ({videos.length})
          </Button>

          {presentCategories.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-lg text-xs font-bold px-3 py-1 h-7 shrink-0 transition-colors",
                selectedCategory === cat
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {cat} ({categoryCounts[cat]})
            </Button>
          ))}
        </div>
      )}

      {/* Videos List / Grid */}
      {filteredVideos.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
            <Video className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">Nenhum clipe tático registrado</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4">
            Adicione links de vídeos externos do Google Drive, Wyscout ou YouTube com decupagens e lances-chave de {athleteName}.
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            variant="outline"
            className="text-xs font-bold border-white/15 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Primeiro Clipe
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
          {filteredVideos.map((video) => {
            const hostInfo = detectVideoHost(video.url);

            return (
              <div
                key={video.id}
                className="group relative rounded-xl border border-white/[0.09] bg-gradient-to-b from-[#121622]/90 to-[#0b0e17]/90 p-4 shadow-sm hover:border-indigo-500/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Category & Host Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border-indigo-500/25 truncate max-w-[200px]"
                    >
                      {video.category}
                    </Badge>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border font-mono",
                        hostInfo.badgeClass
                      )}
                    >
                      <HostIcon type={hostInfo.type} className="h-3 w-3" />
                      {hostInfo.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-black text-white group-hover:text-indigo-200 transition-colors line-clamp-2">
                    {video.title || "Clipe Tático"}
                  </h4>

                  {/* Match info if attached */}
                  {video.match && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1.5">
                      <Calendar className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span className="truncate">
                        vs {video.match.opponentName}
                        {video.match.round ? ` • ${video.match.round}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Description / Commentary */}
                  {video.description && (
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/[0.04]">
                      {video.description}
                    </p>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Assistir Clipe</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(video.id)}
                    disabled={isPending}
                    className="h-7 w-7 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Excluir link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
