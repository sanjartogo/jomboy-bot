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
  const systemPrompt = `Sen Jomboy tuman hokimligi uchun soliq nazorati bo'yicha tahlilchisan.

Vazifang: Berilgan ma'lumotlar asosida hokimga qisqa hisobot (SUMMARY) yozish:
1. SUMMARY: 3-4 jumla — kunning umumiy holati. Qaysi sohalar yaxshi, qaysilari sust.

Til: rasmiy o'zbek tilida (kirill yozuvida).
Format: faqat "SUMMARY:" bilan boshlanuvchi matn.
Uzunlik: jami 150-200 so'z.

Raqamlarni qayta yozma (men ularni allaqachon ko'rib chiqaman) — faqat MA'NOSI haqida yoz:
- Trend nima ko'rsatmoqda?
- Qaysi yo'nalishlarga e'tibor kerak?
- Sustkash mas'ullar bilan qanday ishlash kerak?`;

  const userMessage = `Bugungi sana: ${formatDate(input.date)}

Hisobot bergan mas'ullar: ${input.submittedCount}
Hisobot bermagan: ${input.missingCount}

Bugungi natijalar:
- Aniqlangan summa: ${formatMoney(input.totalIdentified)}
- Undirilgan summa: ${formatMoney(input.totalCollected)}
- Bajarilgan ishlar/XYUS soni: ${input.totalXyus} ta

ETAKCHILAR (top-3):
${input.topPerformers
  .map(
    (p, i) =>
      `${i + 1}. ${p.full_name} — ${p.direction_name} — ${formatMoney(p.identified_sum)}`
  )
  .join("\n")}

ENG PAST 3:
${input.bottomPerformers
  .map(
    (p, i) =>
      `${i + 1}. ${p.full_name} — ${p.direction_name} — ${formatMoney(p.identified_sum)}`
  )
  .join("\n")}

Hokim uchun qisqa tahlil yoz. (Tavsiya berish shart emas).`;

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
