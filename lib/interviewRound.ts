import type { Schedule } from "./types";
import { normalizeOfferType } from "./offerType";
import { normalizeWrittenRound } from "./writtenRound";

/** 面试文案完全个性化：只清理空白和限长，不再剥离任何后缀。 */
export function normalizeInterviewRound(value?: string) {
  return (value || "").trim().replace(/\s+/g, "").slice(0, 12);
}

/** 兼容旧数据：从历史“具体事项”中识别常见面试轮次，返回完整文案（如“一面”“AI面”）。 */
export function inferInterviewRound(detail?: string) {
  const compact = (detail || "").replace(/\s+/g, "");
  const match = compact.match(/(AI|HR|主管|业务|终|群|[一二三四五六七八九十\d]+)面/iu);
  return normalizeInterviewRound(match?.[0]);
}

/** 未通过说明同样完全个性化。 */
export function normalizeFailNote(value?: string) {
  return (value || "").trim().replace(/\s+/g, "").slice(0, 12);
}

/**
 * 日程在界面上的环节文案。
 *
 * 轮次只从结构化的 interviewRound / writtenRound / offerType / failNote 读取，
 * 不再回退到自由文本，避免同一语义有两个展示来源。
 * 存储的即完整文案，界面原样展示，不再拼接“笔”“面”等后缀字。
 */
export function getScheduleStageLabel(schedule: Schedule) {
  if (schedule.stage === "面试") {
    return normalizeInterviewRound(schedule.interviewRound) || "面试";
  }
  if (schedule.stage === "笔试") {
    return normalizeWrittenRound(schedule.writtenRound) || "笔试";
  }
  if (schedule.stage === "Offer") {
    return normalizeOfferType(schedule.offerType) || "Offer";
  }
  if (schedule.stage === "未通过") {
    return normalizeFailNote(schedule.failNote) || "未通过";
  }
  return schedule.stage;
}
