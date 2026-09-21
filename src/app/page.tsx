'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserTeams, isMasterAdmin } from '@/lib/dataService';
import {
  CheckCircle2,
  Trophy,
  FolderGit2,
  Sparkles,
  Sun,
  Moon,
  BellRing,
  Bot,
  Flame,
  Star,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setIsDarkMode(currentTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('timjuara_theme', newTheme);
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (user) {
          if (isMasterAdmin(user)) {
            router.replace('/admin');
            return;
          }
          const teams = await getUserTeams(user.id);
          if (teams && teams.length > 0) {
            router.replace(`/team/${teams[0].username}`);
          } else {
            router.replace('/onboarding');
          }
        }
      } catch {
        // Continue showing landing page if auth check fails or unauthenticated
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="nop-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Visual Paper Elements */}
      <div className="nop-spiral" aria-hidden="true" />
      <div className="nop-margin-line" aria-hidden="true" />

      {/* Topbar Nothing On Purpose Style */}
      <header
        style={{
          borderBottom: '2px solid #191712',
          background: 'rgba(251, 246, 230, 0.95)',
          backdropFilter: 'blur(6px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 72, paddingLeft: 'clamp(36px, 6vw, 84px)' }}>
          {/* Logo & Hand-Drawn Emblem */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#191712' }}>
            <div
              className="nop-hand-card"
              style={{
                width: 42,
                height: 42,
                background: '#ffdf59',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
              }}
            >
              TJ
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                TimJuara<span style={{ color: '#ef4444' }}>.</span>
              </div>
              <div className="font-typewriter" style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '0.04em' }}>
                BEBAS DRAMA KELOMPOK
              </div>
            </div>
          </Link>

          {/* Nav Items & Auth CTA */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="#problem" className="hide-mobile" style={{ color: '#191712', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>
              Masalah
            </a>
            <a href="#features" className="hide-mobile" style={{ color: '#191712', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>
              Fitur
            </a>
            <a href="#tiers" className="hide-mobile" style={{ color: '#191712', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>
              Paket Rp 0
            </a>

            <button
              onClick={toggleTheme}
              style={{
                background: '#ffffff',
                border: '1.5px solid #191712',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '2px 2px 0px #191712',
              }}
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#191712" />}
            </button>

            <Link href="/auth" className="nop-btn-black" style={{ padding: '8px 18px', fontSize: '1.05rem' }}>
              Masuk / Daftar →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main style={{ flex: 1, paddingLeft: 'clamp(28px, 6vw, 76px)', paddingRight: 'clamp(16px, 4vw, 48px)' }}>
        
        {/* ================= HERO SECTION ================= */}
        <section style={{ padding: '56px 0 72px' }}>
          <div className="container" style={{ maxWidth: 1160 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
              
              {/* Left Column: Headline & Value Proposition */}
              <div>
                <p className="font-typewriter" style={{ color: '#dc2626', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                  PRODUK #001 · TERSEDIA SELAMANYA
                </p>

                <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.2rem)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 22 }}>
                  Bagi <span className="nop-highlight">tugasnya.</span><br />
                  Pantau <span className="nop-underline">deadlinenya.</span>
                </h1>

                <p style={{ fontSize: '1.25rem', color: '#334155', lineHeight: 1.5, marginBottom: 30, maxWidth: 520 }}>
                  Aplikasi simpel dan ramah pengguna baru untuk membagi peran kelompok, memantau deadline otomatis via WhatsApp Bot, dan memastikan setiap anggota berkontribusi secara nyata, adil, dan teratur.
                </p>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
                  <Link href="/auth" className="nop-btn-black">
                    Mulai Sekarang (Gratis) →
                  </Link>
                  <Link href="/auth" className="nop-btn-pink">
                    Gabung Tim Teman 🤝
                  </Link>
                </div>

                {/* Trust Row Pills */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className="nop-trust-tag font-typewriter">
                    <Star size={13} fill="#ffdf59" color="#191712" /> 0 Drama Kelompok
                  </span>
                  <span className="nop-trust-tag font-typewriter">
                    <Flame size={13} color="#ef4444" /> 100% Bebas Biaya
                  </span>
                  <span className="nop-trust-tag font-typewriter">
                    <Bot size={13} color="#16a34a" /> Notifikasi Bot WA Jam 08:00
                  </span>
                  <span className="nop-trust-tag font-typewriter">
                    <Sparkles size={13} color="#8b5cf6" /> Tanpa Iklan
                  </span>
                </div>
              </div>

              {/* Right Column: Handcrafted Certificate Mockup */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
                  {/* Washi Tape Strip at top */}
                  <div className="nop-washi" />

                  {/* Certificate Card */}
                  <div
                    className="nop-hand-card"
                    style={{
                      padding: '24px 22px',
                      background: '#ffffff',
                      transform: 'rotate(1deg)',
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px dashed #cbd5e1', paddingBottom: 12, marginBottom: 16 }}>
                      <span className="font-typewriter" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                        TIMJUARA.COM / SERTIFIKAT KONTRIBUSI
                      </span>
                      <span className="font-typewriter" style={{ fontSize: '0.78rem', background: '#ffdf59', padding: '2px 8px', border: '1px solid #191712' }}>
                        TJ-0002026
                      </span>
                    </div>

                    {/* Certificate Body */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          border: '2px solid #191712',
                          borderRadius: '50%',
                          background: '#e0f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          flexShrink: 0,
                        }}
                      >
                        🧑‍💻
                      </div>
                      <div>
                        <div className="font-typewriter" style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
                          Sertifikat Diberikan Kepada:
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#191712' }}>
                          Nama Kamu Disini
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#16a34a', fontWeight: 600 }}>
                          Ketua Tim / Anggota Paling Rajin
                        </div>
                      </div>
                    </div>

                    {/* Certificate Meta Table */}
                    <div
                      className="font-typewriter"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        background: '#f8fafc',
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: '0.72rem',
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>BIAYA</span>
                        <strong>Rp 0 (GRATIS)</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>TERBIT</span>
                        <strong>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>DEADLINE</span>
                        <strong style={{ color: '#16a34a' }}>AMAN TERKENDALI</strong>
                      </div>
                    </div>

                    {/* Statement & Stamp */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.4, flex: 1 }}>
                        Terbukti menyelesaikan tugas tepat waktu, tidak pernah menghilang di H-1, dan siap membawa tim meraih gelar juara!
                      </p>

                      {/* Rubber Stamp */}
                      <div className="nop-stamp" style={{ flexShrink: 0 }}>
                        <span>KOLABORASI</span>
                        <span style={{ fontSize: '0.85rem' }}>SOLID</span>
                        <span>JUARA</span>
                      </div>
                    </div>

                    {/* MRZ Strip Typewriter */}
                    <div
                      className="font-typewriter"
                      style={{
                        marginTop: 18,
                        paddingTop: 12,
                        borderTop: '1.5px dashed #cbd5e1',
                        fontSize: '0.62rem',
                        color: '#94a3b8',
                        letterSpacing: '0.08em',
                        lineHeight: 1.35,
                      }}
                    >
                      TJD&lt;TIMJUARA&lt;SOLID&lt;JUARA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                      <br />
                      DEADLINE&lt;AMAN&lt;{new Date().getFullYear()}&lt;JUARA&lt;BERSAMA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                    </div>
                  </div>

                  {/* Caption underneath */}
                  <p className="font-typewriter" style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: 12 }}>
                    Tampilan sertifikat asli saat semua tugas tim Anda selesai tepat waktu.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= THE PROBLEM SECTION (3-PANEL COMIC) ================= */}
        <section id="problem" style={{ padding: '60px 0 72px' }}>
          <div className="container" style={{ maxWidth: 1040, textAlign: 'center' }}>
            <p className="font-typewriter" style={{ color: '#dc2626', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              THE CHALLENGE · TANTANGAN KOORDINASI TIM
            </p>

            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 700, marginBottom: 38 }}>
              Pernah merasa kerja kelompok <span className="nop-highlight">kurang terkoordinasi?</span>
            </h2>

            {/* 3 Comic Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 36 }}>
              {/* Panel 1 */}
              <div className="nop-hand-card" style={{ padding: '26px 20px', textAlign: 'left', background: '#ffffff' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>
                  :)
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 6 }}>
                  Tugas Baru Dibagi.
                </h3>
                <p style={{ margin: 0, fontSize: '1.05rem', color: '#64748b', lineHeight: 1.45 }}>
                  Semua anggota antusias di grup chat. Suasana sangat optimis untuk memulai proyek bersama.
                </p>
              </div>

              {/* Panel 2 */}
              <div className="nop-hand-card" style={{ padding: '26px 20px', textAlign: 'left', background: '#ffffff' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#d97706', marginBottom: 8 }}>
                  :/
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 6 }}>
                  Menjelang Deadline.
                </h3>
                <p style={{ margin: 0, fontSize: '1.05rem', color: '#64748b', lineHeight: 1.45 }}>
                  Koordinasi mulai terhambat, pembagian progres kurang jelas, dan tidak ada pengingat otomatis.
                </p>
              </div>

              {/* Panel 3 */}
              <div className="nop-hand-card" style={{ padding: '26px 20px', textAlign: 'left', background: '#ffffff' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>
                  :(
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 6 }}>
                  H-1 Pengumpulan.
                </h3>
                <p style={{ margin: 0, fontSize: '1.05rem', color: '#64748b', lineHeight: 1.45 }}>
                  Kerepotan merapikan tugas di jam-jam terakhir karena tidak ada pencatatan progres yang terpusat.
                </p>
              </div>
            </div>

            {/* Punchline & Pinned Pink Sticky Note */}
            <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>
                Maka dari itu, kami membuat TimJuara.
              </div>

              {/* Pink Sticky Note */}
              <div className="nop-sticky" style={{ maxWidth: 360, textAlign: 'center', marginTop: 12 }}>
                <div className="nop-sticky-tape" />
                <p style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.45 }}>
                  &ldquo;Biar pembagian tugas transparan, deadline diingatkan oleh bot WhatsApp, dan kontribusi tercatat nyata!&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SOCIAL PROOF / STATS ================= */}
        <section style={{ padding: '40px 0 60px', borderTop: '2px dashed rgba(25,23,18,0.2)', borderBottom: '2px dashed rgba(25,23,18,0.2)' }}>
          <div className="container" style={{ maxWidth: 960 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, textAlign: 'center' }}>
              <div>
                <div className="font-typewriter" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#191712' }}>
                  50+
                </div>
                <div className="font-typewriter" style={{ fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  TIM JUARA TERDAFTAR
                </div>
              </div>

              <div>
                <div className="font-typewriter" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#16a34a' }}>
                  150+
                </div>
                <div className="font-typewriter" style={{ fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  TUGAS SELESAI TEPAT WAKTU
                </div>
              </div>

              <div>
                <div className="font-typewriter" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#ef4444' }}>
                  0
                </div>
                <div className="font-typewriter" style={{ fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ALASAN LUPA DEADLINE
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES SECTION ("THE WALL") ================= */}
        <section id="features" style={{ padding: '72px 0 80px' }}>
          <div className="container" style={{ maxWidth: 1100 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p className="font-typewriter" style={{ color: '#dc2626', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                FITUR UTAMA · BEKERJA SECARA CERDAS
              </p>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 700 }}>
                Semua yang kamu butuhkan <span className="nop-highlight">dalam satu papan.</span>
              </h2>
            </div>

            {/* Feature Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
              
              {/* Feature 1 */}
              <div className="nop-hand-card" style={{ padding: '24px 20px', background: '#ffffff' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dcfce7', color: '#16a34a', border: '1.5px solid #191712', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <CheckCircle2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, color: '#191712' }}>
                  Tugas & Deadline Jelas
                </h3>
                <p style={{ margin: 0, fontSize: '1rem', color: '#475569', lineHeight: 1.5 }}>
                  Bagi peran dengan mudah, tentukan tenggat waktu, lengkapi dengan subtask AI, dan pantau status tanpa perlu tanya berulang kali.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="nop-hand-card" style={{ padding: '24px 20px', background: '#ffffff' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', color: '#d97706', border: '1.5px solid #191712', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <BellRing size={24} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, color: '#191712' }}>
                  Bot WhatsApp Jam 08:00
                </h3>
                <p style={{ margin: 0, fontSize: '1rem', color: '#475569', lineHeight: 1.5 }}>
                  Bot otomatis memindai deadline tugas setiap hari jam 08:00 WIB dan mengirim pengingat langsung ke nomor WhatsApp anggota.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="nop-hand-card" style={{ padding: '24px 20px', background: '#ffffff' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fee2e2', color: '#ef4444', border: '1.5px solid #191712', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Trophy size={24} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, color: '#191712' }}>
                  Leaderboard Kontribusi
                </h3>
                <p style={{ margin: 0, fontSize: '1rem', color: '#475569', lineHeight: 1.5 }}>
                  Statistik transparan siapa yang paling aktif dan berkontribusi. Menjadikan apresiasi kerja tim lebih objektif, adil, dan memotivasi.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="nop-hand-card" style={{ padding: '24px 20px', background: '#ffffff' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e0e7ff', color: '#4f46e5', border: '1.5px solid #191712', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <FolderGit2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, color: '#191712' }}>
                  Materi Riset & Link Drive
                </h3>
                <p style={{ margin: 0, fontSize: '1rem', color: '#475569', lineHeight: 1.5 }}>
                  Satukan link Google Drive, Docs laporan, Slide Canva, dan referensi riset dalam 1 ruang kerja tanpa memakan kuota server.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================= PRICING / TIERS (NOTHING ON PURPOSE COMIC STYLE) ================= */}
        <section id="tiers" style={{ padding: '60px 0 84px' }}>
          <div className="container" style={{ maxWidth: 1040, textAlign: 'center' }}>
            <p className="font-typewriter" style={{ color: '#dc2626', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              PAKET TIMJUARA · BIAYA UNTUK JUARA
            </p>

            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 700, marginBottom: 12 }}>
              Berapa biaya untuk <span className="nop-highlight">menang bersama?</span>
            </h2>
            <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: 42 }}>
              Semua opsi mendapatkan fitur yang sama persis: 100% lengkap dan bebas biaya selamanya.
            </p>

            {/* 3 Tier Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 24, marginBottom: 36 }}>
              
              {/* Tier 1 */}
              <div className="nop-hand-card" style={{ padding: '28px 24px', textAlign: 'left', background: '#ffffff' }}>
                <p className="font-typewriter" style={{ fontSize: '0.78rem', color: '#dc2626', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  PAKET MAHASISWA SANTAI
                </p>
                <div className="font-typewriter" style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: 8 }}>
                  Rp 0
                </div>
                <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.4, marginBottom: 16 }}>
                  Untuk tugas mingguan, presentasi kelas, dan laporan praktikum.
                </p>
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 14, fontSize: '0.95rem' }}>
                  Fitur: <strong>Bikin tim, tugas tak terbatas, link riset.</strong>
                </div>
              </div>

              {/* Tier 2 (Highlighted with sticker) */}
              <div className="nop-hand-card" style={{ padding: '28px 24px', textAlign: 'left', background: '#ffffff', position: 'relative' }}>
                {/* Yellow "Paling Pas" Sticker */}
                <div
                  className="font-typewriter"
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 18,
                    background: '#ffdf59',
                    border: '1.5px solid #191712',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    boxShadow: '2px 2px 0px #191712',
                    transform: 'rotate(2deg)',
                  }}
                >
                  PALING PAS
                </div>

                <p className="font-typewriter" style={{ fontSize: '0.78rem', color: '#dc2626', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  PAKET TIM LOMBA AMBIS
                </p>
                <div className="font-typewriter" style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: 8 }}>
                  Rp 0
                </div>
                <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.4, marginBottom: 16 }}>
                  Untuk tim lomba karya tulis, hackathon, debat, atau kompetisi bisnis.
                </p>
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 14, fontSize: '0.95rem' }}>
                  Fitur: <strong>Bot Notifikasi WhatsApp, AI Breakdown, Leaderboard.</strong>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="nop-hand-card" style={{ padding: '28px 24px', textAlign: 'left', background: '#ffffff' }}>
                <p className="font-typewriter" style={{ fontSize: '0.78rem', color: '#dc2626', textTransform: 'uppercase', margin: '0 0 10px' }}>
                  PAKET KOLABORASI SOLID & ADIL
                </p>
                <div className="font-typewriter" style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: 8 }}>
                  Rp 0
                </div>
                <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.4, marginBottom: 16 }}>
                  Untuk tim yang ingin setiap kontribusi tercatat jelas, adil, dan saling mendukung.
                </p>
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 14, fontSize: '0.95rem' }}>
                  Fitur: <strong>Statistik kontribusi transparan & evaluasi kerja tim.</strong>
                </div>
              </div>

            </div>

            {/* Fun Input Strip */}
            <div
              className="nop-hand-card"
              style={{
                padding: '16px 20px',
                background: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <span className="font-typewriter" style={{ fontSize: '0.9rem' }}>
                Mau bayar seikhlasnya?
              </span>
              <span className="font-typewriter" style={{ borderBottom: '2px solid #191712', padding: '2px 8px', fontSize: '1.1rem' }}>
                Rp 0
              </span>
              <Link href="/auth" className="nop-btn-black" style={{ padding: '6px 14px', fontSize: '0.95rem' }}>
                Langsung Pakai Saja →
              </Link>
            </div>
          </div>
        </section>

        {/* ================= FINAL CTA & FOOTER ================= */}
        <section style={{ padding: '60px 0 80px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 720 }}>
            {/* Doodle Mascot on top */}
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>
              🌱 🤝 🏆
            </div>

            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 700, marginBottom: 18 }}>
              Kamu ke sini buat <span className="nop-highlight">jadi juara.</span>
            </h2>

            <p style={{ fontSize: '1.25rem', color: '#475569', marginBottom: 32 }}>
              Mulai atur tim kamu sekarang dalam waktu kurang dari 60 detik. Tanpa download aplikasi tambahan.
            </p>

            <Link href="/auth" className="nop-btn-black" style={{ padding: '14px 32px', fontSize: '1.3rem' }}>
              Mulai Sekarang (Gratis) →
            </Link>
          </div>
        </section>

      </main>

      {/* Footer Nothing On Purpose Style */}
      <footer
        style={{
          borderTop: '2px solid #191712',
          background: 'rgba(251, 246, 230, 0.95)',
          padding: '24px 0',
          paddingLeft: 'clamp(36px, 6vw, 84px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div className="font-typewriter" style={{ fontSize: '0.85rem', color: '#475569' }}>
            © {new Date().getFullYear()} TimJuara · Dibuat untuk pejuang lomba & kerja kelompok.
          </div>

          <div className="font-typewriter" style={{ display: 'flex', gap: 16, fontSize: '0.85rem' }}>
            <Link href="/auth" style={{ color: '#191712', textDecoration: 'underline' }}>
              Masuk Akun
            </Link>
            <span style={{ color: '#94a3b8' }}>·</span>
            <a href="#problem" style={{ color: '#191712', textDecoration: 'underline' }}>
              Tentang TimJuara
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
