import type { Context, SessionFlavor } from "grammy";
import type { User, PendingReport } from "@/types";

export interface SessionData {
  pendingReport?: PendingReport;
  awaitingDirection?: boolean;
  selectedFromList?: number; // pending report index user is editing
  registrationOrg?: string;
  step?: 'awaiting_name' | 'awaiting_support_message' | 'awaiting_report';
  selectedDirectionId?: number;
}

export type BotContext = Context &
  SessionFlavor<SessionData> & {
    user?: User;
  };
