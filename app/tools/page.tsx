"use client";

import { useState, useRef } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Hammer, Download, Trash2, Plus, FileSpreadsheet, Wand2, Image as ImageIcon, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';

interface LeadRow {
    id: number;
    phone: string;
    name: string;
    request: string;
    date: string;
}

export default function ToolsPage() {
    const [inputText, setInputText] = useState("");
    const [rows, setRows] = useState<LeadRow[]>([]);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseLine = (line: string) => {
        // Basic heuristics to parse unstructured text
        const parts = line.split(/\s+/);
        let date = new Date().toLocaleDateString('ru-RU');
        let phone = "";
        let nameParts = [];
        let requestParts = [];

        for (const part of parts) {
            if (part.match(/\d{2}\.\d{2}\.\d{4}/)) {
                date = part;
            } else if (part.match(/[+]?\d{10,}/)) {
                phone = part;
            } else if (part.match(/^[А-ЯЁ][а-яё]+$/)) {
                nameParts.push(part);
            } else {
                requestParts.push(part);
            }
        }

        return {
            phone,
            name: nameParts.join(" "),
            request: requestParts.join(" "),
            date
        };
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsRecognizing(true);
        try {
            const result = await Tesseract.recognize(
                file,
                'rus',
                { logger: m => console.log(m) }
            );

            const text = result.data.text;

            // Smart parsing logic for CRM screenshots
            const lines = text.split('\n');
            let foundName = "";
            let foundPhone = "";
            let foundDesc = [];

            // Regex patterns
            const phoneRegex = /(?:\+7|8|7)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/;
            const nameRegex = /([А-ЯЁ][а-яё]+[\s]+[А-ЯЁ][а-яё]+[\s]+[А-ЯЁ][а-яё]+)/;

            for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine) continue;

                // Try to find phone
                if (!foundPhone) {
                    const phoneMatch = cleanLine.match(phoneRegex);
                    if (phoneMatch) {
                        foundPhone = phoneMatch[0];
                    }
                }

                // Try to find name (priority to "Сделка по ...")
                if (!foundName) {
                    if (cleanLine.includes("Сделка по")) {
                        const nameMatch = cleanLine.replace("Сделка по", "").trim();
                        foundName = nameMatch.split(/[^\wа-яёА-ЯЁ\s]/)[0];
                    } else {
                        const nameMatch = cleanLine.match(nameRegex);
                        if (nameMatch) {
                            foundName = nameMatch[0];
                        }
                    }
                }

                // Collect useful info for description
                const keywords = ["Бюджет", "Локация", "Тип недвижимости", "Сегмент", "Срок", "Запрос"];
                if (keywords.some(k => cleanLine.toLowerCase().includes(k.toLowerCase()))) {
                    foundDesc.push(cleanLine);
                }
            }

            // Fallback description
            if (foundDesc.length === 0) {
                foundDesc = lines.filter(l => l.length > 30 && !l.includes("Сделка по") && !l.match(phoneRegex)).slice(0, 3);
            }

            // Format for input: Phone Name Description Date
            const formattedLine = `${foundPhone || "Нет_телефона"} ${foundName || "Нет_имени"} ${foundDesc.join("; ") || "Нет_описания"} ${new Date().toLocaleDateString('ru-RU')}`;

            setInputText(prev => prev + (prev ? "\n" : "") + formattedLine);
        } catch (error) {
            console.error(error);
            alert("Ошибка распознавания текста");
        } finally {
            setIsRecognizing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleGenerate = () => {
        if (!inputText.trim()) return;

        const lines = inputText.trim().split('\n');
        const newRows = lines.map((line, index) => {
            const parsed = parseLine(line);
            if (!parsed.phone && !parsed.name && !parsed.request) return null;
            return {
                id: Date.now() + index,
                ...parsed
            };
        }).filter(Boolean) as LeadRow[];

        setRows([...rows, ...newRows]);
        setInputText("");
    };

    const handleDownload = () => {
        const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
            "Телефон": r.phone,
            "ФИО": r.name,
            "Запрос": r.request,
            "Дата": r.date
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");

        const wscols = [
            { wch: 20 }, // Phone
            { wch: 30 }, // Name
            { wch: 40 }, // Request
            { wch: 15 }  // Date
        ];
        ws['!cols'] = wscols;

        XLSX.writeFile(wb, "Generated_Leads.xlsx");
    };

    const handleDelete = (id: number) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const handleClear = () => {
        if (confirm("Очистить таблицу?")) {
            setRows([]);
        }
    };

    return (
        <ProtectedLayout>
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Hammer className="w-7 h-7 text-cyan-400" />
                        Инструменты
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Генератор Excel таблиц из текста и фото
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="glass-card rounded-2xl p-5">
                            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-violet-400" />
                                Ввод данных
                            </h3>
                            <p className="text-xs text-slate-400 mb-3">
                                Вставьте текст или загрузите фото списка/таблицы.
                                Система распознает текст и добавит его в поле ввода.
                            </p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isRecognizing}
                                className="w-full mb-3 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-violet-500/50 hover:bg-white/5 transition-all text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2"
                            >
                                {isRecognizing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Распознаем...
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="w-4 h-4" />
                                        Загрузить фото
                                    </>
                                )}
                            </button>

                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
                                placeholder="Вставьте данные здесь..."
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={!inputText.trim()}
                                className="w-full mt-3 btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Добавить в таблицу
                            </button>
                        </div>
                    </div>

                    {/* Table Preview */}
                    <div className="lg:col-span-2">
                        <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                    Предпросмотр таблицы
                                </h3>
                                <div className="flex gap-2">
                                    {rows.length > 0 && (
                                        <>
                                            <button
                                                onClick={handleClear}
                                                className="px-3 py-1.5 fs-xs rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium"
                                            >
                                                Очистить
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Скачать Excel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto border border-white/10 rounded-xl bg-slate-900/50">
                                {rows.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                                        <FileSpreadsheet className="w-10 h-10 mb-3 opacity-20" />
                                        <p className="text-sm">Таблица пуста</p>
                                        <p className="text-xs opacity-50">Добавьте данные слева</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-slate-400 sticky top-0 backdrop-blur-md">
                                            <tr>
                                                <th className="p-3 font-medium">Телефон</th>
                                                <th className="p-3 font-medium">ФИО</th>
                                                <th className="p-3 font-medium">Запрос</th>
                                                <th className="p-3 font-medium">Дата</th>
                                                <th className="p-3 font-medium w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {rows.map((row) => (
                                                <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="p-3 text-slate-300 font-mono text-xs">{row.phone}</td>
                                                    <td className="p-3 text-white font-medium">{row.name}</td>
                                                    <td className="p-3 text-slate-300 text-xs md:text-sm">{row.request}</td>
                                                    <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{row.date}</td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => handleDelete(row.id)}
                                                            className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {rows.length > 0 && (
                                <div className="mt-3 text-xs text-slate-500 text-right">
                                    Всего записей: {rows.length}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
