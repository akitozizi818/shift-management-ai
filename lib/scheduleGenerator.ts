// lib/scheduleGenerator.ts
//=====================================================================
//  📅  月次シフト自動生成ユーティリティ（純 TypeScript）
//---------------------------------------------------------------------
// 使い方
// import { generateSchedule } from "@/lib/scheduleGenerator";
// const map = generateSchedule(2025, 7, "random-basic"); // 2025年7月
// persist(map);
//=====================================================================

import { v4 as uuidv4 } from 'uuid';
import members from "mocks/mockUsers.json";
import type { Shift, ShiftStatus } from "@/types/shift";

/* ------------------------------------------------------------------
 * 型: ルール名（増えたらここに追加）
 * ----------------------------------------------------------------*/
export type RuleName = "random-basic" | "manager-fixed";

/* ------------------------------------------------------------------
 * ユーティリティ
 * ----------------------------------------------------------------*/
const key = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const pickManager = () => members.find((m) => m.role === "manager")!;
const pickStaff   = () => members.filter((m) => m.role === "staff");

/* ------------------------------------------------------------------
 * ルール①: random-basic
 *  店長1名 + スタッフ 2〜N 名をランダム
 * ----------------------------------------------------------------*/
function randomBasic(year: number, month: number): Record<string, Shift[]> {
  const last = new Date(year, month, 0).getDate(); // month: 1-index
  const map: Record<string, Shift[]> = {};
  const manager = pickManager();
  const staff   = pickStaff();

  const startOpt = ["09:00", "10:00", "11:00"];
  const endOpt   = ["17:00", "18:00", "19:00"];

  for (let d = 1; d <= last; d++) {
    const dateKey = key(year, month, d);
    const staffCnt = 2 + Math.floor(Math.random() * staff.length); // 2〜N
    const picked   = [...staff].sort(() => 0.5 - Math.random()).slice(0, staffCnt);

    map[dateKey] = [
      {
        id: uuidv4(),
        memberId: manager.id,
        name: manager.name,
        role: "manager",
        startTime: "09:00",
        endTime:   "17:00",
        status: "confirmed" as ShiftStatus,
      },
      ...picked.map((p) => ({
        id: uuidv4(),
        memberId: p.id,
        name: p.name,
        role: "staff" as const,
        startTime: startOpt[Math.floor(Math.random()*startOpt.length)],
        endTime:   endOpt[Math.floor(Math.random()*endOpt.length)],
        status: "confirmed" as ShiftStatus,
      })),
    ];
  }
  return map;
}

/* ------------------------------------------------------------------
 * ルール②: manager-fixed
 *  店長1名のみを全日配置（スタッフ空欄）
 * ----------------------------------------------------------------*/
function managerFixed(year: number, month: number): Record<string, Shift[]> {
  const last = new Date(year, month, 0).getDate();
  const map: Record<string, Shift[]> = {};
  const manager = pickManager();

  for (let d = 1; d <= last; d++) {
    map[key(year, month, d)] = [
      {
        id: uuidv4(),
        memberId: manager.id,
        name: manager.name,
        role: "manager",
        startTime: "09:00",
        endTime: "17:00",
        status: "confirmed",
      },
    ];
  }
  return map;
}

/* ------------------------------------------------------------------
 * エクスポート関数: generateSchedule
 * ----------------------------------------------------------------*/
export function generateSchedule(
  year: number,
  month: number, // 1-index (1 = Jan)
  rule: RuleName = "random-basic"
): Record<string, Shift[]> {
  switch (rule) {
    case "random-basic":
      return randomBasic(year, month);
    case "manager-fixed":
      return managerFixed(year, month);
    default:
      return {};
  }
}
