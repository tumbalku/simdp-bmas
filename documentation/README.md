# SIMDP Documentation Site

Dokumentasi resmi SIMDP berbasis Docusaurus.

## Menjalankan lokal

```bash
npm install
npm run start
```

## Build

```bash
npm run build
```

## Deploy Vercel

Gunakan Vercel project terpisah dari app utama:

```txt
Root Directory : documentation
Install Command: npm install
Build Command  : npm run build
Output Directory: build
```

Default `baseUrl` adalah `/`, cocok untuk domain Vercel sendiri. Jika perlu subpath, isi `DOCS_BASE_URL`.

## Prinsip konten

- Dokumentasi operasional ditulis dalam Bahasa Indonesia.
- Secret asli tidak boleh masuk docs.
- Halaman ini adalah portal yang mudah dibaca; detail historis tetap berada di `../context/`.
- Jika behavior aplikasi berubah, update halaman Docusaurus dan source context terkait dalam PR yang sama.
