"use client";

import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { BookOpen, ExternalLink, FileText, Video, Link2, Search, Star, Clock, Download } from "lucide-react";

interface Material {
    id: number;
    title: string;
    description: string;
    type: "article" | "video" | "document" | "link";
    url: string;
    category: string;
    featured?: boolean;
}

const TYPE_ICONS = {
    article: FileText,
    video: Video,
    document: Download,
    link: Link2,
};

const TYPE_COLORS = {
    article: "from-cyan-500 to-blue-500",
    video: "from-rose-500 to-pink-500",
    document: "from-amber-500 to-orange-500",
    link: "from-violet-500 to-purple-500",
};

const CATEGORIES = ["Все", "Обучение", "Скрипты", "Инструменты", "Кейсы"];

const INITIAL_MATERIALS: Material[] = [
    {
        id: 1,
        title: "Как работать с возражениями",
        description: "Полное руководство по работе с типичными возражениями клиентов в B2B продажах",
        type: "article",
        url: "#",
        category: "Обучение",
        featured: true
    },
    {
        id: 2,
        title: "Техника SPIN-продаж",
        description: "Видео-урок по применению методологии SPIN для квалификации лидов",
        type: "video",
        url: "#",
        category: "Обучение"
    },
    {
        id: 3,
        title: "Шаблоны писем для холодных рассылок",
        description: "Готовые шаблоны email-писем с высокой конверсией",
        type: "document",
        url: "#",
        category: "Скрипты",
        featured: true
    },
    {
        id: 4,
        title: "CRM интеграции",
        description: "Ссылки на документацию по интеграции с популярными CRM системами",
        type: "link",
        url: "#",
        category: "Инструменты"
    },
    {
        id: 5,
        title: "Успешный кейс: 500 лидов за месяц",
        description: "Разбор реального кейса по привлечению B2B клиентов через Telegram",
        type: "article",
        url: "#",
        category: "Кейсы"
    },
    {
        id: 6,
        title: "Калькулятор ROI рассылок",
        description: "Инструмент для расчёта окупаемости lead generation кампаний",
        type: "link",
        url: "#",
        category: "Инструменты"
    },
];

export default function MaterialsPage() {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Все");

    const filteredMaterials = INITIAL_MATERIALS.filter(material => {
        const matchesSearch = material.title.toLowerCase().includes(search.toLowerCase()) ||
            material.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "Все" || material.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredMaterials = INITIAL_MATERIALS.filter(m => m.featured);

    return (
        <ProtectedLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="w-7 h-7 text-rose-400" />
                        Полезные материалы
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Обучающие материалы, кейсы и инструменты для эффективных продаж
                    </p>
                </div>

                {/* Featured Section */}
                {featuredMaterials.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {featuredMaterials.map(material => {
                            const Icon = TYPE_ICONS[material.type];
                            return (
                                <a
                                    key={material.id}
                                    href={material.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-rose-500/30 transition-all"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full blur-2xl"></div>
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${TYPE_COLORS[material.type]} flex items-center justify-center shadow-lg`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                <span className="text-xs text-amber-400 font-medium">Рекомендуем</span>
                                            </div>
                                            <h3 className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                                                {material.title}
                                            </h3>
                                            <p className="text-sm text-slate-400 mt-1">{material.description}</p>
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Поиск материалов..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Materials List */}
                <div className="space-y-3">
                    {filteredMaterials.map(material => {
                        const Icon = TYPE_ICONS[material.type];
                        return (
                            <a
                                key={material.id}
                                href={material.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 glass-card rounded-xl group hover:border-white/20 transition-all"
                            >
                                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${TYPE_COLORS[material.type]} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white group-hover:text-rose-300 transition-colors truncate">
                                        {material.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 truncate">{material.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full hidden sm:block">
                                        {material.category}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
                                </div>
                            </a>
                        );
                    })}
                </div>

                {filteredMaterials.length === 0 && (
                    <div className="text-center py-12">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-500">Материалы не найдены</p>
                    </div>
                )}
            </div>
        </ProtectedLayout>
    );
}
