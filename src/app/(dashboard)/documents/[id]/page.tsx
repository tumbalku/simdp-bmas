import { notFound, redirect } from "next/navigation";
import { getDocumentRecordDetailAction } from "@/modules/document/actions";
import { DocumentDetailView } from "@/modules/document/components/DocumentDetailView";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getDocumentRecordDetailAction(id);

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND" || result.error.code === "OWNERSHIP_REQUIRED") {
      notFound();
    }
    redirect("/login");
  }

  return <DocumentDetailView document={result.data} />;
}
