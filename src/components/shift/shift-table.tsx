"use client";
import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import type { memberAssignment } from "@/types/shift";

interface Props {
    selectedMonth: string; // 例: "2025-07"
    allAssignments: Record<string, memberAssignment[]>;
    setSelectedMonth?: (m: string) => void;
}

export default function ShiftTable({ selectedMonth, allAssignments, setSelectedMonth }: Props) {
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const db = getFirestore();

    useEffect(() => {
        const userIds = new Set<string>();
        Object.values(allAssignments).forEach((arr) =>
            arr.forEach((a) => userIds.add(a.userId))
        );

        const fetchUserNames = async () => {
            const names: Record<string, string> = {};

            for (const userId of userIds) {
                if (!userId || userNames[userId]) continue;

                try {
                    const snap = await getDoc(doc(db, "users", userId));
                    names[userId] = snap.exists()
                        ? snap.data().name
                        : "不明なユーザー";
                } catch {
                    names[userId] = "エラー";
                }
            }

            setUserNames((prev) => ({ ...prev, ...names }));
        };

        fetchUserNames();
    }, [allAssignments]);

    const hours = Array.from({ length: 16 }, (_, i) => 9 + i); // 9:00〜24:00
    const filteredEntries = Object.entries(allAssignments).filter(
        ([date]) => date.startsWith(selectedMonth)   // "YYYY-MM-DD"
    );
    return (
        <div className="mt-10">
            <h2 className="text-xl font-semibold mb-6 text-white/90">
                {selectedMonth} 月のシフト一覧
            </h2>

            {setSelectedMonth && (
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mb-4 bg-white/80  px-3 py-2 rounded"
                >
                    {Array.from(
                        new Set(Object.keys(allAssignments).map((d) => d.slice(0, 7))) // ["2025-06", "2025-07", ...]
                    )
                        .sort()
                        .map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                </select>
            )}
            {filteredEntries
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, assignments]) => (
                    <div key={date} className="mb-10">
                        <h3 className="text-base font-bold mb-2 text-white/90">{date}</h3>
                        <div className="overflow-x-auto border border-white/10 rounded">
                            <table className="min-w-[900px] text-sm table-auto border-collapse">
                                <thead className="bg-gray-700 text-white">
                                    <tr>
                                        <th className="p-2 border border-gray-500">スタッフ</th>
                                        <th className="p-2 border border-gray-500">開始</th>
                                        <th className="p-2 border border-gray-500">終了</th>
                                        {hours.map((h) => (
                                            <th key={h} className="p-1 border border-gray-500 text-xs">
                                                {h}:00
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((a, i) => {
                                        const start = parseInt(a.startTime.split(":")[0], 10);
                                        const end = parseInt(a.endTime.split(":")[0], 10);
                                        const isUnavailable = a.startTime === "00:00" && a.endTime === "00:00";

                                        return (
                                            <tr
                                                key={i}
                                                className={`text-center ${isUnavailable
                                                    ? "bg-slate-800 text-gray-400 italic"
                                                    : "text-white"
                                                    }`}
                                            >
                                                <td className="p-2 border border-gray-500 text-left">
                                                    {userNames[a.userId] || "読み込み中..."}
                                                </td>
                                                <td className="p-2 border border-gray-500">
                                                    {isUnavailable ? "勤務不可" : a.startTime}
                                                </td>
                                                <td className="p-2 border border-gray-500">
                                                    {isUnavailable ? "勤務不可" : a.endTime}
                                                </td>
                                                {hours.map((h) => {
                                                    const active = h >= start && h < end;
                                                    return (
                                                        <td
                                                            key={h}
                                                            className={`p-1 border border-gray-500 ${active
                                                                ? "bg-orange-400"
                                                                : isUnavailable
                                                                    ? "bg-slate-900"
                                                                    : ""
                                                                }`}
                                                        >
                                                            {active ? "●" : ""}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>
                    </div>
                ))}
        </div>
    );
}
