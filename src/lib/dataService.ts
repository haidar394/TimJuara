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
} from './types';

// Mock Seed Data untuk Pengguna yang baru pertama mencoba tanpa konfigurasi Supabase
const DEMO_USER_KEY = 'timku_demo_current_user';
const DEMO_DATA_KEY = 'timku_demo_database';

interface DemoDatabase {
  users: Array<{ id: string; email: string; full_name: string; password?: string }>;
  teams: Team[];
  members: TeamMember[];
  tasks: Task[];
  research: ResearchMaterial[];
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
    };
  } else {
    // Mode Demo Lokal
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }
}

export async function signUpUser(fullName: string, email: string, password: string): Promise<{ user: Profile | null; error: string | null; needsEmailConfirmation?: boolean }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
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

    const needsEmailConfirmation = !data.session;

    return {
      user: {
        id: data.user.id,
        full_name: fullName,
        email,
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
    };
    db.users.push(newUser);
    saveDemoDb(db);

    const profile: Profile = { id: newUser.id, full_name: newUser.full_name, email: newUser.email };
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

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_USER_KEY);
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

    return teamsWithRole.map(({ team, role }) => ({
      ...team,
      user_role: role,
      member_count: memberCounts[team.id] || 1,
      task_count: taskCounts[team.id] || 0,
    }));
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
      .filter(Boolean) as UserTeamItem[];
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

    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id, team_id, user_id, role, joined_at,
        profiles (id, full_name, avatar_url)
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
        .select('id, full_name, avatar_url')
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

// -------------------------------------------------------------
// TASKS METHODS
// -------------------------------------------------------------

export async function getTeamTasks(teamId: string): Promise<Task[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id, team_id, title, description, assigned_to, deadline, status, created_by, created_at,
        profiles!tasks_assigned_to_fkey (id, full_name, avatar_url)
      `)
      .eq('team_id', teamId)
      .order('deadline', { ascending: true, nullsFirst: false });

    if (error || !data) return [];
    return data.map((t: any) => ({
      ...t,
      assignee_profile: t.profiles,
    }));
  } else {
    const db = getDemoDb();
    return db.tasks
      .filter(t => t.team_id === teamId)
      .map(t => {
        const u = db.users.find(user => user.id === t.assigned_to);
        return {
          ...t,
          assignee_profile: u ? { id: u.id, full_name: u.full_name } : undefined,
        };
      })
      .sort((a, b) => {
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
  deadline?: string;
  status: TaskStatus;
  created_by?: string;
  completed_by?: string;
}): Promise<{ task: Task | null; error: string | null }> {
  const cleanData: any = {
    team_id: taskData.team_id,
    title: taskData.title.trim(),
    description: taskData.description?.trim() || '',
    task_link: taskData.task_link?.trim() || '',
    status: taskData.status || 'todo',
    review_notes: '',
  };

  if (taskData.assigned_to && taskData.assigned_to.trim()) {
    cleanData.assigned_to = taskData.assigned_to.trim();
  } else {
    cleanData.assigned_to = null;
  }

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

    // Fallback cerdas: Jika skema tabel tasks di Supabase belum memiliki kolom review (completed_by / review_notes / task_link),
    // otomatis retry dengan menyisipkan hanya kolom-kolom inti agar penambahan tugas tidak gagal!
    if (error && (
      error.message.includes('completed_by') || 
      error.message.includes('review_notes') || 
      error.message.includes('task_link')
    )) {
      const fallbackData: any = {
        team_id: cleanData.team_id,
        title: cleanData.title,
        description: cleanData.description,
        status: cleanData.status,
        assigned_to: cleanData.assigned_to,
        deadline: cleanData.deadline,
        created_by: cleanData.created_by,
      };

      const retryRes = await supabase
        .from('tasks')
        .insert(fallbackData)
        .select()
        .single();

      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      }
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
  if ('assigned_to' in cleanUpdates) {
    cleanUpdates.assigned_to = cleanUpdates.assigned_to && cleanUpdates.assigned_to.trim() ? cleanUpdates.assigned_to.trim() : null;
  }
  if ('deadline' in cleanUpdates) {
    cleanUpdates.deadline = cleanUpdates.deadline && cleanUpdates.deadline.trim() ? cleanUpdates.deadline.trim() : null;
  }
  if ('completed_by' in cleanUpdates) {
    cleanUpdates.completed_by = cleanUpdates.completed_by && cleanUpdates.completed_by.trim() ? cleanUpdates.completed_by.trim() : null;
  }
  delete cleanUpdates.assignee_profile;
  delete cleanUpdates.profiles;
  delete cleanUpdates.id;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task in Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } else {
    const db = getDemoDb();
    const idx = db.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      db.tasks[idx] = { ...db.tasks[idx], ...cleanUpdates };
      saveDemoDb(db);
      return { success: true, error: null };
    }
    return { success: false, error: 'Tugas tidak ditemukan' };
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
  if (completedBy) updates.completed_by = completedBy;
  if (reviewNotes !== undefined) updates.review_notes = reviewNotes;
  if (taskLink !== undefined) updates.task_link = taskLink;

  const res = await updateTask(taskId, updates);
  return res.success;
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
    // Tugas yang selesai dihitung berdasarkan:
    // 1. t.completed_by === m.user_id
    // 2. ATAU t.assigned_to === m.user_id
    // 3. ATAU jika hanya ada 1 member di tim, tugas selesai langsung diatribusikan ke member tersebut
    // 4. ATAU t.created_by === m.user_id jika assigned_to kosong
    const completed = tasks.filter(t => {
      if (t.status !== 'done') return false;
      if (t.completed_by) return t.completed_by === m.user_id;
      if (t.assigned_to) return t.assigned_to === m.user_id;
      if (isSingleMemberTeam) return true;
      return t.created_by === m.user_id;
    }).length;

    const inReview = tasks.filter(t => {
      if (t.status !== 'review') return false;
      if (t.completed_by) return t.completed_by === m.user_id;
      if (t.assigned_to) return t.assigned_to === m.user_id;
      if (isSingleMemberTeam) return true;
      return false;
    }).length;

    const inProgress = tasks.filter(t => {
      if (t.status !== 'in_progress') return false;
      if (t.assigned_to) return t.assigned_to === m.user_id;
      if (isSingleMemberTeam) return true;
      return false;
    }).length;

    const todo = tasks.filter(t => {
      if (t.status !== 'todo') return false;
      if (t.assigned_to) return t.assigned_to === m.user_id;
      if (isSingleMemberTeam) return true;
      return false;
    }).length;

    const totalAssigned = tasks.filter(t => {
      if (t.assigned_to === m.user_id) return true;
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

    return teamsData.map((t: any) => ({
      id: t.id,
      name: t.name,
      username: t.username,
      description: t.description,
      created_by: t.created_by,
      created_at: t.created_at,
      creator_name: t.profiles?.full_name || 'Tidak Diketahui',
      member_count: memberCounts[t.id] || 0,
      task_count: taskCounts[t.id] || 0,
    }));
  } else {
    const db = getDemoDb();
    return db.teams.map((t) => {
      const creator = db.users.find((u) => u.id === t.created_by);
      const memberCount = db.members.filter((m) => m.team_id === t.id).length;
      const taskCount = db.tasks.filter((tk) => tk.team_id === t.id).length;

      return {
        ...t,
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
    (membersData || []).forEach((m: any) => {
      if (!userTeamsMap[m.user_id]) userTeamsMap[m.user_id] = [];
      if (teamMap[m.team_id]) userTeamsMap[m.user_id].push(teamMap[m.team_id]);
    });

    return profilesData.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email || '',
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      teams_joined: userTeamsMap[p.id] || [],
    }));
  } else {
    const db = getDemoDb();
    return db.users.map((u) => {
      const userMemberRows = db.members.filter((m) => m.user_id === u.id);
      const teamsJoined = userMemberRows
        .map((m) => db.teams.find((t) => t.id === m.team_id)?.name)
        .filter((name): name is string => Boolean(name));

      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        teams_joined: teamsJoined,
      };
    });
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


