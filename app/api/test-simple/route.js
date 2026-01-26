import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Simple route works!',
    timestamp: new Date().toISOString()
  });
}
