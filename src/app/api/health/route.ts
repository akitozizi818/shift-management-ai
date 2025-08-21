import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'シフト管理AIエージェント API は正常に動作しています',
    method: 'GET'
  });
}

export function POST() {
  return NextResponse.json({
    status: 'OK',
    method: 'POST',
    timestamp: new Date().toISOString(),
    message: 'POST request received'
  });
}