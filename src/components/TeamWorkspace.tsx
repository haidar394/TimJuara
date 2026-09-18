'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  getCurrentUser,
  getTeamByUsername,
  getTeamTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTeamResearch,
  addResearchMaterial,
  updateResearchMaterial,
  deleteResearchMaterial,
  updateMemberRole,
  removeTeamMember,
  calculateContributionStats,
  signOutUser,
  updateUserProfile,
  updateUserName,
  updateUserEmail,
  updateUserPassword,
} from '@/lib/dataService';
import {
  Profile,
  Team,
  TeamMember,
  Task,
  ResearchMaterial,
  Role,
  TaskStatus,
  ResourceType,
} from '@/lib/types';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trophy,
  FolderGit2,
  Settings,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit,
  Crown,
  User,
  Calendar,
  LogOut,
  Sparkles,
  ArrowRight,
  FileText,
  FileSpreadsheet,
  Presentation,
  Palette,
  Link as LinkIcon,
  HelpCircle,
  Send,
  RotateCcw,
  ShieldAlert,
  Mail,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export default function TeamWorkspace() {
  const router = useRouter();
  const routeParams = useParams();
  const teamUsername = (routeParams?.username as string) || '';

  // Global State
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [research, setResearch] = useState<ResearchMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<'tasks' | 'stats' | 'research' | 'members'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'review' | 'done'>('all');

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showAddResearchModal, setShowAddResearchModal] = useState(false);
  const [showEditResearchModal, setShowEditResearchModal] = useState(false);

  // Selected items for edit / review
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<ResearchMaterial | null>(null);

  // Form State: Add / Edit Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskStatusInput, setTaskStatusInput] = useState<TaskStatus>('todo');

  // Review submission state (Member -> Ketua)
  const [submitTaskLink, setSubmitTaskLink] = useState('');
  const [submitTaskNotes, setSubmitTaskNotes] = useState('');

  // Revision request state (Ketua -> Member)
  const [revisionNotes, setRevisionNotes] = useState('');

  // Form State: Add / Edit Research Material
  const [researchTitle, setResearchTitle] = useState('');
  const [researchUrl, setResearchUrl] = useState('');
  const [researchType, setResearchType] = useState<ResourceType>('drive');
  const [researchNotes, setResearchNotes] = useState('');

  // Form State: Edit Profile (Terpisah: Nama, Email, Password)
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Data
  const loadWorkspaceData = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.replace('/auth');
      return;
    }
    setCurrentUser(user);
    setProfileName(user.full_name);
    setProfileEmail(user.email || '');

    const { team: teamData, members: membersData } = await getTeamByUsername(teamUsername);
    if (!teamData) {
      router.replace('/onboarding');
      return;
    }

    setTeam(teamData);
    setMembers(membersData);

    const taskList = await getTeamTasks(teamData.id);
    setTasks(taskList);

    const researchList = await getTeamResearch(teamData.id);
    setResearch(researchList);

    setLoading(false);
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [teamUsername]);

  // Current User Role in this team
  const currentMember = members.find((m) => m.user_id === currentUser?.id);
  const isKetua = currentMember?.role === 'ketua' || (team && currentUser && team.created_by === currentUser.id);

  // Copy Team Username / Invite Link
  const handleCopyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.username);
    setCopiedCode(true);
    showToast(`Username tim @${team.username} berhasil disalin!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    if (!team) return;
    const url = `${window.location.origin}/onboarding?join=${team.username}`;
    navigator.clipboard.writeText(url);
    showToast('Tautan undangan berhasil disalin!');
  };

  // -------------------------------------------------------------
  // TASK ACTIONS
  // -------------------------------------------------------------
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !currentUser || !taskTitle.trim()) return;

    let deadlineIso: string | undefined = undefined;
    if (taskDeadline && taskDeadline.trim()) {
      try {
        const d = new Date(taskDeadline);
        if (!isNaN(d.getTime())) {
          deadlineIso = d.toISOString();
        }
      } catch (err) {
        console.error('Invalid deadline format:', err);
      }
    }

    const { task, error } = await createTask({
      team_id: team.id,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      task_link: taskLink.trim(),
      assigned_to: taskAssignee || currentUser.id,
      deadline: deadlineIso,
      status: taskStatusInput,
      created_by: currentUser.id,
    });

    if (error) {
      showToast(`Gagal menambahkan tugas: ${error}`);
      return;
    }

    setTaskTitle('');
    setTaskDesc('');
    setTaskLink('');
    setTaskAssignee('');
    setTaskDeadline('');
    setTaskStatusInput('todo');
    setShowAddTaskModal(false);
    showToast('Tugas baru berhasil ditambahkan! 📋');

    const updated = await getTeamTasks(team.id);
    setTasks(updated);
  };

  // Open Edit Task Modal
  const openEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskLink(task.task_link || '');
    setTaskAssignee(task.assigned_to || '');
    setTaskDeadline(task.deadline ? task.deadline.slice(0, 10) : '');
    setTaskStatusInput(task.status);
    setShowEditTaskModal(true);
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !taskTitle.trim()) return;

    let deadlineIso: string | undefined = undefined;
    if (taskDeadline && taskDeadline.trim()) {
      try {
        const d = new Date(taskDeadline);
        if (!isNaN(d.getTime())) {
          deadlineIso = d.toISOString();
        }
      } catch (err) {
        console.error('Invalid deadline format:', err);
      }
    }

    const { success, error } = await updateTask(selectedTask.id, {
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      task_link: taskLink.trim(),
      assigned_to: taskAssignee || undefined,
      deadline: deadlineIso,
      status: taskStatusInput,
    });

    if (error) {
      showToast(`Gagal memperbarui tugas: ${error}`);
      return;
    }

    setShowEditTaskModal(false);
    setSelectedTask(null);
    showToast('Perubahan tugas berhasil disimpan! ✨');

    if (team) {
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    }
  };

  // Submit Task for Review (Anggota -> Ketua)
  const openSubmitReview = (task: Task) => {
    setSelectedTask(task);
    setSubmitTaskLink(task.task_link || '');
    setSubmitTaskNotes('');
    setShowReviewModal(true);
  };

  const handleConfirmSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !currentUser) return;

    await updateTaskStatus(
      selectedTask.id,
      'review',
      currentUser.id,
      submitTaskNotes.trim(),
      submitTaskLink.trim()
    );

    setShowReviewModal(false);
    setSelectedTask(null);
    showToast('Tugas telah diajukan ke Ketua Tim untuk dicek! 🔍');

    if (team) {
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    }
  };

  // Approve Task (Ketua -> Done)
  const handleApproveTask = async (task: Task) => {
    if (!currentUser) return;

    // Atribusikan ke anggota yang mengerjakan atau yang ditugaskan
    const completedBy = task.completed_by || task.assigned_to || currentUser.id;

    await updateTaskStatus(task.id, 'done', completedBy);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast('🎉 Tugas telah disetujui selesai oleh Ketua!');

    if (team) {
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    }
  };

  // Reject / Request Revision (Ketua -> Member)
  const openRevisionModal = (task: Task) => {
    setSelectedTask(task);
    setRevisionNotes('');
    setShowRevisionModal(true);
  };

  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    await updateTask(selectedTask.id, {
      status: 'in_progress',
      review_notes: revisionNotes.trim() ? `Catatan Revisi dari Ketua: ${revisionNotes.trim()}` : 'Perlu revisi dari Ketua.',
    });

    setShowRevisionModal(false);
    setSelectedTask(null);
    showToast('Permintaan revisi berhasil dikirim ke anggota.');

    if (team) {
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    }
  };

  // Reopen Task (Kembalikan status ke Sedang Dikerjakan)
  const handleReopenTask = async (task: Task) => {
    await updateTask(task.id, {
      status: 'in_progress',
      completed_by: undefined,
      review_notes: '',
    });
    showToast('Tugas telah dibuka kembali untuk dikerjakan.');
    if (team) {
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    }
  };

  // Start Task (Mulai Kerjakan)
  const handleStartTask = async (task: Task) => {
    await updateTaskStatus(task.id, 'in_progress');
    showToast('Tugas mulai dikerjakan.');
    if (team) {
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;
    await deleteTask(taskId);
    showToast('Tugas berhasil dihapus.');
    if (team) {
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    }
  };

  // -------------------------------------------------------------
  // RESEARCH / GOOGLE DRIVE ACTIONS
  // -------------------------------------------------------------
  const handleAddResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !currentUser || !researchTitle.trim() || !researchUrl.trim()) return;

    let validUrl = researchUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    // Auto-detect type
    let detectedType = researchType;
    if (validUrl.includes('docs.google.com/document')) detectedType = 'docs';
    else if (validUrl.includes('docs.google.com/spreadsheets')) detectedType = 'sheets';
    else if (validUrl.includes('docs.google.com/presentation')) detectedType = 'slides';
    else if (validUrl.includes('drive.google.com')) detectedType = 'drive';
    else if (validUrl.includes('figma.com')) detectedType = 'figma';

    const { material, error } = await addResearchMaterial({
      team_id: team.id,
      title: researchTitle.trim(),
      resource_url: validUrl,
      resource_type: detectedType,
      notes: researchNotes.trim(),
      uploaded_by: currentUser.id,
    });

    if (error) {
      showToast(`Gagal menyimpan materi: ${error}`);
      return;
    }

    setResearchTitle('');
    setResearchUrl('');
    setResearchType('drive');
    setResearchNotes('');
    setShowAddResearchModal(false);
    showToast('Link materi/riset berhasil disimpan! 📁');

    const updated = await getTeamResearch(team.id);
    setResearch(updated);
  };

  const openEditResearch = (item: ResearchMaterial) => {
    setSelectedResearch(item);
    setResearchTitle(item.title);
    setResearchUrl(item.resource_url);
    setResearchType(item.resource_type);
    setResearchNotes(item.notes || '');
    setShowEditResearchModal(true);
  };

  const handleSaveEditResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResearch || !researchTitle.trim() || !researchUrl.trim()) return;

    let validUrl = researchUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    await updateResearchMaterial(selectedResearch.id, {
      title: researchTitle.trim(),
      resource_url: validUrl,
      resource_type: researchType,
      notes: researchNotes.trim(),
    });

    setShowEditResearchModal(false);
    setSelectedResearch(null);
    showToast('Materi berhasil diperbarui!');

    if (team) {
      const updated = await getTeamResearch(team.id);
      setResearch(updated);
    }
  };

  const handleDeleteResearch = async (id: string) => {
    if (!confirm('Hapus materi ini dari daftar tim?')) return;
    await deleteResearchMaterial(id);
    showToast('Materi berhasil dihapus.');
    if (team) {
      const updated = await getTeamResearch(team.id);
      setResearch(updated);
    }
  };

  // -------------------------------------------------------------
  // MEMBER MANAGEMENT ACTIONS
  // -------------------------------------------------------------
  const handleChangeRole = async (memberId: string, newRole: Role) => {
    if (!team) return;
    await updateMemberRole(team.id, memberId, newRole);
    showToast(`Peran anggota berhasil diubah menjadi ${newRole === 'ketua' ? 'Ketua' : 'Anggota'}.`);
    const { members: updated } = await getTeamByUsername(team.username);
    setMembers(updated);
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!team) return;
    if (!confirm(`Keluarkan ${memberName} dari tim?`)) return;
    await removeTeamMember(team.id, memberId);
    showToast(`${memberName} telah dikeluarkan dari tim.`);
    const { members: updated } = await getTeamByUsername(team.username);
    setMembers(updated);
  };

  const handleLeaveTeam = async () => {
    if (!team || !currentMember) return;
    if (!confirm('Apakah Anda yakin ingin keluar dari tim ini?')) return;
    await removeTeamMember(team.id, currentMember.id);
    router.push('/onboarding');
  };

  // -------------------------------------------------------------
  // PROFILE MANAGEMENT (Terpisah: Nama, Email & Password)
  // -------------------------------------------------------------
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profileName.trim()) {
      showToast('Nama lengkap tidak boleh kosong.');
      return;
    }

    setSavingName(true);
    const { success, error } = await updateUserName(currentUser.id, profileName.trim());
    setSavingName(false);

    if (error) {
      showToast(`Gagal memperbarui nama: ${error}`);
      return;
    }

    if (success) {
      setCurrentUser({
        ...currentUser,
        full_name: profileName.trim(),
      });
      showToast('Nama lengkap berhasil diperbarui! ✨');

      if (team) {
        const { members: updatedMembers } = await getTeamByUsername(team.username);
        setMembers(updatedMembers);
      }
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      showToast('Masukkan format alamat email yang valid.');
      return;
    }

    setSavingEmail(true);
    const { success, error } = await updateUserEmail(currentUser.id, profileEmail.trim());
    setSavingEmail(false);

    if (error) {
      showToast(`Gagal memperbarui email: ${error}`);
      return;
    }

    if (success) {
      setCurrentUser({
        ...currentUser,
        email: profileEmail.trim(),
      });
      showToast('Alamat email berhasil diperbarui! ✨');

      if (team) {
        const { members: updatedMembers } = await getTeamByUsername(team.username);
        setMembers(updatedMembers);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profilePassword) {
      showToast('Silakan masukkan kata sandi baru.');
      return;
    }

    if (profilePassword.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (profilePassword !== profilePasswordConfirm) {
      showToast('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setSavingPassword(true);
    const { success, error } = await updateUserPassword(profilePassword.trim());
    setSavingPassword(false);

    if (error) {
      showToast(`Gagal mengubah kata sandi: ${error}`);
      return;
    }

    if (success) {
      setProfilePassword('');
      setProfilePasswordConfirm('');
      showToast('Kata sandi akun berhasil diperbarui! 🔒');
    }
  };

  // -------------------------------------------------------------
  // STATS & CALCULATIONS
  // -------------------------------------------------------------
  const { contributions, totalTasks, completedTasks, inReviewTasks, overallProgress } = calculateContributionStats(members, tasks);

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.status === taskFilter;
  });

  const getDeadlineBadge = (deadlineStr?: string, status?: TaskStatus) => {
    if (status === 'done') {
      return <span className="badge badge-success"><CheckCircle2 size={12} /> Selesai</span>;
    }
    if (status === 'review') {
      return <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' }}><Clock size={12} /> Menunggu Dicek Ketua</span>;
    }
    if (!deadlineStr) {
      return <span className="badge badge-neutral"><Clock size={12} /> Tanpa Deadline</span>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadlineStr);
    d.setHours(0, 0, 0, 0);

    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="badge badge-danger">
          <AlertCircle size={12} /> Terlewat {Math.abs(diffDays)} hari!
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="badge badge-danger">
          <AlertCircle size={12} /> Hari ini!
        </span>
      );
    } else if (diffDays <= 2) {
      return (
        <span className="badge badge-warning">
          <Clock size={12} /> {diffDays === 1 ? 'Besok' : `${diffDays} hari lagi`}
        </span>
      );
    } else {
      return (
        <span className="badge badge-neutral">
          <Calendar size={12} /> {diffDays} hari lagi
        </span>
      );
    }
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'drive':
        return <FolderGit2 size={20} color="#0284c7" />;
      case 'docs':
        return <FileText size={20} color="#2563eb" />;
      case 'sheets':
        return <FileSpreadsheet size={20} color="#16a34a" />;
      case 'slides':
        return <Presentation size={20} color="#ea580c" />;
      case 'figma':
        return <Palette size={20} color="#a855f7" />;
      default:
        return <LinkIcon size={20} color="#64748b" />;
    }
  };

  if (loading || !team) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat ruang kerja tim...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 72 }}>
          {/* Team Brand Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/onboarding" style={{ display: 'flex', alignItems: 'center' }} title="Pilih Tim Lain">
              <div className="avatar-badge" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}>
                {team.name.slice(0, 2).toUpperCase()}
              </div>
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {team.name}
                </h1>
                {/* Role Badge */}
                {isKetua ? (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                    <Crown size={12} /> Ketua Tim
                  </span>
                ) : (
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    <User size={12} /> Anggota
                  </span>
                )}
              </div>

              {/* Quick Copy Username Tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <button
                  onClick={handleCopyCode}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Klik untuk salin kode tim"
                >
                  {copiedCode ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>@{team.username}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>(Salin Kode)</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {currentUser?.email?.toLowerCase() === 'admin@gmail.com' && (
              <Link href="/admin" className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <Crown size={14} /> Panel Admin
              </Link>
            )}
            <Link href="/onboarding" className="btn btn-secondary btn-sm hide-mobile" title="Buka tim lain">
              <Users size={15} /> Ganti Tim
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar-badge" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                {currentUser?.full_name?.slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={async () => {
                  await signOutUser();
                  router.push('/auth');
                }}
                className="btn btn-secondary btn-sm"
                title="Keluar akun"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main style={{ flex: 1, padding: '28px 0 60px' }}>
        <div className="container">
          {/* Navigation Tabs */}
          <div className="tab-container">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            >
              <CheckCircle2 size={18} />
              Tugas & Deadline
              <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                {tasks.length}
              </span>
              {inReviewTasks > 0 && (
                <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce', padding: '2px 6px', fontSize: '0.7rem' }}>
                  {inReviewTasks} dicek
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            >
              <Trophy size={18} />
              Statistik Kontribusi
              {contributions.length > 0 && contributions[0].completed_count > 0 && (
                <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                  Juara: {contributions[0].full_name.split(' ')[0]} 🥇
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('research')}
              className={`tab-btn ${activeTab === 'research' ? 'active' : ''}`}
            >
              <FolderGit2 size={18} />
              Materi & Hasil Riset
              <span className="badge badge-neutral" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                {research.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            >
              <Settings size={18} />
              Pengaturan & Anggota
              <span className="badge badge-neutral" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                {members.length}
              </span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: TUGAS & DEADLINE                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'tasks' && (
            <div className="animate-fade-in">
              {/* Leader review prompt banner if any tasks are in review */}
              {isKetua && inReviewTasks > 0 && (
                <div
                  style={{
                    background: '#fdf4ff',
                    border: '1px solid #f0abfc',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldAlert size={20} color="#a21caf" />
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#86198f' }}>
                        Ada {inReviewTasks} tugas yang sudah diselesaikan anggota dan menunggu pengecekan Anda!
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#a21caf' }}>
                        Periksa link hasil kerja anggota di bawah, lalu klik &quot;Setujui Selesai&quot; atau &quot;Minta Revisi&quot;.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTaskFilter('review')}
                    className="btn btn-sm"
                    style={{ background: '#c026d3', color: 'white', whiteSpace: 'nowrap' }}
                  >
                    Lihat Tugas Dicek ({inReviewTasks})
                  </button>
                </div>
              )}

              {/* Toolbar & Filter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={`btn btn-sm ${taskFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Semua ({tasks.length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('todo')}
                    className={`btn btn-sm ${taskFilter === 'todo' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Belum Dikerjakan ({tasks.filter((t) => t.status === 'todo').length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('in_progress')}
                    className={`btn btn-sm ${taskFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Sedang Dikerjakan ({tasks.filter((t) => t.status === 'in_progress').length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('review')}
                    className={`btn btn-sm ${taskFilter === 'review' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    🔍 Menunggu Review Ketua ({inReviewTasks})
                  </button>
                  <button
                    onClick={() => setTaskFilter('done')}
                    className={`btn btn-sm ${taskFilter === 'done' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Selesai ({tasks.filter((t) => t.status === 'done').length})
                  </button>
                </div>

                <button onClick={() => setShowAddTaskModal(true)} className="btn btn-primary">
                  <Plus size={16} /> Tambah Tugas Baru
                </button>
              </div>

              {/* Task List */}
              {filteredTasks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '50px 20px', background: '#fafbfc' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: '#eef2ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
                    {taskFilter === 'all' ? 'Belum ada tugas di tim ini' : 'Tidak ada tugas dalam kategori ini'}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                    Mulai bagi tugas kelompok dan sertakan link pengerjaan agar tercapai target tepat waktu.
                  </p>
                  <button onClick={() => setShowAddTaskModal(true)} className="btn btn-primary">
                    <Plus size={16} /> Buat Tugas Pertama
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {filteredTasks.map((task) => {
                    const isDone = task.status === 'done';
                    const isInProgress = task.status === 'in_progress';
                    const isReview = task.status === 'review';

                    let borderLeftColor = '#cbd5e1';
                    if (isDone) borderLeftColor = 'var(--success)';
                    else if (isReview) borderLeftColor = '#a855f7';
                    else if (isInProgress) borderLeftColor = 'var(--primary)';

                    return (
                      <div
                        key={task.id}
                        className="card"
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 16,
                          padding: '20px 24px',
                          borderLeft: `5px solid ${borderLeftColor}`,
                          background: isReview ? '#fdfaff' : 'var(--surface)',
                          opacity: isDone ? 0.88 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                          {/* Status Icon */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isDone) handleReopenTask(task);
                              else if (task.status === 'todo') handleStartTask(task);
                            }}
                            style={{
                              marginTop: 2,
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: isDone ? 'var(--success)' : isReview ? '#f3e8ff' : isInProgress ? 'var(--primary-light)' : '#f1f5f9',
                              color: isDone ? 'white' : isReview ? '#7e22ce' : isInProgress ? 'var(--primary)' : '#94a3b8',
                              border: 'none',
                              cursor: isDone || task.status === 'todo' ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                            }}
                            title={isDone ? 'Klik untuk membuka kembali tugas' : task.status === 'todo' ? 'Klik untuk mulai pengerjaan' : undefined}
                          >
                            {isDone && <Check size={16} strokeWidth={3} />}
                            {isReview && <Clock size={16} />}
                            {isInProgress && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                            {task.status === 'todo' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />}
                          </button>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                              <h4
                                style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 700,
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                                }}
                              >
                                {task.title}
                              </h4>
                              {getDeadlineBadge(task.deadline, task.status)}
                            </div>

                            {task.description && (
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                                {task.description}
                              </p>
                            )}

                            {/* Review Notes from Member / Revision Notes from Leader */}
                            {task.review_notes && (
                              <div
                                style={{
                                  background: isReview ? '#f5f3ff' : '#fffbeb',
                                  border: `1px solid ${isReview ? '#ddd6fe' : '#fde68a'}`,
                                  borderRadius: 8,
                                  padding: '8px 12px',
                                  marginBottom: 12,
                                  fontSize: '0.825rem',
                                  color: isReview ? '#5b21b6' : '#92400e',
                                }}
                              >
                                💬 <b>Catatan:</b> {task.review_notes}
                              </div>
                            )}

                            {/* Task Link (Tautan Hasil Tugas) */}
                            {task.task_link && (
                              <div style={{ marginBottom: 12 }}>
                                <a
                                  href={task.task_link.startsWith('http') ? task.task_link : `https://${task.task_link}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    display: 'inline-flex',
                                    fontSize: '0.8rem',
                                    padding: '5px 12px',
                                    borderColor: '#c7d2fe',
                                    color: 'var(--primary)',
                                    background: '#eef2ff',
                                  }}
                                >
                                  <ExternalLink size={13} /> Buka Link Tugas ↗
                                </a>
                              </div>
                            )}

                            {/* Assignee & Meta */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: 'var(--text-subtle)' }}>Penanggung Jawab:</span>
                                {task.assignee_profile ? (
                                  <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                      {task.assignee_profile.full_name.slice(0, 1)}
                                    </span>
                                    {task.assignee_profile.full_name}
                                  </span>
                                ) : (
                                  <span style={{ fontStyle: 'italic', color: 'var(--text-subtle)' }}>Belum ditugaskan</span>
                                )}
                              </div>

                              {task.deadline && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Calendar size={13} />
                                  <span>Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Workflow Buttons based on Role & Status */}
                            {task.status === 'todo' && (
                              <button
                                onClick={() => handleStartTask(task)}
                                className="btn btn-secondary btn-sm"
                              >
                                ▶ Mulai Kerjakan
                              </button>
                            )}

                            {task.status === 'in_progress' && (
                              <>
                                {isKetua ? (
                                  <button
                                    onClick={() => handleApproveTask(task)}
                                    className="btn btn-success btn-sm"
                                  >
                                    <Check size={14} /> Tandai Selesai (Ketua)
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openSubmitReview(task)}
                                    className="btn btn-primary btn-sm"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                                  >
                                    <Send size={13} /> Ajukan Dicek Ketua
                                  </button>
                                )}
                              </>
                            )}

                            {task.status === 'review' && (
                              <>
                                {isKetua ? (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                      onClick={() => handleApproveTask(task)}
                                      className="btn btn-success btn-sm"
                                    >
                                      <Check size={14} /> Setujui Selesai
                                    </button>
                                    <button
                                      onClick={() => openRevisionModal(task)}
                                      className="btn btn-danger btn-sm"
                                    >
                                      <RotateCcw size={14} /> Minta Revisi
                                    </button>
                                  </div>
                                ) : (
                                  <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                                    Sedang Dicek Ketua
                                  </span>
                                )}
                              </>
                            )}

                            {task.status === 'done' && (
                              <button
                                onClick={() => handleReopenTask(task)}
                                className="btn btn-secondary btn-sm"
                                title="Buka kembali tugas untuk dikerjakan"
                              >
                                <RotateCcw size={13} /> Buka Kembali
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditTask(task)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 9px' }}
                              title="Edit tugas"
                            >
                              <Edit size={14} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                              title="Hapus tugas"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: STATISTIK & LEADERBOARD KONTRIBUSI                                 */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && (
            <div className="animate-fade-in">
              {/* Progress Tim Card */}
              <div className="card" style={{ padding: 28, marginBottom: 24, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
                      Kemajuan Keseluruhan Tim 🚀
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {completedTasks} dari {totalTasks} tugas telah selesai & disetujui ({overallProgress}% selesai)
                      {inReviewTasks > 0 && ` • ${inReviewTasks} sedang menunggu review Ketua`}
                    </p>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {overallProgress}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: 14, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${overallProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #4f46e5, #10b981)',
                      borderRadius: 9999,
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>

              {/* Leaderboard Section */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Trophy size={24} color="#f59e0b" />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Peringkat Kontribusi Tim (Siapa Paling Banyak Kerja)</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Dihitung secara realtime dari tugas yang telah diselesaikan anggota dan disetujui Ketua.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {contributions.map((item, idx) => {
                    let rankBadge = `${idx + 1}`;
                    let rankBg = '#f1f5f9';
                    let rankColor = '#475569';

                    if (idx === 0 && item.completed_count > 0) {
                      rankBadge = '🥇 Juara 1';
                      rankBg = '#fef3c7';
                      rankColor = '#b45309';
                    } else if (idx === 1 && item.completed_count > 0) {
                      rankBadge = '🥈 Juara 2';
                      rankBg = '#f1f5f9';
                      rankColor = '#334155';
                    } else if (idx === 2 && item.completed_count > 0) {
                      rankBadge = '🥉 Juara 3';
                      rankBg = '#ffedd5';
                      rankColor = '#9a3412';
                    }

                    return (
                      <div
                        key={item.user_id}
                        className="card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 16,
                          padding: '18px 24px',
                          border: idx === 0 && item.completed_count > 0 ? '2px solid #fde68a' : '1px solid var(--surface-border)',
                          background: idx === 0 && item.completed_count > 0 ? '#fffdf7' : 'var(--surface)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span
                            style={{
                              background: rankBg,
                              color: rankColor,
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              padding: '6px 12px',
                              borderRadius: 8,
                            }}
                          >
                            {rankBadge}
                          </span>

                          <div className="avatar-badge" style={{ width: 42, height: 42 }}>
                            {item.full_name.slice(0, 2).toUpperCase()}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{item.full_name}</h4>
                              {item.role === 'ketua' && (
                                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                  <Crown size={10} /> Ketua
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Total {item.total_assigned} tugas dipegang • {item.in_progress_count} dikerjakan • {item.in_review_count} menunggu dicek
                            </p>
                          </div>
                        </div>

                        {/* Stats Counts */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.completed_count > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                              {item.completed_count} Tugas
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Telah Selesai
                            </div>
                          </div>

                          <div style={{ minWidth: 100, textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                              {item.contribution_percentage}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Porsi Kontribusi
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MATERI & HASIL RISET (Hemat Kuota Google Drive)                     */}
          {/* ========================================================================= */}
          {activeTab === 'research' && (
            <div className="animate-fade-in">
              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
                <button onClick={() => setShowAddResearchModal(true)} className="btn btn-primary">
                  <Plus size={16} /> Tambah Link Materi / Riset
                </button>
              </div>

              {/* Research List */}
              {research.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '50px 20px', background: '#fafbfc' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <FolderGit2 size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
                    Belum ada materi atau hasil riset yang diunggah
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20, maxWidth: 500, margin: '0 auto 20px' }}>
                    Kumpulkan folder Google Drive, dokumen proposal Docs, spreadsheet anggaran, atau slide presentasi tim di sini.
                  </p>
                  <button onClick={() => setShowAddResearchModal(true)} className="btn btn-primary">
                    <Plus size={16} /> Tempel Link Google Drive Pertama
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                  {research.map((item) => (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 22,
                      }}
                    >
                      <div>
                        {/* Header card: Icon & Type */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {getResourceIcon(item.resource_type)}
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                              {item.resource_type}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => openEditResearch(item)}
                              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
                              title="Edit materi"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteResearch(item.id)}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                              title="Hapus materi"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)', lineHeight: 1.35 }}>
                          {item.title}
                        </h4>

                        {item.notes && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #f1f5f9', marginBottom: 14, lineHeight: 1.4 }}>
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Footer card: Uploader & Open Button */}
                      <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 14, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          Oleh: {item.uploader_profile?.full_name?.split(' ')[0] || 'Anggota'}
                        </span>
                        <a
                          href={item.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.8rem', gap: 5 }}
                        >
                          Buka Dokumen <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PENGATURAN TIM & MANAJEMEN ANGGOTA                                */}
          {/* ========================================================================= */}
          {activeTab === 'members' && (
            <div className="animate-fade-in">
              {/* Share Box */}
              <div className="card" style={{ padding: 26, marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 6 }}>
                  Undang Teman Bergabung ke Tim 👥
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 18 }}>
                  Cukup berikan <b>Username Tim</b> di bawah kepada teman Anda. Teman Anda hanya perlu masuk ke TimJuara lalu memilih <b>&quot;Gabung ke Tim&quot;</b>.
                </p>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', flex: 1, minWidth: 220 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Username Tim:</span>
                    <code style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                      @{team.username}
                    </code>
                  </div>
                  <button onClick={handleCopyCode} className="btn btn-primary">
                    <Copy size={16} /> Salin Kode Tim
                  </button>
                  <button onClick={handleCopyInviteLink} className="btn btn-secondary">
                    <ExternalLink size={16} /> Salin Tautan Undangan
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="card" style={{ padding: 26 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Daftar Anggota & Peran ({members.length})</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {isKetua
                        ? 'Sebagai Ketua, Anda dapat mengatur siapa yang menjadi Ketua atau Anggota.'
                        : 'Daftar rekan satu kelompok dan penanggung jawab tim.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {members.map((m) => {
                    const isSelf = m.user_id === currentUser?.id;

                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          background: '#f8fafc',
                          border: '1px solid var(--surface-border)',
                          flexWrap: 'wrap',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar-badge" style={{ width: 40, height: 40 }}>
                            {m.profile?.full_name?.slice(0, 2).toUpperCase() || 'AG'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                {m.profile?.full_name || 'Anggota Tim'}
                              </span>
                              {isSelf && (
                                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                                  Anda
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                              {m.profile?.email && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {m.profile.email} •
                                </span>
                              )}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Bergabung pada {new Date(m.joined_at).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Role Selector or Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isKetua && !isSelf ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <select
                                value={m.role}
                                onChange={(e) => handleChangeRole(m.id, e.target.value as Role)}
                                className="form-select"
                                style={{ padding: '6px 12px', fontSize: '0.825rem', width: 'auto' }}
                              >
                                <option value="ketua">👑 Ketua Tim</option>
                                <option value="anggota">👤 Anggota</option>
                              </select>
                              <button
                                onClick={() => handleKickMember(m.id, m.profile?.full_name || 'Anggota')}
                                className="btn btn-danger btn-sm"
                                title="Keluarkan anggota"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              {m.role === 'ketua' ? (
                                <span className="badge badge-warning">
                                  <Crown size={12} /> Ketua Tim
                                </span>
                              ) : (
                                <span className="badge badge-neutral">
                                  <User size={12} /> Anggota
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Leave Team Button for Members */}
                {!isKetua && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--surface-border)', textAlign: 'right' }}>
                    <button onClick={handleLeaveTeam} className="btn btn-danger btn-sm">
                      <LogOut size={14} /> Keluar dari Tim Ini
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Profile Card (Terpisah: Nama, Email, Password) */}
              <div className="card" style={{ padding: 26, marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Edit Profil Saya</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Perbarui informasi akun Anda secara terpisah sesuai kebutuhan.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Bagian 1: Ganti Nama Lengkap */}
                  <div style={{ padding: '20px 22px', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <User size={16} color="var(--primary)" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Nama Lengkap</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Nama ini akan terlihat oleh seluruh rekan satu tim pada papan tugas dan leaderboard.
                    </p>
                    <form onSubmit={handleUpdateName} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan nama lengkap Anda..."
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingName}
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {savingName ? 'Menyimpan...' : 'Simpan Nama'}
                      </button>
                    </form>
                  </div>

                  {/* Bagian 2: Ganti Alamat Email */}
                  <div style={{ padding: '20px 22px', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Mail size={16} color="#059669" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Alamat Email</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Email utama yang digunakan untuk masuk (login) ke akun TimJuara Anda.
                    </p>
                    <form onSubmit={handleUpdateEmail} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <input
                          type="email"
                          required
                          placeholder="nama@email.com"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingEmail}
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {savingEmail ? 'Menyimpan...' : 'Perbarui Email'}
                      </button>
                    </form>
                  </div>

                  {/* Bagian 3: Ganti Kata Sandi */}
                  <div style={{ padding: '20px 22px', borderRadius: 'var(--radius-md)', background: '#f8fafc', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Lock size={16} color="#d97706" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Kata Sandi Akun</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Pastikan kata sandi baru Anda minimal 6 karakter demi keamanan akun.
                    </p>
                    <form onSubmit={handleUpdatePassword}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Kata Sandi Baru</label>
                          <input
                            type="password"
                            required
                            placeholder="Minimal 6 karakter..."
                            value={profilePassword}
                            onChange={(e) => setProfilePassword(e.target.value)}
                            className="form-input"
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Konfirmasi Kata Sandi Baru</label>
                          <input
                            type="password"
                            required
                            placeholder="Ketik ulang kata sandi baru..."
                            value={profilePasswordConfirm}
                            onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          disabled={savingPassword}
                          className="btn btn-primary"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {savingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH TUGAS BARU                                                  */}
      {/* ========================================================================= */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Tambah Tugas Baru</h3>
              <button onClick={() => setShowAddTaskModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama / Judul Tugas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Membuat Bab 2 Tinjauan Pustaka"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan / Detail Tugas</label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan apa yang harus dikerjakan rekan tim..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tautan / Link Tugas (Opsional)</label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/... atau https://drive.google.com/..."
                    value={taskLink}
                    onChange={(e) => setTaskLink(e.target.value)}
                    className="form-input"
                  />
                  <span className="form-hint">Lampirkan link Google Docs, Slide, atau Drive tempat pengerjaan tugas.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Ditugaskan Kepada (Penanggung Jawab)</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Pilih Anggota Tim --</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profile?.full_name || 'Anggota'} ({m.role === 'ketua' ? 'Ketua' : 'Anggota'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Batas Waktu (Deadline)</label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Awal</label>
                  <select
                    value={taskStatusInput}
                    onChange={(e) => setTaskStatusInput(e.target.value as TaskStatus)}
                    className="form-select"
                  >
                    <option value="todo">Belum Dimulai</option>
                    <option value="in_progress">Sedang Dikerjakan</option>
                    <option value="review">Menunggu Review Ketua</option>
                    <option value="done">Sudah Selesai</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TUGAS                                                         */}
      {/* ========================================================================= */}
      {showEditTaskModal && (
        <div className="modal-overlay" onClick={() => setShowEditTaskModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Tugas</h3>
              <button onClick={() => setShowEditTaskModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama / Judul Tugas</label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan / Detail Tugas</label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tautan / Link Tugas</label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/... atau https://drive.google.com/..."
                    value={taskLink}
                    onChange={(e) => setTaskLink(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Penanggung Jawab</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Pilih Anggota Tim --</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profile?.full_name || 'Anggota'} ({m.role === 'ketua' ? 'Ketua' : 'Anggota'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Batas Waktu (Deadline)</label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status Tugas</label>
                  <select
                    value={taskStatusInput}
                    onChange={(e) => setTaskStatusInput(e.target.value as TaskStatus)}
                    className="form-select"
                  >
                    <option value="todo">Belum Dimulai</option>
                    <option value="in_progress">Sedang Dikerjakan</option>
                    <option value="review">🔍 Menunggu Review Ketua</option>
                    <option value="done">✅ Sudah Selesai</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditTaskModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUKAN REVIEW KE KETUA (Member Workflow)                          */}
      {/* ========================================================================= */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ajukan Tugas untuk Dicek Ketua</h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmSubmitReview}>
              <div className="modal-body">
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: '0.825rem', color: '#5b21b6' }}>
                  📌 <b>Info:</b> Tugas ini akan masuk ke daftar <i>&quot;Menunggu Review Ketua&quot;</i> agar dicek kelayakannya terlebih dahulu sebelum ditandai resmi selesai.
                </div>

                <div className="form-group">
                  <label className="form-label">Link Hasil Pengerjaan (Google Drive / Docs / Figma)</label>
                  <input
                    type="text"
                    required
                    placeholder="https://docs.google.com/... atau https://drive.google.com/..."
                    value={submitTaskLink}
                    onChange={(e) => setSubmitTaskLink(e.target.value)}
                    className="form-input"
                  />
                  <span className="form-hint">Sematkan link hasil kerja Anda agar Ketua dapat langsung memeriksa.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan untuk Ketua Tim (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Bab 2 sudah selesai sampai subbab 2.3, tolong dicek daftar pustakanya ya..."
                    value={submitTaskNotes}
                    onChange={(e) => setSubmitTaskNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowReviewModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#7c3aed' }}>
                  <Send size={15} /> Kirim Pengajuan Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MINTA REVISI DARI KETUA                                            */}
      {/* ========================================================================= */}
      {showRevisionModal && (
        <div className="modal-overlay" onClick={() => setShowRevisionModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Minta Revisi kepada Anggota</h3>
              <button onClick={() => setShowRevisionModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmRevision}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Tugas <b>&quot;{selectedTask?.title}&quot;</b> akan dikembalikan ke status <b>Sedang Dikerjakan</b>.
                </p>

                <div className="form-group">
                  <label className="form-label">Poin Revisi / Catatan Perbaikan</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Jelaskan bagian mana yang perlu diperbaiki oleh anggota tim..."
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowRevisionModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-danger">
                  Kirim Catatan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH MATERI / LINK GOOGLE DRIVE (Hemat Kuota)                   */}
      {/* ========================================================================= */}
      {showAddResearchModal && (
        <div className="modal-overlay" onClick={() => setShowAddResearchModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Tambah Link Materi / Riset</h3>
              <button onClick={() => setShowAddResearchModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddResearch}>
              <div className="modal-body">
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: '0.8rem', color: '#166534' }}>
                  💡 <b>Tips:</b> Tempel tautan Google Drive / Docs Anda. Pastikan akses tautan di Google Drive sudah diatur ke <i>&quot;Siapa saja yang memiliki link dapat melihat/mengedit&quot;</i>.
                </div>

                <div className="form-group">
                  <label className="form-label">Judul Materi / Berkas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Draf Proposal Lomba Final atau Folder Aset Gambar"
                    value={researchTitle}
                    onChange={(e) => setResearchTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tautan (URL) Google Drive / Dokumen</label>
                  <input
                    type="text"
                    required
                    placeholder="https://drive.google.com/... atau https://docs.google.com/..."
                    value={researchUrl}
                    onChange={(e) => setResearchUrl(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Dokumen</label>
                  <select
                    value={researchType}
                    onChange={(e) => setResearchType(e.target.value as ResourceType)}
                    className="form-select"
                  >
                    <option value="drive">📁 Folder Google Drive</option>
                    <option value="docs">📄 Google Docs (Dokumen)</option>
                    <option value="sheets">📊 Google Sheets (Spreadsheet)</option>
                    <option value="slides">📽️ Google Slides (Presentasi)</option>
                    <option value="figma">🎨 Desain Figma</option>
                    <option value="link">🔗 Tautan Web Lainnya</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Singkat / Rangkuman (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Bab 1 dan Bab 2 sudah siap review, Bab 3 masih revisi pembimbing."
                    value={researchNotes}
                    onChange={(e) => setResearchNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddResearchModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Tautan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT MATERI / HASIL RISET                                          */}
      {/* ========================================================================= */}
      {showEditResearchModal && (
        <div className="modal-overlay" onClick={() => setShowEditResearchModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Materi / Riset</h3>
              <button onClick={() => setShowEditResearchModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditResearch}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Judul Materi / Berkas</label>
                  <input
                    type="text"
                    required
                    value={researchTitle}
                    onChange={(e) => setResearchTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tautan (URL) Google Drive / Dokumen</label>
                  <input
                    type="text"
                    required
                    value={researchUrl}
                    onChange={(e) => setResearchUrl(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Dokumen</label>
                  <select
                    value={researchType}
                    onChange={(e) => setResearchType(e.target.value as ResourceType)}
                    className="form-select"
                  >
                    <option value="drive">📁 Folder Google Drive</option>
                    <option value="docs">📄 Google Docs (Dokumen)</option>
                    <option value="sheets">📊 Google Sheets (Spreadsheet)</option>
                    <option value="slides">📽️ Google Slides (Presentasi)</option>
                    <option value="figma">🎨 Desain Figma</option>
                    <option value="link">🔗 Tautan Web Lainnya</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Singkat / Rangkuman</label>
                  <textarea
                    rows={2}
                    value={researchNotes}
                    onChange={(e) => setResearchNotes(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditResearchModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
