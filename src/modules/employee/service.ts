/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";
import crypto from "crypto";
import { logActivity } from "@/modules/security/service";

type EmployeeDirectoryFilter = {
  search?: string;
  page?: number;
  limit?: number;
};

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapEmployeeSummary(employee: any) {
  return {
    id: employee.id,
    employeeId: employee.employeeId,
    nik: employee.nik,
    name: employee.name,
    gender: employee.gender,
    phone: employee.phone,
    email: employee.user?.email || null,
    role: employee.user?.role || "EMPLOYEE",
    isActive: employee.user?.isActive ?? true,
    employmentStatus: employee.employmentStatus?.name || null,
    workplace: employee.workplace?.name || null,
    documentCount: employee._count?.documentRecords ?? employee.documentRecords?.length ?? 0,
  };
}

export async function getEmployeeDirectory(filter: EmployeeDirectoryFilter = {}) {
  const where: any = { deletedAt: null };
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { employeeId: { contains: filter.search, mode: "insensitive" } },
      { nik: { contains: filter.search, mode: "insensitive" } },
      { user: { email: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { name: true } },
      workplace: { select: { name: true } },
      _count: { select: { documentRecords: true } },
    },
    orderBy: { name: "asc" },
  });

  return employees.map(mapEmployeeSummary);
}

export async function getEmployeeDirectoryWithPagination(
  filter: EmployeeDirectoryFilter = {}
) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { employeeId: { contains: filter.search, mode: "insensitive" } },
      { nik: { contains: filter.search, mode: "insensitive" } },
      { user: { email: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        user: { select: { email: true, role: true, isActive: true } },
        employmentStatus: { select: { name: true } },
        workplace: { select: { name: true } },
        _count: { select: { documentRecords: true } },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.employee.count({ where }),
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

export async function getEmployeeDetail(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id, deletedAt: null },
    include: {
      user: { select: { email: true, role: true, isActive: true } },
      employmentStatus: { select: { name: true } },
      employeeGroup: { select: { name: true } },
      employeePosition: { select: { name: true } },
      employeeRank: { select: { name: true } },
      workplace: { select: { name: true } },
      careerHistories: {
        orderBy: { effectiveDate: "desc" },
        include: {
          employmentStatus: { select: { name: true } },
          employeeGroup: { select: { name: true } },
          employeePosition: { select: { name: true } },
          employeeRank: { select: { name: true } },
          workplace: { select: { name: true } },
        },
      },
      documentRecords: {
        where: { deletedAt: null },
        orderBy: { uploadedAt: "desc" },
        include: { documentType: { select: { name: true, archiveCategory: true } } },
      },
    },
  });

  if (!employee) return null;

  return {
    ...mapEmployeeSummary(employee),
    birthDate: toIsoDate(employee.birthDate),
    birthPlace: employee.birthPlace,
    academicDegree: employee.academicDegree,
    lastEducation: employee.lastEducation,
    religion: employee.religion,
    maritalStatus: employee.maritalStatus,
    address: employee.address,
    joinDate: toIsoDate(employee.joinDate),
    employeeGroup: employee.employeeGroup?.name || null,
    employeePosition: employee.employeePosition?.name || null,
    employeeRank: employee.employeeRank?.name || null,
    careerHistories: employee.careerHistories.map((item: any) => ({
      id: item.id,
      effectiveDate: toIsoDate(item.effectiveDate),
      endDate: toIsoDate(item.endDate),
      note: item.note,
      employmentStatus: item.employmentStatus?.name || null,
      employeeGroup: item.employeeGroup?.name || null,
      employeePosition: item.employeePosition?.name || null,
      employeeRank: item.employeeRank?.name || null,
      workplace: item.workplace?.name || null,
    })),
    documents: employee.documentRecords.map((doc: any) => ({
      id: doc.id,
      title: doc.title || doc.documentType?.name || "Dokumen",
      status: doc.status,
      uploadedAt: toIsoDate(doc.uploadedAt),
      expiryDate: toIsoDate(doc.expiryDate),
      documentTypeName: doc.documentType?.name || "Dokumen",
      archiveCategory: doc.documentType?.archiveCategory || "PERSONAL",
    })),
  };
}

export async function getCurrentProfile(userId: string) {
  const employee = await prisma.employee.findFirst({
    where: { userId, deletedAt: null },
    include: {
      employmentStatus: true,
      employeeGroup: true,
      employeePosition: true,
      employeeRank: true,
      workplace: true,
    },
  });

  return employee;
}

export async function getActorDisplayName(userId: string, fallback: string = "User"): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: { employee: true },
  });
  return user?.employee?.name || user?.email || fallback;
}

export async function updateProfile(
  userId: string,
  data: {
    phone?: string;
    address?: string;
    birthPlace?: string;
    birthDate?: string;
    religion?: string;
    maritalStatus?: string;
  },
  actorName: string,
  actorRole: string
) {
  const employee = await prisma.employee.findFirst({
    where: { userId, deletedAt: null },
  });

  if (!employee) return false;

  const updateData: any = {
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
    birthPlace: data.birthPlace ?? undefined,
    birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
    religion: data.religion ?? undefined,
    maritalStatus: data.maritalStatus ?? undefined,
  };

  await prisma.employee.update({
    where: { id: employee.id },
    data: updateData,
  });

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
  operation: "CREATE" | "UPDATE" | "DELETE" | "RESTORE",
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
      throw new Error("Email dan Nama wajib diisi");
    }
    if (!data.employeeId && !data.nik) {
      throw new Error("NIP (employeeId) atau NIK wajib diisi");
    }

    // Check duplicate
    if (data.email) {
      const exist = await prisma.user.findFirst({ where: { email: data.email } });
      if (exist) throw new Error("Email sudah terdaftar");
    }
    if (data.employeeId) {
      const exist = await prisma.employee.findFirst({ where: { employeeId: data.employeeId } });
      if (exist) throw new Error("NIP sudah terdaftar");
    }
    if (data.nik) {
      const exist = await prisma.employee.findFirst({ where: { nik: data.nik } });
      if (exist) throw new Error("NIK sudah terdaftar");
    }

    const userId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();
    // Do not create accounts with a shared default password. Admin-created
    // users should activate access through the password reset flow.
    const passwordHash = await argon2.hash(crypto.randomBytes(24).toString("base64url"));

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          email: data.email,
          passwordHash,
          role: data.role || "EMPLOYEE",
          isActive: true,
        },
      });

      const employee = await tx.employee.create({
        data: {
          id: employeeId,
          userId: userId,
          employeeId: data.employeeId || null,
          nik: data.nik || null,
          name: data.name,
          gender: data.gender || null,
          birthPlace: data.birthPlace || null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          academicDegree: data.academicDegree || null,
          lastEducation: data.lastEducation || null,
          religion: data.religion || null,
          maritalStatus: data.maritalStatus || null,
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

      return { user, employee };
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
    if (!id) throw new Error("ID pegawai wajib diisi");

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) throw new Error("Pegawai tidak ditemukan");

    // Check duplicate if values changed
    if (data.email && data.email !== employee.user.email) {
      const exist = await prisma.user.findFirst({ where: { email: data.email } });
      if (exist) throw new Error("Email sudah terdaftar");
    }
    if (data.employeeId && data.employeeId !== employee.employeeId) {
      const exist = await prisma.employee.findFirst({ where: { employeeId: data.employeeId } });
      if (exist) throw new Error("NIP sudah terdaftar");
    }
    if (data.nik && data.nik !== employee.nik) {
      const exist = await prisma.employee.findFirst({ where: { nik: data.nik } });
      if (exist) throw new Error("NIK sudah terdaftar");
    }

    const result = await prisma.$transaction(async (tx) => {
      if (data.email || data.role !== undefined) {
        await tx.user.update({
          where: { id: employee.userId },
          data: {
            email: data.email ?? undefined,
            role: data.role ?? undefined,
          },
        });
      }

      const updated = await tx.employee.update({
        where: { id },
        data: {
          employeeId: data.employeeId !== undefined ? data.employeeId : undefined,
          nik: data.nik !== undefined ? data.nik : undefined,
          name: data.name ?? undefined,
          gender: data.gender !== undefined ? data.gender : undefined,
          birthPlace: data.birthPlace !== undefined ? data.birthPlace : undefined,
          birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : undefined,
          academicDegree: data.academicDegree !== undefined ? data.academicDegree : undefined,
          lastEducation: data.lastEducation !== undefined ? data.lastEducation : undefined,
          religion: data.religion !== undefined ? data.religion : undefined,
          maritalStatus: data.maritalStatus !== undefined ? data.maritalStatus : undefined,
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

      return updated;
    });

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_UPDATED",
      resource: `Employee:${id}`,
      status: "SUCCESS",
      metadata: { name: result.name },
    });

    return { id: result.id, name: result.name };
  }

  if (operation === "DELETE") {
    if (!id) throw new Error("ID pegawai wajib diisi");

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) throw new Error("Pegawai tidak ditemukan");

    await prisma.$transaction([
      prisma.employee.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_DELETED",
      resource: `Employee:${id}`,
      status: "SUCCESS",
    });

    return { id, name: employee.name };
  }

  if (operation === "RESTORE") {
    if (!id) throw new Error("ID pegawai wajib diisi");

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) throw new Error("Pegawai tidak ditemukan");

    await prisma.$transaction([
      prisma.employee.update({
        where: { id },
        data: { deletedAt: null },
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: { deletedAt: null },
      }),
    ]);

    await logActivity({
      ...systemActor,
      eventType: "EMPLOYEE_RESTORED",
      resource: `Employee:${id}`,
      status: "SUCCESS",
    });

    return { id, name: employee.name };
  }

  throw new Error("Operasi tidak didukung");
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

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create history record
    const history = await tx.employeeCareerHistory.create({
      data: {
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
    });

    // 2. Check if this is the newest effectiveDate to update current assignment
    const newestHistory = await tx.employeeCareerHistory.findFirst({
      where: { employeeId: data.employeeId },
      orderBy: { effectiveDate: "desc" },
    });

    if (newestHistory && newestHistory.id === historyId) {
      await tx.employee.update({
        where: { id: data.employeeId },
        data: {
          employmentStatusId: data.employmentStatusId || null,
          employeeGroupId: data.employeeGroupId || null,
          employeePositionId: data.employeePositionId || null,
          employeeRankId: data.employeeRankId || null,
          workplaceId: data.workplaceId || null,
        },
      });
    }

    return history;
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
  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
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
  const modelDelegate = (prisma as any)[modelName];

  if (!modelDelegate) throw new Error(`Entity type ${entityType} tidak didukung`);

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
    modelDelegate.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    modelDelegate.count({ where }),
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
  const modelDelegate = (prisma as any)[
    entityType.charAt(0).toLowerCase() + entityType.slice(1)
  ];

  if (!modelDelegate) throw new Error(`Entity type ${entityType} tidak didukung`);

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

    const record = await modelDelegate.create({ data: createData });

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

    const record = await modelDelegate.update({
      where: { id },
      data: updateData,
    });

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
      const record = await modelDelegate.delete({
        where: { id },
      });

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
