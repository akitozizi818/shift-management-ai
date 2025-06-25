"use client";

/* =====================================================
 * MemberFinalPage – スタッフ用 “確定シフト” 閲覧
 *   • Firestore に status === "published" のスケジュールが 1 件だけ
 *   • 自分だけ / 全員 切替トグル
 * ====================================================*/

import { useEffect, useState } from "react";
import ShiftCalendar from "@/components/shift/shift-calendar";
import { fetchPublished } from "@/lib/firebase/firebaseSchedule";
import type { memberAssignment } from "@/types/shift";

export default function MemberFinalPage() {
  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [assignments, setAssignments] = useState<Record<string, memberAssignment[]>>({});

  /* -------- 公開中スケジュールを 1 件取得 -------- */
  useEffect(() => {
    const load = async () => {
      const pub = await fetchPublished();          // ← Schedule | null
      console.log("Published Schedule:", pub);
      if (!pub) return;
      const map: Record<string, memberAssignment[]> = {};
      Object.entries(pub.shifts).forEach(([date, val]) => {
        map[date] = val.memberAssignments || [];
      });
      setAssignments(map);
    };
    load();
  }, []);

console.log("Assignments:", assignments);
  /* -------- UI -------- */
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      {/* トグル */}
      <div className="flex justify-end gap-3">
        {["mine", "all"].map(v => (
          <button
            key={v}
            onClick={() => setViewMode(v as any)}
            className={`px-4 py-1 rounded-full text-sm transition ${
              viewMode === v ? "bg-blue-600 text-white shadow" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            {v === "mine" ? "自分だけ" : "全員"}
          </button>
        ))}
      </div>

      {/* カレンダー */}
      <ShiftCalendar
        dayAssignments={assignments}
        viewMode={viewMode}
        selectedDate={new Date()}
        onDateSelect={() => {}}
      />
    </div>
  );
}
