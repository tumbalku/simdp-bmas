import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getCurrentProfile,
  updateProfile,
  handleEmployeeCrud,
  getEmployeeDirectory,
  getEmployeeDirectoryWithPagination,
  getEmployeeDirectorOptions,
  getEmployeeDetail,
  getEmployeeProfilePdfData,
  exportEmployeeDirectoryCsv,
  getEmployeeDirectoryPdfData,
  renderEmployeeDirectoryPdfHtml,
  renderEmployeeDocumentsPdfHtml,
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

    it("should build PDF profile data with selected document statuses", async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        employeeId: "1990",
        nik: "7471",
        name: "John Doe",
        status: "ACTIVE",
        birthDate: new Date("1990-01-01T00:00:00.000Z"),
        joinDate: new Date("2020-01-01T00:00:00.000Z"),
        user: { email: "john@example.com", role: "EMPLOYEE", isActive: true },
        employmentStatus: { id: "status-1", name: "PNS" },
        employeeGroup: { id: "group-1", name: "PNS Daerah", employmentStatusId: "status-1" },
        employeePosition: { id: "position-1", name: "Perawat", professionGroupId: "profession-1" },
        employeeRank: { id: "rank-1", name: "III/a" },
        workplace: { id: "workplace-1", name: "UGD" },
        careerHistories: [],
        documentRecords: [
          {
            id: "doc-1",
            title: "KTP Utama",
            status: "APPROVED",
            documentNumber: "4701/KTP/2026",
            uploadedAt: new Date("2026-01-01T00:00:00.000Z"),
            expiryDate: null,
            documentType: { code: "KTP", name: "KTP", archiveCategory: "PERSONAL" },
          },
          {
            id: "doc-2",
            title: "STR",
            status: "PENDING",
            documentNumber: null,
            uploadedAt: new Date("2026-02-01T00:00:00.000Z"),
            expiryDate: null,
            documentType: { code: "STR", name: "STR", archiveCategory: "CERTIFICATION" },
          },
        ],
      });

      const result = await getEmployeeProfilePdfData("emp-1", {
        includeProfile: true,
        documentStatuses: ["APPROVED"],
      });

      expect(result?.employee).toEqual(expect.objectContaining({ id: "emp-1", name: "John Doe" }));
      expect(result?.documents).toHaveLength(1);
      expect(result?.documents[0]).toEqual(
        expect.objectContaining({
          id: "doc-1",
          documentNumber: "4701/KTP/2026",
          documentTypeCode: "KTP",
          archiveCategory: "PERSONAL",
          status: "APPROVED",
        })
      );
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
        maritalStatus: "MARRIED",
        lastEducation: "S1",
        tmtStartDate: "2020-01-01",
        tmtEndDate: "2026-12-31",
        retirementAgeFrom: 50,
        retirementAgeTo: 58,
        status: "ACTIVE",
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
            maritalStatus: "MARRIED",
            lastEducation: "S1",
            status: "ACTIVE",
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

    it("should list active employee options for report official selection", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([
        {
          id: "emp-official",
          name: "dr. Pejabat Baru",
          employeeId: "197001012000121001",
          employeePosition: { name: "Direktur" },
          employeeRank: { name: "Pembina Utama Muda, Gol.IV/c" },
        },
      ]);

      const result = await getEmployeeDirectorOptions();

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          employeeId: true,
          employeePosition: { select: { name: true } },
          employeeRank: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      });
      expect(result).toEqual([
        {
          id: "emp-official",
          name: "dr. Pejabat Baru",
          nip: "197001012000121001",
          position: "Direktur",
          rank: "Pembina Utama Muda, Gol.IV/c",
        },
      ]);
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

    it("should build PDF directory data from the same filtered employee query", async () => {
      mockPrisma.employee.findMany.mockResolvedValue([
        {
          name: "Siti Aminah",
          employeeId: "19850101",
          nik: "7471010101010001",
          status: "ACTIVE",
          gender: "FEMALE",
          birthPlace: "Kendari",
          birthDate: new Date("1985-01-01T00:00:00.000Z"),
          lastEducation: "S1",
          hasTmt: true,
          tmtStartDate: new Date("2020-01-01T00:00:00.000Z"),
          tmtEndDate: null,
          user: { email: "siti@example.com", role: "EMPLOYEE", isActive: true },
          employmentStatus: { name: "PNS" },
          employeeGroup: { name: "ASN" },
          employeePosition: { name: "Perawat" },
          employeeRank: { name: "III/a" },
          workplace: { name: "UGD" },
        },
      ]);

      const data = await getEmployeeDirectoryPdfData({ search: "siti", archiveView: "active" });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            OR: expect.arrayContaining([{ name: { contains: "siti", mode: "insensitive" } }]),
          }),
        }),
      );
      expect(data).toEqual(
        expect.objectContaining({
          title: "Laporan Kepegawaian",
          archiveView: "active",
          rowCount: 1,
          rows: [
            expect.objectContaining({
              no: 1,
              name: "Siti Aminah",
              employeeGroup: "ASN",
              employmentStatus: "PNS",
              gender: "Wanita",
              tmt: "2020-01-01",
            }),
          ],
        }),
      );
      expect(JSON.stringify(data)).not.toContain("passwordHash");
    });

    it("should render employee directory PDF HTML with letterhead table and QR verification", () => {
      const html = renderEmployeeDirectoryPdfHtml(
        {
          title: "Laporan Kepegawaian",
          archiveView: "active",
          generatedAt: "2026-07-29T00:00:00.000Z",
          rowCount: 1,
          rows: [
            {
              no: 1,
              name: "Siti Aminah",
              employeeId: "19850101",
              nik: "7471010101010001",
              rank: "III/a",
              position: "Perawat",
              workplace: "UGD",
              birthPlace: "Kendari",
              birthDate: "1985-01-01",
              lastEducation: "S1",
              employeeGroup: "ASN",
              employmentStatus: "PNS",
              tmt: "2020-01-01",
              gender: "Wanita",
            },
          ],
        },
        {
          verification: {
            id: "verification-1",
            code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
            verifyUrl: "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
            qrCodeDataUrl: "data:image/png;base64,qr",
          },
          official: {
            name: "dr. Pejabat Baru",
            position: "Direktur",
            rank: "Pembina Utama Muda, Gol.IV/c",
            nip: "197001012000121001",
          },
        },
      );

      expect(html).toContain("RUMAH SAKIT UMUM DAERAH BAHTERAMAS");
      expect(html).toContain("Laporan Kepegawaian");
      expect(html).toContain("class=\"letterhead-logo\"");
      expect(html).toContain("data:image/png;base64,");
      expect(html).toContain("min-height: calc(210mm - 14mm)");
      expect(html).toContain("margin-top: auto");
      expect(html).toContain("padding-top: 20px");
      expect(html).toContain("padding-bottom: 18px");
      expect(html).toContain("Siti Aminah");
      expect(html).toContain("<span>Status/Jenis</span><span>Pegawai</span>");
      expect(html).toContain("<span>Jenis</span><span>Kelamin</span>");
      expect(html).toContain("ASN/PNS");
      expect(html).toContain("col-education");
      expect(html).toContain("col-tmt");
      expect(html).toContain('<col style="width: 6.2%" />');
      expect(html).not.toContain("Status data:");
      expect(html).not.toContain("Total data sesuai pencarian:");
      expect(html).toContain("Dicetak: 29 Juli 2026 pukul");
      expect(html).toContain("Direktur,");
      expect(html).toContain("dr. Pejabat Baru");
      expect(html).toContain("Pembina Utama Muda, Gol.IV/c");
      expect(html).toContain("NIP. 197001012000121001");
      expect(html).not.toContain("dr. H. Suukirman");
      expect(html).not.toContain("Kode: SIMDP-ABC123DEF456ABC123DEF456ABC123DE");
      expect(html).not.toContain("verification-code");
      expect(html).toContain("data:image/png;base64,qr");
      expect(html).toContain(".verification-card {\n      display: grid;");
      expect(html).not.toContain("background: #f0fdfa");
      expect(html).not.toContain("Data mengikuti query pencarian");
    });

    it("should render employee document report PDF HTML with letterhead, employee detail, and document table", () => {
      const html = renderEmployeeDocumentsPdfHtml(
        {
          employee: {
            id: "emp-1",
            employeeId: "19850101",
            nik: "7471010101010001",
            name: "Siti Aminah",
            status: "Aktif",
            gender: "Wanita",
            birthDate: "1985-01-01",
            birthPlace: "Kendari",
            academicDegree: null,
            lastEducation: "S1",
            religion: "Islam",
            maritalStatus: "Kawin",
            phone: "0812",
            address: "Kendari",
            joinDate: "2020-01-01",
            hasTmt: true,
            tmtStartDate: "2020-01-01",
            tmtEndDate: null,
            email: "siti@example.com",
            role: "EMPLOYEE",
            employmentStatus: "PNS",
            employeeGroup: "ASN",
            employeePosition: "Perawat",
            employeeRank: "III/a",
            workplace: "UGD",
            avatarUrl: null,
          },
          documents: [
            {
              id: "doc-1",
              title: "KTP Utama",
              documentTypeName: "KTP",
              documentTypeCode: "KTP",
              documentNumber: "4701/KTP/2026",
              archiveCategory: "PERSONAL",
              archiveCategoryLabel: "Personal",
              status: "APPROVED",
              statusLabel: "Disetujui",
              uploadedAt: "2026-01-01",
              expiryDate: null,
            },
          ],
        },
        {
          verification: {
            id: "verification-1",
            code: "SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
            verifyUrl: "http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE",
            qrCodeDataUrl: "data:image/png;base64,qr",
          },
        },
      );

      expect(html).toContain("RUMAH SAKIT UMUM DAERAH BAHTERAMAS");
      expect(html).toContain("Laporan Dokumen");
      expect(html).toContain("class=\"letterhead-logo\"");
      expect(html).toContain("<div class=\"detail-label\">Nama</div>");
      expect(html).toContain("<div class=\"detail-value\">Siti Aminah</div>");
      expect(html).toContain("<div class=\"detail-label\">NIK</div>");
      expect(html).toContain("<div class=\"detail-value\">7471010101010001</div>");
      expect(html).toContain("<div class=\"detail-label\">NIP</div>");
      expect(html).toContain("<div class=\"detail-value\">19850101</div>");
      expect(html).toContain("<div class=\"detail-label\">Pangkat/Golongan</div>");
      expect(html).toContain("<div class=\"detail-value\">III/a</div>");
      expect(html).toContain("<div class=\"detail-label\">Jabatan</div>");
      expect(html).toContain("<div class=\"detail-value\">Perawat</div>");
      expect(html).toContain("<div class=\"detail-label\">Status/Jenis Kepegawaian</div>");
      expect(html).toContain("<div class=\"detail-value\">ASN/PNS</div>");
      expect(html).toContain("<div class=\"detail-label\">Unit Kerja</div>");
      expect(html).toContain("<div class=\"detail-value\">UGD</div>");
      expect(html).toContain("grid-template-columns: 1fr;");
      expect(html).toContain("<th>Kode</th>");
      expect(html).toContain("<th>Judul</th>");
      expect(html).toContain("<th>Jenis Dokumen</th>");
      expect(html).toContain("<th>Kategori</th>");
      expect(html).toContain("<th>Nomor</th>");
      expect(html).toContain("<th>Diunggah</th>");
      expect(html).toContain("<th>Kadaluarsa</th>");
      expect(html).toContain("<th>Status</th>");
      expect(html).not.toContain("<th>Pegawai</th>");
      expect(html).not.toContain("<span>Status/Jenis</span><span>Kepegawaian</span>");
      expect(html).toContain("KTP Utama");
      expect(html).toContain("4701/KTP/2026");
      expect(html).toContain("Scan QR untuk mengecek keaslian PDF laporan dokumen ini.");
      expect(html).toContain("http://localhost:3000/verify-document?code=SIMDP-ABC123DEF456ABC123DEF456ABC123DE");
      expect(html).toContain("data:image/png;base64,qr");
      expect(html).toContain("Dokumen SiCantIK");
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
