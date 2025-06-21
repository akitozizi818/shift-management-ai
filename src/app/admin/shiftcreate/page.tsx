"use client";

/* ===================================================================
 * /shift/manage/page.tsx
 * --------------------------------------------------
 * 店長がドラフトを生成・編集・公開/非公開する従来の画面
 * =================================================================*/

import ShiftManagementPage from "../../../components/shift/shift-mangement";
import type { Role } from "@/types/shift";

export default function ManagePage() {
  // ★ 認証導入時に manager 情報に差し替え
  const currentUser = { id: "1", role: "manager" as Role };
  return <ShiftManagementPage currentUser={currentUser} />;
}
