"use client"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { logout } from "@/logic/logOut"
const titleMap: Record<string, string> = {
  "/admin": "管理者ダッシュボード",
  "/admin/shiftcreate": "シフト作成",
  "/admin/shiftfinal": "確定シフト一覧",
  "/admin/shiftrequests": "スタッフのシフト希望一覧",
  "/admin/createRule": "シフトルールの作成",
  "/member": "スタッフポータル",
  "/member/shiftrequests": "シフト希望登録",
  "/member/shiftschedule": "確定シフト一覧",
}

export default function AppHeader({
  userName,
  role,
}: {
  userName: string
  role: "admin" | "member"
}) {
  const pathname = usePathname()

  // パスが完全一致しない場合は先頭セグメントで判定
  const title =
    titleMap[pathname] ??
    (pathname.startsWith("/admin")
      ? "管理者ダッシュボード"
      : pathname.startsWith("/member")
        ? "スタッフポータル"
        : "シフト管理システム")
  const router = useRouter()
  const handleLogout = () => logout(router.push)

  return (
    <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 px-6 py-4 sticky top-0 z-50 w-100vw">
      <div className="flex items-center justify-between">
        {/* ---------- タイトル ---------- */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-200">
          {title}
        </h1>

        {/* ---------- ユーザーメニュー ---------- */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full text-gray-300"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {role === "admin" ? "管" : userName[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 bg-gray-700 text-gray-300"
            align="end"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-400">
                  {role === "admin" ? "店長" : "スタッフ"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-600" />
            <DropdownMenuItem className="hover:bg-gray-600" onClick={handleLogout}>
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
