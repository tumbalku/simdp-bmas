import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma } from "../../../../tests/setup";
import { REGISTRATION_STATUS } from "../constants";

const emailMocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  createNotification: vi.fn(),
}));

const securityMocks = vi.hoisted(() => ({
  logActivity: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    PUBLIC_REGISTRATION_ENABLED: true,
    NODE_ENV: "test",
    JWT_SECRET: "test-jwt-secret-with-minimum-32-chars-long",
  },
}));

vi.mock("@/lib/notifications", () => ({
  emailProvider: { sendEmail: emailMocks.sendEmail },
  isEmailProviderConfigured: () => true,
}));

vi.mock("@/modules/notification", () => ({
  createNotification: notificationMocks.createNotification,
}));

vi.mock("@/modules/security/server", () => ({
  logActivity: securityMocks.logActivity,
  SECURITY_ACTOR_ROLE: { PUBLIC: "PUBLIC", ADMIN: "ADMIN", SYSTEM: "SYSTEM" },
  SECURITY_EVENT_TYPE: {
    USER_REGISTRATION_SUBMITTED: "USER_REGISTRATION_SUBMITTED",
    USER_REGISTRATION_EMAIL_VERIFIED: "USER_REGISTRATION_EMAIL_VERIFIED",
    USER_REGISTRATION_APPROVED: "USER_REGISTRATION_APPROVED",
    USER_REGISTRATION_REJECTED: "USER_REGISTRATION_REJECTED",
  },
  SECURITY_LOG_STATUS: { SUCCESS: "SUCCESS", FAILED: "FAILED" },
}));

import {
  approveRegistrationRequest,
  listRegistrationRequests,
  rejectRegistrationRequest,
  submitRegistration,
  verifyRegistrationOtp,
} from "../service";

function registration(overrides: Record<string, unknown> = {}) {
  return {
    id: "reg-1",
    email: "pegawai@example.com",
    name: "Pegawai Test",
    nik: "7401010101010001",
    employeeId: null,
    passwordHash: "hashed-password",
    phone: "08123456789",
    workplaceName: "IGD",
    note: "Catatan",
    status: REGISTRATION_STATUS.EMAIL_PENDING,
    emailOtpHash: null,
    emailOtpExpiresAt: null,
    emailOtpAttempts: 0,
    emailOtpSentAt: new Date("2026-09-08T00:00:00Z"),
    emailVerifiedAt: null,
    reviewedAt: null,
    reviewedByAdminId: null,
    reviewNote: null,
    createdAt: new Date("2026-09-08T00:00:00Z"),
    updatedAt: new Date("2026-09-08T00:00:00Z"),
    ...overrides,
  };
}

describe("registration service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma.$transaction.mockImplementation(async (cb) => {
      if (typeof cb === "function") {
        return cb(mockPrisma);
      }
      return Promise.all(cb);
    });
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.employee.findFirst.mockResolvedValue(null);
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValue(null);
    mockPrisma.userRegistrationRequest.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.notification.create.mockResolvedValue({ id: "notif-1", userId: "admin-1", type: "INFO", title: "Registrasi", message: "", isRead: false, relatedEntityType: null, relatedEntityId: null, createdAt: new Date() });
  });

  it("submits a valid registration and sends an OTP email", async () => {
    const saved = registration({ emailOtpHash: "otp-hash", emailOtpExpiresAt: new Date(Date.now() + 600_000) });
    mockPrisma.userRegistrationRequest.create.mockResolvedValue(saved);

    const result = await submitRegistration({
      name: "Pegawai Test",
      email: "pegawai@example.com",
      nik: "7401010101010001",
      password: "password123",
      phone: "08123456789",
    });

    expect(result.maskedEmail).toBe("pe***@example.com");
    expect(emailMocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "pegawai@example.com" }));
    expect(mockPrisma.userRegistrationRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: REGISTRATION_STATUS.EMAIL_PENDING, nik: "7401010101010001" }),
    }));
  });

  it("rejects registration when email already belongs to an active user", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });

    await expect(submitRegistration({
      name: "Pegawai Test",
      email: "pegawai@example.com",
      nik: "7401010101010001",
      password: "password123",
    })).rejects.toThrow("Email sudah terdaftar");

    expect(mockPrisma.userRegistrationRequest.create).not.toHaveBeenCalled();
  });

  it.each([REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.REJECTED, REGISTRATION_STATUS.EXPIRED])(
    "allows a fresh registration without erasing a %s request's NIK",
    async (status) => {
      const historical = registration({ email: "old-address@example.com", status });
      mockPrisma.userRegistrationRequest.create.mockResolvedValueOnce(registration());

      await expect(submitRegistration({
        name: "Pegawai Test", email: "pegawai@example.com",
        nik: "7401010101010001", password: "password123",
      })).resolves.toMatchObject({ maskedEmail: "pe***@example.com" });
      expect(emailMocks.sendEmail).toHaveBeenCalledOnce();
      expect(historical.nik).toBe("7401010101010001");
      expect(mockPrisma.userRegistrationRequest.update).not.toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ nik: null }),
      }));
    },
  );

  it("only lists requests awaiting admin verification even when ALL is requested", async () => {
    mockPrisma.userRegistrationRequest.findMany.mockResolvedValue([]);
    mockPrisma.userRegistrationRequest.count.mockResolvedValue(0);
    await listRegistrationRequests({ status: "ALL" });
    expect(mockPrisma.userRegistrationRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW },
    }));
  });

  it("restarts a previously approved registration with the same email after its user was deleted", async () => {
    const oldRequest = registration({
      status: REGISTRATION_STATUS.APPROVED,
      emailVerifiedAt: new Date(), reviewedAt: new Date(), reviewedByAdminId: "admin-1", reviewNote: "Approved",
    });
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(oldRequest);
    mockPrisma.userRegistrationRequest.create.mockResolvedValueOnce(registration({ ...oldRequest, id: "reg-2", status: REGISTRATION_STATUS.EMAIL_PENDING }));
    await expect(submitRegistration({
      name: "Pegawai Test", email: oldRequest.email,
      nik: "7401010101010001", password: "password123",
    })).resolves.toMatchObject({ id: "reg-2" });
    expect(mockPrisma.userRegistrationRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: oldRequest.email, status: REGISTRATION_STATUS.EMAIL_PENDING }),
    }));
    expect(emailMocks.sendEmail).toHaveBeenCalledOnce();
  });

  it("does not reset a registration that already awaits admin approval", async () => {
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(registration({
      status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW,
      emailVerifiedAt: new Date(),
    }));

    await expect(submitRegistration({
      name: "Pegawai Test", email: "pegawai@example.com",
      nik: "7401010101010001", password: "password123",
    })).rejects.toThrow("Registrasi email ini sudah menunggu persetujuan admin");
    expect(mockPrisma.userRegistrationRequest.create).not.toHaveBeenCalled();
    expect(mockPrisma.userRegistrationRequest.update).not.toHaveBeenCalled();
    expect(emailMocks.sendEmail).not.toHaveBeenCalled();
  });

  it("explains when an email is still reserved by an archived account", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "archived-user", deletedAt: new Date() });
    await expect(submitRegistration({
      name: "Pegawai Test", email: "pegawai@example.com",
      nik: "7401010101010001", password: "password123",
    })).rejects.toThrow("Email masih terhubung dengan akun yang diarsipkan");
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: "pegawai@example.com" },
    }));
    expect(mockPrisma.userRegistrationRequest.create).not.toHaveBeenCalled();
  });

  it.each([
    { nik: "7401010101010001", employeeId: null },
    { nik: null, employeeId: "198001012010011001" },
  ])("explains when an identifier is still reserved by an archived employee %j", async (identity) => {
    mockPrisma.employee.findFirst.mockResolvedValue({ id: "archived-employee", ...identity, deletedAt: new Date() });
    await expect(submitRegistration({
      name: "Pegawai Test", email: "pegawai@example.com",
      nik: identity.nik ?? undefined, employeeId: identity.employeeId ?? undefined, password: "password123",
    })).rejects.toThrow("Identitas masih terhubung dengan pegawai yang diarsipkan");
    expect(mockPrisma.employee.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [identity.nik ? { nik: identity.nik } : { employeeId: identity.employeeId }] },
    }));
    expect(mockPrisma.userRegistrationRequest.create).not.toHaveBeenCalled();
  });

  it("reports the matching employee identifier instead of any identifier on the same row", async () => {
    mockPrisma.employee.findFirst.mockResolvedValue({
      id: "employee-1",
      nik: "7401010101010002",
      employeeId: "198001012010011001",
      deletedAt: null,
    });

    await expect(submitRegistration({
      name: "Pegawai Test",
      email: "pegawai@example.com",
      nik: "7401010101010001",
      employeeId: "198001012010011001",
      password: "password123",
    })).rejects.toThrow("NIP sudah terdaftar");
  });

  it("reports the matching pending registration identifier instead of any identifier on the same row", async () => {
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValue(registration({
      email: "other@example.com",
      nik: "7401010101010002",
      employeeId: "198001012010011001",
      status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW,
    }));

    await expect(submitRegistration({
      name: "Pegawai Test",
      email: "pegawai@example.com",
      nik: "7401010101010001",
      employeeId: "198001012010011001",
      password: "password123",
    })).rejects.toThrow("NIP sedang dipakai pada registrasi lain yang belum selesai");
  });

  it.each([REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.REJECTED, REGISTRATION_STATUS.EXPIRED])("allows a fresh registration without erasing a %s request's NIP", async (status) => {
    const historical = registration({ email: "old@example.com", nik: "7401010101010002", employeeId: "198001012010011001", status });
    mockPrisma.userRegistrationRequest.create.mockResolvedValueOnce(registration({ employeeId: historical.employeeId }));
    await expect(submitRegistration({
      name: "Pegawai Test", email: "pegawai@example.com",
      employeeId: "198001012010011001", password: "password123",
    })).resolves.toMatchObject({ maskedEmail: "pe***@example.com" });
    expect(historical.employeeId).toBe("198001012010011001");
    expect(mockPrisma.userRegistrationRequest.update).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ employeeId: null }),
    }));
  });

  it.each([REGISTRATION_STATUS.EMAIL_PENDING, REGISTRATION_STATUS.PENDING_ADMIN_REVIEW])(
    "keeps identity reserved by a %s request",
    async (status) => {
      mockPrisma.userRegistrationRequest.findFirst.mockResolvedValue(registration({ status, email: "other@example.com" }));
      await expect(submitRegistration({
        name: "Pegawai Test", email: "pegawai@example.com",
        nik: "7401010101010001", password: "password123",
      })).rejects.toThrow("NIK sedang dipakai pada registrasi lain yang belum selesai");
      expect(mockPrisma.userRegistrationRequest.create).not.toHaveBeenCalled();
      expect(emailMocks.sendEmail).not.toHaveBeenCalled();
    },
  );

  it("does not reserve identity from an abandoned expired OTP request", async () => {
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValue(null);
    mockPrisma.userRegistrationRequest.create.mockResolvedValueOnce(registration());

    await expect(submitRegistration({
      name: "Pegawai Test", email: "pegawai@example.com",
      nik: "7401010101010001", password: "password123",
    })).resolves.toMatchObject({ maskedEmail: "pe***@example.com" });
    expect(mockPrisma.userRegistrationRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: REGISTRATION_STATUS.EMAIL_PENDING,
        emailOtpExpiresAt: expect.objectContaining({ lte: expect.any(Date) }),
        OR: expect.arrayContaining([{ email: "pegawai@example.com" }, { nik: "7401010101010001" }]),
      }),
      data: expect.objectContaining({
        status: REGISTRATION_STATUS.EXPIRED,
        passwordHash: null,
        emailOtpHash: null,
      }),
    }));
    expect(mockPrisma.userRegistrationRequest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        email: { not: "pegawai@example.com" },
        OR: expect.arrayContaining([
          expect.objectContaining({
            status: REGISTRATION_STATUS.EMAIL_PENDING,
            emailOtpExpiresAt: expect.objectContaining({ gt: expect.any(Date) }),
          }),
        ]),
      }),
    }));
    expect(emailMocks.sendEmail).toHaveBeenCalledOnce();
  });

  it.each([
    { email: "invalid-email" },
    { name: " " },
    { nik: "123" },
    { nik: "", employeeId: "" },
    { employeeId: "abc" },
    { password: "short" },
    { phone: "invalid-phone" },
  ])("does not send email or persist invalid registration %j", async (invalid) => {
    await expect(submitRegistration({
      name: "Pegawai Test", email: "pegawai@example.com",
      nik: "7401010101010001", password: "password123", ...invalid,
    })).rejects.toThrow();
    expect(emailMocks.sendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.userRegistrationRequest.create).not.toHaveBeenCalled();
  });

  it("does not send OTP when saving the registration fails", async () => {
    mockPrisma.userRegistrationRequest.create.mockRejectedValueOnce(new Error("storage failed"));
    await expect(submitRegistration({
      name: "Pegawai Test", email: "pegawai@example.com",
      nik: "7401010101010001", password: "password123",
    })).rejects.toThrow("storage failed");
    expect(emailMocks.sendEmail).not.toHaveBeenCalled();
  });

  it("verifies a correct OTP and notifies admins", async () => {
    mockPrisma.userRegistrationRequest.create.mockResolvedValue(registration());
    await submitRegistration({
      name: "Pegawai Test",
      email: "pegawai@example.com",
      nik: "7401010101010001",
      password: "password123",
    });

    const createArg = mockPrisma.userRegistrationRequest.create.mock.calls[0][0];
    const otp = String(emailMocks.sendEmail.mock.calls[0][0].text).match(/\d{6}/)?.[0] || "000000";
    const pending = registration({
      emailOtpHash: createArg.data.emailOtpHash,
      emailOtpExpiresAt: new Date(Date.now() + 600_000),
    });
    const verified = registration({ status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW, emailVerifiedAt: new Date() });
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValue(pending);
    mockPrisma.userRegistrationRequest.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.userRegistrationRequest.findUnique.mockResolvedValue(verified);
    mockPrisma.user.findMany.mockResolvedValue([{ id: "admin-1", email: "admin@example.com" }]);

    const result = await verifyRegistrationOtp({ email: "pegawai@example.com", otp });

    expect(result.status).toBe(REGISTRATION_STATUS.PENDING_ADMIN_REVIEW);
    expect(mockPrisma.userRegistrationRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: pending.id, status: REGISTRATION_STATUS.EMAIL_PENDING }),
      data: expect.objectContaining({ status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW, emailOtpHash: null }),
    }));
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "admin-1" }) }));
  });

  it("expires an overdue OTP and purges staged credentials", async () => {
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValue(registration({
      emailOtpHash: "otp-hash",
      emailOtpExpiresAt: new Date("2026-01-01T00:00:00Z"),
    }));

    await expect(verifyRegistrationOtp({ email: "pegawai@example.com", otp: "123456" })).rejects.toThrow("Kode OTP sudah kedaluwarsa");
    expect(mockPrisma.userRegistrationRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: REGISTRATION_STATUS.EXPIRED,
        passwordHash: null,
        emailOtpHash: null,
      }),
    }));
  });

  it("increments OTP attempts when the code is wrong", async () => {
    mockPrisma.userRegistrationRequest.findFirst.mockResolvedValue(registration({
      emailOtpHash: "different-hash",
      emailOtpExpiresAt: new Date(Date.now() + 600_000),
    }));

    await expect(verifyRegistrationOtp({ email: "pegawai@example.com", otp: "123456" })).rejects.toThrow("Kode OTP tidak sesuai");
    expect(mockPrisma.userRegistrationRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { emailOtpAttempts: { increment: 1 } },
    }));
  });

  it("approves a pending request and creates User plus Employee", async () => {
    const pending = registration({ status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW, emailVerifiedAt: new Date() });
    mockPrisma.userRegistrationRequest.findUnique
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(registration({ status: REGISTRATION_STATUS.APPROVED, passwordHash: null }));
    mockPrisma.userRegistrationRequest.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.user.create.mockResolvedValue({ id: "user-new", email: pending.email });
    mockPrisma.employee.create.mockResolvedValue({ id: "employee-new", name: pending.name });

    const result = await approveRegistrationRequest({
      id: "reg-1",
      actor: { userId: "admin-1", name: "Admin", role: "ADMIN" },
    });

    expect(result.userId).toBeTruthy();
    expect(mockPrisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: pending.email, role: "EMPLOYEE", isActive: true }) }));
    expect(mockPrisma.employee.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ nik: pending.nik, name: pending.name }) }));
    expect(mockPrisma.userRegistrationRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: pending.id, status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW }),
      data: expect.objectContaining({ status: REGISTRATION_STATUS.APPROVED, passwordHash: null }),
    }));
  });

  it("does not approve a request already claimed by another admin", async () => {
    const pending = registration({ status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW, emailVerifiedAt: new Date() });
    mockPrisma.userRegistrationRequest.findUnique.mockResolvedValue(pending);
    mockPrisma.userRegistrationRequest.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(approveRegistrationRequest({
      id: "reg-1",
      actor: { userId: "admin-1", name: "Admin", role: "ADMIN" },
    })).rejects.toThrow("Registrasi ini sudah diproses oleh admin lain");
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.employee.create).not.toHaveBeenCalled();
    expect(securityMocks.logActivity).not.toHaveBeenCalledWith(expect.objectContaining({
      eventType: "USER_REGISTRATION_APPROVED",
    }));
  });

  it("rejects a request without creating User or Employee", async () => {
    mockPrisma.userRegistrationRequest.findUnique.mockResolvedValue(registration({ status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW }));
    mockPrisma.userRegistrationRequest.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.userRegistrationRequest.findUnique
      .mockResolvedValueOnce(registration({ status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW }))
      .mockResolvedValueOnce(registration({ status: REGISTRATION_STATUS.REJECTED }));

    const result = await rejectRegistrationRequest({
      id: "reg-1",
      actor: { userId: "admin-1", name: "Admin", role: "ADMIN" },
    });

    expect(result.status).toBe(REGISTRATION_STATUS.REJECTED);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.employee.create).not.toHaveBeenCalled();
    expect(mockPrisma.userRegistrationRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "reg-1",
        status: { in: [REGISTRATION_STATUS.EMAIL_PENDING, REGISTRATION_STATUS.PENDING_ADMIN_REVIEW] },
      }),
      data: expect.objectContaining({ status: REGISTRATION_STATUS.REJECTED, passwordHash: null }),
    }));
  });

  it("does not reject a request already claimed by another admin", async () => {
    mockPrisma.userRegistrationRequest.findUnique.mockResolvedValue(registration({ status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW }));
    mockPrisma.userRegistrationRequest.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(rejectRegistrationRequest({
      id: "reg-1",
      actor: { userId: "admin-1", name: "Admin", role: "ADMIN" },
    })).rejects.toThrow("Registrasi ini sudah diproses oleh admin lain");
    expect(securityMocks.logActivity).not.toHaveBeenCalledWith(expect.objectContaining({
      eventType: "USER_REGISTRATION_REJECTED",
    }));
  });
});

