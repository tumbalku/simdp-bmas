/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requireAuth } from "@/lib/auth";
import { AppError, handleActionError } from "@/lib/errors";
import {
  getCurrentProfile as getProfileService,
  updateProfile,
  handleEmployeeCrud,
  addCareerHistory,
  importFromCsv,
  getMasterDataList,
  handleMasterDataCrud,
  getEmployeeDirectory,
  getEmployeeDetail,
  getEmployeeDirectoryWithPagination,
  getActorDisplayName,
} from "@/modules/employee/service";
import {
  updateProfileSchema,
  crudEmployeeSchema,
  addCareerHistorySchema,
  employeeDirectorySchema,
  employeeDirectoryWithPaginationSchema,
  masterDataListQuerySchema,
} from "../schema";

export async function getEmployeeDirectoryAction(filter?: unknown) {
  try {
    await requireAuth("ADMIN");
    const parsed = employeeDirectorySchema.optional().safeParse(filter);
    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." } };
    }

    const data = await getEmployeeDirectory(parsed.data || {});
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getEmployeeDirectoryAction error:", error);
    return handleActionError(error);
  }
}

export async function getEmployeeDirectoryWithPaginationAction(filter?: unknown) {
  try {
    await requireAuth("ADMIN");
    const parsed = employeeDirectoryWithPaginationSchema.optional().safeParse(filter);

    if (!parsed.success) {
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." } };
    }

    const data = await getEmployeeDirectoryWithPagination(parsed.data || {});
    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getEmployeeDirectoryWithPaginationAction error:", error);
    return handleActionError(error);
  }
}

export async function getEmployeeDetailAction(id: string) {
  try {
    await requireAuth("ADMIN");
    const data = await getEmployeeDetail(id);
    if (!data) {
      return { ok: false as const, error: { code: "NOT_FOUND", message: "Pegawai tidak ditemukan." } };
    }

    return { ok: true as const, data };
  } catch (error: any) {
    console.error("getEmployeeDetailAction error:", error);
    return handleActionError(error);
  }
}

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
    return handleActionError(error, { defaultMessage: "Terjadi kesalahan internal" });
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
    const actorName = await getActorDisplayName(session.userId, "User");

    const success = await updateProfile(session.userId, parsed.data, actorName, session.role);

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
    return handleActionError(error, { defaultMessage: "Terjadi kesalahan internal" });
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

    const actorName = await getActorDisplayName(session.userId, "Admin");

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
    if (!(error instanceof AppError)) {
      console.error("crudEmployeeAction error:", error);
    }
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
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

    const actorName = await getActorDisplayName(session.userId, "Admin");

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
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
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

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "File harus berformat CSV.",
        },
      };
    }

    const csvText = await file.text();

    const actorName = await getActorDisplayName(session.userId, "Admin");

    const result = await importFromCsv(csvText, session.userId, actorName, session.role);

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("importEmployeesAction error:", error);
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
  }
}

export async function getMasterDataListAction(
  entityType: string,
  query?: unknown
) {
  try {
    const session = await requireAuth();

    // STAFF can read, but only ADMIN can write
    if (session.role !== "ADMIN" && session.role !== "STAFF") {
      return {
        ok: false as const,
        error: { code: "FORBIDDEN", message: "Akses ditolak." },
      };
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
        error: { code: "BAD_REQUEST", message: "Entity tidak didukung." },
      };
    }

    const parsed = masterDataListQuerySchema.optional().safeParse(query);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Query tidak valid.",
        },
      };
    }

    const result = await getMasterDataList(
      entityType as Parameters<typeof getMasterDataList>[0],
      parsed.data || {}
    );
    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("getMasterDataListAction error:", error);
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
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

    const actorName = await getActorDisplayName(session.userId, "User");

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
    return handleActionError(error, { unauthenticatedMessage: "UNAUTHENTICATED", forbiddenMessage: "FORBIDDEN" });
  }
}
