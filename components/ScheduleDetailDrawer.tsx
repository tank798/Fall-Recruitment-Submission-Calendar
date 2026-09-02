import {
  CalendarDays,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatChineseDate } from "@/lib/date";
import type { Job, Schedule } from "@/lib/types";
import { getScheduleStageLabel } from "@/lib/interviewRound";
import { CompanyAvatar } from "./CompanyAvatar";
import { JDPanel } from "./JDPanel";
import { RecruitmentBatchBadge } from "./RecruitmentBatchBadge";
import { StageBadge } from "./StageBadge";

function DetailLine({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <div className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ScheduleDetailDrawer({
  schedule,
  job,
  onClose,
  onCopy,
  onEdit,
  onDelete,
  readOnly = false,
}: {
  schedule: Schedule;
  job?: Job;
  onClose: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  readOnly?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const sourceLink = schedule.sourceLink || job?.sourceLink;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const remove = async () => {
    if (!window.confirm("确定删除这条日程吗？原始 Excel 不会受到影响。")) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        aria-label="关闭详情"
        className="fixed inset-0 z-20 bg-slate-950/20 xl:hidden"
        onClick={onClose}
        type="button"
      />
      <aside className="drawer-enter fixed inset-y-0 right-0 z-30 flex w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-[-16px_0_48px_rgba(15,23,42,0.08)] xl:relative xl:z-auto xl:w-[390px] xl:shrink-0 xl:shadow-none 2xl:w-[410px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <p className="text-xs font-medium text-slate-500">详情</p>
          <button
            aria-label="关闭详情"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-start gap-3">
            <CompanyAvatar company={schedule.company} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold tracking-[-0.015em] text-slate-950">
                {schedule.company}
              </h2>
              <p className="mt-0.5 text-sm leading-6 text-slate-500">{schedule.position}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <StageBadge label={getScheduleStageLabel(schedule)} stage={schedule.stage} />
              <RecruitmentBatchBadge batch={job?.batch} />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-2">
            <DetailLine icon={CalendarDays} label="日期">
              {formatChineseDate(schedule.date)}
            </DetailLine>
            <DetailLine icon={ExternalLink} label="来源">
              {sourceLink ? (
                <a
                  className="font-medium text-[#3370ff] hover:text-[#2865e8] hover:underline"
                  href={sourceLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  点击跳转官网
                </a>
              ) : (
                "暂未填写链接"
              )}
            </DetailLine>
          </div>

          <div className="mt-6">
            <JDPanel job={job} />
          </div>
        </div>

        {!readOnly ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              disabled={deleting}
              onClick={remove}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "删除中" : "删除"}
            </button>
            <div className="flex items-center gap-2">
              <button
                aria-label="复制日程"
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
                onClick={onCopy}
                title="复制日程"
                type="button"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#3370ff] px-4 text-sm font-medium text-white hover:bg-[#2865e8]"
                onClick={onEdit}
                type="button"
              >
                <Pencil className="h-4 w-4" />
                修改
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
