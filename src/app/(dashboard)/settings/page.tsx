import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { requireAuth } from "@/lib/auth";
import { getActiveSessions, getCurrentUserAccount } from "@/modules/auth/server";
import { UserSettingsPageView } from "@/modules/auth/components/UserSettingsPageView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();
  const [account, sessions] = await Promise.all([
    getCurrentUserAccount(session.userId),
    getActiveSessions(session.userId),
  ]);

  if (!account) {
    redirect(ROUTES.login);
  }

  return <UserSettingsPageView account={account} sessions={sessions} />;
}
