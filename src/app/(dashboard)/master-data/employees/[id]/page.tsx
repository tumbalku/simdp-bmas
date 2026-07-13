import { notFound, redirect } from "next/navigation";
import { getEmployeeDetailAction } from "@/modules/employee/actions";
import { EmployeeDetailView } from "@/modules/employee/components/EmployeeDetailView";

export const dynamic = "force-dynamic";

export default async function MasterDataEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEmployeeDetailAction(id);

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }
    redirect(result.error.code === "FORBIDDEN" ? "/dashboard" : "/login");
  }

  return <EmployeeDetailView employee={result.data} />;
}
