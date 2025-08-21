// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateSchedule } from "@/lib/scheduleGenerator"; // サーバー専用に移動したファイル

interface GenerateScheduleRequest {
  year: number;
  month: number;
  ruleName: string;
}

export async function POST(req: NextRequest) {
  try {
    const { year, month, ruleName } = await req.json() as GenerateScheduleRequest;
    
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 スケジュール生成リクエスト:", { year, month, ruleName });
    }

    if (!year || !month) {
      return NextResponse.json({ error: "year と month を指定してください" }, { status: 400 });
    }

    const schedule = await generateSchedule(year, month, ruleName);
    return NextResponse.json(schedule, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    
    if (process.env.NODE_ENV === 'development') {
      console.error("❌ スケジュール生成エラー:", error);
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
