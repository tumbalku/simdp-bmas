export const DATE_LOCALE = "id-ID" as const;

export const DATE_FORMATS = {
  date: { dateStyle: "medium" },
  time: { timeStyle: "short" },
  dateTime: { dateStyle: "medium", timeStyle: "short" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;
