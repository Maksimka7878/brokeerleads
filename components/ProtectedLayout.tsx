import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Menu, Sparkles } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    console.log("ProtectedLayout: loading =", loading, "user =", user);
    if (!loading && !user) {
      console.log("ProtectedLayout: No user, redirecting to login");
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LeadFlow</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-transparent relative">
          {children}
        </main>
      </div>
    </div>
  );
}
