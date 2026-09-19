'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/dataService';
import { Users, CheckCircle2, Trophy, FolderGit2, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Sync theme state on mount
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
    localStorage.setItem('timjuara_theme', newTheme);
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        if (user.email?.toLowerCase() === 'admin@gmail.com') {
          router.replace('/admin');
          return;
        }
        router.replace('/onboarding');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="avatar-badge" style={{ margin: '0 auto 16px', width: 48, height: 48, animation: 'pulseGlow 1.5s infinite' }}>
            TJ
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Memuat TimJuara...</p>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar Sederhana */}
      <header className="landing-header" style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar-badge" style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}>
              TJ
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                TimJuara
              </h1>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kolaborasi Tim Tanpa Beban</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/auth" className="btn btn-primary">
              Masuk / Daftar <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: 1180 }}>
          {/* Headline & Subtitle */}
          <div style={{ maxWidth: 780, margin: '0 auto 42px', textAlign: 'center' }}>
            <div className="badge badge-primary" style={{ marginBottom: 18, padding: '6px 14px', fontSize: '0.85rem' }}>
              <Sparkles size={15} /> Khusus Tim Lomba & Kerja Kelompok
            </div>

            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 20 }}>
              Atur Tugas, Pantau Deadline, & <span style={{ color: 'var(--primary)' }}>Raih Kemenangan Bersama</span>
            </h2>

            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
              Website simpel dan ramah pengguna baru untuk membagi tugas kelompok, mengumpulkan hasil riset Google Drive, dan menampilkan statistik kontribusi anggota secara transparan.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/auth" className="btn btn-primary btn-lg">
                Mulai Sekarang (Gratis) <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Feature Cards Grid (1 Baris Penuh) */}
          <div className="features-grid-1row">
            <div className="card" style={{ padding: 22 }}>
              <div className="feature-icon-box" style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <CheckCircle2 size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>Tugas & Deadline Jelas</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Bagi peran dengan mudah, lengkapi tanggal deadline, dan pantau status pengerjaan secara transparan.
              </p>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="feature-icon-box" style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Trophy size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>Leaderboard Kontribusi</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Statistik otomatis siapa yang paling rajin menyelesaikan tugas. Ucapkan selamat tinggal pada beban kelompok!
              </p>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="feature-icon-box" style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <FolderGit2 size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>Materi Riset Google Drive</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Simpan link Google Docs, Slide presentasi, dan Drive dalam 1 tempat tanpa memakan kuota server.
              </p>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <div className="feature-icon-box" style={{ width: 40, height: 40, borderRadius: 10, background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>Undang via Username Tim</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Cukup bagikan username tim Anda (misal: <code>garuda-2026</code>), rekan tim bisa langsung bergabung.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" style={{ borderTop: '1px solid var(--surface-border)', padding: '20px 0', background: 'var(--surface)' }}>
        <div className="container">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            © {new Date().getFullYear()} TimJuara
          </p>
        </div>
      </footer>
    </div>
  );
}
