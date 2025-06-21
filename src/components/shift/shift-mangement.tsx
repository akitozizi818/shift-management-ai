"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ShiftCalendar from "@/components/shift/shift-calendar";
import ShiftModal from "@/components/shift/shift-modal";
import { generateSchedule, type RuleName } from "../../logic/scheduleGenerator";
import { loadShiftMap, saveShiftMap } from "../../logic/shiftStorage";
import { loadDrafts, saveDrafts } from "../../logic/shiftDraftStorage";
import type { Shift, Role } from "@/types/shift";
import { loadRequestMap } from "../../logic/shiftRequestStorage";

export type User = { id: string; role: Role };
interface Props {
  currentUser: User;
  pageTitle?: string;
  initialShiftMap?: Record<string, Shift[]>;
}

export default function ShiftManagementPage({ currentUser, initialShiftMap }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [shiftMap, setShiftMap] = useState<Record<string, Shift[]>>(initialShiftMap ?? {});
  const [draftMap, setDraftMap] = useState<Record<string, Record<string, Shift[]>[]>>({});
  const [draftIdx, setDraftIdx] = useState<{ ym: string, idx: number } | null>(null);
  const [editingDraft, setEditingDraft] = useState<Record<string, Shift[]> | null>(null);
  const [year, setYear] = useState(selectedDate.getFullYear());
  const [month, setMonth] = useState(selectedDate.getMonth() + 1);
  const [rule, setRule] = useState<RuleName>("random-basic");

  useEffect(() => {
    if (currentUser.role === "manager") {
      setShiftMap(loadShiftMap());
      setDraftMap(
        Object.fromEntries(
          Object.entries(loadDrafts()).map(([ym, arr]) => [
            ym,
            arr.map(d => Array.isArray(d) ? Object.fromEntries(Object.entries(d as unknown as Record<string, Shift[]>)) : d)
          ])
        ) as Record<string, Record<string, Shift[]>[]>
      );
    } else {
      setShiftMap(loadRequestMap());
    }
  }, []);

  const ymKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const persistFinal = (map: Record<string, Shift[]>) => { setShiftMap(map); saveShiftMap(map); };
  const persistDraft = (map: Record<string, Record<string, Shift[]>[]>) => { setDraftMap(map); saveDrafts(map); };

  const monthDrafts = (ym: string) => draftMap[ym] ?? [];

  const isPublished = (ym: string, draft: Record<string, Shift[]>) => {
    const pub: Record<string, Shift[]> = {};
    Object.entries(shiftMap).forEach(([k, v]) => { if (k.startsWith(ym + "-")) pub[k] = v; });
    const pubKeys = Object.keys(pub).sort().join(",");
    const draftKeys = Object.keys(draft).sort().join(",");
    if (pubKeys !== draftKeys) return false;
    return Object.keys(pub).every(k => JSON.stringify(pub[k]) === JSON.stringify(draft[k]));
  };

  const handleGenerate = () => {
    const generated = generateSchedule(year, month, rule);
    const ym = ymKey(year, month);
    const newArr = [...(draftMap[ym] ?? []), generated];
    persistDraft({ ...draftMap, [ym]: newArr });
  };

  const handlePreview = (ym: string, idx: number) => {
    setDraftIdx({ ym, idx });
    setEditingDraft(monthDrafts(ym)[idx]);
  };

  const handleEditDraftChange = (newDraft: Record<string, Shift[]>) => {
    if (!draftIdx) return;
    setEditingDraft(newDraft);
    const arr = [...monthDrafts(draftIdx.ym)];
    arr[draftIdx.idx] = newDraft;
    persistDraft({ ...draftMap, [draftIdx.ym]: arr });
  };

  const handlePublish = () => {
    if (!draftIdx || !editingDraft) return;
    const ym = draftIdx.ym;
    const newMap: Record<string, Shift[]> = { ...shiftMap };
    Object.keys(newMap).forEach(k => { if (k.startsWith(ym + "-")) delete newMap[k]; });
    Object.entries(editingDraft).forEach(([k, v]) => { newMap[k] = v; });
    persistFinal(newMap);
  };

  const handleUnpublish = (ym: string) => {
    const newMap: Record<string, Shift[]> = {};
    Object.entries(shiftMap).forEach(([k, v]) => { if (!k.startsWith(ym + "-")) newMap[k] = v; });
    persistFinal(newMap);
  };

  const handleDelete = (ym: string, idx: number) => {
    const arr = monthDrafts(ym).filter((_, i) => i !== idx);
    persistDraft({ ...draftMap, [ym]: arr });
    if (draftIdx && draftIdx.ym === ym && draftIdx.idx === idx) {
      setDraftIdx(null);
      setEditingDraft(null);
    }
  };

  const calendarMap = currentUser.role === "manager" && editingDraft ? editingDraft : shiftMap;

  return (
    <div className="min-h-screen  from-slate-800 to-slate-900 text-white">
      {/* 管理者ヘッダー */}
      {currentUser.role === "manager" && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="shadow-md border-b border-white/10 bg-white/5 backdrop-blur p-6"
        >
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-center gap-4">
              <select value={year} onChange={e => setYear(+e.target.value)} className="px-3 py-2 bg-white/10 rounded text-white w-24">
                {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
              </select>
              <select value={month} onChange={e => setMonth(+e.target.value)} className="px-3 py-2 bg-white/10 rounded text-white w-16">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m}>{m}</option>)}
              </select>
              <select value={rule} onChange={e => setRule(e.target.value as RuleName)} className="px-3 py-2 bg-white/10 rounded text-white w-40">
                <option value="random-basic">AI自動編成</option>
              </select>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleGenerate} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white font-medium">生成する</motion.button>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{ymKey(year, month)} のドラフト一覧</h3>
              {monthDrafts(ymKey(year, month)).map((d, i) => (
                <div key={`${i}-${Object.keys(d).join(",")}`} className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <span>案 {i + 1}（{Object.keys(d).length} 日分）{isPublished(ymKey(year, month), d) && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 rounded">公開中</span>}</span>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handlePreview(ymKey(year, month), i)} className={`px-3 py-1 bg-gray-300 text-gray-800 text-sm rounded ${draftIdx?.ym === ymKey(year, month) && draftIdx?.idx === i ? 'ring-2 ring-green-500' : ''}`}>内容</button>
                      {isPublished(ymKey(year, month), d) ? (
                        <button onClick={() => handleUnpublish(ymKey(year, month))} className="px-3 py-1 bg-yellow-500 text-white text-sm rounded">非公開</button>
                      ) : (
                        <button onClick={handlePublish} disabled={!(draftIdx?.ym === ymKey(year, month) && draftIdx?.idx === i)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded disabled:opacity-50">公開</button>
                      )}
                      <button onClick={() => handleDelete(ymKey(year, month), i)} className="px-3 py-1 bg-red-500 text-white text-sm rounded">削除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.header>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">
        {currentUser.role === "manager" ? (
          editingDraft ? (
            <ShiftCalendar currentUser={currentUser} shiftMap={editingDraft} selectedDate={selectedDate} onDateSelect={setSelectedDate} onEditShift={() => setModalOpen(true)} />
          ) : (
            <div className="text-center text-white/60 text-lg py-12">
              プレビュー中の案はありません。<br />上の「内容」ボタンで案を選択してください。
            </div>
          )
        ) : (
          <ShiftCalendar currentUser={currentUser} shiftMap={shiftMap} selectedDate={selectedDate} onDateSelect={setSelectedDate} onEditShift={() => setModalOpen(true)} />
        )}
      </main>

      <ShiftModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        currentUser={currentUser}
        shiftMap={calendarMap}
        setShiftMap={draftIdx && editingDraft !== null ? (m) => handleEditDraftChange(m) : persistFinal}
      />
    </div>
  );
}
