"use client";

import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import LeadModal from './LeadModal';
import { User, AtSign, GripVertical } from 'lucide-react';

const STAGES = [
  "Новый",
  "Первое сообщение",
  "2 сообщение",
  "3 сообщение",
  "Заинтересован",
  "На этапе формирования запроса",
  "Пропал",
  "Видеосозвон",
  "На этапе согласования условий",
  "Этап договор",
  "Заключен"
];

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; accent: string; glow: string }> = {
  "Новый": { bg: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20", text: "text-blue-400", accent: "bg-blue-500", glow: "shadow-blue-500/20" },
  "Первое сообщение": { bg: "from-indigo-500/10 to-indigo-600/5", border: "border-indigo-500/20", text: "text-indigo-400", accent: "bg-indigo-500", glow: "shadow-indigo-500/20" },
  "2 сообщение": { bg: "from-violet-500/10 to-violet-600/5", border: "border-violet-500/20", text: "text-violet-400", accent: "bg-violet-500", glow: "shadow-violet-500/20" },
  "3 сообщение": { bg: "from-purple-500/10 to-purple-600/5", border: "border-purple-500/20", text: "text-purple-400", accent: "bg-purple-500", glow: "shadow-purple-500/20" },
  "Заинтересован": { bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20", text: "text-amber-400", accent: "bg-amber-500", glow: "shadow-amber-500/20" },
  "На этапе формирования запроса": { bg: "from-orange-500/10 to-orange-600/5", border: "border-orange-500/20", text: "text-orange-400", accent: "bg-orange-500", glow: "shadow-orange-500/20" },
  "Пропал": { bg: "from-rose-500/10 to-rose-600/5", border: "border-rose-500/20", text: "text-rose-400", accent: "bg-rose-500", glow: "shadow-rose-500/20" },
  "Видеосозвон": { bg: "from-fuchsia-500/10 to-fuchsia-600/5", border: "border-fuchsia-500/20", text: "text-fuchsia-400", accent: "bg-fuchsia-500", glow: "shadow-fuchsia-500/20" },
  "На этапе согласования условий": { bg: "from-teal-500/10 to-teal-600/5", border: "border-teal-500/20", text: "text-teal-400", accent: "bg-teal-500", glow: "shadow-teal-500/20" },
  "Этап договор": { bg: "from-cyan-500/10 to-cyan-600/5", border: "border-cyan-500/20", text: "text-cyan-400", accent: "bg-cyan-500", glow: "shadow-cyan-500/20" },
  "Заключен": { bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20", text: "text-emerald-400", accent: "bg-emerald-500", glow: "shadow-emerald-500/20" }
};

interface Lead {
  id: number;
  full_name: string;
  username: string;
  phone: string;
  stage: string;
  telegram_id: number | null;
}

function SortableItem({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colors = STAGE_COLORS[lead.stage] || STAGE_COLORS["Новый"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`lead-card p-4 rounded-xl cursor-grab active:cursor-grabbing group relative ${isDragging ? 'opacity-50 scale-105' : ''
        }`}
    >
      {/* Drag Handle Indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-slate-500" />
      </div>

      {/* Avatar & Name */}
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
          <User className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white text-sm truncate pr-6">
            {lead.full_name || "Без имени"}
          </div>
          {lead.username ? (
            <a
              href={`https://t.me/${lead.username.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors mt-0.5 truncate"
            >
              @{lead.username.replace(/^@/, '')}
            </a>
          ) : lead.telegram_id ? (
            <span className="text-xs text-slate-400 mt-0.5 truncate">
              ID: {lead.telegram_id}
            </span>
          ) : (
            <span className="text-xs text-slate-400 mt-0.5">
              no_user
            </span>
          )}
        </div>
      </div>

      {/* Hover Effect Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colors.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl`}></div>
    </div>
  );
}

function DroppableColumn({ id, items, onCardClick }: { id: string; items: Lead[]; onCardClick: (id: number) => void }) {
  const { setNodeRef } = useSortable({ id });
  const colors = STAGE_COLORS[id] || STAGE_COLORS["Новый"];

  return (
    <div className={`flex-shrink-0 w-72 kanban-column rounded-2xl flex flex-col max-h-full`}>
      {/* Column Header */}
      <div className={`p-4 border-b border-white/5 sticky top-0 z-10 bg-gradient-to-r ${colors.bg} rounded-t-2xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.accent}`}></div>
            <span className={`font-semibold text-sm ${colors.text}`}>{id}</span>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 ${colors.text}`}>
            {items.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto min-h-[100px] space-y-2">
        <SortableContext items={items.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {items.map((lead) => (
            <SortableItem key={lead.id} lead={lead} onClick={() => onCardClick(lead.id)} />
          ))}
        </SortableContext>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-xs text-slate-500">Нет лидов</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [selectedLeadId]);

  const fetchLeads = async () => {
    try {
      const res = await api.get("/leads");
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadId = active.id as number;
    let newStage = "";

    if (STAGES.includes(over.id as string)) {
      newStage = over.id as string;
    } else {
      const overLead = leads.find(l => l.id === over.id);
      if (overLead) {
        newStage = overLead.stage;
      }
    }

    if (!newStage) return;

    const lead = leads.find(l => l.id === activeLeadId);
    if (!lead || lead.stage === newStage) return;

    const oldStage = lead.stage;

    setLeads(prev => prev.map(l =>
      l.id === activeLeadId ? { ...l, stage: newStage } : l
    ));

    try {
      await api.post("/interactions", {
        lead_id: activeLeadId,
        contact_method: "Move Stage",
        content: `Moved from ${oldStage} to ${newStage}`,
        new_stage: newStage
      });
    } catch (err) {
      console.error("Failed to update stage", err);
      alert("Не удалось сохранить изменение этапа. Проверьте консоль или соединение с сервером.");
      setLeads(prev => prev.map(l =>
        l.id === activeLeadId ? { ...l, stage: oldStage } : l
      ));
    }
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;
  const activeColors = activeLead ? STAGE_COLORS[activeLead.stage] || STAGE_COLORS["Новый"] : null;

  return (
    <div className="h-[calc(100vh-200px)] overflow-x-auto pb-4">
      <div className="flex gap-4 h-full min-w-max px-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {STAGES.map((stage) => (
            <DroppableColumn
              key={stage}
              id={stage}
              items={leads.filter(l => l.stage === stage)}
              onCardClick={setSelectedLeadId}
            />
          ))}

          <DragOverlay>
            {activeLead && activeColors ? (
              <div className={`lead-card p-4 rounded-xl shadow-2xl ${activeColors.glow} rotate-3 cursor-grabbing w-72 border ${activeColors.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${activeColors.bg} ${activeColors.border} border flex items-center justify-center`}>
                    <User className={`w-5 h-5 ${activeColors.text}`} />
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{activeLead.full_name || "Без имени"}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <AtSign className="w-3 h-3" />
                      {activeLead.username || "no_user"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedLeadId && (
        <LeadModal
          leadId={selectedLeadId}
          isOpen={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onLeadArchived={() => fetchLeads()}
        />
      )}
    </div>
  );
}
