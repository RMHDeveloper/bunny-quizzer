// Vercel Edge Function. Keeps the Gemini API key on the server so it never
// reaches the browser. The client calls POST /api/generate.
import {
  buildQuizRequestBody,
  buildSummaryRequestBody,
  DEFAULT_MODEL,
  GEMINI_BASE,
} from "../lib/gemini";

export const config = { runtime: "edge" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function upstreamError(status: number): string {
  if (status === 400 || status === 401 || status === 403) {
    return "The server's Gemini API key was rejected. Check GEMINI_API_KEY in Vercel.";
  }
  if (status === 404) {
    return "The configured Gemini model is not available. Check GEMINI_MODEL.";
  }
  if (status === 429) {
    return "Gemini rate limit reached. Please wait a minute and try again.";
  }
  return "Gemini could not generate the quiz. Please try again.";
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) {
    return json(
      {
        error:
          "The server is missing GEMINI_API_KEY. Add it in Vercel -> Settings -> Environment Variables, then redeploy.",
      },
      500
    );
  }
  const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();

  let body: {
    mode?: string;
    settings?: { topic?: string };
    questions?: unknown[];
    answers?: unknown[];
    stream?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  try {
    if (body.mode === "summary") {
      const upstream = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            buildSummaryRequestBody(
              body.settings as never,
              (body.questions ?? []) as never,
              (body.answers ?? []) as never
            )
          ),
        }
      );
      if (!upstream.ok) return json({ error: upstreamError(upstream.status) }, 502);
      const data = await upstream.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return json({ text });
    }

    // default: quiz generation
    if (!body.settings || !body.settings.topic) {
      return json({ error: "Missing quiz settings." }, 400);
    }
    const wantStream = body.stream !== false;
    const method = wantStream ? "streamGenerateContent?alt=sse&" : "generateContent?";
    const upstream = await fetch(`${GEMINI_BASE}/${model}:${method}key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildQuizRequestBody(body.settings as never)),
    });

    if (!upstream.ok || !upstream.body) {
      const status = upstream.status >= 400 ? upstream.status : 502;
      return json({ error: upstreamError(upstream.status) }, status);
    }

    if (wantStream) {
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          "x-accel-buffering": "no",
        },
      });
    }

    const data = await upstream.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return json({ text });
  } catch {
    return json({ error: "The server could not reach Gemini." }, 502);
  }
}
