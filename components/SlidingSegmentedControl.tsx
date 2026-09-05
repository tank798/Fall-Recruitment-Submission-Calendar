import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function SlidingSegmentedControl<Value extends string>({
  ariaLabel,
  className,
  compact = false,
  getLabel = (option) => option,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  compact?: boolean;
  getLabel?: (value: Value) => string;
  onChange: (value: Value) => void;
  options: readonly Value[];
  value: Value;
}) {
  const activeIndex = Math.max(0, options.indexOf(value));
  const columns = { "--segment-count": options.length } as CSSProperties;

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "segmented-slider relative isolate grid overflow-hidden rounded-full border border-white/80 bg-[#e9edf2]/70 p-[3px] shadow-[inset_0_1px_2px_rgba(99,115,140,0.08),0_1px_2px_rgba(31,35,41,0.04)] backdrop-blur-2xl",
        className,
      )}
      role="tablist"
      style={columns}
    >
      <span
        aria-hidden="true"
        className="segmented-slider-indicator pointer-events-none absolute bottom-[3px] left-[3px] top-[3px] rounded-full bg-white/85 shadow-[0_2px_5px_rgba(31,35,41,0.09),inset_0_1px_1px_white] ring-1 ring-white/90 backdrop-blur-xl"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {options.map((option) => (
        <button
          aria-selected={value === option}
          id={ariaLabel === "页面切换" ? `${option}-tab` : undefined}
          aria-controls={ariaLabel === "页面切换" ? `${option}-panel` : undefined}
          className={cn(
            "relative z-10 min-w-0 whitespace-nowrap rounded-[9px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370ff]/30",
            compact ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
            value === option ? "text-[#1f2329]" : "text-[#646a73] hover:text-[#1f2329]",
          )}
          key={option}
          onClick={() => onChange(option)}
          role="tab"
          type="button"
        >
          {getLabel(option)}
        </button>
      ))}
    </div>
  );
}
