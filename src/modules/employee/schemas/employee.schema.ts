import { z } from "zod";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_VALUE,
  GENDER_LABELS,
  GENDER_VALUE,
  MARITAL_STATUS_LABELS,
  MARITAL_STATUS_VALUE,
  RELIGION_LABELS,
  RELIGION_VALUE,
} from "../constants";

const employeeStatusValues = Object.values(EMPLOYEE_STATUS_VALUE) as [string, ...string[]];
const genderValues = Object.values(GENDER_VALUE) as [string, ...string[]];
const maritalStatusValues = Object.values(MARITAL_STATUS_VALUE) as [string, ...string[]];
const religionValues = Object.values(RELIGION_VALUE) as [string, ...string[]];

function normalizeEnumValue<T extends Record<string, string>>(
  val: unknown,
  canonicalMap: Record<string, string>,
  labelsMap: T
): unknown {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (!trimmed) return val;

  if (trimmed in canonicalMap) return trimmed;

  const lowerTrimmed = trimmed.toLowerCase();

  // Special aliases for common variations (e.g. "Laki-laki" -> MALE)
  if (canonicalMap === (GENDER_VALUE as Record<string, string>)) {
    if (lowerTrimmed === "laki-laki" || lowerTrimmed === "pria" || lowerTrimmed === "l") return GENDER_VALUE.MALE;
    if (lowerTrimmed === "perempuan" || lowerTrimmed === "wanita" || lowerTrimmed === "p") return GENDER_VALUE.FEMALE;
  }

  for (const [key, label] of Object.entries(labelsMap)) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel === lowerTrimmed) {
      return key;
    }
  }
  return trimmed;
}

const employeeStatusSchema = z.preprocess(
  (val) => normalizeEnumValue(val, EMPLOYEE_STATUS_VALUE, EMPLOYEE_STATUS_LABELS),
  z.enum(employeeStatusValues)
);

const genderSchema = z.preprocess(
  (val) => normalizeEnumValue(val, GENDER_VALUE, GENDER_LABELS),
  z.enum(genderValues)
);

const maritalStatusSchema = z.preprocess(
  (val) => normalizeEnumValue(val, MARITAL_STATUS_VALUE, MARITAL_STATUS_LABELS),
  z.enum(maritalStatusValues)
);

const religionSchema = z.preprocess(
  (val) => normalizeEnumValue(val, RELIGION_VALUE, RELIGION_LABELS),
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

export const bulkCreateEmployeeRowSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  name: z.string().min(1, "Nama wajib diisi"),
  role: z.enum(["ADMIN", "STAFF", "EMPLOYEE"]).optional().default("EMPLOYEE"),
  employeeId: z.string().nullable().optional(),
  nik: z.string().nullable().optional(),
  gender: genderSchema.nullable().optional(),
  birthPlace: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  academicDegree: z.string().nullable().optional(),
  lastEducation: z.string().nullable().optional(),
  religion: religionSchema.nullable().optional(),
  maritalStatus: maritalStatusSchema.nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  joinDate: z.string().nullable().optional(),
  employmentStatusId: z.string().nullable().optional(),
  employeeGroupId: z.string().nullable().optional(),
  employeePositionId: z.string().nullable().optional(),
  employeeRankId: z.string().nullable().optional(),
  workplaceId: z.string().nullable().optional(),
  status: employeeStatusSchema.optional().default("ACTIVE"),
}).refine((data) => data.employeeId || data.nik, {
  message: "NIP atau NIK wajib diisi",
  path: ["employeeId"],
});

export const bulkCreateEmployeesSchema = z.array(bulkCreateEmployeeRowSchema).min(1, "Minimal harus ada 1 pegawai untuk di-import").max(100, "Maksimal import adalah 100 pegawai sekaligus");

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
  rankName: z.string().optional(),
  grade: z.string().optional(),
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
  rankName: z.string().optional(),
  grade: z.string().optional(),
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
