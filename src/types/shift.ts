/* ------------ スケジュール（確定／ドラフト） ------------ */
export type ScheduleStatus = "draft" | "published" | "archived";

export interface memberAssignment {
  userId: string;
  startTime: string;
  endTime: string;
  role?: string;
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
  ruleId: string;                          // UUID
  name: string;                            // ルール名
  ruleType: "staffing" | "schedule" | "constraint";
  minStaffCount: number;                   // 最小スタッフ数
  maxStaffCount?: number;                  // 最大スタッフ数（オプション）
  maxConsecutiveDays: number;              // 最大連続勤務日数
  workingHours: {                          // 営業時間
    start: string;                         // "HH:mm"
    end: string;                           // "HH:mm"
  };
  weeklyMaxHours?: number;                 // 週間最大労働時間（オプション）
  monthlyMaxHours?: number;                // 月間最大労働時間（オプション）
  breakRules?: {                           // 休憩ルール（オプション）
    minWorkHoursForBreak: number;          // 最低勤務時間で休憩
    breakDuration: number;                  // 休憩時間（分）
  };
  isActive: boolean;                       // ルールの有効状態
  priority: number;                        // ルールの優先度（数値が小さいほど優先）
  createdAt: number;                       // 作成日時（UNIXタイムスタンプ）
  updatedAt: number;                       // 更新日時（UNIXタイムスタンプ）
}