import { VertexAI } from "@google-cloud/vertexai";
import { safeJsonParse } from "@/lib/utils/safeJsonParse";
import type { Rule, Schedule, ShiftRequest, User } from "@/types/shift";

/* ---------- Vertex AI 初期化 ---------- */
const vertexAI = new VertexAI({
  project: process.env.VERTEX_AI_PROJECT_ID!,
  location: process.env.VERTEX_AI_LOCATION!,
});
const gemini = vertexAI.preview.getGenerativeModel({
  model: "gemini-2.5-flash-preview-05-20",
});

/* ---------- シフト生成 ---------- */
export async function generateShiftWithGemini(
  month: string,
  shiftRequests: ShiftRequest[],
  rule: Rule,
  users: User[]
): Promise<Schedule> {

  const prompt = buildPrompt(month, shiftRequests, rule, users);

  const res = await gemini.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = res.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!raw) throw new Error("Gemini から結果が得られませんでした");

  /* ---------- ロバスト JSON 解析 ---------- */
  let parsed: Schedule;
  try {
    parsed = safeJsonParse(raw);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.error("RAW RESPONSE >>>\n", raw);
    }
    throw new Error("Gemini 返答を JSON として解析できません");
  }

  /* ---------- バリデーション ---------- */
  if (parsed.month !== month) {
    throw new Error(`month 不一致: ${parsed.month} vs ${month}`);
  }
  if (!parsed.shifts || !parsed.metadata) {
    throw new Error("Schedule フォーマットが不正です");
  }
  return parsed;
}

/* ---------- プロンプト ---------- */
function buildPrompt(
  month: string,
  shiftRequests: ShiftRequest[],
  rule: Rule,
  users: User[]
): string {
  return `
あなたは熟練のシフト編成AIです。
以下のスタッフの希望シフト、勤務ルール、ユーザー情報に基づいて、
${month} の勤務シフト表を **純粋な JSON** で返答してください（コードブロック禁止）。

【出力スキーマ】
{
  "month":"YYYY-MM",
  "generatedBy":"admin-xxxx",
  "status":"draft",
  "shifts":{ "YYYY-MM-DD": { "memberAssignments":[{...}] } },
  "metadata":{ "totalHours":num, "coverageRate":num, "violatedRules":["str"] },
  "generatedAt": epoch-ms
}

【shift_requests】
${JSON.stringify(shiftRequests, null, 2)}

【rules】
${JSON.stringify(rule, null, 2)}

【users】
${JSON.stringify(users, null, 2)}
`;
}
