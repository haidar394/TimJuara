'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  isMasterAdmin,
  getAdminStats,
  getAllTeamsForAdmin,
  getAllUsersForAdmin,
  deleteTeamByAdmin,
  deleteUserByAdmin,
  deleteMultipleTeamsByAdmin,
  deleteMultipleUsersByAdmin,
  signOutUser,
  getGlobalWhatsAppConfig,
  updateGlobalWhatsAppConfig,
  sendTestWhatsAppMessage,
  triggerDeadlineReminders,
  updateUserByMasterAdmin,
} from '@/lib/dataService';
import {
  Profile,
  AdminStats,
  AdminTeamItem,
  AdminUserItem,
} from '@/lib/types';
import {
  ShieldAlert,
  Users,
  FolderGit2,
  CheckCircle2,
  Trash2,
  Search,
  ExternalLink,
  LogOut,
  ArrowLeft,
  Crown,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  Mail,
  User,
  Check,
  X,
  CheckSquare,
  MessageSquare,
  Smartphone,
  BellRing,
  Lock,
  Edit,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalTeams: 0, totalTasks: 0, totalResearch: 0 });
  const [teams, setTeams] = useState<AdminTeamItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Search
  const [activeTab, setActiveTab] = useState<'teams' | 'users' | 'whatsapp'>('teams');
  const [searchQuery, setSearchQuery] = useState('');

  // WhatsApp Gateway Bot Configuration (Master Admin)
  const [waToken, setWaToken] = useState('');
  const [waEnabled, setWaEnabled] = useState(true);
  const [savingWaConfig, setSavingWaConfig] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [triggeringReminders, setTriggeringReminders] = useState(false);

  // Bulk Selection States
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkDeleteTeamsModal, setShowBulkDeleteTeamsModal] = useState(false);
  const [showBulkDeleteUsersModal, setShowBulkDeleteUsersModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion modals (Single item)
  const [teamToDelete, setTeamToDelete] = useState<AdminTeamItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit User Modal (Master Admin)
  const [userToEdit, setUserToEdit] = useState<AdminUserItem | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'name' | 'phone' | 'email' | 'password' | 'teams'>('name');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSelectedTeamIds, setEditSelectedTeamIds] = useState<string[]>([]);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAdminData = async () => {
    setLoading(true);
    const user = await getCurrentUser();
    if (!user || !isMasterAdmin(user)) {
      router.replace('/auth');
      return;
    }
    setCurrentUser(user);

    const [st, tm, us, waConfig] = await Promise.all([
      getAdminStats(),
      getAllTeamsForAdmin(),
      getAllUsersForAdmin(),
      getGlobalWhatsAppConfig(),
    ]);

    setStats(st);
    setTeams(tm);
    setUsers(us);
    setWaToken(waConfig.wa_gateway_token);
    setWaEnabled(waConfig.wa_notifications_enabled);
    setLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSaveWaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWaConfig(true);
    const { success, error } = await updateGlobalWhatsAppConfig(waToken, waEnabled);
    setSavingWaConfig(false);

    if (error) {
      showToast(`Gagal menyimpan pengaturan WhatsApp: ${error}`);
      return;
    }

    if (success) {
      showToast('Pengaturan Bot WhatsApp platform berhasil disimpan! 🤖');
    }
  };

  const handleTestWhatsAppAdmin = async () => {
    if (!testPhone.trim()) {
      showToast('Masukkan nomor WhatsApp tujuan uji coba terlebih dahulu.');
      return;
    }
    if (!waToken.trim()) {
      showToast('Masukkan Device Token Fonnte terlebih dahulu lalu simpan.');
      return;
    }

    setTestingWa(true);
    const testMsg = `Halo! 👋\n\nIni adalah pesan uji coba dari Master Admin TimJuara.\nBot WhatsApp Gateway (Fonnte) telah berhasil terhubung dan siap mengirimkan pengingat deadline ke seluruh tim! 🚀`;
    const res = await sendTestWhatsAppMessage(testPhone.trim(), testMsg, waToken.trim());
    setTestingWa(false);

    if (res.success) {
      showToast(`Pesan uji coba berhasil dikirim ke WhatsApp ${testPhone}! 📲`);
    } else {
      showToast(`Gagal mengirim WA: ${res.error || 'Periksa token Fonnte dan nomor HP'}`);
    }
  };

  const handleTriggerAllReminders = async () => {
    if (!waToken.trim()) {
      showToast('Token Fonnte belum diatur. Masukkan token Fonnte di bawah dan simpan terlebih dahulu.');
      return;
    }

    setTriggeringReminders(true);
    const res = await triggerDeadlineReminders(undefined, true);
    setTriggeringReminders(false);

    if (res.success) {
      if (res.sentCount === 0) {
        showToast(res.message || 'Tidak ada tugas yang mendekati batas deadline atau nomor WA anggota belum terisi.');
      } else {
        showToast(`Berhasil mengirim ${res.sentCount} notifikasi WhatsApp ke anggota tim! 📢`);
      }
    } else {
      showToast(`Gagal mengirim notifikasi: ${res.error}`);
    }
  };

  // Handle Delete Team (Single)
  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    const { success, error } = await deleteTeamByAdmin(teamToDelete.id);
    setIsDeleting(false);

    if (error) {
      showToast(`Gagal menghapus tim: ${error}`);
      return;
    }

    if (success) {
      showToast(`Tim "${teamToDelete.name}" berhasil dihapus.`);
      setTeamToDelete(null);
      setSelectedTeamIds((prev) => prev.filter((id) => id !== teamToDelete.id));
      await loadAdminData();
    }
  };

  // Handle Delete User (Single)
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const { success, error } = await deleteUserByAdmin(userToDelete.id);
    setIsDeleting(false);

    if (error) {
      showToast(`Gagal menghapus pengguna: ${error}`);
      return;
    }

    if (success) {
      showToast(`Pengguna "${userToDelete.full_name}" berhasil dihapus.`);
      setUserToDelete(null);
      setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
      await loadAdminData();
    }
  };

  // Handle Open Edit User Modal (mendukung tab spesifik)
  const handleOpenEditUser = (u: AdminUserItem, tab: 'name' | 'phone' | 'email' | 'password' | 'teams' = 'name') => {
    setUserToEdit(u);
    setActiveEditTab(tab);
    setEditName(u.full_name || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone_number || '');
    setEditPassword('');
    setShowEditPassword(false);
    setEditSelectedTeamIds(u.team_ids || []);
  };

  // Handle Toggle Team for User
  const handleToggleUserTeam = (teamId: string) => {
    setEditSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  // 1. Simpan Nama Saja
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    if (!editName.trim()) {
      showToast('Nama lengkap tidak boleh kosong.');
      return;
    }

    setIsSavingUser(true);
    const { success, error } = await updateUserByMasterAdmin({
      userId: userToEdit.id,
      fullName: editName.trim(),
    });
    setIsSavingUser(false);

    if (error) {
      showToast(`Gagal mengubah nama: ${error}`);
      return;
    }

    if (success) {
      showToast(`Nama pengguna berhasil diubah menjadi "${editName}"! ✨`);
      setUserToEdit((prev) => (prev ? { ...prev, full_name: editName.trim() } : null));
      await loadAdminData();
    }
  };

  // 2. Simpan Nomor WhatsApp Saja
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setIsSavingUser(true);
    const { success, error } = await updateUserByMasterAdmin({
      userId: userToEdit.id,
      phoneNumber: editPhone.trim(),
    });
    setIsSavingUser(false);

    if (error) {
      showToast(`Gagal mengubah nomor WhatsApp: ${error}`);
      return;
    }

    if (success) {
      showToast(`Nomor WhatsApp untuk "${userToEdit.full_name}" berhasil disimpan! 📱`);
      setUserToEdit((prev) => (prev ? { ...prev, phone_number: editPhone.trim() } : null));
      await loadAdminData();
    }
  };

  // 3. Simpan Alamat Email Saja
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    if (!editEmail.trim()) {
      showToast('Alamat email tidak boleh kosong.');
      return;
    }

    setIsSavingUser(true);
    const { success, error } = await updateUserByMasterAdmin({
      userId: userToEdit.id,
      email: editEmail.trim(),
    });
    setIsSavingUser(false);

    if (error) {
      showToast(`Gagal mengubah alamat email: ${error}`);
      return;
    }

    if (success) {
      showToast(`Alamat email untuk "${userToEdit.full_name}" berhasil diubah! ✉️`);
      setUserToEdit((prev) => (prev ? { ...prev, email: editEmail.trim() } : null));
      await loadAdminData();
    }
  };

  // 4. Simpan Kata Sandi Saja
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    if (!editPassword.trim()) {
      showToast('Silakan masukkan kata sandi baru.');
      return;
    }
    if (editPassword.trim().length < 6) {
      showToast('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSavingUser(true);
    const { success, error } = await updateUserByMasterAdmin({
      userId: userToEdit.id,
      password: editPassword.trim(),
    });
    setIsSavingUser(false);

    if (error) {
      showToast(`Gagal memperbarui kata sandi: ${error}`);
      return;
    }

    if (success) {
      showToast(`Kata sandi untuk "${userToEdit.full_name}" berhasil diperbarui! 🔑`);
      setEditPassword('');
      await loadAdminData();
    }
  };

  // 5. Simpan Partisipasi Tim Saja
  const handleSaveTeams = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setIsSavingUser(true);
    const { success, error } = await updateUserByMasterAdmin({
      userId: userToEdit.id,
      teamIds: editSelectedTeamIds,
    });
    setIsSavingUser(false);

    if (error) {
      showToast(`Gagal memperbarui tim: ${error}`);
      return;
    }

    if (success) {
      showToast(`Partisipasi tim untuk "${userToEdit.full_name}" berhasil diperbarui! 👥`);
      await loadAdminData();
    }
  };

  // Handle Bulk Delete Teams
  const confirmBulkDeleteTeams = async () => {
    if (selectedTeamIds.length === 0) return;
    setIsDeleting(true);
    const { success, count, error } = await deleteMultipleTeamsByAdmin(selectedTeamIds);
    setIsDeleting(false);

    if (error) {
      showToast(`Gagal menghapus tim: ${error}`);
      return;
    }

    if (success) {
      showToast(`${count} tim berhasil dihapus.`);
      setSelectedTeamIds([]);
      setShowBulkDeleteTeamsModal(false);
      await loadAdminData();
    }
  };

  // Handle Bulk Delete Users
  const confirmBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    setIsDeleting(true);
    const { success, count, error } = await deleteMultipleUsersByAdmin(selectedUserIds);
    setIsDeleting(false);

    if (error) {
      showToast(`Gagal menghapus pengguna: ${error}`);
      return;
    }

    if (success) {
      showToast(`${count} pengguna berhasil dihapus.`);
      setSelectedUserIds([]);
      setShowBulkDeleteUsersModal(false);
      await loadAdminData();
    }
  };

  // Filtered lists
  const filteredTeams = teams.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      (t.creator_name && t.creator_name.toLowerCase().includes(q))
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  // Selection helpers for Teams
  const allTeamsSelected =
    filteredTeams.length > 0 && filteredTeams.every((t) => selectedTeamIds.includes(t.id));

  const toggleAllTeams = () => {
    if (allTeamsSelected) {
      setSelectedTeamIds([]);
    } else {
      setSelectedTeamIds(filteredTeams.map((t) => t.id));
    }
  };

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Selection helpers for Users (Master Admin admin@gmail.com is protected and cannot be deleted)
  const selectableUsers = filteredUsers.filter(
    (u) => u.email?.toLowerCase() !== 'admin@gmail.com'
  );
  const allUsersSelected =
    selectableUsers.length > 0 && selectableUsers.every((u) => selectedUserIds.includes(u.id));

  const toggleAllUsers = () => {
    if (allUsersSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u.id));
    }
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Memuat Panel Master Admin...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast" style={{ background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <header style={{ background: '#0f172a', color: '#f8fafc', borderBottom: '1px solid #1e293b', padding: '16px 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
              <Crown size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>Panel Master Admin</h1>
                <span style={{ fontSize: '0.65rem', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800, letterSpacing: 0.5 }}>
                  SUPERUSER
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Otoritas penuh mengelola dan menghapus seluruh tim & pengguna di TimJuara.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/onboarding" className="btn btn-secondary btn-sm" style={{ background: '#1e293b', color: '#f1f5f9', borderColor: '#334155' }}>
              <ArrowLeft size={14} /> Beranda Tim
            </Link>
            <button
              onClick={loadAdminData}
              className="btn btn-secondary btn-sm"
              style={{ background: '#1e293b', color: '#f1f5f9', borderColor: '#334155' }}
              title="Segarkan data"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={async () => {
                await signOutUser();
                router.push('/auth');
              }}
              className="btn btn-danger btn-sm"
              title="Keluar akun"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '28px 0 60px' }}>
        <div className="container">
          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
            <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PENGGUNA</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{stats.totalUsers}</h3>
              </div>
            </div>

            <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL TIM AKTIF</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{stats.totalTeams}</h3>
              </div>
            </div>

            <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL TUGAS</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{stats.totalTasks}</h3>
              </div>
            </div>

            <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderGit2 size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MATERI / RISET</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{stats.totalResearch}</h3>
              </div>
            </div>
          </div>

          {/* Tab Navigation & Search Bar */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setActiveTab('teams'); setSearchQuery(''); setSelectedTeamIds([]); setSelectedUserIds([]); }}
                className={`btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Crown size={15} />
                <span>Kelola Semua Tim ({teams.length})</span>
              </button>
              <button
                onClick={() => { setActiveTab('users'); setSearchQuery(''); setSelectedTeamIds([]); setSelectedUserIds([]); }}
                className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Users size={15} />
                <span>Kelola Semua Pengguna ({users.length})</span>
              </button>
              <button
                onClick={() => { setActiveTab('whatsapp'); setSearchQuery(''); setSelectedTeamIds([]); setSelectedUserIds([]); }}
                className={`btn ${activeTab === 'whatsapp' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: activeTab === 'whatsapp' ? '#ffffff' : '#16a34a',
                  borderColor: activeTab === 'whatsapp' ? 'var(--primary)' : '#86efac',
                  background: activeTab === 'whatsapp' ? 'var(--primary)' : '#f0fdf4',
                  fontWeight: 600,
                }}
              >
                <MessageSquare size={15} />
                <span>Bot WhatsApp Gateway</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>100% Gratis</span>
              </button>
            </div>

            {/* Search Input (Hanya tampil di tab Teams & Users) */}
            {activeTab !== 'whatsapp' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260, flex: 1, maxWidth: 400 }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder={activeTab === 'teams' ? 'Cari nama tim atau @username...' : 'Cari nama atau email pengguna...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 36, height: 38, fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: KELOLA SEMUA TIM                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'teams' && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Daftar Seluruh Tim Terdaftar</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Menghapus tim akan secara otomatis menghapus seluruh tugas, dokumen materi, dan relasi anggota di dalamnya.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {selectedTeamIds.length > 0 && (
                    <span className="badge badge-primary" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {selectedTeamIds.length} tim dipilih
                    </span>
                  )}
                  <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                    {filteredTeams.length} Tim Ditemukan
                  </span>
                </div>
              </div>

              {/* Floating / Sticky Bulk Action Bar for Teams */}
              {selectedTeamIds.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#f8fafc',
                    padding: '12px 18px',
                    borderRadius: 14,
                    marginBottom: 18,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                    border: '1px solid #334155',
                    flexWrap: 'wrap',
                    gap: 12,
                    animation: 'fadeIn 0.2s ease-in-out',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        background: '#38bdf8',
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '3px 10px',
                        borderRadius: 99,
                      }}
                    >
                      {selectedTeamIds.length} Dipilih
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>
                      {selectedTeamIds.length} tim dipilih untuk dihapus sekaligus
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => setSelectedTeamIds([])}
                      className="btn btn-secondary btn-sm"
                      style={{ background: '#1e293b', color: '#94a3b8', borderColor: '#334155', fontSize: '0.8rem' }}
                    >
                      Batalkan Pilihan
                    </button>
                    <button
                      onClick={() => setShowBulkDeleteTeamsModal(true)}
                      className="btn btn-sm"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                        padding: '8px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} color="#ffffff" />
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>
                        Hapus ({selectedTeamIds.length}) Tim Terpilih
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {filteredTeams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Layers size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontWeight: 600 }}>Tidak ada tim yang cocok dengan pencarian Anda.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px 14px', width: 44, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={allTeamsSelected}
                            onChange={toggleAllTeams}
                            style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--primary)', borderRadius: 4 }}
                            title={allTeamsSelected ? 'Batalkan pilih semua tim' : 'Pilih semua tim'}
                          />
                        </th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Nama Tim</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Username (@)</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Pembuat (Ketua)</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Anggota</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Tugas</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Dibuat Pada</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeams.map((t) => {
                        const isSelected = selectedTeamIds.includes(t.id);
                        return (
                          <tr
                            key={t.id}
                            style={{
                              borderBottom: '1px solid var(--surface-border)',
                              transition: 'background 0.15s',
                              background: isSelected ? 'rgba(37, 99, 235, 0.05)' : undefined,
                            }}
                          >
                            <td style={{ padding: '14px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTeam(t.id)}
                                style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--primary)', borderRadius: 4 }}
                              />
                            </td>
                            <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div>{t.name}</div>
                                  {t.description && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {t.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px' }}>
                              <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                                @{t.username}
                              </span>
                            </td>
                            <td style={{ padding: '14px', color: 'var(--text-main)' }}>
                              {t.creator_name || 'Tidak diketahui'}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'center' }}>
                              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                                <Users size={12} /> {t.member_count}
                              </span>
                            </td>
                            <td style={{ padding: '14px', textAlign: 'center' }}>
                              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                                <CheckCircle2 size={12} /> {t.task_count}
                              </span>
                            </td>
                            <td style={{ padding: '14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {new Date(t.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                <Link
                                  href={`/team/${t.username}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                                  title="Kunjungi workspace tim ini"
                                >
                                  <ExternalLink size={13} /> Kunjungi
                                </Link>
                                <button
                                  onClick={() => setTeamToDelete(t)}
                                  className="btn btn-danger btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                                  title="Hapus seluruh tim ini"
                                >
                                  <Trash2 size={13} /> Hapus Tim
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: KELOLA SEMUA PENGGUNA / ANGGOTA                                    */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Daftar Seluruh Pengguna & Anggota</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Menghapus akun pengguna akan mencabut seluruh keanggotaan tim dan menghapus data profil dari sistem.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {selectedUserIds.length > 0 && (
                    <span className="badge badge-primary" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {selectedUserIds.length} pengguna dipilih
                    </span>
                  )}
                  <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                    {filteredUsers.length} Pengguna Ditemukan
                  </span>
                </div>
              </div>

              {/* Floating / Sticky Bulk Action Bar for Users */}
              {selectedUserIds.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#f8fafc',
                    padding: '12px 18px',
                    borderRadius: 14,
                    marginBottom: 18,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                    border: '1px solid #334155',
                    flexWrap: 'wrap',
                    gap: 12,
                    animation: 'fadeIn 0.2s ease-in-out',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        background: '#38bdf8',
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '3px 10px',
                        borderRadius: 99,
                      }}
                    >
                      {selectedUserIds.length} Dipilih
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 500 }}>
                      {selectedUserIds.length} pengguna dipilih untuk dihapus sekaligus
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => setSelectedUserIds([])}
                      className="btn btn-secondary btn-sm"
                      style={{ background: '#1e293b', color: '#94a3b8', borderColor: '#334155', fontSize: '0.8rem' }}
                    >
                      Batalkan Pilihan
                    </button>
                    <button
                      onClick={() => setShowBulkDeleteUsersModal(true)}
                      className="btn btn-sm"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                        padding: '8px 16px',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} color="#ffffff" />
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>
                        Hapus ({selectedUserIds.length}) Pengguna Terpilih
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontWeight: 600 }}>Tidak ada pengguna yang cocok dengan pencarian Anda.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px 14px', width: 44, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={allUsersSelected}
                            onChange={toggleAllUsers}
                            disabled={selectableUsers.length === 0}
                            style={{
                              width: 17,
                              height: 17,
                              cursor: selectableUsers.length === 0 ? 'not-allowed' : 'pointer',
                              accentColor: 'var(--primary)',
                              borderRadius: 4,
                            }}
                            title={allUsersSelected ? 'Batalkan pilih semua pengguna' : 'Pilih semua pengguna'}
                          />
                        </th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Pengguna</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Alamat Email</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Nomor WhatsApp</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Tim yang Diikuti</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Role Akun</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isAdminUser = u.email?.toLowerCase() === 'admin@gmail.com';
                        const isSelected = selectedUserIds.includes(u.id);

                        return (
                          <tr
                            key={u.id}
                            style={{
                              borderBottom: '1px solid var(--surface-border)',
                              transition: 'background 0.15s',
                              background: isSelected ? 'rgba(37, 99, 235, 0.05)' : undefined,
                            }}
                          >
                            <td style={{ padding: '14px', textAlign: 'center' }}>
                              {isAdminUser ? (
                                <span title="Akun Master Admin dilindungi dan tidak dapat dihapus" style={{ fontSize: '0.85rem', opacity: 0.35, cursor: 'not-allowed' }}>
                                  🔒
                                </span>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleUser(u.id)}
                                  style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--primary)', borderRadius: 4 }}
                                />
                              )}
                            </td>
                            <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="avatar-badge" style={{ width: 36, height: 36, fontSize: '0.85rem', background: isAdminUser ? '#ef4444' : undefined }}>
                                  {isAdminUser ? '👑' : u.full_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>{u.full_name}</span>
                                    {isAdminUser && (
                                      <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                                        Master Admin
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Mail size={14} />
                                <span>{u.email || '-'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px' }}>
                              {u.phone_number ? (
                                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Smartphone size={13} /> {u.phone_number}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Belum diisi</span>
                              )}
                            </td>
                            <td style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 300 }}>
                                {u.teams_joined && u.teams_joined.length > 0 ? (
                                  u.teams_joined.map((tName, i) => (
                                    <span key={i} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                      {tName}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum ada tim</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px' }}>
                              {isAdminUser ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                                  👑 Master Admin
                                </span>
                              ) : (
                                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                                  👤 Pengguna / Anggota
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '5px 10px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    color: 'var(--primary)',
                                    borderColor: '#93c5fd',
                                    background: '#eff6ff',
                                  }}
                                  title="Edit data pengguna (Nama, Email, No WA, Kata Sandi, dan Tim)"
                                >
                                  <Edit size={13} /> Edit
                                </button>
                                {isAdminUser ? (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '5px 8px' }}>
                                    Terlindungi
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setUserToDelete(u)}
                                    className="btn btn-danger btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                    title="Hapus akun pengguna ini"
                                  >
                                    <Trash2 size={13} /> Hapus
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BOT WHATSAPP GATEWAY (MASTER ADMIN)                                */}
          {/* ========================================================================= */}
          {activeTab === 'whatsapp' && (
            <div className="card" style={{ padding: 28, border: '1px solid #bbf7d0', background: 'linear-gradient(to bottom, #f0fdf4 0%, #ffffff 200px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)' }}>
                    <MessageSquare size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Bot Pengingat WhatsApp Otomatis</h3>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>100% Gratis</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>Khusus Master Admin</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Kirim notifikasi otomatis ke WhatsApp anggota saat mendekati batas waktu (deadline) tugas di seluruh tim!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerAllReminders}
                  disabled={triggeringReminders}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#16a34a',
                    borderColor: '#86efac',
                    background: '#ffffff',
                    fontWeight: 700,
                    padding: '8px 16px',
                  }}
                  title="Pindai seluruh tim dan kirim pengingat deadline ke WhatsApp anggota sekarang"
                >
                  <BellRing size={16} />
                  {triggeringReminders ? 'Mengirim Pengingat...' : '📢 Kirim Pengingat Deadline Sekarang (Semua Tim)'}
                </button>
              </div>

              {/* Panduan 3 Langkah Menghubungkan WhatsApp Gratis */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '18px 20px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Cara Menghubungkan WhatsApp Gratis (Fonnte):</span>
                </h4>
                <ol style={{ fontSize: '0.875rem', color: '#475569', paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
                  <li>Buka situs resmi <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>fonnte.com</a> dan daftar akun gratis (Free Tier: 1.000 pesan WA/bulan tanpa biaya).</li>
                  <li>Di dashboard Fonnte, buka menu <b>Device</b>, lalu <b>Scan QR Code</b> menggunakan aplikasi WhatsApp Anda (seperti saat membuka WhatsApp Web).</li>
                  <li>Salin <b>Device Token</b> yang muncul di Fonnte, lalu tempel pada kolom di bawah ini dan klik Simpan.</li>
                </ol>
              </div>

              {/* Form Konfigurasi Token Master */}
              <form onSubmit={handleSaveWaConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <Lock size={15} /> Fonnte Device Token (Master Platform)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: XmLdzRrxvz6nQXvrCtFE"
                    value={waToken}
                    onChange={(e) => setWaToken(e.target.value)}
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: 0.5 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Token ini hanya dapat dilihat dan diubah oleh Master Admin. Seluruh tim akan otomatis menggunakan bot ini.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <input
                    type="checkbox"
                    id="waEnabledMaster"
                    checked={waEnabled}
                    onChange={(e) => setWaEnabled(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#16a34a', cursor: 'pointer' }}
                  />
                  <label htmlFor="waEnabledMaster" style={{ fontSize: '0.9rem', color: '#1e293b', cursor: 'pointer', fontWeight: 600 }}>
                    Aktifkan pengingat deadline otomatis harian (setiap pukul 08:00 WIB untuk tugas H-1, Hari H, & Terlewat)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10 }}>
                  <button
                    type="submit"
                    disabled={savingWaConfig}
                    className="btn btn-primary"
                    style={{ background: '#16a34a', borderColor: '#16a34a', padding: '10px 22px', fontWeight: 700 }}
                  >
                    {savingWaConfig ? 'Menyimpan...' : 'Simpan Pengaturan Bot WA'}
                  </button>
                </div>
              </form>

              {/* Area Uji Coba Pengiriman Pesan */}
              <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={16} color="#16a34a" /> Uji Coba Pengiriman WhatsApp
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Kirim pesan percobaan ke nomor HP Anda untuk memastikan Fonnte Device Token sudah aktif dan dapat terkirim.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 540 }}>
                  <input
                    type="text"
                    placeholder="Masukkan no HP: 08123456789..."
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, minWidth: 240 }}
                  />
                  <button
                    type="button"
                    onClick={handleTestWhatsAppAdmin}
                    disabled={testingWa}
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', color: '#16a34a', borderColor: '#86efac', fontWeight: 600 }}
                  >
                    {testingWa ? 'Mengirim...' : '📲 Kirim Pesan Tes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI: HAPUS TIM                                               */}
      {/* ========================================================================= */}
      {teamToDelete && (
        <div
          className="modal-overlay"
          onClick={() => !isDeleting && setTeamToDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              padding: 26,
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => !isDeleting && setTeamToDelete(null)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s',
              }}
              title="Tutup"
            >
              <X size={16} />
            </button>

            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingRight: 32 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#fee2e2',
                  border: '2px solid #fecaca',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Hapus Tim Permanen
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                  Tindakan ini tidak dapat dibatalkan!
                </span>
              </div>
            </div>

            {/* Team Info Card Preview */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  flexShrink: 0,
                }}
              >
                {teamToDelete.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {teamToDelete.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, background: '#eef2ff', padding: '1px 6px', borderRadius: 4 }}>
                    @{teamToDelete.username}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    • {teamToDelete.member_count} Anggota • {teamToDelete.task_count} Tugas
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Callout Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#fff5f5',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 22,
              }}
            >
              <ShieldAlert size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.5, margin: 0 }}>
                Seluruh <strong>{teamToDelete.task_count} tugas</strong>, tautan berkas materi/riset, dan keanggotaan <strong>{teamToDelete.member_count} orang</strong> pada tim ini akan terhapus permanen dari server.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTeamToDelete(null)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteTeam}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'transform 0.15s',
                }}
              >
                <Trash2 size={15} color="#ffffff" />
                <span style={{ color: '#ffffff' }}>
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Tim'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT DATA PENGGUNA (MASTER ADMIN)                                  */}
      {/* ========================================================================= */}
      {userToEdit && (
        <div
          className="modal-overlay"
          onClick={() => !isSavingUser && setUserToEdit(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 580,
              background: '#ffffff',
              borderRadius: 20,
              padding: '24px 26px',
              position: 'relative',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => !isSavingUser && setUserToEdit(null)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
              title="Tutup"
            >
              <X size={16} />
            </button>

            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, paddingRight: 32 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#eff6ff',
                  border: '2px solid #bfdbfe',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Edit size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Edit Data Pengguna
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Pilih data yang ingin Anda ubah secara spesifik (satu per satu).
                </span>
              </div>
            </div>

            {/* User Info Card Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                {userToEdit.full_name?.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userToEdit.full_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 1, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>{userToEdit.email || 'Tanpa email terdaftar'}</span>
                  {userToEdit.phone_number && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>📱 {userToEdit.phone_number}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Tab Selector: Edit Satu per Satu */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 8,
                marginBottom: 18,
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveEditTab('name')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: activeEditTab === 'name' ? 'var(--primary)' : '#f1f5f9',
                  color: activeEditTab === 'name' ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <User size={13} /> Nama
              </button>

              <button
                type="button"
                onClick={() => setActiveEditTab('phone')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: activeEditTab === 'phone' ? '#16a34a' : '#f1f5f9',
                  color: activeEditTab === 'phone' ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Smartphone size={13} /> No WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setActiveEditTab('email')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: activeEditTab === 'email' ? '#2563eb' : '#f1f5f9',
                  color: activeEditTab === 'email' ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Mail size={13} /> Email
              </button>

              <button
                type="button"
                onClick={() => setActiveEditTab('password')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: activeEditTab === 'password' ? '#d97706' : '#f1f5f9',
                  color: activeEditTab === 'password' ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Lock size={13} /> Kata Sandi
              </button>

              <button
                type="button"
                onClick={() => setActiveEditTab('teams')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: activeEditTab === 'teams' ? '#7c3aed' : '#f1f5f9',
                  color: activeEditTab === 'teams' ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Users size={13} /> Tim ({editSelectedTeamIds.length})
              </button>
            </div>

            {/* TAB CONTENT: 1. NAMA LENGKAP */}
            {activeEditTab === 'name' && (
              <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '16px 18px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#1e293b' }}>
                    Nama Lengkap Baru <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Masukkan nama lengkap pengguna..."
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6, display: 'block' }}>
                    Nama ini akan muncul pada papan tugas, penanggung jawab (PIC), dan riwayat kontribusi tim.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '8px 18px', fontWeight: 700 }}
                  >
                    {isSavingUser ? 'Menyimpan...' : 'Simpan Nama Lengkap'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: 2. NOMOR WHATSAPP */}
            {activeEditTab === 'phone' && (
              <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '16px 18px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Smartphone size={16} color="#16a34a" />
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14532d', margin: 0 }}>
                      Nomor WhatsApp
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    className="form-input"
                    style={{ width: '100%', borderColor: '#86efac' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 6, display: 'block' }}>
                    💡 Masukkan nomor dengan awalan 08... atau 628... Digunakan bot untuk mengirim pengingat deadline otomatis.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="btn btn-sm"
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      fontWeight: 700,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                    }}
                  >
                    {isSavingUser ? 'Menyimpan...' : 'Simpan Nomor WhatsApp'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: 3. ALAMAT EMAIL */}
            {activeEditTab === 'email' && (
              <form onSubmit={handleSaveEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '16px 18px', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Mail size={16} color="#2563eb" />
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>
                      Alamat Email (Login Akun) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="contoh@gmail.com"
                    className="form-input"
                    style={{ width: '100%', borderColor: '#93c5fd' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: 6, display: 'block' }}>
                    Email ini digunakan oleh pengguna untuk masuk (login) ke aplikasi TimJuara.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="btn btn-sm"
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      fontWeight: 700,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    {isSavingUser ? 'Menyimpan...' : 'Simpan Alamat Email'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: 4. KATA SANDI */}
            {activeEditTab === 'password' && (
              <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '16px 18px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Lock size={16} color="#d97706" />
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#78350f', margin: 0 }}>
                      Kata Sandi Baru <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru (minimal 6 karakter)..."
                      className="form-input"
                      style={{ width: '100%', paddingRight: 40, borderColor: '#fcd34d' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                      }}
                      title={showEditPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    >
                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#92400e', marginTop: 6, display: 'block' }}>
                    🔑 Master Admin dapat mengatur ulang kata sandi pengguna langsung tanpa perlu kirim email reset.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="btn btn-sm"
                    style={{
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      fontWeight: 700,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                    }}
                  >
                    {isSavingUser ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT: 5. TIM YANG DIIKUTI */}
            {activeEditTab === 'teams' && (
              <form onSubmit={handleSaveTeams} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '16px 18px', borderRadius: 12, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={16} color="#7c3aed" />
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4c1d95', margin: 0 }}>
                        Pilih Tim ({editSelectedTeamIds.length} Terpilih)
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setEditSelectedTeamIds(teams.map((t) => t.id))}
                        style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Pilih Semua
                      </button>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <button
                        type="button"
                        onClick={() => setEditSelectedTeamIds([])}
                        style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: 'auto',
                      border: '1px solid #d8b4fe',
                      borderRadius: 10,
                      padding: '8px 10px',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {teams.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: 12 }}>
                        Belum ada tim terdaftar di sistem.
                      </span>
                    ) : (
                      teams.map((team) => {
                        const isJoined = editSelectedTeamIds.includes(team.id);
                        return (
                          <label
                            key={team.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: isJoined ? '#f3e8ff' : '#f8fafc',
                              border: `1px solid ${isJoined ? '#c084fc' : '#e2e8f0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input
                                type="checkbox"
                                checked={isJoined}
                                onChange={() => handleToggleUserTeam(team.id)}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                                  {team.name}
                                </div>
                                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                                  @{team.username}
                                </div>
                              </div>
                            </div>
                            {isJoined && (
                              <span className="badge" style={{ background: '#7c3aed', color: '#ffffff', fontSize: '0.65rem' }}>
                                Terdaftar
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="btn btn-sm"
                    style={{
                      background: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      fontWeight: 700,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                    }}
                  >
                    {isSavingUser ? 'Menyimpan...' : 'Simpan Partisipasi Tim'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI: HAPUS PENGGUNA                                          */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div
          className="modal-overlay"
          onClick={() => !isDeleting && setUserToDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              padding: 26,
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => !isDeleting && setUserToDelete(null)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s',
              }}
              title="Tutup"
            >
              <X size={16} />
            </button>

            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingRight: 32 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#fee2e2',
                  border: '2px solid #fecaca',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Hapus Pengguna Permanen
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                  Tindakan ini tidak dapat dibatalkan!
                </span>
              </div>
            </div>

            {/* User Info Card Preview */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  flexShrink: 0,
                }}
              >
                {userToDelete.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userToDelete.full_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  {userToDelete.email || 'Tanpa email'}
                </div>
              </div>
            </div>

            {/* Warning Callout Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#fff5f5',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 22,
              }}
            >
              <ShieldAlert size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.5, margin: 0 }}>
                Akun pengguna ini akan dinonaktifkan, keanggotaannya dicabut dari semua tim, dan data profilnya dihapus permanen dari server.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteUser}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'transform 0.15s',
                }}
              >
                <Trash2 size={15} color="#ffffff" />
                <span style={{ color: '#ffffff' }}>
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI: HAPUS BANYAK TIM SEKALIGUS (BULK DELETE)               */}
      {/* ========================================================================= */}
      {showBulkDeleteTeamsModal && (
        <div
          className="modal-overlay"
          onClick={() => !isDeleting && setShowBulkDeleteTeamsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 520,
              width: '100%',
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              padding: 26,
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => !isDeleting && setShowBulkDeleteTeamsModal(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s',
              }}
              title="Tutup"
            >
              <X size={16} />
            </button>

            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingRight: 32 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#fee2e2',
                  border: '2px solid #fecaca',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Hapus {selectedTeamIds.length} Tim Terpilih
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                  Tindakan penghapusan massal tidak dapat dibatalkan!
                </span>
              </div>
            </div>

            {/* Preview of Selected Teams */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                Tim yang akan dihapus:
              </div>
              <div
                style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {teams
                  .filter((t) => selectedTeamIds.includes(t.id))
                  .map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</span>
                        <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>
                          @{t.username}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {t.member_count} anggota
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {t.task_count} tugas
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Warning Callout Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#fff5f5',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 22,
              }}
            >
              <ShieldAlert size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.5, margin: 0 }}>
                Seluruh tugas, dokumen materi, dan keanggotaan pada <strong>{selectedTeamIds.length} tim</strong> ini akan terhapus secara permanen dari basis data.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteTeamsModal(false)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmBulkDeleteTeams}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'transform 0.15s',
                }}
              >
                <Trash2 size={15} color="#ffffff" />
                <span style={{ color: '#ffffff' }}>
                  {isDeleting ? 'Menghapus...' : `Ya, Hapus ${selectedTeamIds.length} Tim`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI: HAPUS BANYAK PENGGUNA SEKALIGUS (BULK DELETE)           */}
      {/* ========================================================================= */}
      {showBulkDeleteUsersModal && (
        <div
          className="modal-overlay"
          onClick={() => !isDeleting && setShowBulkDeleteUsersModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 520,
              width: '100%',
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              padding: 26,
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => !isDeleting && setShowBulkDeleteUsersModal(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#f1f5f9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.15s',
              }}
              title="Tutup"
            >
              <X size={16} />
            </button>

            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, paddingRight: 32 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#fee2e2',
                  border: '2px solid #fecaca',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Hapus {selectedUserIds.length} Pengguna Terpilih
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                  Tindakan penghapusan massal tidak dapat dibatalkan!
                </span>
              </div>
            </div>

            {/* Preview of Selected Users */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                Akun pengguna yang akan dihapus:
              </div>
              <div
                style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {users
                  .filter((u) => selectedUserIds.includes(u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className="avatar-badge"
                          style={{ width: 28, height: 28, fontSize: '0.75rem' }}
                        >
                          {u.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email || '-'}</div>
                        </div>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {u.teams_joined?.length || 0} tim
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Warning Callout Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#fff5f5',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 22,
              }}
            >
              <ShieldAlert size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.8rem', color: '#991b1b', lineHeight: 1.5, margin: 0 }}>
                Akun <strong>{selectedUserIds.length} pengguna</strong> ini akan dihapus secara permanen dari server, seluruh riwayat keanggotaan mereka pada tim akan dicabut, dan data profil dihapus.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteUsersModal(false)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmBulkDeleteUsers}
                style={{
                  padding: '11px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'transform 0.15s',
                }}
              >
                <Trash2 size={15} color="#ffffff" />
                <span style={{ color: '#ffffff' }}>
                  {isDeleting ? 'Menghapus...' : `Ya, Hapus ${selectedUserIds.length} Pengguna`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
