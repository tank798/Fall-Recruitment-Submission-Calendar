import { RecruitmentApp } from "@/components/RecruitmentApp";
import { getDataStore } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getDataStore();
  return <RecruitmentApp initialStore={store} />;
}
