import { normalizeRecruitmentBatch } from "@/lib/recruitmentBatch";
import type { RecruitmentBatch } from "@/lib/types";
import { cn } from "@/lib/utils";

const BATCH_STYLES: Record<RecruitmentBatch, { badge: string; dot: string }> = {
  提前批: {
    badge: "border-rose-100 bg-rose-50 text-rose-600",
    dot: "bg-rose-400",
  },
  秋招: {
    badge: "border-amber-100 bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  春招: {
    badge: "border-cyan-100 bg-cyan-50 text-cyan-700",
    dot: "bg-cyan-400",
  },
  暑期实习: {
    badge: "border-teal-100 bg-teal-50 text-teal-700",
    dot: "bg-teal-400",
  },
  日常实习: {
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

export function RecruitmentBatchBadge({ batch }: { batch?: string }) {
  const normalizedBatch = normalizeRecruitmentBatch(batch);
  const styles = BATCH_STYLES[normalizedBatch];

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium leading-none",
        styles.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {normalizedBatch}
    </span>
  );
}
