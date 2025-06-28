// src/lib/ai/services/gemini-service.ts
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { 
  getChatHistory, 
  addUserMessageToHistory, 
  addAiResponseToHistory, 
  addFunctionResponsesToHistory, 
  ChatHistoryEntry,
  GeminiHistoryPart // GeminiHistoryPartもインポート
} from '../../firebase/firebaseAiEngine'; 
import { db } from '../../firebase/firebase'; // Firestoreインスタンスを初期化するためにインポート（直接使用はしないが重要）

export class GeminiService {
  private vertexAI: VertexAI;
  private model: any;
  private tools: { [key: string]: Function }; 
  private toolDeclarations: any[]; // ツール宣言を保持するプロパティを追加
  private maxFunctionCalls: number = 10; // 最大連続実行回数（無限ループ防止）

  constructor(toolDeclarations: any[], availableFunctions: { [key: string]: Function }, systemInstruction: string) {
    this.vertexAI = new VertexAI({
      project: process.env.VERTEX_AI_PROJECT_ID!,
      location: process.env.VERTEX_AI_LOCATION!
    });

    this.model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20', // 使用するGeminiモデル
      generationConfig: {
        temperature: 0.2, // 応答のランダム性を制御 (0.0 - 1.0)。低めに設定し、一貫性を重視
      },
      systemInstruction: systemInstruction
    });

    this.tools = availableFunctions;
    this.toolDeclarations = toolDeclarations; // ツール宣言を保存
  }

  /**
   * ユーザーメッセージをGeminiに送信し、応答を返す。
   * 会話履歴のロードと保存を内部で処理する。
   * @param userId - メッセージを送信したユーザーのID
   * @param userMessage - ユーザーが送信したテキストメッセージ
   * @returns AIからの応答テキスト
   */
  async sendMessage(userId: string, userMessage: string): Promise<string> {
    try {
      // 1. ユーザーの過去の会話履歴をFirestoreから取得
      const loadedHistory: ChatHistoryEntry[] = await getChatHistory(userId);
      console.log(`[システム] Firestoreからロードした過去の会話履歴 (${loadedHistory.length}件):`, JSON.stringify(loadedHistory));

      // 2. 過去の履歴とツール定義を使って新しいチャットセッションを開始
      const chat = this.model.startChat({
        tools: this.toolDeclarations, 
        history: loadedHistory.map(entry => ({ 
          role: entry.role,
          parts: entry.parts
        })),       
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
      });

      // ユーザーメッセージをGeminiに送信する前に履歴に保存
      await addUserMessageToHistory(userId, userMessage); // ここでユーザーメッセージを保存

      // Geminiにユーザーメッセージを送信
      let result = await chat.sendMessage(userMessage); 
      let functionCallCount = 0;

      // モデルの最初の応答を履歴に保存 (テキストとFunction Callを含む可能性がある)
      const initialModelResponseParts = this.getResponseParts(result.response);
      await addAiResponseToHistory(userId, initialModelResponseParts); // ここでモデルの応答を保存

      // 連続してfunction callingが必要な場合のループ処理
      while (this.hasFunctionCall(result.response) && functionCallCount < this.maxFunctionCalls) {
        functionCallCount++;
        console.log(`[システム] Function call ${functionCallCount}回目を実行中...`);

        // Function Callを実行し、その結果をGeminiに返す
        const functionResponses = await this.executeFunctionCalls(userId, result.response); 
        
        // 実行したFunction Responsesを履歴に保存（まとめて）
        await addFunctionResponsesToHistory(userId, functionResponses); 

        // Function ResponseをGeminiに送信し、次の応答を取得
        result = await chat.sendMessage(functionResponses);

        // Function Response後のモデルの応答を履歴に保存 (通常はテキスト応答)
        const subsequentModelResponseParts = this.getResponseParts(result.response);
        await addAiResponseToHistory(userId, subsequentModelResponseParts); // ここでモデルの応答を保存
      }

      // 最終的なテキスト応答を抽出
      const aiResponseText = this.extractTextResponse(result.response);
      console.log(`[システム] 最終的なAI応答: ${aiResponseText}`);

      return aiResponseText;

    } catch (error) {
      console.error('Gemini API エラー:', error);
      throw new Error('AIとの対話中にエラーが発生しました');
    }
  }

  /**
   * レスポンスからparts配列を安全に取得
   */
  private getResponseParts(response: any): GeminiHistoryPart[] {
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
   * 実行されたFunction Callとその結果は履歴に保存される
   * @param userId - 実行ログを保存するユーザーのID
   * @param response - Gemini APIからのレスポンスオブジェクト
   * @returns 実行結果の配列（Geminiに返す形式）
   */
  private async executeFunctionCalls(userId: string, response: any): Promise<any[]> {
    const functionResponses: any[] = [];
    const parts = this.getResponseParts(response);

    const executedFunctionNames = new Set<string>(); // 同じFunction Callが複数回要求された場合の重複実行防止

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];  
      if (part?.functionCall) {
        const functionCall = part.functionCall;
        const functionName = functionCall.name;
        const args = functionCall.args;

        console.log(`[システム] Geminiがツール '${functionName}' の呼び出しを要求。['${i}']引数:`, args);
        
        // 同じ関数名が既にこのサイクルで実行済みであればスキップ
        if (executedFunctionNames.has(functionName)) {
            console.log(`[システム] ツール '${functionName}' は既に実行済みのため、スキップします。(partsインデックス: ${i})`);
            functionResponses.push({
              functionResponse: {
                name: functionName,
                response: { warning: `このツールは既に実行済みのためスキップされました。` }
              }
            });
            continue; 
        }

        if (this.tools[functionName]) {
          try {
            // ツール実行
            const toolResponse = await this.tools[functionName](args);
            console.log(`[システム] ツール '${functionName}' 実行結果:`, toolResponse);

    
            // Geminiに返すFunction Responseを構築
            functionResponses.push({
              functionResponse: {
                name: functionName,
                response: { result: toolResponse },
              },
            });
            executedFunctionNames.add(functionName); // 実行済みとしてマーク
          } catch (toolError) {
            console.error(`[システム] ツール '${functionName}' 実行エラー:`, toolError);
            const errorMessage = `ツール実行エラー: ${toolError instanceof Error ? toolError.message : String(toolError)}`;
            
            
            // Geminiに返すFunction Response (エラー) を構築
            functionResponses.push({
              functionResponse: {
                name: functionName,
                response: { 
                  error: errorMessage 
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
    
    const textParts = parts
      .filter(part => part?.text)
      .map(part => part.text.trim())
      .filter(text => text.length > 0); 

    if (textParts.length > 0) {
      return textParts.join('\n');
    }

    if (this.hasFunctionCall(response)) {
      // Function Callのみでテキスト応答がない場合は、Geminiがツール実行のみを意図していることが多い
      // このメッセージがユーザーに表示されることは稀なはずだが、念のため
      return "ツールを実行しましたが、追加の応答はありません。";
    }

    return "Geminiからの有効な応答が得られませんでした。";
  }


  /**
   * 最大function call回数を設定 (開発・テスト用)
   */
  setMaxFunctionCalls(maxCalls: number) {
    this.maxFunctionCalls = maxCalls;
  }
}