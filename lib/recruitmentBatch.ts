import { RECRUITMENT_BATCHES, type RecruitmentBatch } from "./types";

export const DEFAULT_RECRUITMENT_BATCH: RecruitmentBatch = "秋招";

export function normalizeRecruitmentBatch(value?: string): RecruitmentBatch {
  const text = value?.trim() || "";
  if ((RECRUITMENT_BATCHES as readonly string[]).includes(text)) {
    return text as RecruitmentBatch;
  }
  if (text.includes("提前")) return "提前批";
  if (text.includes("春招") || text.includes("春季")) return "春招";
  if (text.includes("暑期")) return "暑期实习";
  if (text.includes("日常")) return "日常实习";
  return DEFAULT_RECRUITMENT_BATCH;
}
