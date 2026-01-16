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
    { name: "Контакты", icon: Users, href: "/contacts" }, // Need to move contacts page
    { name: "Рассылка", icon: Send, href: "/distribution" },
  ];

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">SalesTracker</h1>
        <p className="text-xs text-gray-500 mt-1">B2B CRM System</p>
      </div>

      <div className="px-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-900">{user?.username}</div>
          <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
          <div className="mt-2 text-sm font-bold text-blue-700">
            Баланс: {user?.balance} ⚡
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Выйти
        </button>
      </div>
    </div>
  );
}
