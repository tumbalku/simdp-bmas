import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  verify: vi.fn(),
  increment: vi.fn(),
}));

vi.mock("../service", () => ({
  submitRegistration: mocks.submit,
  verifyRegistrationOtp: mocks.verify,
  approveRegistrationRequest: vi.fn(),
  rejectRegistrationRequest: vi.fn(),
  listRegistrationRequests: vi.fn(),
}));
vi.mock("@/lib/rate-limit-store", () => ({ incrementSharedRateLimitBucket: mocks.increment }));
vi.mock("@/modules/employee/server", () => ({ getActorDisplayName: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { submitRegistrationAction, verifyRegistrationOtpAction } from "../actions";

const registration = {
  email: "pegawai@example.com",
  name: "Pegawai Test",
  nik: "7401010101010001",
  password: "password123",
  confirmPassword: "password123",
};

describe("public registration action protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.increment.mockResolvedValue({ count: 1 });
    mocks.submit.mockResolvedValue({ id: "reg-1" });
    mocks.verify.mockResolvedValue({ id: "reg-1" });
  });

  it("rejects invalid form fields before rate limiting or email service", async () => {
    const result = await submitRegistrationAction({ ...registration, nik: "123" });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
    expect(mocks.increment).not.toHaveBeenCalled();
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("rejects mismatched password confirmation before rate limiting or email service", async () => {
    const result = await submitRegistrationAction({ ...registration, confirmPassword: "password456" });

    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
    expect(mocks.increment).not.toHaveBeenCalled();
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("blocks OTP sending when the IP limit is exceeded", async () => {
    mocks.increment.mockResolvedValueOnce({ count: 16 });
    expect(await submitRegistrationAction(registration)).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("blocks OTP sending when the recipient limit is exceeded", async () => {
    mocks.increment.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 6 });
    expect(await submitRegistrationAction(registration)).toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("uses the same private recipient bucket for normalized emails", async () => {
    await submitRegistrationAction({ ...registration, email: " PEGAWAI@EXAMPLE.COM " });
    await submitRegistrationAction(registration);
    const firstKey = mocks.increment.mock.calls[1][0].key;
    expect(firstKey).toBe(mocks.increment.mock.calls[3][0].key);
    expect(firstKey).not.toContain(registration.email);
    expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({ email: registration.email }));
  });

  it("accepts claimedNip as the registration NIP contract", async () => {
    const { nik: _nik, ...withoutNik } = registration;
    void _nik;

    await submitRegistrationAction({ ...withoutNik, claimedNip: "198001012010011001" });

    expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({
      claimedNip: "198001012010011001",
    }));
  });

  it("blocks OTP verification before calling the service when limited", async () => {
    mocks.increment.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 6 });
    expect(await verifyRegistrationOtpAction({ email: registration.email, otp: "123456" }))
      .toMatchObject({ ok: false, error: { code: "RATE_LIMITED" } });
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("keeps sending and verification in separate buckets", async () => {
    await submitRegistrationAction(registration);
    await verifyRegistrationOtpAction({ email: registration.email, otp: "123456" });
    expect(mocks.increment.mock.calls[0][0].key).not.toBe(mocks.increment.mock.calls[2][0].key);
    expect(mocks.increment.mock.calls[1][0].key).not.toBe(mocks.increment.mock.calls[3][0].key);
    expect(mocks.verify).toHaveBeenCalledOnce();
  });
});
