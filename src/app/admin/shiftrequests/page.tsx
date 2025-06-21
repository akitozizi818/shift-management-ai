"use client";
import ShiftCalendar from "@/components/shift/shift-calendar";
import { loadRequestMap } from "../../../logic/shiftRequestStorage";
import type { Role } from "@/types/shift";

export default function RequestAdminPage() {
  const currentUser = { id: "1", role: "manager" as Role }; 
  const requestMap  = loadRequestMap();                     
  
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      <ShiftCalendar
        currentUser={currentUser}
        shiftMap={requestMap}
        selectedDate={new Date()}
        onDateSelect={() => {}}
        onEditShift={() => {}}
      />
    </div>
  );
}
