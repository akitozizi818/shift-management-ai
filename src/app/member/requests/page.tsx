import { useMemo } from "react";
import ShiftManagementPage from "../../../components/shift/shift-mangement";
import { loadRequestMap } from "../../../../lib/shiftRequestStorage";
import type { Role, Shift } from "../../../types/shift";

export default function RequestPage() {
  // ★ 本番ではログイン情報から取得
  const currentUser = { id: "3", role: "staff" as Role };

  // 公開済み + 自分の希望が混在した map をロード
  const fullMap = loadRequestMap();

  /** 自分の希望だけを抽出した軽量マップ */
  const ownRequestMap = useMemo(() => {
    const m: Record<string, Shift[]> = {};
    Object.entries(fullMap).forEach(([k, arr]) => {
      const mine = arr.filter(
        (s) => s.memberId === currentUser.id && s.status === "request"
      );
      if (mine.length) m[k] = mine;
    });
    return m;
  }, [fullMap]);

  /* ShiftManagementPage は「編集モーダル」や
     追加ロジックを持っているのでそのまま活用する */
  return (
    <ShiftManagementPage
      currentUser={currentUser}
      /** 公開表ではなく自分の希望だけを渡す */
      initialShiftMap={ownRequestMap}
    />
  );
}
