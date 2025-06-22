// src/logic/scheduleGenerator.ts
/* =====================================================================
 * Schedule Generator – “random-basic”         last update: 2025-06-xx
 * ====================================================================*/

import { v4 as uuid } from "uuid";
import type { Schedule, memberAssignment } from "@/types/shift";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/** 現状ルールは 1 種のみ */
export type RuleName = "random-basic";

/** ────────────────────────────────────────────────
 *  utilities
 * ─────────────────────────────────────────────── */
const two = (n: number) => String(n).padStart(2, "0");

/** 月の日数を取得 */
const daysInMonth = (y: number, m: number) =>
  new Date(y, m, 0).getDate();

/** ランダムユーティリティ */
const rand = <T>(arr: readonly T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

/** 勤務時間パターン */
const SHIFTS = [
  { start: "09:00", end: "17:00" },
  { start: "11:00", end: "19:00" },
  { start: "13:00", end: "21:00" },
] as const;

/* =====================================================================
 * main – generateSchedule
 * ====================================================================*/
export async function generateSchedule(
  year: number,
  month: number,
  rule: RuleName = "random-basic",
): Promise<Schedule> {
  if (rule !== "random-basic")
    throw new Error(`rule '${rule}' not implemented`);

  /* ---------- 1. 空の月テーブルを用意 ---------- */
  const ym = `${year}-${two(month)}`;
  const empty: Schedule["shifts"] = {};
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    empty[`${ym}-${two(d)}`] = { memberAssignments: [] };
  }

  /* ---------- 2. Firestore からメンバー取得 ---------- */
  const snap = await getDocs(collection(db, "users"));
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as { id: string; role: string }[];
  const member: { id: string; role: string }[] = list.filter(m => m.role === "member");
  const admins: { id: string; role: string }[] = list.filter(m => m.role === "admin");
  /* ---------- 3. 各日ごとにランダムで割り当て ---------- */
  Object.keys(empty).forEach(dateKey => {
    const assigns: memberAssignment[] = [];

    // ⅰ) admin (1名固定) – 開店時間
    const man = admins.length ? rand(admins) : rand(member);
    assigns.push({
      userId: man.id,
      role: "admin",
      startTime: "09:00",
      endTime: "17:00",
    });

    // ⅱ) member – 0〜3 人（気分で）
    const n = Math.min(member.length, Math.floor(Math.random() * 4)); // 0–3 かつ人数以下
    const shuffled = [...member].sort(() => Math.random() - 0.5);     // スプレッドでコピー
    for (let i = 0; i < n; i++) {
      const s = shuffled[i];
      if (!s) continue;                           // 念のため undefined ガード
      const { start, end } = rand(SHIFTS);
      assigns.push({
        userId: s.id,
        role: "member",
        startTime: start,
        endTime: end,
      });
    }

    empty[dateKey].memberAssignments = assigns;
  });

  /* ---------- 4. Schedule オブジェクトを返す ---------- */
  return {
    scheduleId: uuid(),
    month: ym,
    generatedBy: "1",      // ← TODO: ログイン ID に置換
    status: "draft",
    generatedAt: Date.now(),
    shifts: empty,
    metadata: {
      totalHours: 0,        // 簡略化（後で集計可）
      coverageRate: 1,
    },
  };
}
