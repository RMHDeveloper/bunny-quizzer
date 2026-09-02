import { QuizSettings, Question, Option, UserAnswer } from "../types";

// All Gemini calls go through our own serverless function so the API key
// stays on the server. See api/generate.ts.
const API = "/api/generate";

async function postApi(payload: unknown): Promise<Response> {
  return fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
  } catch {
    /* not JSON */
  }
  if (res.status === 404) {
    return "The quiz service is not running. Locally, run `vercel dev` or restart the dev server.";
  }
  return "Could not generate the quiz. Please try again.";
}

/** Pull every complete top-level `{...}` object out of a growing JSON string. */
function drainObjects(buffer: string, state: { pos: number }): unknown[] {
  const out: unknown[] = [];
  let i = state.pos;
  while (true) {
    while (i < buffer.length && buffer[i] !== "{") i++;
    if (i >= buffer.length) {
      state.pos = i;
      return out;
    }
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let j = i; j < buffer.length; j++) {
      const c = buffer[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') {
        inStr = true;
      } else if (c === "{") {
        depth++;
      } else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) {
      state.pos = i; // incomplete object - wait for more data
      return out;
    }
    try {
      out.push(JSON.parse(buffer.slice(i, end + 1)));
    } catch {
      /* skip malformed fragment */
    }
    i = end + 1;
  }
}

function normalizeQuestion(raw: unknown, index: number): Question | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.question !== "string" || !r.question.trim()) return null;
  if (!Array.isArray(r.options)) return null;

  const options: Option[] = r.options
    .map((o: unknown): Option => {
      if (typeof o === "string") {
        return { text: o, correct: false, reason: "" };
      }
      const oo = (o ?? {}) as Record<string, unknown>;
      return {
        text: String(oo.text ?? oo.option ?? ""),
        correct: Boolean(oo.correct ?? oo.isCorrect),
        reason: String(oo.reason ?? oo.explanation ?? ""),
      };
    })
    .filter((o) => o.text.trim().length > 0);

  if (options.length < 2) return null;

  const correctCount = options.filter((o) => o.correct).length;
  if (correctCount === 0) {
    const stated = String(r.correctAnswer ?? r.answer ?? "").trim();
    const match = options.find((o) => o.text.trim() === stated);
    (match ?? options[0]).correct = true;
  } else if (correctCount > 1) {
    let kept = false;
    for (const o of options) {
      if (o.correct) {
        if (kept) o.correct = false;
        else kept = true;
      }
    }
  }

  return {
    id: String(r.id ?? `q${index + 1}`),
    question: r.question.trim(),
    options,
    explanation: String(r.explanation ?? "").trim(),
  };
}

function parseQuizText(text: string): Question[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return [];
  }
  const list = Array.isArray(parsed)
    ? parsed
    : ((parsed as Record<string, unknown>)?.questions as unknown[]) ?? [];
  return list
    .map((raw, i) => normalizeQuestion(raw, i))
    .filter((q): q is Question => q !== null);
}

/** Non-streaming generation - used as a fallback. */
export async function generateQuiz(settings: QuizSettings): Promise<Question[]> {
  let res: Response;
  try {
    res = await postApi({ mode: "quiz", settings, stream: false });
  } catch {
    throw new Error("Could not reach the quiz service. Check your internet connection.");
  }
  if (!res.ok) throw new Error(await readError(res));

  const data = await res.json().catch(() => null);
  const questions = parseQuizText(String(data?.text ?? ""));
  if (questions.length === 0) {
    throw new Error("Something went wrong while making the quiz. Please try again.");
  }
  return questions;
}

/**
 * Streaming generation. Yields each question as soon as it is fully formed.
 * Falls back to a single non-streaming request if streaming is unavailable
 * and nothing has been yielded yet.
 */
export async function* streamQuiz(
  settings: QuizSettings
): AsyncGenerator<Question, void, unknown> {
  let res: Response;
  try {
    res = await postApi({ mode: "quiz", settings });
  } catch {
    for (const q of await generateQuiz(settings)) yield q;
    return;
  }

  if (!res.ok) {
    throw new Error(await readError(res));
  }
  if (!res.body) {
    for (const q of await generateQuiz(settings)) yield q;
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = "";
  let jsonText = "";
  const state = { pos: 0 };
  const seen = new Set<string>();
  let yielded = 0;

  const flush = function* (): Generator<Question> {
    for (const raw of drainObjects(jsonText, state)) {
      const q = normalizeQuestion(raw, yielded);
      if (q && !seen.has(q.id)) {
        seen.add(q.id);
        yielded += 1;
        yield q;
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split("\n");
      sseBuffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload);
          const piece = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof piece === "string") jsonText += piece;
        } catch {
          /* ignore keep-alive / partial SSE frame */
        }
      }
      yield* flush();
    }
    yield* flush();
  } catch (error) {
    if (yielded === 0) {
      for (const q of await generateQuiz(settings)) yield q;
      return;
    }
    console.warn("Stream ended early, using partial quiz", error);
  }

  if (yielded === 0) {
    for (const q of await generateQuiz(settings)) yield q;
  }
}

/** Short AI study summary based on the questions the learner got wrong. */
export async function generateStudySummary(
  settings: QuizSettings,
  questions: Question[],
  answers: UserAnswer[]
): Promise<string> {
  let res: Response;
  try {
    res = await postApi({ mode: "summary", settings, questions, answers });
  } catch {
    throw new Error("Could not load the study summary.");
  }
  if (!res.ok) throw new Error("Could not load the study summary.");
  const data = await res.json().catch(() => null);
  const text = String(data?.text ?? "").trim();
  if (!text) throw new Error("Could not load the study summary.");
  return text;
}
