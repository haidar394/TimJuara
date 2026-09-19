'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getCurrentUser,
  getUserTeamsWithDetails,
  createTeam,
  joinTeam,
  signOutUser,
  getUserAllActiveTasks,
  UserPersonalTask,
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
  Sun,
  Moon,
  Clock,
  Check,
  RotateCcw,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeamItem[]>([]);
  const [userTasks, setUserTasks] = useState<UserPersonalTask[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'select' (overview akun & tim), 'create' (buat tim baru), 'join' (gabung tim)
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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);

      const [teams, tasks] = await Promise.all([
        getUserTeamsWithDetails(user.id),
        getUserAllActiveTasks(user.id),
      ]);
      setUserTeams(teams);
      setUserTasks(tasks);

      // Check query params
      const joinParam = searchParams.get('join');
      const tabParam = searchParams.get('tab');

      if (joinParam) {
        setJoinUsername(joinParam);
        setViewMode('join');
      } else if (tabParam === 'create') {
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
    <div suppressHydrationWarning className="onboarding-page-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 10%, #eef2ff 0%, #f8fafc 60%)' }}>
      {/* Header */}
      <header className="onboarding-header" style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', padding: '16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
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
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
          {/* VIEW 1: OVERVIEW AKUN & TIM SAYA (ACCOUNT OVERVIEW)                       */}
          {/* ========================================================================= */}
          {viewMode === 'select' && (
            <div>
              {/* Hero Banner Overview */}
              <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div className="onboarding-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff', color: isDarkMode ? '#a5b4fc' : '#4338ca', padding: '4px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, marginBottom: 10 }}>
                    <Sparkles size={14} /> Overview Akun TimJuara
                  </div>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                    Halo, {currentUser?.full_name?.split(' ')[0]}! 👋
                  </h2>
                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
                    Pantau seluruh tugas aktif, progres tim, dan ruang kerja Anda dalam satu tempat.
                  </p>
                </div>

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
                    <UserPlus size={15} /> Gabung Tim
                  </button>
                </div>
              </div>

              {/* 4 Metric Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{userTeams.length}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tim Diikuti</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {userTasks.filter((t) => t.status === 'in_progress').length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tugas Dikerjakan</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {userTasks.filter((t) => t.status === 'review' || t.review_notes?.toLowerCase().includes('revisi')).length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Review / Revisi</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {userTasks.filter((t) => t.status === 'done').length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tugas Selesai</div>
                  </div>
                </div>
              </div>

              {/* Section: Tugas Saya di Seluruh Tim */}
              {userTasks.filter((t) => t.status !== 'done').length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={18} color="var(--primary)" /> Tugas Aktif Anda di Seluruh Tim
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {userTasks.filter((t) => t.status !== 'done').length} tugas perlu diselesaikan
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {userTasks
                      .filter((t) => t.status !== 'done')
                      .slice(0, 5)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="card"
                          onClick={() => task.team_username && router.push(`/team/${task.team_username}`)}
                          style={{
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            flexWrap: 'wrap',
                            gap: 12,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                {task.title}
                              </span>
                              {task.team_name && (
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                  {task.team_name}
                                </span>
                              )}
                              {task.status === 'review' ? (
                                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                  🔍 Menunggu Review
                                </span>
                              ) : task.review_notes?.toLowerCase().includes('revisi') ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                  ⚠️ Perlu Revisi
                                </span>
                              ) : (
                                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                  Sedang Dikerjakan
                                </span>
                              )}
                            </div>
                            {task.deadline && (
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={12} /> Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                          <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            Buka Tugas <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Section: Tim Saya */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={18} color="var(--primary)" /> Koleksi Ruang Kerja Tim Anda
                  </h3>

                  {/* Search Tim */}
                  <div style={{ position: 'relative', width: 280 }}>
                    <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Cari tim Anda..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: 34, height: 36, fontSize: '0.825rem' }}
                    />
                  </div>
                </div>

                {filteredTeams.length === 0 ? (
                  <div className="card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <LayoutGrid size={40} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                      {searchQuery ? 'Tidak ada tim yang cocok dengan pencarian' : 'Anda belum bergabung ke tim manapun'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>
                      {searchQuery ? `Tidak ada hasil untuk "${searchQuery}".` : 'Buat tim pertama Anda atau bergabung ke tim rekan sekarang.'}
                    </p>
                    <button onClick={() => setViewMode('create')} className="btn btn-primary btn-sm">
                      <PlusCircle size={15} /> Buat Tim Baru Sekarang
                    </button>
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
                        >
                          {/* Top Row: Avatar + Title + Role */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                              {t.avatar_url ? (
                                <img
                                  src={t.avatar_url}
                                  alt={t.name}
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    objectFit: 'cover',
                                    border: '1px solid var(--surface-border)',
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
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
                              )}

                              {isLeader ? (
                                <span
                                  className="role-badge-leader"
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
                                  className="role-badge-member"
                                  style={{
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    padding: '4px 10px',
                                    borderRadius: 99,
                                    fontSize: '0.725rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Anggota
                                </span>
                              )}
                            </div>

                            {/* Team Name & Username */}
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1.3 }}>
                              {t.name}
                            </h3>
                          <span
                            className="team-username-chip"
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
                        <div className="team-card-bottom-border" style={{ borderTop: '1px solid var(--surface-border-light)', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      background: viewMode === 'create' ? 'var(--primary)' : (isDarkMode ? '#1e293b' : '#e2e8f0'),
                      color: viewMode === 'create' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b'),
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
                      background: viewMode === 'join' ? 'var(--primary)' : (isDarkMode ? '#1e293b' : '#e2e8f0'),
                      color: viewMode === 'join' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b'),
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
