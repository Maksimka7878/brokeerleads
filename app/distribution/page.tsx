"use client";

import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";
import { Send, CheckCircle, AlertCircle, Zap, Sparkles, Target, TrendingUp } from "lucide-react";
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

      await refreshUser();
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.detail || "Ошибка при отправке");
    }
  };

  const packageTypes = [
    { value: "Cold", label: "Холодные лиды", description: "Новые контакты без взаимодействия", color: "from-blue-500 to-cyan-500" },
    { value: "Warm", label: "Теплые лиды", description: "Проявили интерес к продукту", color: "from-amber-500 to-orange-500" },
    { value: "Premium", label: "Premium", description: "Высокий потенциал конверсии", color: "from-violet-500 to-purple-500" },
  ];

  const selectedPackage = packageTypes.find(p => p.value === packageType);

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Send className="w-7 h-7 text-amber-400" />
            Рассылка лидов
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Отправляйте лиды партнерам и отслеживайте расход баланса
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Balance Header */}
              <div className="relative p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/5 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Доступный баланс
                    </div>
                    <div className="text-4xl font-bold text-white">{user?.balance}</div>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <TrendingUp className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSend} className="p-6 space-y-6">
                {/* Status Messages */}
                {status === "success" && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-slide-up">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-medium text-emerald-400">Успешно!</div>
                      <div className="text-sm text-slate-400">{message}</div>
                    </div>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-slide-up">
                    <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <div className="font-medium text-rose-400">Ошибка</div>
                      <div className="text-sm text-slate-400">{message}</div>
                    </div>
                  </div>
                )}

                {/* Recipient */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Получатель
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="input-dark w-full"
                    placeholder="@username или Telegram ID"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Укажите username или числовой ID пользователя Telegram
                  </p>
                </div>

                {/* Package Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Тип пакета
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {packageTypes.map((pkg) => (
                      <button
                        key={pkg.value}
                        type="button"
                        onClick={() => setPackageType(pkg.value)}
                        className={`relative p-4 rounded-xl border transition-all duration-300 text-left ${
                          packageType === pkg.value
                            ? "border-violet-500/50 bg-violet-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        {packageType === pkg.value && (
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${pkg.color}`}></div>
                        )}
                        <div className={`text-sm font-semibold mb-1 ${packageType === pkg.value ? "text-white" : "text-slate-300"}`}>
                          {pkg.label}
                        </div>
                        <div className="text-xs text-slate-500">{pkg.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Количество лидов
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={user?.balance}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="input-dark w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      Максимум: {user?.balance} лидов
                    </p>
                    <div className="flex gap-2">
                      {[10, 25, 50, 100].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCount(Math.min(num, user?.balance || 0))}
                          className="px-2 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === "loading" || (user?.balance || 0) < count}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                    status === "loading" || (user?.balance || 0) < count
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "btn-primary"
                  }`}
                >
                  {status === "loading" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Отправить {count} лидов
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Selected Package Info */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${selectedPackage?.color} flex items-center justify-center shadow-lg`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">{selectedPackage?.label}</div>
                  <div className="text-xs text-slate-400">{selectedPackage?.description}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Получатель</span>
                  <span className="text-white font-medium">{recipient || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Количество</span>
                  <span className="text-white font-medium">{count} лидов</span>
                </div>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Остаток после</span>
                  <span className={`font-bold ${(user?.balance || 0) - count >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {Math.max(0, (user?.balance || 0) - count)} лидов
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-violet-400" />
                <span className="font-semibold text-white">Советы</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  Premium лиды имеют самую высокую конверсию
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  Оптимальный размер пакета — 25-50 лидов
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  Отправляйте теплые лиды для B2B продаж
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
