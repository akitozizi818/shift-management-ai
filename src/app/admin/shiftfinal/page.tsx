"use client";
import ShiftCalendar from "@/components/shift/shift-calendar";
import { loadShiftMap } from "../../../../lib/shiftStorage";
import type { Role } from "@/types/shift";

export default function FinalSchedulePage() {
    const currentUser = { id: "1", role: "manager" as Role };
    const finalMap = loadShiftMap();      // 公開シフトのみ
    // 万一混入していても黄バッジを除外
    Object.entries(finalMap).forEach(([k, arr]) => {
        finalMap[k] = arr.filter((s) => s.status === "confirmed");
    });

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold mb-4">確定シフト表</h1>

            <ShiftCalendar
                currentUser={currentUser}
                shiftMap={finalMap}
                selectedDate={new Date()}
                onDateSelect={() => { }}
                onEditShift={() => { }}
            />
        </div>
    );
}
