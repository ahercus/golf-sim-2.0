import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return NextResponse.json({ error: { message: 'Missing OPENAI_API_KEY' } }, { status: 500 });
  }
  const { thread_id, role, content } = await req.json();
  if (!thread_id || !role || !content) {
    return NextResponse.json({ error: { message: 'thread_id, role, and content are required' } }, { status: 400 });
  }
  const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      role,
      content: [ { type: 'text', text: content } ]
    })
  });
  const data = await msgRes.json();
  if (!msgRes.ok) {
    return NextResponse.json({ error: data?.error || { message: 'OpenAI error' } }, { status: msgRes.status });
  }
  return NextResponse.json(data);
}


