import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder = "搜索公司 / 岗位 / 环节",
  ariaLabel = "搜索公司、岗位或环节",
  className,
  autoFocus = false,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  autoFocus?: boolean;
  onClear?: () => void;
}) {
  return (
    <label className={cn("group relative block w-full sm:w-[260px]", className)}>
      <span className="sr-only">{ariaLabel}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        autoFocus={autoFocus}
        className="h-9 w-full rounded-lg border border-[#dee0e3] bg-white pl-9 pr-9 text-sm text-[#1f2329] outline-none transition placeholder:text-[#8f959e] focus:border-[#3370ff]/60 focus:ring-2 focus:ring-[#3370ff]/10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        role="searchbox"
        type="text"
        value={value}
      />
      {value ? (
        <button
          aria-label="清空搜索"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => (onClear ? onClear() : onChange(""))}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </label>
  );
}
