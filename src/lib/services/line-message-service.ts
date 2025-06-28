// src/services/LineMessageService.ts
import type { WebhookEvent, MessageEvent } from '@line/bot-sdk';
import { fetchUserByLineUserId } from '@/lib/firebase/firebaseUsers';
import { ShiftManagementAI } from '@/lib/ai/shift-ai-engine';
import { replyLineMessage } from '@/lib/line/client';

export class LineMessageService {
  private aiClient: ShiftManagementAI;
  
  constructor(aiClient: ShiftManagementAI) {
    // this.aiClient = new ShiftManagementAI();
    this.aiClient = aiClient;
  }
  
  /**
   * Webhookイベントを処理
   */
  async handleWebhookEvents(events: WebhookEvent[]): Promise<void> {
    for (const event of events) {
      await this.handleSingleEvent(event);
    }
  }
  
  /**
   * 単一イベントを処理
   */
  private async handleSingleEvent(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case 'message':
        await this.handleMessageEvent(event);
        break;
      case 'follow':
        await this.handleFollowEvent(event);
        break;
      // 'unfollow' イベントなども必要に応じて追加
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
  
  /**
   * メッセージイベントを処理
   * LINE Platform → [ユーザー情報取得] → [AI処理] → LINE Platform
   */
  private async handleMessageEvent(event: MessageEvent): Promise<void> {
    // テキストメッセージのみ処理
    if (event.message.type !== 'text') {
      console.log(`Non-text message ignored: ${event.message.type}`);
      return;
    }
    const userId = event.source?.userId ?? 'unknown_user';
    // LINEの replyToken は一度しか使えないため、最初に取得
    const replyToken = event.replyToken;

    try {
      console.log('📨 Message received:', {
        userId: event.source.userId,
        message: event.message.text,
        timestamp: event.timestamp
      });
      
      // 1. ユーザー情報取得
      const user = await fetchUserByLineUserId(userId);
      
      if (!user) {
        await replyLineMessage(replyToken, 'ユーザー情報が見つかりません。管理者にお問い合わせください。');
        return;
      }
      
      console.log('👤 User found:', {
        id: user.id,
        name: user.data.name,
        role: user.data.role
      });
      
      // 2. AI処理
      // AI処理中にエラーが発生しても、try-catchブロックで捕捉し、ユーザーにエラーを通知できるようにする
      const aiResponse = await this.aiClient.handleMemberMessage(user.data.name, event.message.text, user.id);
      
      console.log('🤖 AI response generated:', aiResponse);
      
      // 3. LINE返信
      await replyLineMessage(replyToken, aiResponse);
      
      console.log('✅ Reply sent successfully');
      
    } catch (error) {
      console.error('❌ Message processing error:', error);
      
      // エラー時のユーザー向け返信
      try {
        // 同じ replyToken で複数回返信しようとするとエラーになる可能性があるため、
        // 最初の返信が失敗した場合のみ、エラーメッセージを返信する。
        // もしすでに replyLineMessage が呼ばれていれば、この呼び出しは失敗する。
        await replyLineMessage(replyToken, 'システムエラーが発生しました。しばらく待ってから再度お試しください。');
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  }
  
  /**
   * フォローイベントを処理
   */
  private async handleFollowEvent(event: any): Promise<void> {
    console.log('👋 Follow event received:', {
      userId: event.source.userId,
      timestamp: event.timestamp
    });
    
    // フォロー時の挨拶メッセージ
    try {
      await replyLineMessage(event.replyToken, 'シフト管理ボットにようこそ！シフトに関するご質問をお気軽にどうぞ。\n\n例: 「今日のシフトを教えて」「明日の10時から18時までシフト追加したい」');
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    }
  }
}