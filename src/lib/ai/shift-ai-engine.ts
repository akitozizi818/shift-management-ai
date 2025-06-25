// src/lib/ai/shift-ai-engine.ts
import { GeminiService } from './services/gemini-service';
import { getCurrentDate, getShiftData, getRuleData, editShiftData, getMemberName } from './shift-utils';

export class ShiftManagementAI {
  private geminiService: GeminiService;
  private messageCount: number = 0;
  private readonly SYSTEM_PROMPT_INTERVAL: number = 3; // 3回に1回システムプロンプトを再送信

  constructor() {
    // ツール定義
    const toolDeclarations = [
      {
        function_declarations: [
          {
            name: "getCurrentDate",
            description: "日本の現在の日付と時刻を取得する。メンバーから「明日」「今日」などの日時を含む依頼があった時に使用。",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          },
          {
            name: "getShiftData", 
            description: "シフト表のデータを確認する。メンバーの代替出勤依頼や欠勤依頼を受けた時に、現在のシフト状況を確認するために使用。メンバーのシフトの開始時間、終了時間を確認するためにも使用",
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
            description: "シフトのルールを確認する。メンバーの代替出勤依頼があった時に、そのメンバーがルール上出勤可能かを判断するために使用。",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          },
          {
            name: "editShiftData",
            description: "シフト表を編集する。メンバーの出勤依頼を承諾する場合や、欠勤依頼を受理する場合にシフト表を更新するために使用。",
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
                  description: "メンバーから欠席依頼が来た場合は削除(remove)する。メンバーから出勤依頼が来た場合は追加(add)する"
                },
                lineId: {
                  type: "string",
                  description: "対象メンバーのLINE ID"
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
              required: ["date", "action", "lineId","startTime","endTime"]
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
      editShiftData
    };

    this.geminiService = new GeminiService(toolDeclarations, availableFunctions);
  }

  async handleMemberMessage(memberName: string, memberMessage: string, lineId: string): Promise<string> {
    this.messageCount++;
    
    // 初回または定期的にシステムプロンプトを付加
    const shouldIncludeSystemPrompt = this.messageCount === 1 || 
                                     this.messageCount % this.SYSTEM_PROMPT_INTERVAL === 0;
    
    const prompt = shouldIncludeSystemPrompt 
      ? this.createSystemPrompt(memberName, memberMessage, lineId)
      : this.createUserMessage(memberName, memberMessage, lineId);

    console.log(`[システム] ${memberName}さん（${lineId}）からメッセージ ${this.messageCount}回目 - システムプロンプト${shouldIncludeSystemPrompt ? '送信' : 'スキップ'}`);

    try {
      const response = await this.geminiService.sendMessage(prompt);
      return response;
    } catch (error) {
      console.error('AI処理中にエラーが発生:', error);
      return 'システムエラーが発生しました。しばらく後でもう一度お試しください。';
    }
  }

  private createSystemPrompt(memberName: string, memberMessage: string, lineId: string): string {
    return `あなたはシフト管理者です。メンバーの要望を理解するように丁寧に会話してください。

【重要な処理手順】
1. まず必要な情報をFunction callingで収集する
   - 日付の情報：必ずgetCurrentDateで現在が何年、何月、何日かを確認し、現在の年月日をもとにユーザーが言及する日付を推測する
   - シフト関連の依頼：メンバーから依頼がくるたびにgetShiftDataで該当日（getCurrentDateから推測）のシフト状況を確認、また、シフトデータが空の場合は、誰もシフトに入っていないと解釈する。
   - 代替出勤依頼：メンバーから依頼がくるたびにgetRuleDataでルールを確認
2. 情報を収集しても足りない情報がある場合は、ユーザーに問いかける応答をする。ユーザーの応答次第では再度必要な情報をFunction callingで収集する。
3. 出勤、欠勤依頼の場合は、整理した情報でユーザーに最終確認をとるための応答をする。
4. ユーザーから出勤、欠勤依頼の最終確認がとれたらeditShiftDataでシフト表を更新（LINE IDを使用）する。

【判断基準】
- 代替出勤依頼：既に十分な人員がいる場合は丁寧に断る
- ルール違反：ルール上問題がある場合は理由を説明して断る
- 欠勤依頼：基本的に受理し、シフト表から削除する

【応答に含める内容】
- 確認した情報（日付、現在のシフト状況、適用ルールなど）
- 判断理由
- 実行した操作（シフト追加/削除など）
- 感謝や労いの言葉

【重要な注意事項】
-一度の応答で同じ関数をfunction callingしない
- editShiftDataではlineId（${lineId}）を使用してください
- 応答メッセージでは必ずメンバー名（${memberName}さん）で呼びかけてください

メンバー名: ${memberName}
LINE ID: ${lineId}
メッセージ内容: ${memberMessage}`;
  }

  private createUserMessage(memberName: string, memberMessage: string, lineId: string): string {
    return `メンバー名: ${memberName}\nLINE ID: ${lineId}\nメッセージ内容: ${memberMessage}`;
  }

  async clearChatHistory() {
    await this.geminiService.clearHistory();
    this.messageCount = 0; // メッセージカウントもリセット
    console.log('チャット履歴とメッセージカウントをクリアしました。');
  }

  async getChatHistory() {
    return await this.geminiService.getChatHistoryForDebug();
  }

  // システムプロンプト送信間隔を設定
  setSystemPromptInterval(interval: number) {
    if (interval > 0) {
      // @ts-ignore - readonly プロパティを設定するため
      this.SYSTEM_PROMPT_INTERVAL = interval;
      console.log(`システムプロンプト送信間隔を${interval}回に設定しました。`);
    }
  }

  // 現在のメッセージ数を取得
  getMessageCount(): number {
    return this.messageCount;
  }
}