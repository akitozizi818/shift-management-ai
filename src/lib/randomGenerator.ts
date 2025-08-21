import { v4 as uuid } from "uuid";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { Schedule, memberAssignment } from "@/types/shift";

const SHIFTS = [
  { start: "09:00", end: "17:00" },
  { start: "11:00", end: "19:00" },
  { start: "13:00", end: "21:00" },
] as const;

const two = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const rand = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

export async function generateRandomSchedule(year: number, month: number): Promise<Schedule> {
  const ym = `${year}-${two(month)}`;
  const empty: Schedule["shifts"] = {};

  for (let d = 1; d <= daysInMonth(year, month); d++) {
    empty[`${ym}-${two(d)}`] = { memberAssignments: [] };
  }

  const snap = await getDocs(collection(db, "users"));
  const list = snap.docs.map((d) => ({ 
    id: d.id, 
    ...(d.data() as { role: string; [key: string]: unknown }) 
  })) as {
    id: string;
    role: string;
  }[];
  const members = list.filter((m) => m.role === "member");
  const admins = list.filter((m) => m.role === "admin");

  Object.keys(empty).forEach((dateKey) => {
    const assigns: memberAssignment[] = [];

    const admin = admins.length ? rand(admins) : rand(members);
    assigns.push({
      userId: admin.id,
      role: admin.role,
      startTime: "09:00",
      endTime: "17:00",
    });

    const n = Math.min(members.length, Math.floor(Math.random() * 4));
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      const s = shuffled[i];
      if (!s) continue;
      const { start, end } = rand(SHIFTS);
      assigns.push({
        userId: s.id,
        role: s.role,
        startTime: start,
        endTime: end,
      });
    }

    empty[dateKey].memberAssignments = assigns;
  });

  return {
    scheduleId: uuid(),
    month: ym,
    generatedBy: "system",
    status: "draft",
    generatedAt: Date.now(),
    shifts: empty,
    metadata: {
      totalHours: 0,
      coverageRate: 1,
    },
  };
}
