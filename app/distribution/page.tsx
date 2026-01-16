"use client";

import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DistributionPage() {
  const { user, refreshUser } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [packageType, setPackageType] = useState("Cold");
  const [count, setCount] = useState(10);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await api.post("/distribute", {
        recipient,
        package_type: packageType,
        count: Number(count),
      });
      setStatus("success");
      setMessage(`Успешно отправлено ${count} лидов! Остаток: ${res.data.remaining_balance}`);
      
      // Refresh user balance without reload
      await refreshUser();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.detail || "Ошибка при отправке");
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Рассылка лидов</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-blue-600 text-white">
            <div className="text-sm opacity-90">Доступный баланс</div>
            <div className="text-4xl font-bold mt-1">{user?.balance}</div>
          </div>

          <form onSubmit={handleSend} className="p-8 space-y-6">
            {status === "success" && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-3" />
                {message}
              </div>
            )}
            
            {status === "error" && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-3" />
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Получатель (Telegram ID или Username)</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="@username или 123456789"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип пакета</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Cold">Холодные лиды</option>
                  <option value="Warm">Теплые лиды</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Количество</label>
                <input
                  type="number"
                  min="1"
                  max={user?.balance}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || (user?.balance || 0) < count}
              className={`w-full py-3 px-6 rounded-lg text-white font-medium flex items-center justify-center transition-all ${
                status === "loading" || (user?.balance || 0) < count
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
              }`}
            >
              {status === "loading" ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Отправить лиды
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  );
}
