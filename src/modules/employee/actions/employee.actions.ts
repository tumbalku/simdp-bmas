/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requireAuth } from "@/lib/auth";
import { AppError, handleActionError } from "@/lib/errors";
import {
  getCurrentProfile as getProfileService,
  updateProfile,
  uploadProfileAvatar,
  handleEmployeeCrud,
  addCareerHistory,
  importFromCsv,
  getMasterDataList,
  handleMasterDataCrud,
  getEmployeeDirectory,
  getEmployeeDetail,
  getEmployeeDirectoryWithPagination,
  getActorDisplayName,
} from "../service";
import {
  updateProfileSchema,
  crudEmployeeSchema,
  addCareerHistorySchema,
  employeeDirectorySchema,
  employeeDirectoryWithPaginationSchema,
  masterDataListQuerySchema,
  bulkCreateEmployeesSchema,
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

export async function uploadProfileAvatarAction(formData: FormData) {
  try {
    const session = await requireAuth();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Foto profil wajib dipilih.",
        },
      };
    }

    const actorName = await getActorDisplayName(session.userId, "User");
    const result = await uploadProfileAvatar({ file }, { userId: session.userId, role: session.role }, actorName);

    return { ok: true as const, data: result };
  } catch (error: any) {
    console.error("uploadProfileAvatarAction error:", error);
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

export async function bulkCreateEmployeesAction(employees: any[]) {
  try {
    const session = await requireAuth("ADMIN");
    const actorName = await getActorDisplayName(session.userId, "Admin");

    const parsed = bulkCreateEmployeesSchema.safeParse(employees);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data input tidak valid: " + parsed.error.issues.map(i => i.message).join(", "),
        },
      };
    }

    const validatedEmployees = parsed.data;
    let importedCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < validatedEmployees.length; i++) {
      const row = validatedEmployees[i];
      const rowNum = i + 1;

      try {
        await handleEmployeeCrud(
          "CREATE",
          undefined,
          {
            email: row.email,
            name: row.name,
            role: row.role,
            employeeId: row.employeeId || null,
            nik: row.nik || null,
            gender: row.gender || null,
            birthPlace: row.birthPlace || null,
            birthDate: row.birthDate || null,
            academicDegree: row.academicDegree || null,
            lastEducation: row.lastEducation || null,
            religion: row.religion || null,
            maritalStatus: row.maritalStatus || null,
            phone: row.phone || null,
            address: row.address || null,
            joinDate: row.joinDate || null,
            employmentStatusId: row.employmentStatusId || null,
            employeeGroupId: row.employeeGroupId || null,
            employeePositionId: row.employeePositionId || null,
            employeeRankId: row.employeeRankId || null,
            workplaceId: row.workplaceId || null,
            status: row.status,
          },
          session.userId,
          actorName,
          session.role
        );

        importedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({ row: rowNum, error: err.message });
      }
    }

    return { ok: true as const, data: { importedCount, failedCount, errors } };
  } catch (error: any) {
    console.error("bulkCreateEmployeesAction error:", error);
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
