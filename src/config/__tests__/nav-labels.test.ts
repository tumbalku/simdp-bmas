import { describe, expect, it } from "vitest";

import { ROUTES } from "@/constants/routes";
import { navItems, type NavItem } from "@/config/nav";

const flattenItems = () =>
  (navItems as readonly NavItem[]).flatMap((item) =>
    item.children?.length ? item.children : [item],
  );

describe("navigation labels", () => {
  it("uses distinct document and employee labels for sidebar navigation", () => {
    const items = flattenItems();

    expect(items.find((item) => item.href === ROUTES.documents)?.label).toBe("Dokumen Saya");
    expect(items.find((item) => item.href === ROUTES.masterDataDocuments)?.label).toBe("Dokumen Pegawai");
    expect(items.find((item) => item.href === ROUTES.masterDataEmployees)?.label).toBe("Data Pegawai");
    expect(items.find((item) => item.href === ROUTES.registrationRequests)?.label).toBe("Registrasi Pegawai");
    expect(items.find((item) => item.href === ROUTES.masterDataCategories)?.label).toBe("Kategori Pegawai");
  });
});
