import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getEmployeeDirectory: vi.fn(),
  getEmployeeDirectoryWithPagination: vi.fn(),
  getEmployeeDetail: vi.fn(),
  getCurrentProfile: vi.fn(),
  updateProfile: vi.fn(),
  handleEmployeeCrud: vi.fn(),
  addCareerHistory: vi.fn(),
  importFromCsv: vi.fn(),
  getMasterDataList: vi.fn(),
  handleMasterDataCrud: vi.fn(),
  getActorDisplayName: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/modules/employee/service", () => ({
  getEmployeeDirectory: mocks.getEmployeeDirectory,
  getEmployeeDirectoryWithPagination: mocks.getEmployeeDirectoryWithPagination,
  getEmployeeDetail: mocks.getEmployeeDetail,
  getCurrentProfile: mocks.getCurrentProfile,
  updateProfile: mocks.updateProfile,
  handleEmployeeCrud: mocks.handleEmployeeCrud,
  addCareerHistory: mocks.addCareerHistory,
  importFromCsv: mocks.importFromCsv,
  getMasterDataList: mocks.getMasterDataList,
  handleMasterDataCrud: mocks.handleMasterDataCrud,
  getActorDisplayName: mocks.getActorDisplayName,
}));

import {
  addCareerHistoryAction,
  crudEmployeeAction,
  crudMasterDataAction,
  getEmployeeDirectoryAction,
  getMasterDataListAction,
  updateProfileAction,
} from "../actions";

describe("Employee Module Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user-1", role: "ADMIN" });
    mocks.getActorDisplayName.mockResolvedValue("Admin User");
  });

  it("should reject invalid employee directory filters before calling the service", async () => {
    const result = await getEmployeeDirectoryAction({ search: 123 });

    expect(mocks.requireAuth).toHaveBeenCalledWith("ADMIN");
    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Filter tidak valid." },
    });
    expect(mocks.getEmployeeDirectory).not.toHaveBeenCalled();
  });

  it("should validate and pass cleaned profile data to the service", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1", role: "EMPLOYEE" });
    mocks.updateProfile.mockResolvedValue(true);

    const result = await updateProfileAction({ phone: "081234567890", address: null });

    expect(mocks.updateProfile).toHaveBeenCalledWith(
      "user-1",
      { phone: "081234567890", address: undefined },
      "Admin User",
      "EMPLOYEE"
    );
    expect(result).toEqual({ ok: true, data: { success: true } });
  });

  it("should return validation details for invalid employee CRUD payloads", async () => {
    const result = await crudEmployeeAction("CREATE", undefined, { email: "not-an-email" });

    expect(mocks.requireAuth).toHaveBeenCalledWith("ADMIN");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.details?.some((detail) => detail.path.includes("email"))).toBe(true);
    }
    expect(mocks.handleEmployeeCrud).not.toHaveBeenCalled();
  });

  it("should call employee CRUD service with parsed action data", async () => {
    mocks.handleEmployeeCrud.mockResolvedValue({ id: "emp-1" });

    const result = await crudEmployeeAction("RESTORE", "emp-1");

    expect(mocks.handleEmployeeCrud).toHaveBeenCalledWith(
      "RESTORE",
      "emp-1",
      undefined,
      "user-1",
      "Admin User",
      "ADMIN"
    );
    expect(result).toEqual({ ok: true, data: { id: "emp-1" } });
  });

  it("should reject unsupported master data entities", async () => {
    const result = await getMasterDataListAction("UnsupportedEntity");

    expect(result).toEqual({
      ok: false,
      error: { code: "BAD_REQUEST", message: "Entity tidak didukung." },
    });
    expect(mocks.getMasterDataList).not.toHaveBeenCalled();
  });

  it("should enforce ADMIN role before mutating master data", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user-1", role: "STAFF" });

    const result = await crudMasterDataAction("Workplace", "CREATE", undefined, { name: "IGD" });

    expect(result).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Akses ditolak. Perlu role ADMIN." },
    });
    expect(mocks.handleMasterDataCrud).not.toHaveBeenCalled();
  });

  it("should validate career history payloads before calling service", async () => {
    const result = await addCareerHistoryAction({ employeeId: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(mocks.addCareerHistory).not.toHaveBeenCalled();
  });
});
