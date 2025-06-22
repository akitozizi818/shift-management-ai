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

/** 個々の希望提出 (=1レコード) */
export interface ShiftRequest {
  requestId: string;                    // UUID
  userId: string;                       // 希望提出者
  month: string;                        // "YYYY-MM"
  preferredDates: number[];             // 希望勤務日 (UNIX time ms)
  unavailableDates: number[];           // 勤務不可日   (UNIX time ms)
  preferredShifts: {                    // 日付ごとの希望時間
    [date: string]: {
      startTime: string;                // "HH:mm"
      endTime: string;                  // "HH:mm"
    };
  };
  status: "pending" | "processed" | "approved";
  submittedAt: number;                  // UNIX time ms
  processedAt?: number;
  processedBy?: string;                 // 処理担当者ID
}

/**
 * RequestMap
 *  └─ key   : date (YYYY-MM-DD)  ※日単位でまとめる
 *  └─ value : その日に提出された希望配列
 */
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