import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getSession } from "@/lib/auth";
import { getSessionProfile } from "@/modules/auth/server";
import { getCurrentProfile, getMasterDataList } from "@/modules/employee/server";
import { ProfilePageView } from "@/modules/employee/components/ProfilePageView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect(ROUTES.login);

  const [
    profileResult,
    accountResult,
    employmentStatuses,
    employeeGroups,
    professionGroups,
    employeePositions,
    employeeRanks,
    workplaces,
  ] = await Promise.all([
    getCurrentProfile(session.userId),
    getSessionProfile(session.userId),
    getMasterDataList("EmploymentStatus", { limit: 1000 }),
    getMasterDataList("EmployeeGroup", { limit: 1000 }),
    getMasterDataList("ProfessionGroup", { limit: 1000 }),
    getMasterDataList("EmployeePosition", { limit: 1000 }),
    getMasterDataList("EmployeeRank", { limit: 1000 }),
    getMasterDataList("Workplace", { limit: 1000 }),
  ]);

  if (!profileResult || !accountResult) {
    redirect(ROUTES.login);
  }

  return (
    <ProfilePageView
      profile={profileResult}
      account={accountResult}
      employmentStatuses={employmentStatuses.data}
      employeeGroups={employeeGroups.data}
      professionGroups={professionGroups.data}
      employeePositions={employeePositions.data}
      employeeRanks={employeeRanks.data}
      workplaces={workplaces.data}
    />
  );
}
