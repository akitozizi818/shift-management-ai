"use client";
import ShiftCalendar from "../../../components/shift/shift-calendar";
import { loadShiftMap } from "../../../../lib/shiftStorage";
import type { Role } from "../../../types/shift";

export default function SchedulePage() {
  const currentUser = { id: "2", role: "staff" as Role };

  const shiftMap = loadShiftMap();      
  const today    = new Date();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">確定シフト表</h1>
      <ShiftCalendar
        currentUser={currentUser}
        shiftMap={shiftMap}
        selectedDate={today}
        onDateSelect={() => {}}   
        onEditShift={() => {}}    
      />
    </div>
  );
}
