import { describe, expect, it } from "vitest";

import {
  getEmployeeStatusLabel,
  getGenderLabel,
  getMaritalStatusLabel,
  getReligionLabel,
} from "../constants";

describe("employee constants label mapping", () => {
  it("renders canonical gender enum values as Indonesian labels", () => {
    expect(getGenderLabel("MALE")).toBe("Pria");
    expect(getGenderLabel("FEMALE")).toBe("Wanita");
  });

  it("renders canonical marital status enum values as Indonesian labels", () => {
    expect(getMaritalStatusLabel("MARRIED")).toBe("Kawin");
    expect(getMaritalStatusLabel("SINGLE")).toBe("Belum Kawin");
  });

  it("keeps employee profile display labels Indonesian for other canonical enum fields", () => {
    expect(getEmployeeStatusLabel("ACTIVE")).toBe("Aktif");
    expect(getReligionLabel("ISLAM")).toBe("Islam");
    expect(getReligionLabel("PROTESTANT")).toBe("Kristen (Protestan)");
  });
});
