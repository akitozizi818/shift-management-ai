import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/logic/firebase";

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
