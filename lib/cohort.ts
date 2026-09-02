export interface CohortDateRange {
  startDate: string;
  endDate: string;
}

const CHINA_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Shanghai",
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getCohortDateRange(graduationYear: number): CohortDateRange {
  if (!Number.isInteger(graduationYear) || graduationYear < 2000 || graduationYear > 2200) {
    throw new Error("届别年份无效");
  }

  return {
    startDate: `${graduationYear - 1}-03-01`,
    endDate: `${graduationYear}-07-01`,
  };
}

export function formatCohortLabel(graduationYear: number) {
  return `${String(graduationYear).slice(-2)}届`;
}

export function getTodayInChina(now = new Date()) {
  return CHINA_DATE_FORMATTER.format(now);
}

export function getDefaultGraduationYear(today = getTodayInChina()) {
  const [year, month] = today.split("-").map(Number);
  return month >= 3 ? year + 1 : year;
}

export function getCohortOptions(anchorYear = getDefaultGraduationYear()) {
  return Array.from({ length: 5 }, (_, index) => anchorYear - 1 + index);
}

export function isDateInRange(date: string, range: CohortDateRange) {
  return date >= range.startDate && date <= range.endDate;
}

export function clampDateToRange(date: string, range: CohortDateRange) {
  if (date < range.startDate) return range.startDate;
  if (date > range.endDate) return range.endDate;
  return date;
}

export function listDatesInRange(range: CohortDateRange) {
  const [startYear, startMonth, startDay] = range.startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = range.endDate.split("-").map(Number);
  const current = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  const dates: string[] = [];

  while (current.getTime() <= end) {
    dates.push(
      `${current.getUTCFullYear()}-${pad(current.getUTCMonth() + 1)}-${pad(current.getUTCDate())}`,
    );
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}
