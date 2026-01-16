
"use client";

import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import LeadModal from './LeadModal';

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

const STAGE_COLORS: Record<string, string> = {
  "Новый": "bg-blue-50 border-blue-200 text-blue-800",
  "Первое сообщение": "bg-indigo-50 border-indigo-200 text-indigo-800",
  "2 сообщение": "bg-indigo-50 border-indigo-200 text-indigo-800",
  "3 сообщение": "bg-indigo-50 border-indigo-200 text-indigo-800",
  "Заинтересован": "bg-amber-50 border-amber-200 text-amber-800",
  "На этапе формирования запроса": "bg-orange-50 border-orange-200 text-orange-800",
  "Пропал": "bg-red-50 border-red-200 text-red-800",
  "Видеосозвон": "bg-purple-50 border-purple-200 text-purple-800",
  "На этапе согласования условий": "bg-teal-50 border-teal-200 text-teal-800",
  "Этап договор": "bg-emerald-50 border-emerald-200 text-emerald-800",
  "Заключен": "bg-green-100 border-green-300 text-green-900"
};

interface Lead {
  id: number;
  full_name: string;
  username: string;
  phone: string;
  stage: string;
}

function SortableItem({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-2 cursor-grab hover:shadow-md transition-shadow group relative"
    >
      <div className="font-medium text-gray-900 text-sm truncate pr-6">{lead.full_name || "Без имени"}</div>
      <div className="text-xs text-blue-500 truncate">@{lead.username || "no_user"}</div>
      {/* {lead.phone && <div className="text-xs text-gray-500 mt-1">{lead.phone}</div>} */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Подробнее"></div>
    </div>
  );
}

function DroppableColumn({ id, items, onCardClick }: { id: string; items: Lead[]; onCardClick: (id: number) => void }) {
  const { setNodeRef } = useSortable({ id });
  const colorClass = STAGE_COLORS[id] || "bg-gray-50 border-gray-200 text-gray-700";

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50/50 rounded-xl flex flex-col max-h-full border border-gray-100">
      <div className={`p-3 font-semibold border-b sticky top-0 rounded-t-xl z-10 flex justify-between items-center ${colorClass}`}>
        <span className="truncate">{id}</span>
        <span className="bg-white/50 text-current text-xs px-2 py-0.5 rounded-full shadow-sm">{items.length}</span>
      </div>
      <div ref={setNodeRef} className="p-2 flex-1 overflow-y-auto min-h-[100px] space-y-2">
        <SortableContext items={items.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {items.map((lead) => (
            <SortableItem key={lead.id} lead={lead} onClick={() => onCardClick(lead.id)} />
          ))}
        </SortableContext>
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
  }, [selectedLeadId]); // Refresh when modal closes

  const fetchLeads = async () => {
    try {
      const res = await api.get("/leads?limit=1000"); // Fetch all leads
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags
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
    // 'over.id' could be a column name OR another lead ID
    let newStage = "";

    if (STAGES.includes(over.id as string)) {
      newStage = over.id as string;
    } else {
      // Dropped on another card, find that card's stage
      const overLead = leads.find(l => l.id === over.id);
      if (overLead) {
        newStage = overLead.stage;
      }
    }

    if (!newStage) return;

    // Optimistic update
    const lead = leads.find(l => l.id === activeLeadId);
    if (!lead || lead.stage === newStage) return;

    const oldStage = lead.stage;
    
    setLeads(prev => prev.map(l => 
      l.id === activeLeadId ? { ...l, stage: newStage } : l
    ));

    // API Call
    try {
      await api.post("/interactions", {
        lead_id: activeLeadId,
        contact_method: "Move Stage",
        content: `Moved from ${oldStage} to ${newStage}`,
        new_stage: newStage
      });
    } catch (err) {
      console.error("Failed to update stage", err);
      // Revert on error
      setLeads(prev => prev.map(l => 
        l.id === activeLeadId ? { ...l, stage: oldStage } : l
      ));
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] overflow-x-auto pb-4">
      <div className="flex gap-4 h-full min-w-max px-4">
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
            {activeId ? (
              <div className="bg-white p-3 rounded-lg shadow-lg border border-blue-200 opacity-90 rotate-3 cursor-grabbing w-64">
                 <div className="font-medium text-gray-900">{leads.find(l => l.id === activeId)?.full_name}</div>
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
        />
      )}
    </div>
  );
}
