// src/lib/ai/services/gemini-service.ts
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

export class GeminiService {
  private vertexAI: VertexAI;
  private model: any;
  private chat: any;
  private tools: { [key: string]: Function }; // 実行可能なツール関数
  private maxFunctionCalls: number = 10; // 最大連続実行回数（無限ループ防止）

  constructor(toolDeclarations: any[], availableFunctions: { [key: string]: Function }) {
    this.vertexAI = new VertexAI({
      project: process.env.VERTEX_AI_PROJECT_ID!,
      location: process.env.VERTEX_AI_LOCATION!
    });

    this.model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
      generationConfig: {
        temperature: 0.2, // 応答のランダム性を制御 (0.0 - 1.0)
      },
    });

    this.tools = availableFunctions;

    this.chat = this.model.startChat({
      tools: toolDeclarations,
      history: [],
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
  }

  async sendMessage(userMessage: string): Promise<string> {
    try {
      let result = await this.chat.sendMessage(userMessage);
      let functionCallCount = 0;

      // 連続してfunction callingが必要な場合のループ処理
      while (this.hasFunctionCall(result.response) && functionCallCount < this.maxFunctionCalls) {
        functionCallCount++;
        console.log(`[システム] Function call ${functionCallCount}回目を実行中...`);

        const functionResponses = await this.executeFunctionCalls(result.response);
        
        // ツールの実行結果をGeminiに送信
        result = await this.chat.sendMessage(functionResponses);
      }

      // 最終的なテキスト応答を取得
      return this.extractTextResponse(result.response);

    } catch (error) {
      console.error('Gemini API エラー:', error);
      throw new Error('AIとの対話中にエラーが発生しました');
    }
  }

  /**
   * レスポンスからparts配列を安全に取得
   */
  private getResponseParts(response: any): any[] {
    if (!response?.candidates?.[0]?.content?.parts) {
      return [];
    }
    return response.candidates[0].content.parts;
  }

  /**
   * レスポンスにfunction callが含まれているかチェック
   */
  private hasFunctionCall(response: any): boolean {
    const parts = this.getResponseParts(response);
    return parts.some((part: any) => part?.functionCall);
  }

  /**
   * すべてのfunction callを実行し、結果を返す
   */
  private async executeFunctionCalls(response: any): Promise<any[]> {
    const functionResponses: any[] = [];
    const parts = this.getResponseParts(response);

    const executedFunctionNames = new Set<string>(); // 実行された関数名を記録するSet

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];  
      if (part?.functionCall) {
        const functionCall = part.functionCall;
        const functionName = functionCall.name;
        const args = functionCall.args;

        console.log(`[システム] Geminiがツール '${functionName}' の呼び出しを要求。['${i}']引数:`, args);
        // 同じ関数名が既に実行済みであればスキップ
        if (executedFunctionNames.has(functionName)) {
            console.log(`[システム] ツール '${functionName}' は既に実行済みのため、スキップします。(partsインデックス: ${i})`);
            // スキップされた旨をGeminiに伝える必要がある場合は、functionResponsesに追加
            functionResponses.push({
              functionResponse: {
                name: functionName,
                response: { warning: `このツールは既に実行済みのためスキップされました。` }
              }
            });
            continue; // このFunction Callの処理をスキップして次のパートへ
        }

        if (this.tools[functionName]) {
          try {
            // ツール実行
            const toolResponse = await this.tools[functionName](args);
            console.log(`[システム] ツール '${functionName}' 実行結果:`, toolResponse);

            // function responseを構築
            functionResponses.push({
              functionResponse: {
                name: functionName,
                response: { result: toolResponse },
              },
            });
            executedFunctionNames.add(functionName);
          } catch (toolError) {
            console.error(`[システム] ツール '${functionName}' 実行エラー:`, toolError);
            
            // エラーもGeminiに伝える
            functionResponses.push({
              functionResponse: {
                name: functionName,
                response: { 
                  error: `ツール実行エラー: ${toolError instanceof Error ? toolError.message : String(toolError)}` 
                },
              },
            });
          }
        } else {
          console.warn(`[システム] 不明なツール呼び出しが要求されました: ${functionName}`);
          
          // 不明なツールのエラーもGeminiに伝える
          functionResponses.push({
            functionResponse: {
              name: functionName,
              response: { 
                error: `不明なツール ${functionName} の実行が要求されました` 
              },
            },
          });
        }
      }
    }

    return functionResponses;
  }

  /**
   * 最終的なテキストレスポンスを抽出
   */
  private extractTextResponse(response: any): string {
    const parts = this.getResponseParts(response);
    
    // すべてのテキストパートを収集
    const textParts = parts
      .filter(part => part?.text)
      .map(part => part.text.trim())
      .filter(text => text.length > 0); // 空文字列を除外

    if (textParts.length > 0) {
      // 複数のテキストパートを改行で結合
      return textParts.join('\n');
    }

    // function callのみでテキスト応答がない場合
    if (this.hasFunctionCall(response)) {
      return "ツールを実行しましたが、追加の応答はありません。";
    }

    return "Geminiからの有効な応答が得られませんでした。";
  }

  async clearHistory() {
    this.chat = this.model.startChat({
      tools: this.chat.tools,
      history: [],
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
    console.log('チャット履歴をクリアしました。');
  }

  async getChatHistoryForDebug(): Promise<any[]> {
    return await this.chat.getHistory();
  }

  /**
   * 最大function call回数を設定
   */
  setMaxFunctionCalls(maxCalls: number) {
    this.maxFunctionCalls = maxCalls;
  }
}