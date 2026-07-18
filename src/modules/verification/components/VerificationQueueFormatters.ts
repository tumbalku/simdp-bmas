export function formatVerificationQueueDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function getVerificationQueueErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  return error instanceof Error ? error.message : fallback;
}

export function formatEmployeeIdentifier(employeeId: string | null, nik: string | null) {
  if (employeeId) return `NIP. ${employeeId}`;
  if (nik) return `NIK. ${nik}`;
  return "ID belum diset";
}