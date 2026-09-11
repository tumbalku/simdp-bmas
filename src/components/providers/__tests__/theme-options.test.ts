import { describe, expect, it } from "vitest";

import {
  APP_THEME_IDS,
  APP_THEME_OPTIONS,
  APP_THEME_STORAGE_KEY,
  DEFAULT_APP_THEME,
  DARK_APP_THEME_IDS,
  getAppThemeOption,
  getSonnerThemeForAppTheme,
  isAppThemeId,
} from "@/components/providers/theme-options";

describe("theme options", () => {
  it("defines the supported multi-theme ids for next-themes", () => {
    expect(APP_THEME_STORAGE_KEY).toBe("simdp-theme");
    expect(DEFAULT_APP_THEME).toBe("light");
    expect(APP_THEME_IDS).toEqual(["light", "spotify", "dracula", "pastel-glass"]);
    expect(APP_THEME_OPTIONS.map((theme) => theme.id)).toEqual(APP_THEME_IDS);
  });

  it("guards theme ids before normalizing stored values", () => {
    expect(isAppThemeId("spotify")).toBe(true);
    expect(isAppThemeId("dark")).toBe(false);
    expect(isAppThemeId(undefined)).toBe(false);
  });

  it("maps app themes to compatible Sonner color schemes", () => {
    expect(DARK_APP_THEME_IDS).toEqual(["spotify", "dracula"]);
    expect(getSonnerThemeForAppTheme("spotify")).toBe("dark");
    expect(getSonnerThemeForAppTheme("dracula")).toBe("dark");
    expect(getSonnerThemeForAppTheme("pastel-glass")).toBe("light");
    expect(getSonnerThemeForAppTheme("unknown")).toBe("light");
  });

  it("keeps preview swatches available for every selector item", () => {
    for (const theme of APP_THEME_OPTIONS) {
      expect(getAppThemeOption(theme.id)?.label).toBeTruthy();
      expect(theme.previewColors.length).toBeGreaterThanOrEqual(3);
    }
  });
});
