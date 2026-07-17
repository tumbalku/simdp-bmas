import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getCurrentProfile,
  updateProfile,
  handleEmployeeCrud,
  getEmployeeDirectory,
  getEmployeeDirectoryWithPagination,
  getEmployeeDetail,
  exportEmployeeDirectoryCsv,
  importFromCsv,
  addCareerHistory,
} from "../service";
import { mockPrisma } from "../../../../tests/setup";

describe("Employee Module Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("employee directory queries", () => {
    it("should list active employees with identity and organization summaries", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([
        {
          id: "emp-1",
          employeeId: "1990",
          nik: "7471",
          name: "John Doe",
          gender: "Laki-laki",
          phone: "0812",
          user: { email: "john@example.com", role: "EMPLOYEE", isActive: true },
          employmentStatus: { name: "PNS" },
          workplace: { name: "UGD" },
          _count: { documentRecords: 3 },
        },
      ]);

      const result = await getEmployeeDirectory();

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } })
      );
      expect(result).toEqual([
        expect.objectContaining({ id: "emp-1", email: "john@example.com", documentCount: 3 }),
      ]);
    });

    it("should fetch employee detail with career history and documents", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        employeeId: "1990",
        nik: "7471",
        name: "John Doe",
        gender: "Laki-laki",
        birthDate: new Date("1990-01-01T00:00:00.000Z"),
        joinDate: new Date("2020-01-01T00:00:00.000Z"),
        user: { email: "john@example.com", role: "EMPLOYEE", isActive: true },
        employmentStatusId: "status-1",
        employeeGroupId: "group-1",
        employeePositionId: "position-1",
        employeeRankId: "rank-1",
        workplaceId: "workplace-1",
        employmentStatus: { id: "status-1", name: "PNS" },
        employeeGroup: { id: "group-1", name: "PNS Daerah", employmentStatusId: "status-1" },
        employeePosition: { id: "position-1", name: "Perawat", professionGroupId: "profession-1" },
        employeeRank: { id: "rank-1", name: "III/a" },
        workplace: { id: "workplace-1", name: "UGD" },
        careerHistories: [],
        documentRecords: [
          { id: "doc-1", title: "KTP", status: "APPROVED", uploadedAt: new Date("2026-01-01T00:00:00.000Z"), documentType: { name: "KTP", archiveCategory: "PERSONAL" } },
        ],
      });

      const result = await getEmployeeDetail("emp-1");

      expect(result).toEqual(expect.objectContaining({ id: "emp-1", email: "john@example.com" }));
      expect(result).toEqual(
        expect.objectContaining({
          employmentStatusId: "status-1",
          employeeGroupId: "group-1",
          professionGroupId: "profession-1",
          employeePositionId: "position-1",
          employeeRankId: "rank-1",
          workplaceId: "workplace-1",
        })
      );
      expect(result?.documents[0]).toEqual(expect.objectContaining({ id: "doc-1", documentTypeName: "KTP" }));
    });

    it("should apply advanced employee directory filters to paginated query", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.employee.count.mockResolvedValue(0);

      await getEmployeeDirectoryWithPagination({
        page: 2,
        limit: 10,
        search: "siti",
        employmentStatusId: "status-1",
        employeeGroupId: "group-1",
        professionGroupId: "profession-1",
        employeePositionId: "position-1",
        employeeRankId: "rank-1",
        workplaceId: "workplace-1",
        maritalStatus: "Kawin",
        lastEducation: "S1",
        tmtStartDate: "2020-01-01",
        tmtEndDate: "2026-12-31",
        retirementAgeFrom: 50,
        retirementAgeTo: 58,
        status: "Aktif",
      });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            employmentStatusId: "status-1",
            employeeGroupId: "group-1",
            employeePosition: { professionGroupId: "profession-1" },
            employeePositionId: "position-1",
            employeeRankId: "rank-1",
            workplaceId: "workplace-1",
            maritalStatus: "Kawin",
            lastEducation: "S1",
            status: "Aktif",
            tmtStartDate: { gte: new Date("2020-01-01") },
            tmtEndDate: { lte: new Date("2026-12-31") },
            birthDate: expect.objectContaining({
              lte: expect.any(Date),
              gte: expect.any(Date),
            }),
            OR: expect.arrayContaining([
              { name: { contains: "siti", mode: "insensitive" } },
            ]),
          }),
          skip: 10,
          take: 10,
        })
      );
    });

    it("should list archived employees when archive view is requested", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.employee.count.mockResolvedValue(0);

      await getEmployeeDirectoryWithPagination({ archiveView: "archived" });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: { not: null } }),
        })
      );
      expect(mockPrisma.employee.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ deletedAt: { not: null } }),
      });
    });

    it("should export filtered employees to CSV without secret fields", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([
        {
          name: "Siti, Aminah",
          employeeId: "19850101",
          nik: "7471010101010001",
          status: "Aktif",
          phone: "0812",
          lastEducation: "S1",
          user: { email: "siti@example.com", role: "EMPLOYEE", isActive: true },
          employmentStatus: { name: "PNS" },
          employeeGroup: { name: "PNS Daerah" },
          employeePosition: { name: "Perawat" },
          employeeRank: { name: "III/a" },
          workplace: { name: "UGD" },
        },
      ]);

      const csv = await exportEmployeeDirectoryCsv(
        { search: "siti", archiveView: "active" },
        { actorId: "admin-1", actorName: "Admin", actorRole: "ADMIN" },
      );

      expect(csv).toContain("Nama;NIP;NIK;Email;Role");
      expect(csv).toContain("Siti, Aminah;19850101;7471010101010001;siti@example.com");
      expect(csv).not.toContain("passwordHash");
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            OR: expect.arrayContaining([{ name: { contains: "siti", mode: "insensitive" } }]),
          }),
        }),
      );
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: "EMPLOYEE_EXPORTED" }),
        }),
      );
    });
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

    it("should throw error when CREATE is called with missing email", async () => {
      await expect(
        handleEmployeeCrud("CREATE", undefined, { name: "Jane" }, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("Email dan Nama wajib diisi");
    });

    it("should throw error when CREATE is called with missing name", async () => {
      await expect(
        handleEmployeeCrud("CREATE", undefined, { email: "jane@example.com" }, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("Email dan Nama wajib diisi");
    });

    it("should throw error when UPDATE is called without ID", async () => {
      await expect(
        handleEmployeeCrud("UPDATE", undefined, {}, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("ID pegawai wajib diisi");
    });

    it("should throw error when UPDATE target employee is not found", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        handleEmployeeCrud("UPDATE", "non-existent-id", {}, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("Pegawai tidak ditemukan");
    });

    it("should update account email, role, and active status with an audit log", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        userId: "user-1",
        name: "John Doe",
        employeeId: "1990",
        nik: "7471",
        user: { id: "user-1", email: "old@example.com", role: "EMPLOYEE", isActive: true },
      });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.employee.update.mockResolvedValue({ id: "emp-1", name: "John Doe" });

      const result = await handleEmployeeCrud(
        "UPDATE",
        "emp-1",
        { email: "new@example.com", role: "STAFF", isActive: false, name: "John Doe" },
        "admin-1",
        "Admin",
        "ADMIN",
      );

      expect(result).toEqual({ id: "emp-1", name: "John Doe" });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { email: "new@example.com", role: "STAFF", isActive: false },
        }),
      );
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "EMPLOYEE_ACCOUNT_UPDATED",
            resource: "User:user-1",
            metadata: expect.objectContaining({
              employeeId: "emp-1",
              updatedFields: ["email", "role", "isActive"],
            }),
          }),
        }),
      );
    });

    it("should prevent admin from deactivating their own account", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        userId: "admin-1",
        name: "Admin User",
        employeeId: "1990",
        nik: "7471",
        user: { id: "admin-1", email: "admin@example.com", role: "ADMIN", isActive: true },
      });

      await expect(
        handleEmployeeCrud(
          "UPDATE",
          "emp-1",
          { email: "admin@example.com", role: "ADMIN", isActive: false, name: "Admin User" },
          "admin-1",
          "Admin User",
          "ADMIN",
        ),
      ).rejects.toThrow("Akun sendiri tidak dapat dinonaktifkan");

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.employee.update).not.toHaveBeenCalled();
    });

    it("should throw error when DELETE target employee is not found", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        handleEmployeeCrud("DELETE", "non-existent-id", undefined, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("Pegawai tidak ditemukan");
    });

    it("should permanently delete only archived employees with user relations cleaned", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        userId: "user-1",
        name: "John",
        deletedAt: new Date("2026-07-17T00:00:00.000Z"),
      });

      const result = await handleEmployeeCrud("PERMANENT_DELETE", "emp-1", undefined, "admin-1", "Admin", "ADMIN");

      expect(result).toEqual({ id: "emp-1", name: "John" });
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "EMPLOYEE_PERMANENTLY_DELETED",
            resource: "Employee:emp-1",
          }),
        })
      );
      expect(mockPrisma.securityLog.updateMany).toHaveBeenCalledWith({
        where: { actorId: "user-1" },
        data: { actorId: null },
      });
      expect(mockPrisma.employee.delete).toHaveBeenCalledWith({ where: { id: "emp-1" } });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });

    it("should reject permanent delete for active employees", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-active",
        userId: "user-active",
        name: "Active User",
        deletedAt: null,
      });

      await expect(
        handleEmployeeCrud("PERMANENT_DELETE", "emp-active", undefined, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("Pegawai aktif harus diarsipkan terlebih dahulu sebelum dihapus permanen.");

      expect(mockPrisma.employee.delete).not.toHaveBeenCalled();
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it("should throw error when RESTORE target employee is not found", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        handleEmployeeCrud("RESTORE", "non-existent-id", undefined, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("Pegawai tidak ditemukan");
    });

    it("should throw error for unsupported operation", async () => {
      await expect(
        handleEmployeeCrud("INVALID_OP" as never, "emp-1", undefined, "admin-1", "Admin", "ADMIN")
      ).rejects.toThrow("Operasi tidak didukung");
    });
  });

  describe("importFromCsv", () => {
    it("should import semicolon template rows and preserve commas in names", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: "user-2" });
      mockPrisma.employee.create.mockResolvedValue({ id: "emp-2", name: "Andri Saputra, S.Ked." });

      const result = await importFromCsv(
        [
          "email;name;employeeId;nik;role;gender",
          "andri@example.com;Andri Saputra, S.Ked.;19850101;7471010101010001;EMPLOYEE;Laki-laki",
        ].join("\n"),
        "admin-1",
        "Admin",
        "ADMIN",
      );

      expect(result).toEqual(expect.objectContaining({ importedCount: 1, failedCount: 0 }));
      expect(mockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Andri Saputra, S.Ked." }),
        }),
      );
    });
  });

  describe("addCareerHistory", () => {
    it("should update current assignment when added history is the newest", async () => {
      mockPrisma.employeeCareerHistory.create.mockResolvedValue({ id: "history-new" });
      mockPrisma.employeeCareerHistory.findFirst.mockResolvedValue({ id: "history-new" });
      mockPrisma.employee.update.mockResolvedValue({ id: "emp-1" });

      const result = await addCareerHistory({
        employeeId: "emp-1",
        employmentStatusId: "status-1",
        employeeGroupId: "group-1",
        employeePositionId: "position-1",
        employeeRankId: "rank-1",
        workplaceId: "workplace-1",
        effectiveDate: "2026-07-17",
        note: "Promosi jabatan",
        createdBy: "admin-1",
        actorName: "Admin",
        actorRole: "ADMIN",
      });

      expect(result).toEqual(expect.objectContaining({ id: "history-new", effectiveDate: "2026-07-17" }));
      expect(mockPrisma.employeeCareerHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: "emp-1",
            employmentStatusId: "status-1",
            employeePositionId: "position-1",
            effectiveDate: new Date("2026-07-17"),
          }),
        })
      );
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "emp-1" },
          data: expect.objectContaining({
            employmentStatusId: "status-1",
            employeeGroupId: "group-1",
            employeePositionId: "position-1",
            employeeRankId: "rank-1",
            workplaceId: "workplace-1",
          }),
        })
      );
      expect(mockPrisma.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "EMPLOYEE_UPDATED",
            resource: "Employee:emp-1",
          }),
        })
      );
    });

    it("should not overwrite current assignment when added history is older than newest history", async () => {
      mockPrisma.employeeCareerHistory.create.mockResolvedValue({ id: "history-old" });
      mockPrisma.employeeCareerHistory.findFirst.mockResolvedValue({ id: "history-newer" });

      await addCareerHistory({
        employeeId: "emp-1",
        employeePositionId: "position-old",
        effectiveDate: "2020-01-01",
        createdBy: "admin-1",
      });

      expect(mockPrisma.employeeCareerHistory.create).toHaveBeenCalled();
      expect(mockPrisma.employee.update).not.toHaveBeenCalled();
    });

    it("should not clear current assignment when history only contains a note", async () => {
      mockPrisma.employeeCareerHistory.create.mockResolvedValue({ id: "history-note" });
      mockPrisma.employeeCareerHistory.findFirst.mockResolvedValue({ id: "history-note" });

      await addCareerHistory({
        employeeId: "emp-1",
        effectiveDate: "2026-07-17",
        note: "Catatan administratif",
        createdBy: "admin-1",
      });

      expect(mockPrisma.employeeCareerHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: "emp-1",
            note: "Catatan administratif",
            employmentStatusId: null,
            employeePositionId: null,
          }),
        })
      );
      expect(mockPrisma.employee.update).not.toHaveBeenCalled();
    });
  });
});
