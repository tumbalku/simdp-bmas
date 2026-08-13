import { DATE_FORMATS, DATE_LOCALE } from "../constants";

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.dateTime).format(date);
}

export function formatDateInput(value?: Date | string | null): string {
  if (!value) return "";
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
