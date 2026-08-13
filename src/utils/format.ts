export function formatFileSize(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
