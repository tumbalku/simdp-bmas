import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getSession } from "@/lib/auth";
import { getSessionProfile } from "@/modules/auth/server";
import { getCurrentProfile } from "@/modules/employee/server";
import { ProfilePageView } from "@/modules/employee/components/ProfilePageView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect(ROUTES.login);

  const [profileResult, accountResult] = await Promise.all([
    getCurrentProfile(session.userId),
    getSessionProfile(session.userId),
  ]);

  if (!profileResult || !accountResult) {
    redirect(ROUTES.login);
  }

  return <ProfilePageView profile={profileResult} account={accountResult} />;
}
