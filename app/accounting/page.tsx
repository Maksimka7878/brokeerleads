"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";
import { Package, Upload, Trash2, Calendar, FileSpreadsheet, Users, AlertCircle } from "lucide-react";

interface LeadBatch {
    id: number;
    name: string;
    description: string | null;
    file_name: string | null;
    imported_at: string;
    count: number;
}

export default function AccountingPage() {
    const [batches, setBatches] = useState<LeadBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [batchName, setBatchName] = useState("");

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            const res = await api.get("/batches");
            setBatches(res.data);
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
        if (batchName.trim()) {
            formData.append("batch_name", batchName.trim());
        }

        setImporting(true);
        try {
            const res = await api.post("/import", formData);
            alert(`Импорт завершен! Добавлено ${res.data.imported_count} лидов.`);
            setBatchName("");
            fetchBatches();
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.detail || "Ошибка импорта";
            alert(`Ошибка: ${message}`);
        } finally {
            setImporting(false);
            e.target.value = "";
        }
    };

    const handleDelete = async (batchId: number, deleteLeads: boolean) => {
        const confirmMsg = deleteLeads
            ? "Удалить партию И все связанные лиды? Это действие необратимо."
            : "Удалить только запись о партии? Лиды останутся в базе.";

        if (!confirm(confirmMsg)) return;

        try {
            await api.delete(`/batches/${batchId}?delete_leads=${deleteLeads}`);
            fetchBatches();
        } catch (err) {
            console.error(err);
            alert("Ошибка при удалении");
        }
    };

    const totalLeads = batches.reduce((sum, b) => sum + b.count, 0);

    return (
        <ProtectedLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Package className="w-7 h-7 text-emerald-400" />
                            Учет лидов
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            История импортов и управление партиями
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                                <Package className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{batches.length}</div>
                                <div className="text-xs text-slate-400">Всего партий</div>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20">
                                <Users className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{totalLeads}</div>
                                <div className="text-xs text-slate-400">Импортировано лидов</div>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                                <Calendar className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {batches.length > 0
                                        ? new Date(batches[0].imported_at).toLocaleDateString('ru-RU')
                                        : "—"}
                                </div>
                                <div className="text-xs text-slate-400">Последний импорт</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Import Section */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-cyan-400" />
                        Новый импорт
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            value={batchName}
                            onChange={(e) => setBatchName(e.target.value)}
                            placeholder="Название партии (опционально)"
                            className="input-dark flex-1"
                        />
                        <div className="relative">
                            <input
                                type="file"
                                id="batch-upload"
                                className="hidden"
                                accept=".xlsx"
                                onChange={handleImport}
                                disabled={importing}
                            />
                            <label
                                htmlFor="batch-upload"
                                className={`btn-primary flex items-center gap-2 cursor-pointer whitespace-nowrap ${importing ? "opacity-50 cursor-wait" : ""}`}
                            >
                                {importing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Импорт...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Загрузить Excel
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Batches Table */}
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Партия
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Файл
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Лидов
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Дата импорта
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Действия
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((batch) => (
                                    <tr
                                        key={batch.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                                                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{batch.name}</div>
                                                    {batch.description && (
                                                        <div className="text-xs text-slate-500">{batch.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 text-sm">{batch.file_name || "—"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1.5 inline-flex text-xs font-semibold rounded-full border text-violet-400 bg-violet-500/10 border-violet-500/20">
                                                {batch.count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(batch.imported_at).toLocaleString('ru-RU')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDelete(batch.id, false)}
                                                    className="p-2 hover:bg-slate-500/10 text-slate-400 hover:text-slate-300 rounded-lg transition-colors"
                                                    title="Удалить только запись"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(batch.id, true)}
                                                    className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                                    title="Удалить с лидами"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {batches.length === 0 && !loading && (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <Package className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Нет импортированных партий
                            </h3>
                            <p className="text-slate-400 text-sm max-w-md mx-auto">
                                Загрузите Excel файл выше, чтобы начать учет лидов.
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="p-16 text-center">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-slate-400 text-sm">Загрузка...</p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedLayout>
    );
}
