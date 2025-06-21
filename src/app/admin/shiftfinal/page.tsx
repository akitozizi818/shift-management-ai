"use client";

import { useState } from "react";
import ShiftCalendar from "@/components/shift/shift-calendar";
import ShiftModal from "@/components/shift/shift-modal";

import { loadShiftMap, saveShiftMap } from "../../../logic/shiftStorage";
import type { Shift, Role } from "@/types/shift";

export default function FinalSchedulePage() {
  // ★ 認証連携に差し替えてください
  const currentUser = { id: "1", role: "manager" as Role };

  // ① 公開済みシフトをロード (confirmed だけ)
  const [shiftMap, setShiftMap] = useState<Record<string, Shift[]>>(() => {
    const map = loadShiftMap();
    Object.entries(map).forEach(([k, arr]) => {
      map[k] = arr.filter((s) => s.status === "confirmed");
    });
    return map;
  });

  // ② モーダル制御
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ③ 店長保存ロジック
  const persistFinal = (m: Record<string, Shift[]>) => {
    setShiftMap(m);
    saveShiftMap(m);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ShiftCalendar
        currentUser={currentUser}
        shiftMap={shiftMap}
        selectedDate={selectedDate ?? new Date()}
        onDateSelect={(d) => setSelectedDate(d)}
        onEditShift={() => setModalOpen(true)}   // ← 店長なら編集
      />

      {/* モーダル：店長のみ開く */}
      {currentUser.role === "manager" && selectedDate && (
        <ShiftModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={selectedDate}
          currentUser={currentUser}
          shiftMap={shiftMap}
          setShiftMap={persistFinal}   // 保存で確定表を更新
        />
      )}
    </div>
  );
}
