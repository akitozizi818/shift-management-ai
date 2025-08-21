// test/shift-chat-ai.test.ts
import { ShiftManagementAI } from '../src/lib/ai/shift-ai-engine';

// 使用例
async function example() {
  const shiftAI = new ShiftManagementAI();

  console.log('=== シフト管理AI テスト開始 ===\n');

  // 1. 代替出勤の申し出（情報収集重視）
  console.log('1. 代替出勤の申し出');
  console.log('入力: 田中さん（U001）「明日のシフト、人手が足りないところがあれば代わりに出勤できます。」');
  const response1 = await shiftAI.handleMemberMessage(
    '田中',
    '明日のシフト、人手が足りないところがあれば代わりに出勤できます。',
    'U001'
  );
  console.log('AI応答:', response1);
  console.log('\n' + '='.repeat(50) + '\n');

  // 2. 欠勤の申請（既存シフトの削除）
  console.log('2. 欠勤の申請');
  console.log('入力: 田中さん（U001）「6月24日のシフトですが、急用ができてしまい欠勤させていただきたいです。」');
  const response2 = await shiftAI.handleMemberMessage(
    '田中',
    '6月24日のシフトですが、急用ができてしまい欠勤させていただきたいです。',
    'U001'
  );
  console.log('AI応答:', response2);
  console.log('\n' + '='.repeat(50) + '\n');

  // 3. 具体的な代替出勤提案
  console.log('3. 具体的な代替出勤提案');
  console.log('入力: 佐藤さん（U002）「6月26日の9時から17時で代替出勤可能です。」');
  const response3 = await shiftAI.handleMemberMessage(
    '佐藤',
    '6月26日の9時から17時で代替出勤可能です。',
    'U002',
  );
  console.log('AI応答:', response3);
  console.log('\n' + '='.repeat(50) + '\n');

  // 4. 勤務時間の変更依頼
  console.log('4. 勤務時間の変更依頼');
  console.log('入力: 鈴木さん（U003）「今日のシフトの終了時間を2時間早めることは可能でしょうか？」');
  const response4 = await shiftAI.handleMemberMessage(
    '鈴木',
    '今日のシフトの終了時間を2時間早めることは可能でしょうか？',
    'U003'
  );
  console.log('AI応答:', response4);
  console.log('\n' + '='.repeat(50) + '\n');

  // 5. 情報が不足している依頼
  console.log('5. 情報が不足している依頼');
  console.log('入力: 山田さん（U004）「来週どこか代替出勤できます。」');
  const response5 = await shiftAI.handleMemberMessage(
    '山田',
    '来週どこか代替出勤できます。',
    'U004'
  );
  console.log('AI応答:', response5);
  
  console.log('\n=== テスト完了 ===');
}

// チャット履歴確認用の関数
async function checkChatHistory() {
  const shiftAI = new ShiftManagementAI();
  
  // 簡単なメッセージを送信
  await shiftAI.handleMemberMessage('田中', 'こんにちは', 'U001');
  
  // 履歴をクリア（userIdが必要）
  await shiftAI.clearChatHistory('U001');
  console.log('履歴クリア完了');
}

// 連続的な会話のテスト（システムプロンプト間隔テスト）
async function testSystemPromptInterval() {
  const shiftAI = new ShiftManagementAI();
  
  console.log('=== システムプロンプト間隔テスト ===\n');
  
  const conversations = [
    { member: '田中', userId: 'U001', message: '明日代替出勤できます。' },
    { member: '田中', userId: 'U001', message: 'ありがとうございます' },
    { member: '佐藤', userId: 'U002', message: '6月26日はどうですか？' },
    { member: '佐藤', userId: 'U002', message: '了解しました' },
    { member: '鈴木', userId: 'U003', message: '他に何かありますか？' },
    { member: '鈴木', userId: 'U003', message: '6月27日の欠勤をお願いします' }
  ];
  
  for (let i = 0; i < conversations.length; i++) {
    const { member, userId, message } = conversations[i];
    console.log(`--- メッセージ ${i + 1}回目 ---`);
    console.log(`入力: ${member}さん（${userId}）「${message}」`);
    
    const response = await shiftAI.handleMemberMessage(member, message, userId);
    console.log(`応答: ${response}`);
    console.log(`現在のメッセージ数: ${shiftAI.getMessageCount()}\n`);
    
    // 少し待機（実際の会話ペースを模擬）
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('=== 間隔テスト完了 ===\n');
}

// 設定変更のテスト
async function testCustomInterval() {
  const shiftAI = new ShiftManagementAI();
  
  console.log('=== カスタム間隔テスト（2回に1回） ===\n');
  
  // 間隔を2回に変更
  // shiftAI.setSystemPromptInterval(2);
  
  const conversations = [
    { member: '田中', userId: 'U001', message: '代替出勤希望です' },
    { member: '田中', userId: 'U001', message: 'ありがとう' },
    { member: '佐藤', userId: 'U002', message: '詳細を教えて' },
    { member: '佐藤', userId: 'U002', message: '了解です' }
  ];
  
  for (let i = 0; i < conversations.length; i++) {
    const { member, userId, message } = conversations[i];
    console.log(`--- メッセージ ${i + 1}回目 ---`);
    console.log(`${member}さん（${userId}）: ${message}`);
    await shiftAI.handleMemberMessage(member, message, userId);
    console.log(`メッセージ数: ${shiftAI.getMessageCount()}\n`);
  }
  
  console.log('=== カスタム間隔テスト完了 ===\n');
}

// 無効なLINE IDのテスト
async function testInvaliduserId() {
  const shiftAI = new ShiftManagementAI();
  
  console.log('=== 無効なLINE IDテスト ===\n');
  
  // 存在しないLINE IDでテスト
  const response = await shiftAI.handleMemberMessage(
    '不明なユーザー',
    '代替出勤希望です',
    'INVALID_ID'
  );
  
  console.log('無効ID応答:', response);
  console.log('\n=== 無効IDテスト完了 ===\n');
}

// 実行
if (require.main === module) {
  // 通常のテスト
  example().catch(console.error).then(() => {
    // システムプロンプト間隔テスト
    return testSystemPromptInterval();
  }).then(() => {
    // カスタム間隔テスト
    return testCustomInterval();
  }).then(() => {
    // 無効なLINE IDテスト
    return testInvaliduserId();
  }).catch(console.error);
  
  // 履歴確認も実行したい場合はコメントアウトを外す
  // checkChatHistory().catch(console.error);
}