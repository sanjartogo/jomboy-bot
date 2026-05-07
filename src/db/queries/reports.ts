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

export async function upsertReport(input: CreateReportInput & { organization?: string | null }): Promise<Report | null> {
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

export async function getDetailedSlackersReport(): Promise<any[]> {
  const today = todayISO();

  // 1. Bugungi barcha hisobot yo'nalishlarini olish
  const { data: reports, error: re } = await supabase
    .from("reports")
    .select("direction_id")
    .eq("report_date", today);
    
  if (re) logger.error({ error: re }, "Error fetching reports");

  const doneDirIds = new Set((reports || []).map(r => r.direction_id));

  // 2. Barcha faol mas'ullarni olish
  const { data: users, error: ue } = await supabase
    .from("users")
    .select("id, full_name, organization, direction_ids")
    .eq("role", "masul")
    .eq("is_active", true)
    .order("organization", { ascending: true });

  if (ue) return [];

  // 3. Tashkilotlar bo'yicha guruhlash
  const orgMap = new Map<string, any[]>();
  
  for (const user of (users || [])) {
    const assignedIds = user.direction_ids || [];
    const doneCount = assignedIds.filter((id: number) => doneDirIds.has(id)).length;
    const totalCount = assignedIds.length;
    
    let status = "🔴 Topshirilmadi";
    let emoji = "🔴";
    
    if (totalCount > 0) {
      if (doneCount === totalCount) {
        status = "Bajarildi";
        emoji = "✅";
      } else if (doneCount > 0) {
        status = "Qisman";
        emoji = "🟡";
      }
    } else {
        emoji = "⚪";
        status = "Yo'nalish biriktirilmagan";
    }

    const userData = {
      full_name: user.full_name,
      doneCount,
      totalCount,
      status,
      emoji
    };

    const org = user.organization || "Boshqa";
    if (!orgMap.has(org)) orgMap.set(org, []);
    orgMap.get(org)?.push(userData);
  }

  const results = Array.from(orgMap.entries()).map(([orgName, users]) => ({
    orgName,
    users
  }));

  return results;
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

export async function getUsersWhoMissedToday(): Promise<any[]> {
  const today = todayISO();
  
  const { data: users, error: e1 } = await supabase
    .from("users")
    .select("id, full_name, organization")
    .eq("role", "masul")
    .eq("is_active", true);

  if (e1) return [];

  const { data: reports, error: e2 } = await supabase
    .from("reports")
    .select("user_id")
    .eq("report_date", today);

  if (e2) return [];

  const reportedUserIds = new Set((reports || []).map((r: any) => r.user_id));
  return (users || []).filter((u: any) => !reportedUserIds.has(u.id));
}

