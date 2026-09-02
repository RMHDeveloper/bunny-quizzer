// Shared, framework-free helpers used by both the browser client and the
// serverless function. No browser or Node APIs here.
import { QuizSettings, Question, UserAnswer } from "../types";

export const DEFAULT_MODEL = "gemini-flash-latest";
export const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

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

export function buildQuizRequestBody(settings: QuizSettings) {
  return {
    contents: [{ parts: [{ text: quizPrompt(settings) }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: QUIZ_SCHEMA,
    },
  };
}

export function buildSummaryRequestBody(
  settings: QuizSettings,
  questions: Question[],
  answers: UserAnswer[]
) {
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

  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.5 },
  };
}
