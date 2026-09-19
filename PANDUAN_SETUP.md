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

### ⚠️ PENTING: Matikan Verifikasi Email & Buat Akun Master Admin

**1. Kenapa ada permintaan "Confirm your email address" saat daftar/login?**
Secara *default*, Supabase mengunci pendaftaran baru dan mewajibkan verifikasi lewat link email. Agar pengguna tim atau saat presentasi lomba bisa langsung daftar dan login tanpa ribet:
- Buka Dashboard Supabase -> Menu **Authentication** (di sidebar kiri) -> Klik **Providers**.
- Klik provider **Email**.
- Matikan toggle **"Confirm email"** (ubah menjadi **OFF** / abu-abu).
- Klik **Save** di bagian bawah.

**2. Kenapa tidak bisa login `admin@gmail.com` / `masteradmin` di Vercel?**
Karena akun `admin@gmail.com` belum ada di tabel autentikasi Supabase Anda (atau statusnya belum terkonfirmasi).
Untuk mengaktifkannya, pilih salah satu cara termudah berikut:
- **Cara 1 (Lewat Menu Users Supabase - Rekomendasi)**:
  1. Buka menu **Authentication** -> **Users**.
  2. Jika sudah ada `admin@gmail.com`, klik titik tiga di kanannya lalu **Delete user**.
  3. Klik tombol **Add user** (kanan atas) -> pilih **Create user**.
  4. Masukkan:
     - Email: `admin@gmail.com`
     - Password: `masteradmin`
     - Pastikan centang **"Auto Confirm User?"** tetap aktif (**ON**).
  5. Klik **Create user**.
- **Cara 2 (Lewat SQL Editor)**:
  Cukup jalankan query Bagian 9 pada file [`supabase-schema.sql`](./supabase-schema.sql) di menu SQL Editor Supabase.

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
- 📱 **Notifikasi Pengingat WhatsApp Otomatis (100% Gratis via Fonnte & Vercel Cron)**:
  - Mengirim pesan WhatsApp ke nomor HP anggota saat tugas mendekati deadline (H-1, Hari H, dan tugas yang terlewat).
  - Terjadwal otomatis setiap hari jam **08:00 WIB** via Vercel Cron (`0 1 * * *` UTC).
  - Tombol **"Rekap ke WA"** untuk membagikan daftar tugas & deadline langsung ke grup WhatsApp tim.
  - Tombol **"Ingatkan WA"** pada setiap kartu tugas untuk menyapa PIC secara instan.
- 🛡️ **Panel Master Admin (`/admin`)**:
  - **Email**: `admin@gmail.com`
  - **Password**: `masteradmin`
  - Otoritas khusus untuk memantau ringkasan statistik seluruh pengguna/tim, serta menghapus tim atau akun anggota yang menyalahi aturan langsung dari dashboard admin.

---

## Panduan Khusus: Mengaktifkan Bot WhatsApp Pengingat Deadline (100% Gratis)

Fitur notifikasi WhatsApp TimJuara menggunakan **Fonnte Gateway** (Free Tier: 1.000 pesan per bulan tanpa biaya dan tanpa kartu kredit) yang diotomatisasi dengan **Vercel Cron**.

### Langkah 1: Jalankan Migrasi SQL di Supabase
Jika Anda sudah memiliki database Supabase yang berjalan sebelumnya:
1. Buka Supabase -> **SQL Editor** -> **New Query**.
2. Jalankan perintah SQL berikut:
   ```sql
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_gateway_token TEXT DEFAULT '';
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_notifications_enabled BOOLEAN DEFAULT true;

   -- Update trigger agar otomatis menyimpan nomor WhatsApp saat pendaftaran akun baru
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.profiles (id, full_name, avatar_url, phone_number)
     VALUES (
       new.id,
       COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
       COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
       COALESCE(new.raw_user_meta_data->>'phone_number', '')
     )
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       phone_number = CASE WHEN EXCLUDED.phone_number <> '' THEN EXCLUDED.phone_number ELSE public.profiles.phone_number END;
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```
3. Klik **Run**. Kolom nomor WhatsApp profil, token tim, dan trigger pendaftaran kini aktif!

### Langkah 2: Dapatkan Token Fonnte Gratis (1 Menit)
1. Buka [https://fonnte.com](https://fonnte.com) dan buat akun baru.
2. Di dashboard Fonnte, masuk ke menu **Device** -> klik **Tambah Device** / buka device yang ada.
3. Klik **Scan QR Code** lalu buka aplikasi WhatsApp di ponsel Anda (menu *Perangkat Tertaut* / *Linked Devices*, persis seperti membuka WhatsApp Web).
4. Salin **Device Token** yang tertera di Fonnte.

### Langkah 3: Masukkan Token ke Workspace TimJuara
1. Buka halaman workspace tim Anda di TimJuara sebagai **Ketua Tim**.
2. Masuk ke **Tab Pengaturan & Profil**.
3. Pada kartu **"Bot Pengingat WhatsApp Otomatis"**, tempelkan Device Token dari Fonnte.
4. Pastikan centang *"Aktifkan pengingat deadline otomatis harian"* tercentang, lalu klik **Simpan Pengaturan Bot WA**.

### Langkah 4: Anggota Menyimpan Nomor WhatsApp
1. Setiap anggota tim (termasuk ketua) cukup membuka **Tab Pengaturan & Profil** -> pada bagian **Edit Profil Saya**, masukkan nomor WhatsApp di kolom **Nomor WhatsApp** (format: `08...` atau `628...`) lalu klik **Simpan Nomor WA**.
2. Anda dapat mengklik tombol **"📲 Tes Kirim WA"** untuk memastikan pesan terkirim ke WhatsApp Anda.

### Bagaimana Jadwal Otomatis Bekerja?
- File [`vercel.json`](./vercel.json) telah dikonfigurasi dengan Vercel Cron yang berjalan setiap hari pukul **01:00 UTC (08:00 WIB)** memanggil endpoint `/api/whatsapp/remind`.
- Bot akan memindai seluruh tugas yang berstatus belum selesai, dan secara otomatis mengirim pesan pengingat ke WhatsApp anggota yang memiliki tugas dengan deadline:
  - ⏳ **H-1** (Besok batas waktu)
  - 🚨 **Hari H** (Hari ini batas waktu)
  - ⚠️ **Terlewat** (Melewati batas waktu dan perlu segera diselesaikan)
- Ketua Tim juga bisa mengklik tombol **"📢 Kirim Pengingat Deadline Sekarang"** kapan saja untuk mengirim pengingat secara manual tanpa menunggu jam 8 pagi.


