# ADR-003: Pluggable Storage Provider

**Status:** Accepted
**Tanggal:** 2026-07-08

## Konteks

SIMDP harus menyimpan dokumen pegawai. Development butuh storage lokal tanpa konfigurasi cloud, sedangkan production dapat memakai Supabase Storage atau S3-compatible storage. Logika bisnis dokumen tidak boleh berubah ketika provider diganti.

## Keputusan

Gunakan kontrak **`IStorageProvider`** di `src/lib/storage/` dengan provider:

- `LocalStorageProvider` untuk development;
- `SupabaseStorageProvider` untuk production option A;
- `S3StorageProvider` untuk production option B/future-proof.

Provider dipilih dengan `STORAGE_PROVIDER`.

## Konsekuensi

Positif:
- Portabilitas storage tinggi.
- Modul `document` tidak tahu detail SDK provider.
- Local development lebih mudah.
- URL file dapat selalu dibuat sementara/terkontrol.

Negatif:
- Perlu membuat adapter provider dan test kontrak.
- Beberapa fitur provider spesifik tidak boleh bocor ke business logic.

## Alternatif yang Ditolak

- **Supabase-only:** lebih cepat awalnya, tetapi vendor lock-in.
- **S3-only:** kuat untuk production, tetapi development lebih rumit.
- **Public URL permanen:** ditolak karena dokumen pegawai sensitif.
