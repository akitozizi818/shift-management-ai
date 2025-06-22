/* -------------------------------------------------------
 * Firestore – schedules コレクション汎用ユーティリティ
 * ------------------------------------------------------ */
import {
    setDoc, updateDoc, getDocs, query, where,
    limit, collection, doc, Timestamp,
    orderBy,
    deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { memberAssignment, Schedule, ShiftRequest } from "@/types/shift";

const col = () => collection(db, "schedules");

/* draft 追加（status:draft） */
export async function addSchedule(sc: Schedule) {
    await setDoc(doc(col(), sc.scheduleId), sc);
}

/* 月ごとの draft 一覧を取得 */
export async function listDrafts(month: string): Promise<Schedule[]> {
    const q = query(col(), where("month", "==", month));
    const snap = await getDocs(q);
    return snap.docs
        .map(d => d.data() as Schedule)
        .filter(s => s.status === "draft" || s.status === "archived");
}
/* 全 schedules を取得（管理画面初期ロード用） */
export async function listSchedules(): Promise<Schedule[]> {
    const snap = await getDocs(col());
    return snap.docs.map(d => d.data() as Schedule);
}

/* 現在 published のスケジュールを 1 件返す（なければ null） */
export async function fetchPublished(): Promise<Schedule | null> {
    const q = query(col(), where("status", "==", "published"), limit(1));
    const snap = await getDocs(q);
    return snap.docs.length ? (snap.docs[0].data() as Schedule) : null;
}
export async function deleteSchedule(id: string) {
    await deleteDoc(doc(col(), id));
}


/* 自分のシフト希望を取得 */
export async function fetchMyShiftRequests(userId: string, month: string): Promise<ShiftRequest[]> {
    const q = query(
        collection(db, "shiftRequests"),
        where("userId", "==", userId),
        where("month", "==", month)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ShiftRequest);
}
export async function fetchShiftRequestsByMonth(month: string): Promise<ShiftRequest[]> {
    const q = query(
        collection(db, "shiftRequests"),
        where("month", "==", month)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ShiftRequest);
}


/* すべて のスケジュールを 返す（なければ null） */
export async function fetchAllSchedules(): Promise<Schedule[]> {
    const q = query(col(), orderBy("generatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Schedule);
}

/* draft → published ／他の published はすべて archived */
export async function publishSchedule(target: Schedule) {
    // (1) 既存 published を archived に
    const current = await getDocs(query(col(), where("status", "==", "published")));
    await Promise.all(current.docs.map(d => updateDoc(d.ref, { status: "archived" })));

    // (2) 対象 draft を published に
    await updateDoc(doc(col(), target.scheduleId), {
        status: "published",
        publishedAt: Timestamp.now(),
    });
}

/* published → archived へ戻す */
export async function unpublishSchedule(id: string) {
    await updateDoc(doc(col(), id), { status: "archived" });
}


export async function updateSchedule(
    scheduleId: string,
    shifts: Record<string, { memberAssignments: memberAssignment[] }>
) {
    await updateDoc(doc(col(), scheduleId), { shifts });
}


export const listDraftSchedulesByMonth = async (
    year: number,
    month: number,
): Promise<Schedule[]> => {
    const key = `${year}-${String(month).padStart(2, "0")}`;         // "YYYY-MM"
    const q = query(
        collection(db, "schedules"),
        where("month", "==", key),
    );
    const snap = await getDocs(q);
    return snap.docs
        .map(d => d.data() as Schedule)
        .filter(s => s.status === "draft" || s.status === "archived" || s.status === "published")
        .sort((a, b) => b.generatedAt - a.generatedAt); // DESC
};

