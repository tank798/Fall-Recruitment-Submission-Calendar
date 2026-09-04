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

    const stageOrder = STAGE_PRIORITY[left.stage] - STAGE_PRIORITY[right.stage];
    if (stageOrder !== 0) return stageOrder;

    return left.company.localeCompare(right.company, "zh-CN");
  });
}

const STAGE_PRIORITY: Record<Stage, number> = {
  Offer: 1,
  面试: 2,
  笔试: 3,
  投递: 4,
  未通过: 5,
};

export function sortSchedulesByStagePriority(schedules: Schedule[]) {
  return [...schedules].sort((left, right) => {
    const stageOrder = STAGE_PRIORITY[left.stage] - STAGE_PRIORITY[right.stage];
    if (stageOrder !== 0) return stageOrder;

    return left.company.localeCompare(right.company, "zh-CN");
  });
}
