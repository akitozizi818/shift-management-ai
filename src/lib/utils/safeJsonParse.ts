// src/lib/utils/safeJsonParse.ts
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export function safeJsonParse<T = unknown>(src: string): T {
  // 0) BOM・ゼロ幅スペースを除去
  let txt = src.replace(/\uFEFF|[\u200B-\u200D]/g, "");

  // 1) コードフェンスがあれば中身だけ抜く
  const m = txt.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (m) txt = m[1];

  // 2) 最外の { … } を抜き取る
  const start = txt.indexOf("{");
  const end   = txt.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start)
    throw new Error("braces-not-found");
  txt = txt.slice(start, end + 1);

  // 3) 末尾カンマを潰す
  txt = txt
    .replace(/,\s*([}\]])/g, "$1") // , }  , ]
    .replace(/^\s*\/\/.*$/gm, ""); // 行頭 // コメントも念のため

  return JSON.parse(txt);
}
