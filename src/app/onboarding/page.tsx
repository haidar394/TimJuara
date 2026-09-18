'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getCurrentUser,
  getUserTeamsWithDetails,
  createTeam,
  joinTeam,
  signOutUser,
} from '@/lib/dataService';
import { Profile, UserTeamItem } from '@/lib/types';
import {
  PlusCircle,
  UserPlus,
  Users,
  ArrowRight,
  LogOut,
  Sparkles,
  AlertCircle,
  Crown,
  Search,
  CheckCircle2,
  ArrowLeft,
  LayoutGrid,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'select' (pilih tim), 'create' (buat tim baru), 'join' (gabung tim)
  const [viewMode, setViewMode] = useState<'select' | 'create' | 'join'>('select');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Team Fields
  const [teamName, setTeamName] = useState('');
  const [teamUsername, setTeamUsername] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Join Team Fields
  const [joinUsername, setJoinUsername] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);

      const teams = await getUserTeamsWithDetails(user.id);
      setUserTeams(teams);

      // Check query params
      const joinParam = searchParams.get('join');
      const tabParam = searchParams.get('tab');

      if (joinParam) {
        setJoinUsername(joinParam);
        setViewMode('join');
      } else if (tabParam === 'create') {
        setViewMode('create');
      } else if (teams.length === 0) {
        setViewMode('create');
      } else {
        setViewMode('select');
      }

      setLoading(false);
    }
    loadData();
  }, [router, searchParams]);

  // Otomatis generate username tim saat nama tim diketik
  const handleNameChange = (val: string) => {
    setTeamName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    setTeamUsername(slug ? `${slug}-${Math.floor(100 + Math.random() * 900)}` : '');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);
    setSubmitting(true);

    if (!teamName.trim() || !teamUsername.trim()) {
      setErrorMsg('Nama tim dan username tim wajib diisi.');
      setSubmitting(false);
      return;
    }

    const { team, error } = await createTeam(
      teamName.trim(),
      teamUsername.trim(),
      teamDesc.trim(),
      currentUser.id
    );
    if (error) {
      setErrorMsg(error);
      setSubmitting(false);
      return;
    }

    if (team) {
      router.push(`/team/${team.username}`);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);
    setSubmitting(true);

    if (!joinUsername.trim()) {
      setErrorMsg('Masukkan username tim yang ingin Anda ikuti.');
      setSubmitting(false);
      return;
    }

    const { team, error } = await joinTeam(joinUsername.trim(), currentUser.id);
    if (error) {
      setErrorMsg(error);
      setSubmitting(false);
      return;
    }

    if (team) {
      router.push(`/team/${team.username}`);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    router.replace('/auth');
  };

  // Filtered teams for search
  const filteredTeams = userTeams.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      t.name.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memuat daftar tim Anda...</p>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 10%, #eef2ff 0%, #f8fafc 60%)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', padding: '16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar-badge" style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
              TJ
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>TimJuara</h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Pilih & Kelola Workspace Tim</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {currentUser?.email?.toLowerCase() === 'admin@gmail.com' && (
              <Link
                href="/admin"
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
              >
                <Crown size={14} color="#fff" /> Panel Master Admin
              </Link>
            )}
            <div style={{ textAlign: 'right' }} className="hide-mobile">
              <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{currentUser?.full_name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{currentUser?.email || 'Akun Aktif'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Keluar akun"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '36px 0 60px' }}>
        <div className="container" style={{ maxWidth: viewMode === 'select' ? 1040 : 760 }}>
          
          {/* ========================================================================= */}
          {/* VIEW 1: PILIH TIM (TEAM SELECTOR - FRONT & CENTER)                        */}
          {/* ========================================================================= */}
          {viewMode === 'select' && (
            <div>
              {/* Hero Banner */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e0e7ff', color: '#4338ca', padding: '4px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>
                  <Sparkles size={14} /> Workspace Kolaborasi
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Pilih Tim yang Ingin Anda Akses
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: 580, margin: '0 auto' }}>
                  Selamat datang kembali, <strong>{currentUser?.full_name?.split(' ')[0]}</strong>! Pilih salah satu ruang kerja tim Anda di bawah ini untuk mulai berkolaborasi.
                </p>
              </div>

              {/* Action Bar (Search & Create/Join Buttons) */}
              <div
                className="card"
                style={{
                  padding: '16px 20px',
                  marginBottom: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 420 }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama tim atau @username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 40, height: 40, fontSize: '0.875rem' }}
                  />
                </div>

                {/* Create & Join Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => { setViewMode('create'); setErrorMsg(null); }}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <PlusCircle size={15} /> Buat Tim Baru
                  </button>
                  <button
                    onClick={() => { setViewMode('join'); setErrorMsg(null); }}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                  >
                    <UserPlus size={15} /> Gabung Tim Lain
                  </button>
                </div>
              </div>

              {/* Grid of Teams */}
              {filteredTeams.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <LayoutGrid size={44} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                    Tidak ada tim yang cocok
                  </h4>
                  <p style={{ fontSize: '0.875rem', marginBottom: 18 }}>
                    {searchQuery ? `Tidak ada hasil pencarian untuk "${searchQuery}".` : 'Anda belum bergabung ke tim manapun.'}
                  </p>
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery('')} className="btn btn-secondary btn-sm">
                      Reset Pencarian
                    </button>
                  ) : (
                    <button onClick={() => setViewMode('create')} className="btn btn-primary btn-sm">
                      <PlusCircle size={15} /> Buat Tim Baru Sekarang
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
                  {filteredTeams.map((t) => {
                    const isLeader = t.user_role === 'ketua';
                    return (
                      <div
                        key={t.id}
                        onClick={() => router.push(`/team/${t.username}`)}
                        className="card"
                        style={{
                          cursor: 'pointer',
                          padding: 24,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(79, 70, 229, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'var(--surface-border)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                      >
                        {/* Top Row: Avatar + Title + Role */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                            <div
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 12,
                                background: isLeader
                                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                                  : 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1rem',
                                boxShadow: isLeader
                                  ? '0 4px 12px rgba(245, 158, 11, 0.25)'
                                  : '0 4px 12px rgba(79, 70, 229, 0.25)',
                                flexShrink: 0,
                              }}
                            >
                              {t.name.slice(0, 2).toUpperCase()}
                            </div>

                            {/* Role Badge */}
                            {isLeader ? (
                              <span
                                style={{
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  padding: '4px 10px',
                                  borderRadius: 99,
                                  fontSize: '0.725rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                👑 Ketua Tim
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  padding: '4px 10px',
                                  borderRadius: 99,
                                  fontSize: '0.725rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                👤 Anggota
                              </span>
                            )}
                          </div>

                          {/* Team Name & Username */}
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1.3 }}>
                            {t.name}
                          </h3>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              background: '#eef2ff',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontWeight: 700,
                              display: 'inline-block',
                              marginBottom: 12,
                            }}
                          >
                            @{t.username}
                          </span>

                          {/* Description */}
                          <p
                            style={{
                              fontSize: '0.825rem',
                              color: 'var(--text-muted)',
                              lineHeight: 1.5,
                              margin: '0 0 16px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '2.5em',
                            }}
                          >
                            {t.description || 'Ruang kerja tim untuk manajemen tugas lomba dan kolaborasi.'}
                          </p>
                        </div>

                        {/* Bottom Row: Stats & Action */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }} title="Jumlah Anggota">
                              <Users size={12} /> {t.member_count}
                            </span>
                            <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }} title="Jumlah Tugas">
                              <CheckCircle2 size={12} /> {t.task_count}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Buka Workspace <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2 & 3: FORM BUAT TIM / GABUNG TIM                                    */}
          {/* ========================================================================= */}
          {(viewMode === 'create' || viewMode === 'join') && (
            <div>
              {/* Back button if user already has teams */}
              {userTeams.length > 0 && (
                <button
                  onClick={() => { setViewMode('select'); setErrorMsg(null); }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={14} /> Kembali ke Pilihan Tim ({userTeams.length})
                </button>
              )}

              {/* Welcome/Header Message */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
                  {viewMode === 'create' ? 'Buat Ruang Kerja Tim Baru' : 'Gabung ke Tim Rekan Anda'}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  {viewMode === 'create'
                    ? 'Mulai ruang kerja baru sebagai Ketua dan undang anggota kelompok Anda.'
                    : 'Masukkan username tim unik yang dibagikan oleh ketua atau rekan tim Anda.'}
                </p>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div
                  onClick={() => { setViewMode('create'); setErrorMsg(null); }}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderColor: viewMode === 'create' ? 'var(--primary)' : 'var(--surface-border)',
                    background: viewMode === 'create' ? 'var(--primary-light)' : 'var(--surface)',
                    boxShadow: viewMode === 'create' ? '0 4px 14px var(--primary-glow)' : 'var(--shadow-sm)',
                    textAlign: 'center',
                    padding: '20px 16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: viewMode === 'create' ? 'var(--primary)' : '#e2e8f0',
                      color: viewMode === 'create' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}
                  >
                    <PlusCircle size={22} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: viewMode === 'create' ? 'var(--primary)' : 'var(--text-main)', marginBottom: 2 }}>
                    Buat Tim Baru
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Anda sebagai <b>Ketua</b>
                  </p>
                </div>

                <div
                  onClick={() => { setViewMode('join'); setErrorMsg(null); }}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    borderColor: viewMode === 'join' ? 'var(--primary)' : 'var(--surface-border)',
                    background: viewMode === 'join' ? 'var(--primary-light)' : 'var(--surface)',
                    boxShadow: viewMode === 'join' ? '0 4px 14px var(--primary-glow)' : 'var(--shadow-sm)',
                    textAlign: 'center',
                    padding: '20px 16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: viewMode === 'join' ? 'var(--primary)' : '#e2e8f0',
                      color: viewMode === 'join' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}
                  >
                    <UserPlus size={22} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: viewMode === 'join' ? 'var(--primary)' : 'var(--text-main)', marginBottom: 2 }}>
                    Gabung ke Tim
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Masukkan kode tim rekan
                  </p>
                </div>
              </div>

              {/* Form Card */}
              <div className="card" style={{ padding: 32, marginBottom: 28 }}>
                {errorMsg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--danger-light)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 20 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {viewMode === 'create' ? (
                  <form onSubmit={handleCreateTeam}>
                    <div className="form-group">
                      <label className="form-label">Nama Tim Lomba / Kelompok</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Tim Inovasi Robotik 2026"
                        value={teamName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="form-input"
                      />
                      <span className="form-hint">Nama tim resmi yang akan tampil di header ruang kerja.</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Username Tim (Kode Unik untuk Bergabung)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>@</span>
                        <input
                          type="text"
                          required
                          placeholder="contoh: tim-inovasi-2026"
                          value={teamUsername}
                          onChange={(e) => setTeamUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                          className="form-input"
                        />
                      </div>
                      <span className="form-hint">Rekan tim Anda akan menggunakan kode ini untuk bergabung. Otomatis dibuat, bisa disesuaikan.</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Deskripsi / Target Tim (Opsional)</label>
                      <textarea
                        rows={3}
                        placeholder="Contoh: Fokus membuat inovasi sistem pintar untuk Lomba Karya Tulis Ilmiah Nasional..."
                        value={teamDesc}
                        onChange={(e) => setTeamDesc(e.target.value)}
                        className="form-textarea"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      {submitting ? 'Membuat Tim...' : 'Buat Tim Sekarang 👑'}
                      <ArrowRight size={18} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleJoinTeam}>
                    <div className="form-group">
                      <label className="form-label">Username Tim Rekan Anda</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: garuda-2026 atau tim-inovasi-123"
                        value={joinUsername}
                        onChange={(e) => setJoinUsername(e.target.value.trim().toLowerCase())}
                        className="form-input"
                      />
                      <span className="form-hint">Tanyakan username tim kepada ketua atau rekan satu kelompok Anda.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                    >
                      {submitting ? 'Mencari Tim...' : 'Gabung ke Tim 👤'}
                      <ArrowRight size={18} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memuat TimJuara...</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
