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

import { NextRequest, NextResponse } from 'next/server';
import type {
    WebhookRequestBody,
    WebhookEvent,
    FollowEvent,
    MessageEvent,
    TextMessage,
} from '@line/bot-sdk'
import { replyLineMessage } from '@/lib/line/client'
import { LineMessageService } from '@/lib/services/line-message-service';
// import { LineWebhookBody, LineMessageEvent } from '@/lib/line/types';

export async function POST(request: NextRequest) {
  try {
    console.log('LINE Webhook リクエスト受信');

    // 【修正】リクエストボディを安全に取得
    let body: string;
    try {
      body = await request.text();
      console.log('受信したボディサイズ:', body.length);
      console.log('受信したボディの最初の100文字:', body.substring(0, 100));
    } catch (error) {
      console.error('リクエストボディの読み取りエラー:', error);
      return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
    }

    // 【修正】空のボディをチェック
    if (!body || body.trim() === '') {
      console.warn('空のリクエストボディを受信しました');
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    // 【修正】JSONパースを安全に実行
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

    // 【修正】webhookBodyの構造をチェック
    if (!webhookBody || !Array.isArray(webhookBody.events)) {
      console.error('不正なWebhookボディ構造:', webhookBody);
      return NextResponse.json({ error: 'Invalid webhook structure' }, { status: 400 });
    }

    // userid確認用のログ
    for (const event of webhookBody.events) {
      if (event.type === 'message' && event.source.type === 'user') {
        const userId = event.source.userId;
        console.log('User sent a message! User ID:', userId);
      } else if (event.source.type === 'user') {
        const userId = event.source.userId;
        console.log('Other event from user! User ID:', userId, 'Event type:', event.type);
      }
    }
    
    // メッセージ処理サービスに委譲
    try {
      const messageService = new LineMessageService();
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

// export async function POST(request: NextRequest) {
//   try {

//     /**
//      * 【本番用】テスト完了後、以下のコメントアウトを解除すること.
//     // 署名検証（セキュリティ）
//     const signature = request.headers.get('x-line-signature');
//     const body = await request.text(); // 署名検証には RequestBody を text として読み取る必要がある.

//     if (!verifySignature(body, signature)) {
//       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
//     }

//     // Webhookボディをパース
//     const webhookBody: WebhookRequestBody = JSON.parse(body);
//      */

//     // 【開発用】署名検証をスキップし, 直接JSONとして処理する.
//     const webhookBody: WebhookRequestBody = await request.json();

//     // // userid確認用
//     // for (const event of webhookBody.events) {
//     //   // イベントがメッセージタイプであり、かつユーザーからのものであるかを確認
//     //   if (event.type === 'message' && event.source.type === 'user') {
//     //     const userId = event.source.userId;
//     //     console.log('User sent a message! User ID:', userId);
//     //   }
//     //   // 他のイベントタイプ（友だち追加など）のUser IDも取得したい場合は、ここに追加できます
//     //   else if (event.source.type === 'user') {
//     //       const userId = event.source.userId;
//     //       console.log('Other event from user! User ID:', userId, 'Event type:', event.type);
//     //   }
//     // }
    
//     // メッセージ処理サービスに委譲（内部ライブラリ）
//     const messageService = new LineMessageService();
//     await messageService.handleWebhookEvents(webhookBody.events);

//     return NextResponse.json({ success: true });

//   } catch (error) {
//     console.error('LINE Webhook ERROR:', error);
//     // if (error instanceof Error) {
//     //     console.error('Error message:', error.message);
//     // }
//     return NextResponse.json({ error: 'Internal ERROR' }, { status: 500 });
//   }
// }

/**
 * 署名検証（セキュリティ）を行う関数
 * 注: このままでは機能しない. 実際の検証ロジックを実装する必要がある.
 * 開発中は true を返すことで一時的に無効化している.
 */
const verifySignature = (body: string, signature: string | null): boolean => {
    console.log("Signature verification is currently disabled for testing.");
    return true;
};


/**
 * LINEイベントを適切な処理に振り分けるための関数（メッセージは他のシステムに転送するだけ）
 * @param event
 */
async function handleLineEvent(event: WebhookEvent) {
  switch (event.type) {
    // メッセージイベントの場合
    case 'message':
        // テキストメッセージでなければ処理を中断
        if (event.message.type !== 'text') {
            console.log(`Received non-text message: ${event.message.type}`);
            return;
        }

        console.log('receivedMessage:', {
            userId: event.source.userId,
            message: event.message.text,
            timestamp: event.timestamp,
        })

        try {
            console.log('✉️ Replying to user...');
            // 受け取ったメッセージを加工して返信文を作成
            const replyText = 
            `【テスト成功】受け取ったメッセージ："${event.message.text}"`;

            // 返信メッセージを送信する
            await replyLineMessage(event.replyToken, replyText);
            console.log('Reply sent successfully.');

        } catch (replyError) {
            console.error('Failed to send reply:', replyError);
        }


        // メッセージを受信したら、AI処理システムに転送
        await forwardToAISystem(event as MessageEvent);
        break;

    case 'follow':
        // ユーザーがbotを友達追加
        await handleFollowEvent(event);
        break;

    default:
        // その他のイベントは無視
        break;
  }
}

/**
 * フォローイベント（友達追加）を主に処理する関数
 * @param event - FollowEventObject
 */
async function handleFollowEvent(event: FollowEvent) {
  console.log('Follow event received:', {
    userId: event.source.userId,
    replyToken: event.replyToken,
    timestamp: event.timestamp
  });
  // 例: フォローありがとうメッセージを返す（必要ならコメントアウトを解除）
  // await replyLineMessage(event.replyToken, [{ type: 'text', text: '友達追加ありがとうございます！' }]);
  return;
}

// AI処理システムへの転送（現時点ではまだapi/aiがないので実装できないため、ターミナルに出力してテストする）
async function forwardToAISystem(messageEvent: MessageEvent) {
  // 別のAPIエンドポイント（/api/ai など）にPOSTして
  // AI処理に委ねる

    if (messageEvent.message.type !== 'text') {
        return;
    }

    // サーバーサイドで fetch を使う際は, 完全な URL を指定する.
    const targetUrl = 'http://localhost:3000/api/ai/process-message';
    console.log(`Forwarding message to: ${targetUrl}`);
    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: messageEvent.source.userId,
                message: messageEvent.message.text,
                replyToken: messageEvent.replyToken,
                timestamp: messageEvent.timestamp
            })
        });

        if (!response.ok) {
            // fetchは成功したが, レスポンスがエラーだった場合
            console.error(`Failed to forward to AI system. Status: ${response.status}`);
            const errorBody = await response.text();
            console.error(`Error body from AI system: ${errorBody}`);
        }
    } catch (error) {
        // fetch自体が失敗した場合（ネットワークエラーなど）
        console.log('Error forwarding to AI system:', error);
    }
  };