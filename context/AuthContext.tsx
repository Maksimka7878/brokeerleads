"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

interface User {
  id: number;
  username: string;
  role: string;
  balance: number;
  leadsCount?: number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { },
  logout: () => { },
  loading: true,
  refreshUser: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const [userRes, leadsRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/leads/count")
      ]);
      setUser({
        ...userRes.data,
        leadsCount: leadsRes.data.count
      });
      return true;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      localStorage.removeItem("token");
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    console.log("Login: saving token");
    localStorage.setItem("token", token);
    setLoading(true);
    console.log("Login: fetching user data");
    const success = await fetchUser();
    console.log("Login: fetchUser result:", success);
    if (success) {
      console.log("Login: redirecting to dashboard");
      router.push("/dashboard");
    } else {
      console.error("Login: failed to fetch user data");
      throw new Error("Failed to fetch user data");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
