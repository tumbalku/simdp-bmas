import { id as defaultDictionary } from "@/i18n/dictionaries/id";

const categoryCopy = defaultDictionary.masterData.categories;

export type EmployeeMasterDataEntity =
  | "EmploymentStatus"
  | "EmployeeGroup"
  | "ProfessionGroup"
  | "EmployeePosition"
  | "EmployeeRank"
  | "Workplace";

export type EmployeeCategoryType =
  | "STATUS"
  | "GROUP"
  | "PROFESSION"
  | "POSITION"
  | "RANK"
  | "WORKPLACE";

export type EmployeeCategoryTypeConfig = {
  label: string;
  entity: EmployeeMasterDataEntity;
  fieldLabel: string;
  parentType?: EmployeeCategoryType;
  parentField?: "employmentStatusId" | "professionGroupId";
  parentLabel?: string;
};

export const EMPLOYEE_CATEGORY_TYPE_CONFIG = {
  STATUS: {
    label: "Status Kepegawaian",
    entity: "EmploymentStatus",
    fieldLabel: "Nama Status",
  },
  GROUP: {
    label: "Kelompok Pegawai",
    entity: "EmployeeGroup",
    fieldLabel: "Nama Kelompok",
    parentType: "STATUS",
    parentField: "employmentStatusId",
    parentLabel: "Status Kepegawaian",
  },
  PROFESSION: {
    label: "Rumpun Profesi",
    entity: "ProfessionGroup",
    fieldLabel: "Nama Rumpun",
  },
  POSITION: {
    label: "Jabatan",
    entity: "EmployeePosition",
    fieldLabel: "Nama Jabatan",
    parentType: "PROFESSION",
    parentField: "professionGroupId",
    parentLabel: "Rumpun Profesi",
  },
  RANK: {
    label: "Pangkat/Golongan",
    entity: "EmployeeRank",
    fieldLabel: "Nama Pangkat",
  },
  WORKPLACE: {
    label: "Tempat Kerja",
    entity: "Workplace",
    fieldLabel: "Nama Tempat Kerja",
  },
} as const satisfies Record<EmployeeCategoryType, EmployeeCategoryTypeConfig>;

export const EMPLOYEE_CATEGORY_TYPE_OPTIONS = [
  { value: "STATUS", label: EMPLOYEE_CATEGORY_TYPE_CONFIG.STATUS.label },
  { value: "GROUP", label: EMPLOYEE_CATEGORY_TYPE_CONFIG.GROUP.label },
  { value: "PROFESSION", label: EMPLOYEE_CATEGORY_TYPE_CONFIG.PROFESSION.label },
  { value: "POSITION", label: EMPLOYEE_CATEGORY_TYPE_CONFIG.POSITION.label },
  { value: "RANK", label: EMPLOYEE_CATEGORY_TYPE_CONFIG.RANK.label },
  { value: "WORKPLACE", label: EMPLOYEE_CATEGORY_TYPE_CONFIG.WORKPLACE.label },
] as const satisfies ReadonlyArray<{ value: EmployeeCategoryType; label: string }>;

export const EMPLOYEE_STATUS_VALUE = {
  ACTIVE: "ACTIVE",
  RETIRED: "RETIRED",
  STUDY_ASSIGNMENT: "STUDY_ASSIGNMENT",
} as const;

export type EmployeeStatusValue = (typeof EMPLOYEE_STATUS_VALUE)[keyof typeof EMPLOYEE_STATUS_VALUE];

export const EMPLOYEE_STATUS_LABELS = {
  ACTIVE: "Aktif",
  RETIRED: "Pensiun",
  STUDY_ASSIGNMENT: "Tugas Belajar (Tubel)",
} as const satisfies Record<EmployeeStatusValue, string>;

export const EMPLOYEE_STATUS_LEGACY_TO_CANONICAL = {
  Aktif: EMPLOYEE_STATUS_VALUE.ACTIVE,
  Pensiun: EMPLOYEE_STATUS_VALUE.RETIRED,
  Tubel: EMPLOYEE_STATUS_VALUE.STUDY_ASSIGNMENT,
} as const;

export const GENDER_VALUE = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export type GenderValue = (typeof GENDER_VALUE)[keyof typeof GENDER_VALUE];

export const GENDER_LABELS = {
  MALE: "Pria",
  FEMALE: "Wanita",
} as const satisfies Record<GenderValue, string>;

export const GENDER_LEGACY_TO_CANONICAL = {
  Pria: GENDER_VALUE.MALE,
  LakiLaki: GENDER_VALUE.MALE,
  "Laki-laki": GENDER_VALUE.MALE,
  Wanita: GENDER_VALUE.FEMALE,
  Perempuan: GENDER_VALUE.FEMALE,
} as const;

export const RELIGION_VALUE = {
  ISLAM: "ISLAM",
  PROTESTANT: "PROTESTANT",
  CATHOLIC: "CATHOLIC",
  HINDU: "HINDU",
  BUDDHIST: "BUDDHIST",
  CONFUCIAN: "CONFUCIAN",
} as const;

export type ReligionValue = (typeof RELIGION_VALUE)[keyof typeof RELIGION_VALUE];

export const RELIGION_LABELS = {
  ISLAM: "Islam",
  PROTESTANT: "Kristen (Protestan)",
  CATHOLIC: "Katolik",
  HINDU: "Hindu",
  BUDDHIST: "Buddha",
  CONFUCIAN: "Khonghucu",
} as const satisfies Record<ReligionValue, string>;

export const RELIGION_LEGACY_TO_CANONICAL = {
  Islam: RELIGION_VALUE.ISLAM,
  Kristen: RELIGION_VALUE.PROTESTANT,
  Protestan: RELIGION_VALUE.PROTESTANT,
  Katolik: RELIGION_VALUE.CATHOLIC,
  Hindu: RELIGION_VALUE.HINDU,
  Buddha: RELIGION_VALUE.BUDDHIST,
  Khonghucu: RELIGION_VALUE.CONFUCIAN,
  Konghucu: RELIGION_VALUE.CONFUCIAN,
} as const;

export const MARITAL_STATUS_VALUE = {
  SINGLE: "SINGLE",
  MARRIED: "MARRIED",
  DIVORCED: "DIVORCED",
  WIDOWED: "WIDOWED",
} as const;

export type MaritalStatusValue = (typeof MARITAL_STATUS_VALUE)[keyof typeof MARITAL_STATUS_VALUE];

export const MARITAL_STATUS_LABELS = {
  SINGLE: "Belum Kawin",
  MARRIED: "Kawin",
  DIVORCED: "Cerai Hidup",
  WIDOWED: "Cerai Meninggal",
} as const satisfies Record<MaritalStatusValue, string>;

export const MARITAL_STATUS_LEGACY_TO_CANONICAL = {
  "Belum Kawin": MARITAL_STATUS_VALUE.SINGLE,
  Kawin: MARITAL_STATUS_VALUE.MARRIED,
  "Cerai Hidup": MARITAL_STATUS_VALUE.DIVORCED,
  "Cerai Meninggal": MARITAL_STATUS_VALUE.WIDOWED,
} as const;

export const EDUCATION_LEVEL_VALUE = {
  ELEMENTARY_SCHOOL: "ELEMENTARY_SCHOOL",
  JUNIOR_HIGH_SCHOOL: "JUNIOR_HIGH_SCHOOL",
  SENIOR_HIGH_SCHOOL: "SENIOR_HIGH_SCHOOL",
  DIPLOMA_1: "DIPLOMA_1",
  DIPLOMA_2: "DIPLOMA_2",
  DIPLOMA_3: "DIPLOMA_3",
  DIPLOMA_4: "DIPLOMA_4",
  BACHELOR: "BACHELOR",
  MASTER: "MASTER",
  DOCTORATE: "DOCTORATE",
  PROFESSIONAL: "PROFESSIONAL",
  SPECIALIST_2: "SPECIALIST_2",
} as const;

export type EducationLevelValue = (typeof EDUCATION_LEVEL_VALUE)[keyof typeof EDUCATION_LEVEL_VALUE];

export const EDUCATION_LEVEL_LABELS = {
  ELEMENTARY_SCHOOL: "SD / Sederajat",
  JUNIOR_HIGH_SCHOOL: "SMP / Sederajat",
  SENIOR_HIGH_SCHOOL: "SMA / SMK / Sederajat",
  DIPLOMA_1: "D1",
  DIPLOMA_2: "D2",
  DIPLOMA_3: "D3",
  DIPLOMA_4: "D4",
  BACHELOR: "S1",
  MASTER: "S2",
  DOCTORATE: "S3",
  PROFESSIONAL: "Profesi / Sp-1",
  SPECIALIST_2: "Sp-2",
} as const satisfies Record<EducationLevelValue, string>;

export const EDUCATION_LEVEL_LEGACY_TO_CANONICAL = {
  SD: EDUCATION_LEVEL_VALUE.ELEMENTARY_SCHOOL,
  SMP: EDUCATION_LEVEL_VALUE.JUNIOR_HIGH_SCHOOL,
  SMA: EDUCATION_LEVEL_VALUE.SENIOR_HIGH_SCHOOL,
  D1: EDUCATION_LEVEL_VALUE.DIPLOMA_1,
  D2: EDUCATION_LEVEL_VALUE.DIPLOMA_2,
  D3: EDUCATION_LEVEL_VALUE.DIPLOMA_3,
  D4: EDUCATION_LEVEL_VALUE.DIPLOMA_4,
  S1: EDUCATION_LEVEL_VALUE.BACHELOR,
  S2: EDUCATION_LEVEL_VALUE.MASTER,
  S3: EDUCATION_LEVEL_VALUE.DOCTORATE,
  Profesi: EDUCATION_LEVEL_VALUE.PROFESSIONAL,
  "Sp-1": EDUCATION_LEVEL_VALUE.PROFESSIONAL,
  "Sp-2": EDUCATION_LEVEL_VALUE.SPECIALIST_2,
} as const;

export function mapEmployeeStatusLegacyToCanonical(value: string | null | undefined) {
  if (!value) return null;
  return EMPLOYEE_STATUS_LEGACY_TO_CANONICAL[value as keyof typeof EMPLOYEE_STATUS_LEGACY_TO_CANONICAL] ?? null;
}

export function mapEducationLevelLegacyToCanonical(value: string | null | undefined) {
  if (!value) return null;
  return EDUCATION_LEVEL_LEGACY_TO_CANONICAL[value as keyof typeof EDUCATION_LEVEL_LEGACY_TO_CANONICAL] ?? null;
}

export const RELIGION_OPTIONS = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen (Protestan)" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Khonghucu", label: "Khonghucu" },
] as const;

export const EDUCATION_OPTIONS = [
  { value: "SD", label: "SD / Sederajat" },
  { value: "SMP", label: "SMP / Sederajat" },
  { value: "SMA", label: "SMA / SMK / Sederajat" },
  { value: "D1", label: "D1" },
  { value: "D2", label: "D2" },
  { value: "D3", label: "D3" },
  { value: "D4", label: "D4" },
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "S3", label: "S3" },
  { value: "Profesi", label: "Profesi / Sp-1" },
  { value: "Sp-2", label: "Sp-2" },
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { value: "Belum Kawin", label: "Belum Kawin" },
  { value: "Kawin", label: "Kawin" },
  { value: "Cerai Hidup", label: "Cerai Hidup" },
  { value: "Cerai Meninggal", label: "Cerai Meninggal" },
] as const;

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: "Aktif", label: "Aktif" },
  { value: "Pensiun", label: "Pensiun" },
  { value: "Tubel", label: "Tugas Belajar (Tubel)" },
] as const;

export const EMPLOYEE_CATEGORY_COPY = {
  pageTitle: categoryCopy.pageTitle,
  pageDescription: categoryCopy.pageDescription,
  addMaster: categoryCopy.addMaster,
  statusAndGroup: categoryCopy.statusAndGroup,
  professionAndPosition: categoryCopy.professionAndPosition,
  rankAndGrade: categoryCopy.rankAndGrade,
  workplace: categoryCopy.workplace,
  emptyEmploymentStatus: categoryCopy.emptyEmploymentStatus,
  emptyEmployeeGroup: categoryCopy.emptyEmployeeGroup,
  emptyProfessionGroup: categoryCopy.emptyProfessionGroup,
  emptyEmployeePosition: categoryCopy.emptyEmployeePosition,
  emptyRank: categoryCopy.emptyRank,
  emptyWorkplace: categoryCopy.emptyWorkplace,
  typeLabel: categoryCopy.typeLabel,
  typePlaceholder: categoryCopy.typePlaceholder,
  createDescription: categoryCopy.createDescription,
  editDescription: categoryCopy.editDescription,
  saveCreateSuccess: categoryCopy.saveCreateSuccess,
  saveUpdateSuccess: categoryCopy.saveUpdateSuccess,
} as const;
