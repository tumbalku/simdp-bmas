/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getVerificationQueue as getQueueService,
  verifyDocument,
  getVerificationHistory as getHistoryService,
  getVerificationDocumentDetail,
} from "@/modules/verification/service";
import { generateDownloadUrl } from "@/modules/document/service";

const verifyDocumentSchema = z
  .object({
    id: z.string().min(1, "ID dokumen wajib diisi"),
    decision: z.enum(["APPROVED", "REJECTED"]),
    note: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.decision === "REJECTED") {
        return data.note && data.note.trim().length >= 5;
      }
      return true;
    },
    {
      message: "Catatan penolakan wajib diisi minimal 5 karakter",
      path: ["note"],
    }
  );

export async function getVerificationQueue(filter: {
  page?: number;
  pageSize?: number;
  search?: string;
  documentTypeId?: string;
  workplaceId?: string;
}) {
  try {
    await requireAuth("STAFF"); // Minimum role STAFF

    const result = await getQueueService(filter);

    return { ok: true as const, ...result };
  } catch (error: any) {
    console.error("getVerificationQueue error:", error);
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

export async function verifyDocumentAction(id: string, decision: string, note?: string | null) {
  try {
    const session = await requireAuth("STAFF");

    const parsed = verifyDocumentSchema.safeParse({ id, decision, note });
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
    const actorName = user?.employee?.name || user?.email || "Reviewer";

    const result = await verifyDocument(
      parsed.data.id,
      parsed.data.decision,
      parsed.data.note || undefined,
      session.userId,
      actorName,
      session.role
    );

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("verifyDocumentAction error:", error);
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

export async function getVerificationHistory(documentId: string) {
  try {
    const session = await requireAuth();

    const result = await getHistoryService(documentId, session);

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("getVerificationHistory error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "OWNERSHIP_REQUIRED"
            ? "FORBIDDEN"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}

export async function getVerificationDocumentDetailAction(documentId: string) {
  try {
    const session = await requireAuth("STAFF");

    const result = await getVerificationDocumentDetail(documentId, session);

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("getVerificationDocumentDetailAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : error.message === "Dokumen tidak ditemukan"
            ? "NOT_FOUND"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}

export async function getVerificationDocumentPreviewUrlAction(documentId: string) {
  try {
    const session = await requireAuth("STAFF");
    const url = await generateDownloadUrl(documentId, session);

    return { ok: true as const, data: { url } };
  } catch (error: any) {
    console.error("getVerificationDocumentPreviewUrlAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : error.message === "Dokumen tidak ditemukan"
            ? "NOT_FOUND"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}
