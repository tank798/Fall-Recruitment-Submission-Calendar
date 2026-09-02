import type { Stage } from "@/lib/types";
import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

export type StageFilterValue = "全部" | Stage;

const OPTIONS: StageFilterValue[] = ["全部", "投递", "测评", "笔试", "面试", "未通过"];

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
      className="w-[420px] [&_button]:whitespace-nowrap"
      compact
      onChange={onChange}
      options={OPTIONS}
      value={value}
    />
  );
}
