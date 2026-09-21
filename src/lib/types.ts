export type Role = 'ketua' | 'anggota';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type ResourceType = 'drive' | 'docs' | 'sheets' | 'slides' | 'figma' | 'link';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string; // Nomor WhatsApp (contoh: 08123456789 atau 628123456789)
  created_at?: string;
  read_comments?: Record<string, number>;
  time_tracker?: Record<string, { seconds: number; isRunning?: boolean; updatedAt?: string }>;
}

export interface Team {
  id: string;
  name: string;
  username: string; // unik, contoh: tim-garuda-2026
  description?: string;
  avatar_url?: string; // Foto profil / logo tim
  created_by?: string;
  created_at: string;
  wa_gateway_token?: string; // Token API Fonnte tim
  wa_notifications_enabled?: boolean; // Status aktif notifikasi bot WhatsApp
  wa_group_id?: string; // ID grup WhatsApp tim (misal: 120363028391823901@g.us)
  wa_group_name?: string; // Nama grup WhatsApp tim (misal: Tim Garuda 2026 Official)
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  profile?: Profile;
}

export interface Task {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  task_link?: string; // Tautan hasil tugas (Google Docs, Drive, Figma, dll)
  assigned_to?: string; // PIC Utama (untuk kompatibilitas)
  assigned_to_ids?: string[]; // Seluruh ID anggota yang ditugaskan (Multi-PIC)
  deadline?: string; // ISO date string
  status: TaskStatus;
  completed_by?: string; // ID anggota yang menyelesaikan tugas
  review_notes?: string; // Catatan dari anggota saat mengajukan review atau catatan revisi dari ketua
  created_by?: string;
  created_at: string;
  assignee_profile?: Profile;
  assignee_profiles?: Profile[]; // Daftar seluruh profil PIC
  completed_by_profile?: Profile;
  comments_count?: number;
  last_comment_user_id?: string;
  last_comment_at?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_profile?: Profile;
}

export interface AppNotification {
  id: string;
  user_id: string;
  team_id?: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ResearchMaterial {
  id: string;
  team_id: string;
  title: string;
  resource_url: string; // Tautan Google Drive / Docs / Slide / Figma / dll.
  resource_type: ResourceType;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
  uploader_profile?: Profile;
}

export interface MemberContribution {
  user_id: string;
  full_name: string;
  role: Role;
  completed_count: number;
  in_progress_count: number;
  in_review_count: number;
  todo_count: number;
  total_assigned: number;
  contribution_percentage: number;
}

export interface AdminStats {
  totalUsers: number;
  totalTeams: number;
  totalTasks: number;
  totalResearch: number;
}

export interface AdminTeamItem extends Team {
  member_count: number;
  creator_name?: string;
  task_count: number;
}

export interface AdminUserItem extends Profile {
  teams_joined: string[];
  team_ids?: string[];
}

export interface UserTeamItem extends Team {
  user_role: Role;
  member_count: number;
  task_count: number;
}
