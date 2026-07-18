import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getVerificationDocumentDetailAction } from "@/modules/verification";
import { VerificationDetailView } from "@/modules/verification/components/VerificationDetailView";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VerificationDetailPage({ params }: PageProps) {
  await requireAuth("STAFF");

  const { id } = await params;

  const result = await getVerificationDocumentDetailAction(id);

  if (!result.ok) {
    if (result.error?.code === "NOT_FOUND") {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <FileX className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Dokumen Tidak Ditemukan</h2>
            <p className="text-sm text-muted-foreground">
              Dokumen yang Anda cari tidak ada atau telah dihapus.
            </p>
          </div>
          <Link
            href="/verification"
            className={buttonVariants({ variant: "outline" })}
          >
            Kembali ke Antrian
          </Link>
        </div>
      );
    }

    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="size-4" />
        <AlertTitle>Kesalahan</AlertTitle>
        <AlertDescription>
          {result.error?.message ||
            "Gagal memuat detail dokumen. Silakan coba lagi."}
        </AlertDescription>
      </Alert>
    );
  }

  return <VerificationDetailView document={result.data} />;
}
