import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Profile, 
  Team, 
  TeamMember, 
  Task, 
  ResearchMaterial, 
  MemberContribution, 
  Role, 
  TaskStatus, 
  ResourceType,
  AdminStats,
  AdminTeamItem,
  AdminUserItem,
  UserTeamItem,
  TaskComment,
  AppNotification,
} from './types';

// Mock Seed Data untuk Pengguna yang baru pertama mencoba tanpa konfigurasi Supabase
const DEMO_USER_KEY = 'timku_demo_current_user';
const DEMO_DATA_KEY = 'timku_demo_database';

interface DemoDatabase {
  users: Array<{ id: string; email: string; full_name: string; password?: string; phone_number?: string; avatar_url?: string }>;
  teams: Team[];
  members: TeamMember[];
  tasks: Task[];
  research: ResearchMaterial[];
  task_comments?: TaskComment[];
  notifications?: AppNotification[];
}

function getInitialDemoData(): DemoDatabase {
  const adminId = 'user-master-admin';
  const leaderId = 'user-leader-1';
  const member1Id = 'user-member-2';
  const member2Id = 'user-member-3';
  const teamId = 'team-demo-garuda';

  return {
    users: [
      { id: adminId, email: 'admin@gmail.com', full_name: 'Master Admin TimJuara', password: 'masteradmin' },
      { id: leaderId, email: 'budi@timku.com', full_name: 'Budi Santoso (Ketua)', password: 'password123' },
      { id: member1Id, email: 'siti@timku.com', full_name: 'Siti Rahma', password: 'password123' },
      { id: member2Id, email: 'dimas@timku.com', full_name: 'Dimas Pratama', password: 'password123' },
    ],
    teams: [
      {
        id: teamId,
        name: 'Tim Garuda Hackathon 2026',
        username: 'garuda-2026',
        description: 'Proyek inovasi teknologi ramah lingkungan untuk kompetisi nasional.',
        created_by: leaderId,
        created_at: new Date().toISOString(),
      },
    ],
    members: [
      { id: 'm-1', team_id: teamId, user_id: leaderId, role: 'ketua', joined_at: new Date().toISOString() },
      { id: 'm-2', team_id: teamId, user_id: member1Id, role: 'anggota', joined_at: new Date().toISOString() },
      { id: 'm-3', team_id: teamId, user_id: member2Id, role: 'anggota', joined_at: new Date().toISOString() },
    ],
    tasks: [
      {
        id: 't-1',
        team_id: teamId,
        title: 'Riset Problem Statement & Solusi Kompetitor',
        description: 'Cari 5 aplikasi serupa dan rangkum kelebihan serta kekurangannya.',
        assigned_to: member1Id,
        deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 hari lagi
        status: 'done',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 't-2',
        team_id: teamId,
        title: 'Desain Wireframe & Prototype UI/UX di Figma',
        description: 'Buat alur registrasi, dashboard utama, dan sistem navigasi.',
        assigned_to: member2Id,
        deadline: new Date(Date.now() + 86400000 * 1).toISOString(), // Besok
        status: 'in_progress',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 't-3',
        team_id: teamId,
        title: 'Menyusun Proposal Bab 1 & Bab 2',
        description: 'Latar belakang masalah, batasan masalah, dan tujuan inovasi.',
        assigned_to: leaderId,
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 hari lagi
        status: 'done',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 't-4',
        team_id: teamId,
        title: 'Pembuatan Slide Presentasi Final Pitching',
        description: 'Format slide 10 halaman sesuai guideline lomba.',
        assigned_to: leaderId,
        deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
        status: 'todo',
        created_at: new Date().toISOString(),
      },
    ],
    research: [
      {
        id: 'r-1',
        team_id: teamId,
        title: 'Folder Google Drive Berkas & Laporan Lomba',
        resource_url: 'https://drive.google.com/drive/folders/contoh-folder-tim',
        resource_type: 'drive',
        notes: 'Semua draf dokumen, lampiran sertifikat, dan aset gambar disimpan di sini.',
        uploaded_by: leaderId,
        created_at: new Date().toISOString(),
      },
      {
        id: 'r-2',
        team_id: teamId,
        title: 'Dokumen Google Docs - Draf Proposal Lengkap',
        resource_url: 'https://docs.google.com/document/d/contoh-proposal-tim',
        resource_type: 'docs',
        notes: 'Silakan beri komentar atau revisi langsung pada bab masing-masing.',
        uploaded_by: member1Id,
        created_at: new Date().toISOString(),
      },
      {
        id: 'r-3',
        team_id: teamId,
        title: 'Figma Design System & Mockup Aplikasi',
        resource_url: 'https://www.figma.com/file/contoh-mockup-tim',
        resource_type: 'figma',
        notes: 'Desain antarmuka mobile dan desktop versi final.',
        uploaded_by: member2Id,
        created_at: new Date().toISOString(),
      },
    ],
  };
}

function getDemoDb(): DemoDatabase {
  if (typeof window === 'undefined') return getInitialDemoData();
  const raw = localStorage.getItem(DEMO_DATA_KEY);
  let db: DemoDatabase;
  if (!raw) {
    db = getInitialDemoData();
    localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(db));
    return db;
  }
  try {
    db = JSON.parse(raw);
  } catch {
    db = getInitialDemoData();
  }

  // Pastikan akun Master Admin selalu tersedia
  if (!db.users.some(u => u.email.toLowerCase() === 'admin@gmail.com')) {
    db.users.unshift({
      id: 'user-master-admin',
      email: 'admin@gmail.com',
      full_name: 'Master Admin TimJuara',
      password: 'masteradmin',
    });
    localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(db));
  }

  if (!db.task_comments) db.task_comments = [];
  if (!db.notifications) db.notifications = [];

  return db;
}

function saveDemoDb(db: DemoDatabase) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(db));
}

// -------------------------------------------------------------
// AUTHENTICATION METHODS
// -------------------------------------------------------------

export async function getCurrentUser(): Promise<Profile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna',
      email: user.email || '',
      avatar_url: profile?.avatar_url || '',
      phone_number: profile?.phone_number || '',
    };
  } else {
    // Mode Demo Lokal
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }
}

export async function signUpUser(
  fullName: string,
  email: string,
  password: string,
  phoneNumber?: string
): Promise<{ user: Profile | null; error: string | null; needsEmailConfirmation?: boolean }> {
  const cleanPhone = (phoneNumber || '').trim();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: cleanPhone,
        },
      },
    });

    if (error) {
      const errMsg = error.message.toLowerCase();
      if (errMsg.includes('disabled') || (error as any).code === 'email_provider_disabled') {
        return {
          user: null,
          error: 'Provider Email di Supabase Anda sedang NONAKTIF. Buka Supabase -> Authentication -> Providers -> Email, lalu aktifkan toggle "Enable Email provider" (ON).',
        };
      }
      return { user: null, error: error.message };
    }
    if (!data.user) return { user: null, error: 'Pendaftaran gagal.' };

    // Pastikan nomor WhatsApp langsung tersimpan di tabel public.profiles
    if (cleanPhone) {
      try {
        await supabase
          .from('profiles')
          .update({ phone_number: cleanPhone })
          .eq('id', data.user.id);
      } catch (e) {
        console.error('Failed to update phone_number during sign-up:', e);
      }
    }

    const needsEmailConfirmation = !data.session;

    return {
      user: {
        id: data.user.id,
        full_name: fullName,
        email,
        phone_number: cleanPhone,
      },
      error: null,
      needsEmailConfirmation,
    };
  } else {
    // Demo Mode
    const db = getDemoDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { user: null, error: 'Email ini sudah terdaftar di demo.' };
    }

    const newUser = {
      id: 'user-' + Date.now(),
      email,
      full_name: fullName,
      password,
      phone_number: cleanPhone,
    };
    db.users.push(newUser);
    saveDemoDb(db);

    const profile: Profile = {
      id: newUser.id,
      full_name: newUser.full_name,
      email: newUser.email,
      phone_number: cleanPhone,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    }
    return { user: profile, error: null, needsEmailConfirmation: false };
  }
}

export async function signInUser(email: string, password: string): Promise<{ user: Profile | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    let { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    // Jika master admin belum terdaftar di Supabase, buatkan otomatis
    if (error && cleanEmail === 'admin@gmail.com' && password === 'masteradmin') {
      const signUpRes = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: 'Master Admin TimJuara' } },
      });
      if (!signUpRes.error) {
        const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (retry.data?.user) {
          data = retry.data;
          error = null;
        }
      }
    }

    if (error) {
      const errMsg = error.message.toLowerCase();
      if (errMsg.includes('disabled') || (error as any).code === 'email_provider_disabled') {
        return {
          user: null,
          error: 'Provider Email di Supabase Anda sedang NONAKTIF (Disabled). Buka Dashboard Supabase -> Authentication -> Providers -> Email, lalu aktifkan toggle paling atas "Enable Email provider" (ON).',
        };
      }
      if (errMsg.includes('email not confirmed')) {
        return {
          user: null,
          error: 'Email belum dikonfirmasi di Supabase. Silakan buka Supabase Dashboard -> Authentication -> Providers -> Email, lalu matikan toggle "Confirm email" (OFF) agar pendaftaran langsung aktif tanpa verifikasi email.',
        };
      }
      if (cleanEmail === 'admin@gmail.com') {
        return {
          user: null,
          error: 'Akun Master Admin di Supabase belum aktif atau password salah. Di dashboard Supabase (Authentication -> Users), pastikan user admin@gmail.com dibuat dengan centang "Auto Confirm User", atau jalankan skrip SQL Master Admin dari supabase-schema.sql.',
        };
      }
      return { user: null, error: error.message };
    }
    if (!data.user) return { user: null, error: 'Login gagal.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        full_name: profile?.full_name || data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
        email: data.user.email || cleanEmail,
      },
      error: null,
    };
  } else {
    // Demo Mode
    const db = getDemoDb();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user || (user.password && user.password !== password)) {
      return { user: null, error: 'Email atau kata sandi tidak sesuai.' };
    }

    const profile: Profile = { id: user.id, full_name: user.full_name, email: user.email };
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
    }
    return { user: profile, error: null };
  }
}

export async function loginAsDemo(role: 'ketua' | 'anggota' = 'ketua'): Promise<Profile> {
  const db = getDemoDb();
  const targetId = role === 'ketua' ? 'user-leader-1' : 'user-member-2';
  const found = db.users.find(u => u.id === targetId) || db.users[0];
  const profile: Profile = { id: found.id, full_name: found.full_name, email: found.email };
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(profile));
  }
  return profile;
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  } else {
    // Demo Mode Google Login Fallback
    await loginAsDemo('ketua');
    return { error: null };
  }
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_USER_KEY);
  }
}

export function formatDirectImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Konversi otomatis link Google Drive menjadi direct image thumbnail
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    let fileId = '';
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idParamMatch && idParamMatch[1]) {
        fileId = idParamMatch[1];
      }
    }

    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
  }

  // Konversi otomatis link Dropbox menjadi direct link
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('dl=0', 'raw=1');
  }

  return trimmed;
}

export async function updateUserAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; error: string | null }> {
  const cleanUrl = formatDirectImageUrl(avatarUrl);
  if (isSupabaseConfigured && supabase) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: cleanUrl })
      .eq('id', userId);

    if (profileError) return { success: false, error: profileError.message };

    await supabase.auth.updateUser({
      data: { avatar_url: cleanUrl },
    });

    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.avatar_url = cleanUrl;
      saveDemoDb(db);
    }
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) {
        const p: Profile = JSON.parse(raw);
        p.avatar_url = cleanUrl;
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(p));
      }
    }
    return { success: true, error: null };
  }
}

export async function updateUserName(
  userId: string, 
  fullName: string
): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId);

    if (profileError) return { success: false, error: profileError.message };

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    if (authError) return { success: false, error: authError.message };

    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.full_name = fullName;
      saveDemoDb(db);
    }
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) {
        const p: Profile = JSON.parse(raw);
        p.full_name = fullName;
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(p));
      }
    }
    return { success: true, error: null };
  }
}

export async function updateUserEmail(
  userId: string, 
  email: string
): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error: 'Batas kuota pengiriman email Supabase terlampaui (Layanan email bawaan Supabase Free Tier membatasi 2-3 email per jam). Silakan tunggu sekitar 1 jam lagi, atau ganti Nama Lengkap & Kata Sandi saja karena tidak dibatasi kuota email.',
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== userId);
    if (existing) {
      return { success: false, error: 'Email ini sudah digunakan oleh akun lain.' };
    }
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.email = email.trim();
      saveDemoDb(db);
    }
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) {
        const p: Profile = JSON.parse(raw);
        p.email = email.trim();
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(p));
      }
    }
    return { success: true, error: null };
  }
}

export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } else {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) {
        const p: Profile = JSON.parse(raw);
        const db = getDemoDb();
        const user = db.users.find(u => u.id === p.id);
        if (user) {
          user.password = newPassword.trim();
          saveDemoDb(db);
        }
      }
    }
    return { success: true, error: null };
  }
}

export async function updateUserProfile(
  userId: string, 
  fullName: string, 
  email?: string,
  newPassword?: string
): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId);

    if (profileError) return { success: false, error: profileError.message };

    // 2. Update Supabase Auth User (Email / Password / Metadata)
    const authUpdates: any = { data: { full_name: fullName } };
    if (email && email.trim()) {
      authUpdates.email = email.trim();
    }
    if (newPassword && newPassword.trim()) {
      authUpdates.password = newPassword.trim();
    }

    const { error: authError } = await supabase.auth.updateUser(authUpdates);
    if (authError) return { success: false, error: authError.message };

    return { success: true, error: null };
  } else {
    // Demo Mode
    const db = getDemoDb();
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.full_name = fullName;
      if (email && email.trim()) {
        user.email = email.trim();
      }
      if (newPassword && newPassword.trim()) {
        user.password = newPassword.trim();
      }
      saveDemoDb(db);
    }

    // Update current user in localStorage
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) {
        const p: Profile = JSON.parse(raw);
        p.full_name = fullName;
        if (email && email.trim()) {
          p.email = email.trim();
        }
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(p));
      }
    }

    return { success: true, error: null };
  }
}

export async function updateUserPhoneNumber(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; error: string | null }> {
  const cleanPhone = phoneNumber.trim();

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('profiles')
      .update({ phone_number: cleanPhone })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.phone_number = cleanPhone;
      saveDemoDb(db);
    }
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) {
        const p: Profile = JSON.parse(raw);
        p.phone_number = cleanPhone;
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(p));
      }
    }
    return { success: true, error: null };
  }
}

export async function getGlobalWhatsAppConfig(): Promise<{ wa_gateway_token: string; wa_notifications_enabled: boolean }> {
  let wa_gateway_token = '';
  let wa_notifications_enabled = true;

  if (typeof window !== 'undefined') {
    const savedToken = localStorage.getItem('master_wa_token') || localStorage.getItem('timjuara_fonnte_token');
    if (savedToken) wa_gateway_token = savedToken;
  }

  // Ambil dari endpoint server config jika di browser belum ada
  if (!wa_gateway_token && typeof window !== 'undefined') {
    try {
      const confRes = await fetch('/api/whatsapp/config');
      if (confRes.ok) {
        const confData = await confRes.json();
        if (confData?.token) {
          wa_gateway_token = confData.token;
          localStorage.setItem('master_wa_token', confData.token);
          localStorage.setItem('timjuara_fonnte_token', confData.token);
        }
      }
    } catch {
      // Abaikan jika gagal
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['fonnte_token', 'wa_notifications_enabled']);

      if (data) {
        for (const item of data) {
          if (item.key === 'fonnte_token' && item.value) wa_gateway_token = item.value;
          if (item.key === 'wa_notifications_enabled') wa_notifications_enabled = item.value !== 'false';
        }
      }

      // Fallback: cek jika ada di tabel teams
      if (!wa_gateway_token) {
        const { data: teamWithToken } = await supabase
          .from('teams')
          .select('wa_gateway_token, wa_notifications_enabled')
          .not('wa_gateway_token', 'is', null)
          .neq('wa_gateway_token', '')
          .limit(1)
          .maybeSingle();
        if (teamWithToken?.wa_gateway_token) {
          wa_gateway_token = teamWithToken.wa_gateway_token;
          wa_notifications_enabled = teamWithToken.wa_notifications_enabled !== false;
        }
      }

      if (wa_gateway_token && typeof window !== 'undefined') {
        localStorage.setItem('master_wa_token', wa_gateway_token);
        localStorage.setItem('timjuara_fonnte_token', wa_gateway_token);
      }

      return { wa_gateway_token, wa_notifications_enabled };
    } catch (e) {
      console.error('Error getting global WhatsApp config:', e);
      return { wa_gateway_token, wa_notifications_enabled };
    }
  } else {
    return { wa_gateway_token, wa_notifications_enabled };
  }
}

export async function updateGlobalWhatsAppConfig(
  waToken: string,
  enabled: boolean
): Promise<{ success: boolean; error: string | null }> {
  const cleanToken = waToken.trim();

  // 1. Selalu simpan di localStorage browser
  if (typeof window !== 'undefined') {
    localStorage.setItem('master_wa_token', cleanToken);
    localStorage.setItem('timjuara_fonnte_token', cleanToken);
    localStorage.setItem('master_wa_enabled', String(enabled));
  }

  // 2. Simpan ke endpoint server config agar aktif di memori server
  if (typeof window !== 'undefined' && cleanToken) {
    try {
      fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      }).catch(() => {});
    } catch {}
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // Simpan ke system_settings jika tabel ada
      await supabase.from('system_settings').upsert([
        { key: 'fonnte_token', value: cleanToken, updated_at: new Date().toISOString() },
        { key: 'wa_notifications_enabled', value: String(enabled), updated_at: new Date().toISOString() },
      ]);

      // Sinkronkan ke seluruh baris tim di database
      await supabase
        .from('teams')
        .update({
          wa_gateway_token: cleanToken,
          wa_notifications_enabled: enabled,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      return { success: true, error: null };
    } catch (e: any) {
      return { success: true, error: null };
    }
  } else {
    const db = getDemoDb();
    db.teams.forEach(t => {
      t.wa_gateway_token = cleanToken;
      t.wa_notifications_enabled = enabled;
    });
    saveDemoDb(db);
    return { success: true, error: null };
  }
}

export async function updateTeamWhatsAppConfig(
  teamId: string,
  configOrToken: { wa_gateway_token?: string; wa_notifications_enabled?: boolean } | string,
  maybeEnabled?: boolean
): Promise<{ success: boolean; error: string | null }> {
  let cleanToken = '';
  let enabled = true;

  if (typeof configOrToken === 'string') {
    cleanToken = configOrToken.trim();
    enabled = maybeEnabled !== undefined ? maybeEnabled : true;
  } else {
    cleanToken = (configOrToken.wa_gateway_token || '').trim();
    enabled = configOrToken.wa_notifications_enabled !== false;
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('teams')
      .update({
        wa_gateway_token: cleanToken,
        wa_notifications_enabled: enabled,
      })
      .eq('id', teamId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    const t = db.teams.find(item => item.id === teamId);
    if (t) {
      t.wa_gateway_token = cleanToken;
      t.wa_notifications_enabled = enabled;
      saveDemoDb(db);
    }
    return { success: true, error: null };
  }
}

export async function updateTeamAvatar(
  teamId: string,
  avatarUrl: string
): Promise<{ success: boolean; error: string | null }> {
  const cleanUrl = formatDirectImageUrl(avatarUrl);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`timjuara_team_avatar_${teamId}`, cleanUrl);
    } catch (e) {
      console.error(e);
    }

    // Simpan ke database sentral via API server (Bypass RLS & fallback system_settings)
    fetch('/api/teams/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId,
        avatar_url: cleanUrl,
      }),
    }).catch((e) => console.warn('Sync avatar to /api/teams/settings warning:', e));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('teams')
        .update({ avatar_url: cleanUrl })
        .eq('id', teamId);
      return { success: true, error: null };
    } catch {
      return { success: true, error: null };
    }
  } else {
    const db = getDemoDb();
    const t = db.teams.find(item => item.id === teamId);
    if (t) {
      t.avatar_url = cleanUrl;
      saveDemoDb(db);
    }
    return { success: true, error: null };
  }
}

export async function updateTeamWhatsAppGroup(
  teamId: string,
  groupId: string,
  groupName?: string
): Promise<{ success: boolean; error: string | null }> {
  const cleanGroupId = (groupId || '').trim();
  const cleanGroupName = (groupName || '').trim();

  // 1. Simpan ke browser local storage untuk persistensi instan & offline cache
  if (typeof window !== 'undefined') {
    try {
      if (cleanGroupId) {
        localStorage.setItem(`timjuara_team_wa_group_${teamId}`, cleanGroupId);
      } else {
        localStorage.removeItem(`timjuara_team_wa_group_${teamId}`);
      }
      if (cleanGroupName) {
        localStorage.setItem(`timjuara_team_wa_group_name_${teamId}`, cleanGroupName);
      } else {
        localStorage.removeItem(`timjuara_team_wa_group_name_${teamId}`);
      }
    } catch (e) {
      console.error('LocalStorage wa_group save error:', e);
    }
  }

  // 2. Simpan permanen ke Database Sentral via API Server (Bypass RLS & Garansi Tersimpan di system_settings)
  let apiSuccess = false;
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/teams/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          wa_group_id: cleanGroupId,
          wa_group_name: cleanGroupName,
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        apiSuccess = true;
      } else {
        console.warn('API /api/teams/settings warning:', resData?.error);
      }
    } catch (apiErr) {
      console.warn('Network call to /api/teams/settings failed:', apiErr);
    }
  }

  // 3. Simpan juga langsung ke Supabase client jika terkonfigurasi
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('teams')
        .update({
          wa_group_id: cleanGroupId || null,
          wa_group_name: cleanGroupName || null,
        })
        .eq('id', teamId);
      return { success: true, error: null };
    } catch {
      return { success: true, error: null };
    }
  } else {
    // 4. Simpan ke Demo Database
    const db = getDemoDb();
    const t = db.teams.find((item) => item.id === teamId);
    if (t) {
      t.wa_group_id = cleanGroupId || undefined;
      t.wa_group_name = cleanGroupName || undefined;
      saveDemoDb(db);
    }
    return { success: true, error: null };
  }
}

export async function getWhatsAppGroups(
  token?: string,
  refresh?: boolean
): Promise<{ success: boolean; groups: Array<{ id: string; name: string }>; error: string | null }> {
  try {
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (refresh) params.set('refresh', 'true');

    const url = `/api/whatsapp/groups${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, groups: [], error: data.error || 'Gagal memuat daftar grup WhatsApp.' };
    }

    return { success: true, groups: data.groups || [], error: null };
  } catch (err: any) {
    return { success: false, groups: [], error: err.message || 'Terjadi kesalahan saat memuat grup.' };
  }
}

export async function sendTeamGroupWhatsAppMessage(
  team: Team,
  message: string,
  overrideToken?: string
): Promise<{ success: boolean; error: string | null; message?: string }> {
  let groupId = team.wa_group_id;
  if (!groupId && typeof window !== 'undefined') {
    groupId = localStorage.getItem(`timjuara_team_wa_group_${team.id}`) || undefined;
  }

  if (!groupId) {
    return {
      success: false,
      error: `Tim ${team.name} belum menghubungkan ID Grup WhatsApp. Atur ID grup di Master Admin atau Pengaturan Tim.`,
    };
  }

  const tokenToUse = overrideToken || team.wa_gateway_token;
  return await sendTestWhatsAppMessage(groupId, message, tokenToUse);
}

export async function sendTestWhatsAppMessage(
  targetPhone: string,
  customMessageOrToken?: string,
  token?: string
): Promise<{ success: boolean; error: string | null; message?: string }> {
  try {
    const defaultMsg = '✅ *TES KONEKSI WHATSAPP TIMJUARA*\n\nSelamat! Nomor WhatsApp kamu berhasil terhubung dengan sistem notifikasi bot TimJuara. Nantinya pengingat deadline tugas akan dikirim otomatis ke nomor ini. 🚀';
    
    // If only 2 arguments are provided and second argument looks like a token (no newline) vs custom message
    let finalMsg = defaultMsg;
    let finalToken = token;

    if (token) {
      finalMsg = customMessageOrToken || defaultMsg;
      finalToken = token;
    } else if (customMessageOrToken) {
      if (customMessageOrToken.includes('\n') || customMessageOrToken.includes('*')) {
        finalMsg = customMessageOrToken;
        finalToken = undefined;
      } else {
        // Likely passed as (targetPhone, token)
        finalToken = customMessageOrToken;
      }
    }

    // Jika token masih kosong dan berjalan di client browser, gunakan token Master Admin yang tersimpan
    if (!finalToken && typeof window !== 'undefined') {
      const savedMasterToken = localStorage.getItem('master_wa_token') || localStorage.getItem('timjuara_fonnte_token');
      if (savedMasterToken) {
        finalToken = savedMasterToken;
      }
    }

    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: targetPhone,
        token: finalToken,
        message: finalMsg,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Gagal mengirim pesan tes WhatsApp.' };
    }
    return { success: true, error: null, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan jaringan saat tes WhatsApp.' };
  }
}

export async function triggerDeadlineReminders(
  teamId?: string,
  force: boolean = false
): Promise<{ success: boolean; error: string | null; sentCount?: number; skippedCount?: number; message?: string }> {
  try {
    const res = await fetch('/api/whatsapp/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, force }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Gagal memicu pengingat deadline.' };
    }
    return {
      success: true,
      error: null,
      sentCount: data.sentCount,
      skippedCount: data.skippedCount,
      message: data.message,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan jaringan saat memicu pengingat.' };
  }
}

// -------------------------------------------------------------
// TEAMS METHODS
// -------------------------------------------------------------

export async function getUserTeams(userId: string): Promise<Team[]> {
  if (isSupabaseConfigured && supabase) {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('teams (*)')
      .eq('user_id', userId);

    if (error || !members) return [];
    return members.map((m: any) => m.teams).filter(Boolean);
  } else {
    const db = getDemoDb();
    const memberTeamIds = db.members.filter(m => m.user_id === userId).map(m => m.team_id);
    return db.teams.filter(t => memberTeamIds.includes(t.id));
  }
}

export async function getUserTeamsWithDetails(userId: string): Promise<UserTeamItem[]> {
  if (isSupabaseConfigured && supabase) {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('role, teams (*)')
      .eq('user_id', userId);

    if (error || !members) return [];

    const teamsWithRole: Array<{ team: Team; role: Role }> = members
      .filter((m: any) => m.teams)
      .map((m: any) => ({
        team: m.teams,
        role: (m.role as Role) || 'anggota',
      }));

    if (teamsWithRole.length === 0) return [];

    const teamIds = teamsWithRole.map((item) => item.team.id);

    const [membersRes, tasksRes] = await Promise.all([
      supabase.from('team_members').select('team_id').in('team_id', teamIds),
      supabase.from('tasks').select('team_id').in('team_id', teamIds),
    ]);

    const memberCounts: Record<string, number> = {};
    (membersRes.data || []).forEach((m: any) => {
      memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
    });

    const taskCounts: Record<string, number> = {};
    (tasksRes.data || []).forEach((t: any) => {
      taskCounts[t.team_id] = (taskCounts[t.team_id] || 0) + 1;
    });

    // Query system_settings untuk grup WA dan avatar
    const sysKeys: string[] = [];
    teamIds.forEach((id) => {
      sysKeys.push(`team_wa_group_${id}`, `team_wa_group_name_${id}`, `team_avatar_${id}`);
    });
    const { data: sysRes } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', sysKeys);

    const sysMap: Record<string, string> = {};
    (sysRes || []).forEach((item: any) => {
      if (item.value) sysMap[item.key] = item.value;
    });

    return teamsWithRole.map(({ team, role }) => {
      let avatar: string = team.avatar_url || sysMap[`team_avatar_${team.id}`] || '';
      if (!avatar && typeof window !== 'undefined') {
        avatar = localStorage.getItem(`timjuara_team_avatar_${team.id}`) || '';
      }
      let wa_group_id: string | undefined = team.wa_group_id || sysMap[`team_wa_group_${team.id}`];
      if (!wa_group_id && typeof window !== 'undefined') {
        wa_group_id = localStorage.getItem(`timjuara_team_wa_group_${team.id}`) || undefined;
      }
      let wa_group_name: string | undefined = team.wa_group_name || sysMap[`team_wa_group_name_${team.id}`];
      if (!wa_group_name && typeof window !== 'undefined') {
        wa_group_name = localStorage.getItem(`timjuara_team_wa_group_name_${team.id}`) || undefined;
      }

      return {
        ...team,
        avatar_url: avatar,
        wa_group_id: wa_group_id || undefined,
        wa_group_name: wa_group_name || undefined,
        user_role: role,
        member_count: memberCounts[team.id] || 1,
        task_count: taskCounts[team.id] || 0,
      };
    });
  } else {
    const db = getDemoDb();
    const memberships = db.members.filter((m) => m.user_id === userId);
    return memberships
      .map((m) => {
        const team = db.teams.find((t) => t.id === m.team_id);
        if (!team) return null;
        const memberCount = db.members.filter((mem) => mem.team_id === team.id).length;
        const taskCount = db.tasks.filter((tk) => tk.team_id === team.id).length;
        return {
          ...team,
          user_role: m.role,
          member_count: memberCount,
          task_count: taskCount,
        };
      })
      .filter((t): t is UserTeamItem => t !== null);
  }
}

export interface UserPersonalTask extends Task {
  team_name?: string;
  team_username?: string;
}

export async function getUserAllActiveTasks(userId: string): Promise<UserPersonalTask[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: memberTeams, error: tmError } = await supabase
        .from('team_members')
        .select('team_id, teams (id, name, username)')
        .eq('user_id', userId);

      if (tmError || !memberTeams || memberTeams.length === 0) return [];
      const teamMap = new Map<string, { name: string; username: string }>();
      memberTeams.forEach((m: any) => {
        if (m.teams) teamMap.set(m.team_id, { name: m.teams.name, username: m.teams.username });
      });

      const teamIds = Array.from(teamMap.keys());
      if (teamIds.length === 0) return [];

      const { data: tasksData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id, team_id, title, description, deadline, status, review_notes,
          assigned_to, assigned_to_ids
        `)
        .in('team_id', teamIds)
        .order('deadline', { ascending: true });

      if (taskError || !tasksData) return [];

      const myTasks = tasksData.filter((t: any) => {
        return t.assigned_to === userId || (t.assigned_to_ids && t.assigned_to_ids.includes(userId));
      });

      return myTasks.map((t: any) => {
        const tm = teamMap.get(t.team_id);
        const isMarkedReview = t.review_notes && t.review_notes.includes('[STATUS:REVIEW]');
        const effectiveStatus = (t.status === 'review' || (isMarkedReview && t.status !== 'done')) ? 'review' : t.status;
        return {
          ...t,
          status: effectiveStatus,
          team_name: tm?.name,
          team_username: tm?.username,
        };
      });
    } catch {
      return [];
    }
  } else {
    const db = getDemoDb();
    const myTeams = db.members.filter(m => m.user_id === userId);
    const teamMap = new Map<string, { name: string; username: string }>();
    myTeams.forEach(m => {
      const tm = db.teams.find(t => t.id === m.team_id);
      if (tm) teamMap.set(tm.id, { name: tm.name, username: tm.username });
    });

    const myTasks = (db.tasks || []).filter(t => {
      return t.assigned_to === userId || (t.assigned_to_ids && t.assigned_to_ids.includes(userId));
    });

    return myTasks.map(t => {
      const tm = teamMap.get(t.team_id);
      const isMarkedReview = t.review_notes && t.review_notes.includes('[STATUS:REVIEW]');
      const effectiveStatus = (t.status === 'review' || (isMarkedReview && t.status !== 'done')) ? 'review' : t.status;
      return {
        ...t,
        status: effectiveStatus,
        team_name: tm?.name,
        team_username: tm?.username,
      };
    });
  }
}

export async function getTeamByUsername(username: string): Promise<{ team: Team | null; members: TeamMember[] }> {
  if (isSupabaseConfigured && supabase) {
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .ilike('username', username)
      .single();

    if (error || !team) return { team: null, members: [] };

    // 1. Ambil pengaturan dari system_settings jika belum ada di tabel teams (sentral cloud)
    if (!team.wa_group_id || !team.wa_group_name || !team.avatar_url) {
      try {
        const { data: sysSettings } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', [
            `team_wa_group_${team.id}`,
            `team_wa_group_name_${team.id}`,
            `team_avatar_${team.id}`,
          ]);

        if (sysSettings && sysSettings.length > 0) {
          for (const item of sysSettings) {
            if (item.key === `team_wa_group_${team.id}` && item.value && !team.wa_group_id) {
              team.wa_group_id = item.value;
            }
            if (item.key === `team_wa_group_name_${team.id}` && item.value && !team.wa_group_name) {
              team.wa_group_name = item.value;
            }
            if (item.key === `team_avatar_${team.id}` && item.value && !team.avatar_url) {
              team.avatar_url = item.value;
            }
          }
        }
      } catch (sysErr) {
        console.warn('Error reading team fallback from system_settings:', sysErr);
      }
    }

    // 2. Sinkronisasi Dua Arah (Bidirectional Sync) dengan browser localStorage
    if (typeof window !== 'undefined') {
      const localGroupId = localStorage.getItem(`timjuara_team_wa_group_${team.id}`);
      const localGroupName = localStorage.getItem(`timjuara_team_wa_group_name_${team.id}`);
      const localAvatar = localStorage.getItem(`timjuara_team_avatar_${team.id}`);

      // Skenario A: Laptop lama memiliki ID di localStorage tapi server cloud belum terisi
      if (localGroupId && !team.wa_group_id) {
        team.wa_group_id = localGroupId;
        team.wa_group_name = localGroupName || undefined;
        // Auto-migrasi ke database sentral agar perangkat lain (laptop B/HP) langsung menerima ID ini
        fetch('/api/teams/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: team.id,
            wa_group_id: localGroupId,
            wa_group_name: localGroupName || '',
          }),
        }).catch((e) => console.warn('Auto-sync wa_group to cloud failed:', e));
      } else if (team.wa_group_id) {
        // Skenario B: Server cloud memiliki ID grup (misal dibuka di Laptop B yang baru)
        // Simpan ke localStorage laptop ini untuk caching lokal
        try {
          localStorage.setItem(`timjuara_team_wa_group_${team.id}`, team.wa_group_id);
          if (team.wa_group_name) {
            localStorage.setItem(`timjuara_team_wa_group_name_${team.id}`, team.wa_group_name);
          }
        } catch {}
      }

      if (localAvatar && !team.avatar_url) {
        team.avatar_url = localAvatar;
        fetch('/api/teams/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: team.id,
            avatar_url: localAvatar,
          }),
        }).catch((e) => console.warn('Auto-sync avatar to cloud failed:', e));
      } else if (team.avatar_url) {
        try {
          localStorage.setItem(`timjuara_team_avatar_${team.id}`, team.avatar_url);
        } catch {}
      }
    }

    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id, team_id, user_id, role, joined_at,
        profiles (id, full_name, avatar_url, phone_number)
      `)
      .eq('team_id', team.id);

    if (membersError) {
      console.error('Error fetching team members:', membersError);
    }

    let members: TeamMember[] = (membersData || []).map((m: any) => ({
      id: m.id,
      team_id: m.team_id,
      user_id: m.user_id,
      role: m.role as Role,
      joined_at: m.joined_at,
      profile: m.profiles,
    }));

    // Fallback tangguh: Jika daftar anggota kosong (misal akibat kendala policy RLS recursion),
    // pastikan pembuat tim (creator) tetap muncul di daftar sebagai Ketua
    if (members.length === 0 && team.created_by) {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone_number')
        .eq('id', team.created_by)
        .single();

      if (creatorProfile) {
        members = [{
          id: 'creator-' + team.id,
          team_id: team.id,
          user_id: team.created_by,
          role: 'ketua',
          joined_at: team.created_at,
          profile: creatorProfile,
        }];

        // Coba sinkronisasi kembali row ke team_members di background
        supabase.from('team_members').insert({
          team_id: team.id,
          user_id: team.created_by,
          role: 'ketua',
        }).then(() => {});
      }
    }

    return { team, members };
  } else {
    const db = getDemoDb();
    const team = db.teams.find(t => t.username.toLowerCase() === username.toLowerCase()) || null;
    if (!team) return { team: null, members: [] };

    if (typeof window !== 'undefined') {
      if (!team.avatar_url) {
        const localAvatar = localStorage.getItem(`timjuara_team_avatar_${team.id}`);
        if (localAvatar) team.avatar_url = localAvatar;
      }
      if (!team.wa_group_id) {
        const localGroupId = localStorage.getItem(`timjuara_team_wa_group_${team.id}`);
        if (localGroupId) team.wa_group_id = localGroupId;
      }
      if (!team.wa_group_name) {
        const localGroupName = localStorage.getItem(`timjuara_team_wa_group_name_${team.id}`);
        if (localGroupName) team.wa_group_name = localGroupName;
      }
    }

    const members: TeamMember[] = db.members
      .filter(m => m.team_id === team.id)
      .map(m => {
        const u = db.users.find(user => user.id === m.user_id);
        return {
          ...m,
          profile: u ? { id: u.id, full_name: u.full_name, email: u.email } : undefined,
        };
      });

    return { team, members };
  }
}

export async function createTeam(
  name: string, 
  username: string, 
  description: string, 
  userId: string
): Promise<{ team: Team | null; error: string | null }> {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  if (isSupabaseConfigured && supabase) {
    // 1. Insert team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        username: cleanUsername,
        description,
        created_by: userId,
      })
      .select()
      .single();

    if (teamError) return { team: null, error: teamError.message };

    // 2. Add creator as 'ketua'
    await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      role: 'ketua',
    });

    return { team, error: null };
  } else {
    const db = getDemoDb();
    const exists = db.teams.some(t => t.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { team: null, error: 'Username tim ini sudah dipakai. Coba username lain.' };
    }

    const newTeam: Team = {
      id: 'team-' + Date.now(),
      name,
      username: cleanUsername,
      description,
      created_by: userId,
      created_at: new Date().toISOString(),
    };

    db.teams.push(newTeam);
    db.members.push({
      id: 'm-' + Date.now(),
      team_id: newTeam.id,
      user_id: userId,
      role: 'ketua',
      joined_at: new Date().toISOString(),
    });

    saveDemoDb(db);
    return { team: newTeam, error: null };
  }
}

export async function joinTeam(username: string, userId: string): Promise<{ team: Team | null; error: string | null }> {
  const cleanUsername = username.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data: team, error: findError } = await supabase
      .from('teams')
      .select('*')
      .ilike('username', cleanUsername)
      .single();

    if (findError || !team) {
      return { team: null, error: 'Tim dengan username tersebut tidak ditemukan. Periksa kembali kodenya.' };
    }

    // Periksa apakah sudah bergabung
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { team, error: null }; // Sudah bergabung
    }

    const { error: joinError } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      role: 'anggota',
    });

    if (joinError) return { team: null, error: joinError.message };
    return { team, error: null };
  } else {
    const db = getDemoDb();
    const team = db.teams.find(t => t.username.toLowerCase() === cleanUsername);
    if (!team) {
      return { team: null, error: 'Tim tidak ditemukan. Coba: garuda-2026' };
    }

    const alreadyMember = db.members.some(m => m.team_id === team.id && m.user_id === userId);
    if (!alreadyMember) {
      db.members.push({
        id: 'm-' + Date.now(),
        team_id: team.id,
        user_id: userId,
        role: 'anggota',
        joined_at: new Date().toISOString(),
      });
      saveDemoDb(db);
    }

    return { team, error: null };
  }
}

export async function joinTeamByUsername(
  username: string,
  userId: string
): Promise<{ success: boolean; team: Team | null; error: string | null }> {
  const res = await joinTeam(username, userId);
  return {
    success: !!res.team && !res.error,
    team: res.team,
    error: res.error,
  };
}

// -------------------------------------------------------------
// TASKS METHODS (Mendukung Multi-PIC & Counter Komentar)
// -------------------------------------------------------------

export async function getTeamTasks(teamId: string): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    let { data, error } = await supabase
      .from('tasks')
      .select(`
        id, team_id, title, description, task_link, assigned_to, assigned_to_ids, deadline, status, completed_by, review_notes, created_by, created_at,
        profiles!tasks_assigned_to_fkey (id, full_name, avatar_url, phone_number)
      `)
      .eq('team_id', teamId)
      .order('deadline', { ascending: true, nullsFirst: false });

    // Fallback cerdas jika kolom assigned_to_ids belum dieksekusi di SQL Editor
    if (error && error.message.includes('assigned_to_ids')) {
      const fallbackRes = await supabase
        .from('tasks')
        .select(`
          id, team_id, title, description, task_link, assigned_to, deadline, status, completed_by, review_notes, created_by, created_at,
          profiles!tasks_assigned_to_fkey (id, full_name, avatar_url, phone_number)
        `)
        .eq('team_id', teamId)
        .order('deadline', { ascending: true, nullsFirst: false });
      data = fallbackRes.data as any;
      error = fallbackRes.error as any;
    }

    if (error || !data) return [];

    // Ambil seluruh profil anggota tim untuk me-resolve multiple assigned_to_ids
    const { data: membersData } = await supabase
      .from('team_members')
      .select('user_id, profiles (id, full_name, avatar_url, phone_number)')
      .eq('team_id', teamId);

    const profileMap: Record<string, Profile> = {};
    (membersData || []).forEach((m: any) => {
      if (m.profiles) {
        profileMap[m.user_id] = m.profiles;
      }
    });

    // Ambil hitungan komentar untuk tiap tugas
    const commentCountMap: Record<string, number> = {};
    try {
      const taskIds = data.map((t: any) => t.id);
      if (taskIds.length > 0) {
        const { data: commData } = await supabase
          .from('task_comments')
          .select('task_id')
          .in('task_id', taskIds);
        (commData || []).forEach((c: any) => {
          commentCountMap[c.task_id] = (commentCountMap[c.task_id] || 0) + 1;
        });
      }
    } catch {
      // Abaikan jika tabel belum dibuat
    }

    return data.map((t: any) => {
      const assignedIds: string[] = Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.length > 0
        ? t.assigned_to_ids
        : (t.assigned_to ? [t.assigned_to] : []);

      const assigneeProfiles: Profile[] = assignedIds
        .map(id => profileMap[id] || (id === t.assigned_to ? t.profiles : undefined))
        .filter((p): p is Profile => Boolean(p));

      const isMarkedReview = t.review_notes && t.review_notes.includes('[STATUS:REVIEW]');
      const effectiveStatus: TaskStatus = (t.status === 'review' || (isMarkedReview && t.status !== 'done')) ? 'review' : (t.status as TaskStatus);

      return {
        ...t,
        status: effectiveStatus,
        assigned_to_ids: assignedIds,
        assignee_profile: t.profiles || assigneeProfiles[0],
        assignee_profiles: assigneeProfiles.length > 0 ? assigneeProfiles : (t.profiles ? [t.profiles] : []),
        comments_count: commentCountMap[t.id] || 0,
      };
    }).sort((a, b) => {
      const aDone = a.status === 'done';
      const bDone = b.status === 'done';
      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  } else {
    const db = getDemoDb();
    return db.tasks
      .filter(t => t.team_id === teamId)
      .map(t => {
        const assignedIds: string[] = Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.length > 0
          ? t.assigned_to_ids
          : (t.assigned_to ? [t.assigned_to] : []);

        const assigneeProfiles: Profile[] = [];
        for (const id of assignedIds) {
          const u = db.users.find(user => user.id === id);
          if (u) {
            assigneeProfiles.push({
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              phone_number: u.phone_number,
            });
          }
        }

        const commentsCount = (db.task_comments || []).filter(c => c.task_id === t.id).length;
        const isMarkedReview = t.review_notes && t.review_notes.includes('[STATUS:REVIEW]');
        const effectiveStatus: TaskStatus = (t.status === 'review' || (isMarkedReview && t.status !== 'done')) ? 'review' : (t.status as TaskStatus);

        return {
          ...t,
          status: effectiveStatus,
          assigned_to_ids: assignedIds,
          assignee_profile: assigneeProfiles[0] || (t.assigned_to ? db.users.find(u => u.id === t.assigned_to) : undefined),
          assignee_profiles: assigneeProfiles,
          comments_count: commentsCount,
        };
      })
      .sort((a, b) => {
        const aDone = a.status === 'done';
        const bDone = b.status === 'done';
        if (!aDone && bDone) return -1;
        if (aDone && !bDone) return 1;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  }
}

export async function createTask(taskData: {
  team_id: string;
  title: string;
  description?: string;
  task_link?: string;
  assigned_to?: string;
  assigned_to_ids?: string[];
  deadline?: string;
  status: TaskStatus;
  created_by?: string;
  completed_by?: string;
}): Promise<{ task: Task | null; error: string | null }> {
  const assignedIds: string[] = Array.isArray(taskData.assigned_to_ids) && taskData.assigned_to_ids.length > 0
    ? taskData.assigned_to_ids.filter(id => Boolean(id && id.trim()))
    : (taskData.assigned_to && taskData.assigned_to.trim() ? [taskData.assigned_to.trim()] : []);

  const cleanData: any = {
    team_id: taskData.team_id,
    title: taskData.title.trim(),
    description: taskData.description?.trim() || '',
    task_link: taskData.task_link?.trim() || '',
    status: taskData.status || 'todo',
    review_notes: '',
    assigned_to: assignedIds[0] || null,
    assigned_to_ids: assignedIds,
  };

  if (taskData.deadline && taskData.deadline.trim()) {
    cleanData.deadline = taskData.deadline.trim();
  } else {
    cleanData.deadline = null;
  }

  if (taskData.created_by && taskData.created_by.trim()) {
    cleanData.created_by = taskData.created_by.trim();
  } else {
    cleanData.created_by = null;
  }

  if (taskData.completed_by && taskData.completed_by.trim()) {
    cleanData.completed_by = taskData.completed_by.trim();
  } else {
    cleanData.completed_by = null;
  }

  if (isSupabaseConfigured && supabase) {
    let { data, error } = await supabase
      .from('tasks')
      .insert(cleanData)
      .select()
      .single();

    // Fallback jika kolom assigned_to_ids belum ada di tabel Supabase
    if (error && error.message.includes('assigned_to_ids')) {
      const fallbackData = { ...cleanData };
      delete fallbackData.assigned_to_ids;
      const retryRes = await supabase.from('tasks').insert(fallbackData).select().single();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error('Error creating task in Supabase:', error);
      return { task: null, error: error.message };
    }
    return { task: data, error: null };
  } else {
    const db = getDemoDb();
    const newTask: Task = {
      id: 'task-' + Date.now(),
      ...cleanData,
      created_at: new Date().toISOString(),
    };
    db.tasks.push(newTask);
    saveDemoDb(db);
    return { task: newTask, error: null };
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<{ success: boolean; error: string | null }> {
  const cleanUpdates: any = { ...updates };

  if ('assigned_to_ids' in cleanUpdates && Array.isArray(cleanUpdates.assigned_to_ids)) {
    const ids = cleanUpdates.assigned_to_ids.filter(Boolean);
    cleanUpdates.assigned_to_ids = ids;
    cleanUpdates.assigned_to = ids[0] || null;
  } else if ('assigned_to' in cleanUpdates) {
    cleanUpdates.assigned_to = cleanUpdates.assigned_to && cleanUpdates.assigned_to.trim() ? cleanUpdates.assigned_to.trim() : null;
    if (cleanUpdates.assigned_to) {
      cleanUpdates.assigned_to_ids = [cleanUpdates.assigned_to];
    } else {
      cleanUpdates.assigned_to_ids = [];
    }
  }

  if ('deadline' in cleanUpdates) {
    cleanUpdates.deadline = cleanUpdates.deadline && cleanUpdates.deadline.trim() ? cleanUpdates.deadline.trim() : null;
  }
  if ('completed_by' in cleanUpdates) {
    cleanUpdates.completed_by = cleanUpdates.completed_by && cleanUpdates.completed_by.trim() ? cleanUpdates.completed_by.trim() : null;
  }
  if ('task_link' in cleanUpdates) {
    cleanUpdates.task_link = cleanUpdates.task_link?.trim() || '';
  }
  delete cleanUpdates.assignee_profile;
  delete cleanUpdates.assignee_profiles;
  delete cleanUpdates.profiles;
  delete cleanUpdates.id;
  delete cleanUpdates.comments_count;

  // 1. Selalu sinkronkan ke Demo DB di LocalStorage jika ada
  try {
    const db = getDemoDb();
    const idx = (db.tasks || []).findIndex(t => t.id === taskId);
    if (idx !== -1) {
      db.tasks[idx] = { ...db.tasks[idx], ...cleanUpdates };
      saveDemoDb(db);
    }
  } catch {
    // Abaikan jika tidak di browser
  }

  // 2. Prioritas 1: Kirim ke server API /api/tasks/update (Bypass RLS & tangani CHECK constraint database otomatis)
  if (typeof window !== 'undefined') {
    try {
      const apiRes = await fetch('/api/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, updates: cleanUpdates }),
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success) {
          return { success: true, error: null };
        }
      }
    } catch (apiErr) {
      console.warn('Server API /api/tasks/update tidak dapat dihubungi, fallback ke direct client update:', apiErr);
    }
  }

  // 3. Fallback Client Supabase jika API offline atau client-side fallback
  if (isSupabaseConfigured && supabase) {
    let { data, error } = await supabase
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', taskId)
      .select();

    // Fallback bertingkat jika database belum memiliki kolom tertentu atau error foreign key
    if (error) {
      console.warn('Supabase updateTask error:', error.message, 'Mencoba fallback bertingkat...');
      const fallbackUpdates = { ...cleanUpdates };

      if (error.message.includes('assigned_to_ids')) delete fallbackUpdates.assigned_to_ids;
      if (error.message.includes('review_notes')) delete fallbackUpdates.review_notes;
      if (error.message.includes('task_link')) delete fallbackUpdates.task_link;
      if (error.message.includes('completed_by') || error.message.toLowerCase().includes('foreign key')) delete fallbackUpdates.completed_by;

      const retryRes = await supabase.from('tasks').update(fallbackUpdates).eq('id', taskId).select();
      data = retryRes.data;
      error = retryRes.error;

      // Ultimate Fallback: Jika error karena CHECK constraint pada status 'review', gunakan bridge status
      if (error && (error.message.includes('check constraint') || error.message.includes('tasks_status_check')) && fallbackUpdates.status === 'review') {
        const bridgeRes = await supabase.from('tasks').update({
          ...fallbackUpdates,
          status: 'in_progress',
          review_notes: `[STATUS:REVIEW] ${fallbackUpdates.review_notes || ''}`.trim(),
        }).eq('id', taskId).select();
        data = bridgeRes.data;
        error = bridgeRes.error;
      } else if (error && fallbackUpdates.status) {
        const statusOnlyRes = await supabase.from('tasks').update({ status: fallbackUpdates.status }).eq('id', taskId).select();
        data = statusOnlyRes.data;
        error = statusOnlyRes.error;
      }
    }

    if (error) {
      console.error('Error updating task in Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } else {
    return { success: true, error: null };
  }
}

export async function updateTaskStatus(
  taskId: string, 
  status: TaskStatus, 
  completedBy?: string, 
  reviewNotes?: string,
  taskLink?: string
): Promise<boolean> {
  const updates: Partial<Task> = { status };
  // Hanya simpan completed_by jika tugas benar-benar ditandai 'done'
  if (status === 'done' && completedBy) {
    updates.completed_by = completedBy;
  }
  if (reviewNotes !== undefined) updates.review_notes = reviewNotes;
  if (taskLink !== undefined) updates.task_link = taskLink;

  const res = await updateTask(taskId, updates);
  return res.success;
}

// -------------------------------------------------------------
// TASK COMMENTS (Kolom Diskusi Tugas - 100% Hemat Kuota)
// -------------------------------------------------------------

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          id, task_id, user_id, content, created_at,
          profiles (id, full_name, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase task_comments error, using local fallback:', error.message);
        const db = getDemoDb();
        const comments = (db.task_comments || []).filter(c => c.task_id === taskId);
        return comments.map(c => {
          const u = db.users.find(user => user.id === c.user_id);
          return {
            ...c,
            author_profile: u ? { id: u.id, full_name: u.full_name, email: u.email } : undefined,
          };
        }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }

      if (!data) return [];
      return data.map((c: any) => ({
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        author_profile: c.profiles,
      }));
    } catch {
      const db = getDemoDb();
      return (db.task_comments || []).filter(c => c.task_id === taskId);
    }
  } else {
    const db = getDemoDb();
    const comments = (db.task_comments || []).filter(c => c.task_id === taskId);
    return comments.map(c => {
      const u = db.users.find(user => user.id === c.user_id);
      return {
        ...c,
        author_profile: u ? { id: u.id, full_name: u.full_name, email: u.email } : undefined,
      };
    }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
}

export async function addTaskComment(
  taskId: string,
  userId: string,
  content: string
): Promise<{ comment: TaskComment | null; error: string | null }> {
  const cleanContent = content.trim();
  if (!cleanContent) return { comment: null, error: 'Komentar tidak boleh kosong.' };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          content: cleanContent,
        })
        .select(`
          id, task_id, user_id, content, created_at,
          profiles (id, full_name, avatar_url)
        `)
        .single();

      if (error) {
        console.warn('Supabase task_comments not found or errored. Falling back to local storage:', error.message);
        const db = getDemoDb();
        if (!db.task_comments) db.task_comments = [];
        const newComment: TaskComment = {
          id: 'comm-' + Date.now() + Math.random().toString(36).slice(2, 6),
          task_id: taskId,
          user_id: userId,
          content: cleanContent,
          created_at: new Date().toISOString(),
        };
        db.task_comments.push(newComment);
        saveDemoDb(db);

        let authorProfile: Profile | undefined = undefined;
        try {
          const { data: prof } = await supabase.from('profiles').select('id, full_name, avatar_url, email').eq('id', userId).single();
          if (prof) authorProfile = prof;
        } catch {}
        if (!authorProfile) {
          const u = db.users.find(user => user.id === userId);
          if (u) authorProfile = { id: u.id, full_name: u.full_name, email: u.email };
        }

        return {
          comment: {
            ...newComment,
            author_profile: authorProfile,
          },
          error: null,
        };
      }

      return {
        comment: {
          id: data.id,
          task_id: data.task_id,
          user_id: data.user_id,
          content: data.content,
          created_at: data.created_at,
          author_profile: (data as any).profiles,
        },
        error: null,
      };
    } catch (err: any) {
      console.warn('Supabase task_comments catch error, falling back to local storage:', err);
      const db = getDemoDb();
      if (!db.task_comments) db.task_comments = [];
      const newComment: TaskComment = {
        id: 'comm-' + Date.now() + Math.random().toString(36).slice(2, 6),
        task_id: taskId,
        user_id: userId,
        content: cleanContent,
        created_at: new Date().toISOString(),
      };
      db.task_comments.push(newComment);
      saveDemoDb(db);
      return { comment: newComment, error: null };
    }
  } else {
    const db = getDemoDb();
    if (!db.task_comments) db.task_comments = [];
    const newComment: TaskComment = {
      id: 'comm-' + Date.now() + Math.random().toString(36).slice(2, 6),
      task_id: taskId,
      user_id: userId,
      content: cleanContent,
      created_at: new Date().toISOString(),
    };
    db.task_comments.push(newComment);
    saveDemoDb(db);
    const u = db.users.find(user => user.id === userId);
    return {
      comment: {
        ...newComment,
        author_profile: u ? { id: u.id, full_name: u.full_name, email: u.email } : undefined,
      },
      error: null,
    };
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS (Notifikasi In-App & Lonceng Web)
// -------------------------------------------------------------

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        const db = getDemoDb();
        return (db.notifications || []).filter(n => n.user_id === userId).slice(0, 30);
      }
      if (!data) return [];
      return data;
    } catch {
      const db = getDemoDb();
      return (db.notifications || []).filter(n => n.user_id === userId).slice(0, 30);
    }
  } else {
    const db = getDemoDb();
    return (db.notifications || [])
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link: string = '',
  teamId?: string
): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        team_id: teamId || null,
        title,
        message,
        link,
        is_read: false,
      });
      if (!error) return true;
    } catch {}
  }

  const db = getDemoDb();
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: 'notif-' + Date.now() + Math.random().toString(36).slice(2, 6),
    user_id: userId,
    team_id: teamId,
    title,
    message,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  saveDemoDb(db);
  return true;
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      return !error;
    } catch {
      return false;
    }
  } else {
    const db = getDemoDb();
    if (db.notifications) {
      const n = db.notifications.find(item => item.id === notificationId);
      if (n) {
        n.is_read = true;
        saveDemoDb(db);
      }
    }
    return true;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return !error;
    } catch {
      return false;
    }
  } else {
    const db = getDemoDb();
    if (db.notifications) {
      db.notifications.forEach(n => {
        if (n.user_id === userId) n.is_read = true;
      });
      saveDemoDb(db);
    }
    return true;
  }
}

// -------------------------------------------------------------
// REAL-TIME WHATSAPP NOTIFICATION HELPER (Async Background)
// -------------------------------------------------------------

export async function sendRealtimeWhatsAppNotification(
  phones: string[],
  message: string,
  teamToken?: string
): Promise<void> {
  const uniquePhones = Array.from(new Set(phones.filter(p => Boolean(p && p.trim()))));
  if (uniquePhones.length === 0) return;

  let tokenToUse = teamToken;
  if (!tokenToUse && typeof window !== 'undefined') {
    tokenToUse = localStorage.getItem('master_wa_token') || localStorage.getItem('timjuara_fonnte_token') || undefined;
  }

  for (const phone of uniquePhones) {
    sendTestWhatsAppMessage(phone, message, tokenToUse).catch(() => {});
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    return !error;
  } else {
    const db = getDemoDb();
    db.tasks = db.tasks.filter(t => t.id !== taskId);
    saveDemoDb(db);
    return true;
  }
}

// -------------------------------------------------------------
// RESEARCH / MATERIALS METHODS (100% Hemat Kuota via Drive/Link)
// -------------------------------------------------------------

export async function getTeamResearch(teamId: string): Promise<ResearchMaterial[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('research_materials')
      .select(`
        id, team_id, title, resource_url, resource_type, notes, uploaded_by, created_at,
        profiles!research_materials_uploaded_by_fkey (id, full_name, avatar_url)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((r: any) => ({
      ...r,
      uploader_profile: r.profiles,
    }));
  } else {
    const db = getDemoDb();
    return db.research
      .filter(r => r.team_id === teamId)
      .map(r => {
        const u = db.users.find(user => user.id === r.uploaded_by);
        return {
          ...r,
          uploader_profile: u ? { id: u.id, full_name: u.full_name } : undefined,
        };
      })
      .reverse();
  }
}

export async function addResearchMaterial(item: {
  team_id: string;
  title: string;
  resource_url: string;
  resource_type: ResourceType;
  notes?: string;
  uploaded_by?: string;
}): Promise<{ material: ResearchMaterial | null; error: string | null }> {
  const cleanItem: any = {
    team_id: item.team_id,
    title: item.title.trim(),
    resource_url: item.resource_url.trim(),
    resource_type: item.resource_type,
    notes: item.notes?.trim() || '',
    uploaded_by: item.uploaded_by && item.uploaded_by.trim() ? item.uploaded_by.trim() : null,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('research_materials')
      .insert(cleanItem)
      .select()
      .single();

    if (error) {
      console.error('Error adding research material in Supabase:', error);
      return { material: null, error: error.message };
    }
    return { material: data, error: null };
  } else {
    const db = getDemoDb();
    const newMaterial: ResearchMaterial = {
      id: 'res-' + Date.now(),
      ...cleanItem,
      created_at: new Date().toISOString(),
    };
    db.research.unshift(newMaterial);
    saveDemoDb(db);
    return { material: newMaterial, error: null };
  }
}

export async function updateResearchMaterial(
  id: string,
  updates: Partial<ResearchMaterial>
): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('research_materials')
      .update(updates)
      .eq('id', id);
    return !error;
  } else {
    const db = getDemoDb();
    const idx = db.research.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.research[idx] = { ...db.research[idx], ...updates };
      saveDemoDb(db);
      return true;
    }
    return false;
  }
}

export async function deleteResearchMaterial(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('research_materials').delete().eq('id', id);
    return !error;
  } else {
    const db = getDemoDb();
    db.research = db.research.filter(r => r.id !== id);
    saveDemoDb(db);
    return true;
  }
}

// -------------------------------------------------------------
// TEAM MEMBERS & ROLE MANAGEMENT (Ketua vs Anggota)
// -------------------------------------------------------------

export async function updateMemberRole(teamId: string, memberId: string, newRole: Role): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('team_id', teamId);
    return !error;
  } else {
    const db = getDemoDb();
    const member = db.members.find(m => m.id === memberId && m.team_id === teamId);
    if (member) {
      member.role = newRole;
      saveDemoDb(db);
      return true;
    }
    return false;
  }
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId);
    return !error;
  } else {
    const db = getDemoDb();
    db.members = db.members.filter(m => !(m.id === memberId && m.team_id === teamId));
    saveDemoDb(db);
    return true;
  }
}

// -------------------------------------------------------------
// CALCULATE TEAM CONTRIBUTION STATS (Leaderboard yang Akurat)
// -------------------------------------------------------------

export function calculateContributionStats(members: TeamMember[], tasks: Task[]): {
  contributions: MemberContribution[];
  totalTasks: number;
  completedTasks: number;
  inReviewTasks: number;
  overallProgress: number;
} {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inReviewTasks = tasks.filter(t => t.status === 'review').length;
  const overallProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const isSingleMemberTeam = members.length === 1;

  const contributions: MemberContribution[] = members.map(m => {
    const isAssigned = (t: Task) => {
      if (t.assigned_to === m.user_id) return true;
      if (t.assigned_to_ids && Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.includes(m.user_id)) return true;
      return false;
    };

    // Tugas yang selesai dihitung berdasarkan:
    // 1. t.completed_by === m.user_id
    // 2. ATAU isAssigned(t)
    // 3. ATAU jika hanya ada 1 member di tim, tugas selesai langsung diatribusikan ke member tersebut
    // 4. ATAU t.created_by === m.user_id jika assigned_to kosong
    const completed = tasks.filter(t => {
      if (t.status !== 'done') return false;
      if (t.completed_by) return t.completed_by === m.user_id;
      if (isAssigned(t)) return true;
      if (isSingleMemberTeam) return true;
      return t.created_by === m.user_id && !t.assigned_to;
    }).length;

    const inReview = tasks.filter(t => {
      if (t.status !== 'review') return false;
      if (t.completed_by) return t.completed_by === m.user_id;
      if (isAssigned(t)) return true;
      if (isSingleMemberTeam) return true;
      return false;
    }).length;

    const inProgress = tasks.filter(t => {
      if (t.status !== 'in_progress') return false;
      if (isAssigned(t)) return true;
      if (isSingleMemberTeam) return true;
      return false;
    }).length;

    const todo = tasks.filter(t => {
      if (t.status !== 'todo') return false;
      if (isAssigned(t)) return true;
      if (isSingleMemberTeam) return true;
      return false;
    }).length;

    const totalAssigned = tasks.filter(t => {
      if (isAssigned(t)) return true;
      if (t.completed_by === m.user_id) return true;
      if (isSingleMemberTeam) return true;
      return false;
    }).length;

    // Kontribusi terhadap total tugas selesai tim
    const contribution_percentage = completedTasks === 0 
      ? 0 
      : Math.round((completed / completedTasks) * 100);

    return {
      user_id: m.user_id,
      full_name: m.profile?.full_name || 'Anggota Tim',
      role: m.role,
      completed_count: completed,
      in_progress_count: inProgress,
      in_review_count: inReview,
      todo_count: todo,
      total_assigned: totalAssigned,
      contribution_percentage,
    };
  });

  // Urutkan dari yang paling banyak menyelesaikan tugas (Leaderboard)
  contributions.sort((a, b) => b.completed_count - a.completed_count || b.total_assigned - a.total_assigned);

  return {
    contributions,
    totalTasks,
    completedTasks,
    inReviewTasks,
    overallProgress,
  };
}

// -------------------------------------------------------------
// MASTER ADMIN METHODS (admin@gmail.com)
// -------------------------------------------------------------

export function isMasterAdmin(user: Profile | null): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === 'admin@gmail.com';
}

export async function getAdminStats(): Promise<AdminStats> {
  if (isSupabaseConfigured && supabase) {
    const [
      { count: usersCount },
      { count: teamsCount },
      { count: tasksCount },
      { count: researchCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('research_materials').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersCount || 0,
      totalTeams: teamsCount || 0,
      totalTasks: tasksCount || 0,
      totalResearch: researchCount || 0,
    };
  } else {
    const db = getDemoDb();
    return {
      totalUsers: db.users.length,
      totalTeams: db.teams.length,
      totalTasks: db.tasks.length,
      totalResearch: db.research.length,
    };
  }
}

export async function getAllTeamsForAdmin(): Promise<AdminTeamItem[]> {
  if (isSupabaseConfigured && supabase) {
    // 1. Fetch all teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*, profiles:created_by(full_name)')
      .order('created_at', { ascending: false });

    if (teamsError || !teamsData) return [];

    // 2. Fetch members and tasks to count per team
    const [{ data: membersData }, { data: tasksData }] = await Promise.all([
      supabase.from('team_members').select('team_id'),
      supabase.from('tasks').select('team_id'),
    ]);

    const memberCounts: Record<string, number> = {};
    (membersData || []).forEach((m: any) => {
      memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
    });

    const taskCounts: Record<string, number> = {};
    (tasksData || []).forEach((t: any) => {
      taskCounts[t.team_id] = (taskCounts[t.team_id] || 0) + 1;
    });

    // 3. Fetch fallback settings from system_settings
    const teamIds = teamsData.map((t: any) => t.id);
    const sysKeys: string[] = [];
    teamIds.forEach((id: string) => {
      sysKeys.push(`team_wa_group_${id}`, `team_wa_group_name_${id}`, `team_avatar_${id}`);
    });
    const { data: sysRes } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', sysKeys);

    const sysMap: Record<string, string> = {};
    (sysRes || []).forEach((item: any) => {
      if (item.value) sysMap[item.key] = item.value;
    });

    return teamsData.map((t: any) => {
      let wa_group_id: string | undefined = t.wa_group_id || sysMap[`team_wa_group_${t.id}`];
      let wa_group_name: string | undefined = t.wa_group_name || sysMap[`team_wa_group_name_${t.id}`];
      let avatar_url: string = t.avatar_url || sysMap[`team_avatar_${t.id}`] || '';
      if (!wa_group_id && typeof window !== 'undefined') {
        wa_group_id = localStorage.getItem('timjuara_team_wa_group_' + t.id) || undefined;
      }
      if (!wa_group_name && typeof window !== 'undefined') {
        wa_group_name = localStorage.getItem('timjuara_team_wa_group_name_' + t.id) || undefined;
      }
      if (!avatar_url && typeof window !== 'undefined') {
        avatar_url = localStorage.getItem('timjuara_team_avatar_' + t.id) || '';
      }
      return {
        id: t.id,
        name: t.name,
        username: t.username,
        description: t.description,
        avatar_url: avatar_url || '',
        created_by: t.created_by,
        created_at: t.created_at,
        wa_gateway_token: t.wa_gateway_token,
        wa_notifications_enabled: t.wa_notifications_enabled,
        wa_group_id: wa_group_id || undefined,
        wa_group_name: wa_group_name || undefined,
        creator_name: t.profiles?.full_name || 'Tidak Diketahui',
        member_count: memberCounts[t.id] || 0,
        task_count: taskCounts[t.id] || 0,
      };
    });
  } else {
    const db = getDemoDb();
    return db.teams.map((t) => {
      const creator = db.users.find((u) => u.id === t.created_by);
      const memberCount = db.members.filter((m) => m.team_id === t.id).length;
      const taskCount = db.tasks.filter((tk) => tk.team_id === t.id).length;
      let wa_group_id = t.wa_group_id;
      let wa_group_name = t.wa_group_name;
      if (!wa_group_id && typeof window !== 'undefined') {
        wa_group_id = localStorage.getItem('timjuara_team_wa_group_' + t.id) || undefined;
      }
      if (!wa_group_name && typeof window !== 'undefined') {
        wa_group_name = localStorage.getItem('timjuara_team_wa_group_name_' + t.id) || undefined;
      }

      return {
        ...t,
        wa_group_id: wa_group_id || undefined,
        wa_group_name: wa_group_name || undefined,
        creator_name: creator?.full_name || 'Tidak Diketahui',
        member_count: memberCount,
        task_count: taskCount,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function getAllUsersForAdmin(): Promise<AdminUserItem[]> {
  if (isSupabaseConfigured && supabase) {
    const [{ data: profilesData, error: profilesError }, { data: membersData }, { data: teamsData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('user_id, team_id'),
      supabase.from('teams').select('id, name'),
    ]);

    if (profilesError || !profilesData) return [];

    const teamMap: Record<string, string> = {};
    (teamsData || []).forEach((t: any) => {
      teamMap[t.id] = t.name;
    });

    const userTeamsMap: Record<string, string[]> = {};
    const userTeamIdsMap: Record<string, string[]> = {};
    (membersData || []).forEach((m: any) => {
      if (!userTeamsMap[m.user_id]) userTeamsMap[m.user_id] = [];
      if (!userTeamIdsMap[m.user_id]) userTeamIdsMap[m.user_id] = [];
      if (teamMap[m.team_id]) {
        userTeamsMap[m.user_id].push(teamMap[m.team_id]);
        userTeamIdsMap[m.user_id].push(m.team_id);
      }
    });

    return profilesData.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email || '',
      avatar_url: p.avatar_url,
      phone_number: p.phone_number || '',
      created_at: p.created_at,
      teams_joined: userTeamsMap[p.id] || [],
      team_ids: userTeamIdsMap[p.id] || [],
    }));
  } else {
    const db = getDemoDb();
    return db.users.map((u) => {
      const userMemberRows = db.members.filter((m) => m.user_id === u.id);
      const teamsJoined = userMemberRows
        .map((m) => db.teams.find((t) => t.id === m.team_id)?.name)
        .filter((name): name is string => Boolean(name));
      const teamIds = userMemberRows.map((m) => m.team_id);

      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone_number: u.phone_number || '',
        teams_joined: teamsJoined,
        team_ids: teamIds,
      };
    });
  }
}

export async function updateUserByMasterAdmin(params: {
  userId: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  teamIds?: string[];
}): Promise<{ success: boolean; error: string | null }> {
  if (params.fullName !== undefined && !params.fullName.trim()) {
    return { success: false, error: 'Nama lengkap tidak boleh kosong.' };
  }

  const cleanName = params.fullName !== undefined ? params.fullName.trim() : undefined;
  const cleanEmail = params.email !== undefined ? params.email.trim().toLowerCase() : undefined;
  const cleanPhone = params.phoneNumber !== undefined ? params.phoneNumber.trim() : undefined;
  const cleanPassword = params.password !== undefined ? params.password.trim() : undefined;

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Panggil API Route untuk Auth & Password
      await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: params.userId,
          fullName: cleanName,
          email: cleanEmail,
          phoneNumber: cleanPhone,
          password: cleanPassword || undefined,
        }),
      }).catch(() => {});

      // 2. Pastikan tabel profiles selalu terupdate langsung untuk field yang diubah
      const profileUpdates: any = {};
      if (cleanName !== undefined) profileUpdates.full_name = cleanName;
      if (cleanEmail !== undefined) profileUpdates.email = cleanEmail;
      if (cleanPhone !== undefined) profileUpdates.phone_number = cleanPhone;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', params.userId);

        if (profileError) {
          console.warn('Profile direct update error:', profileError.message);
        }
      }

      // 3. Update keanggotaan tim (team_members) jika teamIds disertakan
      if (params.teamIds !== undefined) {
        const { data: currentMemberships } = await supabase
          .from('team_members')
          .select('id, team_id')
          .eq('user_id', params.userId);

        const currentTeamIds = new Set((currentMemberships || []).map((m: any) => m.team_id));
        const targetTeamIds = new Set(params.teamIds);

        // Tim yang perlu dicabut/dihapus
        const toRemove = (currentMemberships || []).filter((m: any) => !targetTeamIds.has(m.team_id));
        for (const m of toRemove) {
          await supabase.from('team_members').delete().eq('id', m.id);
        }

        // Tim yang perlu ditambahkan
        const toAdd = params.teamIds.filter((tId) => !currentTeamIds.has(tId));
        for (const tId of toAdd) {
          await supabase.from('team_members').insert({
            user_id: params.userId,
            team_id: tId,
            role: 'anggota',
          });
        }
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memperbarui data pengguna.' };
    }
  } else {
    // Mode offline / demo
    const db = getDemoDb();
    const user = db.users.find((u) => u.id === params.userId);
    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    if (cleanName !== undefined) user.full_name = cleanName;
    if (cleanEmail !== undefined) user.email = cleanEmail;
    if (cleanPhone !== undefined) user.phone_number = cleanPhone;
    if (cleanPassword !== undefined && cleanPassword) user.password = cleanPassword;

    // Kelola tim jika teamIds dikirim
    if (params.teamIds !== undefined) {
      db.members = db.members.filter(
        (m) => !(m.user_id === params.userId && !params.teamIds!.includes(m.team_id))
      );

      const existingTeamIds = new Set(
        db.members.filter((m) => m.user_id === params.userId).map((m) => m.team_id)
      );

      for (const tId of params.teamIds) {
        if (!existingTeamIds.has(tId)) {
          db.members.push({
            id: 'm-' + Date.now() + Math.random().toString(36).slice(2, 6),
            team_id: tId,
            user_id: params.userId,
            role: 'anggota',
            joined_at: new Date().toISOString(),
          });
        }
      }
    }

    saveDemoDb(db);

    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) {
        const p: Profile = JSON.parse(raw);
        if (p.id === params.userId) {
          if (cleanName !== undefined) p.full_name = cleanName;
          if (cleanEmail !== undefined) p.email = cleanEmail;
          if (cleanPhone !== undefined) p.phone_number = cleanPhone;
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(p));
        }
      }
    }

    return { success: true, error: null };
  }
}

export async function deleteTeamByAdmin(teamId: string): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    db.teams = db.teams.filter((t) => t.id !== teamId);
    db.members = db.members.filter((m) => m.team_id !== teamId);
    db.tasks = db.tasks.filter((tk) => tk.team_id !== teamId);
    db.research = db.research.filter((r) => r.team_id !== teamId);
    saveDemoDb(db);
    return { success: true, error: null };
  }
}

export async function deleteUserByAdmin(userId: string): Promise<{ success: boolean; error: string | null }> {
  const adminEmail = 'admin@gmail.com';

  if (isSupabaseConfigured && supabase) {
    // Cek agar tidak menghapus master admin
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
    if (profile?.email?.toLowerCase() === adminEmail) {
      return { success: false, error: 'Akun Master Admin tidak dapat dihapus.' };
    }

    // Hapus keanggotaan dan profil pengguna
    await supabase.from('team_members').delete().eq('user_id', userId);
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) return { success: false, error: error.message };

    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    const user = db.users.find((u) => u.id === userId);
    if (user?.email?.toLowerCase() === adminEmail) {
      return { success: false, error: 'Akun Master Admin tidak dapat dihapus.' };
    }

    db.users = db.users.filter((u) => u.id !== userId);
    db.members = db.members.filter((m) => m.user_id !== userId);
    db.tasks.forEach((t) => {
      if (t.assigned_to === userId) t.assigned_to = undefined;
      if (t.completed_by === userId) t.completed_by = undefined;
      if (t.created_by === userId) t.created_by = undefined;
    });
    saveDemoDb(db);
    return { success: true, error: null };
  }
}

export async function deleteMultipleTeamsByAdmin(teamIds: string[]): Promise<{ success: boolean; count: number; error: string | null }> {
  if (teamIds.length === 0) return { success: true, count: 0, error: null };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('teams').delete().in('id', teamIds);
    if (error) return { success: false, count: 0, error: error.message };
    return { success: true, count: teamIds.length, error: null };
  } else {
    const db = getDemoDb();
    const idSet = new Set(teamIds);
    db.teams = db.teams.filter((t) => !idSet.has(t.id));
    db.members = db.members.filter((m) => !idSet.has(m.team_id));
    db.tasks = db.tasks.filter((tk) => !idSet.has(tk.team_id));
    db.research = db.research.filter((r) => !idSet.has(r.team_id));
    saveDemoDb(db);
    return { success: true, count: teamIds.length, error: null };
  }
}

export async function deleteMultipleUsersByAdmin(userIds: string[]): Promise<{ success: boolean; count: number; error: string | null }> {
  const adminEmail = 'admin@gmail.com';
  if (userIds.length === 0) return { success: true, count: 0, error: null };

  if (isSupabaseConfigured && supabase) {
    // Cari akun admin untuk dihindari dari penghapusan
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', adminEmail);

    const adminIds = new Set((adminProfiles || []).map((p: any) => p.id));
    const safeUserIds = userIds.filter((id) => !adminIds.has(id));

    if (safeUserIds.length === 0) {
      return { success: false, count: 0, error: 'Tidak ada pengguna valid yang dapat dihapus (Akun Master Admin dilindungi).' };
    }

    await supabase.from('team_members').delete().in('user_id', safeUserIds);
    const { error } = await supabase.from('profiles').delete().in('id', safeUserIds);
    if (error) return { success: false, count: 0, error: error.message };

    return { success: true, count: safeUserIds.length, error: null };
  } else {
    const db = getDemoDb();
    const adminUser = db.users.find((u) => u.email.toLowerCase() === adminEmail);
    const safeUserIds = userIds.filter((id) => id !== adminUser?.id);
    const idSet = new Set(safeUserIds);

    db.users = db.users.filter((u) => !idSet.has(u.id));
    db.members = db.members.filter((m) => !idSet.has(m.user_id));
    db.tasks.forEach((t) => {
      if (t.assigned_to && idSet.has(t.assigned_to)) t.assigned_to = undefined;
      if (t.completed_by && idSet.has(t.completed_by)) t.completed_by = undefined;
      if (t.created_by && idSet.has(t.created_by)) t.created_by = undefined;
    });
    saveDemoDb(db);
    return { success: true, count: safeUserIds.length, error: null };
  }
}

// ==========================================
// AI ENGINE HELPERS (TIMJUARA AI)
// ==========================================

export interface AITeamDigest {
  health: 'healthy' | 'warning' | 'critical';
  healthLabel: string;
  completionRate: number;
  summary: string;
  bottlenecks: string[];
  highlights: string[];
  advice: string;
}

export interface AIPersonalFocus {
  priorityTaskId?: string;
  priorityTaskTitle?: string;
  focusReason: string;
  actionAdvice: string;
  urgency: 'high' | 'medium' | 'normal';
}

export interface AISubtask {
  title: string;
  description: string;
  estimatedDays: number;
  suggestedRole: string;
}

export interface AITaskBreakdown {
  subtasks: AISubtask[];
  definitionOfDone: string[];
}

export async function getAITeamDigest(
  teamName: string,
  tasks: any[],
  members: any[],
  userTeams?: any[]
): Promise<{ success: boolean; data?: AITeamDigest; error?: string }> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'overview_standup',
        teamName,
        tasks,
        members,
        userTeams,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Gagal menghasilkan analisis AI.' };
    }
    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Kesalahan jaringan saat memproses AI.' };
  }
}

export async function getAIPersonalFocus(
  userName: string,
  userTasks: any[],
  teamName: string
): Promise<{ success: boolean; data?: AIPersonalFocus; error?: string }> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'personal_focus',
        userName,
        userTasks,
        teamName,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Gagal menghasilkan fokus personal.' };
    }
    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Kesalahan jaringan saat memproses fokus personal.' };
  }
}

export async function breakdownTaskWithAI(
  taskTitle: string,
  taskDesc?: string
): Promise<{ success: boolean; data?: AITaskBreakdown; error?: string }> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'breakdown_tasks',
        taskTitle,
        taskDesc,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Gagal memecah tugas dengan AI.' };
    }
    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Kesalahan jaringan saat memecah tugas.' };
  }
}

export async function testGeminiAPIKey(
  apiKey: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test_connection',
        apiKey,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Gagal terhubung ke Google Gemini.' };
    }
    return { success: true, message: result.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Kesalahan jaringan saat tes Gemini.' };
  }
}

export async function saveGeminiApiKey(apiKey: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    if (apiKey.trim()) {
      localStorage.setItem('master_gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('master_gemini_api_key');
    }
  }

  try {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('system_settings').upsert([
        { key: 'gemini_api_key', value: apiKey.trim(), updated_at: new Date().toISOString() },
      ]);
    }
    return true;
  } catch (e) {
    console.warn('Gagal simpan gemini_api_key ke Supabase:', e);
    return false;
  }
}

export async function getStoredGeminiApiKey(): Promise<string> {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('master_gemini_api_key');
    if (local) return local;
  }

  try {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'gemini_api_key')
        .maybeSingle();
      if (data?.value) return data.value;
    }
  } catch (e) {}

  return '';
}



