// src/lib/firebase/firebaseChatHistory.ts (修正版 - addAiResponseToHistoryの変更)

import { db } from './firebase'; 
import { collection, query, orderBy, limit, addDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';

// Gemini APIの履歴形式に合わせた型定義
export interface GeminiHistoryPart {
  text?: string;
  functionCall?: {
    name: string;
    args: { [key: string]: any; };
  };
  functionResponse?: {
    name: string;
    response: { [key: string]: any; }; // resultやerrorなどを含む
  };
}

export interface ChatHistoryEntry {
  role: 'user' | 'model' | 'function'; 
  parts: GeminiHistoryPart[]; // parts配列を直接保存できるようにする
  timestamp: any; 
}

/**
 * 指定したユーザーの会話履歴を取得する
 * @param userId - ユーザーID
 * @param limitCount - 取得する履歴の最大数 (Geminiのコンテキストウィンドウに合わせて調整)
 * @returns 会話履歴の配列
 */
export async function getChatHistory(userId: string, limitCount: number = 20): Promise<ChatHistoryEntry[]> {
  const chatHistoryRef = collection(db, `users/${userId}/chatHistory`);
  const q = query(chatHistoryRef, orderBy('timestamp', 'asc'), limit(limitCount));
  const querySnapshot = await getDocs(q);

  const history: ChatHistoryEntry[] = [];
  querySnapshot.forEach(doc => {
    history.push(doc.data() as ChatHistoryEntry);
  });
  return history;
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
  console.log(`User ${userId}'s chat history cleared from Firestore.`);
}