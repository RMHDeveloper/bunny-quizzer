// Vercel Edge Function. Forwards Gemini requests to the shared dashboard
// proxy so no provider API key needs to live in this app's environment.
// The client calls POST /api/generate. The dashboard proxy is a JSON-in/
// JSON-out endpoint (no SSE streaming), so this always requests a
// non-streaming completion; the client already falls back to non-streaming
// generation when no response body is present.
import {
  buildQuizRequestBody,
  buildSummaryRequestBody,
  DEFAULT_MODEL,
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
    return "The dashboard proxy rejected the request. Check DASHBOARD_PROXY_SECRET in Vercel.";
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

  const proxyUrl = (process.env.DASHBOARD_PROXY_URL || "").trim();
  const proxySecret = (process.env.DASHBOARD_PROXY_SECRET || "").trim();
  if (!proxyUrl || !proxySecret) {
    return json(
      {
        error:
          "The server is missing DASHBOARD_PROXY_URL or DASHBOARD_PROXY_SECRET. Add them in Vercel -> Settings -> Environment Variables, then redeploy.",
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

  const callProxy = async (requestBody: Record<string, unknown>) => {
    return fetch(`${proxyUrl}/api/proxy/bunny-quizzer`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-proxy-secret": proxySecret,
      },
      body: JSON.stringify({ model, ...requestBody }),
    });
  };

  try {
    if (body.mode === "summary") {
      const upstream = await callProxy(
        buildSummaryRequestBody(
          body.settings as never,
          (body.questions ?? []) as never,
          (body.answers ?? []) as never
        )
      );
      if (!upstream.ok) return json({ error: upstreamError(upstream.status) }, 502);
      const data = await upstream.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return json({ text });
    }

    // default: quiz generation (always non-streaming through the dashboard proxy)
    if (!body.settings || !body.settings.topic) {
      return json({ error: "Missing quiz settings." }, 400);
    }
    const upstream = await callProxy(buildQuizRequestBody(body.settings as never));

    if (!upstream.ok) {
      const status = upstream.status >= 400 ? upstream.status : 502;
      return json({ error: upstreamError(upstream.status) }, status);
    }

    const data = await upstream.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return json({ text });
  } catch {
    return json({ error: "The server could not reach the dashboard proxy." }, 502);
  }
}
