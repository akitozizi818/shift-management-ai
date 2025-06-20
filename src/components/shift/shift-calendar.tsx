"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Shift, Role } from "../../types/shift";
import dynamic from "next/dynamic";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false, loading: () => <div>Loading...</div> }
);
/** --------------------------------------------------
 * ShiftCalendar – スタッフは自分の確定分＋自分の希望のみ表示
 *                 店長は全メンバー表示
 * 自分の行は緑バッジでハイライト
 * --------------------------------------------------*/

interface ShiftCalendarProps {
  currentUser: { id: string; role: Role };
  shiftMap: Record<string, Shift[]>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEditShift: () => void;
}

export default function ShiftCalendar({
  currentUser,
  shiftMap,
  selectedDate,
  onDateSelect,
  onEditShift,
}: ShiftCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const isClient = typeof window !== 'undefined';
  const currentDate = isClient ? new Date() : null;

  /* ---------- utils ---------- */
  const fmtKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const getShifts = (d: Date) => shiftMap[fmtKey(d)] ?? [];

  /**
   * スタッフ → 自分の行 (memberId) と確定済み行(status === "confirmed") のみ可視
   * 店長   → 全員可視
   */
  const filterVisible = (all: Shift[]): Shift[] =>
    currentUser.role === "manager" ? all : all.filter((s) => s.memberId === currentUser.id || s.status === "confirmed");

  const buildDays = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);

    const days: { date: Date; current: boolean }[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push({ date: new Date(y, m, -first.getDay() + i + 1), current: false });
    for (let i = 1; i <= last.getDate(); i++) days.push({ date: new Date(y, m, i), current: true });
    for (let i = 1; days.length < 35; i++) days.push({ date: new Date(y, m + 1, i), current: false });
    return days;
  };

  /* ---------- handlers ---------- */
  const jump = (dir: "prev" | "next") => {
    setDirection(dir === "next" ? 1 : -1);
    setCurrentMonth((p) => {
      const n = new Date(p);
      n.setMonth(n.getMonth() + (dir === "next" ? 1 : -1));
      return n;
    });
  };

  /* ---------- helpers ---------- */
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

  const days = buildDays(currentMonth);
  const week = ["日", "月", "火", "水", "木", "金", "土"];

  const slide = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 300 : -300, opacity: 0 }),
  };

  /* ---------- render ---------- */
  return (
    <div>
      <MotionDiv initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
        {/* header */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => jump("prev")} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.h2 key={currentMonth.getMonth()} custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="text-2xl font-bold text-white">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </motion.h2>
            </AnimatePresence>

            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => jump("next")} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* week header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {week.map((w, i) => (
            <div key={w} className={`p-3 text-center font-medium text-sm ${i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : "text-gray-700"}`}>{w}</div>
          ))}
        </div>

        {/* grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <MotionDiv key={currentMonth.getMonth()} custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="grid grid-cols-7">
            {days.map(({ date, current }, idx) => {
              const visible = filterVisible(getShifts(date));
              const today = isToday(date);
              const sel = isSelected(date);

              return (
                <MotionDiv key={`${date.getTime()}-${idx}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: idx * 0.01 }} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => { onDateSelect(date); onEditShift(); }} className={`min-h-[100px] p-2 cursor-pointer border-r border-b border-gray-100 transition-colors ${current ? "bg-white hover:bg-blue-50" : "bg-gray-50 text-gray-400"} ${today ? "bg-yellow-50 border-yellow-200" : ""} ${sel ? "bg-blue-50 border-blue-200" : ""}`}>
                  <div className={`text-sm font-medium mb-1 ${today ? "text-yellow-800 font-bold" : sel ? "text-blue-800 font-bold" : current ? "text-gray-900" : "text-gray-400"}`}>{date.getDate()}</div>

                  {/* shifts */}
                  <div className="space-y-1">
                    {visible.slice(0, 3).map((s, sIdx) => {
                      const badge = s.memberId === currentUser.id
                        ? "bg-green-200 text-green-900 border border-green-400"
                        : s.status === "request"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          : s.role === "manager"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200";

                      return (
                        <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2, delay: sIdx * 0.05 }} whileHover={{ scale: 1.05 }} className={`flex items-center justify-between px-2 py-1 rounded text-xs font-medium ${badge}`}>
                          <span className="truncate">{s.name}</span>
                          <span className="text-xs opacity-75">{s.startTime}</span>
                        </motion.div>
                      );
                    })}
                    {visible.length > 3 && <div className="text-center text-xs text-gray-500 bg-gray-100 rounded py-1">+{visible.length - 3} 名</div>}
                  </div>
                </MotionDiv>
              );
            })}
          </MotionDiv>
        </AnimatePresence>
      </MotionDiv>
    </div>
  );
}
