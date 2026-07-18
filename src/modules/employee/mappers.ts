/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EMPLOYEE_STATUS_VALUE,
  EMPLOYEE_STATUS_LABELS,
  getEmployeeStatusLabel,
  getGenderLabel,
  getMaritalStatusLabel,
  getReligionLabel,
} from "./constants";

export function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function mapEmployeeSummary(employee: any) {
  return {
    id: employee.id,
    employeeId: employee.employeeId,
    nik: employee.nik,
    name: employee.name,
    status: getEmployeeStatusLabel(employee.status) || EMPLOYEE_STATUS_LABELS[EMPLOYEE_STATUS_VALUE.ACTIVE],
    gender: getGenderLabel(employee.gender),
    phone: employee.phone,
    email: employee.user?.email || null,
    role: employee.user?.role || "EMPLOYEE",
    isActive: employee.user?.isActive ?? true,
    employmentStatus: employee.employmentStatus?.name || null,
    workplace: employee.workplace?.name || null,
    documentCount: employee._count?.documentRecords ?? employee.documentRecords?.length ?? 0,
  };
}

export function mapEmployeeDetail(employee: any) {
  if (!employee) return null;

  return {
    ...mapEmployeeSummary(employee),
    avatarUrl: employee.avatarUrl || null,
    birthDate: toIsoDate(employee.birthDate),
    birthPlace: employee.birthPlace,
    academicDegree: employee.academicDegree,
    lastEducation: employee.lastEducation,
    religion: getReligionLabel(employee.religion),
    maritalStatus: getMaritalStatusLabel(employee.maritalStatus),
    address: employee.address,
    joinDate: toIsoDate(employee.joinDate),
    tmtStartDate: toIsoDate(employee.tmtStartDate),
    tmtEndDate: toIsoDate(employee.tmtEndDate),
    hasTmt: employee.hasTmt ?? false,
    employmentStatusId: employee.employmentStatusId || null,
    employeeGroupId: employee.employeeGroupId || null,
    professionGroupId: employee.employeePosition?.professionGroupId || null,
    employeePositionId: employee.employeePositionId || null,
    employeeRankId: employee.employeeRankId || null,
    workplaceId: employee.workplaceId || null,
    employeeGroup: employee.employeeGroup?.name || null,
    employeePosition: employee.employeePosition?.name || null,
    employeeRank: employee.employeeRank?.name || null,
    careerHistories: (employee.careerHistories || []).map((item: any) => ({
      id: item.id,
      effectiveDate: toIsoDate(item.effectiveDate),
      endDate: toIsoDate(item.endDate),
      note: item.note,
      employmentStatus: item.employmentStatus?.name || null,
      employeeGroup: item.employeeGroup?.name || null,
      employeePosition: item.employeePosition?.name || null,
      employeeRank: item.employeeRank?.name || null,
      workplace: item.workplace?.name || null,
    })),
    documents: (employee.documentRecords || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title || doc.documentType?.name || "Dokumen",
      status: doc.status,
      uploadedAt: toIsoDate(doc.uploadedAt),
      expiryDate: toIsoDate(doc.expiryDate),
      documentTypeName: doc.documentType?.name || "Dokumen",
      archiveCategory: doc.documentType?.archiveCategory || "PERSONAL",
    })),
  };
}
