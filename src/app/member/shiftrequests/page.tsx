import ShiftManagementPage from "@/components/shift/shift-mangement"
// import { loadRequestMap } from "@/lib/scheduleRequestStorage";

export default function MemberRequestPage() {
  const request = true; // リクエストモードを有効にする


  return (
    <ShiftManagementPage
      request={request} // リクエストモードを有効にする
      // loadRequestMap={loadRequestMap} // リクエストマップのロード関数を渡す
    />
  );
}
