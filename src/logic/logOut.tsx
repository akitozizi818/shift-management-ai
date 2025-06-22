// logic/logout.ts
import { auth } from "@/logic/firebase";          // auth を初期化済みで export している想定
import { signOut } from "firebase/auth";

/**
 * 完全ログアウトしてルートへ遷移
 */
export const logout = async (push: (url: string) => void) => {
  try {
    await signOut(auth);      // ← Firebase にセッション無効化を要求
  } catch (err) {
    console.error("❌ signOut 失敗:", err);
    // 失敗しても強制的にルートへ戻すならここで何もしない（任意）
  } finally {
    push("/");                // トップページへリダイレクト
  }
};
