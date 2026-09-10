import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("registration and auth UI source", () => {
  it("keeps login and register auth cards wider without changing default auth pages", () => {
    const authShell = readFileSync(join(root, "src/modules/auth/components/AuthCardShell.tsx"), "utf8");
    const loginPage = readFileSync(join(root, "src/modules/auth/components/LoginPage.tsx"), "utf8");
    const registrationPage = readFileSync(join(root, "src/modules/registration/components/RegistrationPage.tsx"), "utf8");

    expect(authShell).toContain('default: "max-w-md"');
    expect(authShell).toContain('login: "max-w-lg"');
    expect(authShell).toContain('register: "max-w-2xl"');
    expect(loginPage).toContain('width="login"');
    expect(registrationPage).toContain('width="register"');
  });

  it("keeps realtime registration guidance for identity and password confirmation", () => {
    const registrationForm = readFileSync(join(root, "src/modules/registration/components/RegistrationForm.tsx"), "utf8");

    expect(registrationForm).toContain("NIK harus 16 digit angka.");
    expect(registrationForm).toContain("NIP minimal 10 digit angka.");
    expect(registrationForm).toContain("Isi minimal salah satu: NIK atau NIP.");
    expect(registrationForm).toContain("Konfirmasi password tidak sesuai.");
    expect(registrationForm).toContain("disabled={isPending || !isValid}");
  });
});
