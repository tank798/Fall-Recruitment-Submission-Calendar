import { getTodayInChina } from "./cohort";
import { getCompanyDisplayName, getCompanyMatchKey } from "./companyNames";
import { getScheduleStageLabel } from "./interviewRound";
import { getJobKey, getRecruitmentStats } from "./recruitmentStats";
import type { Schedule, Stage } from "./types";

export type PosterKind = "today" | "overview" | "application" | "written" | "interview" | "offer" | "rejected";

export const POSTER_TITLES: Record<PosterKind, string> = {
  today: "今日进展",
  overview: "秋招全景",
  application: "投递记录",
  written: "笔试记录",
  interview: "面试记录",
  offer: "录用记录",
  rejected: "未通过记录",
};

const KIND_STAGE: Partial<Record<PosterKind, Stage>> = {
  application: "投递",
  written: "笔试",
  interview: "面试",
  offer: "Offer",
  rejected: "未通过",
};

const STAGES: Stage[] = ["投递", "笔试", "面试", "Offer", "未通过"];
const STAGE_TEXT: Record<Stage, string> = {
  投递: "投递",
  笔试: "笔试",
  面试: "面试",
  Offer: "录用",
  未通过: "未通过",
};

/** 今日海报保留当天全部事件；单环节与全景按公司＋岗位去重，保留最新进展。 */
export function getPosterEntries(schedules: Schedule[], kind: PosterKind, today = getTodayInChina()) {
  const occurred = schedules.filter((schedule) => schedule.date <= today);
  if (kind === "today") {
    return occurred.filter((schedule) => schedule.date === today).sort((a, b) => a.company.localeCompare(b.company, "zh-CN"));
  }
  const stage = KIND_STAGE[kind];
  const filtered = stage ? occurred.filter((schedule) => schedule.stage === stage) : occurred;
  const jobs = new Map<string, Schedule>();
  filtered
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
    .forEach((schedule) => {
      const key = getJobKey(schedule.company, schedule.position);
      if (!jobs.has(key)) jobs.set(key, schedule);
    });
  return [...jobs.values()];
}

export function getPosterSummary(schedules: Schedule[], kind: PosterKind, today = getTodayInChina()) {
  const occurred = schedules.filter((schedule) => schedule.date <= today);
  const scope = kind === "today" ? occurred.filter((schedule) => schedule.date === today) : occurred;
  const { counts, totalJobs } = getRecruitmentStats(scope);
  // 今日分享按当天事件计数，使五个环节的合计与主数字一致。
  const displayCounts = kind === "today"
    ? Object.fromEntries(STAGES.map((stage) => [stage, scope.filter((item) => item.stage === stage).length])) as Record<Stage, number>
    : counts;
  const entries = getPosterEntries(schedules, kind, today);
  return {
    entries,
    counts: displayCounts,
    totalJobs,
    companies: new Set(entries.map((schedule) => getCompanyMatchKey(schedule.company))).size,
  };
}

/** 以编辑设计风格生成 3:4 高清 PNG；全部绘制在浏览器本地完成。 */
export async function renderPoster(schedules: Schedule[], kind: PosterKind, showNames: boolean) {
  await document.fonts.ready;
  const today = getTodayInChina();
  const { entries, counts, totalJobs, companies } = getPosterSummary(schedules, kind, today);
  const stage = KIND_STAGE[kind];
  const shown = entries.slice(0, 7);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器无法生成海报");

  const fontStack = "'Songti SC','Noto Serif CJK SC','Source Han Serif SC','PingFang SC',serif";
  const sansStack = "'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif";
  const setFont = (size: number, weight = 400, serif = false) => {
    ctx.font = `${weight} ${size}px ${serif ? fontStack : sansStack}`;
  };
  const text = (value: string, x: number, y: number, size: number, color = "#172033", weight = 400, serif = false, align: CanvasTextAlign = "left") => {
    ctx.fillStyle = color;
    setFont(size, weight, serif);
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
    ctx.textAlign = "left";
  };
  const fit = (value: string, maxWidth: number, size: number, weight = 400) => {
    setFont(size, weight);
    if (ctx.measureText(value).width <= maxWidth) return value;
    let result = value;
    while (result && ctx.measureText(`${result}…`).width > maxWidth) result = result.slice(0, -1);
    return `${result}…`;
  };
  const rule = (x1: number, y1: number, x2: number, y2: number, color = "#D8D5CF", width = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const paper = "#F2EDE2";
  const ink = "#272923";
  const muted = "#87867E";
  const vermilion = "#B94D34";
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 1080, 1440);

  // 右侧铜版线描般的连续曲线：只构成画面，不编码统计数值。
  ctx.save();
  ctx.beginPath();
  ctx.rect(420, 230, 660, 710);
  ctx.clip();
  for (let index = 0; index < 34; index++) {
    ctx.beginPath();
    const offset = index * 9;
    switch (kind) {
      case "today":
        ctx.moveTo(435 + index * 8, 970);
        ctx.bezierCurveTo(1030 + index * 4, 735, 405 + index * 11, 385, 1115, 268 + index * 8);
        break;
      case "overview":
        ctx.moveTo(470, 960 - offset);
        ctx.bezierCurveTo(670, 910 - offset, 775, 550 - offset, 1120, 660 - offset);
        break;
      case "application":
        ctx.moveTo(615, 940);
        ctx.lineTo(740 + index * 5, 430 + offset);
        ctx.lineTo(1110, 310 + offset);
        break;
      case "written":
        ctx.moveTo(630 + index * 4, 890 - offset / 3);
        ctx.lineTo(900 + index * 3, 720 - offset);
        ctx.lineTo(665 + index * 5, 570 - offset / 2);
        break;
      case "interview":
        ctx.ellipse(1060, 610, 230 + index * 6, 150 + index * 7, -0.48, 1.2, 4.5);
        break;
      case "offer": {
        const angle = -2.4 + index * 0.1;
        ctx.moveTo(880 + Math.cos(angle) * 80, 650 + Math.sin(angle) * 80);
        ctx.lineTo(880 + Math.cos(angle) * 325, 650 + Math.sin(angle) * 325);
        break;
      }
      case "rejected":
        ctx.ellipse(960, 660, 190 + index * 4, 155 + index * 5, 0.25, -1.2, 3.9);
        break;
    }
    ctx.strokeStyle = index % 5 === 0 ? "#A34C35" : "#C28366";
    ctx.lineWidth = index % 5 === 0 ? 1.8 : 1;
    ctx.stroke();
  }
  ctx.restore();

  text(today.slice(0, 4), 74, 93, 24, ink, 500);
  text(`${Number(today.slice(5, 7))}月${Number(today.slice(8))}日`, 1006, 93, 24, ink, 400, false, "right");
  rule(74, 120, 1006, 120, ink);
  const title = POSTER_TITLES[kind];
  text(title, 68, 295, title.length > 4 ? 118 : 146, ink, 600, true);
  ctx.fillStyle = vermilion;
  ctx.fillRect(76, 335, 44, 5);

  const primaryValue = stage ? counts[stage] : kind === "today" ? entries.length : totalJobs;
  const numeral = String(primaryValue).padStart(2, "0");
  const numeralSize = numeral.length > 3 ? 240 : 328;
  // 以主数字压住线描左侧，保持阅读区干净。
  ctx.fillStyle = paper;
  ctx.fillRect(60, 430, numeral.length > 2 ? 520 : 380, 325);
  text(numeral, 58, 735, numeralSize, ink, 400, true);
  text(kind === "today" ? "条记录" : "个岗位", 78, 795, 27, ink);
  text(`涉及 ${companies} 家公司`, 78, 839, 20, muted);

  const dividerY = showNames && entries.length ? 890 : 1010;
  rule(74, dividerY, 1006, dividerY, "#ABA99E");
  if (showNames && entries.length) {
    shown.forEach((entry, index) => {
      const y = 937 + index * 49;
      text(fit(getCompanyDisplayName(entry.company), 238, 22, 500), 76, y, 22, ink, 500);
      text(fit(entry.position, 370, 19), 340, y, 19, muted);
      text(fit(getScheduleStageLabel(entry).replaceAll("Offer", "录用"), 255, 18), 1006, y, 18, vermilion, 400, false, "right");
    });
    if (entries.length > shown.length) text(`另有 ${entries.length - shown.length} 条记录`, 76, 1302, 18, muted);
  } else {
    // 五项数字压在同一基线上；不像表单，不再堆叠成五行统计表。
    STAGES.forEach((item, index) => {
      const x = 76 + index * 188;
      text(STAGE_TEXT[item], x, 1070, 23, muted);
      text(String(counts[item]).padStart(2, "0"), x - 3, 1168, 66, stage === item ? vermilion : ink, 400, true);
    });
  }
  rule(74, 1340, 1006, 1340, ink);
  return canvas.toDataURL("image/png");
}
