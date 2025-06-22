"use client";
import {
  createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import {
  onAuthStateChanged, User as FirebaseUser,
} from "firebase/auth";
import {
  doc, getDoc,
} from "firebase/firestore";
import { auth, db } from "@/logic/firebase";
import { User } from "@/types/shift";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  id: string | null; // ユーザーIDを追加
}

const AuthContext = createContext<AuthCtx>({ user: null, loading: true, id: null });
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null); // ユーザーIDの状態を追加

  useEffect(() => {
    // Firebase Auth のログイン状態を監視
    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // Firestore に user コレクションがある想定
        const ref = doc(db, "users", fbUser.uid);
        const snap = await getDoc(ref);
        const extra = snap.exists() ? snap.data() : {};

        // UID をキーにしたオブジェクト形式に変換
        setUser({
          [fbUser.uid]: {
            name: extra?.name ?? fbUser.displayName ?? "",
            email: fbUser.email ?? "",
            role: extra?.role ?? "member",
            lineUserId: extra?.lineUserId,
            department: extra?.department,
            isActive: extra?.isActive ?? true,
          },
        });
        setId(fbUser.uid); // ユーザーIDを設定
      } else {
        setUser(null);
        setId(null); // ユーザーIDをリセット
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, id }}>
      {children}
    </AuthContext.Provider>
  );
};
