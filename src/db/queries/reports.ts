import { supabase } from "@/db/supabase";
import { logger } from "@/utils/logger";
import { todayISO, daysAgo } from "@/utils/date";
import { format } from "date-fns";
import type { Report } from "@/types";

interface CreateReportInput {
  user_id: string;
  direction_id: number;
  report_date: string;
  xyus_count: number | null;
  identified_sum: number | null;
  collected_sum: number | null;
  comment?: string | null;
  source_type: "excel" | "image" | "text" | "manual";
  source_file_url?: string | null;
  raw_input?: string | null;
  ai_confidence?: number;
  ai_warnings?: string[];
  needs_review?: boolean;
}

export async function upsertReport(input: CreateReportInput): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .upsert(
      {
        ...input,
        ai_confidence: input.ai_confidence ?? 1.0,
        ai_warnings: input.ai_warnings ?? [],
        needs_review: input.needs_review ?? false,
      },
      { onConflict: "user_id,direction_id,report_date" }
    )
    .select()
    .single();

  if (error) {
    logger.error({ error, input }, "Failed to upsert report");
    return null;
  }
  return data as Report;
}

export async function getReportsByDate(date: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("report_date", date);

  if (error) {
    logger.error({ error, date }, "Failed to get reports by date");
    return [];
  }
  return (data ?? []) as Report[];
}

export async function getUserReportsByDate(
  userId: string,
  date: string
): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .eq("report_date", date);

  if (error) {
    logger.error({ error, userId, date }, "Failed to get user reports");
    return [];
  }
  return (data ?? []) as Report[];
}

/**
 * User'ning oxirgi N kunlik hisobotlari
 */
export async function getUserReportsLastDays(
  userId: string,
  days: number
): Promise<Report[]> {
  const since = format(daysAgo(days), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .gte("report_date", since)
    .order("report_date", { ascending: false });

  if (error) {
    logger.error({ error, userId, days }, "Failed to get recent reports");
    return [];
  }
  return (data ?? []) as Report[];
}

export async function getUsersWhoMissedToday(): Promise<{ user_id: string; missing_direction_ids: number[]; submitted_direction_ids: number[] }[]> {
  const today = todayISO();

  const { data: masullar, error: e1 } = await supabase
    .from("users")
    .select("id, direction_ids")
    .eq("role", "masul")
    .eq("is_active", true);

  if (e1 || !masullar) {
    logger.error({ error: e1 }, "Failed to get masullar");
    return [];
  }

  const { data: reportedUsers, error: e2 } = await supabase
    .from("reports")
    .select("user_id, direction_id")
    .eq("report_date", today);

  if (e2) {
    logger.error({ error: e2 }, "Failed to get today's reports");
    return [];
  }

  // Globally submitted directions today (by anyone)
  const globallySubmittedDirs = new Set((reportedUsers || []).map(r => r.direction_id));

  const result: { user_id: string; missing_direction_ids: number[]; submitted_direction_ids: number[] }[] = [];

  for (const user of masullar) {
    const assignedDirIds = user.direction_ids || [];
    
    // Agar bitta yo'nalish bo'yicha kamida 1 kishi hisobot topshirgan bo'lsa, 
    // u shu yo'nalishga mas'ul bo'lgan barchaga "topshirildi" deb hisoblanadi.
    const missingDirIds = assignedDirIds.filter(d => !globallySubmittedDirs.has(d));
    const submittedDirIds = assignedDirIds.filter(d => globallySubmittedDirs.has(d));
    
    if (missingDirIds.length > 0) {
      result.push({
        user_id: user.id,
        missing_direction_ids: missingDirIds,
        submitted_direction_ids: submittedDirIds
      });
    }
  }

  return result;
}

export async function getReportStats(date: string): Promise<{
  totalIdentified: number;
  totalCollected: number;
  count: number;
}> {
  const reports = await getReportsByDate(date);
  return {
    totalIdentified: reports.reduce((s, r) => s + (r.identified_sum ?? 0), 0),
    totalCollected: reports.reduce((s, r) => s + (r.collected_sum ?? 0), 0),
    count: reports.length,
  };
}
