// src/lib/firebase/firebaseAiEngine.ts

import { db } from './firebase'; 
import { collection, query, orderBy, limit, addDoc, getDocs, serverTimestamp, writeBatch, doc, getDoc } from 'firebase/firestore'; // TimestampとFieldValueを追加インポート

// Gemini APIの履歴形式に合わせた型定義
export interface GeminiHistoryPart {
  text?: string;
  functionCall?: {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: { [key: string]: any; };
  };
  functionResponse?: {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: { [key: string]: any; }; // resultやerrorなどを含む
  };
}

export interface ChatHistoryEntry {
  role: 'user' | 'model' | 'function'; 
  parts: GeminiHistoryPart[]; // parts配列を直接保存できるようにする
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timestamp: any; 
}

export async function getChatHistory(
  userId: string,
  userTurnLimit: number = 5, // userロールの会話ターン数で制限
  totalFetchLimit: number = 50 // Firestoreから一度に取得する最大ドキュメント数（バッファ）
): Promise<ChatHistoryEntry[]> {
  const chatHistoryRef = collection(db, `users/${userId}/chatHistory`);

  // (1) Firestoreから最新のデータから多めに取得 (新しいもの → 古いもの)
  // userTurnLimitに到達するために、十分な量のデータをフェッチする
  const q = query(chatHistoryRef, orderBy('timestamp', 'desc'), limit(totalFetchLimit));
  const querySnapshot = await getDocs(q);

  const historyToProcess: ChatHistoryEntry[] = [];
  querySnapshot.forEach(doc => {
    historyToProcess.push(doc.data() as ChatHistoryEntry);
  });

  const filteredHistory: ChatHistoryEntry[] = [];
  let currentUserTurnCount = 0;

  // (2) 最新のデータから遡り、指定されたuserTurnLimitに達するまで履歴を収集
  // これにより、userターンが途切れることなく、関連するmodel/functionターンも含まれる
  for (let i = 0; i < historyToProcess.length; i++) {
    const entry = historyToProcess[i];
    
    // filteredHistoryの先頭に追加することで、一時的に古いものから新しいものへ並ぶ
    filteredHistory.unshift(entry); 

    if (entry.role === 'user') {
      currentUserTurnCount++;
      if (currentUserTurnCount >= userTurnLimit) {
        break; // 指定したユーザーターン数に達したら停止
      }
    }
  }

  // (3) 収集した履歴を最も古いものから並べ替える (古いもの → 新しいもの)
  // AIモデルが会話履歴を古い順に期待するため、ここで並べ替え直す
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  filteredHistory.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
  
  return filteredHistory;
}

/**
 * ユーザーのメッセージを会話履歴に保存する
 * @param userId - ユーザーID
 * @param messageText - ユーザーのメッセージ内容
 */
export async function addUserMessageToHistory(userId: string, messageText: string): Promise<void> {
  const chatHistoryRef = collection(db, `users/${userId}/chatHistory`);
  await addDoc(chatHistoryRef, {
    role: 'user',
    parts: [{ text: messageText }],
    timestamp: serverTimestamp(), 
  });
}

/**
 * AIの応答を会話履歴に保存する (テキスト、またはFunction Callを含む)
 * @param userId - ユーザーID
 * @param aiResponseParts - AIの応答内容 (GeminiHistoryPartの配列)
 */
export async function addAiResponseToHistory(userId: string, aiResponseParts: GeminiHistoryPart[]): Promise<void> {
  const chatHistoryRef = collection(db, `users/${userId}/chatHistory`);
  await addDoc(chatHistoryRef, {
    role: 'model',
    parts: aiResponseParts, // parts配列をそのまま保存
    timestamp: serverTimestamp(),
  });
}

/**
 * 関数呼び出しの実行結果を会話履歴に保存する (複数のFunction Responseをまとめて保存)
 * @param userId - ユーザーID
 * @param functionResponses - 実行された全ての関数応答の配列 (Geminiに返す形式と同じ)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addFunctionResponsesToHistory(userId: string, functionResponses: { functionResponse: { name: string; response: { [key: string]: any; }; }; }[]): Promise<void> {
  const chatHistoryRef = collection(db, `users/${userId}/chatHistory`);
  
  const parts: GeminiHistoryPart[] = functionResponses.map(fr => ({
    functionResponse: fr.functionResponse
  }));

  await addDoc(chatHistoryRef, {
    role: 'function', 
    parts: parts, 
    timestamp: serverTimestamp(),
  });
}

/**
 * (オプション) ユーザーの会話履歴を全て削除する
 * @param userId - ユーザーID
 */
export async function clearUserChatHistory(userId: string): Promise<void> {
  const chatHistoryRef = collection(db, `users/${userId}/chatHistory`);
  const q = query(chatHistoryRef);
  const querySnapshot = await getDocs(q);

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  if (process.env.NODE_ENV === 'development') {
    console.log(`User ${userId}'s chat history cleared from Firestore.`);
  }
}

export async function getSystemPrompt(promptKey: string): Promise<string | null> {
  
  const docRef = doc(db, 'ai_settings', 'system_prompts'); // コレクションとドキュメント名は適宜変更
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data[promptKey]) {
        return data[promptKey] as string;
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Firestoreにプロンプトキー '${promptKey}' が見つかりませんでした。`);
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('システムプロンプトの取得中にエラーが発生しました:', error);
    }
    return null;
  }
}