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
  operation: z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE"]),
  id: z.string().optional(),
  data: z
    .object({
      email: z.string().email("Format email tidak valid").optional(),
      role: z.enum(["ADMIN", "STAFF", "EMPLOYEE"]).optional(),
      employeeId: z.string().optional().nullable(),
      nik: z.string().optional().nullable(),
      name: z.string().optional(),
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
  search: z.string().optional(),
});

export const employeeDirectoryWithPaginationSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const masterDataListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});
