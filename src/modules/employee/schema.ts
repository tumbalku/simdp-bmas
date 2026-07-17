import { z } from "zod";
import {
  EMPLOYEE_STATUS_VALUE,
  GENDER_VALUE,
  MARITAL_STATUS_VALUE,
  RELIGION_VALUE,
  mapEmployeeStatusLegacyToCanonical,
  mapGenderLegacyToCanonical,
  mapMaritalStatusLegacyToCanonical,
  mapReligionLegacyToCanonical,
} from "./constants";

const employeeStatusValues = Object.values(EMPLOYEE_STATUS_VALUE) as [string, ...string[]];
const genderValues = Object.values(GENDER_VALUE) as [string, ...string[]];
const maritalStatusValues = Object.values(MARITAL_STATUS_VALUE) as [string, ...string[]];
const religionValues = Object.values(RELIGION_VALUE) as [string, ...string[]];

const employeeStatusSchema = z.preprocess(
  (value) => (typeof value === "string" ? mapEmployeeStatusLegacyToCanonical(value) ?? value : value),
  z.enum(employeeStatusValues)
);
const genderSchema = z.preprocess(
  (value) => (typeof value === "string" ? mapGenderLegacyToCanonical(value) ?? value : value),
  z.enum(genderValues)
);
const maritalStatusSchema = z.preprocess(
  (value) => (typeof value === "string" ? mapMaritalStatusLegacyToCanonical(value) ?? value : value),
  z.enum(maritalStatusValues)
);
const religionSchema = z.preprocess(
  (value) => (typeof value === "string" ? mapReligionLegacyToCanonical(value) ?? value : value),
  z.enum(religionValues)
);

export const updateProfileSchema = z.object({
  phone: z.string().regex(/^[0-9+\-\s]*$/, "Format telepon tidak valid").optional().nullable(),
  address: z.string().max(255, "Alamat terlalu panjang").optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional().nullable(),
  religion: religionSchema.optional().nullable(),
  maritalStatus: maritalStatusSchema.optional().nullable(),
});

export const crudEmployeeSchema = z.object({
  operation: z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE", "PERMANENT_DELETE"]),
  id: z.string().optional(),
  data: z
    .object({
      email: z.string().email("Format email tidak valid").optional(),
      role: z.enum(["ADMIN", "STAFF", "EMPLOYEE"]).optional(),
      isActive: z.boolean().optional(),
      employeeId: z.string().optional().nullable(),
      nik: z.string().optional().nullable(),
      name: z.string().optional(),
      status: employeeStatusSchema.optional(),
      gender: genderSchema.optional().nullable(),
      birthPlace: z.string().optional().nullable(),
      birthDate: z.string().optional().nullable(),
      academicDegree: z.string().optional().nullable(),
      lastEducation: z.string().optional().nullable(),
      religion: religionSchema.optional().nullable(),
      maritalStatus: maritalStatusSchema.optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      joinDate: z.string().optional().nullable(),
      hasTmt: z.boolean().optional(),
      tmtStartDate: z.string().optional().nullable(),
      tmtEndDate: z.string().optional().nullable(),
      employmentStatusId: z.string().optional().nullable(),
      employeeGroupId: z.string().optional().nullable(),
      employeePositionId: z.string().optional().nullable(),
      employeeRankId: z.string().optional().nullable(),
      workplaceId: z.string().optional().nullable(),
    })
    .optional(),
});

export const addCareerHistorySchema = z.object({
  employeeId: z.string().min(1, "ID pegawai wajib diisi"),
  employmentStatusId: z.string().optional().nullable(),
  employeeGroupId: z.string().optional().nullable(),
  employeePositionId: z.string().optional().nullable(),
  employeeRankId: z.string().optional().nullable(),
  workplaceId: z.string().optional().nullable(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export const employeeDirectorySchema = z.object({
  archiveView: z.enum(["active", "archived"]).optional(),
  search: z.string().optional(),
  employmentStatusId: z.string().optional(),
  employeeGroupId: z.string().optional(),
  professionGroupId: z.string().optional(),
  employeePositionId: z.string().optional(),
  employeeRankId: z.string().optional(),
  workplaceId: z.string().optional(),
  maritalStatus: maritalStatusSchema.optional(),
  lastEducation: z.string().optional(),
  tmtStartDate: z.string().optional(),
  tmtEndDate: z.string().optional(),
  retirementAgeFrom: z.number().int().nonnegative().optional(),
  retirementAgeTo: z.number().int().nonnegative().optional(),
  status: employeeStatusSchema.optional(),
});

export const employeeDirectoryWithPaginationSchema = z.object({
  archiveView: z.enum(["active", "archived"]).optional(),
  search: z.string().optional(),
  employmentStatusId: z.string().optional(),
  employeeGroupId: z.string().optional(),
  professionGroupId: z.string().optional(),
  employeePositionId: z.string().optional(),
  employeeRankId: z.string().optional(),
  workplaceId: z.string().optional(),
  maritalStatus: maritalStatusSchema.optional(),
  lastEducation: z.string().optional(),
  tmtStartDate: z.string().optional(),
  tmtEndDate: z.string().optional(),
  retirementAgeFrom: z.number().int().nonnegative().optional(),
  retirementAgeTo: z.number().int().nonnegative().optional(),
  status: employeeStatusSchema.optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const masterDataListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});
