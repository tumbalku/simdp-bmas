import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getSessionProfileAction } from "@/modules/auth";
import { getCurrentProfile } from "@/modules/employee";
import { ProfilePageView } from "@/modules/employee/components/ProfilePageView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profileResult, accountResult] = await Promise.all([
    getCurrentProfile(),
    getSessionProfileAction(),
  ]);

  if (!profileResult.ok || !accountResult.ok) {
    redirect(ROUTES.login);
  }

  return <ProfilePageView profile={profileResult.data} account={accountResult.data} />;
}
