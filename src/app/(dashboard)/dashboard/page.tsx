import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEmployeeStatistics } from "@/modules/statistics";
import { EmployeeDashboardView } from "@/modules/statistics/components/EmployeeDashboardView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const response = await getEmployeeStatistics();
  if (!response.ok) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="size-4" />
        <AlertTitle>Kesalahan Sistem</AlertTitle>
        <AlertDescription>
          Gagal mengambil data ringkasan dokumen pribadi Anda. Silakan coba beberapa saat lagi.
        </AlertDescription>
      </Alert>
    );
  }

  return <EmployeeDashboardView stats={response.data} />;
}
