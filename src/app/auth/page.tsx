'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInUser, signUpUser, getUserTeams, signInWithGoogle } from '@/lib/dataService';
import { LogIn, UserPlus, ArrowRight, Shield, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
    localStorage.setItem('timjuara_theme', newTheme);
    setIsDarkMode(!isDarkMode);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingGoogle(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(`Gagal login dengan Google: ${error}`);
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan login Google.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setErrorMsg('Nama lengkap harus diisi.');
          setLoading(false);
          return;
        }
        const { user, error, needsEmailConfirmation } = await signUpUser(
          fullName.trim(),
          email.trim(),
          password,
          phoneNumber.trim()
        );
        if (error) {
          setErrorMsg(error);
          setLoading(false);
          return;
        }
        if (user) {
          if (needsEmailConfirmation) {
            setSuccessMsg('Pendaftaran akun berhasil! Verifikasi email aktif di Supabase Anda: Silakan buka inbox email Anda untuk klik tautan konfirmasi, atau matikan opsi "Confirm email" di pengaturan Supabase (Auth -> Providers -> Email).');
            setIsRegister(false);
            setLoading(false);
            return;
          }
          router.push('/onboarding');
        }
      } else {
        const { user, error } = await signInUser(email.trim(), password);
        if (error) {
          setErrorMsg(error);
          setLoading(false);
          return;
        }
        if (user) {
          if (user.email?.toLowerCase() === 'admin@gmail.com') {
            router.push('/admin');
            return;
          }
          // Setelah login, arahkan pengguna ke halaman overview akun
          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="auth-page-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 20%, #e0e7ff 0%, #f8fafc 80%)' }}>
      {/* Mini Header */}
      <div className="auth-mini-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar-badge" style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}>
            TJ
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>TimJuara</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: 440, padding: 32 }}>
          {/* Header Card */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: 6 }}>
              {isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {isRegister 
                ? 'Daftar untuk mulai mengelola atau bergabung ke tim' 
                : 'Masuk ke dashboard tim kelompok / lomba Anda'}
            </p>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle || loading}
            className="btn btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '11px 16px',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: 20,
              border: '1px solid var(--surface-border)',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            {loadingGoogle ? 'Menghubungkan...' : isRegister ? 'Daftar dengan Google' : 'Masuk dengan Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 20px 0', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--surface-border)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              atau dengan email
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--surface-border)' }} />
          </div>

          {/* Tab Switcher */}
          <div className="auth-tab-switcher" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', padding: 4, borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(null); }}
              className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
              style={{
                padding: '8px 0',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: !isRegister ? (isDarkMode ? '#1e293b' : '#ffffff') : 'transparent',
                color: !isRegister ? (isDarkMode ? '#a5b4fc' : 'var(--primary)') : 'var(--text-muted)',
                boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <LogIn size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(null); }}
              className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
              style={{
                padding: '8px 0',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: isRegister ? (isDarkMode ? '#1e293b' : '#ffffff') : 'transparent',
                color: isRegister ? (isDarkMode ? '#a5b4fc' : 'var(--primary)') : 'var(--text-muted)',
                boxShadow: isRegister ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <UserPlus size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
              Daftar Akun
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--danger-light)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 18 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--success-light, #ecfdf5)', border: '1px solid var(--success-border, #a7f3d0)', borderRadius: 'var(--radius-md)', color: 'var(--success, #059669)', fontSize: '0.85rem', marginBottom: 18 }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Anda</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Nomor WhatsApp</label>
                    <span style={{ fontSize: '0.725rem', color: '#16a34a', fontWeight: 600 }}>Untuk Pengingat Deadline</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789 atau 628..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="form-input"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    💡 Notifikasi pengingat batas waktu tugas tim akan dikirim ke nomor ini.
                  </span>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Alamat Email</label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Kata Sandi</label>
                {!isRegister && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Minimal 6 karakter</span>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8, padding: '12px' }}
            >
              {loading ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk ke Dashboard'}
              <ArrowRight size={16} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
