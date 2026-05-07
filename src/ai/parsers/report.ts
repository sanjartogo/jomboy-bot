import { callGeminiJSON } from "@/ai/gemini";
import { buildExtractionPrompt } from "@/ai/prompts/extraction";
import type { ParsedReportData } from "@/types";
import { logger } from "@/utils/logger";

export async function parseReportData(
  content: string,
  type: "text" | "image" | "excel" | "voice"
): Promise<ParsedReportData> {
  logger.info({ type }, "Parsing report data with AI...");

  const systemPrompt = buildExtractionPrompt();
  
  let userMessage = content;
  if (type === "image") {
    userMessage = `Quyidagi rasmda berilgan ma'lumotlarni tahlil qiling va hisobot ko'rinishida qaytaring: ${content}`;
  } else if (type === "voice") {
    userMessage = `Quyidagi ovozli xabar matnini tahlil qiling: ${content}`;
  }

  try {
    const result = await callGeminiJSON<ParsedReportData>({
      systemPrompt,
      userMessage,
      temperature: 0.1,
    });

    return result;
  } catch (error) {
    logger.error({ error }, "AI parsing failed");
    return {
      directions: [],
      warnings: ["Tizim ma'lumotlarni tahlil qila olmadi."],
      needs_clarification: true,
    };
  }
}
