export function normalizeStoragePath(filePath: string) {
  return filePath
    .split("?")[0]
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "")
    .replace(/^supabase\//, "");
}

export function encodeStoragePath(filePath: string) {
  return normalizeStoragePath(filePath)
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}
