import { describe, expect, it } from "vitest";

import {
  getEmployeeStatusLabel,
  getGenderLabel,
  getMaritalStatusLabel,
  getReligionLabel,
  mapEmployeeStatusLegacyToCanonical,
  mapGenderLegacyToCanonical,
  mapMaritalStatusLegacyToCanonical,
  mapReligionLegacyToCanonical,
} from "../constants";

describe("employee constants label mapping", () => {
  it("renders canonical gender enum values as Indonesian labels", () => {
    expect(getGenderLabel("MALE")).toBe("Pria");
    expect(getGenderLabel("FEMALE")).toBe("Wanita");
    expect(mapGenderLegacyToCanonical("Wanita")).toBe("FEMALE");
  });

  it("renders canonical marital status enum values as Indonesian labels", () => {
    expect(getMaritalStatusLabel("MARRIED")).toBe("Kawin");
    expect(getMaritalStatusLabel("SINGLE")).toBe("Belum Kawin");
    expect(mapMaritalStatusLegacyToCanonical("Kawin")).toBe("MARRIED");
  });

  it("keeps employee profile display labels Indonesian for other canonical enum fields", () => {
    expect(getEmployeeStatusLabel("ACTIVE")).toBe("Aktif");
    expect(getReligionLabel("ISLAM")).toBe("Islam");
    expect(getReligionLabel("PROTESTANT")).toBe("Kristen (Protestan)");
    expect(mapReligionLegacyToCanonical("Kristen (Protestan)")).toBe("PROTESTANT");
    expect(mapEmployeeStatusLegacyToCanonical("Tugas Belajar (Tubel)")).toBe("STUDY_ASSIGNMENT");
  });
});
