import type { Stage } from "@/lib/types";
import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

export type TimeAxisStageFilterValue = "全部" | Stage;

const OPTIONS: TimeAxisStageFilterValue[] = [
  "全部",
  "Offer",
  "面试",
  "笔试",
  "测评",
  "投递",
  "未通过",
];

export function TimeAxisStageFilter({
  value,
  onChange,
}: {
  value: TimeAxisStageFilterValue;
  onChange: (value: TimeAxisStageFilterValue) => void;
}) {
  return (
    <SlidingSegmentedControl
      ariaLabel="时间轴环节筛选"
      className="w-[480px] [&_button]:whitespace-nowrap"
      compact
      onChange={onChange}
      options={OPTIONS}
      value={value}
    />
  );
}
