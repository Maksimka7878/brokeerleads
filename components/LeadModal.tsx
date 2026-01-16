
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { X, Calendar, MessageCircle, User, Phone, AtSign, Clock } from "lucide-react";

interface LeadModalProps {
  leadId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadModal({ leadId, isOpen, onClose }: LeadModalProps) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
    }
  }, [isOpen, leadId]);

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leads/${leadId}`);
      setLead(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    try {
      await api.post("/interactions", {
        lead_id: leadId,
        contact_method: "Note",
        content: note
      });
      setNote("");
      fetchLeadDetails(); // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{loading ? "Загрузка..." : lead?.full_name || "Без имени"}</h2>
            {!loading && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <AtSign className="w-3 h-3" /> @{lead?.username || "no_user"}
                </span>
                {lead?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {lead?.phone}
                  </span>
                )}
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {lead?.stage}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Left: Details */}
            <div className="w-full md:w-1/3 p-6 border-r border-gray-100 bg-gray-50/30">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Информация</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Telegram ID</label>
                  <div className="font-mono text-sm">{lead?.telegram_id || "-"}</div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Биография / Описание</label>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{lead?.bio || "Нет описания"}</div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Дата создания</label>
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(lead?.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: History & Notes */}
            <div className="w-full md:w-2/3 p-6 flex flex-col bg-white">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">История взаимодействий</h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 max-h-[400px]">
                {lead?.interactions?.length === 0 && (
                  <div className="text-center text-gray-400 py-8 text-sm">История пуста</div>
                )}
                {lead?.interactions?.map((interaction: any) => (
                  <div key={interaction.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-gray-900">{interaction.contact_method}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(interaction.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{interaction.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Note */}
              <form onSubmit={handleAddNote} className="mt-auto pt-4 border-t border-gray-100">
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Добавить заметку..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[80px] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!note.trim()}
                    className="absolute bottom-3 right-3 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Отправить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
