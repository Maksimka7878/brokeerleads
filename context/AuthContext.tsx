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
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { },
  logout: () => { },
  loading: true,
  refreshUser: async () => null,
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

  const fetchUser = async (): Promise<User | null> => {
    try {
      const [userRes, leadsRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/leads/count")
      ]);
      const userData = {
        ...userRes.data,
        leadsCount: leadsRes.data.count
      };
      setUser(userData);
      return userData;
    } catch (err) {
      console.error("fetchUser error:", err);
      localStorage.removeItem("token");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string): Promise<void> => {
    console.log("AuthContext login called with token");
    localStorage.setItem("token", token);
    setLoading(true);
    const userData = await fetchUser();
    console.log("User data after fetchUser:", userData);
    if (userData) {
      console.log("Redirecting to dashboard...");
      router.push("/dashboard");
    } else {
      console.error("Login failed - no user data returned");
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

