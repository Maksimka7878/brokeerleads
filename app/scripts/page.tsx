"use client";

import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { FileText, Plus, Copy, Check, Search, MessageSquare, User, Phone, Zap, Edit, Trash2 } from "lucide-react";

interface Script {
    id: number;
    title: string;
    content: string;
    category: string;
}

const CATEGORIES = [
    { name: "Все", color: "from-violet-500 to-purple-500" },
    { name: "Приветствие", color: "from-cyan-500 to-blue-500" },
    { name: "Возражения", color: "from-amber-500 to-orange-500" },
    { name: "Закрытие", color: "from-emerald-500 to-teal-500" },
    { name: "Другое", color: "from-rose-500 to-pink-500" },
];

const INITIAL_SCRIPTS: Script[] = [
    {
        id: 1,
        title: "Приветствие нового лида",
        content: "Здравствуйте, {имя}! Меня зовут {менеджер}, я представляю компанию {компания}. Увидел вашу заявку и хотел бы обсудить, как мы можем помочь вам с {запрос}.",
        category: "Приветствие"
    },
    {
        id: 2,
        title: "Ответ на 'дорого'",
        content: "Понимаю вашу позицию. Давайте разберёмся, что входит в стоимость: {перечисление}. Если сравнить с {конкурент}, наше предложение включает в себя {преимущества}. Какой бюджет вы рассматриваете?",
        category: "Возражения"
    },
    {
        id: 3,
        title: "Закрытие на звонок",
        content: "Отлично, {имя}! Для того чтобы подобрать оптимальное решение, предлагаю созвониться на 15 минут. Когда вам удобнее — сегодня в 15:00 или завтра в 11:00?",
        category: "Закрытие"
    },
    {
        id: 4,
        title: "Подогрев после тишины",
        content: "Добрый день, {имя}! Пишу уточнить — удалось ли вам ознакомиться с нашим предложением? Возможно, появились вопросы? Буду рад помочь!",
        category: "Приветствие"
    },
];

export default function ScriptsPage() {
    const [scripts, setScripts] = useState<Script[]>(INITIAL_SCRIPTS);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Все");
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newScript, setNewScript] = useState({ title: "", content: "", category: "Приветствие" });

    const filteredScripts = scripts.filter(script => {
        const matchesSearch = script.title.toLowerCase().includes(search.toLowerCase()) ||
            script.content.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "Все" || script.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleCopy = (script: Script) => {
        navigator.clipboard.writeText(script.content);
        setCopiedId(script.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleAddScript = () => {
        if (!newScript.title.trim() || !newScript.content.trim()) return;
        const id = Math.max(...scripts.map(s => s.id), 0) + 1;
        setScripts([...scripts, { ...newScript, id }]);
        setNewScript({ title: "", content: "", category: "Приветствие" });
        setShowAddModal(false);
    };

    const handleDeleteScript = (id: number) => {
        if (!confirm("Удалить скрипт?")) return;
        setScripts(scripts.filter(s => s.id !== id));
    };

    return (
        <ProtectedLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <FileText className="w-7 h-7 text-emerald-400" />
                            Скрипты продаж
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Готовые шаблоны для быстрых ответов клиентам
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Добавить скрипт
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Поиск по скриптам..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat.name
                                        ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scripts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredScripts.map(script => (
                        <div key={script.id} className="glass-card rounded-2xl p-5 group hover:border-emerald-500/30 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-white">{script.title}</h3>
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                                        {script.category}
                                    </span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDeleteScript(script.id)}
                                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                                {script.content}
                            </p>
                            <button
                                onClick={() => handleCopy(script)}
                                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${copiedId === script.id
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {copiedId === script.id ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Скопировано!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Скопировать
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {filteredScripts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500">Скрипты не найдены</p>
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card rounded-2xl p-6 w-full max-w-lg">
                            <h3 className="text-lg font-bold text-white mb-4">Новый скрипт</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Название</label>
                                    <input
                                        type="text"
                                        value={newScript.title}
                                        onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                                        placeholder="Название скрипта"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Категория</label>
                                    <select
                                        value={newScript.category}
                                        onChange={(e) => setNewScript({ ...newScript, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                                    >
                                        {CATEGORIES.filter(c => c.name !== "Все").map(cat => (
                                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Текст скрипта</label>
                                    <textarea
                                        value={newScript.content}
                                        onChange={(e) => setNewScript({ ...newScript, content: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 min-h-[120px]"
                                        placeholder="Текст скрипта... Используйте {переменные} для подстановки"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleAddScript}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium"
                                >
                                    Добавить
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedLayout>
    );
}
