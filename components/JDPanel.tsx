import { BriefcaseBusiness } from "lucide-react";
import type { Job } from "@/lib/types";

export function JDPanel({ job }: { job?: Job }) {
  if (!job) {
    return (
      <section className="border-t border-slate-100 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          JD 详情
        </p>
        <div className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-5 text-sm leading-6 text-slate-500">
          暂未在 Excel 的 JD Sheet 中找到完全匹配的“公司 + 岗位”。
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-slate-100 pt-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          JD 详情
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
          <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
          {job.position}
        </div>
      </div>
      {job.jd ? (
        <div className="jd-content mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
          {job.jd}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">这个岗位尚未填写 JD。</p>
      )}
    </section>
  );
}
