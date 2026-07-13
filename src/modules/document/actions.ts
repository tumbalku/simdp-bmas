/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { handleActionError } from "@/lib/errors";
import { getActorDisplayName } from "@/modules/employee/service";
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
import {
  crudDocumentTypeSchema,
  uploadDocumentSchema,
  documentRecordsQuerySchema,
  documentRecordsWithPaginationQuerySchema,
} from "./schema";

export async function getDocumentRecordsAction(filter?: unknown) {
  try {
    const session = await requireAuth();
    const parsed = documentRecordsQuerySchema.optional().safeParse(filter);

    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." } };
    }

    const data = await getDocumentRecordsForSession(session, parsed.data || {});
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentRecordsAction error:", error);
    return handleActionError(error);
  }
}

export async function getDocumentRecordsWithPaginationAction(filter?: unknown) {
  try {
    await requireAuth("ADMIN");
    const parsed = documentRecordsWithPaginationQuerySchema.optional().safeParse(filter);

    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." } };
    }

    const data = await getDocumentRecordsWithPagination(parsed.data || {});
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentRecordsWithPaginationAction error:", error);
    return handleActionError(error);
  }
}

export async function getDocumentRecordDetailAction(id: string) {
  try {
    const session = await requireAuth();
    const data = await getDocumentRecordDetailForSession(id, session);
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentRecordDetailAction error:", error);
    return handleActionError(error);
  }
}

export async function getDocumentTypeOptionsAction() {
  try {
    await requireAuth();
    const data = await getAvailableDocumentTypes();
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getDocumentTypeOptionsAction error:", error);
    return handleActionError(error);
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
    return handleActionError(error, { defaultMessage: "Gagal mengunggah dokumen." });
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

    const actorName = await getActorDisplayName(session.userId, "Admin");

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
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
  }
}

export async function softDeleteDocumentAction(id: string) {
  try {
    const session = await requireAuth();

    const success = await softDeleteDocument(id, session);

    return { ok: true as const, data: { success } };
  } catch (error: any) {
    console.error("softDeleteDocumentAction error:", error);
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED" });
  }
}

export async function restoreDocumentAction(id: string) {
  try {
    const session = await requireAuth("ADMIN");

    const success = await restoreDocument(id, session);

    return { ok: true as const, data: { success } };
  } catch (error: any) {
    console.error("restoreDocumentAction error:", error);
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
  }
}
