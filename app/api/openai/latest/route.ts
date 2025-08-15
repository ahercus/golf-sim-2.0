import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return NextResponse.json({ error: { message: 'Missing OPENAI_API_KEY' } }, { status: 500 });
  }
  const thread_id = req.nextUrl.searchParams.get('thread_id');
  if (!thread_id) {
    return NextResponse.json({ error: { message: 'thread_id is required' } }, { status: 400 });
  }
  const list = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?order=desc&limit=10`, {
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    }
  });
  const data = await list.json();
  if (!list.ok) {
    return NextResponse.json({ error: data?.error || { message: 'OpenAI error' } }, { status: list.status });
  }
  for (const m of data.data ?? []) {
    if (m.role === 'assistant') {
      const text = (m.content ?? [])
        .filter((seg: any) => seg.type === 'text' && seg.text?.value)
        .map((seg: any) => seg.text.value)
        .join('');
      return NextResponse.json({ text });
    }
  }
  return NextResponse.json({ text: null });
}


