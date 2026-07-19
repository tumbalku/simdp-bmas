import type { DocumentStatus } from "@/modules/document";
import { DOCUMENT_STATUS_LABELS, ARCHIVE_CATEGORY_LABELS } from "@/modules/document";

import * as repository from "../repository";
import { getEmployeeStatusLabel, getGenderLabel, getMaritalStatusLabel, getReligionLabel } from "../constants";
import { toIsoDate } from "../mappers";

export type EmployeeProfilePdfOptions = {
  includeProfile: boolean;
  documentStatuses?: DocumentStatus[];
};

export type EmployeeProfilePdfDocument = {
  id: string;
  title: string;
  documentTypeName: string;
  documentTypeCode: string | null;
  documentNumber: string | null;
  archiveCategory: string;
  archiveCategoryLabel: string;
  status: DocumentStatus;
  statusLabel: string;
  uploadedAt: string | null;
  expiryDate: string | null;
};

export type EmployeeProfilePdfData = {
  employee: {
    id: string;
    employeeId: string | null;
    nik: string | null;
    name: string;
    status: string | null;
    gender: string | null;
    birthDate: string | null;
    birthPlace: string | null;
    academicDegree: string | null;
    lastEducation: string | null;
    religion: string | null;
    maritalStatus: string | null;
    phone: string | null;
    address: string | null;
    joinDate: string | null;
    hasTmt: boolean;
    tmtStartDate: string | null;
    tmtEndDate: string | null;
    email: string | null;
    role: string;
    employmentStatus: string | null;
    employeeGroup: string | null;
    employeePosition: string | null;
    employeeRank: string | null;
    workplace: string | null;
    avatarUrl: string | null;
  };
  documents: EmployeeProfilePdfDocument[];
};

function isKnownDocumentStatus(value: string): value is DocumentStatus {
  return value in DOCUMENT_STATUS_LABELS;
}

export async function getEmployeeProfilePdfData(
  employeeId: string,
  options: EmployeeProfilePdfOptions
): Promise<EmployeeProfilePdfData | null> {
  const employee = await repository.findEmployeeDetailById(employeeId);
  if (!employee) return null;

  const selectedStatuses = new Set(options.documentStatuses ?? []);
  const documents = (employee.documentRecords || [])
    .filter((doc) => selectedStatuses.size === 0 || selectedStatuses.has(doc.status))
    .map((doc) => {
      const status = isKnownDocumentStatus(doc.status) ? doc.status : "PENDING";
      const archiveCategory = doc.documentType?.archiveCategory ?? "PERSONAL";
      const archiveCategoryLabel =
        archiveCategory in ARCHIVE_CATEGORY_LABELS
          ? ARCHIVE_CATEGORY_LABELS[archiveCategory as keyof typeof ARCHIVE_CATEGORY_LABELS]
          : archiveCategory;

      return {
        id: doc.id,
        title: doc.title || doc.documentType?.name || "Dokumen",
        documentTypeName: doc.documentType?.name || "Dokumen",
        documentTypeCode: doc.documentType?.code || null,
        documentNumber: doc.documentNumber || null,
        archiveCategory,
        archiveCategoryLabel,
        status,
        statusLabel: DOCUMENT_STATUS_LABELS[status],
        uploadedAt: toIsoDate(doc.uploadedAt),
        expiryDate: toIsoDate(doc.expiryDate),
      };
    });

  return {
    employee: {
      id: employee.id,
      employeeId: employee.employeeId,
      nik: employee.nik,
      name: employee.name,
      status: getEmployeeStatusLabel(employee.status) || null,
      gender: getGenderLabel(employee.gender),
      birthDate: toIsoDate(employee.birthDate),
      birthPlace: employee.birthPlace,
      academicDegree: employee.academicDegree,
      lastEducation: employee.lastEducation,
      religion: getReligionLabel(employee.religion),
      maritalStatus: getMaritalStatusLabel(employee.maritalStatus),
      phone: employee.phone,
      address: employee.address,
      joinDate: toIsoDate(employee.joinDate),
      hasTmt: employee.hasTmt ?? false,
      tmtStartDate: toIsoDate(employee.tmtStartDate),
      tmtEndDate: toIsoDate(employee.tmtEndDate),
      email: employee.user?.email || null,
      role: employee.user?.role || "EMPLOYEE",
      employmentStatus: employee.employmentStatus?.name || null,
      employeeGroup: employee.employeeGroup?.name || null,
      employeePosition: employee.employeePosition?.name || null,
      employeeRank: employee.employeeRank?.name || null,
      workplace: employee.workplace?.name || null,
      avatarUrl: employee.avatarUrl || null,
    },
    documents: options.includeProfile || documents.length > 0 ? documents : [],
  };
}
