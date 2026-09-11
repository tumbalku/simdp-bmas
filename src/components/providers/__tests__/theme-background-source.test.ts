import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("pastel glass shared background", () => {
  it("uses one shared pastel background token for body and app shells", () => {
    const globals = readSource("src/app/globals.css");

    expect(globals).toContain("--pastel-glass-page-background");
    expect(globals).toContain(".pastel-glass body");
    expect(globals).toContain(".pastel-glass .theme-app-shell");
    expect(globals).toContain("background: var(--pastel-glass-page-background)");
  });

  it("applies the shared app shell on login and dashboard layouts", () => {
    const publicLayout = readSource("src/modules/auth/components/PublicAuthLayout.tsx");
    const dashboardLayout = readSource("src/app/(dashboard)/layout.tsx");

    expect(publicLayout).toContain("theme-app-shell");
    expect(dashboardLayout).toContain("theme-app-shell");
    expect(dashboardLayout).toContain("fixed inset-0 !min-h-0 overflow-hidden");
    expect(dashboardLayout).toContain("grid-rows-[3.5rem_minmax(0,1fr)]");
    expect(dashboardLayout).not.toContain("fixed inset-0 h-dvh");
  });

  it("keeps landing page media visible while blending with pastel glass", () => {
    const landingPage = readSource("src/app/page.tsx");
    const globals = readSource("src/app/globals.css");

    expect(landingPage).toContain("theme-app-shell");
    expect(landingPage).toContain("landing-hero-media");
    expect(landingPage).toContain("landing-hero-overlay");
    expect(landingPage).toContain("landing-footer");
    expect(globals).toContain(".pastel-glass .landing-hero-media");
    expect(globals).toContain(".pastel-glass .landing-hero-overlay");
    expect(globals).toContain("opacity: 0.46");
    expect(globals).not.toContain(".pastel-glass .landing-hero-media,\n  .pastel-glass .landing-hero-overlay {\n    display: none;");
  });

  it("keeps select option lists solid in pastel glass", () => {
    const globals = readSource("src/app/globals.css");

    expect(globals).toContain('.pastel-glass [data-slot="select-content"]');
    expect(globals).toContain("backdrop-filter: none");
    expect(globals).toContain('.pastel-glass [data-slot="select-item"]:focus');
  });

  it("uses primary-colored borders instead of white borders in pastel glass", () => {
    const globals = readSource("src/app/globals.css");

    expect(globals).toContain("--border: rgb(185 68 217 / 0.32)");
    expect(globals).toContain("--sidebar-border: rgb(185 68 217 / 0.32)");
    expect(globals).toContain("border-color: rgb(185 68 217 / 0.34)");
    expect(globals).not.toContain("--border: rgb(255 255 255 / 0.56)");
    expect(globals).not.toContain("--sidebar-border: rgb(255 255 255 / 0.58)");
    expect(globals).not.toContain("border-color: rgb(255 255 255 / 0.58)");
  });
});
