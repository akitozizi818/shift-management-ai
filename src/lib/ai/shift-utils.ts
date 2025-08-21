// src/lib/ai/shift-utils.ts
import { fetchUserById ,UserDoc} from '../firebase/firebaseUsers';
import { fetchPublished, updateSchedule } from '../firebase/firebaseSchedule';
import { fetchLatestRule } from '../firebase/firebaseRules';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore'; // query, orderBy, limit, getDocs を追加
import { sendLineMessage } from '../line/client'; // sendLineMessage をインポート

//userIdからメンバーオブジェクトの取得
export async function getMemberInfo(userId: string): Promise<{ id: string; data: UserDoc } | null> {
  const member = await fetchUserById(userId);
  return member; // fetchUserById は既に適切な型を返しているので、そのまま返します。
}

// 必要に応じて、名前だけが必要な場合は以下のようにラップすることもできます。
export async function getMemberName(userId: string): Promise<string> {
  const memberInfo = await getMemberInfo(userId);
  return memberInfo ? memberInfo.data.name : '不明なメンバー';
}

// 必要に応じて、役割だけが必要な場合は以下のようにラップすることもできます。
export async function getMemberRole(userId: string): Promise<string> {
  const memberInfo = await getMemberInfo(userId);
  return memberInfo ? memberInfo.data.role : '不明な役割';
}

// 現在の日本時間を取得（Function calling用）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCurrentDate(args: any = {}): string {
  if (process.env.NODE_ENV === 'development') {
    console.log('[getCurrentDate] 受信引数:', args);
  }
  
  const now = new Date();
  const japanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  
  const dateStr = formatDate(japanTime);
  const timeStr = formatTime(japanTime);
  
  const result = `現在の日本時間: ${dateStr} ${timeStr}`;
  if (process.env.NODE_ENV === 'development') {
    console.log('[getCurrentDate] 結果:', result);
  }
  
  return result;
}

// シフトデータを取得（Function calling用）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getShiftData(args: any): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[getShiftData] 受信引数:', args);
  }
  
  // パラメータの存在チェック
  if (!args || typeof args !== 'object') {
    return 'エラー: 不正なパラメータ形式です。';
  }
  
  const date = args.date;
  if (process.env.NODE_ENV === 'development') {
    console.log('[getShiftData] 対象日付:', date);
  }
  
  // 必須パラメータのチェック
  if (!date) {
    return 'エラー: 日付パラメータが不足しています。';
  }

  const schedule = await fetchPublished();
  if (!schedule) {
    return 'エラー: 公開されたスケジュールが存在しません。';
  }
  
  const shift = schedule.shifts?.[date];
  
  if (!shift) {
    return `${date}現在誰もシフトに入っていません（人員不足状態）。`;
  }
  
  if (shift.memberAssignments.length === 0) {
    return `${date}は現在誰もシフトに入っていません（人員不足状態）。`;
  }
  
  const memberNames = await Promise.all(shift.memberAssignments.map(async m => {
    const name = await getMemberName(m.userId); // ここで await を追加
    return `${name}さん: ${m.startTime}-${m.endTime}`;
  }));

  const memberList = memberNames.join(', ');
  
  const result = `${date}のシフト状況: ${memberList} (合計${shift.memberAssignments.length}名)`;
  if (process.env.NODE_ENV === 'development') {
    console.log('[getShiftData] 結果:', result);
  }
  
  return result;
}

// ルールデータを取得（Function calling用）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRuleData(args: any = {}): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[getRuleData] 受信引数:', args);
  }
  
  const rules = await fetchLatestRule();

  if (!rules) {
    return 'エラー: シフト管理ルールが見つかりません。';
  }

  // ルールのフォーマット
  let rulesText = '';
  for (const [key, value] of Object.entries(rules)) {
    rulesText += `- ${key}: ${value}\n`;
  }
  
  const result = `シフト管理ルール:\n${rulesText}`;
  if (process.env.NODE_ENV === 'development') {
    console.log('[getRuleData] 結果取得完了');
  }
  
  return result;
}

// シフトデータを編集（Function calling用）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function editShiftData(args: any): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[editShiftData] 受信引数:', args);
  }
  
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
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[editShiftData] 分解後パラメータ:', {
      date,
      action,
      userId,
      startTime,
      endTime
    });
  }
  
  // 必須パラメータのチェック
  if (!date || !action || !userId) {
    return `エラー: 必須パラメータが不足しています。date: ${date}, action: ${action}, userId: ${userId}`;
  }
  
  // actionの値チェック
  if (action !== 'add' && action !== 'remove') {
    return `エラー: 無効なアクションです: ${action}`;
  }

  const memberName = await getMemberName(userId);
  const schedule = await fetchPublished();
  if (!schedule) {
    return 'エラー: 公開されたスケジュールが存在しません。';
  }
  const shifts = { ...schedule.shifts };
  if (!shifts[date]) {
    shifts[date] = { memberAssignments: [] };
  }
  const existingIndex = shifts[date].memberAssignments.findIndex(m => m.userId === userId);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[editShiftData] 処理開始: ${memberName}さんの${action}処理 対象日: ${date}`);
  }
  
  let result: string;
  
  if (action === 'add') {
    if (existingIndex !== -1) {
      // 既に同じメンバーがいる場合はエラー
      const existingMember = shifts[date].memberAssignments[existingIndex];
      return `${memberName}さんは既に${date}のシフトに入っています（${existingMember.startTime}-${existingMember.endTime}）。`;
    }
    
    // 新規追加処理
    if (!startTime || !endTime) {
      return 'シフト追加には開始時間と終了時間が必要です。';
    }
    
    shifts[date].memberAssignments.push({ userId, startTime, endTime});
    const newShiftCount = shifts[date].memberAssignments.length;
    result = `${date}に${memberName}さんのシフト（${startTime}-${endTime}）を追加しました。現在${newShiftCount}名体制です。`;
  } else if (action === 'remove') {
    if (existingIndex === -1) {
      // 既に同じメンバーがいない場合はエラー
      return `${memberName}さんは${date}のシフトに入っていません。`;
    }
    
    // 削除処理
    const removedMember = shifts[date].memberAssignments[existingIndex];
    shifts[date].memberAssignments.splice(existingIndex, 1);
    
    const remainingCount = shifts[date].memberAssignments.length;
    const remainingText = remainingCount > 0 ? `残り${remainingCount}名体制になります。` : '空きシフトになります。';
    
    result = `${date}の${memberName}さんのシフト（${removedMember.startTime}-${removedMember.endTime}）を削除しました。${remainingText}`;
    
    // シフトが空になった場合は日付ごと削除
    if (remainingCount === 0) {
      delete shifts[date];
    }
  } else {
    result = `無効な操作です: ${action}`;
  }
  await updateSchedule(schedule.scheduleId, shifts);

  if (process.env.NODE_ENV === 'development') {
    console.log('[editShiftData] 処理結果:', result);
  }
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


// Lineメッセージを送信する関数（Line Messaging APIの呼び出し）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function shiftCallOut(args: any): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[shiftCallOut] 受信引数:', args);
  }
  
  // パラメータの存在チェック
  if (!args || typeof args !== 'object') {
    return "不正なパラメータです";
  }
  const message = args.message;

  const groupId = "Cbf06af635b95d3f78b0afdd1036d7f9d";
  // **ここにLine Messaging APIを呼び出す実際のロジックを実装します。**
  // 例: Line APIサービスをインポートして呼び出す
  // import { LineMessagingService } from './services/line-messaging-service';
  // const lineService = new LineMessagingService();
  // try {
  //   await lineService.pushMessage(message); // またはbroadcastMessageなど
  //   return true;
  // } catch (error) {
  //   console.error("Lineメッセージ送信失敗:", error);
  //   return false;
  // }

  // 仮の処理として、Firestoreにログを記録する例
  const db = getFirestore();
  try {
    // sendLineMessage 関数を呼び出してLINEグループにメッセージをプッシュ送信
    await sendLineMessage(groupId, message); 

    await addDoc(collection(db, "line_call_out_message_logs"), {
      message: message,
      timestamp: serverTimestamp(),
      status: "sent_mock" // 実際の送信結果に応じて変更
    });
    return "送信に成功しました";
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Lineメッセージ送信失敗:", error);
    }
    // 失敗した場合もFirestoreにログを記録
    const db = getFirestore();
    try {
      await addDoc(collection(db, "line_call_out_message_logs"), {
        message: message,
        timestamp: serverTimestamp(),
        status: "sent_failed",
        errorMessage: (error instanceof Error) ? error.message : "Unknown error"
      });
    } catch (logError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Lineメッセージログ記録失敗 (エラー発生時):", logError);
      }
    }
    return "LINEメッセージの送信に失敗しました。";
  }
}

/**
 * Firestoreに保存された最も直近のLineメッセージログを取得する。
 * @returns 最も新しいメッセージの文字列、または見つからない場合はnull
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLatestShiftCallOutMessage(args: any = {}): Promise<string | null> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[getLatestShiftCallOutMessage] 受信引数:', args);
  }
  
  // パラメータの存在チェック
  if (!args || typeof args !== 'object') {
    return 'エラー: 不正なパラメータ形式です。';
  }
  const db = getFirestore();
  try {
    const q = query(
      collection(db, "line_call_out_message_logs"),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const latestMessageDoc = querySnapshot.docs[0];
      return latestMessageDoc.data().message as string;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log("Lineメッセージログが見つかりませんでした。");
      }
      return "Lineメッセージログが見つかりませんでした。";
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("最新のLineメッセージログ取得失敗:", error);
    }
    return "最新のLineメッセージログ取得失敗";
  }
}