import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import type { ShiftRequest } from "@/types/shift";

// 日付を YYYY-MM-DD 形式で文字列化する関数（未定義なら以下を使用）
const ymd = (date: Date) => {
  return date.toISOString().split("T")[0];
};

// 重複確認・追記付き保存処理
export const saveShiftRequest = async (request: ShiftRequest) => {
  const shiftRequestsRef = collection(db, "shiftRequests");

  const q = query(
    shiftRequestsRef,
    where("userId", "==", request.userId),
    where("month", "==", request.month)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    const existing = snapshot.docs[0].data() as ShiftRequest;

    const uniq = (arr: number[]) => Array.from(new Set(arr));

    /* ---------- ① 追加・更新 ---------- */
    let preferred = uniq([...existing.preferredDates]);
    let unavailable = uniq([...existing.unavailableDates]);
    let nextShifts = { ...existing.preferredShifts };

    // ―― 希望　――
    if (request.preferredDates.length) {
      request.preferredDates.forEach(ts => {
        preferred.push(ts); // 希望日を追加
        unavailable = unavailable.filter(u => u !== ts); // 不可日から除外
      });
      Object.entries(request.preferredShifts).forEach(
        ([k, v]) => { nextShifts[k] = v; } // シフト希望を上書き
      );
    }

    // ―― 不可　――
    if (request.unavailableDates.length) {
      request.unavailableDates.forEach(ts => {
        unavailable.push(ts); // 不可日を追加
        preferred = preferred.filter(p => p !== ts); // 希望日から除外
        delete nextShifts[ymd(new Date(ts))]; // シフト希望も削除
      });
    }

    const nextPreferredDates = uniq(preferred);
    const nextUnavailableDates = uniq(unavailable);

    await setDoc(
      docRef,
      {
        preferredDates: nextPreferredDates,
        unavailableDates: nextUnavailableDates,
        preferredShifts: nextShifts,
        submittedAt: Date.now(), // または serverTimestamp() でも可
        status: "pending",
      },
      { merge: true }
    );
  } else {
    // 新規保存
    const newDocRef = doc(db, "shiftRequests", request.requestId);
    await setDoc(newDocRef, request);
  }
};
