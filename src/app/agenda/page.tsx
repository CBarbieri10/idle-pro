"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Calendar, Video, FileText, 
  ChevronLeft, ChevronRight, Clock, Edit3, X, Palette
} from "lucide-react";

type TaskType = "session" | "material" | "general";

interface Task {
  id: string;
  title: string;
  type: TaskType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  color: string;
}

const COLORS = [
  { id: "emerald", class: "bg-emerald-500" },
  { id: "purple", class: "bg-purple-500" },
  { id: "blue", class: "bg-blue-500" },
  { id: "amber", class: "bg-amber-500" },
  { id: "zinc", class: "bg-zinc-500" },
];

const initialTasks: Task[] = [
  { id: "t-1", title: "Analisar clássico Sub-20", type: "session", date: "2026-10-05", time: "10:00", color: "bg-emerald-500" },
  { id: "t-2", title: "Revisar relatório tático", type: "material", date: "2026-10-06", time: "14:00", color: "bg-amber-500" },
  { id: "t-3", title: "Corinthians x Palmeiras", type: "session", date: "2026-10-07", time: "16:00", color: "bg-purple-500" },
  { id: "t-4", title: "Scout quantitativo", type: "material", date: "2026-10-08", time: "09:00", color: "bg-blue-500" },
  { id: "t-5", title: "Decupagem atacante", type: "session", date: "2026-10-07", time: "18:00", color: "bg-zinc-500" },
  { id: "t-6", title: "Reunião de Diretoria", type: "general", date: "2026-10-10", time: "11:00", color: "bg-zinc-500" },
];

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function SingleScreenAgenda() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<"Dia" | "Semana" | "Mês">("Semana");
  
  // Base date for navigation. Default: Oct 7, 2026 (Wednesday)
  const [baseDate, setBaseDate] = useState(new Date(2026, 9, 7));
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
      return `${dayOfWeek}, ${String(d).padStart(2, '0')} de ${monthName} de ${y}`;
    }
    if (view === "Semana") {
      // Find Monday of the current week
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(baseDate.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      // Reset baseDate after calculation so we don't mutate state accidentally
      baseDate.setDate(d);

      return `${String(startOfWeek.getDate()).padStart(2, '0')} a ${String(endOfWeek.getDate()).padStart(2, '0')} de ${MONTH_NAMES[endOfWeek.getMonth()]} de ${endOfWeek.getFullYear()}`;
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
      // Format target date as YYYY-MM-DD
      const targetDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTasks = tasks.filter(t => t.date === targetDate);
      
      return [
        { id: "manha", title: "Manhã (06h - 12h)", date: targetDate, tasks: dayTasks.filter(t => { const h = parseInt(t.time); return h >= 6 && h < 12; }) },
        { id: "tarde", title: "Tarde (12h - 18h)", date: targetDate, tasks: dayTasks.filter(t => { const h = parseInt(t.time); return h >= 12 && h < 18; }) },
        { id: "noite", title: "Noite (18h - 00h)", date: targetDate, tasks: dayTasks.filter(t => { const h = parseInt(t.time); return h >= 18 || h < 6; }) },
      ];
    }

    if (view === "Semana") {
      // 7 Columns starting from Monday
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(baseDate.setDate(diff));
      baseDate.setDate(d); // Restore

      return Array.from({ length: 7 }).map((_, i) => {
        const current = new Date(y, m, monday.getDate() + i);
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const shortDayNames = ["Dom", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        return {
          id: dateStr,
          title: `${shortDayNames[current.getDay()]} (${String(current.getDate()).padStart(2, '0')})`,
          date: dateStr,
          tasks: tasks.filter(t => t.date === dateStr).sort((a, b) => a.time.localeCompare(b.time))
        };
      });
    }

    // Mês view: Grid of days in the month
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      return {
        id: dateStr,
        title: `${i + 1}`,
        date: dateStr,
        tasks: tasks.filter(t => t.date === dateStr).sort((a, b) => a.time.localeCompare(b.time))
      };
    });
  }, [tasks, view, baseDate]);

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case "session": return <Video className="h-3 w-3" />;
      case "material": return <FileText className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (view === "Semana" || view === "Mês") {
          return { ...t, date: targetColId };
        } else if (view === "Dia") {
          // Keep the same date, adjust time based on column
          let newTime = t.time;
          if (targetColId === "manha") newTime = "09:00";
          if (targetColId === "tarde") newTime = "14:00";
          if (targetColId === "noite") newTime = "19:00";
          return { ...t, time: newTime };
        }
      }
      return t;
    }));
  };

  const handleSaveTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
  };

  const handleAddTask = (colId: string, colDate: string) => {
    const isDayView = view === "Dia";
    let newTime = "12:00";
    if (isDayView) {
      if (colId === "manha") newTime = "09:00";
      if (colId === "tarde") newTime = "14:00";
      if (colId === "noite") newTime = "19:00";
    } else if (view === "Mês") {
      newTime = "10:00"; // Default time for month
    }

    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: "Novo Evento",
      type: "general",
      date: colDate,
      time: newTime,
      color: "bg-emerald-500"
    };
    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask);
  };

  return (
    <div className="w-full h-full min-h-[85vh] flex flex-col font-sans relative">
      
      {/* Edit Modal */}
      {editingTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-[#0c121d] border border-emerald-500/30 p-6 shadow-2xl relative">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-zinc-400 hover:text-white" onClick={() => setEditingTask(null)}>
              <X className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-black text-white mb-4">Editar Evento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Título</label>
                <Input 
                  value={editingTask.title} 
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Data</label>
                  <Input 
                    type="date"
                    value={editingTask.date} 
                    onChange={(e) => setEditingTask({...editingTask, date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Horário</label>
                  <Input 
                    type="time"
                    value={editingTask.time} 
                    onChange={(e) => setEditingTask({...editingTask, time: e.target.value})}
                    className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" /> Cor do Marcador
                </label>
                <div className="flex items-center gap-3">
                  {COLORS.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => setEditingTask({...editingTask, color: c.class})}
                      className={`h-8 w-8 rounded-full ${c.class} transition-transform hover:scale-110 ${editingTask.color === c.class ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0c121d]' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black" onClick={() => handleSaveTask(editingTask)}>
                Salvar Evento
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- Top Header --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-white/10 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-9 px-4 text-sm font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:text-white" onClick={handleToday}>
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white rounded-full" onClick={handlePrev}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white rounded-full" onClick={handleNext}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <h2 className="text-xl font-black text-white ml-2 tracking-tight">
            {getHeaderTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            {(["Dia", "Semana", "Mês"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  view === v ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Content (No horizontal scroll) --- */}
      <div className="flex-1 w-full overflow-hidden flex flex-col">
        
        {/* Dia & Semana Views (Flex Columns) */}
        {view !== "Mês" && (
          <div className="flex-1 flex gap-3 sm:gap-4 w-full h-full overflow-hidden">
            {layoutData.map((column: any) => (
              <div 
                key={column.id} 
                className="flex-1 flex flex-col bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden h-full"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-zinc-300 uppercase tracking-wider">{column.title}</h3>
                    <Badge variant="outline" className="bg-white/5 text-zinc-400 font-mono text-[10px] border-white/10 px-1.5 py-0">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white bg-white/5 rounded-full" onClick={() => handleAddTask(column.id, column.date)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Column Body (Vertical Scroll Only) */}
                <div className="flex-1 p-2 sm:p-3 overflow-y-auto hidden-scrollbar flex flex-col gap-2.5">
                  {column.tasks.map((task: Task) => (
                    <Card 
                      key={task.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-[#0c121d] border border-white/10 shadow-sm hover:border-emerald-500/50 transition-all cursor-grab active:cursor-grabbing group overflow-hidden relative"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.color}`} />
                      <div className="p-2.5 pl-3">
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                            {task.title}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 -mt-1 -mr-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 shrink-0 rounded"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit3 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-medium text-zinc-400">
                          {/* SHOW TIME IN BOTH DAY AND WEEK VIEWS */}
                          <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                            <Clock className="h-2.5 w-2.5" /> {task.time}
                          </div>
                          <div className={`flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 ${task.color.replace('bg-', 'text-')}`}>
                            {getTaskIcon(task.type)}
                            <span className="uppercase">{task.type === "session" ? "Sessão" : task.type === "material" ? "Material" : "Geral"}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <button 
                    onClick={() => handleAddTask(column.id, column.date)}
                    className="w-full py-2 mt-1 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent border-dashed hover:border-white/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mês View (CSS Grid Calendar) */}
        {view === "Mês" && (
          <div className="flex-1 grid grid-cols-7 gap-2 h-full auto-rows-fr">
            {/* Days of week header for Month view */}
            <div className="col-span-7 grid grid-cols-7 gap-2 mb-2 shrink-0">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-zinc-500 uppercase">{d}</div>
              ))}
            </div>
            {/* Calendar Cells */}
            {layoutData.map((cell: any) => (
              <div 
                key={cell.id} 
                className="bg-white/[0.02] border border-white/5 rounded-xl p-1.5 flex flex-col hover:bg-white/[0.04] transition-colors relative group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, cell.id)}
              >
                <div className="flex justify-between items-center mb-1 px-1">
                  <span className="text-xs font-bold text-zinc-400">{cell.title}</span>
                </div>
                <div className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col gap-1">
                  {cell.tasks.map((task: Task) => (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setEditingTask(task)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer truncate ${task.color} text-white hover:brightness-110 shadow-sm`}
                      title={`${task.time} - ${task.title}`}
                    >
                      {task.time} {task.title}
                    </div>
                  ))}
                </div>
                {/* Add button visible on hover at bottom of cell */}
                <button 
                  onClick={() => handleAddTask(cell.id, cell.date)}
                  className="mt-1 w-full py-1 rounded text-[8px] font-bold text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
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
