import { supabase } from "@/db/supabase";
import { logger } from "@/utils/logger";
import type { DailySummary, PerformerInfo } from "@/types";

interface CreateSummaryInput {
  summary_date: string;
  reports_submitted: number;
  reports_missing: number;
  missing_user_ids: string[];
  total_identified: number;
  total_collected: number;
  top_performers: PerformerInfo[];
  bottom_performers: PerformerInfo[];
  ai_summary: string;
  ai_recommendations: string;
}

export async function upsertDailySummary(
  input: CreateSummaryInput
): Promise<DailySummary | null> {
  const { data, error } = await supabase
    .from("daily_summaries")
    .upsert(input, { onConflict: "summary_date" })
    .select()
    .single();

  if (error) {
    logger.error({ error }, "Failed to upsert daily summary");
    return null;
  }
  return data as DailySummary;
}

export async function markSummarySent(summaryDate: string): Promise<void> {
  await supabase
    .from("daily_summaries")
    .update({ sent_to_hokim_at: new Date().toISOString() })
    .eq("summary_date", summaryDate);
}

export async function getSummaryByDate(date: string): Promise<DailySummary | null> {
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("summary_date", date)
    .maybeSingle();

  if (error) {
    logger.error({ error, date }, "Failed to get summary");
    return null;
  }
  return data as DailySummary | null;
}
