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
    Event(["⚡ Peristiwa Sistem<br/>(Tugas Baru / Pengajuan / Revisi / Selesai)"]) --> Router{"Penerima Notifikasi"}
    
    Router --> InApp["🔔 In-App Notification Engine<br/>• Tersimpan di Database<br/>• Badge Lonceng Merah<br/>• Audio / Toast Visual"]
    Router --> WAGateway["📲 WhatsApp Gateway Engine<br/>• API Fonnte<br/>• Format Pesan Rapi (Bold, Emojis, Link)<br/>• Dikirim ke No HP Pengguna"]

    InApp --> UserInApp["👤 Terbaca di Web TimJuara"]
    WAGateway --> UserWA["📱 Notifikasi Muncul di Layar HP"]
```

---

## 4. Matriks Peran & Tanggung Jawab

| Komponen / Fitur | Anggota Tim (PIC) | Ketua Tim (Leader) | Master Admin |
| :--- | :---: | :---: | :---: |
| **Buat Tim Baru** | ✔️ *(otomatis jadi Ketua)* | ✔️ *(otomatis jadi Ketua)* | ✔️ |
| **Buat / Edit Tugas** | ❌ *(atau izin khusus)* | ✔️ | ✔️ |
| **Mulai Pengerjaan Tugas** | ✔️ *(tombol Mulai)* | ✔️ | ✔️ |
| **Ajukan Dicek Ketua** | ✔️ *(lampirkan link & catatan)* | ❌ *(Ketua langsung periksa)* | ❌ |
| **Minta Revisi Tugas** | ❌ | ✔️ *(wajib isi catatan revisi)* | ✔️ |
| **Tandai Selesai Resmi** | ❌ | ✔️ *(setelah verifikasi)* | ✔️ |
| **Diskusi / Komentar Tugas** | ✔️ | ✔️ | ✔️ |
| **Kelola Role Anggota** | ❌ | ✔️ *(ubah role / kick)* | ✔️ |
| **Konfigurasi WhatsApp Token** | ❌ | ✔️ | ✔️ |
| **Manajemen Pengguna Global** | ❌ | ❌ | ✔️ *(/admin)* |
| **Reset Password Pengguna** | ❌ | ❌ | ✔️ *(/admin)* |

---

## 5. Rincian Alur per Halaman

### 1. Halaman Autentikasi (`/auth`)
- Pengguna mendaftar dengan **Nama Lengkap**, **Nomor WhatsApp**, **Email**, dan **Password**.
- Nomor WhatsApp terhubung langsung ke sistem pemberitahuan pengerjaan dan pengingat deadline.
- Mendukung mode terang (Light Mode) dan mode gelap (Dark Mode).

### 2. Halaman Onboarding (`/onboarding`)
- Menampilkan seluruh tim yang dimiliki atau diikuti pengguna.
- Tombol **"Buat Tim Baru"** untuk mendirikan workspace lomba/proyek baru.
- Tombol **"Gabung Tim"** menggunakan tautan undangan atau memasukkan username tim unik.

### 3. Halaman Workspace Tim (`/team/[username]`)
- **Papan Tugas**: Daftar tugas dengan filter status (`Semua`, `Belum Dimulai`, `Sedang Dikerjakan`, `Menunggu Review`, `Selesai`).
- **Modal Verifikasi & Review**: Sarana Ketua untuk memeriksa hasil kerja pengerja sebelum menyelesaikan tugas.
- **Kolom Diskusi Tugas**: Riwayat chat antar anggota per tugas dengan counter komentar real-time.
- **Bahan Riset**: Tempat menyimpan referensi dokumen, link Google Drive, Figma, atau spreadsheet tim.
- **Leaderboard**: Statistik jumlah kontribusi tugas yang telah diselesaikan masing-masing anggota.
- **Pengaturan Tim**: Mengelola anggota dan token gateway WhatsApp (Fonnte).

### 4. Dashboard Master Admin (`/admin`)
- Akses eksklusif untuk akun `admin@gmail.com`.
- Manajemen penuh seluruh pengguna: perbarui nama, nomor WA, email, reset password, atau hapus akun.
- Pemantauan keaktifan tim dan total tugas yang dikerjakan.
