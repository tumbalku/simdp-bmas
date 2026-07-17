import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getDocumentRecordsAction, getDocumentTypeOptionsAction } from "@/modules/document/actions";
import { DocumentsPageView } from "@/modules/document/components/DocumentsPageView";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  const [documentsResult, documentTypesResult] = await Promise.all([
    getDocumentRecordsAction(),
    getDocumentTypeOptionsAction(),
  ]);

  if (!documentsResult.ok || !documentTypesResult.ok) {
    redirect("/login");
  }

  return (
    <DocumentsPageView
      documents={documentsResult.data}
      documentTypes={documentTypesResult.data}
      canUpload={true}
    />
  );
}
