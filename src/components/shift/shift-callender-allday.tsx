"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Schedule, memberAssignment } from "@/types/shift";
import { getFirestore, doc, getDoc } from "firebase/firestore";

/* --------------------------------------------------------------------------
 * Props
 * ----------------------------------------------------------------------- */
interface Props {
  /**  アーカイブ済みスケジュール (月ごとに 1 件) */
  schedules: Schedule[];
  /**  最初に表示する月 ("YYYY-MM") */
  initialMonth?: string;
  /**  日付クリックコールバック (任意) */
  onDateSelect?: (d: Date, assignments: memberAssignment[]) => void;
}

/* --------------------------------------------------------------------------
 * ヘルパー
 * ----------------------------------------------------------------------- */
const ymd = (d: Date) => format(d, "yyyy-MM-dd");

/* --------------------------------------------------------------------------
 * コンポーネント本体
 * ----------------------------------------------------------------------- */
export default function ShiftCalendar({
  schedules,
  initialMonth,
  onDateSelect,
}: Props) {
  /* ---------------------------------------------------------------------- */
  /* state                                                                  */
  /* ---------------------------------------------------------------------- */
  const [currentMonth, setCurrentMonth] = useState<Date>(
    initialMonth ? parseISO(`${initialMonth}-01`) : new Date()
  );
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  /* ---------------------------------------------------------------------- */
  /* ユーザー名の取得                                                         */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const fetchNames = async () => {
      const ids = new Set<string>();
      schedules.forEach((s) => {
        Object.values(s.shifts).forEach(({ memberAssignments }) => {
          memberAssignments.forEach((a) => ids.add(a.userId));
        });
      });
      if (ids.size === 0) return;

      const db = getFirestore();
      const map: Record<string, string> = {};
      await Promise.all(
        [...ids].map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              map[uid] = (snap.data() as any).name ?? uid;
            }
          } catch {
            /* ignore */
          }
        })
      );
      setUserNames(map);
    };
    fetchNames();
  }, [schedules]);

  /* ---------------------------------------------------------------------- */
  /* 現在月に対応するスケジュール                                           */
  /* ---------------------------------------------------------------------- */
  const currentSchedule = useMemo(
    () =>
      schedules.find(
        (s) =>
          format(parseISO(`${s.month}-01`), "yyyy-MM") ===
          format(currentMonth, "yyyy-MM")
      ),
    [schedules, currentMonth]
  );

  /* ---------------------------------------------------------------------- */
  /* 月ナビゲーション                                                        */
  /* ---------------------------------------------------------------------- */
  const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));

  /* ---------------------------------------------------------------------- */
  /* カレンダーセル生成                                                      */
  /* ---------------------------------------------------------------------- */
  const cells = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 日曜開始

    const rows: JSX.Element[] = [];
    let day = weekStart;

    while (day <= monthEnd || rows.length < 6) {
      const days: JSX.Element[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = ymd(day);
        const assignments =
          currentSchedule?.shifts[dateStr]?.memberAssignments ?? [];

        days.push(
          <div
            key={dateStr}
            className={
              `border border-slate-700 p-1 h-24 relative cursor-pointer transition-all hover:bg-slate-700/30 ` +
              `${!isSameMonth(day, monthStart) ? "bg-slate-800/40" : ""}`
            }
            onClick={() =>
              onDateSelect && onDateSelect(new Date(day), assignments)
            }
          >
            {/* 日付数字 */}
            <span
              className={`absolute top-1 right-1 text-xs font-semibold ${
                isSameDay(day, new Date()) ? "text-emerald-300" : "text-slate-400"
              }`}
            >
              {format(day, "d")}
            </span>

            {/* 担当者タグ (最大 3 件) */}
            <div className="mt-5 space-y-0.5 overflow-hidden">
              {assignments.slice(0, 3).map((a) => (
                <p
                  key={a.userId + a.startTime}
                  className="truncate rounded bg-gradient-to-r from-emerald-700 to-emerald-600 text-[10px] px-1 shadow-sm"
                  title={`${userNames[a.userId] ?? a.userId} (${a.startTime}~${a.endTime})`}
                >
                  {(userNames[a.userId] ?? a.userId).slice(0, 4)} {a.startTime}
                </p>
              ))}
              {assignments.length > 3 && (
                <p className="text-[10px] text-emerald-200">+{assignments.length - 3}</p>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
    }
    return rows;
  }, [currentMonth, currentSchedule, onDateSelect, userNames]);

  /* ---------------------------------------------------------------------- */
  /* UI                                                                     */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="w-full rounded-2xl shadow-xl bg-slate-800/80 ring-1 ring-slate-700/50 text-white overflow-hidden backdrop-blur-md">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-inner">
        <button onClick={prevMonth} className="p-1 hover:scale-110 transition-transform">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold tracking-wide text-lg drop-shadow-sm">
          {format(currentMonth, "yyyy / M")}
        </h2>
        <button onClick={nextMonth} className="p-1 hover:scale-110 transition-transform">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 text-center text-[11px] uppercase bg-slate-700/60 backdrop-blur">
        {"sun,mon,tue,wed,thu,fri,sat".split(",").map((d) => (
          <div key={d} className="py-1 tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="divide-y divide-slate-700/60">
        {cells}
      </div>
    </div>
  );
}
