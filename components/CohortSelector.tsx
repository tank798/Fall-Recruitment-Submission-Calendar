import { ChevronDown } from "lucide-react";
import { useRecruitmentCohort } from "./RecruitmentCohortContext";

export function CohortSelector() {
  const { cohortOptions, selectedGraduationYear, setSelectedGraduationYear } =
    useRecruitmentCohort();

  return (
    <label className="relative block shrink-0">
      <span className="sr-only">选择秋招届别</span>
      <select
        aria-label="选择秋招届别"
        className="h-9 appearance-none rounded-[10px] border border-white/80 bg-white/70 pl-3 pr-8 text-sm font-medium text-[#4e5969] shadow-[0_1px_4px_rgba(31,35,41,0.06)] backdrop-blur-xl outline-none transition hover:border-[#d7dae0] hover:bg-white focus:border-[#85a8ff] focus:ring-2 focus:ring-[#3370ff]/10"
        onChange={(event) => setSelectedGraduationYear(Number(event.target.value))}
        value={selectedGraduationYear}
      >
        {cohortOptions.map((year) => (
          <option key={year} value={year}>
            {year}届
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8f959e]" />
    </label>
  );
}
