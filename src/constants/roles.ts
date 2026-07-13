export const USER_ROLES = ["ADMIN", "STAFF", "EMPLOYEE"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS = {
  ADMIN: "Admin",
  STAFF: "Staf Kepegawaian",
  EMPLOYEE: "Karyawan",
} as const satisfies Record<UserRole, string>;

export const ROLE_GROUPS = {
  all: USER_ROLES,
  adminStaff: ["ADMIN", "STAFF"],
  adminOnly: ["ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;
