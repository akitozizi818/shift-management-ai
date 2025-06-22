"use client"
import dynamic from "next/dynamic"
import { CalendarRange, Edit, AlarmClock, Megaphone } from "lucide-react"
import ModernMenuCard from "@/components/dashboard/modern-menu-card"
import {  useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchPublished } from "@/logic/firebaseSchedule"

const MotionDiv = dynamic(
  () => import("framer-motion").then((m) => m.motion.div),
  { ssr: false }
)


/* ---------------- メニュー ---------------- */
const menuItems = [
  {
    href: "/member/shiftschedule",
    icon: CalendarRange,
    label: "確定シフト",
    description: "承認済みのシフトスケジュールを確認できます",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    href: "/member/shiftrequests",
    icon: Edit,
    label: "シフト希望の登録",
    description: "シフト希望を提出することができます",
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
]

export default function MemberHomePage() {
  const { user, id } = useAuth();
  const [nextShift, setNextShift] = useState<{ date: string; time: string } | null>(null);
  const [news, setNews] = useState<string[]>([]);

  useEffect(() => {
    const fetchShiftData = async () => {
      try {
        // 公開中のスケジュールを取得
        const publishedSchedule = await fetchPublished();
        if (!publishedSchedule) {
          console.log("No published schedule found.");
          return;
        }

        // 直近のシフトを特定
        const today = new Date();
        const upcomingShift = Object.entries(publishedSchedule.shifts)
          .filter(([date]) => new Date(date) >= today) // 今日以降のシフト
          .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()) // 日付順にソート
          .shift(); // 最も近いシフトを取得

        if (upcomingShift) {
          const [date, { memberAssignments }] = upcomingShift;
          const startTime = memberAssignments[0]?.startTime || "未定";
          const endTime = memberAssignments[0]?.endTime || "未定";

          setNextShift({
            date: new Date(date).toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
              weekday: "short",
            }),
            time: `${startTime} - ${endTime}`,
          });
        }

        // お知らせを生成
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString("ja-JP", { month: "long" });
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1).toLocaleString("ja-JP", { month: "long" });

        setNews([
          `${currentMonth}25日 までに ${nextMonth}分の希望提出をお願いします。`,
          "アプリ v1.2.0 をリリースしました。",
        ]);
      } catch (error) {
        console.error("Error fetching shift data:", error);
      }
    };

    fetchShiftData();
  }, []);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto"
    >
      {/* ---------------- ヘッダー ---------------- */}
      <h1 className="text-4xl font-bold text-white mb-4">
        おかえりなさい、
        {user && id && user[id] && user[id].name
          ? `${user[id].name}さん`
          : "ゲストさん"}
      </h1>
      <p className="text-xl text-white/80 mb-10">
        シフト希望の提出・確認をサポートします
      </p>

      {/* ---------------- メインメニュー ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {menuItems.map((item, i) => (
          <MotionDiv
            key={item.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
          >
            <ModernMenuCard {...item} />
          </MotionDiv>
        ))}
      </div>

      {/* ---------------- ここから追加ブロック ---------------- */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10"
      >
        {/* 次の出勤 */}
        {nextShift && (
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div className="grid place-items-center w-14 h-14 rounded-full bg-emerald-500/20">
              <AlarmClock className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm text-white/70">次の出勤</p>
              <p className="text-lg font-semibold text-white">
                {nextShift.date} {nextShift.time}
              </p>
            </div>
          </div>
        )}

        {/* お知らせ */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Megaphone className="w-5 h-5 text-indigo-300" />
            <h3 className="text-sm font-semibold text-white">お知らせ</h3>
          </div>
          <ul className="space-y-2 text-sm text-white/80">
            {news.map((n, index) => (
              <li key={index} className="flex gap-2">
                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-emerald-400" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      </MotionDiv>
    </MotionDiv>
  )
}
