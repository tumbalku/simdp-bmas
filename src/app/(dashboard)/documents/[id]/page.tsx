import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/constants";
import { getDocumentRecordDetailAction } from "@/modules/document/actions";
import { DocumentDetailView } from "@/modules/document/components/DocumentDetailView";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
};

function getBackNavigation(returnTo?: string) {
  if (
    returnTo &&
    new RegExp(`^${ROUTES.masterDataEmployees}/[^/?#]+(?:\\?.*)?$`).test(returnTo)
  ) {
    return {
      backHref: returnTo,
      backLabel: "Kembali ke detail pegawai",
    };
  }

  if (
    returnTo === ROUTES.masterDataDocuments ||
    returnTo?.startsWith(`${ROUTES.masterDataDocuments}?`)
  ) {
    return {
      backHref: returnTo,
      backLabel: "Kembali ke master data dokumen",
    };
  }

  if (returnTo === ROUTES.documents || returnTo?.startsWith(`${ROUTES.documents}?`)) {
    return {
      backHref: returnTo,
      backLabel: "Kembali ke dokumen",
    };
  }

  return {
    backHref: ROUTES.documents,
    backLabel: "Kembali ke dokumen",
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const result = await getDocumentRecordDetailAction(id);

  if (!result.ok) {
    if (result.error.code === "NOT_FOUND" || result.error.code === "OWNERSHIP_REQUIRED") {
      notFound();
    }
    redirect("/login");
  }

  return (
    <DocumentDetailView
      document={result.data}
      {...getBackNavigation(resolvedSearchParams?.returnTo)}
    />
  );
}
