import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  revalidatePath: vi.fn(),
  getActorDisplayName: vi.fn(),
  getDocumentRecordsForSession: vi.fn(),
  getDocumentRecordDetailForSession: vi.fn(),
  getAvailableDocumentTypes: vi.fn(),
  uploadDocumentRecord: vi.fn(),
  getDocumentRecordsWithPagination: vi.fn(),
  getDocumentTypesWithPagination: vi.fn(),
  handleDocumentTypeCrud: vi.fn(),
  softDeleteDocument: vi.fn(),
  restoreDocument: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/modules/employee/service", () => ({
  getActorDisplayName: mocks.getActorDisplayName,
}));

vi.mock("@/modules/document/service", () => ({
  getDocumentRecordsForSession: mocks.getDocumentRecordsForSession,
  getDocumentRecordDetailForSession: mocks.getDocumentRecordDetailForSession,
  getAvailableDocumentTypes: mocks.getAvailableDocumentTypes,
  uploadDocumentRecord: mocks.uploadDocumentRecord,
  getDocumentRecordsWithPagination: mocks.getDocumentRecordsWithPagination,
  getDocumentTypesWithPagination: mocks.getDocumentTypesWithPagination,
  handleDocumentTypeCrud: mocks.handleDocumentTypeCrud,
  softDeleteDocument: mocks.softDeleteDocument,
  restoreDocument: mocks.restoreDocument,
}));

import {
  crudDocumentTypeAction,
  getDocumentRecordsAction,
  getDocumentRecordsWithPaginationAction,
  getDocumentTypesWithPaginationAction,
  restoreDocumentAction,
  softDeleteDocumentAction,
  uploadDocumentAction,
} from "../actions";

describe("Document Module Actions", () => {
  const session = { userId: "user-1", role: "ADMIN", employeeId: "emp-1" };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(session);
    mocks.getActorDisplayName.mockResolvedValue("Admin User");
  });

  it("should reject invalid document list filters before calling the service", async () => {
    const result = await getDocumentRecordsAction({ status: "UNKNOWN" });

    expect(mocks.requireAuth).toHaveBeenCalledWith();
    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." },
    });
    expect(mocks.getDocumentRecordsForSession).not.toHaveBeenCalled();
  });

  it("should call paginated document list service with parsed pagination", async () => {
    mocks.getDocumentRecordsWithPagination.mockResolvedValue({ data: [], total: 0 });

    const result = await getDocumentRecordsWithPaginationAction({ page: 2, limit: 25, search: "sk" });

    expect(mocks.requireAuth).toHaveBeenCalledWith("ADMIN");
    expect(mocks.getDocumentRecordsWithPagination).toHaveBeenCalledWith({ page: 2, limit: 25, search: "sk" });
    expect(result).toEqual({ ok: true, data: { data: [], total: 0 } });
  });

  it("should return validation error when upload file is missing", async () => {
    const formData = new FormData();
    formData.set("documentTypeId", "type-1");

    const result = await uploadDocumentAction(formData);

    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "File dokumen wajib dipilih." },
    });
    expect(mocks.uploadDocumentRecord).not.toHaveBeenCalled();
  });

  it("should upload valid form data and revalidate document route", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "test.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.set("documentTypeId", "type-1");
    formData.set("title", "SK Pangkat");
    formData.set("file", file);
    mocks.uploadDocumentRecord.mockResolvedValue({ id: "doc-1" });

    const result = await uploadDocumentAction(formData);

    expect(mocks.uploadDocumentRecord).toHaveBeenCalledWith(
      expect.objectContaining({ documentTypeId: "type-1", title: "SK Pangkat", file }),
      session
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/documents");
    expect(result).toEqual({ ok: true, data: { id: "doc-1" } });
  });

  it("should return validation details for invalid document type CRUD payloads", async () => {
    const result = await crudDocumentTypeAction("CREATE", undefined, { name: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.details?.length).toBeGreaterThan(0);
    }
    expect(mocks.handleDocumentTypeCrud).not.toHaveBeenCalled();
  });

  it("should call document type CRUD service with actor metadata", async () => {
    mocks.handleDocumentTypeCrud.mockResolvedValue({ id: "type-1" });

    const result = await crudDocumentTypeAction("RESTORE", "type-1");

    expect(mocks.handleDocumentTypeCrud).toHaveBeenCalledWith(
      "RESTORE",
      "type-1",
      undefined,
      "user-1",
      "Admin User",
      "ADMIN"
    );
    expect(result).toEqual({ ok: true, data: { id: "type-1" } });
  });

  it("should wrap soft delete and restore services in action envelopes", async () => {
    mocks.softDeleteDocument.mockResolvedValue(true);
    mocks.restoreDocument.mockResolvedValue(true);

    await expect(softDeleteDocumentAction("doc-1")).resolves.toEqual({ ok: true, data: { success: true } });
    await expect(restoreDocumentAction("doc-1")).resolves.toEqual({ ok: true, data: { success: true } });

    expect(mocks.softDeleteDocument).toHaveBeenCalledWith("doc-1", session);
    expect(mocks.restoreDocument).toHaveBeenCalledWith("doc-1", session);
  });

  it("should list document types with pagination action successfully", async () => {
    mocks.getDocumentTypesWithPagination.mockResolvedValue({ data: [], total: 0 });

    const result = await getDocumentTypesWithPaginationAction({ page: 1, limit: 10, search: "KTP" });

    expect(mocks.requireAuth).toHaveBeenCalledWith("ADMIN");
    expect(mocks.getDocumentTypesWithPagination).toHaveBeenCalledWith({ page: 1, limit: 10, search: "KTP" });
    expect(result).toEqual({ ok: true, data: { data: [], total: 0 } });
  });

  it("should reject invalid document types pagination query action", async () => {
    const result = await getDocumentTypesWithPaginationAction({ page: -1 });

    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." },
    });
    expect(mocks.getDocumentTypesWithPagination).not.toHaveBeenCalled();
  });
});
