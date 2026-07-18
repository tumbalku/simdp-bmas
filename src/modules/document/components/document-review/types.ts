import type { ComponentType, ReactNode } from "react";

export type ReviewStatusConfig = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
};

export type ReviewInfoField = {
  key: string;
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  hidden?: boolean;
};

export type ReviewHistoryItem = {
  id: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewerName: string;
};
