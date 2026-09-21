import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findRegistrationById: vi.fn(),
  findExistingUserByEmail: vi.fn(),
  findExistingEmployeeIdentity: vi.fn(),
  findRegistrationByIdentity: vi.fn(),
  approveRegistrationTransaction: vi.fn(),
  sendEmail: vi.fn(),
  isEmailProviderConfigured: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("../repository", () => mocks);
vi.mock("@/lib/notifications", () => ({ emailProvider: { sendEmail: mocks.sendEmail }, isEmailProviderConfigured: mocks.isEmailProviderConfigured }));
vi.mock("@/modules/notification/server", () => ({ createNotification: vi.fn() }));
vi.mock("@/modules/security/server", () => ({
  logActivity: mocks.logActivity,
  SECURITY_ACTOR_ROLE: { PUBLIC: "PUBLIC" },
  SECURITY_EVENT_TYPE: { USER_REGISTRATION_APPROVED: "USER_REGISTRATION_APPROVED" },
  SECURITY_LOG_STATUS: { SUCCESS: "SUCCESS" },
}));

import { approveRegistrationRequest } from "../service";

const input = { id: "registration-1", actor: { userId: "admin-1", name: "Admin", role: "ADMIN" } };
const request = {
  id: input.id, email: "verified@example.com", name: "<script>untrusted</script>",
  nik: "7401010101010001", claimedNip: null, status: "UNDER_REVIEW", emailVerifiedAt: new Date(),
};

describe("registration approval email", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findRegistrationById.mockResolvedValue(request);
    mocks.approveRegistrationTransaction.mockResolvedValue({ registration: { id: input.id }, user: { id: "user-1" }, employee: { id: "employee-1" } });
    mocks.isEmailProviderConfigured.mockReturnValue(true);
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  it("sends to the verified registration email only after account transaction completes", async () => {
    mocks.sendEmail.mockImplementation(async () => {
      expect(mocks.approveRegistrationTransaction).toHaveBeenCalledOnce();
      expect(mocks.approveRegistrationTransaction.mock.settledResults[0].type).toBe("fulfilled");
    });
    const result = await approveRegistrationRequest(input);
    expect(result).toMatchObject({ userId: "user-1", emailDelivery: "SENT" });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: request.email, subject: "Registrasi SiCantIK disetujui", text: expect.stringContaining("disetujui"),
    }));
    expect(mocks.sendEmail.mock.calls[0][0].html).not.toContain(request.name);
  });

  it("does not send when the transaction fails", async () => {
    mocks.approveRegistrationTransaction.mockRejectedValue(new Error("transaction failed"));
    await expect(approveRegistrationRequest(input)).rejects.toThrow("transaction failed");
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("rejects requests whose email was never verified", async () => {
    mocks.findRegistrationById.mockResolvedValue({ ...request, emailVerifiedAt: null });
    await expect(approveRegistrationRequest(input)).rejects.toThrow("Email registrasi belum diverifikasi");
    expect(mocks.approveRegistrationTransaction).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("preserves successful approval and reports provider failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.sendEmail.mockRejectedValue(new Error("provider rejected"));
    await expect(approveRegistrationRequest(input)).resolves.toMatchObject({ userId: "user-1", emailDelivery: "FAILED" });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("reports unconfigured delivery without invoking the noop provider", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.isEmailProviderConfigured.mockReturnValue(false);
    await expect(approveRegistrationRequest(input)).resolves.toMatchObject({ userId: "user-1", emailDelivery: "FAILED" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
