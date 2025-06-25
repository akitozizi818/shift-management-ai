// src/lib/firebase/firebaseUsers.ts
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";



export interface UserDoc {
  name: string;
  email: string;
  role: "admin" | "member";
  isActive: boolean;
  department?: string;
  lineUserId?: string;
  createdAt: any;
  updatedAt: any;
}

/** アクティブユーザーのみ取得して Map<userId, UserDoc> で返す */
export async function fetchActiveUsers(): Promise<Record<string, UserDoc>> {
  const q = query(collection(db, "users"), where("isActive", "==", true));
  const snap = await getDocs(q);
  const map: Record<string, UserDoc> = {};
  snap.docs.forEach((d) => (map[d.id] = d.data() as UserDoc));
  return map;
}

/** lineUserIdに一致するユーザー情報を取得 */
export async function fetchUserByLineUserId(lineUserId: string): Promise<{ id: string; data: UserDoc } | null> {
  try {
    const q = query(collection(db, "users"), where("lineUserId", "==", lineUserId));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return null;
    }
    
    // 最初に見つかったユーザーを返す
    const userDoc = snap.docs[0];
    return {
      id: userDoc.id,
      data: userDoc.data() as UserDoc
    };
  } catch (error) {
    console.error("Error fetching user by lineUserId:", error);
    throw new Error("Failed to fetch user by lineUserId");
  }
}
