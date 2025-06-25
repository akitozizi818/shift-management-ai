"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/app-sidebar";
import AppHeader from "@/components/app-header";
import AnimatedBackground from "@/components/animated-background";
import { AuthProvider, useAuth } from "../context/AuthContext";

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const { user, loading,id } = useAuth();
  const router = useRouter();

  const firstUser = id && user ? user[id] : undefined;

  // ローディング完了後、認可されていない場合はリダイレクト
  useEffect(() => {
    if (loading) return;

    const isAuthorized = firstUser && firstUser.role === "admin";
    if (!isAuthorized) {
      router.replace("/");
    }
  }, [loading, firstUser, router]);

  // ロード中 or 認可チェック中は何も表示しない（チラつき防止）
  if (loading || !firstUser || firstUser.role !== "admin") {
    return null;
  }

  // 通過したらレイアウトを表示
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10 flex">
        <AppSidebar role="admin" />
        <div className="flex-1">
          <AppHeader userName={firstUser.name} role="admin" />
          <main className="">{children}</main>
        </div>
      </div>
    </div>
  );
}

// AuthProvider で囲む
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
