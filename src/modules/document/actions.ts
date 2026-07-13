/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  handleDocumentTypeCrud,
  softDeleteDocument,
  restoreDocument,
  getDocumentRecordsForSession,
  getDocumentRecordDetailForSession,
  getAvailableDocumentTypes,
  uploadDocumentRecord,
  getDocumentRecordsWithPagination,
} from "@/modules/document/service";

const crudDocumentTypeSchema = z.object({
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

const uploadDocumentSchema = z.object({
  documentTypeId: z.string().min(1, "Jenis dokumen wajib dipilih"),
  title: z.string().optional(),
  documentNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

export async function getDocumentRecordsAction(filter?: unknown) {
  try {
    const session = await requireAuth();
    const parsed = z
      .object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "REPLACED"]).optional(),
        search: z.string().optional(),
      })
      .optional()
      .safeParse(filter);

    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." } };
    }

    const data = await getDocumentRecordsForSession(session, parsed.data || {});
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentRecordsAction error:", error);
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
}

export async function getDocumentRecordsWithPaginationAction(filter?: unknown) {
  try {
    await requireAuth("ADMIN");
    const parsed = z
      .object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "REPLACED"]).optional(),
        search: z.string().optional(),
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
      })
      .optional()
      .safeParse(filter);

    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." } };
    }

    const data = await getDocumentRecordsWithPagination(parsed.data || {});
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentRecordsWithPaginationAction error:", error);
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
}

export async function getDocumentRecordDetailAction(id: string) {
  try {
    const session = await requireAuth();
    const data = await getDocumentRecordDetailForSession(id, session);
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentRecordDetailAction error:", error);
    return { ok: false as const, error: { code: error.code || "INTERNAL_ERROR", message: error.message } };
  }
}

export async function getDocumentTypeOptionsAction() {
  try {
    await requireAuth();
    const data = await getAvailableDocumentTypes();
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentTypeOptionsAction error:", error);
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
}

export async function uploadDocumentAction(formData: FormData) {
  try {
    const session = await requireAuth();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "File dokumen wajib dipilih." } };
    }

    const parsed = uploadDocumentSchema.safeParse({
      documentTypeId: formData.get("documentTypeId"),
      title: formData.get("title") || undefined,
      documentNumber: formData.get("documentNumber") || undefined,
      issueDate: formData.get("issueDate") || undefined,
      expiryDate: formData.get("expiryDate") || undefined,
    });

    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Input tidak valid." } };
    }

    const data = await uploadDocumentRecord({ ...parsed.data, file }, session);
    revalidatePath("/documents");
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("uploadDocumentAction error:", error);
    return { ok: false as const, error: { code: error.code || "INTERNAL_ERROR", message: error.message || "Gagal mengunggah dokumen." } };
  }
}

export async function crudDocumentTypeAction(operation: string, id?: string, data?: unknown) {
  try {
    const session = await requireAuth("ADMIN");

    const parsed = crudDocumentTypeSchema.safeParse({ operation, id, data });
    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input tidak valid.",
          details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      };
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });
    const actorName = user?.employee?.name || user?.email || "Admin";

    const result = await handleDocumentTypeCrud(
      parsed.data.operation,
      parsed.data.id,
      parsed.data.data,
      session.userId,
      actorName,
      session.role
    );

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("crudDocumentTypeAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}

export async function softDeleteDocumentAction(id: string) {
  try {
    const session = await requireAuth();

    const success = await softDeleteDocument(id, session);

    return { ok: true as const, data: { success } };
  } catch (error: any) {
    console.error("softDeleteDocumentAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "OWNERSHIP_REQUIRED"
            ? "FORBIDDEN"
            : error.message.includes("APPROVED")
            ? "BUSINESS_RULE_VIOLATION"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}

export async function restoreDocumentAction(id: string) {
  try {
    const session = await requireAuth("ADMIN");

    const success = await restoreDocument(id, session);

    return { ok: true as const, data: { success } };
  } catch (error: any) {
    console.error("restoreDocumentAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}
