// src/lib/line/client.ts
// 役割：LINE にメッセージを送信する機能

/**
 * 【具体的な機能】
 *・ LINE Messaging API への HTTP リクエスト送信
 *・ エラーハンドリング
 *・ アクセストークン管理
 *・ 基本的な送信機能（テキストのみ）
 */

// LINE Messaging API の基本クライアント
class LineClient {
    private accessToken: string;
    private baseURL = 'https://api.line.me/v2/bot';

    constructor(accessToken: string) {
        if (!accessToken) {
            throw new Error('LINE Channel Access Token is not defined. Please set it in your environment variables.');
        }
        this.accessToken = accessToken;
    }

    /**
     * リプライメッセージを送信します
     * @param replyToken - 返信用のトークン
     * @param text - 送信するテキスト
     */
    async replyMessage(replyToken: string, text: string): Promise<void> {
        const url = `${this.baseURL}/message/reply`;
        const body = {
            replyToken: replyToken,
            messages: [
                {
                    type: 'text',
                    text: text,
                },
            ],
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to reply message: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }
    }

    /**
     * プッシュメッセージを送信（個人・グループ・ルーム宛）
     * @param to - 送信先のID (userId, groupId, or roomId)
     * @param text - 送信するテキスト
     */
    async pushMessage(to: string, text: string): Promise<void> {
        const url = `${this.baseURL}/message/push`;
        const body = {
            to: to,
            messages: [
                {
                    type: 'text',
                    text: text,
                },
            ],
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to push message: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }
    }
}


// 以下, 実際にエクスポートされる部分 ==============================================

// 環境変数からアクセストークンを取得して、LINEクライアントのインスタンスを生成
// このインスタンスをファイル内で共有して使用.
const lineClient = new LineClient(process.env.LINE_CHANNEL_ACCESS_TOKEN || '');

/**
 * メッセージをリプライする便利関数
 * @param replyToken 
 * @param message 
 */
export const replyLineMessage = (replyToken: string, message: string) => {
    return lineClient.replyMessage(replyToken, message);
};

/**
 * メッセージをプッシュ送信する便利関数
 * @param userId 
 * @param message 
 */
export const sendLineMessage = (userId: string, message: string) => {
    return lineClient.pushMessage(userId, message);
};