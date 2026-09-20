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

Fitur notifikasi WhatsApp TimJuara menggunakan **Fonnte Gateway** (Free Tier: 1.000 pesan per bulan tanpa biaya dan tanpa kartu kredit) yang dikelola terpusat oleh **Master Admin** dan diotomatisasi dengan **Vercel Cron**. Ketua Tim dan anggota tidak perlu repot mendaftar bot sendiri!

### Langkah 1: Jalankan Migrasi SQL di Supabase
Jika Anda sudah memiliki database Supabase yang berjalan sebelumnya:
1. Buka Supabase -> **SQL Editor** -> **New Query**.
2. Jalankan perintah SQL berikut:
   ```sql
   -- 1. Kolom nomor WhatsApp & Email pada profil, serta token tim
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_gateway_token TEXT DEFAULT '';
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_notifications_enabled BOOLEAN DEFAULT true;

   -- Sinkronkan email yang ada dari auth.users ke profiles
   UPDATE public.profiles p
   SET email = u.email
   FROM auth.users u
   WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

   -- 2. Update trigger agar otomatis menyimpan nomor WhatsApp & Email saat pendaftaran akun baru
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   BEGIN
     INSERT INTO public.profiles (id, full_name, avatar_url, phone_number, email)
     VALUES (
       new.id,
       COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
       COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
       COALESCE(new.raw_user_meta_data->>'phone_number', ''),
       COALESCE(new.email, '')
     )
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       email = EXCLUDED.email,
       phone_number = CASE WHEN EXCLUDED.phone_number <> '' THEN EXCLUDED.phone_number ELSE public.profiles.phone_number END;
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- 3. Tabel System Settings untuk Pengaturan Bot Terpusat oleh Master Admin
   CREATE TABLE IF NOT EXISTS public.system_settings (
       key TEXT PRIMARY KEY,
       value TEXT NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );
   ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Public read system settings" ON public.system_settings;
   CREATE POLICY "Public read system settings" ON public.system_settings FOR SELECT TO public USING (true);
   DROP POLICY IF EXISTS "Master admin manage system settings" ON public.system_settings;
   CREATE POLICY "Master admin manage system settings" ON public.system_settings FOR ALL TO authenticated
   USING ((auth.jwt() ->> 'email') = 'admin@gmail.com')
   WITH CHECK ((auth.jwt() ->> 'email') = 'admin@gmail.com');

   -- 4. Izin Master Admin untuk Mengelola Anggota Tim & Profil Pengguna (RLS)
   DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
   CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
   USING (auth.uid() = id OR (auth.jwt() ->> 'email') = 'admin@gmail.com');

   DROP POLICY IF EXISTS "Users can insert themselves to team" ON public.team_members;
   CREATE POLICY "Users can insert themselves to team" ON public.team_members FOR INSERT TO authenticated
   WITH CHECK (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'admin@gmail.com');

   DROP POLICY IF EXISTS "Team leader can update member role" ON public.team_members;
   CREATE POLICY "Team leader can update member role" ON public.team_members FOR UPDATE TO authenticated
   USING ((auth.jwt() ->> 'email') = 'admin@gmail.com' OR EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()));

   DROP POLICY IF EXISTS "Team leader can delete members or user can leave" ON public.team_members;
   CREATE POLICY "Team leader can delete members or user can leave" ON public.team_members FOR DELETE TO authenticated
   USING ((auth.jwt() ->> 'email') = 'admin@gmail.com' OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()));

   -- 5. Fungsi RPC Master Admin untuk Edit Data Pengguna (Nama, Email, No WA, Sandi)
   CREATE OR REPLACE FUNCTION public.admin_update_user(
     target_user_id UUID,
     new_full_name TEXT,
     new_email TEXT,
     new_phone TEXT,
     new_password TEXT DEFAULT NULL
   )
   RETURNS JSONB
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     caller_email TEXT;
   BEGIN
     caller_email := auth.jwt() ->> 'email';
     IF caller_email IS NULL OR lower(caller_email) <> 'admin@gmail.com' THEN
       RAISE EXCEPTION 'Akses ditolak: Hanya Master Admin yang dapat mengubah data pengguna.';
     END IF;

     UPDATE public.profiles
     SET
       full_name = COALESCE(NULLIF(new_full_name, ''), full_name),
       email = COALESCE(NULLIF(new_email, ''), email),
       phone_number = COALESCE(new_phone, phone_number)
     WHERE id = target_user_id;

     IF new_email IS NOT NULL AND trim(new_email) <> '' THEN
       UPDATE auth.users
       SET email = lower(trim(new_email)), updated_at = timezone('utc'::text, now())
       WHERE id = target_user_id;
     END IF;

     IF new_password IS NOT NULL AND trim(new_password) <> '' THEN
       UPDATE auth.users
       SET encrypted_password = extensions.crypt(trim(new_password), extensions.gen_salt('bf')), updated_at = timezone('utc'::text, now())
       WHERE id = target_user_id;
     END IF;

     RETURN jsonb_build_object('success', true);
   END;
   $$;

   -- 6. Fitur Multi-PIC, Diskusi Komentar Tugas, dan Notifikasi In-App
   ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to_ids TEXT[] DEFAULT '{}';

   CREATE TABLE IF NOT EXISTS public.task_comments (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
       user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );
   ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Task comments viewable by authenticated users" ON public.task_comments;
   CREATE POLICY "Task comments viewable by authenticated users" ON public.task_comments FOR SELECT TO authenticated USING (true);
   DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.task_comments;
   CREATE POLICY "Authenticated users can post comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
   DROP POLICY IF EXISTS "Users can delete their own comments or admin" ON public.task_comments;
   CREATE POLICY "Users can delete their own comments or admin" ON public.task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'admin@gmail.com');

   CREATE TABLE IF NOT EXISTS public.notifications (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
       team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
       title TEXT NOT NULL,
       message TEXT NOT NULL,
       link TEXT DEFAULT '',
       is_read BOOLEAN DEFAULT false,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
   );
   ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
   CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
   DROP POLICY IF EXISTS "System and users can insert notifications" ON public.notifications;
   CREATE POLICY "System and users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
   DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
   CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
   DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
   CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

   -- 7. Kolom Pengaturan WhatsApp Tim & Avatar Tim (Sinkronisasi Global Lintas Device)
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_group_id TEXT;
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_group_name TEXT;
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_gateway_token TEXT;
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_notifications_enabled BOOLEAN DEFAULT true;
   ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
   ```
3. Klik **Run**. Seluruh fitur manajemen pengguna, multi-PIC, komentar, & notifikasi kini aktif!

### Langkah 2: Dapatkan Token Fonnte Gratis (1 Menit)
1. Buka [https://fonnte.com](https://fonnte.com) dan buat akun baru gratis.
2. Di dashboard Fonnte, masuk ke menu **Device** -> klik **Tambah Device** / buka device yang ada.
3. Klik **Scan QR Code** lalu buka aplikasi WhatsApp di ponsel Anda (menu *Perangkat Tertaut* / *Linked Devices*, persis seperti membuka WhatsApp Web).
4. Salin **Device Token** yang tertera di Fonnte.

### Langkah 3: Masukkan Token di Panel Master Admin (`/admin`)
1. Buka aplikasi TimJuara dan login ke panel **Master Admin** di `/admin` (menggunakan akun `admin@gmail.com`).
2. Masuk ke tab **"🤖 Bot WhatsApp"**.
3. Tempelkan Device Token dari Fonnte pada kolom **"Fonnte Device Token"**.
4. Pastikan centang *"Aktifkan pengingat deadline otomatis harian"* tercentang, lalu klik **"Simpan Pengaturan Bot WA"**.
5. *(Opsional)* Anda dapat melakukan uji coba pengiriman pesan langsung melalui form **"Uji Coba Kirim Pesan WA Langsung"** di tab tersebut.

> **Catatan Keamanan**: Token bot disimpan terpusat dan hanya dapat dilihat maupun diubah oleh **Master Admin** (`admin@gmail.com`). Ketua tim biasa tidak memiliki akses mengubah token ini.

### Langkah 4: Anggota & Ketua Memasukkan Nomor WhatsApp
1. Setiap anggota tim (termasuk ketua) cukup membuka **Tab Pengaturan & Profil** di workspace tim masing-masing.
2. Pada bagian **Edit Profil Saya**, masukkan nomor WhatsApp di kolom **Nomor WhatsApp** (format: `08...` atau `628...`) lalu klik **Simpan Nomor WA**.
3. Anggota dapat mengklik tombol **"📲 Tes Kirim WA"** untuk memverifikasi bahwa nomor mereka sudah terhubung dengan bot platform.

### Bagaimana Jadwal Otomatis & Notifikasi Real-Time Bekerja?
- File [`vercel.json`](./vercel.json) telah dikonfigurasi dengan Vercel Cron yang berjalan setiap hari pukul **01:00 UTC (08:00 WIB)** memanggil endpoint `/api/whatsapp/remind`.
- Bot akan memindai seluruh tugas dari semua tim yang berstatus belum selesai, dan secara otomatis mengirim pesan pengingat ke WhatsApp anggota yang memiliki tugas dengan deadline:
  - ⏳ **H-1** (Besok batas waktu)
  - 🚨 **Hari H** (Hari ini batas waktu)
  - ⚠️ **Terlewat** (Melewati batas waktu dan perlu segera diselesaikan)
- **Notifikasi Real-Time**: Bot juga otomatis mengirim pesan ke WhatsApp anggota seketika saat ada **tugas baru ditugaskan**, saat ada **permintaan revisi tugas dari ketua**, dan saat anggota **mengajukan tugas untuk dicek**.
- Master Admin juga dapat mengklik tombol **"📢 Picu Kirim Notifikasi Pengingat ke Semua Tim Sekarang"** dari panel `/admin` kapan saja untuk pengujian manual.
