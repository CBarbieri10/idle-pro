"use client";

import { useState, useMemo, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Calendar,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  X,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";
import {
  type AgendaEventItem,
  createAgendaEvent,
  updateAgendaEvent,
  deleteAgendaEvent,
} from "@/lib/actions/agenda";

type TaskType = "session" | "material" | "general";

const COLORS = [
  { id: "emerald", class: "bg-emerald-500", label: "Verde Esmeralda" },
  { id: "purple", class: "bg-purple-500", label: "Roxo Tático" },
  { id: "blue", class: "bg-blue-500", label: "Azul Análise" },
  { id: "amber", class: "bg-amber-500", label: "Âmbar Alerta" },
  { id: "rose", class: "bg-rose-500", label: "Rose Prioritário" },
  { id: "zinc", class: "bg-zinc-500", label: "Grafite Geral" },
];

const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface AgendaViewProps {
  initialEvents: AgendaEventItem[];
}

export function AgendaView({ initialEvents }: AgendaViewProps) {
  const [tasks, setTasks] = useState<AgendaEventItem[]>(initialEvents);
  const [view, setView] = useState<"Dia" | "Semana" | "Mês">("Semana");
  const [isPending, startTransition] = useTransition();

  // Base date for navigation. Default: Oct 7, 2026 (Wednesday) or today
  const [baseDate, setBaseDate] = useState(new Date(2026, 9, 7));
  const [editingTask, setEditingTask] = useState<AgendaEventItem | null>(null);

  // --- Navigation Logic ---
  const handlePrev = () => {
    const newDate = new Date(baseDate);
    if (view === "Dia") newDate.setDate(newDate.getDate() - 1);
    if (view === "Semana") newDate.setDate(newDate.getDate() - 7);
    if (view === "Mês") newDate.setMonth(newDate.getMonth() - 1);
    setBaseDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(baseDate);
    if (view === "Dia") newDate.setDate(newDate.getDate() + 1);
    if (view === "Semana") newDate.setDate(newDate.getDate() + 7);
    if (view === "Mês") newDate.setMonth(newDate.getMonth() + 1);
    setBaseDate(newDate);
  };

  const handleToday = () => {
    setBaseDate(new Date(2026, 9, 7));
  };

  // --- Title Formatting ---
  const getHeaderTitle = () => {
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const d = baseDate.getDate();
    const dayOfWeek = DAY_NAMES[baseDate.getDay()];
    const monthName = MONTH_NAMES[m];

    if (view === "Dia") {
      return `${dayOfWeek}, ${String(d).padStart(2, "0")} de ${monthName} de ${y}`;
    }
    if (view === "Semana") {
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(baseDate.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      baseDate.setDate(d);

      return `${String(startOfWeek.getDate()).padStart(2, "0")} a ${String(
        endOfWeek.getDate()
      ).padStart(2, "0")} de ${
        MONTH_NAMES[endOfWeek.getMonth()]
      } de ${endOfWeek.getFullYear()}`;
    }
    if (view === "Mês") {
      return `${monthName} de ${y}`;
    }
  };

  // --- Layout Data ---
  const layoutData = useMemo(() => {
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const d = baseDate.getDate();

    if (view === "Dia") {
      const targetDate = `${y}-${String(m + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const dayTasks = tasks.filter((t) => t.date === targetDate);

      return [
        {
          id: "manha",
          title: "Manhã (06h - 12h)",
          date: targetDate,
          tasks: dayTasks.filter((t) => {
            const h = parseInt(t.time);
            return h >= 6 && h < 12;
          }),
        },
        {
          id: "tarde",
          title: "Tarde (12h - 18h)",
          date: targetDate,
          tasks: dayTasks.filter((t) => {
            const h = parseInt(t.time);
            return h >= 12 && h < 18;
          }),
        },
        {
          id: "noite",
          title: "Noite (18h - 00h)",
          date: targetDate,
          tasks: dayTasks.filter((t) => {
            const h = parseInt(t.time);
            return h >= 18 || h < 6;
          }),
        },
      ];
    }

    if (view === "Semana") {
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(baseDate.setDate(diff));
      baseDate.setDate(d);

      return Array.from({ length: 7 }).map((_, i) => {
        const current = new Date(y, m, monday.getDate() + i);
        const dateStr = `${current.getFullYear()}-${String(
          current.getMonth() + 1
        ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        const shortDayNames = [
          "Dom",
          "Segunda",
          "Terça",
          "Quarta",
          "Quinta",
          "Sexta",
          "Sábado",
        ];
        return {
          id: dateStr,
          title: `${shortDayNames[current.getDay()]} (${String(
            current.getDate()
          ).padStart(2, "0")})`,
          date: dateStr,
          tasks: tasks
            .filter((t) => t.date === dateStr)
            .sort((a, b) => a.time.localeCompare(b.time)),
        };
      });
    }

    // Mês view
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(
        i + 1
      ).padStart(2, "0")}`;
      return {
        id: dateStr,
        title: `${i + 1}`,
        date: dateStr,
        tasks: tasks
          .filter((t) => t.date === dateStr)
          .sort((a, b) => a.time.localeCompare(b.time)),
      };
    });
  }, [tasks, view, baseDate]);

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case "session":
        return <Video className="h-3 w-3" />;
      case "material":
        return <FileText className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newDate = task.date;
    let newTime = task.time;

    if (view === "Semana" || view === "Mês") {
      newDate = targetColId;
    } else if (view === "Dia") {
      if (targetColId === "manha") newTime = "09:00";
      if (targetColId === "tarde") newTime = "14:00";
      if (targetColId === "noite") newTime = "19:00";
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, date: newDate, time: newTime } : t))
    );

    startTransition(async () => {
      await updateAgendaEvent(taskId, { date: newDate, time: newTime });
    });
  };

  const handleSaveTask = async (taskToSave: AgendaEventItem) => {
    startTransition(async () => {
      if (taskToSave.id.startsWith("temp-")) {
        const created = await createAgendaEvent({
          title: taskToSave.title,
          type: taskToSave.type,
          date: taskToSave.date,
          time: taskToSave.time,
          color: taskToSave.color,
          description: taskToSave.description || undefined,
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === taskToSave.id ? created : t))
        );
      } else {
        await updateAgendaEvent(taskToSave.id, {
          title: taskToSave.title,
          type: taskToSave.type,
          date: taskToSave.date,
          time: taskToSave.time,
          color: taskToSave.color,
          description: taskToSave.description || undefined,
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === taskToSave.id ? taskToSave : t))
        );
      }
    });

    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setEditingTask(null);

    if (!taskId.startsWith("temp-")) {
      startTransition(async () => {
        await deleteAgendaEvent(taskId);
      });
    }
  };

  const handleAddTask = (colId: string, colDate: string) => {
    const isDayView = view === "Dia";
    let newTime = "12:00";
    if (isDayView) {
      if (colId === "manha") newTime = "09:00";
      if (colId === "tarde") newTime = "14:00";
      if (colId === "noite") newTime = "19:00";
    } else if (view === "Mês") {
      newTime = "10:00";
    }

    const newTask: AgendaEventItem = {
      id: `temp-${Date.now()}`,
      title: "Nova Sessão Tática",
      type: "session",
      date: colDate,
      time: newTime,
      color: "bg-emerald-500",
      description: "",
    };
    setTasks((prev) => [...prev, newTask]);
    setEditingTask(newTask);
  };

  return (
    <div className="w-full h-full min-h-[85vh] flex flex-col font-sans relative">
      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <Card className="w-full max-w-md bg-[#0c121d] border border-emerald-500/30 p-6 shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              onClick={() => setEditingTask(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="text-lg font-black text-white">
                {editingTask.id.startsWith("temp-")
                  ? "Agendar Nova Sessão"
                  : "Editar Evento Tático"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                  Título da Análise / Sessão
                </label>
                <Input
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Ex: Decupagem de Saída de Bola vs Flamengo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={editingTask.date}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, date: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                    Horário
                  </label>
                  <Input
                    type="time"
                    value={editingTask.time}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, time: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                  Tipo de Atividade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "session", label: "Sessão Vídeo", icon: Video },
                    { id: "material", label: "Relatório", icon: FileText },
                    { id: "general", label: "Reunião", icon: Calendar },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = editingTask.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setEditingTask({
                            ...editingTask,
                            type: t.id as TaskType,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                  Cor / Prioridade
                </label>
                <div className="flex gap-2 items-center flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setEditingTask({ ...editingTask, color: c.class })
                      }
                      className={`h-7 w-7 rounded-full ${
                        c.class
                      } flex items-center justify-center transition-transform ${
                        editingTask.color === c.class
                          ? "ring-2 ring-white scale-110"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {editingTask.color === c.class && (
                        <Check className="h-3.5 w-3.5 text-black" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                  Observações / Briefing Tático
                </label>
                <Textarea
                  value={editingTask.description ?? ""}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  className="bg-white/5 border-white/10 text-white min-h-[70px] text-xs"
                  placeholder="Detalhes, foco de observação ou links de referência..."
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                {!editingTask.id.startsWith("temp-") ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTask(null)}
                    className="border-white/10 text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveTask(editingTask)}
                    disabled={!editingTask.title.trim() || isPending}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                  >
                    {isPending ? "Salvando..." : "Salvar no Banco"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
              <Calendar className="h-3 w-3" /> Agenda Tática &bull; Sessões
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {tasks.length} {tasks.length === 1 ? "evento salvo" : "eventos salvos"}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">
            {getHeaderTitle()}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Planejamento operacional de decupagem, sessões com elenco e entregas de relatórios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggles */}
          <div className="flex bg-[#0c101d] border border-white/10 rounded-xl p-1 gap-1">
            {(["Dia", "Semana", "Mês"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  view === v
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Date Controls */}
          <div className="flex items-center gap-1 bg-[#0c101d] border border-white/10 rounded-xl p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-white"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-bold text-zinc-300 hover:text-white px-2.5"
              onClick={handleToday}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              const todayStr = `${baseDate.getFullYear()}-${String(
                baseDate.getMonth() + 1
              ).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;
              handleAddTask("manha", todayStr);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Evento
          </Button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 min-h-[550px] flex flex-col">
        {/* Dia / Semana Columns View */}
        {view !== "Mês" && (
          <div
            className={`grid gap-4 flex-1 ${
              view === "Dia" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
            }`}
          >
            {layoutData.map((col: any) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c101d]/60 backdrop-blur-md p-3 min-h-[300px]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    {col.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-white/10 text-zinc-400 px-1.5 py-0 h-4"
                  >
                    {col.tasks.length}
                  </Badge>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {col.tasks.map((task: AgendaEventItem) => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="p-3 bg-[#111726]/90 border border-white/10 hover:border-emerald-500/40 transition-all cursor-move group relative shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white leading-snug line-clamp-2">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTask(task)}
                          className="h-6 w-6 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                        <span className="flex items-center gap-1 font-bold text-zinc-300">
                          <Clock className="h-3 w-3 text-emerald-400" />
                          {task.time}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${task.color} text-black`}
                        >
                          {getTaskIcon(task.type)}
                          <span className="uppercase">{task.type}</span>
                        </span>
                      </div>
                    </Card>
                  ))}

                  <button
                    onClick={() => handleAddTask(col.id, col.date)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-dashed border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mês View */}
        {view === "Mês" && (
          <div className="flex-1 grid grid-cols-7 gap-2 h-full auto-rows-fr">
            <div className="col-span-7 grid grid-cols-7 gap-2 mb-2 shrink-0">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-wider"
                >
                  {d}
                </div>
              ))}
            </div>

            {layoutData.map((cell: any) => (
              <div
                key={cell.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, cell.id)}
                className="bg-[#0c101d]/60 border border-white/[0.08] rounded-2xl p-2 flex flex-col hover:border-emerald-500/30 transition-all min-h-[90px] group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-zinc-300">
                    {cell.title}
                  </span>
                  {cell.tasks.length > 0 && (
                    <span className="text-[9px] font-bold font-mono text-emerald-400">
                      {cell.tasks.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {cell.tasks.map((task: AgendaEventItem) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setEditingTask(task)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg cursor-pointer truncate ${task.color} text-black hover:opacity-90 transition-opacity shadow-sm`}
                      title={`${task.time} - ${task.title}`}
                    >
                      {task.time} {task.title}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleAddTask(cell.id, cell.date)}
                  className="mt-1 w-full py-0.5 rounded text-[8px] font-bold text-zinc-500 hover:text-white bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5"
                >
                  <Plus className="h-2.5 w-2.5" /> ADD
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
