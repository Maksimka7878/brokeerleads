"use client";

import { useEffect, useState, useMemo } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";
import { Upload, Search, Users, Calendar, ChevronDown, ArrowUpDown, X } from "lucide-react";

const STAGES = [
  "Все этапы",
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

export default function ContactsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("Все этапы");
  const [sortField, setSortField] = useState<"created_at" | "full_name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get("/leads");
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/import", formData);
      alert("Импорт завершен успешно!");
      fetchLeads();
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.detail || "Ошибка импорта";
      const userMessage = message.includes("InvalidTextRepresentation")
        ? "Ошибка в данных файла: проверьте, что в колонках правильные типы данных (числа, текст)."
        : `Ошибка: ${message}`;
      alert(userMessage);
    }
  };

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead =>
        lead.full_name?.toLowerCase().includes(query) ||
        lead.username?.toLowerCase().includes(query) ||
        lead.phone?.includes(query)
      );
    }

    // Stage filter
    if (stageFilter !== "Все этапы") {
      result = result.filter(lead => lead.stage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "created_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = aVal?.toLowerCase() || "";
        bVal = bVal?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [leads, searchQuery, stageFilter, sortField, sortOrder]);

  const toggleSort = (field: "created_at" | "full_name") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-7 h-7 text-cyan-400" />
              База контактов
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {filteredLeads.length} из {leads.length} контактов
            </p>
          </div>

          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx"
              onChange={handleImport}
            />
            <label
              htmlFor="file-upload"
              className="btn-primary flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Импорт Excel
            </label>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по имени, username или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-dark w-full pl-12 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Stage Filter */}
            <div className="relative min-w-[200px]">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="input-dark w-full appearance-none pr-10 cursor-pointer"
              >
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleSort("created_at")}
                className={`btn-secondary flex items-center gap-2 text-sm ${sortField === "created_at" ? "border-violet-500/50" : ""}`}
              >
                <Calendar className="w-4 h-4" />
                Дата
                {sortField === "created_at" && (
                  <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                )}
              </button>
              <button
                onClick={() => toggleSort("full_name")}
                className={`btn-secondary flex items-center gap-2 text-sm ${sortField === "full_name" ? "border-violet-500/50" : ""}`}
              >
                <Users className="w-4 h-4" />
                Имя
                {sortField === "full_name" && (
                  <ArrowUpDown className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Контакт
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Телефон
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Этап
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Дата создания
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-violet-400">
                            {(lead.full_name?.[0] || lead.username?.[0] || "?").toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {lead.full_name || "Не указано"}
                          </div>
                          <div className="text-sm text-cyan-400">
                            @{lead.username || "no_user"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{lead.phone || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full border ${STAGE_COLORS[lead.stage] || "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredLeads.length === 0 && !loading && (
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {leads.length === 0 ? "База контактов пуста" : "Ничего не найдено"}
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                {leads.length === 0
                  ? "Импортируйте данные из Excel файла, чтобы начать работу с контактами."
                  : "Попробуйте изменить параметры поиска или фильтрации."}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-16 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-400 text-sm">Загрузка контактов...</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
