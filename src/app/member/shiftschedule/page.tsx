"use client";

import { useState } from "react";
import ShiftCalendar from "@/components/shift/shift-calendar";
import { loadShiftMap } from "@/logic/shiftStorage";
import type { Role } from "@/types/shift";

export default function MemberFinalPage() {
  const currentUser = { id: "2", role: "staff" as Role };
  const finalMap = loadShiftMap();

  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
      {/* ---- トグル ---- */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setViewMode("mine")}
          className={`px-4 py-1 rounded-full text-sm ${viewMode==="mine" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"}`}
        >
          自分だけ
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-1 rounded-full text-sm ${viewMode==="all" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-700"}`}
        >
          全員
        </button>
      </div>

      {/* ---- カレンダー ---- */}
      <ShiftCalendar
        currentUser={currentUser}
        shiftMap={finalMap}
        selectedDate={new Date()}
        onDateSelect={() => {}}
        onEditShift={() => {}}
        viewMode={viewMode}              
      />
    </div>
  );
}
