import { NextResponse } from 'next/server';
import { evaluateQuestAI } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, description } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Quest title is required' },
        { status: 400 }
      );
    }

    const evaluation = await evaluateQuestAI(
      title,
      category || 'strength',
      typeof description === 'string' ? description.slice(0, 75) : ''
    );

    return NextResponse.json(evaluation);
  } catch (err) {
    console.error('API evaluate error:', err);
    return NextResponse.json(
      { error: 'Failed to evaluate quest with AI' },
      { status: 500 }
    );
  }
}
