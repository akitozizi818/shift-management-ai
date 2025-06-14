import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Webhook受信:', new Date().toISOString());
    
    // リクエストボディを取得
    const body = await request.text();
    console.log('📋 Body:', body);
    
    // LINE署名検証
    const signature = request.headers.get('x-line-signature');
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    
    if (!channelSecret) {
      console.error('❌ LINE_CHANNEL_SECRET が設定されていません');
      return NextResponse.json({ error: 'Channel secret not configured' }, { status: 500 });
    }
    
    if (!signature) {
      console.error('❌ x-line-signature ヘッダーがありません');
      return NextResponse.json({ error: 'No signature' }, { status: 401 });
    }
    
    // 署名を生成
    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body)
      .digest('base64');
    
    // 署名検証
    if (signature !== hash) {
      console.error('❌ 署名検証失敗');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    console.log('✅ 署名検証成功');
    
    // Webhookイベント処理
    const events = JSON.parse(body).events;
    
    for (const event of events) {
      console.log('📨 イベントタイプ:', event.type);
      
      if (event.type === 'message' && event.message.type === 'text') {
        console.log('💬 受信メッセージ:', event.message.text);
        console.log('👤 ユーザーID:', event.source.userId);
        
        // TODO: AI処理とレスポンス生成を実装
      }
    }

    console.log('✅ Webhook処理完了');
    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('❌ Webhook エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET リクエスト用（接続確認用）
export async function GET() {
  console.log('🔍 GET request to webhook endpoint');
  return NextResponse.json({ 
    message: 'LINE Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}