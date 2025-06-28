// src/lib/firebase/firebaseRules.ts

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

export interface RuleDoc {
    name: string;
    description: string;
}


// ルールをすべて取得する関数
export async function fetchRules(): Promise<RuleDoc[]> {
    const colRef = collection(db, "rules");
    const snap = await getDocs(colRef);
    return snap.docs.map(doc => doc.data() as RuleDoc);
}

// 現在使用されている最新のルールを取得する関数
export async function fetchLatestRule(): Promise<RuleDoc | null> {
    const colRef = collection(db, "rules");
    const snap = await getDocs(colRef);
    
    if (snap.empty) {
        return null; // ルールが存在しない場合はnullを返す
    }
    
    // 最新のルールを取得（ここでは最初のドキュメントを最新と仮定）
    return snap.docs[0].data() as RuleDoc;
}