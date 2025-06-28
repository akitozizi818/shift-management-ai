"use client";

import { useState, useEffect, useMemo } from "react";
import ShiftCalendar from "@/components/shift/shift-calendar";
import ShiftModal from "@/components/shift/shift-modal";
import ShiftTable from "@/components/shift/shift-table";

import { fetchAllArchived, fetchArchived, updateSchedule } from "@/lib/firebase/firebaseSchedule";
import { type Schedule, type memberAssignment } from "@/types/shift";
import { useAuth } from "@/app/context/AuthContext";
import { usePathname } from "next/navigation";
import ShiftCalendarAll from "@/components/shift/shift-callender-allday";

export default function FinalSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dayAssignments, setDayAssignments] = useState<Record<string, memberAssignment[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailShiftOpen, setDetailShiftOpen] = useState(false); // ✅ 追加

  const { id } = useAuth();
  const path = usePathname();

  // 年月取得（ShiftTable用）
  const month = selectedDate?.getMonth() ?? new Date().getMonth();
  const year = selectedDate?.getFullYear() ?? new Date().getFullYear();

  const sortedAssignments = useMemo(() => {
    if (!id) return dayAssignments;
    const sorted: Record<string, memberAssignment[]> = {};
    for (const [date, assignments] of Object.entries(dayAssignments)) {
      sorted[date] = [...assignments].sort((a) => (a.userId === id ? -1 : 1));
    }
    return sorted;
  }, [dayAssignments, id]);


  useEffect(() => {
    (async () => {
      const archived = await fetchAllArchived();
      setSchedules(archived);

      // 🔽 ここでまとめて日付→memberAssignments のマップを作る
      const map = Object.fromEntries(
        archived.flatMap(s =>
          Object.entries(s.shifts).map(([d, v]) => [d, v.memberAssignments])
        )
      ) as Record<string, memberAssignment[]>;

      setDayAssignments(map);
    })();
  }, []);



  // Assume the first schedule is the one to update, or adjust logic as needed

  const persist = (map: Record<string, memberAssignment[]>) => {
    if (!schedules || schedules.length === 0) return;

    const wrapped = Object.fromEntries(
      Object.entries(map).map(([d, arr]) => [d, { memberAssignments: arr }])
    );

    // Use the first schedule as the one to update, or adjust logic as needed
    const targetSchedule = schedules[0];
    const updated: Schedule = { ...targetSchedule, shifts: wrapped };
    updateSchedule(updated.scheduleId, wrapped);
    setSchedules((prev) =>
      prev.map((s) => (s.scheduleId === updated.scheduleId ? updated : s))
    );
    setDayAssignments(map);
  };
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <main className="max-w-6xl mx-auto p-6">
        {path.includes("/admin/shiftfinal") && (
          <>
            <button
              onClick={() => setDetailShiftOpen((prev) => !prev)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 mb-4 ml-6 ${detailShiftOpen ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'}`}
            >
              {detailShiftOpen ? "月間のシフト表" : "1日の詳細なシフト"}を見る
            </button>

            {detailShiftOpen ? (
              <ShiftTable
                setSelectedMonth={setSelectedMonth}   // 追加
                selectedMonth={selectedMonth}
                allAssignments={sortedAssignments} // ✅ 並び替え済みで表示
              />
            ) : (
              <ShiftCalendarAll
                schedules={schedules}
                onDateSelect={(d /* , _assignments */) => {
                  setSelectedDate(d);   // モーダル用に日付を保持
                  setModalOpen(true);   // モーダルを開く
                }}
              />
            )}
          </>
        )}
      </main>

      {selectedDate && (
        <ShiftModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={selectedDate}
          dayAssignments={sortedAssignments}
          setDayAssignments={persist}
        />
      )}
    </div>
  );
}
