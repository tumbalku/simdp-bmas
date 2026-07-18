/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EMPLOYEE_STATUS_VALUE,
  mapEmployeeStatusLegacyToCanonical,
  mapGenderLegacyToCanonical,
  mapMaritalStatusLegacyToCanonical,
  mapReligionLegacyToCanonical,
} from "../constants";

export type EmployeeDirectoryFilter = {
  archiveView?: "active" | "archived";
  search?: string;
  page?: number;
  limit?: number;
  employmentStatusId?: string;
  employeeGroupId?: string;
  professionGroupId?: string;
  employeePositionId?: string;
  employeeRankId?: string;
  workplaceId?: string;
  maritalStatus?: string;
  lastEducation?: string;
  tmtStartDate?: string;
  tmtEndDate?: string;
  retirementAgeFrom?: number;
  retirementAgeTo?: number;
  status?: string;
};

export type EmployeeExportActor = {
  actorId: string;
  actorName: string;
  actorRole: string;
};

export const EMPLOYEE_EXPORT_HEADERS = [
  "Nama",
  "NIP",
  "NIK",
  "Email",
  "Role",
  "Status Pegawai",
  "Status Akun",
  "Status Kepegawaian",
  "Jenis Kepegawaian",
  "Jabatan",
  "Golongan",
  "Unit Kerja",
  "Telepon",
  "Pendidikan",
] as const;

export const EMPLOYEE_EXPORT_DELIMITER = ";";

function getDateAtAge(age: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - age);
  return date;
}

export function buildEmployeeDirectoryWhere(filter: EmployeeDirectoryFilter) {
  const where: any = {
    deletedAt: filter.archiveView === "archived" ? { not: null } : null,
  };

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { employeeId: { contains: filter.search, mode: "insensitive" } },
      { nik: { contains: filter.search, mode: "insensitive" } },
      { user: { email: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  if (filter.employmentStatusId) where.employmentStatusId = filter.employmentStatusId;
  if (filter.employeeGroupId) where.employeeGroupId = filter.employeeGroupId;
  if (filter.professionGroupId) {
    where.employeePosition = { professionGroupId: filter.professionGroupId };
  }
  if (filter.employeePositionId) where.employeePositionId = filter.employeePositionId;
  if (filter.employeeRankId) where.employeeRankId = filter.employeeRankId;
  if (filter.workplaceId) where.workplaceId = filter.workplaceId;
  if (filter.maritalStatus) where.maritalStatus = canonicalMaritalStatus(filter.maritalStatus);
  if (filter.status) where.status = canonicalEmployeeStatus(filter.status);
  if (filter.lastEducation) where.lastEducation = filter.lastEducation;

  if (filter.tmtStartDate) {
    where.tmtStartDate = { ...(where.tmtStartDate || {}), gte: new Date(filter.tmtStartDate) };
  }
  if (filter.tmtEndDate) {
    where.tmtEndDate = { ...(where.tmtEndDate || {}), lte: new Date(filter.tmtEndDate) };
  }

  if (filter.retirementAgeFrom !== undefined || filter.retirementAgeTo !== undefined) {
    where.birthDate = { ...(where.birthDate || {}) };
    if (filter.retirementAgeFrom !== undefined) {
      where.birthDate.lte = getDateAtAge(filter.retirementAgeFrom);
    }
    if (filter.retirementAgeTo !== undefined) {
      const minimumBirthDate = getDateAtAge(filter.retirementAgeTo + 1);
      minimumBirthDate.setDate(minimumBirthDate.getDate() + 1);
      where.birthDate.gte = minimumBirthDate;
    }
  }

  return where;
}

export function canonicalEmployeeStatus(value: string | null | undefined) {
  return mapEmployeeStatusLegacyToCanonical(value) ?? EMPLOYEE_STATUS_VALUE.ACTIVE;
}

export function canonicalGender(value: string | null | undefined) {
  return mapGenderLegacyToCanonical(value);
}

export function canonicalMaritalStatus(value: string | null | undefined) {
  return mapMaritalStatusLegacyToCanonical(value);
}

export function canonicalReligion(value: string | null | undefined) {
  return mapReligionLegacyToCanonical(value);
}

export function escapeCsvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  if (
    text.includes('"') ||
    text.includes(EMPLOYEE_EXPORT_DELIMITER) ||
    text.includes("\n") ||
    text.includes(String.fromCharCode(13))
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
