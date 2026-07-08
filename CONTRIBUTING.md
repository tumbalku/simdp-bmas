# Contributing to SIMDP

Dokumen ini mendefinisikan workflow kerja SIMDP agar terasa seperti alur kerja perusahaan: setiap perubahan dimulai dari Issue, dikerjakan di branch terpisah, diuji, lalu masuk lewat Pull Request (PR). Jangan push langsung ke `main` kecuali benar-benar emergency dan disetujui maintainer.

## Prinsip Utama

1. **Issue first** — setiap pekerjaan non-trivial harus punya GitHub Issue.
2. **Branch per task** — satu branch untuk satu issue/task.
3. **Tidak push langsung ke `main`** — semua perubahan masuk lewat PR.
4. **Test before PR** — jalankan validasi lokal sebelum membuka PR.
5. **Small PR** — PR kecil lebih mudah direview dan lebih aman dimerge.
6. **Conventional Commits** — pesan commit harus konsisten.

## Branch Naming

Format umum:

```txt
<type>/<issue-number>-<short-description>
```

Contoh:

```txt
feat/12-upload-dokumen
fix/18-login-refresh-token
chore/03-setup-ci
refactor/22-document-service-boundary
docs/09-update-prd-storage-provider
```

Tipe branch:

| Type | Kapan dipakai |
|---|---|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Dokumentasi/PRD/context |
| `chore` | Setup, config, dependency, maintenance |
| `refactor` | Perubahan struktur kode tanpa behavior baru |
| `test` | Penambahan/perbaikan test |
| `ci` | GitHub Actions/deployment pipeline |

## Commit Message

Gunakan Conventional Commits:

```txt
<type>(<scope>): <short description>
```

Contoh:

```txt
docs(prd): clarify storage provider upload flow
chore(repo): add issue and pr workflow templates
feat(document): add server-mediated upload endpoint
fix(auth): revoke refresh token on logout
```

## Pull Request Rules

Sebelum membuka PR:

- [ ] Issue terkait sudah ada.
- [ ] Branch dibuat dari `main` terbaru.
- [ ] Tidak ada file rahasia ikut ter-commit.
- [ ] Validasi lokal sudah dijalankan.
- [ ] PR description menjelaskan summary, test plan, dan linked issue.

PR hanya boleh merge jika:

- [ ] CI/checks lulus.
- [ ] Minimal 1 review approve jika sudah ada reviewer.
- [ ] Tidak ada konflik dengan `main`.
- [ ] Scope PR sesuai issue.

## Local Workflow

```bash
# 1. Ambil update terbaru
git checkout main
git pull origin main

# 2. Buat branch dari issue
git checkout -b feat/12-upload-dokumen

# 3. Kerjakan perubahan, lalu cek status
git status

# 4. Stage file spesifik
git add path/to/file.ts

# 5. Commit
git commit -m "feat(document): add upload endpoint"

# 6. Push branch, bukan main
git push -u origin HEAD

# 7. Buka PR ke main
```

## Validation Checklist

Minimal sebelum PR:

```bash
npm run lint
npm run typecheck
npm test
```

Jika script belum tersedia, tambahkan saat setup Next.js atau jelaskan di PR bahwa validasi belum tersedia.

## Confidential Files

Jangan commit:

- `.env` dan `.env.*`
- secret key/token/service account
- file upload pegawai
- database dump/backup
- data CSV/XLSX berisi data pegawai
- isi folder `LocalStorage/`

Gunakan `.env.example` untuk contoh konfigurasi tanpa nilai secret.
