"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import members from "../../../mocks/mockUsers.json";
import type { Shift, Role } from "../../types/shift";

import { loadRequestMap, saveRequestMap } from "../../../lib/shiftRequestStorage";
import { loadShiftMap, saveShiftMap } from "../../../lib/shiftStorage";

interface ShiftModalProps {
  currentUser: { id: string; role: Role };
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  shiftMap: Record<string, Shift[]>;
  setShiftMap: (m: Record<string, Shift[]>) => void;
}

export default function ShiftModal({
  isOpen,
  onClose,
  selectedDate,
  currentUser,
  shiftMap,
  setShiftMap,
}: ShiftModalProps) {
  /* ---------- helpers ---------- */
  const fmtKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dateKey = fmtKey(selectedDate);

  /* ---------- state ---------- */
  const [shifts, setShifts] = useState<Shift[]>([]);

  /* ---------- effects ---------- */
  useEffect(() => {
    if (!isOpen) return;

    const todays = shiftMap[dateKey] ?? [];

    if (currentUser.role === "staff") {
      const mine = todays.find((s) => s.memberId === currentUser.id);
      setShifts(
        mine
          ? [mine]
          : [
            {
              id: crypto.randomUUID(),
              memberId: currentUser.id,
              name: members.find((m) => m.id === currentUser.id)!.name,
              role: "staff",
              startTime: "09:00",
              endTime: "17:00",
              status: "request",
            },
          ]
      );
    } else {
      setShifts(todays);
    }
  }, [isOpen, dateKey]);

  /* ---------- permissions ---------- */
  const canEditRow = (row: Shift) => currentUser.role === "manager" || row.memberId === currentUser.id;

  /* ---------- mutators ---------- */
  const updateShift = (id: string, field: keyof Shift, value: string) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (!canEditRow(s)) return s;
        if (currentUser.role === "staff" && field === "memberId") return s;

        // 自動で name/role を追従
        if (field === "memberId") {
          const m = members.find((m) => m.id === value);
          return {
            ...s,
            memberId: value,
            name: m?.name ?? "",
            role: m?.role ?? "staff",
          } as Shift;
        }
        return { ...s, [field]: value } as Shift;
      })
    );
  };

  const addShift = () => {
    if (currentUser.role !== "manager") return;
    setShifts((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        memberId: "",
        name: "",
        role: "staff",
        startTime: "09:00",
        endTime: "17:00",
        status: "request",
      },
    ]);
  };

  const removeShift = (id: string) => {
    const target = shifts.find((s) => s.id === id);
    if (!target) return;
    if (!canEditRow(target)) return;
    // スタッフが唯一の自分行を削除するのは不可
    if (currentUser.role === "staff" && shifts.filter((s) => s.memberId === currentUser.id).length === 1) return;
    setShifts((p) => p.filter((s) => s.id !== id));
  };

  /* ---------- save ---------- */
  const handleSave = () => {
    if (currentUser.role === "manager") {
      /* 店長処理: 選択日のシフトだけ上書き */
      const newFinal = { ...shiftMap, [dateKey]: shifts };
      setShiftMap(newFinal);
      saveShiftMap(newFinal);
    } else {
      /** スタッフ処理を正しくマージ & 全日分 state へ反映 */
      const reqAll = loadRequestMap();

      // 同じ日に自分が出した行だけ置き換え、他人の行は残す
      const others = (reqAll[dateKey] ?? []).filter(
        (s) => s.memberId !== currentUser.id
      );
      reqAll[dateKey] = [...others, ...shifts];

      saveRequestMap(reqAll); // ← 全希望を保存
      setShiftMap(reqAll);    // ← 全希望を UI に反映
    }
    onClose();
  };

  /* ---------- render ---------- */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", duration: 0.5 }} className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日のシフト
              </h2>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {shifts.map((shift, idx) => {
                const editable = canEditRow(shift);
                return (
                  <motion.div key={shift.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="bg-gray-50 rounded-lg p-4 border space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">シフト {idx + 1}</h3>
                      {editable && (currentUser.role === "manager" || shifts.length > 1) && (
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeShift(shift.id)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* member */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">メンバー</label>
                        <select value={shift.memberId} disabled={currentUser.role !== "manager"} onChange={(e) => updateShift(shift.id, "memberId", e.target.value)} className="w-full px-3 py-2 border rounded-md">
                          <option value="">メンバーを選択</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role === "manager" ? "店長" : "スタッフ"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* start */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">開始</label>
                        <input type="time" value={shift.startTime} disabled={!editable} onChange={(e) => updateShift(shift.id, "startTime", e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                      </div>

                      {/* end */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">終了</label>
                        <input type="time" value={shift.endTime} disabled={!editable} onChange={(e) => updateShift(shift.id, "endTime", e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* add row – manager only */}
              {currentUser.role === "manager" && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={addShift} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 font-medium">
                  <Plus className="w-5 h-5" /> シフトを追加
                </motion.button>
              )}
            </div>

            {/* footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 border rounded-md hover:bg-gray-100">キャンセル</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
            </div>
          </motion.div>
        </motion.div>
      )}a
    </AnimatePresence>
  );
}