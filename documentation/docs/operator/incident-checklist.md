---
title: Incident Checklist
---

# Incident Checklist

Gunakan checklist ini saat terjadi gangguan production atau dugaan kehilangan data.

## Saat incident dimulai

- Catat waktu mulai incident.
- Catat gejala: login gagal, database error, file tidak bisa dibuka, upload gagal, atau data hilang.
- Hentikan upload/edit jika ada risiko data makin rusak.
- Jangan menghapus backup lama.
- Jangan menjalankan restore langsung ke production tanpa keputusan operator.

## Diagnosis awal

- Cek health aplikasi.
- Cek koneksi database.
- Cek storage provider.
- Cek log deployment/platform.
- Cek apakah ada migration/deploy terbaru.
- Cek backup terakhir yang berhasil.

## Jika perlu restore

- Tentukan timestamp data terakhir yang dipercaya.
- Pilih manifest backup database dan storage yang cocok.
- Restore ke environment sementara.
- Validasi database dan file storage.
- Jalankan smoke test aplikasi.
- Putuskan cutover bersama maintainer/operator.

## Setelah sistem pulih

- Catat durasi downtime.
- Catat data yang hilang jika ada.
- Catat backup yang dipakai.
- Catat root cause sementara.
- Tambahkan follow-up issue.
- Update runbook jika ada langkah yang berbeda dari dokumentasi.

## Larangan

- Jangan menaruh secret di issue atau chat publik.
- Jangan upload backup artifact ke repo.
- Jangan membagikan database dump tanpa enkripsi.
- Jangan menghapus audit log.
