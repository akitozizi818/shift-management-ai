"use client";
import { ReactNode } from "react";
import AppSidebar from "@/components/app-sidebar";
import AppHeader  from "@/components/app-header";
import AnimatedBackground from "@/components/animated-background";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative">
      {/* 背景はここだけに置く */}
      <AnimatedBackground />

      <div className="relative z-10 flex">
        <AppSidebar role="member" />

        <div className="flex-1">
          <AppHeader role="member" userName="山田 花子" />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
