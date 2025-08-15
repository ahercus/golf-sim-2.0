// All client-side calls now go through Next.js API routes to keep secrets server-side
export async function createThread() {
    const res = await fetch("/api/openai/thread", { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown" }));
      throw new Error(`createThread error: ${res.status} - ${err.error?.message || err.message}`);
    }
    return await res.json();
}

export async function createThreadMessage(thread_id, role, userMsg) {
     const msgRes = await fetch(`/api/openai/message`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ thread_id, role, content: userMsg })
     });
     if (!msgRes.ok) {
       const err = await msgRes.json().catch(() => ({ message: "Unknown" }));
       throw new Error(`createThreadMessage error: ${msgRes.status} - ${err.error?.message || err.message}`);
     }
     return await msgRes.json();
}

export async function createRun(thread_id) {
    const runRes = await fetch(`/api/openai/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id })
    });
    if (!runRes.ok) {
      const err = await runRes.json().catch(() => ({ message: "Unknown" }));
      throw new Error(`createRun error: ${runRes.status} - ${err.error?.message || err.message}`);
    }
    return await runRes.json();
}

export async function fetchAssistantMessage(thread_id) {
    const res = await fetch(`/api/openai/latest?thread_id=${encodeURIComponent(thread_id)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown" }));
      throw new Error(`fetchAssistantMessage error: ${res.status} - ${err.error?.message || err.message}`);
    }
    const data = await res.json();
    return data?.text ?? null;
}