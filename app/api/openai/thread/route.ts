import { NextResponse } from 'next/server';

export async function POST() {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return NextResponse.json({ error: { message: 'Missing OPENAI_API_KEY' } }, { status: 500 });
  }
  const res = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({ messages: [] })
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data?.error || { message: 'OpenAI error' } }, { status: res.status });
  }
  return NextResponse.json(data);
}


