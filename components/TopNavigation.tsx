import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

export type AppView = "timeline" | "time-axis" | "companies";

const TAB_VALUES: AppView[] = ["timeline", "time-axis", "companies"];
const TAB_LABELS: Record<AppView, string> = {
  timeline: "时间表",
  "time-axis": "时间轴",
  companies: "公司与岗位",
};

export function TopNavigation({
  view,
  onChange,
}: {
  view: AppView;
  onChange: (view: AppView) => void;
}) {
  return (
    <header className="relative z-40 grid h-[72px] shrink-0 grid-cols-[minmax(240px,1fr)_456px_minmax(240px,1fr)] items-center border-b border-[#e5e6e8] bg-white px-8">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-[-0.02em] text-[#1f2329]">
          秋招时间表
        </h1>
        <p className="mt-0.5 truncate text-xs text-[#8f959e]">记录你的每一步</p>
      </div>
      <SlidingSegmentedControl
        ariaLabel="页面切换"
        className="w-full"
        getLabel={(tab) => TAB_LABELS[tab]}
        onChange={onChange}
        options={TAB_VALUES}
        value={view}
      />
      <div aria-hidden="true" />
    </header>
  );
}
