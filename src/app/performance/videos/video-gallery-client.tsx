"use client";
import { useState } from "react";
import { Search, PlayCircle } from "lucide-react";
import Link from "next/link";

export function VideoGalleryClient({ initialClips }: { initialClips: any[] }) {
  const [search, setSearch] = useState("");
  
  const filtered = initialClips.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.athlete?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Buscar vídeos, atletas ou categorias..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(clip => (
          <div key={clip.id} className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all shadow-md">
            <div className="aspect-video bg-[#070a10] relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-black/80" />
              <PlayCircle className="w-12 h-12 text-emerald-400/50 group-hover:text-emerald-400 transition-colors relative z-10" />
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 border border-white/5 backdrop-blur-sm">
                {clip.startTime ? `${Math.floor(clip.startTime/60)}:${(clip.startTime%60).toString().padStart(2, '0')}` : "0:00"}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight">{clip.title || "Recorte sem título"}</h3>
              </div>
              <span className="inline-block px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wide uppercase">
                {clip.category || "Sem Categoria"}
              </span>
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/5">
                <Link href={`/performance/athlete/${clip.athleteId}`} className="hover:text-white transition-colors font-medium">
                  {clip.athlete?.name || "Desconhecido"}
                </Link>
                <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
            <p className="text-zinc-500 font-medium">Nenhum vídeo encontrado para sua busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
