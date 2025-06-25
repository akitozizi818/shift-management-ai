"use client";

import AnimatedBackground from "@/components/animated-background";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // users/{uid} が存在しない場合だけ新規作成
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName ?? "",
          email: user.email ?? "",
          role: "member",
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        router.push("/member");
      } else {
        // 存在する場合は最終ログイン日時だけ更新（任意）
        await setDoc(
          userRef,
          {
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        userSnap.data()?.role === "admin"
          ? router.push("/admin")
          : router.push("/member");
      }

    } catch (err) {
      console.error("Google ログイン失敗:", err);
      alert("ログインに失敗しました");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <AnimatedBackground />

      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center text-white/90">
          シフト管理AIエージェント
        </h1>
        <p className="text-center mt-4 text-white/80">
          AIエージェントを活用したLINEベースのシフト管理システム
        </p>

        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={handleGoogleLogin}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    </main>
  );
}
