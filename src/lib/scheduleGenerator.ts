//src/lib/scheduleGenerator.ts
import {  fetchActiveUsers } from "@/lib/firebase/firebaseUsers";
import { generateShiftWithGemini } from "@/lib/geminiClient";
import { generateRandomSchedule } from "@/lib/randomGenerator";
import { v4 as uuid } from "uuid";
import type { Schedule, Rule, User } from "@/types/shift";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
// import serviceAccount from "credentials/firebase-admin-key.json";
import type { ServiceAccount } from "firebase-admin";
import { fetchShiftRequestsByMonth } from "./firebase/firebaseSchedule";

// Firebase Admin SDKのサービスアカウントキーを環境変数から取得する
// 環境変数名は 'FIREBASE_SERVICE_ACCOUNT_KEY_BASE64' など、分かりやすいものに設定します。
const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
let serviceAccount: ServiceAccount;
if (serviceAccountKeyBase64) {
  try {
    // Base64エンコードされたJSON文字列をデコードし、JSONとしてパース
    const decodedKey = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decodedKey);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 環境変数からFirebaseサービスアカウントキーのパースに失敗しました:', error);
    }
    // パース失敗は致命的なエラーなので、アプリケーションの起動を停止します
    throw new Error('Firebaseサービスアカウントキーの環境変数が不正です。');
  }
} else {
  // 環境変数が設定されていない場合の処理（本番環境ではエラーとする）
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ 環境変数 FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 が設定されていません。');
  }
  // 開発環境では、ローカルファイルから読み込むなどのフォールバックを検討できますが、
  // 本番ビルドでは必須のエラーとします。
  throw new Error('Firebaseサービスアカウントキーは環境変数として設定する必要があります。');
}
// Firebase Admin 初期化
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  });
}
const db = getFirestore();

// ルールを Firestore から取得
export async function fetchRuleFromFirestore(ruleName: string): Promise<Rule> {
  if (process.env.NODE_ENV === 'development') {
    console.log("Fetching rule:", ruleName);
  }

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
  })) as User[];
  
  if (process.env.NODE_ENV === 'development') {
    console.log("Fetched users:", users);
  }  

  const schedule = await generateShiftWithGemini(ym, shiftRequests, rule, users);
  return {
    ...schedule,
    scheduleId: uuid(),
    generatedBy: schedule.generatedBy ?? "system",
    generatedAt: Date.now(),
    status: schedule.status ?? "draft",
  };
}
