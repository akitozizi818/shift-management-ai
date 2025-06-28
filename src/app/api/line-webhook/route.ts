// src/app/api/line-webhook
// 役割: LINEからのWebhookを受信し、基本的な処理を行う
// Webhook URLの末尾に"/api/line-webhook"をつけること。

/**
 * 【具体的な機能】
 * ・LINEからのPOSTリクエスト受信
 * ・署名検証（セキュリティ）
 * ・イベント種別の判定
 * ・メッセージ内容の解析は行わない（AI処理に委ねる）
 * ・基本的なイベント処理（フォロー/アンフォロー等）
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type {
    WebhookRequestBody,
    WebhookEvent,
    FollowEvent,
    MessageEvent,
    TextMessage,
} from '@line/bot-sdk'
import { replyLineMessage } from '@/lib/line/client';
import { LineMessageService } from '@/lib/services/line-message-service';
import { ShiftManagementAI } from '@/lib/ai/shift-ai-engine'; // ShiftManagementAIをインポート


// 初期化済みのAIクライアントインスタンスを保持する変数
let initializedAiClient: ShiftManagementAI | null = null;
// 初期化が進行中であることを示すプロミスを保持する変数
let initializationPromise: Promise<void> | null = null;

async function getInitializedAiClient(): Promise<ShiftManagementAI> {
  // 既に初期化済みのインスタンスがあればそれを返す（ウォームスタート）
  if (initializedAiClient) {
    console.log("AIクライアントは既に初期化済みです。(ウォームスタート)");
    return initializedAiClient;
  }

  // 初期化がまだ開始されていない場合のみ、初期化処理を実行するプロミスを作成
  if (!initializationPromise) {
    console.log("AIクライアントの初期化を開始します。(コールドスタート)");
    initializationPromise = (async () => {
      const ai = new ShiftManagementAI();
      await ai.init(); // ここでFirestoreからシステムプロンプトをロード
      initializedAiClient = ai; // 初期化完了後にインスタンスをセット
      console.log("ShiftManagementAI instance initialized (cold start completed).");
    })();
  }

  // 初期化プロミスが完了するのを待つ
  await initializationPromise;

  // 初期化が成功していれば必ず非null
  return initializedAiClient!; 
}
/**
 * LINE からの webhook リクエストを処理するメイン関数
 */
export async function POST(request: NextRequest) {
  try {
    console.log('LINE Webhook リクエスト受信');
    let body: string;
    try {
      body = await request.text();
      console.log('受信したボディサイズ:', body.length);
      console.log('受信したボディの最初の100文字:', body.substring(0, 100));
    } catch (error) {
      console.error('リクエストボディの読み取りエラー:', error);
      return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
    }

    // 署名検証 ===========================================================================
    const signature = request.headers.get('x-line-signature');
    console.log('X-Line-Signature:', signature)

    if (!verifySignature(body, signature)) {
      // 署名が不正な場合は, 401 Unauthorize エラーを返す.
      console.warn('不正な署名を持つリクエストを拒否しました.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    // ===================================================================================

    // 空のボディをチェック
    if (!body || body.trim() === '') {
      console.warn('空のリクエストボディを受信しました');
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    // JSONパースを安全に実行
    let webhookBody: WebhookRequestBody;
    try {
      webhookBody = JSON.parse(body);
      console.log('JSONパース成功:', {
        eventsCount: webhookBody.events?.length || 0,
        destination: webhookBody.destination
      });
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      console.error('パースしようとしたボディ:', body);
      return NextResponse.json({ 
        error: 'Invalid JSON format',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 400 });
    }

    // webhookBodyの構造をチェック
    if (!webhookBody || !Array.isArray(webhookBody.events)) {
      console.error('不正なWebhookボディ構造:', webhookBody);
      return NextResponse.json({ error: 'Invalid webhook structure' }, { status: 400 });
    }

    // useridとgroupid確認用のログ
    for (const event of webhookBody.events) {
      if (event.source.type === 'user') {
        const userId = event.source.userId;
        console.log('User sent a message! User ID:', userId, 'Event type:', event.type);
      } else if (event.source.type === 'group') {
        // グループIDをログに出力
        const groupId = event.source.groupId;
        console.log('Event from group! Group ID:', groupId, 'Event type:', event.type);
      }
    }

    // 最初にAIクライアントが初期化されるのを待つ
    const aiClient = await getInitializedAiClient();
    
    // メッセージ処理サービスに委譲
    try {
      const messageService = new LineMessageService(aiClient);
      await messageService.handleWebhookEvents(webhookBody.events);
    } catch (serviceError) {
      console.error('メッセージサービスエラー:', serviceError);
      // サービスエラーが発生してもWebhookは成功として返す
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('LINE Webhook ERROR:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 署名検証を行う関数
 * @param body - リクエストボディ（文字列）
 * @param signature - LINEから送られてきた署名
 * @returns 検証が成功した場合は true, 失敗した場合は false
 */
const verifySignature = (body: string, signature: string | null): boolean => {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelSecret || !signature) {
    console.error('Channel Secretまたは署名が見つかりません。');
    return false;
  }

  const generatedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return signature === generatedSignature;
};
