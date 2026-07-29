---
title: Glossary
---

# Glossary

| Istilah | Arti |
|---|---|
| SIMDP | Sistem Informasi Manajemen Dokumen Pegawai. |
| SiCantIK | Branding aplikasi: Sistem Pencatatan Informasi Kepegawaian. |
| Employee | Pegawai sekaligus role user paling dasar. |
| Staff | Petugas kepegawaian yang dapat memverifikasi dokumen. |
| Admin | Role tertinggi untuk administrasi sistem. |
| DocumentType | Master jenis dokumen, seperti KTP, SK, sertifikat. |
| DocumentRecord | File dokumen milik pegawai beserta metadata dan statusnya. |
| VerificationHistory | Riwayat approve/reject dokumen. |
| SecurityLog | Audit trail append-only untuk aksi sensitif. |
| Storage provider | Tempat file dokumen aktif disimpan. |
| Backup target | Tempat artifact backup disimpan/dikirim. |
| RPO | Maksimal data yang boleh hilang saat recovery. |
| RTO | Maksimal waktu sistem boleh down sampai pulih. |
| Restore drill | Latihan restore untuk membuktikan backup bisa dipakai. |
| Soft delete | Data ditandai terhapus memakai `deletedAt`, bukan langsung hilang permanen. |
| Current document | Dokumen yang sedang aktif untuk jenis dokumen tersebut. |
| Service boundary | Public API internal modul melalui `service.ts`. |
| Repository | File query database internal modul. |
