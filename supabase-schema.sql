-- ==============================================================================
-- SKRIP DATABASE SUPABASE UNTUK WEBSITE PENGELOLA TIM LOMBA / KERJA KELOMPOK
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda (Database -> SQL Editor -> New Query)

-- 1. Enable extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Profil Pengguna (otomatis terisi saat user register di auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger untuk membuat row di public.profiles otomatis saat akun terdaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone_number)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'phone_number', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = CASE WHEN EXCLUDED.phone_number <> '' THEN EXCLUDED.phone_number ELSE public.profiles.phone_number END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger ke auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Tabel Tim
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL, -- Kode unik tim untuk bergabung (misal: tim-garuda-2026)
    description TEXT DEFAULT '',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teams_username ON public.teams(username);


-- 4. Tabel Anggota Tim (Team Members) & Role (Ketua / Anggota)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('ketua', 'anggota')) DEFAULT 'anggota',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);


-- 5. Tabel Tugas & Deadline (Tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    task_link TEXT DEFAULT '', -- Tautan hasil pengerjaan (Google Drive / Docs / Figma)
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT DEFAULT '', -- Catatan saat pengajuan review / catatan revisi
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Pastikan kolom baru tetap ada jika tabel tasks dibuat dari skrip versi lama
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_link TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS review_notes TEXT DEFAULT '';


-- 6. Tabel Materi & Hasil Riset (100% Hemat Kuota via Google Drive / Link)
CREATE TABLE IF NOT EXISTS public.research_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    resource_url TEXT NOT NULL, -- Tautan Google Drive, Docs, Sheets, Slide, Figma, dll.
    resource_type TEXT NOT NULL DEFAULT 'drive' CHECK (resource_type IN ('drive', 'docs', 'sheets', 'slides', 'figma', 'link')),
    notes TEXT DEFAULT '',      -- Catatan penting mengenai materi/riset tersebut
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_team_id ON public.research_materials(team_id);


-- 7. Atur Keamanan RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_materials ENABLE ROW LEVEL SECURITY;

-- Policy Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policy Teams
DROP POLICY IF EXISTS "Teams viewable by anyone authenticated" ON public.teams;
CREATE POLICY "Teams viewable by anyone authenticated"
ON public.teams FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Team leader can update team" ON public.teams;
CREATE POLICY "Team leader can update team"
ON public.teams FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'ketua'
    )
);

-- Policy Team Members (Non-recursive to prevent Postgres infinite recursion error 42P17)
DROP POLICY IF EXISTS "Members viewable by team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members viewable by authenticated users" ON public.team_members;
CREATE POLICY "Team members viewable by authenticated users"
ON public.team_members FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert themselves to team" ON public.team_members;
CREATE POLICY "Users can insert themselves to team"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team leader can update member role" ON public.team_members;
CREATE POLICY "Team leader can update member role"
ON public.team_members FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = team_members.team_id
        AND teams.created_by = auth.uid()
    )
);

DROP POLICY IF EXISTS "Team leader can delete members or user can leave" ON public.team_members;
CREATE POLICY "Team leader can delete members or user can leave"
ON public.team_members FOR DELETE TO authenticated
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = team_members.team_id
        AND teams.created_by = auth.uid()
    )
);

-- Policy Tasks
DROP POLICY IF EXISTS "Tasks viewable by team members" ON public.tasks;
CREATE POLICY "Tasks viewable by team members"
ON public.tasks FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = tasks.team_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = tasks.team_id
        AND teams.created_by = auth.uid()
    )
    OR
    ((auth.jwt() ->> 'email') = 'admin@gmail.com')
);

DROP POLICY IF EXISTS "Tasks insertable by team members" ON public.tasks;
CREATE POLICY "Tasks insertable by team members"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = tasks.team_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = tasks.team_id
        AND teams.created_by = auth.uid()
    )
    OR
    ((auth.jwt() ->> 'email') = 'admin@gmail.com')
);

DROP POLICY IF EXISTS "Tasks updatable by team members" ON public.tasks;
CREATE POLICY "Tasks updatable by team members"
ON public.tasks FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = tasks.team_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = tasks.team_id
        AND teams.created_by = auth.uid()
    )
    OR
    ((auth.jwt() ->> 'email') = 'admin@gmail.com')
);

DROP POLICY IF EXISTS "Tasks deletable by team members" ON public.tasks;
CREATE POLICY "Tasks deletable by team members"
ON public.tasks FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = tasks.team_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = tasks.team_id
        AND teams.created_by = auth.uid()
    )
    OR
    ((auth.jwt() ->> 'email') = 'admin@gmail.com')
);

-- Policy Research Materials
DROP POLICY IF EXISTS "Research viewable by team members" ON public.research_materials;
CREATE POLICY "Research viewable by team members"
ON public.research_materials FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = research_materials.team_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = research_materials.team_id
        AND teams.created_by = auth.uid()
    )
    OR
    ((auth.jwt() ->> 'email') = 'admin@gmail.com')
);

DROP POLICY IF EXISTS "Research insertable by team members" ON public.research_materials;
CREATE POLICY "Research insertable by team members"
ON public.research_materials FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = research_materials.team_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = research_materials.team_id
        AND teams.created_by = auth.uid()
    )
    OR
    ((auth.jwt() ->> 'email') = 'admin@gmail.com')
);

DROP POLICY IF EXISTS "Research deletable by team members" ON public.research_materials;
CREATE POLICY "Research deletable by team members"
ON public.research_materials FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = research_materials.team_id
        AND team_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = research_materials.team_id
        AND teams.created_by = auth.uid()
    )
    OR
    ((auth.jwt() ->> 'email') = 'admin@gmail.com')
);

-- ==============================================================================
-- 8. KEBIJAKAN KHUSUS MASTER ADMIN (admin@gmail.com / masteradmin)
-- ==============================================================================
-- Memberikan hak akses penuh kepada admin@gmail.com untuk memantau dan menghapus tim / pengguna

-- Master Admin dapat menghapus tim mana pun
DROP POLICY IF EXISTS "Master admin can delete any team" ON public.teams;
CREATE POLICY "Master admin can delete any team"
ON public.teams FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@gmail.com');

-- Master Admin dapat melihat seluruh anggota dari seluruh tim
DROP POLICY IF EXISTS "Master admin can view all team members" ON public.team_members;
CREATE POLICY "Master admin can view all team members"
ON public.team_members FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@gmail.com');

-- Master Admin dapat menghapus relasi anggota tim mana pun
DROP POLICY IF EXISTS "Master admin can delete any team member" ON public.team_members;
CREATE POLICY "Master admin can delete any team member"
ON public.team_members FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@gmail.com');

-- Master Admin dapat menghapus profil pengguna mana pun
DROP POLICY IF EXISTS "Master admin can delete any profile" ON public.profiles;
CREATE POLICY "Master admin can delete any profile"
ON public.profiles FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@gmail.com');


-- ==============================================================================
-- 9. SETUP & AKTIVASI AKUN MASTER ADMIN (admin@gmail.com / masteradmin)
-- ==============================================================================
-- Jalankan bagian ini di SQL Editor untuk langsung mengaktifkan akun Master Admin
-- tanpa perlu menunggu konfirmasi email.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_admin_id UUID := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com') THEN
    -- Jika sudah pernah dibuat tapi belum aktif/terkonfirmasi, aktifkan langsung
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        encrypted_password = crypt('masteradmin', gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('full_name', 'Master Admin TimJuara'),
        updated_at = now()
    WHERE email = 'admin@gmail.com';
  ELSE
    -- Jika belum ada di auth.users, buat akun langsung terkonfirmasi (instant confirmed)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at,
      confirmation_token
    )
    VALUES (
      new_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@gmail.com',
      crypt('masteradmin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Master Admin TimJuara"}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now(),
      ''
    );
  END IF;

  -- Pastikan profil Master Admin tercatat di public.profiles
  INSERT INTO public.profiles (id, full_name)
  SELECT id, 'Master Admin TimJuara'
  FROM auth.users
  WHERE email = 'admin@gmail.com'
  ON CONFLICT (id) DO UPDATE SET full_name = 'Master Admin TimJuara';
END $$;


-- ==============================================================================
-- 9. MIGRASI: NOTIFIKASI WHATSAPP & FONNTE GATEWAY
-- ==============================================================================
-- Jalankan bagian ini di SQL Editor Supabase untuk mengaktifkan kolom nomor WhatsApp:

-- Kolom nomor telepon / WhatsApp pada profil anggota
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';

-- Kolom konfigurasi bot WhatsApp Fonnte pada tim
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_gateway_token TEXT DEFAULT '';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS wa_notifications_enabled BOOLEAN DEFAULT true;

-- Update trigger handle_new_user agar otomatis menangkap phone_number saat pendaftaran baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone_number)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'phone_number', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = CASE WHEN EXCLUDED.phone_number <> '' THEN EXCLUDED.phone_number ELSE public.profiles.phone_number END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 10. TABEL SYSTEM_SETTINGS (PENGATURAN GLOBAL MASTER ADMIN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read system settings" ON public.system_settings;
CREATE POLICY "Public read system settings"
ON public.system_settings FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Master admin manage system settings" ON public.system_settings;
CREATE POLICY "Master admin manage system settings"
ON public.system_settings FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'admin@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'admin@gmail.com');
