// --- code trimmed for brevity ---
// Assuming ShiftCalendar and other components are already here.
// Below we inject the stylish ShiftModal component overwriting the previous one.

"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { useAuth } from "@/app/context/AuthContext";
import { saveShiftRequest } from "@/lib/saveShiftRequest";
import { fetchPublished } from "@/lib/firebase/firebaseSchedule";
import { fetchActiveUsers, UserDoc } from "@/lib/firebase/firebaseUsers";

import type { memberAssignment, Role, ShiftRequest } from "@/types/shift";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  dayAssignments: Record<string, memberAssignment[]>;
  setDayAssignments: Dispatch<SetStateAction<Record<string, memberAssignment[]>>>;
}

/* ---------- helpers ---------- */
const pad = (n: number) => n.toString().padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ym = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export default function ShiftModal({
  isOpen,
  onClose,
  selectedDate,
  dayAssignments,
  setDayAssignments,
}: Props) {
  const dKey = ymd(selectedDate);
  const monthKey = ym(selectedDate);

  const [rows, setRows] = useState<memberAssignment[]>([]);
  const [users, setUsers] = useState<Record<string, UserDoc>>({});
  const [category, setCategory] = useState<"preferred" | "unavailable">("preferred");

  const { user, id } = useAuth();
  const currentUser = user && id ? user[id] : undefined;
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchActiveUsers().then(setUsers);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isOpen) return;

    let todays = dayAssignments[dKey] ?? [];

    const load = async () => {
      if (isAdmin && todays.length === 0) {
        const pub = await fetchPublished();
        if (pub && pub.shifts[dKey]) {
          todays = pub.shifts[dKey].memberAssignments as memberAssignment[];
        }
      }

      if (isAdmin) {
        setRows(
          todays.length
            ? todays
            : [
                {
                  userId: "",
                  role: "member",
                  startTime: "09:00",
                  endTime: "17:00",
                },
              ]
        );
      } else {
        const mine = todays.find((a) => a.userId === id);
        setRows([
          mine ?? {
            userId: id!,
            startTime: "09:00",
            endTime: "17:00",
            role: "member",
          },
        ]);
      }
    };

    load();
  }, [isOpen, dKey, dayAssignments, isAdmin, id]);

  const canEdit = (r: memberAssignment) => isAdmin || r.userId === id;

  const update = (idx: number, field: keyof memberAssignment, val: string) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx] };

      if (!canEdit(row)) return prev;

      if (field === "userId") {
        const u = users[val];
        row.userId = val;
        row.role = (u?.role ?? "member") as Role;
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        row[field] = val;
      }
      next[idx] = row;
      return next;
    });
  };

  const addRow = () => {
    if (!isAdmin) return;
    setRows((p) => [
      ...p,
      { userId: "", startTime: "09:00", endTime: "17:00", role: "member" },
    ]);
  };

  const removeRow = (idx: number) =>
    setRows((p) => (p.length === 1 ? p : p.filter((_, i) => i !== idx)));

  const handleSave = async () => {
    /* ===== 1) Firestore 用ペイロード作成 ===== */
    const preferredShifts: ShiftRequest["preferredShifts"] = {};
    if (category === "preferred") {
      preferredShifts[dKey] = {
        startTime: rows[0]?.startTime ?? "09:00",
        endTime: rows[0]?.endTime ?? "17:00",
      };
    }

    const shiftRequest: ShiftRequest = {
      requestId: uuidv4(),
      userId: id || "",
      month: monthKey,
      preferredDates: category === "preferred" ? [selectedDate.getTime()] : [],
      unavailableDates: category === "unavailable" ? [selectedDate.getTime()] : [],
      preferredShifts,
      status: "pending",
      submittedAt: Date.now(),
    };

    try {
      /* ===== 2) 楽観的 UI 更新 ===== */
      setDayAssignments((prev: Record<string, memberAssignment[]>) => {
        const next: Record<string, memberAssignment[]> = { ...prev };

        if (category === "preferred") {
          interface NewRow extends memberAssignment {}
          const newRows: NewRow[] = isAdmin ? rows : rows.filter((r: memberAssignment) => r.userId === id);
          const others: memberAssignment[] = (next[dKey] ?? []).filter(
        (a: memberAssignment) => !newRows.some((n: memberAssignment) => n.userId === a.userId)
          );
          next[dKey] = [...others, ...newRows];
        } else {
          interface AbsentAssignment extends memberAssignment {}
          const absent: AbsentAssignment = {
        userId: id!,
        startTime: "00:00",
        endTime: "00:00",
        role: "unavailable",
          };
          const others: memberAssignment[] = (next[dKey] ?? []).filter((a: memberAssignment) => a.userId !== id);
          next[dKey] = [...others, absent];
        }

        return next;
      });

      /* ===== 3) Firestore へ書き込み ===== */
      await saveShiftRequest(shiftRequest);

      /* ===== 4) モーダルを閉じる ===== */
      onClose();
    } catch {
      alert("保存に失敗しました");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-full max-w-3xl bg-slate-900/80 backdrop-blur rounded-2xl border border-white/10 shadow-xl overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="bg-indigo-700/90 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {selectedDate.toLocaleDateString("ja-JP")} のシフト申請
              </h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* カテゴリ切替 */}
            <div className="px-6 pt-6 flex gap-4">
              <label className="flex items-center gap-2 text-white/80">
                <input
                  type="radio"
                  name="cat"
                  value="preferred"
                  checked={category === "preferred"}
                  onChange={() => setCategory("preferred")}
                />
                希望勤務日
              </label>
              <label className="flex items-center gap-2 text-white/80">
                <input
                  type="radio"
                  name="cat"
                  value="unavailable"
                  checked={category === "unavailable"}
                  onChange={() => setCategory("unavailable")}
                />
                勤務不可日
              </label>
            </div>

            {/* 入力欄 */}
            {category === "preferred" && (
              <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {rows.map((r, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/80">SHIFT {i + 1}</span>
                      {canEdit(r) && rows.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeRow(i)}
                          className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-300" />
                        </motion.button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-white/70">メンバー</label>
                        <select
                          disabled={!isAdmin}
                          value={r.userId}
                          onChange={(e) => update(i, "userId", e.target.value)}
                          className="w-full bg-white/10 text-white rounded px-3 py-2 focus:bg-white focus:text-black focus:outline-none"
                        >
                          {!isAdmin && <option value={id ?? ""}>{currentUser?.name}</option>}
                          {isAdmin &&
                            Object.entries(users).map(([uid, u]) => (
                              <option key={uid} value={uid}>
                                {u.name}（{u.role === "admin" ? "店長" : "スタッフ"}）
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-white/70">開始</label>
                        <input
                          type="time"
                          value={r.startTime}
                          onChange={(e) => update(i, "startTime", e.target.value)}
                          disabled={!canEdit(r)}
                          className="w-full bg-white/10 text-white rounded px-3 py-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-white/70">終了</label>
                        <input
                          type="time"
                          value={r.endTime}
                          onChange={(e) => update(i, "endTime", e.target.value)}
                          disabled={!canEdit(r)}
                          className="w-full bg-white/10 text-white rounded px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={addRow}
                    className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/70 hover:bg-white/5 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> 行を追加
                  </motion.button>
                )}
              </div>
            )}

            {/* フッター */}
            <div className="bg-slate-800/60 border-t border-white/10 px-6 py-4 flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}