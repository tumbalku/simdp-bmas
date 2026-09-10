import { emailProvider, isEmailProviderConfigured } from "@/lib/notifications";

export async function sendRegistrationApprovalEmail(input: { email: string; registrationId: string }): Promise<"SENT" | "FAILED"> {
  if (!isEmailProviderConfigured()) {
    console.error("Registration approval email unavailable", { registrationId: input.registrationId, reason: "EMAIL_NOT_CONFIGURED" });
    return "FAILED";
  }

  try {
    await emailProvider.sendEmail({
      to: input.email,
      subject: "Registrasi SiCantIK disetujui",
      text: "Permohonan registrasi SiCantIK Anda telah disetujui oleh admin. Akun Anda sudah aktif. Silakan buka halaman login SiCantIK dan masuk menggunakan email serta kata sandi yang Anda gunakan saat mendaftar.",
      html: "<p>Permohonan registrasi SiCantIK Anda telah <strong>disetujui oleh admin</strong>.</p><p>Akun Anda sudah aktif. Silakan buka halaman login SiCantIK dan masuk menggunakan email serta kata sandi yang Anda gunakan saat mendaftar.</p>",
    });
    return "SENT";
  } catch {
    // Provider errors may contain recipient data or credentials; log only safe context.
    console.error("Registration approval email failed", { registrationId: input.registrationId, reason: "EMAIL_DELIVERY_FAILED" });
    return "FAILED";
  }
}
