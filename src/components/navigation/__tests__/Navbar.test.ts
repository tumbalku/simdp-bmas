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
});
