import ShiftManagementPage from "@/components/shift/shift-mangement"

export default function MemberRequestPage() {

  // リクエストモードを有効にする
  const request = true; // リクエストモードを有効にする
  return (
    <ShiftManagementPage  request={request}/>
  );
}
