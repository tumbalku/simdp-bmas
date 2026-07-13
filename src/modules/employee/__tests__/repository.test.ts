import { describe, it, expect, vi, beforeEach } from "vitest";
import * as repository from "../repository";
import { mockPrisma } from "../../../../tests/setup";

describe("Employee Module Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findEmployees", () => {
    it("should call findMany on employee model with the query", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      
      const where = { deletedAt: null };
      await repository.findEmployees(where);

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
        })
      );
    });
  });

  describe("findEmployeesWithPagination", () => {
    it("should pass pagination arguments to employee query", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      const where = { name: { contains: "Sil" } };
      await repository.findEmployeesWithPagination(where, 20, 10);

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where,
          skip: 20,
          take: 10,
          orderBy: { name: "asc" },
        })
      );
    });
  });

  describe("findEmployeeDetailById", () => {
    it("should call findUnique on employee model with correct arguments", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await repository.findEmployeeDetailById("emp-1");

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "emp-1", deletedAt: null },
        })
      );
    });
  });

  describe("findEmployeeByUserId", () => {
    it("should call findFirst on employee model with correct arguments", async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      await repository.findEmployeeByUserId("user-1");

      expect(mockPrisma.employee.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", deletedAt: null },
        })
      );
    });
  });

  describe("updateEmployee", () => {
    it("should update employee on database", async () => {
      mockPrisma.employee.update.mockResolvedValue({ id: "emp-1" });

      await repository.updateEmployee("emp-1", { name: "New Name" });

      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: "emp-1" },
        data: { name: "New Name" },
      });
    });
  });

  describe("createEmployeeWithUserTransaction", () => {
    it("should create user and employee in a single transaction", async () => {
      mockPrisma.user.create.mockResolvedValue({ id: "user-1" });
      mockPrisma.employee.create.mockResolvedValue({ id: "emp-1" });

      const result = await repository.createEmployeeWithUserTransaction({
        user: { email: "sil@example.com" },
        employee: { name: "Sil", userId: "user-1" },
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: { email: "sil@example.com" } });
      expect(mockPrisma.employee.create).toHaveBeenCalledWith({ data: { name: "Sil", userId: "user-1" } });
      expect(result).toEqual({ user: { id: "user-1" }, employee: { id: "emp-1" } });
    });
  });

  describe("softDeleteEmployeeAndUser", () => {
    it("should soft delete employee and linked user in one transaction", async () => {
      mockPrisma.employee.update.mockResolvedValue({ id: "emp-1" });
      mockPrisma.user.update.mockResolvedValue({ id: "user-1" });

      await repository.softDeleteEmployeeAndUser("emp-1", "user-1");

      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: "emp-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("createCareerHistoryAndUpdateCurrent", () => {
    it("should update current employee assignment when new history is newest", async () => {
      mockPrisma.employeeCareerHistory.create.mockResolvedValue({ id: "hist-1" });
      mockPrisma.employeeCareerHistory.findFirst.mockResolvedValue({ id: "hist-1" });
      mockPrisma.employee.update.mockResolvedValue({ id: "emp-1" });

      const result = await repository.createCareerHistoryAndUpdateCurrent({
        history: { id: "hist-1", employeeId: "emp-1" },
        currentAssignment: { workplaceId: "work-1" },
      });

      expect(mockPrisma.employeeCareerHistory.create).toHaveBeenCalledWith({
        data: { id: "hist-1", employeeId: "emp-1" },
      });
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: "emp-1" },
        data: { workplaceId: "work-1" },
      });
      expect(result).toEqual({ id: "hist-1" });
    });
  });

  describe("master data delegates", () => {
    it("should throw for unsupported model names", async () => {
      await expect(repository.findMasterDataMany("unknownModel", { where: {} })).rejects.toThrow(
        "Entity type unknownModel tidak didukung"
      );
    });
  });
});
