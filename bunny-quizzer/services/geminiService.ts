import { QuizSettings, Question, Option, UserAnswer } from "../types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing VITE_GEMINI_API_KEY. Set it in .env.local.");
  }
  return key;
}

function model(): string {
  return import.meta.env.VITE_GEMINI_MODEL || "gemini-flash-latest";
}

function quizPrompt(settings: QuizSettings): string {
  const lang = settings.language || "English";
  return `Generate a ${settings.difficulty} difficulty quiz about "${settings.topic}" with exactly ${settings.count} multiple-choice questions.

Write EVERYTHING (questions, options, reasons, explanations) in ${lang}.

GUIDELINES:
1. Use very simple, direct ${lang}. Short sentences. Avoid complex words or idioms.
2. The audience is from India. Use clear and neutral language.
3. Each question must have exactly 4 options. Exactly ONE option is correct.
4. For every option set "correct" (true/false) and "reason" = one short sentence saying why that option is right or why it is wrong.
5. "explanation" = one direct fact about the correct answer.
6. Do NOT use puns, jokes, or wordplay.
7. Give each question a unique "id" like "q1", "q2", ...`;
}

const QUIZ_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      id: { type: "STRING" },
      question: { type: "STRING" },
      options: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            correct: { type: "BOOLEAN" },
            reason: { type: "STRING" },
          },
          required: ["text", "correct", "reason"],
          propertyOrdering: ["text", "correct", "reason"],
        },
      },
      explanation: { type: "STRING" },
    },
    required: ["id", "question", "options", "explanation"],
    propertyOrdering: ["id", "question", "options", "explanation"],
  },
} as const;

function requestBody(settings: QuizSettings) {
  return {
    contents: [{ parts: [{ text: quizPrompt(settings) }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: QUIZ_SCHEMA,
    },
  };
}

function friendlyError(status: number): string {
  if (status === 400 || status === 401 || status === 403) {
    return "Gemini rejected the API key. Check VITE_GEMINI_API_KEY.";
  }
  if (status === 404) {
    return `Model "${model()}" is not available. Set a valid VITE_GEMINI_MODEL.`;
  }
  if (status === 429) {
    return "Gemini rate limit hit. Wait a minute and try again.";
  }
  return "Something went wrong while making the quiz. Please try again.";
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

  let correctCount = options.filter((o) => o.correct).length;
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

/** Non-streaming generation - used as a fallback. */
export async function generateQuiz(settings: QuizSettings): Promise<Question[]> {
  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_BASE}/${model()}:generateContent?key=${apiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody(settings)),
      }
    );
  } catch {
    throw new Error("Could not reach Gemini. Check your internet connection.");
  }

  if (!response.ok) {
    console.error("Gemini request failed", response.status, await response.text().catch(() => ""));
    throw new Error(friendlyError(response.status));
  }

  const data = await response.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("Empty Gemini response", data);
    throw new Error("Something went wrong while making the quiz. Please try again.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch (error) {
    console.error("Failed to parse quiz JSON", error, text);
    throw new Error("Something went wrong while making the quiz. Please try again.");
  }
  const list = Array.isArray(parsed)
    ? parsed
    : ((parsed as Record<string, unknown>)?.questions as unknown[]) ?? [];
  const questions = list
    .map((raw, i) => normalizeQuestion(raw, i))
    .filter((q): q is Question => q !== null);
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
  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_BASE}/${model()}:streamGenerateContent?alt=sse&key=${apiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody(settings)),
      }
    );
  } catch {
    for (const q of await generateQuiz(settings)) yield q;
    return;
  }

  if (!response.ok || !response.body) {
    if (response.status && response.status !== 200) {
      // real API error - surface it
      console.error("Gemini stream failed", response.status, await response.text().catch(() => ""));
      throw new Error(friendlyError(response.status));
    }
    for (const q of await generateQuiz(settings)) yield q;
    return;
  }

  const reader = response.body.getReader();
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
      // streaming broke before producing anything - try the simple path
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
  const lang = settings.language || "English";
  const wrong = questions.filter((q) => {
    const a = answers.find((x) => x.questionId === q.id);
    return !a || !a.isCorrect;
  });

  const scoreLine = `The learner scored ${answers.filter((a) => a.isCorrect).length} out of ${questions.length}.`;
  const wrongList =
    wrong.length === 0
      ? "The learner answered everything correctly."
      : wrong
          .map((q) => {
            const correct = q.options.find((o) => o.correct);
            return `- Q: ${q.question}\n  Correct answer: ${correct?.text ?? ""}`;
          })
          .join("\n");

  const prompt = `A learner just finished a quiz about "${settings.topic}".
${scoreLine}

Questions they got wrong:
${wrongList}

Write a short study summary in ${lang} using very simple language.
Include:
1. One line on how they did.
2. The main sub-topics they should revise.
3. Exactly 3 key facts to remember, as short bullet points.
Keep the whole summary under 90 words. Plain text only, no markdown headings.`;

  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_BASE}/${model()}:generateContent?key=${apiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5 },
        }),
      }
    );
  } catch {
    throw new Error("Could not load the study summary.");
  }

  if (!response.ok) {
    throw new Error("Could not load the study summary.");
  }
  const data = await response.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Could not load the study summary.");
  return text.trim();
}
