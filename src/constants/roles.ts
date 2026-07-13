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

export const ROLE_BADGE_STYLES = {
  ADMIN: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20",
  STAFF: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20",
  EMPLOYEE:
    "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/20",
} as const satisfies Record<UserRole, string>;

export const DEFAULT_ROLE_BADGE_STYLE = ROLE_BADGE_STYLES.EMPLOYEE;

export function getRoleBadgeStyle(role: string | null | undefined): string {
  if (!role || !(role in ROLE_BADGE_STYLES)) return DEFAULT_ROLE_BADGE_STYLE;
  return ROLE_BADGE_STYLES[role as UserRole];
}
