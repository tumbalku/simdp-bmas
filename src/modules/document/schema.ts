import { z } from "zod";

export const crudDocumentTypeSchema = z.object({
  operation: z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE"]),
  id: z.string().optional(),
  data: z
    .object({
      code: z.string().min(2).max(10).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      archiveCategory: z.enum(["PERSONAL", "EDUCATION", "EMPLOYMENT", "CERTIFICATION", "LEGAL"]).optional(),
      isMandatory: z.boolean().optional(),
      allowMultiple: z.boolean().optional(),
      requiresExpiryDate: z.boolean().optional(),
      requiresIssueDate: z.boolean().optional(),
      requiresDocumentNumber: z.boolean().optional(),
      allowedFormats: z.string().min(1).optional(),
      maxSizeMb: z.number().positive().optional(),
      professionGroupIds: z.array(z.string()).optional(),
      employmentStatusIds: z.array(z.string()).optional(),
      employeeGroupIds: z.array(z.string()).optional(),
      employeeRankIds: z.array(z.string()).optional(),
      workplaceIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export const uploadDocumentSchema = z.object({
  documentTypeId: z.string().min(1, "Jenis dokumen wajib dipilih"),
  title: z.string().optional(),
  documentNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const documentRecordsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "REPLACED"]).optional(),
  search: z.string().optional(),
});

export const documentRecordsWithPaginationQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "REPLACED"]).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});
