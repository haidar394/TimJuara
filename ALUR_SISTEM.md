# 🧭 Alur Sistem & Flowchart TimJuara

Dokumentasi lengkap mengenai alur kerja, siklus hidup tugas, alur revisi, integrasi notifikasi WhatsApp, serta manajemen peran pada platform **TimJuara**.

---

## 1. Flowchart Alur Navigasi Pengguna (End-to-End System)

Diagram ini menggambarkan alur perjalanan pengguna mulai dari membuka platform, proses autentikasi, routing peran, hingga akses ke Workspace Tim atau Master Admin Dashboard.

```mermaid
flowchart TD
    %% Definisi Warna
    classDef startNode fill:#4f46e5,stroke:#4338ca,stroke-width:2px,color:#fff,font-weight:bold
    classDef authNode fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef decisionNode fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff,font-weight:bold
    classDef workspaceNode fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    classDef adminNode fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    classDef successNode fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff

    Start(["🌐 Pengunjung Buka TimJuara"]):::startNode --> CheckAuth{"Sudah Punya Akun / Login?"}:::decisionNode

    %% Jalur Autentikasi
    CheckAuth -- "Belum" --> PageAuth["🔐 Halaman /auth<br/>(Daftar Akun Baru / Masuk)"]:::authNode
    PageAuth --> VerifyUser["Validasi Kredensial"]:::authNode
    VerifyUser --> CheckRole{"Jenis Akun Pengguna?"}:::decisionNode

    CheckAuth -- "Sudah" --> CheckRole

    %% Percabangan Hak Akses
    CheckRole -- "Master Admin<br/>(admin@gmail.com)" --> PageAdmin["🛡️ Dashboard Master Admin (/admin)<br/>• Kelola Semua Pengguna<br/>• Monitoring Seluruh Tim<br/>• Reset Password & Maintenance"]:::adminNode
    
    CheckRole -- "Pengguna Biasa" --> PageOnboard["📋 Halaman /onboarding<br/>(Pusat Pemilihan & Pembuatan Tim)"]:::workspaceNode

    %% Opsi Pemilihan Tim
    PageOnboard --> OnboardAction{"Pilihan Pengguna"}:::decisionNode
    OnboardAction -- "Pilih Tim Aktif" --> GoWorkspace["🚀 Masuk ke Workspace Tim<br/>(/team/:username)"]:::successNode
    OnboardAction -- "Buat Tim Baru" --> CreateTeam["👑 Input Nama & Username Tim<br/>(Otomatis Menjadi Ketua)"]:::authNode
    OnboardAction -- "Gabung Tim Lain" --> JoinTeam["🤝 Masukkan Username/Kode Tim<br/>(Menjadi Anggota)"]:::authNode

    CreateTeam --> GoWorkspace
    JoinTeam --> GoWorkspace
```

---

## 2. Flowchart Siklus Hidup Tugas & Alur Revisi (Core Task Workflow)

Diagram ini mengilustrasikan alur kerja penugasan tugas dari awal pembuatan hingga selesai resmi, termasuk alur peninjauan (review) dan revisi oleh Ketua Tim.

```mermaid
flowchart TD
    %% Definisi Warna
    classDef ketuaNode fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff,font-weight:600
    classDef anggotaNode fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff,font-weight:600
    classDef revisiNode fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff,font-weight:600
    classDef selesaiNode fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff,font-weight:bold
    classDef notifNode fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    classDef gateNode fill:#334155,stroke:#1e293b,stroke-width:2px,color:#fff,font-weight:bold

    subgraph TAHAP_1 ["1️⃣ Penugasan & Pengerjaan"]
        T1["👑 Ketua Buat Tugas Baru<br/>(Judul, Deadline, Pilih PIC)"]:::ketuaNode
        T1 -->|Notifikasi WA & In-App| N1["📱 Notifikasi Terkirim ke PIC"]:::notifNode
        N1 --> T2["👤 PIC Klik '▶ Mulai Kerjakan'"]:::anggotaNode
        T2 --> T3["Status: Sedang Dikerjakan<br/>(PIC dapat chat di Kolom Diskusi)"]:::anggotaNode
    end

    subgraph TAHAP_2 ["2️⃣ Pengajuan Hasil Kerja"]
        T3 --> T4["👤 PIC Klik 'Ajukan Dicek Ketua'<br/>• Lampirkan Link Drive / Docs / Figma<br/>• Tulis Catatan Ringkas Pengerjaan"]:::anggotaNode
        T4 -->|Notifikasi WA & In-App| N2["📱 Notifikasi Terkirim ke Ketua"]:::notifNode
        N2 --> T5["Status: Menunggu Review Ketua 🔍"]:::gateNode
    end

    subgraph TAHAP_3 ["3️⃣ Verifikasi Hasil oleh Ketua"]
        T5 --> T6["👑 Ketua Klik 'Tandai Selesai / Review'<br/>(Membuka Modal Verifikasi & Review)"]:::ketuaNode
        T6 --> T7["🔍 Ketua Buka Link Hasil Kerja & Cek Diskusi"]:::ketuaNode
        T7 --> Decision{"Hasil Kerja Sudah Oke?"}:::gateNode
    end

    subgraph TAHAP_4A ["4️⃣A Jalur Revisi (Belum Sesuai)"]
        Decision -- "❌ Belum Sesuai" --> R1["👑 Ketua Tulis Catatan Perbaikan<br/>& Klik 'Minta Revisi'"]:::revisiNode
        R1 --> R2["💬 Otomatis Tercatat di Diskusi:<br/>⚠️ [PERMINTAAN REVISI]"]:::revisiNode
        R2 -->|Notifikasi WA & In-App| N3["📱 Notifikasi Revisi Terkirim ke PIC"]:::notifNode
        N3 --> R3["Status: Sedang Dikerjakan<br/>Badge: ⚠️ Perlu Revisi<br/>Tombol PIC: 'Ajukan Ulang Hasil Revisi'"]:::revisiNode
        R3 -->|Perbaiki & Kirim Ulang| T4
    end

    subgraph TAHAP_4B ["4️⃣B Jalur Selesai (Sudah Oke)"]
        Decision -- "✅ Sudah Sesuai" --> S1["👑 Ketua Tulis Apresiasi (Opsional)<br/>& Klik 'Sudah Oke, Tandai Selesai'"]:::selesaiNode
        S1 --> S2["💬 Otomatis Tercatat di Diskusi:<br/>✅ [DISETUJUI SELESAI]"]:::selesaiNode
        S2 --> S3["🎉 Status Resmi: Selesai (Done)<br/>+ Efek Selebrasi Konfeti"]:::selesaiNode
        S3 -->|Notifikasi WA & In-App| N4["📱 Notifikasi Ucapan Selamat ke PIC"]:::notifNode
    end
```

---

## 3. Flowchart Integrasi Notifikasi Dual-Channel (In-App & WhatsApp)

Sistem memastikan setiap anggota tim selalu terbarui secara instan melalui dua jalur:

```mermaid
flowchart LR
    Event(["⚡ Peristiwa Sistem<br/>(Tugas Baru / Pengajuan / Revisi / Selesai / Deadline Jam 08:00)"]) --> Router{"Penerima Notifikasi"}
    
    Router --> InApp["🔔 In-App Notification Engine<br/>• Tersimpan di Supabase<br/>• Badge Lonceng Merah Navbar<br/>• Notifikasi Realtime untuk PIC & Ketua"]
    Router --> WAPersonal["📲 WhatsApp Jalur Personal<br/>• Fonnte API Gateway<br/>• Notifikasi PIC Tugas Baru & Revisi<br/>• Alert Deadline Personal"]
    Router --> WAGroup["👥 WhatsApp Jalur Grup Tim<br/>• Target: wa_group_id Tim Terkait<br/>• Pengumuman Tugas Baru<br/>• Perayaan Tugas Selesai<br/>• Rekap Deadline Harian Jam 08:00 WIB"]

    InApp --> UserInApp["👤 Terbaca di Web TimJuara (Ketua & Anggota)"]
    WAPersonal --> UserWA["📱 Notifikasi Personal di HP PIC"]
    WAGroup --> GroupChat["💬 Pesan Masuk di Grup WhatsApp Tim"]
```

---

## 4. Flowchart Otomasi Pengingat Deadline Jam 08:00 WIB & Notifikasi Ketua Tim

Platform TimJuara memiliki mekanisme proteksi ganda (*Dual-Layer Engine*) untuk memastikan pengingat deadline selalu terkirim setiap pagi pukul 08:00 WIB:

```mermaid
flowchart TD
    classDef cronNode fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef clientNode fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff
    classDef apiNode fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    classDef waNode fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    classDef leaderNode fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff

    StartCron(["⏰ 08:00 WIB (01:00 UTC)<br/>Vercel Cron Trigger"]):::cronNode --> APIEndpoint["🚀 Panggil /api/whatsapp/remind"]:::apiNode
    
    StartWeb(["🌐 Pengguna / Ketua Buka Web<br/>Setelah Pukul 08:00 WIB"]):::clientNode --> CheckDaily{"Apakah Pengingat Hari Ini<br/>Sudah Pernah Berjalan?"}:::clientNode
    CheckDaily -- "Belum" --> APIEndpoint
    CheckDaily -- "Sudah" --> Idle["✅ Sudah Selesai Hari Ini"]

    ManualBtn(["🔘 Ketua Klik 'Kirim Pengingat Sekarang'<br/>(Manual Trigger di Tab Overview)"]):::leaderNode --> APIEndpoint

    APIEndpoint --> ScanDB["🔍 Pindai Database Tugas<br/>• Tugas Status != 'done'<br/>• Deadline <= 2 Hari Lagi / Overdue"]:::apiNode
    
    ScanDB --> DispatchDecision{"Apakah Ditemukan Tugas Mendesak?"}:::apiNode
    DispatchDecision -- "Ada Tugas" --> SendPersonal["📱 Kirim WhatsApp ke Masing-Masing PIC<br/>(Detail Nama Tugas & Sisa Waktu)"]:::waNode
    DispatchDecision -- "Ada Tugas" --> SendGroup["👥 Kirim Rekap Harian ke Grup WA Tim<br/>(Top 5 Tugas Paling Mendesak)"]:::waNode

    SendPersonal --> NotifyLeader["👑 Buat Notifikasi Khusus Ketua Tim"]:::leaderNode
    SendGroup --> NotifyLeader
    DispatchDecision -- "Tidak Ada Tugas" --> LogDone["📝 Catat Status Eksekusi Selesai"]

    NotifyLeader --> InAppDB["💾 Simpan ke Tabel notifications<br/>(Untuk Seluruh Ketua Tim)"]:::leaderNode
    InAppDB --> UIUpdate["🖥️ Update Antarmuka Web Ketua:<br/>• Badge Lonceng Merah Bertambah<br/>• Pop-up Toast Konfirmasi Terkirim<br/>• Banner Status Jam 08:00 Berwarna Hijau"]:::leaderNode
```

---

## 5. Arsitektur 4 Fitur Cerdas Google Gemini AI

Platform dilengkapi kecerdasan buatan (*AI-Powered Workspace*) yang terhubung ke Google Gemini 2.0 / 1.5 Flash melalui `/api/ai` dengan *Smart Heuristic Fallback* (selalu berfungsi optimal meski tanpa API Key):

```mermaid
flowchart TD
    classDef aiCore fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#fff,font-weight:bold
    classDef userUI fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff
    classDef aiFeature fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff

    Workspace["💻 Workspace Tim TimJuara"]:::userUI --> AIEngine["⚡ Google Gemini AI API Hub<br/>(/api/ai)"]:::aiCore

    AIEngine --> F1["🤖 1. AI Daily Standup & Progress Digest<br/>(Kesehatan Tim, Ringkasan Eksekutif, Milestone)"]:::aiFeature
    AIEngine --> F2["⚠️ 2. AI Risk & Bottleneck Predictor<br/>(Deteksi Keterlambatan Dini & Hambatan Revisi)"]:::aiFeature
    AIEngine --> F3["🎯 3. Fokus Kamu Hari Ini<br/>(Tugas Paling Krusial PIC Saat Login)"]:::aiFeature
    AIEngine --> F4["⚡ 4. AI Task Breakdown & DoD<br/>(Pecah Tugas Otomatis + Kriteria Kelayakan)"]:::aiFeature

    F1 --> OverviewUI["📊 Tab Overview: Widget Cerdas Tim"]:::userUI
    F2 --> OverviewUI
    F3 --> PersonalUI["🎯 Tab Overview: Rekomendasi Tugas Personal"]:::userUI
    F4 --> TaskModal["📝 Tab Tugas: Modal Tambah Tugas Cerdas"]:::userUI
```

### Rincian 4 Fitur AI:
1. **🤖 AI Daily Standup & Progress Digest** *(Tab Overview)*:
   - Menganalisis seluruh riwayat pengerjaan, komentar diskusi, dan rasio penyelesaian tugas.
   - Memberikan badge kesehatan tim otomatis: `🟢 Sangat Sehat`, `🟡 Perlu Perhatian`, atau `🔴 Kritis`.
   - Menghasilkan ringkasan eksekutif instan untuk briefing pagi tim.
2. **⚠️ AI Risk & Bottleneck Predictor** *(Tab Overview)*:
   - Mendeteksi tugas yang berisiko terlambat (< 48 jam atau lewat deadline).
   - Menemukan tugas yang stagnan atau tertahan di status `Menunggu Review` / `Perlu Revisi`.
   - Memberikan rekomendasi tindakan preventif langsung kepada tim.
3. **🎯 Fokus Kamu Hari Ini** *(Personalized Next Action)*:
   - Terpersonalisasi otomatis berdasarkan akun anggota yang sedang login.
   - Mengarahkan perhatian anggota pada 1 tugas prioritas tertinggi (revisi mendesak > deadline hari ini > tugas aktif).
   - Tombol **"Kerjakan Sekarang ➔"** yang otomatis memindahkan fokus dan menyorot baris tugas terkait.
4. **⚡ AI Task Breakdown & Definition of Done** *(Modal Tambah Tugas)*:
   - **"✨ Pecah Tugas (AI)"**: Memecah judul tugas kompleks menjadi 3-4 subtask terstruktur beserta estimasi hari dan rekomendasi peran PIC (*Hacker / Developer*, *Hipster / Designer*, *Hustler / Writer*).
   - **"✨ Generate Kriteria DoD"**: Menghasilkan ceklis standar kelayakan (*Definition of Done*) otomatis di kolom deskripsi tugas.

---

## 6. Matriks Peran & Tanggung Jawab

| Komponen / Fitur | Anggota Tim (PIC) | Ketua Tim (Leader) | Master Admin |
| :--- | :---: | :---: | :---: |
| **Buat Tim Baru** | ✔️ *(otomatis jadi Ketua)* | ✔️ *(otomatis jadi Ketua)* | ✔️ |
| **Buat / Edit Tugas** | ❌ *(atau izin khusus)* | ✔️ | ✔️ |
| **Pecah Tugas Otomatis (AI Breakdown)** | ❌ | ✔️ | ✔️ |
| **Mulai Pengerjaan Tugas** | ✔️ *(tombol Mulai)* | ✔️ | ✔️ |
| **Ajukan Dicek Ketua** | ✔️ *(lampirkan link & catatan)* | ❌ *(Ketua langsung periksa)* | ❌ |
| **Minta Revisi Tugas** | ❌ | ✔️ *(wajib isi catatan revisi)* | ✔️ |
| **Tandai Selesai Resmi** | ❌ | ✔️ *(setelah verifikasi)* | ✔️ |
| **Diskusi / Komentar Tugas** | ✔️ | ✔️ | ✔️ |
| **Lihat Widget AI Overview & Fokus Personal** | ✔️ | ✔️ | ✔️ |
| **Trigger Pengingat Deadline Manual** | ❌ | ✔️ *(tombol di Overview)* | ✔️ |
| **Terima Notifikasi Otomasi Bot (Lonceng & Toast)** | ❌ | ✔️ | ✔️ |
| **Kelola Role Anggota** | ❌ | ✔️ *(ubah role / kick)* | ✔️ |
| **Konfigurasi WhatsApp Token & ID Grup** | ❌ | ✔️ | ✔️ |
| **Konfigurasi Google Gemini AI API Key** | ❌ | ❌ | ✔️ *(/admin)* |
| **Manajemen Pengguna Global** | ❌ | ❌ | ✔️ *(/admin)* |
| **Reset Password Pengguna** | ❌ | ❌ | ✔️ *(/admin)* |

---

## 7. Rincian Alur per Halaman

### 1. Halaman Autentikasi (`/auth`)
- Pengguna mendaftar dengan **Nama Lengkap**, **Nomor WhatsApp**, **Email**, dan **Password**.
- Nomor WhatsApp terhubung langsung ke sistem pemberitahuan pengerjaan dan pengingat deadline.
- Mendukung mode terang (Light Mode) dan mode gelap (Dark Mode).

### 2. Halaman Onboarding (`/onboarding`)
- Menampilkan seluruh tim yang dimiliki atau diikuti pengguna.
- Tombol **"Buat Tim Baru"** untuk mendirikan workspace lomba/proyek baru.
- Tombol **"Gabung Tim"** menggunakan tautan undangan atau memasukkan username tim unik.

### 3. Halaman Workspace Tim (`/team/[username]`)
- **Tab Overview**:
  * 4 Kartu Metrik Utama (Total Tugas, Dalam Proses, Menunggu Review, Selesai).
  * Banner Status Pengingat Deadline Jam 08:00 WIB + Tombol Manual Trigger untuk Ketua.
  * Kartu Cerdas **AI Daily Standup Digest & Risk Predictor**.
  * Kartu Interaktif **🎯 Fokus Kamu Hari Ini**.
- **Tab Papan Tugas**:
  * Daftar tugas dengan urutan prioritas dinamis (tugas selesai otomatis berada di posisi paling bawah).
  * Filter status (`Semua`, `Belum Dimulai`, `Sedang Dikerjakan`, `Menunggu Review`, `Selesai`).
  * Modal Tambah Tugas lengkap dengan fitur **✨ Pecah Tugas (AI)** dan **✨ Generate Kriteria DoD**.
- **Modal Verifikasi & Review**:
  * Sarana Ketua untuk memeriksa hasil kerja pengerja sebelum menyelesaikan tugas dengan opsi **Minta Revisi** atau **Tandai Selesai**.
- **Kolom Diskusi Tugas**: Riwayat chat antar anggota per tugas dengan counter komentar real-time.
- **Bahan Riset**: Tempat menyimpan referensi dokumen, link Google Drive, Figma, atau spreadsheet tim.
- **Leaderboard**: Statistik jumlah kontribusi tugas yang telah diselesaikan masing-masing anggota.
- **Pengaturan Tim**: Mengelola anggota tim, token gateway WhatsApp (Fonnte), dan pemilihan ID Grup WhatsApp tim.

### 4. Dashboard Master Admin (`/admin`)
- Akses eksklusif untuk akun `admin@gmail.com`.
- **Manajemen Pengguna**: Perbarui nama, nomor WA, email, reset password, atau hapus akun pengguna.
- **Pemantauan Tim & ID Grup WhatsApp**: Monitoring seluruh tim yang terdaftar dan opsi konfigurasi ID Grup WhatsApp per tim secara terpusat.
- **Konfigurasi Google Gemini AI**: Form input API Key Gemini, instruksi langkah-demi-langkah mendapatkan API Key gratis di Google AI Studio, dan fitur **"Tes Koneksi AI"**.

