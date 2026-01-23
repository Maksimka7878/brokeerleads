"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { X, Calendar, MessageCircle, User, Phone, AtSign, Clock, Send, FileText, ArrowRight } from "lucide-react";

interface LeadModalProps {
  leadId: number;
  isOpen: boolean;
  onClose: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  "Новый": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Первое сообщение": "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  "2 сообщение": "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "3 сообщение": "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Заинтересован": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "На этапе формирования запроса": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Пропал": "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "Видеосозвон": "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  "На этапе согласования условий": "text-teal-400 bg-teal-500/10 border-teal-500/20",
  "Этап договор": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "Заключен": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
};

export default function LeadModal({ leadId, isOpen, onClose }: LeadModalProps) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

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

    setSending(true);
    try {
      await api.post("/interactions", {
        lead_id: leadId,
        contact_method: "Note",
        content: note
      });
      setNote("");
      fetchLeadDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const stageColor = lead?.stage ? STAGE_COLORS[lead.stage] || "text-slate-400 bg-slate-500/10 border-slate-500/20" : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl"></div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                <User className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {loading ? "Загрузка..." : lead?.full_name || "Без имени"}
                </h2>
                {!loading && (
                  <div className="flex items-center flex-wrap gap-3 mt-2">
                    {lead?.username ? (
                      <a
                        href={`https://t.me/${lead.username.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                        @{lead.username}
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <AtSign className="w-3.5 h-3.5" />
                        no_user
                      </span>
                    )}
                    {lead?.phone && (
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${stageColor}`}>
                      {lead?.stage}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-400 text-sm">Загрузка данных...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Left: Details */}
            <div className="w-full md:w-1/3 p-6 border-r border-white/5 bg-white/[0.02]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Информация
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Telegram ID</label>
                  <div className="font-mono text-sm text-white bg-white/5 px-3 py-2 rounded-lg">
                    {lead?.telegram_id || "—"}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Биография</label>
                  <div className="text-sm text-slate-300 bg-white/5 px-3 py-2 rounded-lg whitespace-pre-wrap min-h-[60px]">
                    {lead?.bio || "Нет описания"}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Дата создания</label>
                  <div className="text-sm text-slate-300 flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    {new Date(lead?.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1.5">Последнее обновление</label>
                  <div className="text-sm text-slate-300 flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    {new Date(lead?.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: History & Notes */}
            <div className="w-full md:w-2/3 p-6 flex flex-col">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                История взаимодействий
              </h3>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[350px]">
                {lead?.interactions?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm">История взаимодействий пуста</p>
                  </div>
                )}
                {lead?.interactions?.map((interaction: any) => (
                  <div key={interaction.id} className="flex gap-3 group">
                    <div className="flex-shrink-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        interaction.contact_method === "Move Stage"
                          ? "bg-violet-500/20 border border-violet-500/20"
                          : "bg-cyan-500/20 border border-cyan-500/20"
                      }`}>
                        {interaction.contact_method === "Move Stage" ? (
                          <ArrowRight className="w-4 h-4 text-violet-400" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`font-medium text-sm ${
                          interaction.contact_method === "Move Stage" ? "text-violet-400" : "text-white"
                        }`}>
                          {interaction.contact_method}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(interaction.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 whitespace-pre-wrap">{interaction.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Note */}
              <form onSubmit={handleAddNote} className="mt-auto pt-4 border-t border-white/5">
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Добавить заметку..."
                    className="input-dark w-full min-h-[80px] resize-none pr-24"
                  />
                  <button
                    type="submit"
                    disabled={!note.trim() || sending}
                    className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                      !note.trim() || sending
                        ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                    }`}
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Отправить
                      </>
                    )}
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
