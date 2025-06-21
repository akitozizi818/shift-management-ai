"use client"
import { CalendarRange, PencilRuler, Users2, Settings } from "lucide-react"
import dynamic from "next/dynamic"
import ModernMenuCard from "../../components/dashboard/modern-menu-card"

const MotionDiv = dynamic(() => import("framer-motion").then((mod) => mod.motion.div), { ssr: false })

const menuItems = [
  {
    href: "/admin/shiftfinal",
    icon: CalendarRange,
    label: "確定シフト",
    description: "承認済みのシフトスケジュールを確認・管理できます",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    href: "/admin/shiftcreate",
    icon: PencilRuler,
    label: "シフトの作成",
    description: "新しいシフトスケジュールを作成・編集できます",
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  {
    href: "/admin/createRule",
    icon: Settings,
    label: "シフトルールの作成",
    description: "シフト作成時の制約やルールを設定できます",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    href: "/admin/shiftrequests",
    icon: Users2,
    label: "バイトの希望一覧",
    description: "スタッフからのシフト希望を確認・承認できます",
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
]

export default function AdminHomePage() {
  return (
    <div className="min-h-screen relative">

      <div className="relative z-10 flex">

        <div className="flex-1">

          <main className="p-8">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-6xl mx-auto"
            >
              <div className="mb-12">
                <MotionDiv
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h1 className="text-4xl font-bold text-white mb-4">おかえりなさい、店長！</h1>
                  <p className="text-xl text-white/80">今日も効率的なシフト管理をサポートします</p>
                </MotionDiv>
              </div>

              <MotionDiv
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {menuItems.map((item, index) => (
                  <MotionDiv
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  >
                    <ModernMenuCard {...item} />
                  </MotionDiv>
                ))}
              </MotionDiv>

            </MotionDiv>
          </main>
        </div>
      </div>
    </div>
  )
}
