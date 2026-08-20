import { DATE_FORMATS, DATE_LOCALE } from "@/constants";

function formatDate(value: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(
    new Date(value)
  );
}

export type ExpiryStatusType = "EXPIRED" | "EXPIRING_SOON" | "ACTIVE";

export type ExpiryStatusInfo = {
  type: ExpiryStatusType;
  label: string;
  shortLabel: string;
  formattedDate: string;
  daysRemaining: number;
  badgeClass: string;
  textClass: string;
  bgHighlightClass: string;
};

export function getExpiryStatusInfo(
  expiryDateValue: string | Date | null
): ExpiryStatusInfo | null {
  if (!expiryDateValue) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateValue);
  expDate.setHours(0, 0, 0, 0);

  const formattedDate = formatDate(expiryDateValue);
  const diffTime = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const absDays = Math.abs(daysRemaining);
    return {
      type: "EXPIRED",
      label: `Sudah Kedaluwarsa (${formattedDate})`,
      shortLabel: `Kedaluwarsa (${absDays} hari lalu)`,
      formattedDate,
      daysRemaining,
      badgeClass:
        "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 font-medium",
      textClass: "text-rose-600 dark:text-rose-400 font-medium",
      bgHighlightClass: "border-rose-500/30 bg-rose-500/[0.03]",
    };
  }

  if (daysRemaining <= 30) {
    return {
      type: "EXPIRING_SOON",
      label:
        daysRemaining === 0
          ? `Kedaluwarsa Hari Ini (${formattedDate})`
          : `Hampir Kedaluwarsa (${daysRemaining} hari lagi)`,
      shortLabel:
        daysRemaining === 0 ? "Hari ini" : `${daysRemaining} hari lagi`,
      formattedDate,
      daysRemaining,
      badgeClass:
        "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 font-medium",
      textClass: "text-amber-600 dark:text-amber-400 font-medium",
      bgHighlightClass: "border-amber-500/30 bg-amber-500/[0.03]",
    };
  }

  return {
    type: "ACTIVE",
    label: `Berlaku s.d. ${formattedDate}`,
    shortLabel: formattedDate,
    formattedDate,
    daysRemaining,
    badgeClass: "text-muted-foreground",
    textClass: "text-muted-foreground",
    bgHighlightClass: "",
  };
}
