/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repository from "../repository";

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
    actorRole: actorRole || SECURITY_ACTOR_ROLE.ADMIN,
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
      eventType: SECURITY_EVENT_TYPE.MASTER_DATA_CREATED,
      resource: `${entityType}:${newId}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
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
      eventType: SECURITY_EVENT_TYPE.MASTER_DATA_UPDATED,
      resource: `${entityType}:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
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
        eventType: SECURITY_EVENT_TYPE.MASTER_DATA_DELETED,
        resource: `${entityType}:${id}`,
        status: SECURITY_LOG_STATUS.SUCCESS,
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
