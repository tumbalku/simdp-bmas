/* eslint-disable @typescript-eslint/no-explicit-any */
import * as argon2 from "argon2";
import crypto from "crypto";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/modules/security/service";
import * as repository from "./repository";
import { mapEmployeeSummary, mapEmployeeDetail } from "./mappers";
import {
  EMPLOYEE_STATUS_VALUE,
  mapEmployeeStatusLegacyToCanonical,
  mapGenderLegacyToCanonical,
  mapMaritalStatusLegacyToCanonical,
  mapReligionLegacyToCanonical,
} from "./constants";

type EmployeeDirectoryFilter = {
  archiveView?: "active" | "archived";
  search?: string;
  page?: number;
  limit?: number;
  employmentStatusId?: string;
  employeeGroupId?: string;
  professionGroupId?: string;
  employeePositionId?: string;
  employeeRankId?: string;
  workplaceId?: string;
  maritalStatus?: string;
  lastEducation?: string;
  tmtStartDate?: string;
  tmtEndDate?: string;
  retirementAgeFrom?: number;
  retirementAgeTo?: number;
  status?: string;
};

type EmployeeExportActor = {
  actorId: string;
  actorName: string;
  actorRole: string;
};

const EMPLOYEE_EXPORT_HEADERS = [
  "Nama",
  "NIP",
  "NIK",
  "Email",
  "Role",
  "Status Pegawai",
  "Status Akun",
  "Status Kepegawaian",
  "Jenis Kepegawaian",
  "Jabatan",
  "Golongan",
  "Unit Kerja",
  "Telepon",
  "Pendidikan",
] as const;

const EMPLOYEE_EXPORT_DELIMITER = ";";

function getDateAtAge(age: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - age);
  return date;
}

function buildEmployeeDirectoryWhere(filter: EmployeeDirectoryFilter) {
  const where: any = {
    deletedAt: filter.archiveView === "archived" ? { not: null } : null,
  };

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { employeeId: { contains: filter.search, mode: "insensitive" } },
      { nik: { contains: filter.search, mode: "insensitive" } },
      { user: { email: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  if (filter.employmentStatusId) where.employmentStatusId = filter.employmentStatusId;
  if (filter.employeeGroupId) where.employeeGroupId = filter.employeeGroupId;
  if (filter.professionGroupId) {
    where.employeePosition = { professionGroupId: filter.professionGroupId };
  }
  if (filter.employeePositionId) where.employeePositionId = filter.employeePositionId;
  if (filter.employeeRankId) where.employeeRankId = filter.employeeRankId;
  if (filter.workplaceId) where.workplaceId = filter.workplaceId;
  if (filter.maritalStatus) where.maritalStatus = canonicalMaritalStatus(filter.maritalStatus);
  if (filter.status) where.status = canonicalEmployeeStatus(filter.status);
  if (filter.lastEducation) where.lastEducation = filter.lastEducation;

  if (filter.tmtStartDate) {
    where.tmtStartDate = { ...(where.tmtStartDate || {}), gte: new Date(filter.tmtStartDate) };
  }
  if (filter.tmtEndDate) {
    where.tmtEndDate = { ...(where.tmtEndDate || {}), lte: new Date(filter.tmtEndDate) };
  }

  if (filter.retirementAgeFrom !== undefined || filter.retirementAgeTo !== undefined) {
    where.birthDate = { ...(where.birthDate || {}) };
    if (filter.retirementAgeFrom !== undefined) {
      where.birthDate.lte = getDateAtAge(filter.retirementAgeFrom);
    }
    if (filter.retirementAgeTo !== undefined) {
      const minimumBirthDate = getDateAtAge(filter.retirementAgeTo + 1);
      minimumBirthDate.setDate(minimumBirthDate.getDate() + 1);
      where.birthDate.gte = minimumBirthDate;
    }
  }

  return where;
}

function canonicalEmployeeStatus(value: string | null | undefined) {
  return mapEmployeeStatusLegacyToCanonical(value) ?? EMPLOYEE_STATUS_VALUE.ACTIVE;
}

function canonicalGender(value: string | null | undefined) {
  return mapGenderLegacyToCanonical(value);
}

function canonicalMaritalStatus(value: string | null | undefined) {
  return mapMaritalStatusLegacyToCanonical(value);
}

function canonicalReligion(value: string | null | undefined) {
  return mapReligionLegacyToCanonical(value);
}

export async function getEmployeeDirectory(filter: EmployeeDirectoryFilter = {}) {
  const where = buildEmployeeDirectoryWhere(filter);

  const employees = await repository.findEmployees(where);
  return employees.map(mapEmployeeSummary);
}

export async function getEmployeeDirectoryWithPagination(
  filter: EmployeeDirectoryFilter = {}
) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where = buildEmployeeDirectoryWhere(filter);

  const [employees, total] = await Promise.all([
    repository.findEmployeesWithPagination(where, skip, limit),
    repository.countEmployees(where),
  ]);

  return {
    data: employees.map(mapEmployeeSummary),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function escapeCsvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  if (
    text.includes('"') ||
    text.includes(EMPLOYEE_EXPORT_DELIMITER) ||
    text.includes("\n") ||
    text.includes(String.fromCharCode(13))
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportEmployeeDirectoryCsv(
  filter: EmployeeDirectoryFilter = {},
  actor: EmployeeExportActor
) {
  const where = buildEmployeeDirectoryWhere(filter);
  const employees = await repository.findEmployeesForExport(where);
  const rows = employees.map((employee: any) => [
    employee.name,
    employee.employeeId,
    employee.nik,
    employee.user?.email,
    employee.user?.role || "EMPLOYEE",
    employee.status || "Aktif",
    employee.user?.isActive === false ? "Nonaktif" : "Aktif",
    employee.employmentStatus?.name,
    employee.employeeGroup?.name,
    employee.employeePosition?.name,
    employee.employeeRank?.name,
    employee.workplace?.name,
    employee.phone,
    employee.lastEducation,
  ]);

  await logActivity({
    ...actor,
    eventType: "EMPLOYEE_EXPORTED",
    resource: "EmployeeDirectory",
    status: "SUCCESS",
    metadata: {
      rowCount: employees.length,
      archiveView: filter.archiveView || "active",
    },
  });

  return [EMPLOYEE_EXPORT_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvCell).join(EMPLOYEE_EXPORT_DELIMITER))
    .join("\n");
}

export async function getEmployeeDetail(id: string) {
  const employee = await repository.findEmployeeDetailById(id);
  if (!employee) return null;
  return mapEmployeeDetail(employee);
}

export async function getCurrentProfile(userId: string) {
  const employee = await repository.findEmployeeByUserId(userId);
  return employee;
}

export async function getActorDisplayName(userId: string, fallback: string = "User"): Promise<string> {
  const user = await repository.findUserWithEmployeeById(userId);
  return user?.employee?.name || user?.email || fallback;
}

export async function updateProfile(
  userId: string,
  data: {
    phone?: string | null;
    address?: string | null;
    birthPlace?: string | null;
    birthDate?: string | null;
    religion?: string | null;
    maritalStatus?: string | null;
  },
  actorName: string,
  actorRole: string
) {
  const employee = await repository.findEmployeeSimpleByUserId(userId);
  if (!employee) return false;

  const updateData = Object.fromEntries(
    Object.entries({
      phone: data.phone,
      address: data.address,
      birthPlace: data.birthPlace,
      birthDate: data.birthDate === undefined ? undefined : data.birthDate ? new Date(data.birthDate) : null,
      religion: data.religion === undefined ? undefined : canonicalReligion(data.religion),
      maritalStatus: data.maritalStatus,
    }).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updateData).length === 0) return true;

  await repository.updateEmployee(employee.id, updateData);

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: "EMPLOYEE_UPDATED",
    resource: `EmployeeProfile:${employee.id}`,
    status: "SUCCESS",
    metadata: { updatedFields: Object.keys(updateData) },
  });

  return true;
}

export async function handleEmployeeCrud(
  operation: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "PERMANENT_DELETE",
  id?: string,
  data?: any,
  actorId?: string,
  actorName?: string,
  actorRole?: string
) {
  const systemActor = {
    actorId: actorId || null,
    actorName: actorName || "System",
    actorRole: actorRole || "ADMIN",
  };

  if (operation === "CREATE") {
    if (!data.email || !data.name) {
      throw new AppError("VALIDATION_ERROR", "Email dan Nama wajib diisi", 400);
    }
    if (!data.employeeId && !data.nik) {
      throw new AppError("VALIDATION_ERROR", "NIP atau NIK wajib diisi. Isi minimal salah satu identitas pegawai.", 400, [
        { path: "employeeId", message: "Isi NIP atau NIK." },
        { path: "nik", message: "Isi NIK atau NIP." },
      ]);
    }

    // Check duplicate
    if (data.email) {
      const exist = await repository.findUserByEmail(data.email);
      if (exist) throw new AppError("CONFLICT", "Email sudah terdaftar. Gunakan email lain.", 409);
    }
    if (data.employeeId) {
      const exist = await repository.findEmployeeByEmployeeId(data.employeeId);
      if (exist) throw new AppError("CONFLICT", "NIP sudah terdaftar. Periksa kembali NIP pegawai.", 409);
    }
    if (data.nik) {
      const exist = await repository.findEmployeeByNik(data.nik);
      if (exist) throw new AppError("CONFLICT", "NIK sudah terdaftar. Periksa kembali NIK pegawai.", 409);
    }

    const userId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();
    // Do not create accounts with a shared default password. Admin-created
    // users should activate access through the password reset flow.
    const passwordHash = await argon2.hash(crypto.randomBytes(24).toString("base64url"));

    const result = await repository.createEmployeeWithUserTransaction({
      user: {
        id: userId,
        email: data.email,
        passwordHash,
        role: data.role || "EMPLOYEE",
        isActive: data.isActive ?? true,
      },
      employee: {
        id: employeeId,
        userId: userId,
        employeeId: data.employeeId || null,
        nik: data.nik || null,
        name: data.name,
        status: canonicalEmployeeStatus(data.status),
        gender: canonicalGender(data.gender),
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        academicDegree: data.academicDegree || null,
        lastEducation: data.lastEducation || null,
        religion: canonicalReligion(data.religion),
        maritalStatus: canonicalMaritalStatus(data.maritalStatus),
        phone: data.phone || null,
        address: data.address || null,
        joinDate: data.joinDate ? new Date(data.joinDate) : null,
        hasTmt: data.hasTmt ?? false,
        tmtStartDate: data.tmtStartDate ? new Date(data.tmtStartDate) : null,
        tmtEndDate: data.tmtEndDate ? new Date(data.tmtEndDate) : null,
        employmentStatusId: data.employmentStatusId || null,
        employeeGroupId: data.employeeGroupId || null,
        employeePositionId: data.employeePositionId || null,
        employeeRankId: data.employeeRankId || null,
        workplaceId: data.workplaceId || null,
        createdBy: systemActor.actorId,
      },
    });

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_CREATED",
      resource: `Employee:${employeeId}`,
      status: "SUCCESS",
      metadata: { email: data.email, name: data.name },
    });

    return { id: result.employee.id, name: result.employee.name };
  }

  if (operation === "UPDATE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeWithUserById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);

    // Check duplicate if values changed
    if (data.email && data.email !== employee.user.email) {
      const exist = await repository.findUserByEmail(data.email);
      if (exist) throw new AppError("CONFLICT", "Email sudah terdaftar. Gunakan email lain.", 409);
    }
    if (data.employeeId && data.employeeId !== employee.employeeId) {
      const exist = await repository.findEmployeeByEmployeeId(data.employeeId);
      if (exist) throw new AppError("CONFLICT", "NIP sudah terdaftar. Periksa kembali NIP pegawai.", 409);
    }
    if (data.nik && data.nik !== employee.nik) {
      const exist = await repository.findEmployeeByNik(data.nik);
      if (exist) throw new AppError("CONFLICT", "NIK sudah terdaftar. Periksa kembali NIK pegawai.", 409);
    }

    if (data.isActive === false && employee.userId === systemActor.actorId) {
      throw new AppError("VALIDATION_ERROR", "Akun sendiri tidak dapat dinonaktifkan.", 400);
    }

    const userUpdateData = {
      ...(data.email !== undefined && data.email !== employee.user.email ? { email: data.email } : {}),
      ...(data.role !== undefined && data.role !== employee.user.role ? { role: data.role } : {}),
      ...(data.isActive !== undefined && data.isActive !== employee.user.isActive ? { isActive: data.isActive } : {}),
    };
    const accountUpdatedFields = Object.keys(userUpdateData);

    const result = await repository.updateEmployeeWithUserTransaction({
      id,
      userId: employee.userId,
      user: accountUpdatedFields.length > 0 ? userUpdateData : undefined,
      employee: {
        employeeId: data.employeeId !== undefined ? data.employeeId : undefined,
        nik: data.nik !== undefined ? data.nik : undefined,
        name: data.name ?? undefined,
        status: data.status !== undefined ? canonicalEmployeeStatus(data.status) : undefined,
        gender: data.gender !== undefined ? canonicalGender(data.gender) : undefined,
        birthPlace: data.birthPlace !== undefined ? data.birthPlace : undefined,
        birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : undefined,
        academicDegree: data.academicDegree !== undefined ? data.academicDegree : undefined,
        lastEducation: data.lastEducation !== undefined ? data.lastEducation : undefined,
        religion: data.religion !== undefined ? canonicalReligion(data.religion) : undefined,
        maritalStatus: data.maritalStatus !== undefined ? canonicalMaritalStatus(data.maritalStatus) : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        address: data.address !== undefined ? data.address : undefined,
        joinDate: data.joinDate !== undefined ? (data.joinDate ? new Date(data.joinDate) : null) : undefined,
        hasTmt: data.hasTmt !== undefined ? data.hasTmt : undefined,
        tmtStartDate: data.tmtStartDate !== undefined ? (data.tmtStartDate ? new Date(data.tmtStartDate) : null) : undefined,
        tmtEndDate: data.tmtEndDate !== undefined ? (data.tmtEndDate ? new Date(data.tmtEndDate) : null) : undefined,
        employmentStatusId: data.employmentStatusId !== undefined ? data.employmentStatusId : undefined,
        employeeGroupId: data.employeeGroupId !== undefined ? data.employeeGroupId : undefined,
        employeePositionId: data.employeePositionId !== undefined ? data.employeePositionId : undefined,
        employeeRankId: data.employeeRankId !== undefined ? data.employeeRankId : undefined,
        workplaceId: data.workplaceId !== undefined ? data.workplaceId : undefined,
        updatedBy: systemActor.actorId,
      },
    });

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_UPDATED",
      resource: `Employee:${id}`,
      status: "SUCCESS",
      metadata: { name: result.name },
    });

    if (accountUpdatedFields.length > 0) {
      await logActivity({
        ...systemActor,
        eventType: "EMPLOYEE_ACCOUNT_UPDATED",
        resource: `User:${employee.userId}`,
        status: "SUCCESS",
        metadata: {
          employeeId: id,
          updatedFields: accountUpdatedFields,
        },
      });
    }

    return { id: result.id, name: result.name };
  }

  if (operation === "DELETE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);

    await repository.softDeleteEmployeeAndUser(id, employee.userId);

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_DELETED",
      resource: `Employee:${id}`,
      status: "SUCCESS",
    });

    return { id, name: employee.name };
  }

  if (operation === "RESTORE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);

    await repository.restoreEmployeeAndUser(id, employee.userId);

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_RESTORED",
      resource: `Employee:${id}`,
      status: "SUCCESS",
    });

    return { id, name: employee.name };
  }

  if (operation === "PERMANENT_DELETE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);
    if (!employee.deletedAt) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Pegawai aktif harus diarsipkan terlebih dahulu sebelum dihapus permanen.",
        400
      );
    }
    if (employee.userId === systemActor.actorId) {
      throw new AppError("VALIDATION_ERROR", "Akun sendiri tidak dapat dihapus permanen.", 400);
    }

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_PERMANENTLY_DELETED",
      resource: `Employee:${id}`,
      status: "SUCCESS",
      metadata: {
        employeeName: employee.name,
        userId: employee.userId,
      },
    });

    await repository.permanentlyDeleteEmployeeAndUser(id, employee.userId);

    return { id, name: employee.name };
  }

  throw new AppError("BAD_REQUEST", "Operasi tidak didukung.", 400);
}

export async function addCareerHistory(data: {
  employeeId: string;
  employmentStatusId?: string;
  employeeGroupId?: string;
  employeePositionId?: string;
  employeeRankId?: string;
  workplaceId?: string;
  effectiveDate: string;
  note?: string;
  createdBy?: string;
  actorName?: string;
  actorRole?: string;
}) {
  const historyId = crypto.randomUUID();
  const effectiveDate = new Date(data.effectiveDate);
  const currentAssignment: Record<string, string | null> = {};

  if (data.employmentStatusId !== undefined) currentAssignment.employmentStatusId = data.employmentStatusId || null;
  if (data.employeeGroupId !== undefined) currentAssignment.employeeGroupId = data.employeeGroupId || null;
  if (data.employeePositionId !== undefined) currentAssignment.employeePositionId = data.employeePositionId || null;
  if (data.employeeRankId !== undefined) currentAssignment.employeeRankId = data.employeeRankId || null;
  if (data.workplaceId !== undefined) currentAssignment.workplaceId = data.workplaceId || null;

  const result = await repository.createCareerHistoryAndUpdateCurrent({
    history: {
      id: historyId,
      employeeId: data.employeeId,
      employmentStatusId: data.employmentStatusId || null,
      employeeGroupId: data.employeeGroupId || null,
      employeePositionId: data.employeePositionId || null,
      employeeRankId: data.employeeRankId || null,
      workplaceId: data.workplaceId || null,
      effectiveDate,
      note: data.note || null,
      createdBy: data.createdBy || null,
    },
    currentAssignment,
  });

  await logActivity({
    actorId: data.createdBy || null,
    actorName: data.actorName || "System",
    actorRole: data.actorRole || "ADMIN",
    eventType: "EMPLOYEE_UPDATED",
    resource: `Employee:${data.employeeId}`,
    status: "SUCCESS",
    metadata: { careerHistoryId: historyId, action: "add_career_history" },
  });

  return { id: result.id, effectiveDate: data.effectiveDate };
}

export async function importFromCsv(
  csvText: string,
  actorId: string,
  actorName: string,
  actorRole: string
) {
  const parseCsvLine = (line: string, delimiter: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  };

  const parseCsv = (text: string) => {
    const lines = text.split(String.fromCharCode(10)).map((line) => line.replace(String.fromCharCode(13), "")).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return [];
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const headers = parseCsvLine(lines[0], delimiter).map((h) => h.replace(/^﻿/, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i], delimiter);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }
    return rows;
  };

  const rows = parseCsv(csvText);
  let importedCount = 0;
  let failedCount = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed plus header

    try {
      if (!row.email || !row.name) {
        throw new Error("Email dan Nama wajib diisi");
      }
      if (!row.employeeId && !row.nik) {
        throw new Error("NIP (employeeId) atau NIK wajib diisi");
      }

      await handleEmployeeCrud(
        "CREATE",
        undefined,
        {
          email: row.email,
          name: row.name,
          role: row.role || "EMPLOYEE",
          employeeId: row.employeeId || null,
          nik: row.nik || null,
          gender: canonicalGender(row.gender),
          birthPlace: row.birthPlace || null,
          birthDate: row.birthDate || null,
          academicDegree: row.academicDegree || null,
          lastEducation: row.lastEducation || null,
          religion: canonicalReligion(row.religion),
          maritalStatus: canonicalMaritalStatus(row.maritalStatus),
          phone: row.phone || null,
          address: row.address || null,
          joinDate: row.joinDate || null,
          employmentStatusId: row.employmentStatusId || null,
          employeeGroupId: row.employeeGroupId || null,
          employeePositionId: row.employeePositionId || null,
          employeeRankId: row.employeeRankId || null,
          workplaceId: row.workplaceId || null,
        },
        actorId,
        actorName,
        actorRole
      );

      importedCount++;
    } catch (err: any) {
      failedCount++;
      errors.push({ row: rowNum, error: err.message });
    }
  }

  await logActivity({
    actorId,
    actorName,
    actorRole,
    eventType: "EMPLOYEE_UPDATED",
    resource: "BulkImport",
    status: "SUCCESS",
    metadata: { importedCount, failedCount },
  });

  return { importedCount, failedCount, errors };
}

export async function getMasterDataList(
  entityType:
    | "EmploymentStatus"
    | "EmployeeGroup"
    | "ProfessionGroup"
    | "EmployeePosition"
    | "EmployeeRank"
    | "Workplace",
  query: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;
  const modelName = entityType.charAt(0).toLowerCase() + entityType.slice(1);

  const where: any = {};
  if (query.search) {
    where.OR = [{ name: { contains: query.search, mode: "insensitive" } }];
  }

  const include: any = {};
  if (entityType === "EmployeeGroup") {
    include.employmentStatus = { select: { id: true, name: true } };
  }
  if (entityType === "EmployeePosition") {
    include.professionGroup = { select: { id: true, name: true } };
  }

  const [records, total] = await Promise.all([
    repository.findMasterDataMany(modelName, {
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    repository.countMasterData(modelName, { where }),
  ]);

  return {
    data: records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function handleMasterDataCrud(
  entityType:
    | "EmploymentStatus"
    | "EmployeeGroup"
    | "ProfessionGroup"
    | "EmployeePosition"
    | "EmployeeRank"
    | "Workplace",
  operation: "CREATE" | "UPDATE" | "DELETE",
  id?: string,
  data?: any,
  actorId?: string,
  actorName?: string,
  actorRole?: string
) {
  const modelName = entityType.charAt(0).toLowerCase() + entityType.slice(1);

  const systemActor = {
    actorId: actorId || null,
    actorName: actorName || "System",
    actorRole: actorRole || "ADMIN",
  };

  if (operation === "CREATE") {
    const newId = crypto.randomUUID();
    const createData = {
      id: newId,
      ...data,
      createdBy: systemActor.actorId,
    };

    const record = await repository.createMasterData(modelName, createData);

    await logActivity({
      ...systemActor,
      eventType: "MASTER_DATA_CREATED",
      resource: `${entityType}:${newId}`,
      status: "SUCCESS",
      metadata: { name: record.name },
    });

    return record;
  }

  if (operation === "UPDATE") {
    if (!id) throw new Error("ID master data wajib diisi");

    const updateData = {
      ...data,
      updatedBy: systemActor.actorId,
      updatedAt: new Date(),
    };

    const record = await repository.updateMasterData(modelName, id, updateData);

    await logActivity({
      ...systemActor,
      eventType: "MASTER_DATA_UPDATED",
      resource: `${entityType}:${id}`,
      status: "SUCCESS",
      metadata: { name: record.name },
    });

    return record;
  }

  if (operation === "DELETE") {
    if (!id) throw new Error("ID master data wajib diisi");

    // First check if records are still referenced. Since this is hard delete, prisma will throw foreign key constraint errors natively.
    // We catch it and throw a user friendly error.
    try {
      const record = await repository.deleteMasterData(modelName, id);

      await logActivity({
        ...systemActor,
        eventType: "MASTER_DATA_DELETED",
        resource: `${entityType}:${id}`,
        status: "SUCCESS",
        metadata: { name: record.name },
      });

      return record;
    } catch (err: any) {
      if (err.code === "P2003") {
        throw new Error(
          "Master data tidak dapat dihapus karena masih digunakan oleh data pegawai atau dokumen."
        );
      }
      throw err;
    }
  }

  throw new Error("Operasi tidak didukung");
}
