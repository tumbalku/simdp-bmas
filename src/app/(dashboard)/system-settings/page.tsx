import { requireDashboardRole } from "@/lib/dashboard-auth";
import { getSystemSettings } from "@/modules/settings/server";
import { SettingsPageView } from "@/modules/settings/components/SettingsPageView";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  await requireDashboardRole("ADMIN");

  const settings = await getSystemSettings();

  return <SettingsPageView settings={settings} />;
}
