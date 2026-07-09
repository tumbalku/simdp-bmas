/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCurrentProfile as getProfileService,
  updateProfile,
  handleEmployeeCrud,
  addCareerHistory,
  importFromCsv,
  handleMasterDataCrud,
} from "@/modules/employee/service";

const updateProfileSchema = z.object({
  phone: z.string().regex(/^[0-9+\-\s]*$/, "Format telepon tidak valid").optional().nullable(),
  address: z.string().max(255, "Alamat terlalu panjang").optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional().nullable(),
  religion: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
});

const crudEmployeeSchema = z.object({
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

const addCareerHistorySchema = z.object({
  employeeId: z.string().min(1, "ID pegawai wajib diisi"),
  employmentStatusId: z.string().optional().nullable(),
  employeeGroupId: z.string().optional().nullable(),
  employeePositionId: z.string().optional().nullable(),
  employeeRankId: z.string().optional().nullable(),
  workplaceId: z.string().optional().nullable(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export async function getCurrentProfile() {
  try {
    const session = await requireAuth();

    // Enforce ownership: only read own profile
    const profile = await getProfileService(session.userId);

    if (!profile) {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND",
          message: "Profil pegawai tidak ditemukan.",
        },
      };
    }

    // Return profile matching standard envelope
    return { ok: true as const, data: profile };
  } catch (error: any) {
    console.error("getCurrentProfile error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function updateProfileAction(data: unknown) {
  try {
    const session = await requireAuth();

    const parsed = updateProfileSchema.safeParse(data);
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

    // Resolve actor name
    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });
    const actorName = user?.employee?.name || user?.email || "User";

    const cleanData = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const success = await updateProfile(session.userId, cleanData, actorName, session.role);

    if (!success) {
      return {
        ok: false as const,
        error: {
          code: "NOT_FOUND",
          message: "Pegawai tidak ditemukan.",
        },
      };
    }

    return { ok: true as const, data: { success: true } };
  } catch (error: any) {
    console.error("updateProfileAction error:", error);
    return {
      ok: false as const,
      error: {
        code: error.message === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: error.message === "UNAUTHENTICATED" ? "User belum login" : "Terjadi kesalahan internal",
      },
    };
  }
}

export async function crudEmployeeAction(operation: string, id?: string, data?: unknown) {
  try {
    const session = await requireAuth("ADMIN");

    const parsed = crudEmployeeSchema.safeParse({ operation, id, data });
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

    const result = await handleEmployeeCrud(
      parsed.data.operation,
      parsed.data.id,
      parsed.data.data,
      session.userId,
      actorName,
      session.role
    );

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("crudEmployeeAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : error.message.includes("sudah terdaftar")
            ? "CONFLICT"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}

export async function addCareerHistoryAction(data: unknown) {
  try {
    const session = await requireAuth("ADMIN");

    const parsed = addCareerHistorySchema.safeParse(data);
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

    const cleanData = {
      ...parsed.data,
      employmentStatusId: parsed.data.employmentStatusId || undefined,
      employeeGroupId: parsed.data.employeeGroupId || undefined,
      employeePositionId: parsed.data.employeePositionId || undefined,
      employeeRankId: parsed.data.employeeRankId || undefined,
      workplaceId: parsed.data.workplaceId || undefined,
      note: parsed.data.note || undefined,
      createdBy: session.userId,
      actorName,
      actorRole: session.role,
    };

    const result = await addCareerHistory(cleanData);

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("addCareerHistoryAction error:", error);
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

export async function importEmployeesAction(formData: FormData) {
  try {
    const session = await requireAuth("ADMIN");

    const file = formData.get("file") as File;
    if (!file) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "File CSV tidak ditemukan.",
        },
      };
    }

    const csvText = await file.text();

    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });
    const actorName = user?.employee?.name || user?.email || "Admin";

    const result = await importFromCsv(csvText, session.userId, actorName, session.role);

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("importEmployeesAction error:", error);
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

export async function crudMasterDataAction(
  entityType: string,
  operation: string,
  id?: string,
  data?: any
) {
  try {
    const session = await requireAuth();

    // Check minimum roles
    if (operation === "CREATE" || operation === "UPDATE" || operation === "DELETE") {
      if (session.role !== "ADMIN") {
        return {
          ok: false as const,
          error: {
            code: "FORBIDDEN",
            message: "Akses ditolak. Perlu role ADMIN.",
          },
        };
      }
    } else {
      // Read operation
      if (session.role !== "ADMIN" && session.role !== "STAFF") {
        return {
          ok: false as const,
          error: {
            code: "FORBIDDEN",
            message: "Akses ditolak. Perlu role STAFF atau ADMIN.",
          },
        };
      }
    }

    const allowedEntities = [
      "EmploymentStatus",
      "EmployeeGroup",
      "ProfessionGroup",
      "EmployeePosition",
      "EmployeeRank",
      "Workplace",
    ];

    if (!allowedEntities.includes(entityType)) {
      return {
        ok: false as const,
        error: {
          code: "BAD_REQUEST",
          message: `Entity type ${entityType} tidak didukung.`,
        },
      };
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId },
      include: { employee: true },
    });
    const actorName = user?.employee?.name || user?.email || "User";

    const result = await handleMasterDataCrud(
      entityType as any,
      operation as any,
      id,
      data,
      session.userId,
      actorName,
      session.role
    );

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("crudMasterDataAction error:", error);
    return {
      ok: false as const,
      error: {
        code:
          error.message === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : error.message === "FORBIDDEN"
            ? "FORBIDDEN"
            : error.message.includes("masih digunakan")
            ? "CONFLICT"
            : "INTERNAL_ERROR",
        message: error.message,
      },
    };
  }
}
