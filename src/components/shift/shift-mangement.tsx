"use client";

/* =============================================================
 * ShiftManagementPage (admin)
 *  - ドラフト生成 / プレビュー / 公開・非公開 / 削除 / 月自動切り替え
 * ============================================================*/
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ShiftCalendar from "@/components/shift/shift-calendar";
import ShiftModal from "@/components/shift/shift-modal";
import {
  addSchedule,
  publishSchedule,
  unpublishSchedule,
  fetchPublished,
  listDrafts,
  fetchAllSchedules,
  deleteSchedule,
  fetchMyShiftRequests,
  fetchShiftRequestsByMonth,
} from "@/lib/firebaseSchedule";
import { generateSchedule, type RuleName } from "@/lib/scheduleGenerator";
import type { Schedule, memberAssignment, RequestMap } from "@/types/shift";
import { useAuth } from "@/app/context/AuthContext";
import { usePathname } from "next/navigation";

/* ---------- props ---------- */
interface Props {
  initialDayAssignments?: RequestMap;
  pageTitle?: string;
  request?: boolean; // 追加：リクエストモード（デフォルトは false）
}

/* ---------- component ---------- */
export default function ShiftManagementPage({
  initialDayAssignments,
  pageTitle = "",
  request = false, // 追加：リクエストモード（デフォルトは false）

}: Props) {
  const [drafts, setDrafts] = useState<Record<string, Schedule[]>>({});
  const [published, setPublished] = useState<Schedule | null>(null);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);

  const [year, setYear] = useState(selectedDate.getFullYear());
  const [month, setMonth] = useState(selectedDate.getMonth() + 1);
  const [rule, setRule] = useState<RuleName>("random-basic");
  const ymKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

  const { user, id } = useAuth();
  const currentUser = user && id ? user[id] : undefined;

  /* -------- reload helpers -------- */
  /* -------- reload helpers -------- */
  const reloadPublished = async () => {
    /* 1) status==="published" を 1 件取得 */
    let pub = await fetchPublished();

    /* 2) 見つからなければ publishedAt がある最新 1 件を fallback */
    if (!pub) {
      const all = await fetchAllSchedules();          // generatedAt DESC
      pub = all.find(s => s.publishedAt) ?? null;
      if (pub) (pub as any).status = "published";     // 後方互換：仮付与
    }

    setPublished(pub);

    /* 3) 公開中があれば年月セレクトも同期 */
    if (pub) {
      const [yy, mm] = pub.month.split("-").map(Number);
      setYear(yy);
      setMonth(mm);
    }
  };

  // --- ルーティングパラメータの取得（Next.js 13.4+） ---
  const path = usePathname(); // パラメータを取得
  useEffect(() => {
    // --- ✅ シフト希望（member /shiftrequests 専用） ---]
    //シフト希望（member /shiftrequests かどうか）であれば、リクエストモードを有効にする
    if (path.includes("/member/shiftrequests")) {
      // --- ✅ 自分のシフト希望（/member/shiftrequests）専用 ---
      const loadMyRequests = async () => {
        if (!request || !currentUser || !id) return;

        const monthKey = ymKey(year, month);           // "YYYY-MM"
        const reqs = await fetchMyShiftRequests(id, monthKey);
        if (!reqs.length) { setDayAssignments({}); return; }

        const map: Record<string, memberAssignment[]> = {};

        reqs.forEach(r => {
          r.preferredDates.forEach(ms => {
            /* --- 日付文字列を 0 埋め "YYYY-MM-DD" に統一 --- */
            const d = new Date(ms);
            const key = normalizeKey(
              `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
            );

            /* --- ⬇︎ ここを修正 ―― 時間情報を活用し複数人をマージ --- */
            const time = r.preferredShifts?.[key];      // { startTime, endTime } | undefined
            const assignment: memberAssignment = {
              userId: r.userId,
              startTime: time?.startTime ?? "00:00",
              endTime: time?.endTime ?? "23:59",
              role: "preferred",
            };

            map[key] = map[key] ? [...map[key], assignment] : [assignment];
          });
        });

        setDayAssignments(map);
        console.log("Shift requests loaded:", map);
      };


      loadMyRequests();
    } else {
      // --- ✅ すべての希望を月単位で取得（/admin/shiftrequests）---
      const loadMyRequests = async () => {
        if (!request || !currentUser || !id) return;

        const monthKey = ymKey(year, month);
        const reqs = await fetchShiftRequestsByMonth(monthKey);
        if (!reqs.length) { setDayAssignments({}); return; }

        const map: Record<string, memberAssignment[]> = {};

        /* ---- 追加・変更分だけ抜粋 ---- */
        reqs.forEach(r => {
          /* ① 希望勤務日 */
          r.preferredDates.forEach(ms => {
            const d = new Date(ms);
            const key = normalizeKey(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);

            const time = r.preferredShifts?.[key];
            const assignment: memberAssignment = {
              userId: r.userId,
              startTime: time?.startTime ?? "09:00",
              endTime: time?.endTime ?? "17:00",
              role: "preferred",
            };
            map[key] = map[key] ? [...map[key], assignment] : [assignment];
          });

          /* ② 勤務不可日 ★ここが新規★ */
          r.unavailableDates.forEach(ms => {
            const d = new Date(ms);
            const key = normalizeKey(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);

            const assignment: memberAssignment = {
              userId: r.userId,
              startTime: "00:00",          // 1 日全休を示すダミー
              endTime: "00:00",
              role: "unavailable",
            };
            map[key] = map[key] ? [...map[key], assignment] : [assignment];
          });
        });


        setDayAssignments(map);
      };


      loadMyRequests();
    }

  }, [request, currentUser, year, month]);   // 👈 依存リストに追加


  const reloadDrafts = async (y = year, m = month) => {
    const list = await listDrafts(ymKey(y, m));
    setDrafts({ [ymKey(y, m)]: list });
  };

  useEffect(() => { reloadDrafts(); }, [year, month]);
  useEffect(() => { reloadPublished(); }, []);

  /* ---------- draft 生成 ---------- */
  const generateDraft = async () => {
    const sc = await generateSchedule(year, month, rule);
    await addSchedule(sc);
    await reloadDrafts();

    // 生成したスケジュールの月に自動切り替え
    const [yy, mm] = sc.month.split("-").map(Number);
    setYear(yy);
    setMonth(mm);

    setEditing(sc);
  };

  /* ---------- 公開 / 非公開 ---------- */
  const handlePublish = async (sc: Schedule) => {
    await publishSchedule(sc);

    setPublished(sc); // 即時反映
    await reloadDrafts();

    // 公開したスケジュールの月に切り替え
    const [yy, mm] = sc.month.split("-").map(Number);
    setYear(yy);
    setMonth(mm);

    const fresh = await fetchPublished();
    if (fresh) setPublished(fresh);

    setEditing(null);
  };

  const handleUnpublish = async (id: string) => {
    await unpublishSchedule(id);
    await reloadDrafts();
    await reloadPublished();
    // 公開解除後の月ジャンプは不要
  };

  /* ---------- calendar data ---------- */
  const [dayAssignments, setDayAssignments] = useState<
    Record<string, memberAssignment[]>
  >({});

  /* ← 追加：どこから来たキーでも 0 埋め "YYYY-MM-DD" に揃える */
  const normalizeKey = (raw: string) => {
    const [y, m, d] = raw.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  };

  /* シフト → dayAssignments 変換を共通化 */
  const toMap = (
    shifts: Record<string, { memberAssignments: memberAssignment[] }>,
  ) =>
    Object.fromEntries(
      Object.entries(shifts).map(([k, v]) => [
        normalizeKey(k),
        v.memberAssignments,
      ]),
    );

  /* -------------------- 変換ロジック -------------------- */
  useEffect(() => {
    // ① URL などから直接渡された初期値
    if (request) return;
    if (initialDayAssignments) {
      setDayAssignments(
        Object.fromEntries(
          Object.entries(initialDayAssignments).map(([k, v]) => [
            normalizeKey(k),
            v as unknown as memberAssignment[],
          ]),
        ),
      );
      return;
    }

    // ② 「内容」ボタンで選択中のドラフト
    if (editing) {
      setDayAssignments(toMap(editing.shifts));
      return;
    }

    // ③ 公開中スケジュール
    if (published) {
      setDayAssignments(toMap(published.shifts));
      return;
    }

    // ④ どれも無ければ空
    setDayAssignments({});
  }, [initialDayAssignments, editing, published]);


  /* ---------- 月ごとのリスト表示用 ---------- */
  const listForMonth: Schedule[] = useMemo(() => {
    const arr: Schedule[] = [
      ...(drafts[ymKey(year, month)] ?? []),
      ...(published && published.month === ymKey(year, month) ? [published] : []),
    ];
    /* ---- scheduleId で重複排除 ---- */
    const uniq: Record<string, Schedule> = {};
    arr.forEach(s => { uniq[s.scheduleId] = s; });
    /* ---- 生成日時の昇順でソート → いちばん古いものが “案1” ---- */
    return Object.values(uniq).sort((a, b) => a.generatedAt - b.generatedAt);
  }, [drafts, published, year, month]);

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen text-white">
      {currentUser?.role === "admin" && !path.includes("/admin/shiftrequests") && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-white/10 backdrop-blur p-6 space-y-6"
        >
          <h1 className="text-2xl font-bold">{pageTitle}</h1>

          {/* generator form */}
          <div className="flex flex-wrap gap-3">
            <select value={year} onChange={e => setYear(+e.target.value)} className="bg-slate-700 px-3 py-2 rounded">
              {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(+e.target.value)} className="bg-slate-700 px-3 py-2 rounded">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m}>{m}</option>)}
            </select>
            <select value={rule} onChange={e => setRule(e.target.value as RuleName)} className="bg-slate-700 px-3 py-2 rounded">
              <option value="random-basic">AI 自動編成</option>
            </select>
            <button onClick={generateDraft} className="bg-emerald-600 px-6 py-2 rounded hover:bg-emerald-700">
              生成
            </button>
          </div>

          {/* draft & published list */}
          <div className="space-y-3">
            {listForMonth.map((d, i) => (
              <div key={d.scheduleId} className="bg-slate-700/60 p-3 rounded flex justify-between items-center">
                <span>
                  案 {i + 1}
                  {d.status === "published" && (
                    <span className="ml-2 text-xs bg-blue-600 px-2 py-0.5 rounded">公開中</span>
                  )}
                </span>
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => setEditing(d)} className="px-2 bg-gray-500 rounded">内容</button>
                  {d.status === "published" ? (
                    <button onClick={() => handleUnpublish(d.scheduleId)} className="px-2 bg-yellow-600 rounded">
                      非公開
                    </button>
                  ) : (
                    <button onClick={() => handlePublish(d)} className="px-2 bg-blue-600 rounded">
                      公開
                    </button>
                  )}
                  {d.status !== "published" && (
                    <button
                      onClick={async () => {
                        const ok = confirm("このシフト案を削除しますか？");
                        if (ok) {
                          await deleteSchedule(d.scheduleId);
                          await reloadDrafts();
                        }
                      }}
                      className="px-2 bg-red-600 hover:bg-red-700 rounded"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.header>
      )}

      {/* calendar */}
      <main className="max-w-6xl mx-auto p-6">
        <ShiftCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onEditShift={
            request && path.includes("/admin/shiftrequests")
              ? () => { }
              : () => setModalOpen(true)
          }
          dayAssignments={dayAssignments} // リクエストモードでは空のマップを渡す
        />
      </main>

      {/* modal */}
      {modalOpen && (
        <ShiftModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedDate={selectedDate}
          dayAssignments={dayAssignments}
          setDayAssignments={setDayAssignments}
        />
      )}
    </div>
  );
}
