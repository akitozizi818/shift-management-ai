import { addSchedule } from "../firebase/firebaseSchedule";

export  async function RunRun({ year = 2025, month = 6 ,ruleName = "基本勤務ルール" }) {
    console.log("🔄 シフト案を生成中...");
    //ローディング機能の追加
    try {   
        const res = await fetch('/api/generate-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, month,ruleName })
        });

        if (!res.ok) throw new Error('シフト自動生成 API 呼び出し失敗');

        const schedule = await res.json();
        console.log('✅ Gemini によって生成されたシフト:', schedule);
        await addSchedule(schedule);

        // ▼ 必要なら即編集ビューやカレンダーに反映 
        // setEditing(schedule);
        // setDayAssignments(toMap(schedule.shifts));
    } catch (err) {
        console.error('❌ シフト生成エラー:', err);
        alert('シフト生成に失敗しました');
    } 
}