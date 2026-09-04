import { Download, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { CohortSelector } from "./CohortSelector";
import { SearchBar } from "./SearchBar";
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
  search,
  exportHref,
  onChange,
  onSearchChange,
  onAdd,
}: {
  view: AppView;
  search: string;
  exportHref: string;
  onChange: (view: AppView) => void;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Word 式搜索：搜索后浮层一直驻留，只有框内叉号或 Esc 会清空并收起。
  const closeAndClearSearch = () => {
    setSearchOpen(false);
    if (search) onSearchChange("");
  };

  useEffect(() => {
    if (!searchOpen) return;
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeAndClearSearch();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [searchOpen, search]);

  return (
    <header className="relative z-40 border-b border-[#e5e6e8] bg-white">
      <div className="flex h-[64px] items-center gap-3 px-4 sm:px-6">
        {/* 左：标题 */}
        <div className="hidden shrink-0 sm:block sm:w-[150px]">
          <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-[#1f2329]">
            秋招时间表
          </h1>
          <p className="mt-0.5 truncate text-[11px] text-[#8f959e]">记录你的每一步</p>
        </div>

        {/* 中：页签（绝对定位保证视觉居中，不受左右内容宽度影响） */}
        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <SlidingSegmentedControl
            ariaLabel="页面切换"
            className="pointer-events-auto w-[360px]"
            getLabel={(tab) => TAB_LABELS[tab]}
            onChange={onChange}
            options={TAB_VALUES}
            value={view}
          />
        </div>

        {/* 右：操作区 */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              aria-expanded={searchOpen}
              aria-label="搜索"
              className={searchOpen
                ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e1eaff] text-[#245bdb] transition hover:bg-[#d4e2ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25"
                : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dee0e3] bg-white text-[#4e5969] transition hover:border-[#c9cdd4] hover:bg-[#f7f8fa] hover:text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25"}
              onClick={() => setSearchOpen(true)}
              type="button"
            >
              <Search className="h-4 w-4" />
            </button>
            {/* Word 式查找浮层：在图标右下方弹出，不占布局 */}
            {searchOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-xl border border-[#dee0e3] bg-white p-2 shadow-[0_10px_28px_rgba(31,35,41,0.14),0_2px_6px_rgba(31,35,41,0.08)]">
                <SearchBar
                  autoFocus
                  className="w-full sm:w-full"
                  onClear={closeAndClearSearch}
                  onChange={onSearchChange}
                  value={search}
                />
              </div>
            ) : null}
          </div>
          <CohortSelector />
          <a
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-[#dee0e3] bg-white px-3.5 text-sm font-medium text-[#4e5969] transition hover:border-[#c9cdd4] hover:bg-[#f7f8fa] hover:text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/20 xl:inline-flex"
            href={exportHref}
          >
            <Download className="h-4 w-4" />
            导出 Excel
          </a>
          <button
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#3370ff] px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#2865e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/30 focus-visible:ring-offset-2"
            onClick={onAdd}
            type="button"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
      </div>
    </header>
  );
}
