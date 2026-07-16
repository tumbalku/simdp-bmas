type TargetRelation = {
  employmentStatusId?: string | null;
  employeeGroupId?: string | null;
  professionGroupId?: string | null;
  employeePositionId?: string | null;
  employeeRankId?: string | null;
  workplaceId?: string | null;
};

type TargetedDocumentType = {
  employmentStatuses?: TargetRelation[];
  employeeGroups?: TargetRelation[];
  employeePositions?: TargetRelation[];
  professionGroups?: TargetRelation[];
  employeeRanks?: TargetRelation[];
  workplaces?: TargetRelation[];
};

export type DocumentTargetEmployee = {
  employmentStatusId?: string | null;
  employeeGroupId?: string | null;
  employeePositionId?: string | null;
  employeePosition?: {
    professionGroupId?: string | null;
  } | null;
  employeeRankId?: string | null;
  workplaceId?: string | null;
};

function matchesDimension(
  relations: TargetRelation[] | undefined,
  field: keyof TargetRelation,
  employeeValue: string | null | undefined,
) {
  if (!relations || relations.length === 0) return true;
  if (!employeeValue) return false;

  return relations.some((relation) => relation[field] === employeeValue);
}

export function matchesDocumentTypeTarget(
  employee: DocumentTargetEmployee,
  documentType: TargetedDocumentType,
) {
  return (
    matchesDimension(documentType.employmentStatuses, "employmentStatusId", employee.employmentStatusId) &&
    matchesDimension(documentType.employeeGroups, "employeeGroupId", employee.employeeGroupId) &&
    matchesDimension(documentType.employeePositions, "employeePositionId", employee.employeePositionId) &&
    matchesDimension(
      documentType.professionGroups,
      "professionGroupId",
      employee.employeePosition?.professionGroupId,
    ) &&
    matchesDimension(documentType.employeeRanks, "employeeRankId", employee.employeeRankId) &&
    matchesDimension(documentType.workplaces, "workplaceId", employee.workplaceId)
  );
}
