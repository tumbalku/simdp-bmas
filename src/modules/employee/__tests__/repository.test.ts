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
});
