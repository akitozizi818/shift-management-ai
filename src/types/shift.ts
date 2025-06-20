export type Role = "manager" | "staff"
export type ShiftStatus = "request" | "confirmed"

export interface Shift {
  id: string
  memberId: string
  name: string
  role: Role

  startTime: string   // ★ 分割
  endTime:   string   // ★ 分割

  status: ShiftStatus
}
