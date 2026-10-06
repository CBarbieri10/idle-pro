"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Brain,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  Shield,
  Target,
  Flame,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

let messageCounter = 0;
function createMessageId(prefix: string) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timeLabel: string;
  matchedAthletes?: Array<{
    id: string;
    name: string;
    position: string;
    teamName: string;
    photoUrl: string | null;
    idgScore?: number | null;
    stabilityCategory?: string | null;
  }>;
}

const SUGGESTIONS = [
  {
    icon: Target,
    label: "Laterais c/ Cruzamentos & IDG Estável",
    prompt: "Me sugira laterais esquerdos com alto índice de cruzamentos e IDG estável.",
  },
  {
    icon: Shield,
    label: "Melhores Volantes em PAdj",
    prompt: "Quem são os melhores volantes em PAdj (Desarmes ajustados por posse)?",
  },
  {
    icon: Flame,
    label: "Eficiência Ofensiva (xG/Shot)",
    prompt: "Quais atacantes têm a melhor eficiência de finalização por xG/Shot?",
  },
  {
    icon: Sparkles,
    label: "Oportunidades Moneyball",
    prompt: "Quais são as melhores oportunidades Moneyball (alto desempenho com estabilidade alta)?",
  },
];

export function ScoutingCopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá, Analista! Eu sou o **Head Scout & Copilot de IA** do The Net Scouting.\n\nTenho acesso direto à **base canônica de atletas**, aos cálculos de **IDG (Índice de Desempenho Global)**, **PAdj (Possession-Adjusted)** e **xG/Shot**.\n\nComo posso apoiar a sua tomada de decisão no mercado hoje?",
      timeLabel: "Agora",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: text,
      timeLabel: "Enviado",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          messages: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na comunicação com o Copilot.");
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: createMessageId("ai"),
        role: "assistant",
        content: data.response || "Análise concluída com sucesso.",
        timeLabel: "Resposta",
        matchedAthletes: data.matchedAthletes || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("error"),
          role: "assistant",
          content:
            "Houve uma instabilidade na consulta ao motor de IA. Por favor, tente novamente.",
          timeLabel: "Erro",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ─── Header Launcher Button ────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold text-emerald-400 hover:text-white hover:border-emerald-400/60 hover:bg-emerald-500/25 transition-all shadow-[0_0_15px_rgba(0,230,118,0.12)] active:scale-95"
        title="Abrir Scouting Copilot de IA"
        aria-label="Scouting Copilot de IA"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Brain className="h-4 w-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Copilot IA</span>
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          RAG
        </span>
      </button>

      {/* ─── Slide-over Backdrop & Drawer ──────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-xl md:max-w-2xl bg-[#090d16] border-l border-white/10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] p-4 sm:px-6 bg-[#0c121e]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-white uppercase tracking-wider">
                        Scouting Copilot
                      </h2>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono py-0 h-4">
                        RAG Active
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Cientista de Dados de Elite & Head Scout TNS
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5"
                    onClick={() =>
                      setMessages([
                        {
                          id: "reset",
                          role: "assistant",
                          content:
                            "Histórico reiniciado. Como posso te auxiliar na busca por novos talentos?",
                          timeLabel: "Reiniciado",
                        },
                      ])
                    }
                    title="Limpar conversa"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5"
                    onClick={() => setIsOpen(false)}
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Suggestions Carousel / Grid */}
                {messages.length <= 2 && (
                  <div className="space-y-2 mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      Sugestões de Análise Tática
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUGGESTIONS.map((s, idx) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSend(s.prompt)}
                            className="flex items-start gap-2.5 p-2.5 text-left rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-emerald-500/[0.08] hover:border-emerald-500/30 transition-all text-xs group"
                          >
                            <Icon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-200 group-hover:text-emerald-300 line-clamp-1">
                                {s.label}
                              </p>
                              <p className="text-[10px] text-zinc-500 line-clamp-1">
                                {s.prompt}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Message Bubbles */}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 shadow-md",
                        m.role === "user"
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs"
                          : "bg-[#111726]/90 border border-white/[0.08] text-zinc-200 rounded-bl-xs"
                      )}
                    >
                      <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap">
                        {m.content}
                      </div>

                      {/* Micro-cards of Matched Athletes */}
                      {m.matchedAthletes && m.matchedAthletes.length > 0 && (
                        <div className="pt-2 border-t border-white/[0.08] space-y-1.5 mt-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Atletas Relacionados na Base:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {m.matchedAthletes.map((a) => (
                              <Link
                                key={a.id}
                                href={`/athletes/${a.id}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-emerald-500/30 transition-all group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 rounded-md bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                                    {a.photoUrl ? (
                                      <Image
                                        src={a.photoUrl}
                                        alt={a.name}
                                        width={24}
                                        height={24}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      a.name.slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-zinc-200 group-hover:text-emerald-400 truncate text-[11px]">
                                      {a.name}
                                    </p>
                                    <p className="text-[9px] text-zinc-400 truncate">
                                      {a.position} • {a.teamName}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  {a.idgScore != null && (
                                    <span className="text-[10px] font-mono text-zinc-300">
                                      {a.idgScore.toFixed(0)}%
                                    </span>
                                  )}
                                  <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-emerald-400" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <div
                        className={cn(
                          "text-[9px] text-right pt-0.5",
                          m.role === "user" ? "text-emerald-200/70" : "text-zinc-500"
                        )}
                      >
                        {m.timeLabel}
                      </div>
                    </div>

                    {m.role === "user" && (
                      <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start items-center">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Bot className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="bg-[#111726]/90 border border-white/[0.08] px-4 py-2.5 rounded-2xl rounded-bl-xs text-xs text-zinc-400 flex items-center gap-2">
                      <span className="animate-pulse">
                        Cruzando dados canônicos, IDG e métricas avançadas...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-white/[0.08] p-4 bg-[#0c121e]/90 backdrop-blur-md">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-end gap-2 bg-[#131b2c] border border-white/10 rounded-2xl p-2 focus-within:border-emerald-500/50 transition-all shadow-inner"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Faça uma pergunta tática (ex: sugira laterais esquerdos com alto cruzamento)..."
                    className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none max-h-24"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || loading}
                    size="icon"
                    className="h-8 w-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 hover:opacity-90 disabled:opacity-40 shrink-0 transition-all font-bold"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
                <p className="text-[10px] text-zinc-500 text-center mt-2">
                  Pressione <kbd className="font-mono text-zinc-400">Enter</kbd> para enviar • <kbd className="font-mono text-zinc-400">Shift + Enter</kbd> para nova linha
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
