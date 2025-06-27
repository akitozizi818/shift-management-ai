"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/app-sidebar";
import AppHeader from "@/components/app-header";
import AnimatedBackground from "@/components/animated-background";
import { AuthProvider, useAuth } from "../context/AuthContext";

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const { user, loading, id } = useAuth();
  const router = useRouter();
  const role = id && user?.[id]?.role ? user[id].role : "member"; // ユーザーのロールを取得
  const currentUser = id ? user?.[id] : undefined;

  // 🔁 権限チェック（ログイン後）
  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.replace("/"); // ログインしていない、または権限がない
    }
  }, [loading, currentUser, router]);

  if (loading || !currentUser) return null;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10 flex">
        <AppSidebar role={role} />
        <div className="flex-1">
          <AppHeader userName={currentUser.name} role={role} />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
