import { callGemini } from "@/ai/gemini";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { formatMoney, formatPercent, formatDate } from "@/utils/format";
import { getDirectionShortName } from "@/config/directions";
import type { Report, User, PerformerInfo } from "@/types";

interface DailyAnalysisInput {
  date: Date;
  reports: Report[];
  users: User[];
  missingData: { user_id: string; missing_direction_ids: number[]; submitted_direction_ids: number[] }[];
}

export interface DailyAnalysisOutput {
  summary: string;
  topPerformers: PerformerInfo[];
  bottomPerformers: PerformerInfo[];
  totalIdentified: number;
  totalCollected: number;
  totalXyus: number;
}

/**
 * Kunlik xulosani AI yordamida yozish.
 *
 * AI faqat tahlil va tavsiya yozadi. Raqamlar (top/bottom, jami summa) deterministic
 * hisoblanadi — AI raqamlar bilan ishlamasin, faqat matn yozsin (galyutsinatsiyadan saqlanish).
 */
export async function generateDailySummary(
  input: DailyAnalysisInput
): Promise<DailyAnalysisOutput> {
  // 1. Statistikani aniq hisoblash (AI'ga ishonmasdan)
  const totalIdentified = input.reports.reduce((s, r) => s + (r.identified_sum ?? 0), 0);
  const totalCollected = input.reports.reduce((s, r) => s + (r.collected_sum ?? 0), 0);
  const totalXyus = input.reports.reduce((s, r) => s + (r.xyus_count ?? 0), 0);

  // 2. Top va bottom performerlar
  const userMap = new Map(input.users.map((u) => [u.id, u]));

  const performersByUser = new Map<string, { user: User; sum: number; reports: Report[] }>();
  for (const r of input.reports) {
    const user = userMap.get(r.user_id);
    if (!user) continue;
    const existing = performersByUser.get(r.user_id) ?? {
      user,
      sum: 0,
      reports: [],
    };
    existing.sum += r.identified_sum ?? 0;
    existing.reports.push(r);
    performersByUser.set(r.user_id, existing);
  }

  const performersList: PerformerInfo[] = Array.from(performersByUser.values()).map(
    ({ user, sum, reports }) => {
      const mainReport = reports[0];
      return {
        user_id: user.id,
        full_name: user.full_name,
        direction_id: mainReport.direction_id,
        direction_name: getDirectionShortName(mainReport.direction_id, 50),
        identified_sum: sum,
        pct: 0, // TODO: kunlik reja bilan solishtirish kerak
      };
    }
  );

  performersList.sort((a, b) => b.identified_sum - a.identified_sum);

  const topPerformers = performersList.slice(0, 3);
  const bottomPerformers = performersList.filter((p) => p.identified_sum > 0).slice(-3).reverse();

  // 3. AI'ga raqamlarni emas, balki structured ma'lumotni berib tahlil so'rash
  const summary = await generateAITextSummary({
    date: input.date,
    submittedCount: input.reports.length,
    missingCount: input.missingData.length,
    totalIdentified,
    totalCollected,
    totalXyus,
    topPerformers,
    bottomPerformers,
  });

  return {
    summary: summary.summary,
    topPerformers,
    bottomPerformers,
    totalIdentified,
    totalCollected,
    totalXyus,
  };
}

interface AISummaryInput {
  date: Date;
  submittedCount: number;
  missingCount: number;
  totalIdentified: number;
  totalCollected: number;
  totalXyus: number;
  topPerformers: PerformerInfo[];
  bottomPerformers: PerformerInfo[];
}

async function generateAITextSummary(
  input: AISummaryInput
): Promise<{ summary: string }> {
  const systemPrompt = `Siz Jomboy tuman hokimligi uchun soliq tushumlari va iqtisodiy tahlil bo'yicha professional tahlilchisiz.
  
Vazifangiz: Berilgan kunlik hisobotlar asosida Tuman Hokimiga "IDEAL" tahliliy xulosa (SUMMARY) tayyorlash.

Tahlilda quyidagilarga e'tibor bering:
1. Umumiy holat: Bugungi natijalar o'tgan kunlarga nisbatan qanday? (Trend).
2. Intizom: Nechta xodim hisobot bermadi va bu qaysi sohalarga zarar keltirmoqda?
3. Samaradorlik: Eng yuqori natija ko'rsatganlar va eng sust ishlayotganlar o'rtasidagi farq.
4. Tavsiya: Vaziyatni yaxshilash uchun qaysi tashkilotlar bilan qat'iy ishlash kerak?

Til: Rasmiy o'zbek tili (Lotin yozuvida).
Uslub: Tanqidiy va tahliliy.
Uzunlik: 200-300 so'z atrofida.

Muhim: Raqamlarni shunchaki sanab bermang (ular jadvalda bor), xulosa bering!`;

  const userMessage = `Bugungi sana: ${formatDate(input.date)}

📊 STATISTIKA:
- Jami xodimlar: ${input.submittedCount + input.missingCount}
- Hisobot berganlar: ${input.submittedCount}
- Hisobot BERMAGANLAR: ${input.missingCount}

💰 NATIJALAR:
- Aniqlangan jami: ${formatMoney(input.totalIdentified)}
- Undirilgan jami: ${formatMoney(input.totalCollected)}
- XYUS (ishlar soni): ${input.totalXyus} ta

🟢 ETAKCHI XODIMLAR:
${input.topPerformers
  .map((p, i) => `${i + 1}. ${p.full_name} (${p.direction_name}) — ${formatMoney(p.identified_sum)}`)
  .join("\n")}

🔴 ENG SUST XODIMLAR:
${input.bottomPerformers
  .map((p, i) => `${i + 1}. ${p.full_name} (${p.direction_name}) — ${formatMoney(p.identified_sum)}`)
  .join("\n")}

Hokim uchun mukammal tahliliy xulosa tayyorlang.`;

  try {
    const response = await callGemini({
      systemPrompt,
      userMessage,
      temperature: 0.4,
    });

    // Parse SUMMARY qismini ajratish
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]+)/i);

    return {
      summary: summaryMatch?.[1]?.trim() ?? response,
    };
  } catch (err) {
    logger.error({ err }, "AI summary generation failed");
    return {
      summary: "Bugungi xulosa avtomatik yaratilolmadi. Ma'lumotlarni qo'lda ko'rib chiqing.",
    };
  }
}
