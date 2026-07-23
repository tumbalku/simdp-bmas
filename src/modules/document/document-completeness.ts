import { matchesDocumentTypeTarget, type DocumentTargetEmployee } from "./target-rules";

type TargetRelation = {
  employmentStatusId?: string | null;
  employeeGroupId?: string | null;
  professionGroupId?: string | null;
  employeePositionId?: string | null;
  employeeRankId?: string | null;
  workplaceId?: string | null;
};

type CompletenessDocumentType = {
  id: string;
  isMandatory?: boolean | null;
  employmentStatuses?: TargetRelation[];
  employeeGroups?: TargetRelation[];
  employeePositions?: TargetRelation[];
  professionGroups?: TargetRelation[];
  employeeRanks?: TargetRelation[];
  workplaces?: TargetRelation[];
};

type CompletenessDocument = {
  documentTypeId?: string | null;
  status?: string | null;
};

type CalculateMandatoryDocumentCompletenessInput = {
  employee?: DocumentTargetEmployee | null;
  documentTypes: CompletenessDocumentType[];
  documents: CompletenessDocument[];
};

export function calculateMandatoryDocumentCompleteness({
  employee,
  documentTypes,
  documents,
}: CalculateMandatoryDocumentCompletenessInput) {
  const applicableMandatoryTypes = documentTypes.filter((documentType) => {
    if (!documentType.isMandatory) return false;
    return employee ? matchesDocumentTypeTarget(employee, documentType) : true;
  });
  const uploadedDocumentTypeIds = new Set(
    documents
      .filter((document) => document.status === "APPROVED")
      .map((document) => document.documentTypeId)
      .filter((id): id is string => Boolean(id)),
  );
  const completed = applicableMandatoryTypes.filter((documentType) =>
    uploadedDocumentTypeIds.has(documentType.id),
  ).length;
  const total = applicableMandatoryTypes.length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
