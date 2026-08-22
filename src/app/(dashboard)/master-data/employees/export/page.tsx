import { requireDashboardRole } from "@/lib/dashboard-auth";
import { getEmployeeDirectorOptions } from "@/modules/employee/server";
import { EmployeeExportPageView } from "@/modules/employee/components/EmployeeExportPageView";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EmployeeExportPage({ searchParams }: PageProps) {
  await requireDashboardRole("ADMIN");

  const resolvedParams = await searchParams;
  const directorOptions = await getEmployeeDirectorOptions();

  // Convert resolvedParams to Record<string, string>
  const queryParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (typeof value === "string") {
      queryParams[key] = value;
    } else if (Array.isArray(value) && value[0]) {
      queryParams[key] = value[0];
    }
  }

  return (
    <EmployeeExportPageView
      directorOptions={directorOptions}
      initialQueryParams={queryParams}
    />
  );
}
