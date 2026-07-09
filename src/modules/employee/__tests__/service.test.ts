import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentProfile, updateProfile, handleEmployeeCrud } from "../service";
import { mockPrisma } from "../../../../tests/setup";

describe("Employee Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentProfile", () => {
    it("should fetch current employee profile based on userId", async () => {
      const mockEmployee = { id: "emp-1", userId: "user-1", name: "John Doe" };
      mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const profile = await getCurrentProfile("user-1");
      expect(profile).toEqual(mockEmployee);
      expect(mockPrisma.employee.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", deletedAt: null },
        })
      );
    });
  });

  describe("updateProfile", () => {
    it("should update phone and address successfully", async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: "emp-1", userId: "user-1" });
      mockPrisma.employee.update.mockResolvedValue({ id: "emp-1" });

      const success = await updateProfile(
        "user-1",
        { phone: "0812345678", address: "Kendari" },
        "John Doe",
        "EMPLOYEE"
      );

      expect(success).toBe(true);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "emp-1" },
          data: expect.objectContaining({ phone: "0812345678", address: "Kendari" }),
        })
      );
    });
  });

  describe("handleEmployeeCrud", () => {
    it("should create employee user in a transaction", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: "user-2" });
      mockPrisma.employee.create.mockResolvedValue({ id: "emp-2", name: "Jane Doe" });

      const result = await handleEmployeeCrud(
        "CREATE",
        undefined,
        {
          email: "jane@example.com",
          name: "Jane Doe",
          nik: "1234567890123456",
        },
        "admin-1",
        "Admin",
        "ADMIN"
      );

      expect(result).toEqual({ id: "emp-2", name: "Jane Doe" });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.employee.create).toHaveBeenCalled();
    });

    it("should soft delete employee and user in a transaction", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: "emp-1", userId: "user-1", name: "John" });

      const result = await handleEmployeeCrud("DELETE", "emp-1", undefined, "admin-1", "Admin", "ADMIN");
      expect(result).toEqual({ id: "emp-1", name: "John" });
      expect(mockPrisma.employee.update).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});
