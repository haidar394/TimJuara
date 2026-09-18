# Panduan Setup Website Pengelola Tim Lomba & Kerja Kelompok

Aplikasi web ini menggunakan stack gratis dan mudah dipublikasikan:
- **Frontend**: Next.js (App Router)
- **Database & Autentikasi**: Supabase (Free Tier)
- **Deployment**: Vercel (Gratis)

---

## Langkah 1: Setup Akun & Database Supabase (Gratis)

1. Buka [https://supabase.com](https://supabase.com) dan daftar / login dengan akun GitHub atau Email Anda.
2. Klik tombol **"New Project"**.
3. Masukkan nama project (misal: `tim-lomba`), pilih kata sandi database, dan pilih region terdekat (misal: `Singapore (ap-southeast-1)`). Klik **"Create new project"**.
4. Tunggu sekitar 1-2 menit sampai project selesai disiapkan.
5. Buka menu **SQL Editor** di sidebar kiri Supabase.
6. Klik **"New Query"**, lalu salin seluruh isi file [`supabase-schema.sql`](./supabase-schema.sql) dan tempel ke editor.
7. Klik tombol **"Run"** di pojok kanan bawah editor untuk mengeksekusi skrip.
8. Buka menu **Project Settings** (ikon gerigi) -> pilih **API**.
9. Salin:
   - **Project URL** (misal: `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> `anon` `public` key

---

## Langkah 2: Setup Environment Variable Lokal

1. Duplikasi file `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Buka file `.env.local` dan masukkan kredensial yang tadi disalin dari Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

## Langkah 3: Menjalankan Aplikasi di Komputer Lokal

1. Buka terminal di folder project ini:
   ```bash
   npm install
   npm run dev
   ```
2. Buka browser di [http://localhost:3000](http://localhost:3000).

---

## Langkah 4: Publikasi Gratis ke Vercel

1. Unggah kode proyek Anda ke GitHub (bisa private maupun public repository).
2. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
3. Klik **"Add New..."** -> **"Project"**.
4. Pilih repository yang baru saja Anda buat di GitHub.
5. Pada bagian **"Environment Variables"**, tambahkan dua variabel yang sama seperti di `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Klik tombol **"Deploy"**.
7. Dalam 1-2 menit, website Anda sudah live dengan URL publik gratis (misal: `https://tim-kamu.vercel.app`)!

---

## Fitur Unggulan Website:
- 🚀 **Autentikasi Cepat**: Register & Login aman berbahasa Indonesia.
- 👥 **Alur Tim Super Mudah**: Buat tim dengan kode unik atau gabung menggunakan username tim teman.
- 📋 **Papan Tugas & Deadline**: Pantau status tugas dengan peringatan warna deadline.
- 🏆 **Statistik & Leaderboard**: Otomatis menghitung siapa yang paling banyak menyelesaikan tugas untuk transparansi kerja kelompok.
- 📁 **Materi & Hasil Riset (0 Kuota)**: Simpan dan buka tautan Google Drive, Google Docs, Slides, Sheets, dan Figma dengan 1 klik tanpa memakan kuota penyimpanan Supabase.
- 👑 **Manajemen Peran**: Ketua dapat mengatur peran anggota dan membagikan kode tim.
- 🛡️ **Panel Master Admin (`/admin`)**:
  - **Email**: `admin@gmail.com`
  - **Password**: `masteradmin`
  - Otoritas khusus untuk memantau ringkasan statistik seluruh pengguna/tim, serta menghapus tim atau akun anggota yang menyalahi aturan langsung dari dashboard admin.

