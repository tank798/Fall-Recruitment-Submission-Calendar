import { getCompanyDisplayName } from "@/lib/companyNames";
import { cn } from "@/lib/utils";

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
] as const;

function companyHash(company: string) {
  let hash = 0;
  for (const character of company) {
    hash = (hash * 31 + (character.codePointAt(0) || 0)) >>> 0;
  }
  return hash;
}

export function CompanyAvatar({
  company,
  size = "md",
}: {
  company: string;
  size?: "sm" | "md" | "lg";
}) {
  const displayCompany = getCompanyDisplayName(company);
  const palette = AVATAR_PALETTE[companyHash(displayCompany) % AVATAR_PALETTE.length];
  const firstCharacter = Array.from(displayCompany)[0]?.toLocaleUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[10px] font-semibold ring-1 ring-black/[0.03]",
        palette,
        size === "sm" && "h-7 w-7 text-xs",
        size === "md" && "h-9 w-9 text-sm",
        size === "lg" && "h-11 w-11 text-base",
      )}
    >
      {firstCharacter}
    </span>
  );
}
