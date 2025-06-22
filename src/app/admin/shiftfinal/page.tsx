"use client";

import { useState, useEffect } from "react";
import ShiftCalendar from "@/components/shift/shift-calendar";
import ShiftModal from "@/components/shift/shift-modal";

import { fetchPublished, updateSchedule } from "@/logic/firebaseSchedule";
import { type Schedule, type memberAssignment } from "@/types/shift";

export default function FinalSchedulePage() {
  /* ---------- Firestore から published 取得 ---------- */
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [dayAssignments, setDayAssignments] = useState<Record<string, memberAssignment[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    (async () => {
      const pub = await fetchPublished(); // status === "published" のスケジュールを1件取得
      if (!pub) return;
      setSchedule(pub);
      const map = Object.fromEntries(
        Object.entries(pub.shifts).map(([d, v]) => [d, v.memberAssignments])
      ) as Record<string, memberAssignment[]>;
      setDayAssignments(map);
    })();
  }, []);

  // ❷ 保存（再ラップしてから Firestore 更新）
  const persist = (map: Record<string, memberAssignment[]>) => {
    if (!schedule) return;

    const wrapped = Object.fromEntries(
      Object.entries(map).map(([d, arr]) => [d, { memberAssignments: arr }])
    );

    const updated: Schedule = { ...schedule, shifts: wrapped };
    updateSchedule(updated.scheduleId, wrapped); // Firestore に保存
    setSchedule(updated);
    setDayAssignments(map); // state はラップ無し
  };



  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ShiftCalendar
        dayAssignments={dayAssignments}                  // 確定スケジュールを渡す
        selectedDate={selectedDate ?? new Date()}
        onDateSelect={d => setSelectedDate(d)}
        onEditShift={() => setModalOpen(true)}          // 店長のみ表示の前提
      />

      {/* 編集モーダル（店長のみ） */}
      {selectedDate && (
        <ShiftModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={selectedDate}
          dayAssignments={dayAssignments}
          setDayAssignments={persist}
        />
      )}
    </div>
  );
}
