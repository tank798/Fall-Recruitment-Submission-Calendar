import type { Schedule } from "./types";
import { inferOfferType, normalizeOfferType } from "./offerType";
import { inferWrittenRound, normalizeWrittenRound } from "./writtenRound";

/** 表单中只保存“面”前面的部分，例如 AI、一、终。 */
export function normalizeInterviewRound(value?: string) {
  return (value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/(?:面试|面)$/u, "")
    .slice(0, 12);
}

/** 兼容旧数据：从历史“具体事项”中识别常见面试轮次。 */
export function inferInterviewRound(detail?: string) {
  const compact = (detail || "").replace(/\s+/g, "");
  const match = compact.match(/(AI|HR|主管|业务|终|群|[一二三四五六七八九十\d]+)面/iu);
  return normalizeInterviewRound(match?.[1]);
}

export function getScheduleStageLabel(schedule: Schedule) {
  if (schedule.stage === "面试") {
    const round =
      normalizeInterviewRound(schedule.interviewRound) || inferInterviewRound(schedule.detail);
    return round ? `${round}面` : "面试";
  }
  if (schedule.stage === "笔试") {
    const round =
      normalizeWrittenRound(schedule.writtenRound) || inferWrittenRound(schedule.detail);
    return round ? `${round}笔` : "笔试";
  }
  if (schedule.stage === "Offer") {
    return normalizeOfferType(schedule.offerType) || inferOfferType(schedule.detail) || "Offer";
  }
  return schedule.stage;
}
