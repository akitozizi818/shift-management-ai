// src/lib/ai/sample-data.ts

export interface ShiftMember {
    userId: string;
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
    userId: string;
    name: string;
  }
  
  // メンバーマスターデータ
  export const memberMasterData: MemberData[] = [
    { userId: 'U001', name: '田中' },
    { userId: 'U002', name: '佐藤' },
    { userId: 'U003', name: '鈴木' },
    { userId: 'U004', name: '山田' },
    { userId: 'U005', name: '高橋' },
    { userId: 'U006', name: '池田' },
    { userId: 'U007', name: '工藤' },
    { userId: 'w5fRmUhfAvapDosDa7uazoWwa8i1', name: '瞭人' }
  ];
  
  // サンプルシフトデータ（編集可能）
  export const shiftSampleData: ShiftData[] = [
    {
      date: '2025-06-24',
      members: [
        { userId: 'U001', name: '田中', startTime: '09:00', endTime: '17:00' },
        { userId: 'U002', name: '佐藤', startTime: '13:00', endTime: '21:00' }
      ]
    },
    {
      date: '2025-06-25',
      members: [
        { userId: 'U003', name: '鈴木', startTime: '09:00', endTime: '17:00' }
      ]
    },
    {
      date: '2025-06-26',
      members: []  // 不足状態
    },
    {
      date: '2025-06-27',
      members: [
        { userId: 'U004', name: '山田', startTime: '09:00', endTime: '13:00' },
        { userId: 'U005', name: '高橋', startTime: '13:00', endTime: '17:00' }
      ]
    },
    {
      date: '2025-06-28',
      members: [
        { userId: 'U001', name: '田中', startTime: '09:00', endTime: '17:00' }
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