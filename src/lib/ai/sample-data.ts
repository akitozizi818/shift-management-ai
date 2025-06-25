// src/lib/ai/sample-data.ts

export interface ShiftMember {
    lineId: string;
    name: string;
    startTime: string;
    endTime: string;
  }
  
  export interface ShiftData {
    date: string;
    members: ShiftMember[];
  }
  
  export interface RuleData {
    name: string;
    description: string;
  }
  
  export interface MemberData {
    lineId: string;
    name: string;
  }
  
  // メンバーマスターデータ
  export const memberMasterData: MemberData[] = [
    { lineId: 'U001', name: '田中' },
    { lineId: 'U002', name: '佐藤' },
    { lineId: 'U003', name: '鈴木' },
    { lineId: 'U004', name: '山田' },
    { lineId: 'U005', name: '高橋' },
    { lineId: 'U006', name: '池田' },
    { lineId: 'U007', name: '工藤' },
    { lineId: 'U008', name: '河野' }
  ];
  
  // サンプルシフトデータ（編集可能）
  export const shiftSampleData: ShiftData[] = [
    {
      date: '2025-06-24',
      members: [
        { lineId: 'U001', name: '田中', startTime: '09:00', endTime: '17:00' },
        { lineId: 'U002', name: '佐藤', startTime: '13:00', endTime: '21:00' }
      ]
    },
    {
      date: '2025-06-25',
      members: [
        { lineId: 'U003', name: '鈴木', startTime: '09:00', endTime: '17:00' }
      ]
    },
    {
      date: '2025-06-26',
      members: []  // 不足状態
    },
    {
      date: '2025-06-27',
      members: [
        { lineId: 'U004', name: '山田', startTime: '09:00', endTime: '13:00' },
        { lineId: 'U005', name: '高橋', startTime: '13:00', endTime: '17:00' }
      ]
    },
    {
      date: '2025-06-28',
      members: [
        { lineId: 'U001', name: '田中', startTime: '09:00', endTime: '17:00' }
      ]
    }
  ];
  
  // サンプルルールデータ
  export const ruleSampleData: RuleData[] = [
    {
      name: '最低人員数',
      description: '平日は最低2名、土日は最低3名必要'
    },
    {
      name: '連続勤務制限',
      description: '連続3日以上の勤務は禁止'
    },
    {
      name: '勤務時間制限',
      description: '1日の勤務時間は最大8時間まで'
    },
    {
      name: '休憩時間',
      description: '6時間以上の勤務時は1時間の休憩が必要'
    },
    {
      name: '新人制限',
      description: '新人メンバーは夜間勤務（18時以降）不可'
    }
  ];