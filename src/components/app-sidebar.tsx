"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  PencilRuler,
  Users2,
  Settings,
  Home,
  Edit,
  Menu,
  X,
} from "lucide-react";

type Role = "admin" | "member";

const nav: Record<Role, { name: string; href: string; icon: any; color: string }[]> = {
  admin: [
    { name: "ダッシュボード", href: "/admin", icon: Home,         color: "from-indigo-500 to-purple-500" },
    { name: "確定シフト",     href: "/admin/shiftfinal",  icon: CalendarRange, color: "from-blue-500 to-cyan-500" },
    { name: "シフト作成",     href: "/admin/shiftcreate", icon: PencilRuler,   color: "from-emerald-500 to-lime-500" },
    { name: "ルール作成",     href: "/admin/createRule",  icon: Settings,      color: "from-fuchsia-500 to-pink-500" },
    { name: "希望一覧",       href: "/admin/shiftrequests", icon: Users2,     color: "from-orange-500 to-amber-500" },
  ],
  member: [
    { name: "ダッシュボード", href: "/member",               icon: Home,         color: "from-indigo-500 to-purple-500" },
    { name: "確定シフト",     href: "/member/shiftschedule", icon: CalendarRange, color: "from-blue-500 to-cyan-500" },
    { name: "希望登録",       href: "/member/shiftrequests", icon: Edit,         color: "from-emerald-500 to-lime-500" },
  ],
};

export default function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const items = nav[role];

  /* ----- utility ----- */
  const cls = (...c: (string | boolean | null | undefined)[]) => c.filter(Boolean).join(" ");

  return (
    <>
      {/* トグルボタン - 画面固定で少し大きめに */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="fixed top-4 left-4 z-[60] grid place-items-center rounded-xl
                   bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-lg
                   w-10 h-10 hover:scale-110 transition-transform"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* サイドバー本体 */}
      <aside
        className={cls(
          "min-h-screen h-100% overflow-hidden backdrop-blur-xl border-r border-white/20 transition-[width] duration-300",
          "bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]", // ガラス感
          open ? "w-64" : "w-16"
        )}
      >
        {/* ロゴエリア */}
        <div className="flex items-center gap-3 p-6">
          {/* <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
            <CalendarRange className="w-6 h-6 text-white" />
          </div> */}
          <span
            className={cls(
              "text-white font-semibold text-lg whitespace-nowrap transition-opacity ml-10",
              open ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {role === "admin" ? "管理メニュー" : "スタッフ"}
          </span>
        </div>

        {/* ナビゲーション */}
        <nav className="flex flex-col gap-1 px-2">
          {items.map(({ name, href, icon: Icon, color }) => {
            const active = pathname === href;
            return (
              <Link
                key={name}
                href={href}
                className={cls(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 group transition-all",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {/* カラーライン (active) */}
                <span
                  className={cls(
                    "absolute left-0 top-0 h-full w-1 rounded-r-full",
                    active ? `bg-gradient-to-b ${color}` : "opacity-0"
                  )}
                />
                {/* アイコン */}
                <Icon
                  className={cls(
                    "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                    active && "scale-110"
                  )}
                />
                {/* ラベル */}
                <span
                  className={cls(
                    "whitespace-nowrap transition-opacity",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                >
                  {name}
                </span>

                {/* ツールチップ（閉じているときだけ表示） */}
                {!open && (
                  <span
                    className={cls(
                      "absolute left-full ml-3 px-2 py-1 rounded-md text-xs text-white bg-gray-900/80 backdrop-blur-sm",
                      "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all"
                    )}
                  >
                    {name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
