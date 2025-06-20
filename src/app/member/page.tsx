"use client";

import React from "react";
import Link from "next/link";
import { CalendarRange, PencilRuler} from "lucide-react";
import dynamic from "next/dynamic";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);

function MenuCard({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="group">
      <MotionDiv
        whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-6 border hover:border-blue-500"
      >
        <Icon className="w-8 h-8 text-blue-600 group-hover:text-blue-700" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{label}</span>
      </MotionDiv>
    </Link>
  );
}

export default function MemberHomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <h1 className="text-center text-3xl font-bold text-gray-900">シフト確認・希望</h1>
        <div className="grid grid-cols-2 gap-6">
          <MenuCard href="/member/shiftschedule" icon={CalendarRange} label="確定シフト" />
          <MenuCard href="/member/shiftrequests" icon={PencilRuler} label="シフト希望の提出" />
        </div>
      </MotionDiv>
    </main>
  );
}



