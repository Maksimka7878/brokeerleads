"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { BarChart3, Users, Send, LogOut, LayoutDashboard, Sparkles, Zap, TrendingUp, FileText, BookOpen } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { name: "Дашборд", icon: LayoutDashboard, href: "/dashboard", color: "from-violet-500 to-purple-500" },
    { name: "Контакты", icon: Users, href: "/contacts", color: "from-cyan-500 to-blue-500" },
    { name: "Рассылка", icon: Send, href: "/distribution", color: "from-amber-500 to-orange-500" },
    { name: "Скрипты", icon: FileText, href: "/scripts", color: "from-emerald-500 to-teal-500" },
    { name: "Материалы", icon: BookOpen, href: "/materials", color: "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="w-72 h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl shadow-black/50">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-11 w-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-text">LeadFlow</h1>
            <p className="text-xs text-slate-400 font-medium">Sales Intelligence</p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4">
        <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-2xl"></div>

          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold shadow-lg shadow-purple-500/20 ring-2 ring-white/10">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{user?.username}</div>
              <div className="text-xs text-violet-300 capitalize truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                {user?.role}
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="relative z-10 bg-gradient-to-r from-slate-800/50 to-slate-800/30 rounded-xl p-3 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Баланс лидов</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold text-white">{user?.balance}</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 group ${isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {/* Active Background */}
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl opacity-90 shadow-lg`}></div>
                )}

                {/* Hover Glow */}
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-xl blur-xl opacity-40`}></div>
                )}

                <Icon className={`relative z-10 mr-3 h-5 w-5 transition-all duration-300 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                  }`} />
                <span className="relative z-10">{item.name}</span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-lg shadow-white/50"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Stats Mini Section */}
      <div className="px-4 pb-4">
        <div className="glass-card rounded-xl p-3 grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-lg font-bold text-white">24</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Сегодня</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <div className="text-lg font-bold text-emerald-400">+12%</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Рост</div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all duration-300 group"
        >
          <LogOut className="mr-3 h-5 w-5 group-hover:text-rose-400 transition-colors" />
          Выйти из системы
          <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 text-xs">→</span>
        </button>
      </div>
    </div>
  );
}
