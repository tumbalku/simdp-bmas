import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const navbarSource = readFileSync(join(process.cwd(), "src/components/navigation/Navbar.tsx"), "utf8");

describe("Navbar mobile menu visibility", () => {
  it("gates the mobile toggle and panel behind an authenticated profile", () => {
    expect(navbarSource).toContain("const hasProfile = Boolean(profile)");
    expect(navbarSource).toContain("{hasProfile ? (");
    expect(navbarSource).toContain("{hasProfile && mobileMenuOpen && (");
  });

  it("marks mobile nav parts for theme-specific polish", () => {
    expect(navbarSource).toContain("mobile-nav-panel");
    expect(navbarSource).toContain("mobile-nav-link");
    expect(navbarSource).toContain("mobile-nav-children");
    expect(navbarSource).toContain("data-active={isActive}");
  });

  it("anchors the mobile panel inside an isolated navbar layer", () => {
    expect(navbarSource).toContain("isolate sticky");
    expect(navbarSource).toContain("inset-x-3 top-full");
    expect(navbarSource).not.toContain("absolute left-3 right-3 top-16");
    expect(navbarSource).not.toContain("relative isolate sticky");
  });
});

describe("Navbar theme selector", () => {
  it("uses a dropdown selector instead of a binary theme toggle", () => {
    expect(navbarSource).toContain("function ThemeSelector()");
    expect(navbarSource).toContain("<DropdownMenu>");
    expect(navbarSource).toContain("<DropdownMenuGroup>");
    expect(navbarSource).toContain("APP_THEME_OPTIONS.map");
    expect(navbarSource).toContain("setTheme(option.id)");
    expect(navbarSource).not.toContain("function ThemeToggle()");
  });
});
