"use client"
import { ReactNode } from "react"
import AppSidebar from "@/components/app-sidebar"
import AppHeader from "@/components/app-header"
import AnimatedBackground from "@/components/animated-background"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10 flex">
        <AppSidebar role="admin" />
        <div className="flex-1">
          <AppHeader userName="田中 太郎" role="admin" />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
