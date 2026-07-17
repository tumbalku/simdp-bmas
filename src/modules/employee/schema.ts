import { z } from "zod";

export const updateProfileSchema = z.object({
  phone: z.string().regex(/^[0-9+\-\s]*$/, "Format telepon tidak valid").optional().nullable(),
  address: z.string().max(255, "Alamat terlalu panjang").optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional().nullable(),
  religion: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
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
      status: z.string().optional(),
      gender: z.string().optional().nullable(),
      birthPlace: z.string().optional().nullable(),
      birthDate: z.string().optional().nullable(),
      academicDegree: z.string().optional().nullable(),
      lastEducation: z.string().optional().nullable(),
      religion: z.string().optional().nullable(),
      maritalStatus: z.string().optional().nullable(),
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
  maritalStatus: z.string().optional(),
  lastEducation: z.string().optional(),
  tmtStartDate: z.string().optional(),
  tmtEndDate: z.string().optional(),
  retirementAgeFrom: z.number().int().nonnegative().optional(),
  retirementAgeTo: z.number().int().nonnegative().optional(),
  status: z.string().optional(),
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
  maritalStatus: z.string().optional(),
  lastEducation: z.string().optional(),
  tmtStartDate: z.string().optional(),
  tmtEndDate: z.string().optional(),
  retirementAgeFrom: z.number().int().nonnegative().optional(),
  retirementAgeTo: z.number().int().nonnegative().optional(),
  status: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const masterDataListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});
