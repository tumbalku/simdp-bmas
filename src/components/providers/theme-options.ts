export const APP_THEME_STORAGE_KEY = "simdp-theme";

export const APP_THEME_IDS = ["light", "spotify", "dracula", "pastel-glass"] as const;

export type AppThemeId = (typeof APP_THEME_IDS)[number];
export type AppThemeMode = "light" | "dark";

export type AppThemeOption = {
  id: AppThemeId;
  label: string;
  description: string;
  mode: AppThemeMode;
  previewColors: readonly string[];
};

export const DEFAULT_APP_THEME: AppThemeId = "light";

export const APP_THEME_OPTIONS = [
  {
    id: "light",
    label: "Light",
    description: "Tema resmi SIMDP yang bersih dan terang.",
    mode: "light",
    previewColors: ["#f8fafc", "#0f766e", "#0ea5e9"],
  },
  {
    id: "spotify",
    label: "Spotify Dark",
    description: "Gelap, kontras, dengan aksen hijau.",
    mode: "dark",
    previewColors: ["#0a0a0a", "#1ed760", "#4ba3e3"],
  },
  {
    id: "dracula",
    label: "Dracula",
    description: "Tema gelap ungu dengan aksen pink.",
    mode: "dark",
    previewColors: ["#282a36", "#bd93f9", "#ff79c6"],
  },
  {
    id: "pastel-glass",
    label: "Pastel Glass",
    description: "Gradient pastel dan surface glassmorphism.",
    mode: "light",
    previewColors: ["#ffd6a6", "#ffb3c7", "#c8b4fe"],
  },
] as const satisfies readonly AppThemeOption[];

export const DARK_APP_THEME_IDS = APP_THEME_OPTIONS
  .filter((theme) => theme.mode === "dark")
  .map((theme) => theme.id);

export function isAppThemeId(value: string | undefined): value is AppThemeId {
  return APP_THEME_IDS.some((themeId) => themeId === value);
}

export function getAppThemeOption(value: string | undefined) {
  return APP_THEME_OPTIONS.find((theme) => theme.id === value);
}

export function getSonnerThemeForAppTheme(value: string | undefined): AppThemeMode {
  return getAppThemeOption(value)?.mode ?? DEFAULT_APP_THEME_MODE;
}

const DEFAULT_APP_THEME_MODE = APP_THEME_OPTIONS.find(
  (theme) => theme.id === DEFAULT_APP_THEME
)?.mode ?? "light";
