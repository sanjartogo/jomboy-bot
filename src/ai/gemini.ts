import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

interface GeminiRequestParams {
  systemPrompt?: string;
  userMessage: string;
  temperature?: number;
}

export async function callGemini(params: GeminiRequestParams): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: params.systemPrompt,
    generationConfig: {
      temperature: params.temperature ?? 0.4,
    },
  });

  try {
    const result = await model.generateContent(params.userMessage);
    return result.response.text();
  } catch (error) {
    logger.error({ error }, "Gemini API text generation failed");
    throw new Error("Failed to get text response from Gemini");
  }
}

export async function callGeminiJSON<T>(params: GeminiRequestParams): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: params.systemPrompt,
    generationConfig: {
      temperature: params.temperature ?? 0.2,
      responseMimeType: "application/json",
    },
  });

  try {
    const result = await model.generateContent(params.userMessage);
    const responseText = result.response.text();
    return JSON.parse(responseText) as T;
  } catch (error) {
    logger.error({ error }, "Gemini API JSON parsing failed");
    throw new Error("Failed to get JSON response from Gemini");
  }
}
