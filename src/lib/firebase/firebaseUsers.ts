// src/lib/firebase/firebaseUsers.ts
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"; // getDoc, doc を追加
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

/**
 * userIdに一致するユーザー情報を取得
 * @param userId 取得したいユーザーのFirestoreドキュメントID
 * @returns ユーザー情報（{ id: string; data: UserDoc }）またはnull
 */
export async function fetchUserById(userId: string): Promise<{ id: string; data: UserDoc } | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }
    
    return {
      id: userSnap.id,
      data: userSnap.data() as UserDoc
    };
  } catch (error) {
    console.error("Error fetching user by userId:", error);
    throw new Error("Failed to fetch user by userId");
  }
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
