import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getVerificationQueue } from "@/modules/verification/actions";
import { getDocumentTypeOptionsAction } from "@/modules/document/actions";
import { VerificationQueueView } from "@/modules/verification/components/VerificationQueueView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const session = await requireAuth("STAFF");

  const [queueResult, docTypesResult] = await Promise.all([
    getVerificationQueue({ page: 1, pageSize: 15 }),
    getDocumentTypeOptionsAction(),
  ]);

  if (!queueResult.ok) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="size-4" />
        <AlertTitle>Gagal Memuat Antrian</AlertTitle>
        <AlertDescription>
          {queueResult.error?.message ||
            "Terjadi kesalahan saat memuat data verifikasi."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!docTypesResult.ok) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="size-4" />
        <AlertTitle>Gagal Memuat Data</AlertTitle>
        <AlertDescription>
          {docTypesResult.error?.message ||
            "Terjadi kesalahan saat memuat jenis dokumen."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <VerificationQueueView
      initialData={queueResult.data}
      initialPagination={queueResult.meta.pagination}
      documentTypes={docTypesResult.data}
    />
  );
}
