// src/lib/ai/shift-ai-engine.ts
import { GeminiService } from './services/gemini-service';
import { getCurrentDate, getShiftData, getRuleData, editShiftData,shiftCallOut,getLatestShiftCallOutMessage } from './shift-utils';
import { clearUserChatHistory } from '../firebase/firebaseAiEngine'; 
import { getSystemPrompt } from '../firebase/firebaseAiEngine'; 

export class ShiftManagementAI {
  private geminiService: GeminiService | undefined;
  // メッセージカウントは、システムプロンプトの頻度調整用でしたが、
  // 履歴がFirestoreに永続化されるため、このインスタンス単位でのカウントは限定的な意味しか持ちません。
  // 必要であれば、ユーザーごとのメッセージカウントもFirestoreで管理できます。
  private messageCount: number = 0; 


  constructor() {
  }

  // ★初期化メソッドを追加
  async init() {
    const systemPromptContent = await getSystemPrompt('shift_management_ai'); // Firestoreからプロンプトを取得
    if (!systemPromptContent) {
      // プロンプトが取得できなかった場合のフォールバック（例: デフォルトプロンプトを使う、エラーをスローするなど）
      console.error("システムプロンプトのロードに失敗しました。デフォルトプロンプトを使用します。");
      // ここでデフォルトのプロンプトを設定するか、エラーをthrowする
      // 例えば: systemPromptContent = "あなたはシフト管理のAIアシスタントです...";
      throw new Error("システムプロンプトをロードできませんでした。");
    }else{
      console.log('systemPrompt:',systemPromptContent)
    }

    const toolDeclarations = [
      {
        function_declarations: [
          {
            name: "getCurrentDate",
            description: "日本の現在の日付と時刻を取得する。ユーザーから「明日」「今日」などの日時を含む依頼があった時に使用。",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          },
          {
            name: "getShiftData", 
            description: "シフト表のデータを確認する。ユーザーの代替出勤依頼や欠勤依頼を受けた時に、現在のシフト状況を確認するために使用。ユーザーのシフトの開始時間、終了時間を確認するためにも使用",
            parameters: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "確認したい日付（YYYY-MM-DD形式）"
                }
              },
              required: ["date"]
            }
          },
          {
            name: "getRuleData",
            description: "シフトのルールを確認する。ユーザーの代替出勤依頼があった時に、そのユーザーがルール上出勤可能かを判断するために使用。",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          },
          {
            name: "editShiftData",
            description: "シフト表を編集する。ユーザーの出勤依頼を承諾する場合や、欠勤依頼を受理する場合にシフト表を更新するために使用。",
            parameters: {
              type: "object", 
              properties: {
                date: {
                  type: "string",
                  description: "編集対象の日付（YYYY-MM-DD形式）"
                },
                action: {
                  type: "string",
                  enum: ["add", "remove"],
                  description: "ユーザーから欠席依頼が来た場合は削除(remove)する。ユーザーから出勤依頼が来た場合は追加(add)する"
                },
                userId: {
                  type: "string",
                  description: "対象ユーザーのuserId"
                },
                startTime: {
                  type: "string", 
                  description: "追加または削除するシフトの開始時間"
                },
                endTime: {
                  type: "string",
                  description: "追加または削除するシフトの終了時間"
                }
              },
              required: ["date", "action", "userId","startTime","endTime"]
            }
          },
          {
            name: "shiftCallOut",
            description: "Lineグループにメッセージを送信する。主にシフトの募集や緊急連絡に使用。AIは、この関数を呼び出す際に、送信するメッセージの具体的な内容を'getLatestShiftCallOutMessage'で取得した情報と'editShiftData'の編集内容をもとに生成する必要がある。",
            parameters: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "Lineに送信するメッセージの内容。例: 「〇月〇日の〇時から〇時まで、シフトに入れる方を募集しています！ご協力お願いします！」"
                }
              },
              required: ["message"]
            }
          },
          {
            name: "getLatestShiftCallOutMessage",
            description: "過去にLINEグループに送信されたシフト募集や緊急連絡の**最新メッセージの内容を取得**します。この関数は特に、**シフトが更新された後、新たな募集メッセージを作成する際に、これまでの募集内容を参考にする目的**で呼び出されます。",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        ]
      }
    ];

    // 利用可能な関数マップ
    const availableFunctions = {
      getCurrentDate,
      getShiftData,
      getRuleData,
      editShiftData,
      shiftCallOut,
      getLatestShiftCallOutMessage
    };

    // GeminiServiceの初期化時にシステムプロンプトを渡す
    this.geminiService = new GeminiService(
      toolDeclarations,
      availableFunctions,
      systemPromptContent // ★GeminiServiceにシステムプロンプトを渡す
    );
  }

  /**
   * メンバーからのメッセージを処理し、AIの応答を返す。
   * @param memberName - メッセージを送信したメンバーの名前
   * @param memberMessage - メンバーが送信したテキストメッセージ
   * @param userId - メンバーのユーザーID
   * @returns AIからの応答テキスト
   */
  async handleMemberMessage(memberName: string, memberMessage: string, userId: string): Promise<string> {
    this.messageCount++; // インスタンスごとのメッセージカウント (デバッグ用などに残す)
    
    // システムプロンプトの扱いはGeminiServiceとFirestoreに委ねるため、
    // ここでは純粋なユーザーメッセージを生成する。
    const prompt = this.createUserMessage(memberName, memberMessage, userId);

    console.log(`[システム] ${memberName}さん（${userId}）からメッセージ ${this.messageCount}回目`);
    // ★ ここで geminiService が初期化されていることを確認する
    if (!this.geminiService) {
      console.error("AIエンジンが初期化されていません。handleMemberMessage を呼び出す前に init() を呼び出してください。");
      return 'システムがまだ準備できていません。しばらくしてから再度お試しください。';
    }
    try {
      // GeminiServiceにuserIdとユーザーメッセージを渡す
      const response = await this.geminiService.sendMessage(userId, prompt);
      return response;
    } catch (error) {
      console.error('AI処理中にエラーが発生:', error);
      return 'システムエラーが発生しました。しばらく後でもう一度お試しください。';
    }
  }

  /**
   * ユーザーに返すメッセージの内容を整形する。
   * この情報はAIへの入力として使われ、AIがユーザーのコンテキストを理解するのに役立つ。
   * @param memberName - ユーザー名
   * @param memberMessage - ユーザーのメッセージ内容
   * @param userId - ユーザーID
   * @returns AIに渡すメッセージ文字列
   */
  private createUserMessage(memberName: string, memberMessage: string, userId: string): string {
    // 履歴としてFirestoreに保存されるため、毎回システムプロンプトを再送信する代わりに、
    // ユーザー名やIDなどのコンテキスト情報をメッセージ自体に含めるのが有効。
    // または、Geminiの systemInstruction 機能が利用可能であればそちらを使う。
    // 今回はAIがユーザー名で呼びかけるのを促すため、プロンプトに含める。
    return `ユーザー名: ${memberName}\nuserId: ${userId}\nメッセージ内容: ${memberMessage}`;
  }

  /**
   * 指定したユーザーのチャット履歴をクリアする。
   * @param userId - 履歴をクリアするユーザーのID
   */
  async clearChatHistory(userId: string) {
    await clearUserChatHistory(userId); // Firestoreの履歴クリア関数を呼び出す
    this.messageCount = 0; // インスタンスごとのメッセージカウントもリセット
    console.log(`ユーザー ${userId} のチャット履歴とメッセージカウントをクリアしました。`);
  }

  // getChatHistoryForDebug や setSystemPromptInterval は、
  // 履歴がFirestoreで管理されるため、このクラスでは不要になるか、異なる目的を持つ。
  // 現在のメッセージ数を取得 (このインスタンスが処理したメッセージ数)
  getMessageCount(): number {
    return this.messageCount;
  }
}