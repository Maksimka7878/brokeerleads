"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, MessageCircle } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [connectData, setConnectData] = useState<any>(null);

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

  if (!stats) return <ProtectedLayout>Loading...</ProtectedLayout>;

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Обзор эффективности</h2>
        
        {!stats.telegram_connected && (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Подключите Telegram-бота</h3>
                    <p className="text-blue-700 max-w-2xl">
                        Получайте уведомления о новых лидах, проверяйте баланс и управляйте сделками прямо из мессенджера.
                        {!connectData && " Нажмите кнопку, чтобы получить код подключения."}
                    </p>
                    {connectData && (
                        <div className="mt-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                            <p className="text-sm text-gray-600 mb-2">1. Откройте бота. 2. Нажмите Start или отправьте код:</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <code className="bg-gray-100 px-3 py-2 rounded font-mono text-lg font-bold select-all border border-gray-200">
                                    /start {connectData.token}
                                </code>
                                <a 
                                    href={`https://t.me/${connectData.bot_username}?start=${connectData.token}`} 
                                    target="_blank" 
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Открыть Telegram
                                </a>
                            </div>
                        </div>
                    )}
                </div>
                {!connectData && (
                    <button 
                        onClick={handleConnectTelegram}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center shrink-0 shadow-sm"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Подключить
                    </button>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 mb-2 text-sm font-medium">Всего лидов</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total_leads}</div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% за неделю
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 mb-2 text-sm font-medium">Взаимодействий</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total_interactions}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 mb-2 text-sm font-medium">Ваш баланс</div>
            <div className="text-3xl font-bold text-blue-600">{stats.user_balance}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 mb-2 text-sm font-medium">Конверсия</div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total_leads > 0 ? Math.round((stats.leads_by_stage["Заключение сделки"] || 0) / stats.total_leads * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">Воронка продаж</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(stats.leads_by_stage).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">История транзакций</h3>
            <div className="space-y-4">
              {stats.recent_transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="bg-red-50 p-2 rounded-full mr-4">
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Отправка лидов</div>
                      <div className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">-{tx.count}</div>
                    <div className="text-xs text-gray-500">{tx.package_type}</div>
                  </div>
                </div>
              ))}
              {stats.recent_transactions.length === 0 && (
                <div className="text-center text-gray-500 py-8">Нет транзакций</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
