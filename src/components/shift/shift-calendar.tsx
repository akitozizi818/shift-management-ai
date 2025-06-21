"use client";

/* =====================================================
 * ShiftCalendar – glassy dark‑mode calendar card ✨
 * --------------------------------------------------
 * ▸ 全体 : ガラス風パネル (white/5 + backdrop-blur-xl)
 * ▸ Header: ニューモーフィック gradient & subtle shadow
 * ▸ Week  : サイバーグリッド (border-white/5)
 * ▸ Cell  : ホバー・セレクト時にグロー + 浮き上がり
 * =====================================================*/

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Shift, Role } from "../../types/shift";
import dynamic from "next/dynamic";

const MDiv = dynamic(() => import("framer-motion").then(m => m.motion.div), { ssr: false });
type ViewMode = "mine" | "all";
interface ShiftCalendarProps {
  currentUser: { id: string; role: Role };
  shiftMap: Record<string, Shift[]>;
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
  onEditShift: () => void;
  viewMode?: ViewMode; // オプションで表示モードを指定
}

export default function ShiftCalendar({ viewMode = "mine", currentUser, shiftMap, selectedDate, onDateSelect, onEditShift }: ShiftCalendarProps) {
  /* ---------- state ---------- */
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dir, setDir] = useState(0);

  /* ---------- helpers ---------- */
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const shiftsOf = (d: Date) => shiftMap[fmt(d)] ?? [];
  const filter = (all: Shift[]): Shift[] => {
    if (currentUser.role === "manager") return all;        // 店長は常に全員

    if (viewMode === "all") {
      // スタッフが「全員」を選んだら確定行だけ
      return all.filter(s => s.status === "confirmed");
    }

    // mine モード: 自分の確定行だけ
    return all.filter(s => s.memberId === currentUser.id);
  };

  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const today = new Date();

  /* build calendar grid (always 35 cells) */
  const build = (base: Date) => {
    const y = base.getFullYear(), m = base.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const days: any[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push({ d: new Date(y, m, -first.getDay() + i + 1), cur: false });
    for (let i = 1; i <= last.getDate(); i++) days.push({ d: new Date(y, m, i), cur: true });
    for (let i = 1; days.length < 35; i++) days.push({ d: new Date(y, m + 1, i), cur: false });
    return days;
  };
  const days = build(currentMonth);

  /* slide animation variants */
  const slide = {
    enter: (d: number) => ({ x: d > 0 ? 320 : -320, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 320 : -320, opacity: 0 })
  };

  /* ---------- UI ---------- */
  const headline = `${currentMonth.getFullYear()} / ${currentMonth.getMonth() + 1}`;

  return (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
      {/* ===== header ===== */}
      <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 py-4 px-6 flex items-center justify-between shadow-inner shadow-black/20">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setDir(-1); setCurrentMonth(p => { const n = new Date(p); n.setMonth(p.getMonth() - 1); return n; }); }} className="p-2 rounded-full hover:bg-white/20">
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.h2 key={headline} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, type: "spring", stiffness: 260, damping: 30 }} className="font-semibold text-lg text-white tracking-wide select-none">
            {headline}
          </motion.h2>
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setDir(1); setCurrentMonth(p => { const n = new Date(p); n.setMonth(p.getMonth() + 1); return n; }); }} className="p-2 rounded-full hover:bg-white/20">
          <ChevronRight className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* ===== weekday row ===== */}
      {['日', '月', '火', '水', '木', '金', '土'].map((w, i) => (
        <div key={w} className={`inline-flex w-[calc(100%/7)] py-2 text-center uppercase text-[10px] font-semibold tracking-widest border-b border-white/10 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-white/50"}`}>{w}</div>
      ))}

      {/* ===== calendar grid ===== */}
      <AnimatePresence mode="wait" custom={dir}>
        <MDiv key={headline} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, type: "spring", stiffness: 260, damping: 30 }} className="grid grid-cols-7 divide-x divide-y divide-white/5">
          {days.map(({ d, cur }, idx) => {
            const vis = filter(shiftsOf(d));
            const sel = same(d, selectedDate);
            const isToday = same(d, today);
            return (
              <motion.div key={idx} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { onDateSelect(d); onEditShift(); }} className={`relative h-28 p-1.5 cursor-pointer transition-colors ${cur ? "bg-slate-900/60 hover:bg-indigo-900/40" : "bg-slate-800/40 text-white/40"} ${sel ? "ring-2 ring-cyan-400" : ""} ${isToday ? "ring-2 ring-yellow-300" : ""}`}>
                {/* date label */}
                <span className={`absolute top-1 left-1 text-[10px] font-semibold ${isToday ? "text-yellow-300" : sel ? "text-cyan-300" : "text-white/70"}`}>{d.getDate()}</span>

                {/* shift badges */}
                <div className="mt-4 space-y-0.5 pr-1">
                  {vis.slice(0, 3).map((s, i) => {
                    const base = "rounded px-1.5 py-0.5 text-[10px] flex justify-between items-center gap-1 shadow";
                    const theme = s.memberId === currentUser.id
                      ? "bg-green-400/20 text-green-300 shadow-green-500/20"
                      : s.status === "request"
                        ? "bg-amber-400/20 text-amber-300 shadow-amber-500/20"
                        : s.role === "manager"
                          ? "bg-rose-400/20 text-rose-300 shadow-rose-500/20"
                          : "bg-blue-400/20 text-blue-300 shadow-blue-500/20";
                    return (
                      <motion.div key={s.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`${base} ${theme}`}>
                        <span className="truncate max-w-[55px]">{s.name}</span>
                        <span className="opacity-60">{s.startTime}</span>
                      </motion.div>
                    );
                  })}
                  {vis.length > 3 && <div className="text-center text-[10px] text-white/50">+{vis.length - 3}</div>}
                </div>
              </motion.div>
            );
          })}
        </MDiv>
      </AnimatePresence>
    </div>
  );
}
