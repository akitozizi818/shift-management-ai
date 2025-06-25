"use client";
import { generateSchedule } from "@/lib/scheduleGenerator"; // 上記の generateSchedule を export している前提

async function Runtest() {
  const year = 2025;
  const month = 7;

  try {
    const schedule = await generateSchedule(year, month, "rule-001");

    console.log("✅ Gemini によって生成されたシフト:");
    console.log(JSON.stringify(schedule, null, 2));
  } catch (error) {
    console.error("❌ シフト生成エラー:", error);
  }
}

export default Runtest;




