const ASSISTANT_ID = "asst_2MmxTf13uHuYYARbEsDX4Sdm";
const OPENAI_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export async function createThread() {
    if (!OPENAI_KEY) throw new Error("OpenAI API key not configured.");
    console.log("[createThread] => POST /v1/threads");
    const res = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({ messages: [] })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Unknown" }));
      throw new Error(`createThread error: ${res.status} - ${err.error?.message || err.message}`);
    }
    const obj = await res.json();
    console.log("[createThread] =>", obj);
    return obj; // Returns the thread object { id, ... }
}

export async function createThreadMessage(thread_id, role, userMsg) {
     if (!OPENAI_KEY) throw new Error("OpenAI API key not configured.");
     console.log(`[createThreadMessage] => /v1/threads/${thread_id}/messages, role=${role}, content=`, userMsg);
     const msgRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${OPENAI_KEY}`,
         "OpenAI-Beta": "assistants=v2"
       },
       body: JSON.stringify({
         role,
         content: [
           { type: "text", text: userMsg }
         ]
       })
     });
     if (!msgRes.ok) {
       const err = await msgRes.json().catch(() => ({ message: "Unknown" }));
       throw new Error(`createThreadMessage error: ${msgRes.status} - ${err.error?.message || err.message}`);
     }
     const msg = await msgRes.json();
     console.log("[createThreadMessage] =>", msg);
     return msg;
}

export async function createRun(thread_id) {
    if (!OPENAI_KEY) throw new Error("OpenAI API key not configured.");
    console.log(`[createRun] => /v1/threads/${thread_id}/runs with assistant_id=${ASSISTANT_ID}`);
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({ assistant_id: ASSISTANT_ID })
    });
    if (!runRes.ok) {
      const err = await runRes.json().catch(() => ({ message: "Unknown" }));
      throw new Error(`createRun error: ${runRes.status} - ${err.error?.message || err.message}`);
    }
    let runObj = await runRes.json();
    console.log("[createRun] => initial runObj:", runObj);

    // Polling logic with timeout
    const startTime = Date.now();
    const timeout = 60000; // 60 seconds timeout

    while (!["completed","failed","cancelled","incomplete","expired"].includes(runObj.status)) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Run timed out after ${timeout / 1000} seconds with status: ${runObj.status}`);
      }
      console.log("[createRun] polling status:", runObj.status);
      await new Promise(r => setTimeout(r, 1500)); // Poll slightly less frequently
      try {
            const poll = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${runObj.id}`, {
                headers: {
                "Authorization": `Bearer ${OPENAI_KEY}`,
                "OpenAI-Beta": "assistants=v2"
                }
            });
            if (!poll.ok) {
                 // Handle non-fatal polling errors differently?
                 console.warn(`Polling error: ${poll.status}`);
                 if (poll.status === 404) throw new Error("Run not found during polling.");
                 // Continue polling for other errors?
            } else {
                 runObj = await poll.json();
            }
      } catch (pollError) {
            console.error("Error during polling fetch:", pollError);
            // Decide if this error is fatal
            throw new Error(`Polling fetch failed: ${pollError.message}`);
      }
    }

    console.log("[createRun] final status:", runObj.status);
    if (runObj.status !== "completed") {
      const finalError = runObj.last_error ? ` (${runObj.last_error.code}: ${runObj.last_error.message})` : '';
      throw new Error(`Run ended with status=${runObj.status}${finalError}`);
    }
    return runObj;
}

export async function fetchAssistantMessage(thread_id) {
    if (!OPENAI_KEY) throw new Error("OpenAI API key not configured.");
    console.log(`[fetchAssistantMessage] => listing messages for thread=${thread_id}`);
    const list = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?order=desc&limit=10`, {
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });
    if (!list.ok) {
      const err = await list.json().catch(() => ({ message: "Unknown" }));
      throw new Error(`fetchAssistantMessage error: ${list.status} - ${err.error?.message || err.message}`);
    }
    const data = await list.json();
    // Find the latest assistant message
    for (const m of data.data) {
      if (m.role === "assistant") {
        const textContent = m.content
            .filter(seg => seg.type === 'text' && seg.text?.value)
            .map(seg => seg.text.value)
            .join("");
        console.log(`[fetchAssistantMessage] Found assistant message:`, textContent);
        return textContent;
      }
    }
    console.log(`[fetchAssistantMessage] No assistant message found in last 10.`);
    return null; // Return null if no assistant message found
} 