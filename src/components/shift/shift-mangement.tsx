"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShiftCalendar from "@/components/shift/shift-calendar";
import ShiftModal from "@/components/shift/shift-modal";

import { generateSchedule, type RuleName } from "../../../lib/scheduleGenerator";
import { loadShiftMap, saveShiftMap } from "../../../lib/shiftStorage";
import { loadDrafts, saveDrafts } from "../../../lib/shiftDraftStorage";
import type { Shift, Role } from "@/types/shift";
import { loadRequestMap } from "../../../lib/shiftRequestStorage";

export type User = { id: string; role: Role };
interface Props { currentUser: User; initialShiftMap?: Record<string, Shift[]> }

export default function ShiftManagementPage({ currentUser, initialShiftMap }: Props) {
  // ---------- State ----------
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);

  const [shiftMap, setShiftMap] = useState<Record<string, Shift[]>>(initialShiftMap ?? {});   // 公開済み
  const [draftMap, setDraftMap] = useState<Record<string, Record<string, Shift[]>[]>>({}); // 月→案[]: Record<string, Shift[]>[]
  const [draftIdx, setDraftIdx] = useState<{ ym: string, idx: number } | null>(null);      // どのドラフトを表示中か

  // ドラフトモードで編集中のドラフトデータ
  const [editingDraft, setEditingDraft] = useState<Record<string, Shift[]> | null>(null);

  // 生成パラメータ
  const [year, setYear] = useState(selectedDate.getFullYear());
  const [month, setMonth] = useState(selectedDate.getMonth() + 1);
  const [rule, setRule] = useState<RuleName>("random-basic");

  // ---------- Load ----------
  useEffect(() => {
    if (currentUser.role === "manager") {
      setShiftMap(loadShiftMap());
      setDraftMap(
        Object.fromEntries(
          Object.entries(loadDrafts()).map(([ym, arr]) => [
            ym,
            arr.map(d =>
              Array.isArray(d)
                ? Object.fromEntries(
                  Object.entries(d as unknown as Record<string, Shift[]>).map(([k, v]) => [k, v])
                )
                : d
            ),
          ])
        ) as Record<string, Record<string, Shift[]>[]>
      );
    } else {
      setShiftMap(loadRequestMap());
    }
  }, []);

  // ---------- Helpers ----------
  const ymKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const persistFinal = (map: Record<string, Shift[]>) => { setShiftMap(map); saveShiftMap(map); };
  const persistDraft = (map: Record<string, Record<string, Shift[]>[]>) => { setDraftMap(map); saveDrafts(map); };

  const monthDrafts = (ym: string) => draftMap[ym] ?? [];

  // 公開中判定: 公開シフトと等しい案があるか
  const isPublished = (ym: string, draft: Record<string, Shift[]>) => {
    // 現在公開されているデータ（その月のみ）
    const pub: Record<string, Shift[]> = {};
    Object.entries(shiftMap).forEach(([k, v]) => { if (k.startsWith(ym + "-")) pub[k] = v; });
    // draft, pub どちらも同じキー・同じ配列か
    const pubKeys = Object.keys(pub).sort().join(",");
    const draftKeys = Object.keys(draft).sort().join(",");
    if (pubKeys !== draftKeys) return false;
    return Object.keys(pub).every(
      k => JSON.stringify(pub[k]) === JSON.stringify(draft[k])
    );
  };


  // ---------- Generate ----------
  const handleGenerate = () => {
    const generated = generateSchedule(year, month, rule);
    const ym = ymKey(year, month);
    const newArr = [...(draftMap[ym] ?? []), generated];
    persistDraft({ ...draftMap, [ym]: newArr });
  };

  // ---------- Draft Actions ----------
  const handlePreview = (ym: string, idx: number) => {
    setDraftIdx({ ym, idx });
    setEditingDraft(monthDrafts(ym)[idx]);
  };

  const handleEditDraftChange = (newDraft: Record<string, Shift[]>) => {
    if (!draftIdx) return;
    setEditingDraft(newDraft);
    // ドラフトマップも即座に反映
    const arr = [...monthDrafts(draftIdx.ym)];
    arr[draftIdx.idx] = newDraft;
    persistDraft({ ...draftMap, [draftIdx.ym]: arr });
  };
  const handlePublish = () => {
    if (!draftIdx || !editingDraft) return;
    const ym = draftIdx.ym;
    // 既存の他の月データは残して、対象月だけ上書き
    const newMap: Record<string, Shift[]> = { ...shiftMap };
    // 既存の対象月の全日付を一度消す
    Object.keys(newMap).forEach(k => {
      if (k.startsWith(ym + "-")) delete newMap[k];
    });
    // 新ドラフトの全日付を挿入
    Object.entries(editingDraft).forEach(([k, v]) => {
      newMap[k] = v;
    });
    persistFinal(newMap);
  };

  const handleUnpublish = (ym: string) => {
    // 指定月の公開シフトのみ除去
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

  // カレンダーに表示するデータ
  const calendarMap = currentUser.role === "manager" && editingDraft ? editingDraft : shiftMap;

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-4 text-center">
          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-4xl font-bold">シフト管理</motion.h1>
          {currentUser.role === "manager" && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center gap-4 items-end">
                <select value={year} onChange={e => setYear(+e.target.value)} className="px-3 py-2 border rounded-md w-24">{[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}</select>
                <select value={month} onChange={e => setMonth(+e.target.value)} className="px-3 py-2 border rounded-md w-16">{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m}>{m}</option>)}</select>
                <select value={rule} onChange={e => setRule(e.target.value as RuleName)} className="px-3 py-2 border rounded-md w-40">
                  <option value="random-basic">AI自動編成</option>
                </select>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={handleGenerate} className="px-6 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700">生成する</motion.button>
              </div>

              {/* draft list */}
              <div className="mt-6 space-y-3 text-left">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {ymKey(year, month)} のドラフト一覧
                </h3>
                {(monthDrafts(ymKey(year, month))).map((d, i) => (
                  <div key={`${i}-${Object.keys(d).join(",")}`} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span>案 {i + 1}（{Object.keys(d).length} 日分）{isPublished(ymKey(year, month), d) && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded">公開中</span>}</span>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handlePreview(ymKey(year, month), i)} className={`px-3 py-1 bg-gray-300 text-sm rounded ${draftIdx?.ym === ymKey(year, month) && draftIdx?.idx === i ? 'ring-2 ring-green-500' : ''}`}>内容</button>
                        {isPublished(ymKey(year, month), d) ? (
                          <button onClick={() => handleUnpublish(ymKey(year, month))} className="px-3 py-1 bg-yellow-500 text-white text-sm rounded">非公開</button>
                        ) : (
                          <button onClick={handlePublish} disabled={!(draftIdx?.ym === ymKey(year, month) && draftIdx?.idx === i)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded disabled:opacity-50">公開</button>
                        )}
                        <button onClick={() => handleDelete(ymKey(year, month), i)} className="px-3 py-1 bg-red-500  text-white text-sm rounded">削除</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentUser.role === "manager" ? (
          editingDraft ? (
            <ShiftCalendar
              currentUser={currentUser}
              shiftMap={editingDraft}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onEditShift={() => setModalOpen(true)}
            />
          ) : (
            <div className="text-center text-gray-500 text-lg py-12">
              プレビュー中の案はありません。<br />
              上の「内容」ボタンで案を選択してください。
            </div>
          )
        ) : (
          // スタッフは希望のみ常に表示
          <ShiftCalendar
            currentUser={currentUser}
            shiftMap={shiftMap}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onEditShift={() => setModalOpen(true)}
          />
        )}
      </main>


      {/* 編集モーダル。編集中のドラフト or 公開表を更新 */}
      <ShiftModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        currentUser={currentUser}
        shiftMap={calendarMap}
        setShiftMap={draftIdx && editingDraft !== null
          ? (m) => handleEditDraftChange(m)
          : persistFinal
        }
      />
    </div>
  );
}
