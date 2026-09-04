import { ChevronLeft, ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import type { Job } from "@/lib/types";
import { CompanyAvatar } from "./CompanyAvatar";
import { JDPanel } from "./JDPanel";

/**
 * 公司与岗位共用同一个右侧抽屉，避免同层级信息出现两种呈现方式。
 * 只传 company → 展示该公司的岗位列表；传了 job → 展示岗位详情，可返回列表。
 */
export function CompanyDetailDrawer({
  company,
  jobs,
  job,
  onSelectJob,
  onBack,
  onClose,
}: {
  company: string;
  jobs: Job[];
  job?: Job | null;
  onSelectJob: (job: Job) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const title = job ? "岗位详情" : "公司岗位";

  return (
    <>
      <button
        aria-label={`关闭${title}`}
        className="fixed inset-0 z-20 bg-slate-950/20 xl:hidden"
        onClick={onClose}
        type="button"
      />
      <aside className="drawer-enter fixed inset-y-0 right-0 z-30 flex w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-[-16px_0_48px_rgba(15,23,42,0.08)] xl:relative xl:z-auto xl:w-[390px] xl:shrink-0 xl:shadow-none 2xl:w-[410px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-1">
            {job ? (
              <button
                aria-label="返回公司岗位列表"
                className="-ml-1.5 grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={onBack}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
            <p className="truncate text-xs font-medium text-slate-500">{title}</p>
          </div>
          <button
            aria-label={`关闭${title}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {job ? (
            <JobDetail job={job} />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 pb-2">
                <CompanyAvatar company={company} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-[-0.015em] text-slate-950">
                    {company}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    共 {jobs.length} 个岗位 · 点击查看详情
                  </p>
                </div>
              </div>
              {jobs.map((item) => (
                <button
                  className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                  key={item.id}
                  onClick={() => onSelectJob(item)}
                  type="button"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                    {item.position}
                  </span>
                  {item.batch ? (
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {item.batch}
                    </span>
                  ) : null}
                  {!item.jd ? (
                    <span className="shrink-0 text-[11px] text-slate-400">JD 待补充</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function JobDetail({ job }: { job: Job }) {
  return (
    <>
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
    </>
  );
}
