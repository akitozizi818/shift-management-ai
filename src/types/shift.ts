/* ------------ スケジュール（確定／ドラフト） ------------ */
export type ScheduleStatus = "draft" | "published" | "archived";

export interface memberAssignment {
  userId: string;
  startTime: string;
  endTime: string;
  role: string;
}

export interface Schedule {
  scheduleId: string;                // UUID
  month: string;                     // "YYYY-MM"
  generatedBy: string;
  status: ScheduleStatus;
  shifts: {
    [date: string]: {                // "YYYY-MM-DD"
      memberAssignments: memberAssignment[];
    };
  };
  metadata: {
    totalHours: number;
    coverageRate: number;
    violatedRules?: string[];
  };
  generatedAt: number;               // epoch ms
  publishedAt?: number;
}

/* ------------ シフト希望 ------------------------------- */
export type RequestStatus = "pending" | "processed" | "approved";

export interface ShiftRequest {
  requestId: string;                 // UUID
  userId: string;
  month: string;                     // "YYYY-MM"
  preferredDates: number[];          // epoch ms[]
  unavailableDates: number[];
  preferredShifts: {
    [date: string]: {
      startTime: string;
      endTime: string;
    };
  };
  status: RequestStatus;
  submittedAt: number;
  processedAt?: number;
  processedBy?: string;
}
// ---------------------------------------------
// types/shift.ts（など共通の型宣言ファイル）
// ---------------------------------------------

export type RequestMap = Record<string, ShiftRequest[]>;



export type Role = "admin" | "member";

export interface User{
  [userId: string]: {
    name: string;          // ユーザー名
    email: string;         // メールアドレス
    role: Role; // 権限レベル
    lineUserId?: string;   // LINE連携用ID（オプション）
    department?: string;   // 所属部署
    isActive: boolean;     // アクティブ状態
  };
}


export interface Rule {
  ruleId: string;                          // UUID → id フィールドに対応
  name: string;                            // "基本勤務ルール_ver1"
  description?: string;                    // 説明文（画像の description）
  minStaffCount: number;                   // 最小スタッフ数 → minStaff
  maxStaffCount?: number;                  // 最大スタッフ数 → maxStaff
  workingHours: {                          // 営業時間
    start: string;                         // "13:00"
    end: string;                           // "22:00"
  };
  isAllDay: boolean;                       // isAllDay: false
  isActive: boolean;                       // Firestore側にない → default true などでも可
  priority: number;                        // 優先度 → Firestore側にない → default 0 などでも可
  createdAt: number;                       // UNIXタイムスタンプに変換すべき（今は日付文字列）
  updatedAt?: number;                      // 任意（まだない）
}
