import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { Schedule } from "@/lib/types";
import { DateColumn } from "./DateColumn";

interface DragState {
  active: boolean;
  moved: boolean;
  pointerId: number;
  startX: number;
  scrollLeft: number;
}

const INITIAL_DRAG_STATE: DragState = {
  active: false,
  moved: false,
  pointerId: -1,
  startX: 0,
  scrollLeft: 0,
};

/** 渲染连续日期列，并同时支持原生滑动、滚轮、键盘和可选的鼠标拖拽。 */
export function HorizontalDateBoard({
  dates,
  schedulesByDate,
  targetDate,
  today,
  onSelect,
}: {
  dates: string[];
  schedulesByDate: Map<string, Schedule[]>;
  targetDate: string;
  today: string;
  onSelect: (schedule: Schedule) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({ ...INITIAL_DRAG_STATE });

  useLayoutEffect(() => {
    const board = boardRef.current;
    const column = board?.querySelector<HTMLElement>(`[data-date="${targetDate}"]`);
    if (!board || !column) return;

    const boardRect = board.getBoundingClientRect();
    const columnRect = column.getBoundingClientRect();
    const columnOffset = columnRect.left - boardRect.left + board.scrollLeft;
    board.scrollLeft = Math.max(
      0,
      columnOffset - (board.clientWidth - columnRect.width) / 2,
    );
  }, [dates, targetDate]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    // 普通滚轮保留给页面纵向滚动；Shift + 滚轮是鼠标的横向浏览补充方式。
    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey || Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      board.scrollLeft += event.deltaY;
    };

    board.addEventListener("wheel", handleWheel, { passive: false });
    return () => board.removeEventListener("wheel", handleWheel);
  }, []);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const board = event.currentTarget;
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: board.scrollLeft,
    };
    board.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4) drag.moved = true;
    if (!drag.moved) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.scrollLeft - distance;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    drag.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 0);
  };

  const preventClickAfterDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    event.currentTarget.scrollBy({
      behavior: "smooth",
      left: (event.currentTarget.clientWidth / 7) * direction,
    });
  };

  return (
    <div
      aria-label="按日期横向浏览日程"
      className="time-axis-board axis-scrollbar-none flex w-full shrink-0 select-none overflow-x-auto overscroll-x-contain"
      onClickCapture={preventClickAfterDrag}
      onDragStart={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
      onPointerCancel={endDrag}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      ref={boardRef}
      role="region"
      tabIndex={0}
    >
      {dates.map((date) => (
        <DateColumn
          date={date}
          key={date}
          onSelect={onSelect}
          schedules={schedulesByDate.get(date) || []}
          today={today}
        />
      ))}
    </div>
  );
}
