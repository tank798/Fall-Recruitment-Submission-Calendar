import type { Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

export type StageFilterValue = "全部" | Stage;

const OPTIONS: StageFilterValue[] = ["全部", ...STAGES];

export function StageFilter({
  value,
  onChange,
}: {
  value: StageFilterValue;
  onChange: (value: StageFilterValue) => void;
}) {
  return (
    <SlidingSegmentedControl
      ariaLabel="按环节筛选"
      className="w-[348px]"
      compact
      onChange={onChange}
      options={OPTIONS}
      value={value}
    />
  );
}
