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
  source_type: "excel" | "image" | "text" | "manual" | "voice" | "video" | "audio" | "document";
  source_file_url?: string | null;
  raw_input?: string | null;
  ai_confidence?: number;
  ai_warnings?: string[];
  needs_review?: boolean;
  status?: "submitted" | "reviewed" | "rejected";
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
        status: input.status ?? "submitted",
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

export async function getDetailedSlackersReport(): Promise<{
  org_name: string;
  users: {
    full_name: string;
    missing_directions: string[];
    submitted_count: number;
    total_count: number;
  }[];
  is_unregistered: boolean;
}[]> {
  const { ORGANIZATIONS } = await import("@/config/organizations");
  const { getDirection } = await import("@/config/directions");
  const today = todayISO();

  // 1. Faol mas'ullarni olish
  const { data: masullar, error: e1 } = await supabase
    .from("users")
    .select("id, full_name, direction_ids, organization")
    .eq("role", "masul")
    .eq("is_active", true);

  if (e1) {
    logger.error({ error: e1 }, "Failed to get masullar for slackers report");
    return [];
  }

  // 2. Bugungi hisobotlarni olish
  const { data: todayReports, error: e2 } = await supabase
    .from("reports")
    .select("direction_id, user_id")
    .eq("report_date", today);

  if (e2) {
    logger.error({ error: e2 }, "Failed to get reports for slackers report");
    return [];
  }

  const submittedDirIdsGlobal = new Set((todayReports || []).map(r => r.direction_id));

  const report: any[] = [];

  for (const org of ORGANIZATIONS) {
    const orgUsers = (masullar || []).filter(u => u.organization === org);
    
    if (orgUsers.length === 0) {
      report.push({
        org_name: org,
        users: [],
        is_unregistered: true
      });
      continue;
    }

    const userData = orgUsers.map(user => {
      const assignedDirIds = user.direction_ids || [];
      const missingDirIds = assignedDirIds.filter((d: number) => !submittedDirIdsGlobal.has(d));
      const submittedDirIds = assignedDirIds.filter((d: number) => submittedDirIdsGlobal.has(d));

      return {
        full_name: user.full_name,
        missing_directions: missingDirIds.map((id: number) => getDirection(id)?.name || `№${id}`),
        submitted_count: submittedDirIds.length,
        total_count: assignedDirIds.length
      };
    });

    report.push({
      org_name: org,
      users: userData,
      is_unregistered: false
    });
  }

  return report;
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
export async function updateReportStatus(
  reportId: string,
  status: "submitted" | "reviewed" | "rejected"
): Promise<boolean> {
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    logger.error({ error, reportId, status }, "Failed to update report status");
    return false;
  }
  return true;
}
