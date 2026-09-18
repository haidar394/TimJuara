# 🏆 TimJuara - Platform Kolaborasi Tim Lomba & Kerja Kelompok

> **TimJuara** adalah platform web modern yang dirancang khusus untuk mahasiswa, pelajar, dan tim kompetisi/hackathon agar dapat berkolaborasi secara rapi, transparan, dan bebas dari drama "beban kelompok".

---

## 🌟 Latar Belakang & Solusi
Seringkali kerja kelompok atau tim lomba menghadapi kendala klasik:
- Pembagian tugas yang tidak jelas dan lupa deadline.
- File materi riset atau Google Drive tercecer di grup chat.
- Ada anggota yang tidak bekerja (*free rider*), tapi tidak ada catatan objektif mengenai siapa yang benar-benar berkontribusi.

**TimJuara hadir untuk menyelesaikan masalah tersebut** dengan menyediakan ruang kerja (*workspace*) terpadu yang memadukan manajemen tugas, repositori materi, sistem *review* ketua, serta papan peringkat kontribusi anggota yang otomatis dan transparan.

---

## ✨ Fitur-Fitur Utama

### 1. 📋 Manajemen Tugas & Papan Kerja
- Pembagian tugas dengan rincian deskripsi, penanggung jawab (*assignee*), dan tanggal *deadline*.
- **Tautan Hasil Tugas (`task_link`)**: Anggota dapat menyematkan tautan langsung ke Google Docs, Google Drive, Slide, atau Figma pengerjaan mereka.
- **Filter & Kategori Status**: `Belum Dikerjakan`, `Sedang Dikerjakan`, `Menunggu Review`, dan `Selesai`.
- Fitur pencarian, edit tugas, dan hapus tugas secara instan.

### 2. 🔍 Alur Persetujuan Tugas oleh Ketua (Review Workflow)
- **Ajukan Dicek Ketua**: Ketika anggota selesai mengerjakan tugas, tugas diajukan terlebih dahulu ke Ketua Tim lengkap dengan tautan berkas dan catatan ringkas.
- **Otoritas Ketua (👑)**:
  - **✅ Setujui Selesai**: Tugas dinyatakan resmi selesai, kontribusi anggota bertambah, dan dirayakan dengan efek *Confetti*.
  - **↩️ Minta Revisi**: Ketua dapat memberikan catatan revisi jika hasil tugas perlu disempurnakan. Status tugas otomatis kembali ke pengerjaan.

### 3. 🏆 Leaderboard Kontribusi Realtime
- Papan peringkat objektif yang menghitung persentase kontribusi kerja setiap anggota tim.
- Statistik transparan menampilkan jumlah tugas selesai, tugas sedang dikerjakan, dan tugas yang menunggu *review*.

### 4. 📁 Manajemen Materi Riset & Dokumen
- Simpan tautan Google Drive, Google Docs, spreadsheet, slide presentasi, dan Figma tim dalam satu tempat terpusat.
- Tautan materi dapat langsung dibuka di tab baru dengan satu klik tanpa membebani kuota penyimpanan server.

### 5. 👥 Pemilihan Ruang Kerja Multi-Tim (Team Selector)
- Satu akun pengguna dapat membuat atau mengikuti banyak tim sekaligus.
- Setelah login, pengguna disambut oleh halaman **"Pilih Tim yang Ingin Anda Akses"** dengan kartu informasi status tim.
- Bergabung ke tim rekan sangat mudah hanya dengan memasukkan kode unik `@username-tim`.

### 6. 👤 Pengaturan Profil Akun Mandiri
- Tab pengaturan independen untuk:
  - Mengubah **Nama Lengkap**
  - Mengubah **Alamat Email**
  - Mengubah **Kata Sandi (Password)**

### 7. 🛡️ Panel Master Admin (`/admin`)
- Akses khusus superuser (`admin@gmail.com`) untuk mengelola seluruh data platform.
- Statistik agregat: Total Pengguna, Total Tim Aktif, Total Tugas, dan Total Materi Riset.
- **Kelola & Hapus Tim / Pengguna**: Dilengkapi modal konfirmasi modern dan perlindungan akun admin.
- **Opsi Pilih Banyak (Bulk Delete)**: Fitur centang massal untuk menghapus banyak tim atau pengguna sekaligus dengan aman.

---

## 🛠️ Teknologi yang Digunakan

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS Kustom (Desain modern, glassmorphism, responsive mobile-friendly)
- **Database & Autentikasi**: [Supabase](https://supabase.com/) (PostgreSQL & Row Level Security)
- **Offline / Standalone Fallback**: LocalStorage Mock Database (otomatis aktif jika Supabase belum dikonfigurasi)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Efek Visual**: Canvas Confetti

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat
Pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (versi 18.18 atau lebih baru)
- Git

### 2. Kloning Repository
```bash
git clone https://github.com/haidar394/TimJuara.git
cd TimJuara
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi Lingkungan (Opsional untuk Supabase)
Salin berkas template environment:
```bash
cp .env.example .env.local
```
Jika ingin menghubungkan ke database Supabase Anda sendiri:
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Salin isi skrip SQL dari file [`supabase-schema.sql`](./supabase-schema.sql) ke menu **SQL Editor** di Supabase, lalu jalankan (*Run*).
3. Masukkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` ke dalam berkas `.env.local`.

> **Catatan**: Jika `.env.local` tidak diisi, TimJuara akan otomatis berjalan dalam **Mode Demo (LocalStorage)** sehingga Anda tetap bisa mencoba seluruh fitur tanpa konfigurasi database tambahan.

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban (*browser*) Anda di **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Akun & Kredensial Bawaan

| Tipe Akun | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `admin@gmail.com` | `masteradmin` | Memiliki akses ke Panel Master Admin (`/admin`) |
| **Ketua Tim (Demo)** | `budi@timku.com` | `password123` | Ketua tim default *Garuda Hackathon 2026* |
| **Anggota (Demo)** | `siti@timku.com` | `password123` | Anggota tim default |
| **Anggota (Demo)** | `dimas@timku.com` | `password123` | Anggota tim default |

*Anda juga dapat mendaftar akun baru kapan saja melalui halaman Register.*

---

## 📁 Struktur Direktori Proyek

```text
TimJuara/
├── src/
│   ├── app/
│   │   ├── admin/           # Halaman Panel Master Admin
│   │   ├── auth/            # Halaman Login & Registrasi
│   │   ├── onboarding/      # Halaman Pemilihan & Pembuatan Tim
│   │   ├── team/[username]/ # Halaman Ruang Kerja (Workspace) Tim
│   │   ├── globals.css      # Design system & styling global
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page beranda
│   ├── components/
│   │   ├── AdminDashboard.tsx # Komponen lengkap Panel Master Admin
│   │   └── TeamWorkspace.tsx  # Komponen ruang kerja tim & manajemen tugas
│   └── lib/
│       ├── dataService.ts   # Layer abstraction data (Supabase & LocalStorage)
│       ├── supabase.ts      # Inisialisasi client Supabase
│       └── types.ts         # TypeScript interfaces & types
├── supabase-schema.sql      # Skema database & tabel Supabase PostgreSQL
├── PANDUAN_SETUP.md         # Panduan komprehensif setup database Supabase
├── .env.example             # Contoh format variabel lingkungan
└── README.md                # Dokumentasi utama proyek
```

---

## 📄 Lisensi
Proyek ini dibuat untuk keperluan kolaborasi tim dan didistribusikan di bawah lisensi MIT.
