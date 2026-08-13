/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import { AppError } from "@/lib/errors";
import { mapDocumentType, mapDocumentTypeFormInitialData, mapDocumentTypeSummary } from "../mappers";
import * as repo from "../repository";
import { matchesDocumentTypeTarget } from "../target-rules";
import type { TokenPayload } from "@/lib/auth";
import type { DocumentTypeListFilter } from "./shared";

export async function getAvailableDocumentTypes(session?: TokenPayload) {
  const types = await repo.findManyAvailableDocumentTypes();

  if (!session) {
    return types.map(mapDocumentType);
  }

  const employee = await repo.findEmployeeTargetProfileByUserId(session.userId);
  if (!employee) return [];

  return types
    .filter((type) => matchesDocumentTypeTarget(employee, type))
    .map(mapDocumentType);
}

export async function getDocumentTypesWithPagination(filter: DocumentTypeListFilter = {}) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  if (filter.archiveCategory) {
    where.archiveCategory = filter.archiveCategory;
  }

  if (filter.search) {
    where.OR = [
      { code: { contains: filter.search, mode: "insensitive" } },
      { name: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [types, total] = await repo.findDocumentTypesWithPagination(where, skip, limit);

  const totalPages = Math.ceil(total / limit);
  return {
    data: types.map(mapDocumentTypeSummary),
    pagination: {
      page,
      pageSize: limit,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getDocumentTypeForAdminEdit(id: string) {
  const docType = await repo.findDocumentTypeById(id);

  if (!docType || docType.deletedAt) {
    throw new AppError("NOT_FOUND", "Jenis dokumen tidak ditemukan", 404);
  }

  return mapDocumentTypeFormInitialData(docType);
}

export async function handleDocumentTypeCrud(
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
    actorRole: actorRole || SECURITY_ACTOR_ROLE.ADMIN,
  };

  if (operation === "CREATE") {
    if (!data.code || !data.name || !data.archiveCategory || !data.allowedFormats || !data.maxSizeMb) {
      throw new Error("Field wajib DocumentType tidak boleh kosong");
    }

    const typeId = crypto.randomUUID();
    const insertData = {
      id: typeId,
      code: data.code,
      name: data.name,
      description: data.description || null,
      archiveCategory: data.archiveCategory,
      isMandatory: data.isMandatory ?? false,
      allowMultiple: data.allowMultiple ?? false,
      requiresExpiryDate: data.requiresExpiryDate ?? false,
      requiresIssueDate: data.requiresIssueDate ?? false,
      requiresDocumentNumber: data.requiresDocumentNumber ?? false,
      allowedFormats: data.allowedFormats,
      maxSizeMb: parseFloat(data.maxSizeMb),
      createdBy: systemActor.actorId,
    };

    const relationIds = {
      professionGroupIds: data.professionGroupIds,
      employmentStatusIds: data.employmentStatusIds,
      employeeGroupIds: data.employeeGroupIds,
      employeePositionIds: data.employeePositionIds,
      employeeRankIds: data.employeeRankIds,
      workplaceIds: data.workplaceIds,
    };

    const result = await repo.createDocumentTypeWithRelations(typeId, insertData, relationIds);

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.MASTER_DATA_CREATED,
      resource: `DocumentType:${typeId}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { code: result.code, name: result.name },
    });

    return { id: result.id, code: result.code, name: result.name };
  }

  if (operation === "UPDATE") {
    if (!id) throw new Error("ID jenis dokumen wajib diisi");

    const docType = await repo.findDocumentTypeById(id);
    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    const updateData = {
      code: data.code ?? undefined,
      name: data.name ?? undefined,
      description: data.description !== undefined ? data.description : undefined,
      archiveCategory: data.archiveCategory ?? undefined,
      isMandatory: data.isMandatory ?? undefined,
      allowMultiple: data.allowMultiple ?? undefined,
      requiresExpiryDate: data.requiresExpiryDate ?? undefined,
      requiresIssueDate: data.requiresIssueDate ?? undefined,
      requiresDocumentNumber: data.requiresDocumentNumber ?? undefined,
      allowedFormats: data.allowedFormats ?? undefined,
      maxSizeMb: data.maxSizeMb ? parseFloat(data.maxSizeMb) : undefined,
      updatedBy: systemActor.actorId,
      updatedAt: new Date(),
    };

    const relationIds = {
      professionGroupIds: data.professionGroupIds,
      employmentStatusIds: data.employmentStatusIds,
      employeeGroupIds: data.employeeGroupIds,
      employeePositionIds: data.employeePositionIds,
      employeeRankIds: data.employeeRankIds,
      workplaceIds: data.workplaceIds,
    };

    const result = await repo.updateDocumentTypeWithRelations(id, updateData, relationIds);

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.MASTER_DATA_UPDATED,
      resource: `DocumentType:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { code: result.code, name: result.name },
    });

    return { id: result.id, code: result.code, name: result.name };
  }

  if (operation === "DELETE") {
    if (!id) throw new Error("ID jenis dokumen wajib diisi");

    const docType = await repo.findDocumentTypeById(id);
    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    await repo.softDeleteDocumentType(id);

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.MASTER_DATA_DELETED,
      resource: `DocumentType:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
    });

    return { id, code: docType.code, name: docType.name };
  }

  if (operation === "RESTORE") {
    if (!id) throw new Error("ID jenis dokumen wajib diisi");

    const docType = await repo.findDocumentTypeById(id);
    if (!docType) throw new Error("Jenis dokumen tidak ditemukan");

    await repo.restoreDocumentType(id);

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.MASTER_DATA_UPDATED,
      resource: `DocumentType:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { action: "restore" },
    });

    return { id, code: docType.code, name: docType.name };
  }

  throw new Error("Operasi tidak didukung");
}
