import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STAGE_STYLES: Record<Stage, { badge: string; dot: string }> = {
  投递: {
    badge: "border-emerald-100 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  测评: {
    badge: "border-orange-100 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  笔试: {
    badge: "border-blue-100 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  面试: {
    badge: "border-violet-100 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  Offer: {
    badge: "border-rose-100 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
};

export function StageBadge({ stage, label }: { stage: Stage; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium leading-none",
        STAGE_STYLES[stage].badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_STYLES[stage].dot)} />
      {label || stage}
    </span>
  );
}
