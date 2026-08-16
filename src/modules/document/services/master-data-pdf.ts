/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TokenPayload } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import {
  ARCHIVE_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  type ArchiveCategory,
} from "../constants";
import * as repo from "../repository";
import type { DocumentListFilter } from "./shared";

export type MasterDataDocumentsPdfRow = {
  no: number;
  title: string;
  documentTypeName: string;
  documentTypeCode: string | null;
  archiveCategory: string;
  archiveCategoryLabel: string;
  ownerName: string;
  ownerEmployeeId: string | null;
  ownerNik: string | null;
  employmentType: string | null;
  status: string;
  statusLabel: string;
  documentNumber: string | null;
  fileName: string;
  uploadedAt: string | null;
  expiryDate: string | null;
};

export type MasterDataDocumentsPdfData = {
  title: string;
  archiveView: "active" | "archived";
  generatedAt: string;
  rowCount: number;
  filters: {
    search: string | null;
    documentTypeName: string | null;
    archiveCategoryLabel: string | null;
  };
  rows: MasterDataDocumentsPdfRow[];
};

export const MASTER_DATA_DOCUMENTS_PDF_EXPORT_MAX_ROWS = 1000;

function buildDocumentWhere(filter: DocumentListFilter = {}) {
  const where: any = {
    deletedAt: filter.archiveView === "archived" ? { not: null } : null,
  };

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.documentTypeId) {
    where.documentTypeId = filter.documentTypeId;
  }

  if (filter.archiveCategory) {
    where.documentType = {
      archiveCategory: filter.archiveCategory,
    };
  }

  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { fileName: { contains: filter.search, mode: "insensitive" } },
      {
        documentType: {
          name: { contains: filter.search, mode: "insensitive" },
        },
      },
      { owner: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function getArchiveCategoryLabel(value: string | null | undefined) {
  if (!value) return null;
  return value in ARCHIVE_CATEGORY_LABELS
    ? ARCHIVE_CATEGORY_LABELS[value as ArchiveCategory]
    : value;
}

function getStatusLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value in DOCUMENT_STATUS_LABELS
    ? DOCUMENT_STATUS_LABELS[value as keyof typeof DOCUMENT_STATUS_LABELS]
    : value;
}

function buildReportTitle(input: {
  archiveView: "active" | "archived";
  documentTypeName?: string | null;
  archiveCategoryLabel?: string | null;
}) {
  const prefix =
    input.archiveView === "archived"
      ? "Laporan Arsip Dokumen"
      : "Laporan Dokumen";

  if (input.documentTypeName && input.archiveCategoryLabel) {
    return `${prefix} ${input.documentTypeName} (${input.archiveCategoryLabel}) Pegawai`;
  }

  if (input.documentTypeName) {
    return `${prefix} ${input.documentTypeName} Pegawai`;
  }

  if (input.archiveCategoryLabel) {
    return `${prefix} ${input.archiveCategoryLabel} Pegawai`;
  }

  return `${prefix} Pegawai`;
}

function formatEmploymentType(input: {
  employeeGroup?: { name: string | null } | null;
  employmentStatus?: { name: string | null } | null;
}) {
  const group = input.employeeGroup?.name;
  const status = input.employmentStatus?.name;
  if (group && status) return `${group}/${status}`;
  return group || status || null;
}

export async function getMasterDataDocumentsPdfData(
  filter: DocumentListFilter = {},
  session: TokenPayload,
): Promise<MasterDataDocumentsPdfData> {
  if (session.role !== "ADMIN") {
    throw new AppError(
      "FORBIDDEN",
      "Hanya Admin yang dapat mengunduh PDF laporan dokumen pegawai.",
      403,
    );
  }

  const archiveView = filter.archiveView === "archived" ? "archived" : "active";
  const documentType = filter.documentTypeId
    ? await repo.findDocumentTypeById(filter.documentTypeId)
    : null;
  const archiveCategoryLabel = getArchiveCategoryLabel(filter.archiveCategory);
  const title = buildReportTitle({
    archiveView,
    documentTypeName: documentType?.name,
    archiveCategoryLabel,
  });
  const records = await repo.findDocumentRecordsForExport(
    buildDocumentWhere({ ...filter, archiveView }),
    MASTER_DATA_DOCUMENTS_PDF_EXPORT_MAX_ROWS + 1,
    filter.sortBy,
    filter.sortOrder,
  );

  if (records.length > MASTER_DATA_DOCUMENTS_PDF_EXPORT_MAX_ROWS) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Export PDF dokumen dibatasi maksimal ${MASTER_DATA_DOCUMENTS_PDF_EXPORT_MAX_ROWS} baris. Persempit filter sebelum mengunduh laporan.`,
      400,
    );
  }

  return {
    title,
    archiveView,
    generatedAt: new Date().toISOString(),
    rowCount: records.length,
    filters: {
      search: filter.search?.trim() || null,
      documentTypeName: documentType?.name || null,
      archiveCategoryLabel,
    },
    rows: records.map((record, index) => {
      const archiveCategory =
        record.documentType?.archiveCategory || "PERSONAL";

      return {
        no: index + 1,
        title: record.title || record.documentType?.name || "Dokumen",
        documentTypeName: record.documentType?.name || "Jenis dokumen",
        documentTypeCode: record.documentType?.code || null,
        archiveCategory,
        archiveCategoryLabel:
          getArchiveCategoryLabel(archiveCategory) || archiveCategory,
        ownerName: record.owner?.name || "Pegawai",
        ownerEmployeeId: record.owner?.employeeId || null,
        ownerNik: record.owner?.nik || null,
        employmentType: formatEmploymentType(record.owner || {}),
        status: record.status,
        statusLabel: getStatusLabel(record.status),
        documentNumber: record.documentNumber || null,
        fileName: record.fileName,
        uploadedAt: toIsoDate(record.uploadedAt),
        expiryDate: toIsoDate(record.expiryDate),
      };
    }),
  };
}
