import {  fetchActiveUsers } from "@/lib/firebase/firebaseUsers";
import { generateShiftWithGemini } from "@/lib/geminiClient";
import { generateRandomSchedule } from "@/lib/randomGenerator";
import { v4 as uuid } from "uuid";
import type { Schedule, ShiftRequest, Rule, User } from "@/types/shift";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import serviceAccount from "credentials/firebase-admin-key.json";
import type { ServiceAccount } from "firebase-admin";
import { fetchShiftRequestsByMonth } from "./firebase/firebaseSchedule";

// Firebase Admin 初期化
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  });
}
const db = getFirestore();

// ルールを Firestore から取得
export async function fetchRuleFromFirestore(ruleName: string): Promise<Rule> {
  console.log("Fetching rule:", ruleName);

  const snapshot = await db
    .collection("rules")
    .where("name", "==", ruleName)
    .get();

  if (snapshot.empty) {
    throw new Error(`ルール「${ruleName}」が見つかりません`);
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    ...data,
    ruleId: doc.id, // ← 型に ruleId があればセット
  } as Rule;
}

// メイン関数
export interface RuleName{
  year: number;
  month: number;
  ruleName: string;
}
export async function generateSchedule(
  year: number,
  month: number,
  ruleName: string,
): Promise<Schedule> {
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  if (!ruleName) return await generateRandomSchedule(year, month);

  const [rule, shiftRequests, userMap] = await Promise.all([
    fetchRuleFromFirestore(ruleName),
    fetchShiftRequestsByMonth(ym),
    fetchActiveUsers(),
  ]);
  console.log("Shift requests:", shiftRequests);  
  const users = Object.entries(userMap).map(([uid, u]) => ({
    ...u,
    id: uid,
  })) as unknown as User[];
  console.log("Fethched users:", users);  

  const schedule = await generateShiftWithGemini(ym, shiftRequests, rule, users);
  return {
    ...schedule,
    scheduleId: uuid(),
    generatedBy: schedule.generatedBy ?? "system",
    generatedAt: Date.now(),
    status: schedule.status ?? "draft",
  };
}
