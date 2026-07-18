import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getSystemSettings } from "@/modules/settings";
import { SettingsPageView } from "@/modules/settings/components/SettingsPageView";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const result = await getSystemSettings();

  if (!result.ok) {
    redirect(result.error.code === "FORBIDDEN" ? ROUTES.dashboard : ROUTES.login);
  }

  return <SettingsPageView settings={result.data} />;
}
