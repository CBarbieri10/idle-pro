"use client";
import { useState } from "react";
import { PlayCircle, Clock } from "lucide-react";

interface Clip {
  id: string;
  title: string;
  timeStr: string;
  seconds: number;
}

export function VideoTacticalBoard() {
  const [activeClip, setActiveClip] = useState<Clip | null>(null);

  const mockClips: Clip[] = [
    { id: "1", title: "Perda de bola no setor 2", timeStr: "14:22", seconds: 862 },
    { id: "2", title: "Ação de Pressão Alta", timeStr: "22:15", seconds: 1335 },
    { id: "3", title: "Assistência xG+ alta", timeStr: "41:05", seconds: 2465 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl overflow-hidden border border-white/10 bg-[#070a10]/50 backdrop-blur-md aspect-video relative flex items-center justify-center shadow-lg">
        {/* Mock Video Cover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black/80" />
        <div className="relative z-10 text-center space-y-3">
          <PlayCircle className="w-16 h-16 text-blue-400/80 hover:text-blue-400 mx-auto transition-colors cursor-pointer" />
          <div className="bg-black/60 px-4 py-2 rounded-lg border border-white/5 backdrop-blur-sm">
            <p className="text-white font-medium text-sm">
              {activeClip ? activeClip.title : "Nenhum recorte selecionado"}
            </p>
            <p className="text-blue-400 text-xs font-mono mt-1">
              {activeClip ? `Ir para ${activeClip.timeStr}` : "Aguardando interação..."}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-[#0b101a]/80 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col h-[400px] lg:h-auto shadow-lg">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-white tracking-tight">Playlist Tática</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {mockClips.map(clip => (
            <button
              key={clip.id}
              onClick={() => setActiveClip(clip)}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 group
                ${activeClip?.id === clip.id 
                  ? 'bg-gradient-to-r from-blue-500/20 to-transparent border-l-2 border-blue-400 shadow-md' 
                  : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/10'}`}
            >
              <span className={`text-sm font-medium ${activeClip?.id === clip.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                {clip.title}
              </span>
              <span className="text-xs font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded shadow-inner">
                {clip.timeStr}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
