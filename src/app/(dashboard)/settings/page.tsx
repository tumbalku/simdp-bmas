import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getCurrentAccountSettingsAction } from "@/modules/auth";
import { UserSettingsPageView } from "@/modules/auth/components/UserSettingsPageView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const result = await getCurrentAccountSettingsAction();

  if (!result.ok) {
    redirect(ROUTES.login);
  }

  return <UserSettingsPageView account={result.data} />;
}
