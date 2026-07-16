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
