import type { Schedule, Stage } from "./types";

const CHINA_DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
  timeZone: "Asia/Shanghai",
});

export function formatChineseDate(date: string) {
  const parsed = new Date(`${date}T12:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return date || "日期待补充";
  return CHINA_DATE_FORMATTER.format(parsed).replace(/日(?=星期)/, "日 ");
}

export function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    if (dateOrder !== 0) return dateOrder;

    const leftTime = left.time || "99:99";
    const rightTime = right.time || "99:99";
    const timeOrder = leftTime.localeCompare(rightTime);
    if (timeOrder !== 0) return timeOrder;

    return left.company.localeCompare(right.company, "zh-CN");
  });
}

const STAGE_PRIORITY: Record<Stage, number> = {
  Offer: 1,
  面试: 2,
  笔试: 3,
  测评: 4,
  投递: 5,
};

export function sortSchedulesByStagePriority(schedules: Schedule[]) {
  return [...schedules].sort((left, right) => {
    const stageOrder = STAGE_PRIORITY[left.stage] - STAGE_PRIORITY[right.stage];
    if (stageOrder !== 0) return stageOrder;

    const timeOrder = (left.time || "99:99").localeCompare(right.time || "99:99");
    if (timeOrder !== 0) return timeOrder;

    return left.company.localeCompare(right.company, "zh-CN");
  });
}

export function formatShortDateTime(date: string, time: string) {
  return `${date.replaceAll("-", ".")}${time ? ` · ${time}` : ""}`;
}
