import type { Context, SessionFlavor } from "grammy";
import type { User, PendingReport } from "@/types";

export interface SessionData {
  pendingReport?: PendingReport;
  awaitingDirection?: boolean;
  selectedFromList?: number; // pending report index user is editing
  registrationOrg?: string;
  registrationName?: string;
  step?: 'awaiting_name' | 'awaiting_contact' | 'awaiting_support_message' | 'awaiting_report' | 'awaiting_new_user_name' | 'awaiting_new_user_id' | 'awaiting_new_user_role';
  selectedDirectionId?: number;
  newUserName?: string;
  newUserId?: number;
}

export type BotContext = Context &
  SessionFlavor<SessionData> & {
    user?: User;
  };
