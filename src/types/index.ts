export type UserRole = "masul" | "hokim" | "admin" | "nazoratchi";

export interface User {
  id: string;
  telegram_id: number;
  full_name: string;
  phone: string | null;
  role: UserRole;
  direction_ids: number[];
  organization: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Direction {
  id: number;
  name: string;
  responsible_org: string | null;
  yearly_plan_xyus: number;
  yearly_plan_sum: number; // mln so'm
  monthly_plan: Record<string, number>; // {"jan": 386, ...}
}

export interface Report {
  id: string;
  user_id: string;
  direction_id: number;
  report_date: string;
  xyus_count: number | null;
  identified_sum: number | null;
  collected_sum: number | null;
  comment: string | null;
  source_type: "excel" | "image" | "text" | "manual" | "voice" | "video" | "audio" | "document";
  source_file_url: string | null;
  raw_input: string | null;
  ai_confidence: number;
  ai_warnings: string[];
  needs_review: boolean;
  status: "submitted" | "reviewed" | "rejected";
  created_at: string;
}

export interface DailySummary {
  id: string;
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
  sent_to_hokim_at: string | null;
}

export interface PerformerInfo {
  user_id: string;
  full_name: string;
  direction_id: number;
  direction_name: string;
  pct: number; // 0-1
  identified_sum: number;
}

/**
 * AI parser javobi
 */
export interface ParsedReportData {
  directions: Array<{
    direction_id: number | null;
    direction_name_guess?: string;
    xyus_count: number | null;
    identified_sum: number | null;
    collected_sum: number | null;
    confidence: number;
  }>;
  warnings: string[];
  needs_clarification: boolean;
  raw_text?: string;
}

/**
 * Bot session uchun pending state (foydalanuvchi tasdiqlashidan oldin)
 */
export interface PendingReport {
  user_id: string;
  parsed_data: ParsedReportData;
  source_type: "excel" | "image" | "text" | "voice" | "video" | "audio" | "document";
  source_file_url?: string;
  raw_input?: string;
  expires_at: number; // Unix timestamp
}
