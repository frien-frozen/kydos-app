import { NextResponse } from 'next/server'
import { generateAIFlourishingAssessments } from '@/server/ai'

export async function GET(req: Request) {
  // In production, verify cron secret headers to prevent public abuse
  try {
    const result = await generateAIFlourishingAssessments()
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
