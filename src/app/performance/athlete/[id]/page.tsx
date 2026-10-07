"use client";
import { VideoTacticalBoard } from "@/components/performance/video-tactical-board";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity } from "lucide-react";

const mockRollingData = [
  { match: "R1", val: 3.2, avg: 4.1 },
  { match: "R2", val: 4.5, avg: 4.1 },
  { match: "R3", val: 2.8, avg: 4.1 },
  { match: "R4", val: 5.1, avg: 4.1 },
  { match: "R5", val: 6.2, avg: 4.1 },
  { match: "R6", val: 7.0, avg: 4.1 },
  { match: "R7", val: 6.8, avg: 4.1 },
];

export default function AthletePerformancePage() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white">Laboratório Longitudinal</h1>
        <p className="text-zinc-400 mt-1">Análise de Evolução e Motor de Vídeo Tático</p>
      </header>

      <section className="p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Médias Móveis (Rolling Averages)</h2>
            <p className="text-sm text-zinc-500">Passes Progressivos / 90 vs Média da Liga (Posição)</p>
          </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockRollingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="match" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "rgba(11, 16, 26, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(8px)" }}
                itemStyle={{ color: "#fff", fontWeight: 500 }}
                labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
              />
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 5, fill: "#070a10", stroke: "#3b82f6", strokeWidth: 2 }} 
                activeDot={{ r: 7, fill: "#3b82f6" }}
                name="Atleta" 
              />
              <Line 
                type="monotone" 
                dataKey="avg" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false} 
                name="Média Liga" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Análise em Vídeo</h2>
          <p className="text-sm text-zinc-400">Motor de Tagging Tático</p>
        </div>
        <VideoTacticalBoard />
      </section>
    </div>
  );
}
