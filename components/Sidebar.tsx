"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { BarChart3, Users, Send, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { name: "Дашборд", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Контакты", icon: Users, href: "/contacts" },
    { name: "Рассылка", icon: Send, href: "/distribution" },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SalesTracker</h1>
            <p className="text-xs text-slate-400">B2B CRM System</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">{user?.username}</div>
              <div className="text-xs text-slate-400 capitalize truncate">{user?.role}</div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-800">
            <span className="text-xs text-slate-400">Баланс</span>
            <span className="text-sm font-bold text-blue-400">{user?.balance} ⚡</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 transition-colors ${
                isActive ? "text-white" : "text-slate-500 group-hover:text-white"
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors group"
        >
          <LogOut className="mr-3 h-5 w-5 group-hover:text-red-400 transition-colors" />
          Выйти
        </button>
      </div>
    </div>
  );
}
