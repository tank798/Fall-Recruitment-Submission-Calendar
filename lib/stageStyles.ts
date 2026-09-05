import type { Stage } from "./types";

/**
 * 环节配色的唯一映射源。
 * 统计卡圆点、环节徽章、时间轴卡片色点、比率 chip 全部引用这里，
 * 避免同一个语义在系统里出现两套颜色。
 */
export interface StageStyle {
  /** 圆点 */
  dot: string;
  /** 徽章：边框 + 底色 + 文字 */
  badge: string;
  /** 比率 chip：底色 + 文字 */
  chip: string;
}

export const STAGE_STYLES: Record<Stage, StageStyle> = {
  投递: {
    dot: "bg-[#3370ff]",
    badge: "border-[#c9d8ff] bg-[#eef4ff] text-[#245bdb]",
    chip: "bg-[#eef4ff] text-[#245bdb]",
  },
  笔试: {
    dot: "bg-cyan-500",
    badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
    chip: "bg-cyan-50 text-cyan-700",
  },
  面试: {
    dot: "bg-violet-500",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    chip: "bg-violet-50 text-violet-700",
  },
  Offer: {
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    chip: "bg-amber-50 text-amber-700",
  },
  未通过: {
    dot: "bg-slate-400",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    chip: "bg-slate-100 text-slate-600",
  },
};
