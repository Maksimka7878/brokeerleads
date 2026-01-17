"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, TrendingUp, MessageCircle, Kanban, Target, Users, Zap, Calendar, Activity, Send, CheckCircle, Clock } from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [connectData, setConnectData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "kanban">("kanban");

  useEffect(() => {
    api.get("/stats").then((res) => setStats(res.data));
  }, []);

  const handleConnectTelegram = async () => {
      try {
          const res = await api.post("/telegram/connect");
          setConnectData(res.data);
      } catch (e) {
          alert("Error generating token");
      }
  };

  if (!stats) return (
    <ProtectedLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm">Загрузка данных...</p>
        </div>
      </div>
    </ProtectedLayout>
  );

  // Prepare chart data
  const funnelData = Object.entries(stats.leads_by_stage).map(([name, value], index) => ({
    name: name.length > 15 ? name.slice(0, 15) + '...' : name,
    fullName: name,
    value,
    fill: COLORS[index % COLORS.length]
  }));

  const conversionRate = stats.total_leads > 0
    ? Math.round((stats.leads_by_stage["Заключен"] || 0) / stats.total_leads * 100)
    : 0;

  return (
    <ProtectedLayout>
      <div className="space-y-6 h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {activeTab === "overview" ? (
                <>
                  <Activity className="w-7 h-7 text-violet-400" />
                  Аналитика и метрики
                </>
              ) : (
                <>
                  <Kanban className="w-7 h-7 text-violet-400" />
                  CRM Доска
                </>
              )}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === "overview"
                ? "Отслеживайте эффективность вашей воронки продаж"
                : "Управляйте лидами с помощью Drag & Drop"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex glass-card p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "kanban"
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Kanban className="w-4 h-4 mr-2" />
              Канбан
            </button>
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 mr-2" />
              Обзор
            </button>
          </div>
        </div>

        {activeTab === "kanban" ? (
          <KanbanBoard />
        ) : (
          <>
            {/* Telegram Connect Banner */}
            {!stats.telegram_connected && (
              <div className="glass-card rounded-2xl p-6 border border-cyan-500/20 relative overflow-hidden animate-slide-up">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Подключите Telegram-бота</h3>
                      <p className="text-slate-400 text-sm max-w-xl">
                        Получайте мгновенные уведомления о новых лидах и управляйте сделками прямо из мессенджера.
                      </p>
                      {connectData && (
                        <div className="mt-4 glass-card rounded-xl p-4">
                          <p className="text-sm text-slate-300 mb-3">Отправьте этот код боту:</p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <code className="bg-slate-800 px-4 py-2 rounded-lg font-mono text-cyan-400 select-all border border-cyan-500/20">
                              /start {connectData.token}
                            </code>
                            <a
                              href={`https://t.me/${connectData.bot_username}?start=${connectData.token}`}
                              target="_blank"
                              className="btn-primary text-sm flex items-center gap-2"
                            >
                              Открыть Telegram
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!connectData && (
                    <button
                      onClick={handleConnectTelegram}
                      className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                      <Zap className="w-5 h-5" />
                      Подключить
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Leads */}
              <div className="glass-card stat-card rounded-2xl p-5 group hover:border-violet-500/30 transition-all duration-300" style={{"--accent-color": "#8b5cf6"} as React.CSSProperties}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    +12%
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.total_leads}</div>
                <div className="text-sm text-slate-400">Всего лидов</div>
              </div>

              {/* Interactions */}
              <div className="glass-card stat-card rounded-2xl p-5 group hover:border-cyan-500/30 transition-all duration-300" style={{"--accent-color": "#06b6d4"} as React.CSSProperties}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.total_interactions}</div>
                <div className="text-sm text-slate-400">Взаимодействий</div>
              </div>

              {/* Balance */}
              <div className="glass-card stat-card rounded-2xl p-5 group hover:border-amber-500/30 transition-all duration-300" style={{"--accent-color": "#f59e0b"} as React.CSSProperties}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.user_balance}</div>
                <div className="text-sm text-slate-400">Баланс лидов</div>
              </div>

              {/* Conversion */}
              <div className="glass-card stat-card rounded-2xl p-5 group hover:border-emerald-500/30 transition-all duration-300" style={{"--accent-color": "#10b981"} as React.CSSProperties}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    conversionRate >= 10
                      ? "text-emerald-400 bg-emerald-500/10"
                      : "text-amber-400 bg-amber-500/10"
                  }`}>
                    {conversionRate >= 10 ? <TrendingUp className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {conversionRate >= 10 ? "Отлично" : "В работе"}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{conversionRate}%</div>
                <div className="text-sm text-slate-400">Конверсия</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funnel Chart */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Воронка продаж</h3>
                    <p className="text-sm text-slate-400 mt-1">Распределение по этапам</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20">
                    <BarChart className="w-4 h-4 text-violet-400" />
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 11}} width={100} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 600 }}
                        itemStyle={{ color: '#94a3b8' }}
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                        formatter={(value: any, _name: any, props: any) => [value, props.payload.fullName]}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transactions History */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">История транзакций</h3>
                    <p className="text-sm text-slate-400 mt-1">Последние операции</p>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Send className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {stats.recent_transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/20 group-hover:scale-105 transition-transform">
                          <ArrowUpRight className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">Отправка лидов</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-rose-400">-{tx.count}</div>
                        <div className="text-xs text-slate-500">{tx.package_type}</div>
                      </div>
                    </div>
                  ))}
                  {stats.recent_transactions.length === 0 && (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-slate-600" />
                      </div>
                      <p className="text-slate-500">Нет транзакций</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Obligations Tracker */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Трекер обязательств</h3>
                  <p className="text-sm text-slate-400 mt-1">Отслеживание целей по отправке лидов</p>
                </div>
                <button className="btn-secondary text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Настроить цели
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Daily Goal */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">Ежедневная цель</span>
                    <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full">Сегодня</span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-2xl font-bold text-white">24</span>
                    <span className="text-slate-500 text-sm pb-1">/ 50</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{width: '48%'}}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">48% выполнено</p>
                </div>

                {/* Weekly Goal */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">Недельная цель</span>
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">Эта неделя</span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-2xl font-bold text-white">168</span>
                    <span className="text-slate-500 text-sm pb-1">/ 250</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{width: '67%'}}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">67% выполнено</p>
                </div>

                {/* Monthly Goal */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">Месячная цель</span>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Январь</span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-2xl font-bold text-white">892</span>
                    <span className="text-slate-500 text-sm pb-1">/ 1000</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{width: '89%'}}></div>
                  </div>
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    89% выполнено - отличный результат!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
