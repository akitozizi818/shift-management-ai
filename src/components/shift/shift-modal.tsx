// --- code trimmed for brevity ---
// Assuming ShiftCalendar and other components are already here.
// Below we inject the stylish ShiftModal component overwriting the previous one.

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import members from "../../mocks/mockUsers.json";
import type { Shift, Role } from "../../types/shift";
import { loadRequestMap, saveRequestMap } from "../../logic/shiftRequestStorage";
import { saveShiftMap } from "../../logic/shiftStorage";

interface ShiftModalProps {
  currentUser: { id: string; role: Role };
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  shiftMap: Record<string, Shift[]>;
  setShiftMap: (m: Record<string, Shift[]>) => void;
}

export default function ShiftModal({ isOpen, onClose, selectedDate, currentUser, shiftMap, setShiftMap }: ShiftModalProps) {
  /* utilities */
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dateKey = key(selectedDate);

  /* state */
  const [rows, setRows] = useState<Shift[]>([]);

  /* load */
  useEffect(() => {
    if (!isOpen) return;
    const todays = shiftMap[dateKey] ?? [];
    if (currentUser.role === "staff") {
      const mine = todays.find(s => s.memberId === currentUser.id);
      setRows(mine ? [mine] : [{ id: crypto.randomUUID(), memberId: currentUser.id, name: members.find(m => m.id === currentUser.id)!.name, role: "staff" as Role, startTime: "09:00", endTime: "17:00", status: "request" }]);
    } else {
      setRows(todays);
    }
  }, [isOpen, dateKey]);

  /* perms */
  const canEdit = (r: Shift) => currentUser.role === "manager" || r.memberId === currentUser.id;

  /* mutate */
  const update = (id: string, k: keyof Shift, v: string) => setRows(p => p.map(r => {
    if (r.id !== id || !canEdit(r)) return r;
    if (currentUser.role === "staff" && k === "memberId") return r;
    if (k === "memberId") {
      const m = members.find(m => m.id === v);
      return { ...r, memberId: v, name: m?.name ?? "", role: (m?.role ?? "staff") as Role };
    }
    if (k === "role") {
      return { ...r, role: v as Role };
    }
    // For other keys (like startTime, endTime, status), update generically
    return { ...r, [k]: v };
  }));

  const add = () => currentUser.role === "manager" && setRows(p => [...p, { id: crypto.randomUUID(), memberId: "", name: "", role: "staff", startTime: "09:00", endTime: "17:00", status: "request" }]);

  const remove = (id: string) => setRows(p => p.filter(r => r.id !== id || !(canEdit(p.find(x => x.id === id)!) && (currentUser.role === "manager" || p.filter(x => x.memberId === currentUser.id).length > 1))));

  /* save */
  const save = () => {
    if (currentUser.role === "manager") {
      const newFinal = { ...shiftMap, [dateKey]: rows };
      setShiftMap(newFinal);
      saveShiftMap(newFinal);
    } else {
      const all = loadRequestMap();
      const others = (all[dateKey] ?? []).filter(s => s.memberId !== currentUser.id);
      all[dateKey] = [...others, ...rows];
      saveRequestMap(all);
      setShiftMap(all);
    }
    onClose();
  };

  /* -------------------------------- render -------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} onClick={e => e.stopPropagation()} className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
            {/* header */}
            <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 py-4 px-6 flex items-center justify-between shadow-inner shadow-black/20">
              <h2 className="text-white font-semibold text-lg">{selectedDate.getFullYear()} / {selectedDate.getMonth()+1}/{selectedDate.getDate()} のシフト</h2>
              <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* body */}
            <div className="px-6 py-6 overflow-y-auto max-h-[60vh] space-y-6">
              {rows.map((r,i)=>(
                <motion.div key={r.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ delay: i*0.05 }} className="border border-white/10 bg-slate-900/60 backdrop-blur rounded-xl p-4 shadow-inner shadow-black/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm tracking-wider text-white/80">SHIFT {i+1}</span>
                    {canEdit(r) && (currentUser.role === "manager" || rows.length>1) && (
                      <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={()=>remove(r.id)} className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20">
                        <Trash2 className="w-4 h-4 text-red-300" />
                      </motion.button>) }
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* member */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/70">メンバー</label>
                      <select value={r.memberId} disabled={currentUser.role!=="manager"} onChange={e=>update(r.id,"memberId",e.target.value)} className="w-full bg-white/10 text-white/90 rounded px-3 py-2 backdrop-blur border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400">
                        <option value="">選択してください</option>
                        {members.map(m=>(<option key={m.id} value={m.id}>{m.name} ({m.role==="manager"?"店長":"スタッフ"})</option>))}
                      </select>
                    </div>
                    {/* start */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/70">開始</label>
                      <input type="time" value={r.startTime} disabled={!canEdit(r)} onChange={e=>update(r.id,"startTime",e.target.value)} className="w-full bg-white/10 text-white rounded px-3 py-2 backdrop-blur border border-white/10 focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    {/* end */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/70">終了</label>
                      <input type="time" value={r.endTime} disabled={!canEdit(r)} onChange={e=>update(r.id,"endTime",e.target.value)} className="w-full bg-white/10 text-white rounded px-3 py-2 backdrop-blur border border-white/10 focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                </motion.div>))}

              {currentUser.role === "manager" && (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={add} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/70 hover:bg-white/5 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4"/> シフトを追加
                </motion.button>) }
            </div>

            {/* footer */}
            <div className="bg-slate-800/60 border-t border-white/10 px-6 py-4 flex gap-4 backdrop-blur">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80">キャンセル</button>
              <button onClick={save} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">保存</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
