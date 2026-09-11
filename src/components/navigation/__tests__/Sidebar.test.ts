import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sidebarSource = readFileSync(
  join(process.cwd(), "src/components/navigation/Sidebar.tsx"),
  "utf8",
);

describe("Sidebar collapse control", () => {
  it("supports smooth arrow-driven collapse and expand", () => {
    expect(sidebarSource).toContain("const [collapsed, setCollapsed] = useState(false)");
    expect(sidebarSource).toContain('collapsed ? "3.75rem" : "13rem"');
    expect(sidebarSource).toContain("transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]");
    expect(sidebarSource).toContain("transition-[max-width,opacity,transform] duration-300 ease-out");
    expect(sidebarSource).toContain("PanelLeftClose");
    expect(sidebarSource).toContain("PanelLeftOpen");
    expect(sidebarSource).toContain("setCollapsed((value) => !value)");
  });

  it("keeps collapsed sidebar usable with icon-only labels", () => {
    expect(sidebarSource).toContain("aria-expanded={!collapsed}");
    expect(sidebarSource).toContain("title={item.label}");
    expect(sidebarSource).toContain('className="w-full px-1.5"');
    expect(sidebarSource).toContain('collapsed ? "w-full gap-0 px-2" : "w-full gap-2 px-2"');
    expect(sidebarSource).not.toContain("mx-auto size-8");
    expect(sidebarSource).not.toContain("flex justify-center px-0");
    expect(sidebarSource).toContain('collapsed ? "max-w-0 -translate-x-2 opacity-0" : "max-w-36 translate-x-0 opacity-100"');
    expect(sidebarSource).toContain("aria-hidden={collapsed}");
  });

  it("flattens sidebar submenus into direct menu entries", () => {
    expect(sidebarSource).toContain("const items = getSidebarItemsByRole(role)");
    expect(sidebarSource).toContain("function getSidebarItemsByRole(role: UserRole)");
    expect(sidebarSource).toContain("return item.children.filter");
    expect(sidebarSource).not.toContain("SidebarMenuSub");
    expect(sidebarSource).not.toContain("ChevronDown");
  });
});
