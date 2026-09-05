import { Download, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CohortSelector } from "./CohortSelector";
import { SearchBar } from "./SearchBar";
import { SlidingSegmentedControl } from "./SlidingSegmentedControl";

export type AppView = "dashboard" | "list" | "calendar";

const TAB_VALUES: AppView[] = ["dashboard", "list", "calendar"];
const TAB_LABELS: Record<AppView, string> = {
  dashboard: "看板",
  list: "列表",
  calendar: "日历",
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
  const searchArea = useRef<HTMLDivElement>(null);

  // 有搜索词时保持驻留；空搜索点外部收起，按钮始终可手动开关。
  const closeAndClearSearch = () => {
    setSearchOpen(false);
    if (search) onSearchChange("");
  };

  useEffect(() => {
    if (!searchOpen || search.trim()) return;
    const closeOutside = (event: PointerEvent) => {
      if (!searchArea.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [searchOpen, search]);

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
    <header className="relative z-40 border-b border-white/80 bg-white/78 shadow-[0_1px_0_rgba(31,35,41,0.05),0_6px_22px_rgba(31,35,41,0.035)] backdrop-blur-xl">
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
            className="pointer-events-auto w-[330px]"
            getLabel={(tab) => TAB_LABELS[tab]}
            onChange={onChange}
            options={TAB_VALUES}
            value={view}
          />
        </div>

        {/* 右：操作区 */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="relative" ref={searchArea}>
            <button
              aria-expanded={searchOpen}
              aria-label="搜索"
              className={searchOpen
                ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#bfd0ff] bg-[#eaf1ff] text-[#245bdb] shadow-[0_2px_8px_rgba(51,112,255,0.12)] transition hover:bg-[#dce8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25"
                : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/80 bg-white/70 text-[#4e5969] shadow-[0_1px_4px_rgba(31,35,41,0.06)] backdrop-blur-xl transition hover:border-[#d7dae0] hover:bg-white hover:text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/25"}
              onClick={() => setSearchOpen((open) => !open)}
              type="button"
            >
              <Search className="h-4 w-4" />
            </button>
            {/* Word 式查找浮层：在图标右下方弹出，不占布局 */}
            {searchOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-xl border border-white/80 bg-white/95 p-2 shadow-[0_10px_28px_rgba(31,35,41,0.14),0_2px_6px_rgba(31,35,41,0.08)] backdrop-blur-xl">
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
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-white/80 bg-white/70 px-3.5 text-sm font-medium text-[#4e5969] shadow-[0_1px_4px_rgba(31,35,41,0.06)] backdrop-blur-xl transition hover:border-[#d7dae0] hover:bg-white hover:text-[#1f2329] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/20"
            href={exportHref}
          >
            <Download className="h-4 w-4" />
            导出 Excel
          </a>
          <button
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#3370ff] px-3.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(51,112,255,0.22)] transition hover:bg-[#2865e8] hover:shadow-[0_6px_16px_rgba(51,112,255,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/30 focus-visible:ring-offset-2"
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
