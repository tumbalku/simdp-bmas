export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/documents",
  "/master-data",
  "/notifications",
  "/profile",
  "/security-log",
  "/settings",
  "/statistics",
  "/system-settings",
  "/verification",
] as const;

export const AUTH_PAGE_PREFIXES = ["/login", "/forgot-password", "/reset-password"] as const;

export const PUBLIC_PAGE_PREFIXES = ["/", "/verify-document", ...AUTH_PAGE_PREFIXES] as const;

export function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => isPathOrChild(pathname, prefix));
}

export function isAuthPagePath(pathname: string) {
  return AUTH_PAGE_PREFIXES.some((prefix) => isPathOrChild(pathname, prefix));
}

export function isPublicPagePath(pathname: string) {
  return PUBLIC_PAGE_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : isPathOrChild(pathname, prefix)
  );
}
