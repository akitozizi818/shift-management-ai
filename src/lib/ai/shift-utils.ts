// src/lib/ai/shift-utils.ts
import { shiftSampleData, ruleSampleData, memberMasterData } from './sample-data';

// メンバー名を取得する関数
export function getMemberName(userId: string): string {
  const member = memberMasterData.find(m => m.userId === userId);
  return member ? member.name : '不明なメンバー';
}

// LINE IDが有効かチェックする関数
export function isValidMember(userId: string): boolean {
  return memberMasterData.some(m => m.userId === userId);
}

// 現在の日本時間を取得（Function calling用）
export function getCurrentDate(args: any = {}): string {
  console.log('[getCurrentDate] 受信引数:', args);
  
  const now = new Date();
  const japanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  
  const dateStr = formatDate(japanTime);
  const timeStr = formatTime(japanTime);
  
  const result = `現在の日本時間: ${dateStr} ${timeStr}`;
  console.log('[getCurrentDate] 結果:', result);
  
  return result;
}

// シフトデータを取得（Function calling用）
export function getShiftData(args: any): string {
  console.log('[getShiftData] 受信引数:', args);
  
  // パラメータの存在チェック
  if (!args || typeof args !== 'object') {
    return 'エラー: 不正なパラメータ形式です。';
  }
  
  const date = args.date;
  console.log('[getShiftData] 対象日付:', date);
  
  // 必須パラメータのチェック
  if (!date) {
    return 'エラー: 日付パラメータが不足しています。';
  }
  
  const shift = shiftSampleData.find(s => s.date === date);
  
  if (!shift) {
    return `${date}のシフトデータは見つかりませんでした。`;
  }
  
  if (shift.members.length === 0) {
    return `${date}は現在誰もシフトに入っていません（人員不足状態）。`;
  }
  
  const memberList = shift.members.map(m => 
    `${m.name}さん: ${m.startTime}-${m.endTime}`
  ).join(', ');
  
  const result = `${date}のシフト状況: ${memberList} (合計${shift.members.length}名)`;
  console.log('[getShiftData] 結果:', result);
  
  return result;
}

// ルールデータを取得（Function calling用）
export function getRuleData(args: any = {}): string {
  console.log('[getRuleData] 受信引数:', args);
  
  const rules = ruleSampleData.map(rule => 
    `- ${rule.name}: ${rule.description}`
  ).join('\n');
  
  const result = `シフト管理ルール:\n${rules}`;
  console.log('[getRuleData] 結果取得完了');
  
  return result;
}

// シフトデータを編集（Function calling用）
export function editShiftData(args: any): string {
  console.log('[editShiftData] 受信引数:', args);
  
  // パラメータの存在チェック
  if (!args || typeof args !== 'object') {
    return 'エラー: 不正なパラメータ形式です。';
  }
  
  // オブジェクトから個別変数に分解
  const date = args.date;
  const action = args.action;
  const userId = args.userId;
  const startTime = args.startTime;
  const endTime = args.endTime;
  
  console.log('[editShiftData] 分解後パラメータ:', {
    date,
    action,
    userId,
    startTime,
    endTime
  });
  
  // 必須パラメータのチェック
  if (!date || !action || !userId) {
    return `エラー: 必須パラメータが不足しています。date: ${date}, action: ${action}, userId: ${userId}`;
  }
  
  // actionの値チェック
  if (action !== 'add' && action !== 'remove') {
    return `エラー: 無効なアクションです: ${action}`;
  }
  
  // LINE IDの有効性チェック
  if (!isValidMember(userId)) {
    return `無効なメンバーIDです: ${userId}`;
  }

  const memberName = getMemberName(userId);
  const shiftIndex = shiftSampleData.findIndex(s => s.date === date);
  
  console.log(`[editShiftData] 処理開始: ${memberName}さんの${action}処理 対象日: ${date}`);
  
  let result: string;
  
  if (action === 'add') {
    result = addMemberToShift(shiftIndex, date, userId, memberName, startTime, endTime);
  } else if (action === 'remove') {
    result = removeMemberFromShift(shiftIndex, date, userId, memberName);
  } else {
    result = `無効な操作です: ${action}`;
  }
  
  console.log('[editShiftData] 処理結果:', result);
  return result;
}

// ヘルパー関数：日付フォーマット
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ヘルパー関数：時刻フォーマット
function formatTime(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

// ヘルパー関数：メンバー追加
function addMemberToShift(
  shiftIndex: number, 
  date: string, 
  userId: string, 
  memberName: string, 
  startTime: string, 
  endTime: string
): string {
  console.log(`[addMemberToShift] ${memberName}さんを${date} ${startTime}-${endTime}で追加`);
  
  if (!startTime || !endTime) {
    return 'シフト追加には開始時間と終了時間が必要です。';
  }

  if (shiftIndex === -1) {
    // 新しい日付のシフトを作成
    shiftSampleData.push({
      date,
      members: [{ userId, name: memberName, startTime, endTime }]
    });
    return `${date}に${memberName}さんのシフト（${startTime}-${endTime}）を新規追加しました。`;
  }
  
  const shift = shiftSampleData[shiftIndex];
  
  // 既に同じメンバーがいないかチェック（LINE IDベース）
  const existingMember = shift.members.find(m => m.userId === userId);
  if (existingMember) {
    return `${memberName}さんは既に${date}のシフトに入っています（${existingMember.startTime}-${existingMember.endTime}）。`;
  }
  
  shift.members.push({ userId, name: memberName, startTime, endTime });
  return `${date}に${memberName}さんのシフト（${startTime}-${endTime}）を追加しました。現在${shift.members.length}名体制です。`;
}

// ヘルパー関数：メンバー削除
function removeMemberFromShift(
  shiftIndex: number, 
  date: string, 
  userId: string, 
  memberName: string
): string {
  console.log(`[removeMemberFromShift] ${memberName}さんを${date}から削除`);
  
  if (shiftIndex === -1) {
    return `${date}のシフトデータが存在しないため、削除できません。`;
  }
  
  const shift = shiftSampleData[shiftIndex];
  const memberIndex = shift.members.findIndex(m => m.userId === userId);
  
  if (memberIndex === -1) {
    return `${date}のシフトに${memberName}さんは入っていません。`;
  }
  
  const removedMember = shift.members[memberIndex];
  shift.members.splice(memberIndex, 1);
  
  const remainingCount = shift.members.length;
  const remainingText = remainingCount > 0 ? `残り${remainingCount}名体制になります。` : '空きシフトになります。';
  
  return `${date}の${memberName}さんのシフト（${removedMember.startTime}-${removedMember.endTime}）を削除しました。${remainingText}`;
}