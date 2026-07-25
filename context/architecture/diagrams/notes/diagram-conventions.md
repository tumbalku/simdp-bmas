# Diagram Conventions — SIMDP PlantUML

Dokumen ini menjelaskan konvensi standar yang digunakan untuk semua diagram PlantUML dalam proyek SIMDP.

## 1. Konvensi Umum

### Skinparam Standar
Setiap file `.puml` WAJIB menggunakan header berikut (tanpa `!theme` agar kompatibel dengan semua versi PlantUML):

```plantuml
skinparam shadowing false
skinparam defaultFontName Arial
```

### Judul Diagram
Setiap diagram WAJIB memiliki baris `title` yang mendeskripsikan isi diagram dengan format:
```
title SIMDP - [Jenis Diagram]: [Nama Spesifik Diagram]
```

## 2. Konvensi Per Jenis Diagram

### Use Case Diagram
- Gunakan `actor alias as "Nama Tampilan"` untuk semua aktor.
- Gunakan `usecase ALIAS as "Deskripsi..."` untuk use case.
- Hubungan inheritansi aktor: `staff --|> employee`.
- Hubungan include/extend: `A ..> B : "<<include>>"` (label harus dikutip).

### Sequence Diagram
- Selalu gunakan `autonumber` di awal.
- Gunakan `activate / deactivate` untuk blok aktivasi komponen.
- Gunakan `alt / else / end` untuk percabangan kondisi.
- Gunakan `== Bagian ==` untuk memisahkan skenario dalam satu diagram.

### Activity Diagram
- Selalu mulai dengan `start` dan akhiri dengan `stop`.
- Gunakan `partition "Nama"` untuk mengelompokkan aktivitas per peran/layer.
- Gunakan `fork / fork again / end fork` untuk aktivitas paralel.
- Gunakan `repeat / repeat while` untuk loop.

### State Diagram
- Selalu mulai dari `[*]` dan akhiri ke `[*]`.
- Sertakan label transisi yang menjelaskan *trigger* dan *kondisi*.
- Tambahkan `note` untuk menjelaskan aturan bisnis terkait status.

### Class Diagram
- Gunakan `skinparam classAttributeIconSize 0` agar tidak ada ikon akses.
- Pisahkan atribut dan metode dengan `--`.
- Gunakan paket (`package`) untuk mengelompokkan entitas per domain.
- Kardinalitas relasi: `"1"`, `"0..1"`, `"0..*"`, `"*"`.

### ERD (Entity Relationship Diagram)
- Gunakan `skinparam linetype ortho`.
- Gunakan `entity` dengan notasi `*` untuk field wajib (NOT NULL).
- Tandai PK, FK, UNIQUE di nama field: `* id : String <<PK>>`.
- Gunakan notasi Crow's Foot: `||--o{`, `||--o|`, `}|--o|`.

### Component Diagram
- Gunakan `skinparam componentStyle uml2`.
- Gunakan `[NamaKomponen]` atau `[NamaKomponen] as Alias`.
- Gunakan `..>` (dependency) untuk cross-module calls.
- Gunakan `-->` (solid) untuk direct/internal calls.

## 3. Konvensi Penamaan File

| Jenis | Format Nama File | Contoh |
|---|---|---|
| Overview | `system-overview.puml` | `system-overview.puml` |
| Use Case | `use-case-[aktor/topik].puml` | `use-case-auth.puml` |
| Activity | `activity-[workflow].puml` | `activity-upload-document.puml` |
| Sequence | `sequence-[skenario].puml` | `sequence-login-refresh-logout.puml` |
| State | `state-[entitas].puml` | `state-document-record.puml` |
| Class | `class-[domain].puml` | `class-auth-domain.puml` |
| Component | `component-[topik].puml` | `component-storage-infrastructure.puml` |
| ERD | `erd-[domain].puml` | `erd-auth.puml` |

## 4. Aturan Label & Stereotipe

- Stereotipe dalam label HARUS dikutip: `"<<include>>"`, `"<<extend>>"`.
- Hindari karakter spesial (`<`, `>`, `&`) dalam label tanpa dikutip.
- Gunakan `\n` untuk baris baru dalam label multi-baris.

## 5. Aturan Organisasi File

- **Satu file = satu tujuan utama.** Jangan campurkan jenis diagram berbeda dalam satu file.
- **Pisahkan diagram besar** menjadi sub-diagram per domain (contoh: ERD dipecah menjadi `erd-auth`, `erd-employee-master-data`, dll).
- Semua file baru **HARUS didaftarkan** di `diagrams/README.md`.
