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
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    chip: "bg-emerald-50 text-emerald-700",
  },
  笔试: {
    dot: "bg-blue-500",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    chip: "bg-blue-50 text-blue-700",
  },
  面试: {
    dot: "bg-violet-500",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    chip: "bg-violet-50 text-violet-700",
  },
  Offer: {
    dot: "bg-rose-500",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    chip: "bg-rose-50 text-rose-700",
  },
  未通过: {
    dot: "bg-red-500",
    badge: "border-red-200 bg-red-50 text-red-700",
    chip: "bg-red-50 text-red-700",
  },
};
