
import { GoogleGenAI, Type } from "@google/genai";
import { QuizSettings, Question } from "../types";

export const generateQuiz = async (settings: QuizSettings): Promise<Question[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Generate a ${settings.difficulty} difficulty quiz about "${settings.topic}" with exactly ${settings.count} multiple-choice questions. 
  
  IMPORTANT GUIDELINES:
  1. Use very simple, direct English. Avoid complex words or fancy idioms. 
  2. The audience is from India, so use clear and neutral language.
  3. For the "explanation" field, provide a direct fact about the answer. 
  4. DO NOT use puns, jokes, or bunny-themed wordplay in the questions or explanations.
  5. Each question must have exactly 4 options.
  
  Return the result as a JSON array of objects.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "A unique identifier for the question" },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of exactly 4 strings"
            },
            correctAnswer: { type: Type.STRING, description: "The correct option string" },
            explanation: { type: Type.STRING, description: "A direct factual explanation without puns or jokes" }
          },
          required: ["id", "question", "options", "correctAnswer", "explanation"],
          propertyOrdering: ["id", "question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  const jsonStr = response.text.trim();
  try {
    return JSON.parse(jsonStr) as Question[];
  } catch (error) {
    console.error("Failed to parse quiz JSON", error);
    throw new Error("Something went wrong while making the quiz. Please try again.");
  }
};
