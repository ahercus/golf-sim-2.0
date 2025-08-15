import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
  if (!OPENAI_KEY || !ASSISTANT_ID) {
    return NextResponse.json({ error: { message: 'Missing OPENAI_API_KEY or OPENAI_ASSISTANT_ID' } }, { status: 500 });
  }
  const { thread_id } = await req.json();
  if (!thread_id) {
    return NextResponse.json({ error: { message: 'thread_id is required' } }, { status: 400 });
  }
  const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({ assistant_id: ASSISTANT_ID })
  });
  if (!runRes.ok) {
    const e = await runRes.json().catch(() => ({ error: { message: 'OpenAI error' } }));
    return NextResponse.json(e, { status: runRes.status });
  }
  let runObj = await runRes.json();
  const start = Date.now();
  const timeoutMs = 60000;
  while (!['completed','failed','cancelled','incomplete','expired'].includes(runObj.status)) {
    if (Date.now() - start > timeoutMs) {
      return NextResponse.json({ error: { message: 'Run timed out', status: runObj.status } }, { status: 504 });
    }
    await new Promise(r => setTimeout(r, 1200));
    const poll = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${runObj.id}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    if (!poll.ok) {
      const e = await poll.json().catch(() => ({ error: { message: 'OpenAI polling error' } }));
      return NextResponse.json(e, { status: poll.status });
    }
    runObj = await poll.json();
  }
  if (runObj.status !== 'completed') {
    return NextResponse.json({ error: { message: 'Run ended not completed', status: runObj.status, last_error: runObj.last_error } }, { status: 500 });
  }
  return NextResponse.json(runObj);
}


