import type { Dictionary } from "../types";

export const id = {
  app: {
    name: "SIMDP",
    organization: "RSUD Bahteramas",
  },
  nav: {
    dashboard: "Dashboard",
    documents: "Dokumen",
    verification: "Verifikasi",
    masterData: "Master Data",
    masterDataDocuments: "Dokumen",
    masterDataEmployees: "Pegawai",
    masterDataCategories: "Kategori",
    security: "Keamanan",
    settings: "Pengaturan",
    menu: "Menu",
  },
  masterData: {
    categories: {
      pageTitle: "Kategori Pegawai",
      pageDescription:
        "Kelola hirarki status, jenis kepegawaian, kelompok profesi, jabatan, pangkat, dan tempat kerja.",
      addMaster: "Tambah Master",
      statusAndGroup: "Status & Kelompok Pegawai",
      professionAndPosition: "Rumpun Profesi & Jabatan",
      rankAndGrade: "Pangkat & Golongan",
      workplace: "Tempat Kerja",
      emptyEmploymentStatus: "Belum ada data status kepegawaian.",
      emptyEmployeeGroup: "Belum ada kelompok untuk status ini.",
      emptyProfessionGroup: "Belum ada data rumpun profesi.",
      emptyEmployeePosition: "Belum ada jabatan untuk rumpun ini.",
      emptyRank: "Belum ada data pangkat atau golongan.",
      emptyWorkplace: "Belum ada data tempat kerja.",
      typeLabel: "Jenis Kategori",
      typePlaceholder: "Pilih jenis kategori",
      createDescription: "Isi data kategori baru.",
      editDescription: "Perbarui data kategori yang dipilih.",
      saveCreateSuccess: "Data berhasil ditambahkan.",
      saveUpdateSuccess: "Data berhasil diperbarui.",
    },
  },
} as const satisfies Dictionary;
