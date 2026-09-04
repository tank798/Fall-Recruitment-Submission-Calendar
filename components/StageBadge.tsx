import { STAGE_STYLES } from "@/lib/stageStyles";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

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
