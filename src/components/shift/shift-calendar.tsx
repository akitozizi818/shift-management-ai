"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/app/context/AuthContext";
import type { memberAssignment, ShiftRequest } from "@/types/shift";
import { usePathname } from "next/navigation";
import { fetchMyShiftRequests } from "@/lib/firebase/firebaseSchedule";

const MDiv = dynamic(() => import("framer-motion").then((m) => m.motion.div), {
  ssr: false,
});

interface Props {
  dayAssignments?: Record<string, memberAssignment[]>;
  viewMode?: "mine" | "all";
  selectedDate: Date;
  onDateSelect: (d: Date) => void;
  onEditShift?: () => void;
}

const pad = (n: number) => n.toString().padStart(2, "0");
const ym = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function ShiftCalendar({
  dayAssignments,
  viewMode = "mine",
  selectedDate,
  onDateSelect,
  onEditShift,
}: Props) {
  const [month, setMonth] = useState(new Date());
  const [dir, setDir] = useState(0);

  const { user, id } = useAuth();
  const currentUser = user && id ? user[id] : undefined;
  const yearMonth = ym(month);
  const pathname = usePathname();

  const [requests, setRequests] = useState<ShiftRequest[]>([]);

  useEffect(() => {
    if (!currentUser || !id) return;

    if (pathname === "/member/shiftrequests") {
      fetchMyShiftRequests(id, yearMonth)
        .then(setRequests)
        .catch((err) => console.error("🔥 fetchMyShiftRequests error", err));
    } else {
      const col = collection(db, "shiftRequests");
      const q =
        currentUser.role === "admin"
          ? query(col, where("month", "==", yearMonth))
          : query(col, where("userId", "==", id), where("month", "==", yearMonth));

      const unsub = onSnapshot(q, (snap) => {
        setRequests(snap.docs.map((d) => d.data() as ShiftRequest));
      });
      return () => unsub();
    }
  }, [currentUser?.role, id, yearMonth, pathname]);

  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!dayAssignments) return;
    const need = new Set<string>();
    Object.values(dayAssignments).forEach((arr) => {
      arr.forEach((a) => need.add(a.userId));
    });

    const targets = Array.from(need).filter((uid) => !userNames[uid]);
    if (targets.length === 0) return;

    const fetch = async () => {
      const pairs: [string, string][] = await Promise.all(
        targets.map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          return [uid, snap.exists() ? (snap.data() as any).name || "匿名" : "不明"];
        })
      );
      setUserNames((prev) => {
        const next = { ...prev };
        pairs.forEach(([uid, name]) => (next[uid] = name));
        return next;
      });
    };

    fetch();
  }, [dayAssignments, userNames]);

  type Badge = {
    uid: string;
    status: "preferred" | "unavailable";
    start?: string;
    end?: string;
  };
  const dayMap: Record<string, Badge[]> = {};

  if (dayAssignments) {
    Object.entries(dayAssignments).forEach(([date, arr]) => {
      if (Array.isArray(arr)) {
        dayMap[date] = arr.map((a) => ({
          uid: a.userId,
          status: (a as any).role === "unavailable" ? "unavailable" : "preferred",
          start: a.startTime,
          end: a.endTime,
        }));
      }
    });
  } else {
    requests.forEach((r) => {
      r.preferredDates.forEach((ts) => {
        const k = ymd(new Date(ts));
        const s = r.preferredShifts?.[k];
        (dayMap[k] ||= []).push({
          uid: r.userId,
          status: "preferred",
          start: s?.startTime,
          end: s?.endTime,
        });
      });
      r.unavailableDates.forEach((ts) => {
        const k = ymd(new Date(ts));
        (dayMap[k] ||= []).push({
          uid: r.userId,
          status: "unavailable",
        });
      });
    });
  }

  const buildDays = (base: Date) => {
    const y = base.getFullYear(),
      m = base.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const cells: { d: Date; cur: boolean }[] = [];
    for (let i = 0; i < first.getDay(); i++)
      cells.push({ d: new Date(y, m, -first.getDay() + i + 1), cur: false });
    for (let i = 1; i <= last.getDate(); i++)
      cells.push({ d: new Date(y, m, i), cur: true });
    while (cells.length < 35)
      cells.push({
        d: new Date(y, m + 1, cells.length - last.getDate() + 1),
        cur: false,
      });
    return cells;
  };

  const cells = buildDays(month);
  const headline = `${month.getFullYear()} / ${month.getMonth() + 1}`;
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const slide = {
    enter: (d: number) => ({ x: d > 0 ? 320 : -320, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 320 : -320, opacity: 0 }),
  };

  return (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
      {/* header */}
      <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 py-4 px-6 flex items-center justify-between shadow-inner shadow-black/20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setDir(-1);
            setMonth((p) => {
              const n = new Date(p);
              n.setMonth(p.getMonth() - 1);
              return n;
            });
          }}
          className="p-2 rounded-full hover:bg-white/20"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </motion.button>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.h2
            key={headline}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.35,
              type: "spring",
              stiffness: 260,
              damping: 30,
            }}
            className="font-semibold text-lg text-white tracking-wide select-none"
          >
            {headline}
          </motion.h2>
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setDir(1);
            setMonth((p) => {
              const n = new Date(p);
              n.setMonth(p.getMonth() + 1);
              return n;
            });
          }}
          className="p-2 rounded-full hover:bg-white/20"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* weekday row */}
      {["日", "月", "火", "水", "木", "金", "土"].map((w, i) => (
        <div
          key={w}
          className={`inline-flex w-[calc(100%/7)] py-2 text-center uppercase text-[10px] font-semibold tracking-widest border-b border-white/10 ${
            i === 0
              ? "text-red-400"
              : i === 6
              ? "text-blue-400"
              : "text-white/50"
          }`}
        >
          {w}
        </div>
      ))}

      <AnimatePresence mode="wait" custom={dir}>
        <MDiv
          key={headline}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.35,
            type: "spring",
            stiffness: 260,
            damping: 30,
          }}
          className="grid grid-cols-7 divide-x divide-y divide-white/5"
        >
          {cells.map(({ d, cur }, idx) => {
            const sel = sameDay(d, selectedDate);
            const isToday = sameDay(d, today);
            const peopleAll = dayMap[ymd(d)] || [];
            const people = !dayAssignments
              ? peopleAll.filter((p) => p.uid === id)
              : viewMode === "all" || currentUser?.role === "admin"
              ? peopleAll
              : peopleAll.filter((p) => p.uid === id);

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (
                    currentUser?.role === "admin" ||
                    people.some((p) => p.uid === id) ||
                    people.length === 0
                  ) {
                    onDateSelect(d);
                    onEditShift?.();
                  }
                }}
                className={`relative h-28 p-1.5 cursor-pointer transition-colors ${
                  cur ? "bg-slate-900/60 hover:bg-indigo-900/40" : "bg-slate-800/40 text-white/40"
                } ${sel ? "ring-2 ring-cyan-400" : ""} ${
                  isToday ? "ring-2 ring-yellow-300" : ""
                }`}
              >
                <span
                  className={`absolute top-1 left-1 text-[10px] font-semibold ${
                    isToday
                      ? "text-yellow-300"
                      : sel
                      ? "text-cyan-300"
                      : "text-white/70"
                  }`}
                >
                  {d.getDate()}
                </span>

                <div className="mt-4 space-y-0.5 pr-1">
                  {people.slice(0, 3).map((p, i) => {
                    const label = userNames[p.uid] || "...";
                    const isMine = p.uid === id;
                    const badgeClass =
                      p.status === "unavailable"
                        ? "bg-rose-500/20 text-rose-300"
                        : isMine
                        ? "bg-cyan-400/20 text-cyan-300"
                        : "bg-green-400/20 text-green-300";

                    const formatTime = (t: string) => {
                      const [h, m] = t.split(":");
                      return `${parseInt(h)}:${m.padStart(2, "0")}`;
                    };

                    const time =
                      p.status === "unavailable" || !(p.start && p.end)
                        ? ""
                        : `${formatTime(p.start)}〜${formatTime(p.end)}`;

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded px-1.5 py-0.5 text-[11px] font-medium max-w-full ${badgeClass}`}
                      >
                        <span className="truncate">{label}</span>
                        {time && (
                          <span className="text-right ml-auto text-[10px] opacity-80">
                            {time}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {people.length > 3 && (
                    <div className="text-center text-[10px] text-white/50">
                      +{people.length - 3}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </MDiv>
      </AnimatePresence>
    </div>
  );
}
