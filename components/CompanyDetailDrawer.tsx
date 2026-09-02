import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import type { Job } from "@/lib/types";
import { CompanyAvatar } from "./CompanyAvatar";
import { JDPanel } from "./JDPanel";

export function CompanyDetailDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        aria-label="关闭岗位详情"
        className="fixed inset-0 z-20 bg-slate-950/20 xl:hidden"
        onClick={onClose}
        type="button"
      />
      <aside className="drawer-enter fixed inset-y-0 right-0 z-30 flex w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-[-16px_0_48px_rgba(15,23,42,0.08)] xl:relative xl:z-auto xl:w-[390px] xl:shrink-0 xl:shadow-none 2xl:w-[410px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <p className="text-xs font-medium text-slate-500">岗位详情</p>
          <button
            aria-label="关闭岗位详情"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-start gap-3">
            <CompanyAvatar company={job.company} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold tracking-[-0.015em] text-slate-950">
                {job.company}
              </h2>
              <p className="mt-0.5 text-sm leading-6 text-slate-500">{job.position}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {job.category}
            </span>
            {job.batch ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {job.batch}
              </span>
            ) : null}
          </div>
          {job.sourceLink ? (
            <a
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
              href={job.sourceLink}
              rel="noreferrer"
              target="_blank"
            >
              打开投递页面
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {job.pendingProgress ? (
            <section className="mt-5 rounded-lg border border-amber-100 bg-amber-50/60 px-3.5 py-3">
              <p className="text-xs font-medium text-amber-700">待补日期进展</p>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-amber-900/75">
                {job.pendingProgress}
              </p>
            </section>
          ) : null}
          <div className="mt-6">
            <JDPanel job={job} />
          </div>
        </div>
      </aside>
    </>
  );
}
