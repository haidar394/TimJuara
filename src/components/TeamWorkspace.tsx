'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
  isMasterAdmin,
  calculateContributionStats,
  signOutUser,
  updateUserProfile,
  updateUserName,
  updateUserEmail,
  updateUserPassword,
  updateUserPhoneNumber,
  updateUserAvatar,
  updateTeamAvatar,
  formatDirectImageUrl,
  getUserTeamsWithDetails,
  getUserAllActiveTasks,
  createTeam,
  joinTeamByUsername,
  updateTeamWhatsAppConfig,
  sendTestWhatsAppMessage,
  triggerDeadlineReminders,
  getGlobalWhatsAppConfig,
  getTaskComments,
  addTaskComment,
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendRealtimeWhatsAppNotification,
  updateTeamWhatsAppGroup,
  getWhatsAppGroups,
  getAITeamDigest,
  getAIPersonalFocus,
  breakdownTaskWithAI,
  AITeamDigest,
  AIPersonalFocus,
  AISubtask,
  AITaskBreakdown,
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
  TaskComment,
  AppNotification,
  UserTeamItem,
} from '@/lib/types';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trophy,
  ChevronDown,
  UserPlus,
  PlusCircle,
  Layers,
  Search,
  LayoutGrid,
  FolderGit2,
  Settings,
  Plus,
  Copy,
  LayoutDashboard,
  Camera,
  Upload,
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
  Phone,
  MessageSquare,
  Smartphone,
  BellRing,
  Share2,
  Bell,
  Sun,
  Moon,
  MessageCircle,
  RefreshCw,
  Bot,
  Wand2,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export default function TeamWorkspace() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const teamUsername = (routeParams?.username as string) || '';

  // Global State
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [research, setResearch] = useState<ResearchMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab & Filters (4 Menu: overview, tasks, research, settings)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'research' | 'settings'>('overview');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'in_progress' | 'review' | 'done'>('all');

  // User Teams List & All User Tasks for Global Overview
  const [userTeams, setUserTeams] = useState<UserTeamItem[]>([]);
  const [allUserTasks, setAllUserTasks] = useState<(Task & { team_name?: string; team_username?: string })[]>([]);
  const [searchTeamQuery, setSearchTeamQuery] = useState('');
  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false);
  const [overviewTaskFilter, setOverviewTaskFilter] = useState<'adaptive' | 'current_team' | 'urgent'>('adaptive');
  const [showAllOverviewTasks, setShowAllOverviewTasks] = useState(false);

  // Modals for Create & Join Team directly from Workspace
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamUsername, setNewTeamUsername] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [joinUsernameInput, setJoinUsernameInput] = useState('');
  const [submittingTeamAction, setSubmittingTeamAction] = useState(false);

  // Avatar Editing State
  const [showTeamAvatarModal, setShowTeamAvatarModal] = useState(false);
  const [teamAvatarUrl, setTeamAvatarUrl] = useState('');
  const [savingTeamAvatar, setSavingTeamAvatar] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState('');
  const [savingUserAvatar, setSavingUserAvatar] = useState(false);

  // WhatsApp Group Connect Modal (TeamWorkspace)
  const [showConnectTeamGroupModal, setShowConnectTeamGroupModal] = useState(false);
  const [teamGroupInputId, setTeamGroupInputId] = useState('');
  const [teamGroupInputName, setTeamGroupInputName] = useState('');
  const [teamAvailableGroups, setTeamAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTeamGroups, setLoadingTeamGroups] = useState(false);
  const [isSavingTeamGroup, setIsSavingTeamGroup] = useState(false);
  const [isTestingTeamGroup, setIsTestingTeamGroup] = useState(false);
  const [isSendingGroupRecap, setIsSendingGroupRecap] = useState(false);
  const [sendingTeamReminders, setSendingTeamReminders] = useState(false);

  // Unread Comments Tracking (task_id -> last_known_count)
  const [readCommentsMap, setReadCommentsMap] = useState<Record<string, number>>({});

  // TimJuara AI States
  const [aiDigest, setAiDigest] = useState<AITeamDigest | null>(null);
  const [loadingAiDigest, setLoadingAiDigest] = useState(false);
  const [aiPersonalFocus, setAiPersonalFocus] = useState<AIPersonalFocus | null>(null);
  const [loadingAiPersonalFocus, setLoadingAiPersonalFocus] = useState(false);
  const [showAiBreakdownModal, setShowAiBreakdownModal] = useState(false);
  const [loadingAiBreakdown, setLoadingAiBreakdown] = useState(false);
  const [aiBreakdownResult, setAiBreakdownResult] = useState<AITaskBreakdown | null>(null);
  const [selectedSubtasks, setSelectedSubtasks] = useState<number[]>([]);
  const [creatingSubtasks, setCreatingSubtasks] = useState(false);
  const [generatingDod, setGeneratingDod] = useState(false);

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
  const [taskAssigneeIds, setTaskAssigneeIds] = useState<string[]>([]);
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskStatusInput, setTaskStatusInput] = useState<TaskStatus>('todo');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // In-App Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  // Task Discussion Comments State
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Review submission state (Member -> Ketua)
  const [submitTaskLink, setSubmitTaskLink] = useState('');
  const [submitTaskNotes, setSubmitTaskNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Revision request state (Ketua -> Member)
  const [revisionNotes, setRevisionNotes] = useState('');

  // Ketua Review & Verification Modal state
  const [showKetuaReviewModal, setShowKetuaReviewModal] = useState(false);
  const [ketuaReviewTask, setKetuaReviewTask] = useState<Task | null>(null);
  const [ketuaReviewNotes, setKetuaReviewNotes] = useState('');
  const [ketuaReviewLoading, setKetuaReviewLoading] = useState(false);
  const [ketuaReviewComments, setKetuaReviewComments] = useState<TaskComment[]>([]);
  const [loadingReviewComments, setLoadingReviewComments] = useState(false);

  // Form State: Add / Edit Research Material
  const [researchTitle, setResearchTitle] = useState('');
  const [researchUrl, setResearchUrl] = useState('');
  const [researchType, setResearchType] = useState<ResourceType>('drive');
  const [researchNotes, setResearchNotes] = useState('');

  // Form State: Edit Profile (Terpisah: Nama, Nomor WA, Email, Password)
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // WhatsApp Test State
  const [testingWa, setTestingWa] = useState(false);
  const [globalWaToken, setGlobalWaToken] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(isDark);
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tabParam = searchParams.get('tab');
      if (tabParam === 'tasks' || tabParam === 'research' || tabParam === 'settings' || tabParam === 'overview') {
        setActiveTab(tabParam);
      }
      const taskIdParam = searchParams.get('taskId');
      if (taskIdParam) {
        setTimeout(() => {
          const el = document.getElementById(`task-${taskIdParam}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [searchParams]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('timjuara_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('timjuara_theme', 'light');
    }
  };

  const loadNotifications = async (userId: string) => {
    const data = await getUserNotifications(userId);
    setNotifications(data);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const openTaskComments = async (task: Task) => {
    setSelectedTaskForComments(task);
    setShowCommentsModal(true);
    setLoadingComments(true);

    // Tandai seluruh komentar pada tugas ini sudah dibaca oleh user saat ini
    if (currentUser) {
      const currentCommentsCount = task.comments_count || 0;
      const updated = {
        ...readCommentsMap,
        [task.id]: Math.max(currentCommentsCount, (readCommentsMap[task.id] || 0) + 1),
      };
      setReadCommentsMap(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`timjuara_read_comments_${currentUser.id}`, JSON.stringify(updated));
        } catch (err) {
          console.error(err);
        }
      }
    }

    const data = await getTaskComments(task.id);
    setTaskComments(data);
    setLoadingComments(false);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForComments || !currentUser || !commentInput.trim()) return;

    setSendingComment(true);
    const { comment, error } = await addTaskComment(
      selectedTaskForComments.id,
      currentUser.id,
      commentInput.trim()
    );
    setSendingComment(false);

    if (comment) {
      setTaskComments((prev) => [...prev, comment]);
      setCommentInput('');

      const newCommentsCount = (selectedTaskForComments.comments_count || 0) + 1;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTaskForComments.id
            ? { ...t, comments_count: newCommentsCount }
            : t
        )
      );

      // Tandai komentar sendiri sebagai telah dibaca
      const updatedRead = { ...readCommentsMap, [selectedTaskForComments.id]: newCommentsCount };
      setReadCommentsMap(updatedRead);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`timjuara_read_comments_${currentUser.id}`, JSON.stringify(updatedRead));
        } catch (err) {
          console.error(err);
        }
      }

      const recipientIds = new Set<string>();
      (selectedTaskForComments.assigned_to_ids || []).forEach((id) => recipientIds.add(id));
      if (selectedTaskForComments.assigned_to) recipientIds.add(selectedTaskForComments.assigned_to);
      if (selectedTaskForComments.created_by) recipientIds.add(selectedTaskForComments.created_by);
      recipientIds.delete(currentUser.id);

      recipientIds.forEach((rId) => {
        createNotification(
          rId,
          `💬 Komentar Baru: ${selectedTaskForComments.title}`,
          `${currentUser.full_name}: "${comment.content.slice(0, 80)}"`,
          `/team/${team?.username}`,
          team?.id
        );
      });
    } else if (error) {
      showToast(`Gagal mengirim komentar: ${error}`);
    }
  };

  // Avatar Actions
  const handleSaveTeamAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    const directUrl = formatDirectImageUrl(teamAvatarUrl);
    setSavingTeamAvatar(true);
    const { success, error } = await updateTeamAvatar(team.id, directUrl);
    setSavingTeamAvatar(false);
    if (success) {
      setTeamAvatarUrl(directUrl);
      setTeam((prev) => prev ? { ...prev, avatar_url: directUrl } : null);
      setShowTeamAvatarModal(false);
      showToast('Foto profil tim berhasil diperbarui!');
    } else {
      showToast(`Gagal memperbarui foto tim: ${error}`);
    }
  };

  const handleUpdateUserAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const directUrl = formatDirectImageUrl(userAvatarUrl);
    setSavingUserAvatar(true);
    const { success, error } = await updateUserAvatar(currentUser.id, directUrl);
    setSavingUserAvatar(false);
    if (success) {
      setUserAvatarUrl(directUrl);
      setCurrentUser((prev) => prev ? { ...prev, avatar_url: directUrl } : null);
      showToast('Foto profil Anda berhasil disimpan!');
    } else {
      showToast(`Gagal menyimpan foto profil: ${error}`);
    }
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
    setProfilePhone(user.phone_number || '');
    setProfileEmail(user.email || '');
    setUserAvatarUrl(user.avatar_url || '');
    loadNotifications(user.id);

    // Ambil rekam jejak komentar yang sudah dibaca user dari localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedRead = localStorage.getItem(`timjuara_read_comments_${user.id}`);
        if (storedRead) {
          setReadCommentsMap(JSON.parse(storedRead));
        }
      } catch (e) {
        console.error('Error loading read comments map:', e);
      }
    }

    const { team: teamData, members: membersData } = await getTeamByUsername(teamUsername);
    if (!teamData) {
      const myTeams = await getUserTeamsWithDetails(user.id);
      if (myTeams && myTeams.length > 0) {
        router.replace(`/team/${myTeams[0].username}`);
      } else {
        router.replace('/onboarding');
      }
      return;
    }

    setTeam(teamData);
    setTeamAvatarUrl(teamData.avatar_url || '');
    setMembers(membersData);

    const taskList = await getTeamTasks(teamData.id);
    setTasks(taskList);

    const researchList = await getTeamResearch(teamData.id);
    setResearch(researchList);

    // Load All Teams of User for Dropdown Switcher
    const myTeams = await getUserTeamsWithDetails(user.id);
    setUserTeams(myTeams);

    // Load All Active Tasks across All Teams for Global Overview
    const allTasks = await getUserAllActiveTasks(user.id);
    setAllUserTasks(allTasks);

    // Load AI Digest & Personal Focus
    loadAiDigest(teamData.name, taskList, membersData);
    loadAiPersonalFocus(user.full_name || 'Rekan Tim', allTasks, teamData.name);

    // Auto-heartbeat: cek & jalankan otomasi bot deadline harian jika sudah melewati jam 08:00 WIB
    checkDailyDeadlineAutomation(teamData.id);

    // Load Global WhatsApp Token
    getGlobalWhatsAppConfig().then((cfg) => {
      if (cfg?.wa_gateway_token) {
        setGlobalWaToken(cfg.wa_gateway_token);
      }
    }).catch(() => {});

    setLoading(false);
  };

  const handleCreateTeamFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmittingTeamAction(true);
    const { team: newT, error } = await createTeam(newTeamName, newTeamUsername, newTeamDesc, currentUser.id);
    setSubmittingTeamAction(false);
    if (error || !newT) {
      showToast(error || 'Gagal membuat tim baru');
    } else {
      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamUsername('');
      setNewTeamDesc('');
      showToast(`Tim ${newT.name} berhasil dibuat!`);
      router.push(`/team/${newT.username}`);
    }
  };

  // ==========================================
  // TIMJUARA AI HANDLERS
  // ==========================================
  const loadAiDigest = async (tName?: string, tTasks?: Task[], tMembers?: TeamMember[], force: boolean = false) => {
    const currentTeamName = tName || team?.name;
    if (!currentTeamName) return;
    const currentTasks = tTasks || tasks;
    const currentMembers = tMembers || members;
    const cacheKey = `timjuara_ai_digest_${team?.id || currentTeamName}`;

    if (!force && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          setAiDigest(JSON.parse(cached));
          return;
        } catch (e) {}
      }
    }

    setLoadingAiDigest(true);
    try {
      const res = await getAITeamDigest(currentTeamName, currentTasks, currentMembers);
      if (res.success && res.data) {
        setAiDigest(res.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
        }
      }
    } catch (e) {
      console.warn('Gagal memuat AI Digest:', e);
    } finally {
      setLoadingAiDigest(false);
    }
  };

  const loadAiPersonalFocus = async (uName?: string, uTasks?: any[], tName?: string, force: boolean = false) => {
    const userName = uName || currentUser?.full_name || 'Rekan Tim';
    const allTasks = uTasks || allUserTasks;
    const currentTeamName = tName || team?.name || 'TimJuara';
    const cacheKey = `timjuara_ai_focus_${currentUser?.id || userName}`;

    if (!force && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          setAiPersonalFocus(JSON.parse(cached));
          return;
        } catch (e) {}
      }
    }

    setLoadingAiPersonalFocus(true);
    try {
      const activeMyTasks = allTasks.filter((t: any) => t.status !== 'done');
      const res = await getAIPersonalFocus(userName, activeMyTasks, currentTeamName);
      if (res.success && res.data) {
        setAiPersonalFocus(res.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
        }
      }
    } catch (e) {
      console.warn('Gagal memuat AI Focus:', e);
    } finally {
      setLoadingAiPersonalFocus(false);
    }
  };

  const handleTriggerAiBreakdown = async () => {
    if (!taskTitle.trim()) {
      showToast('Ketik nama/judul tugas terlebih dahulu untuk dipecah oleh AI! 💡');
      return;
    }
    setLoadingAiBreakdown(true);
    setShowAiBreakdownModal(true);
    setAiBreakdownResult(null);

    const res = await breakdownTaskWithAI(taskTitle, taskDesc);
    setLoadingAiBreakdown(false);
    if (res.success && res.data) {
      setAiBreakdownResult(res.data);
      setSelectedSubtasks(res.data.subtasks.map((_, i) => i));
    } else {
      showToast('Gagal memecah tugas: ' + (res.error || 'Terjadi kesalahan'));
    }
  };

  const handleApplySubtasks = async () => {
    if (!aiBreakdownResult || !team || !currentUser) return;
    const toCreate = aiBreakdownResult.subtasks.filter((_, i) => selectedSubtasks.includes(i));
    if (toCreate.length === 0) {
      showToast('Pilih minimal 1 subtask untuk dibuat! ⚠️');
      return;
    }

    setCreatingSubtasks(true);
    try {
      for (const sub of toCreate) {
        const d = new Date();
        d.setDate(d.getDate() + (sub.estimatedDays || 2));
        await createTask({
          team_id: team.id,
          title: sub.title,
          description: sub.description ? `${sub.description}\n\nPeran Rekomendasi: ${sub.suggestedRole}` : undefined,
          deadline: d.toISOString(),
          assigned_to: taskAssigneeIds.length > 0 ? taskAssigneeIds[0] : undefined,
          assigned_to_ids: taskAssigneeIds.length > 0 ? taskAssigneeIds : undefined,
          status: 'todo',
          created_by: currentUser.id,
        });
      }
      showToast(`🎉 Berhasil membuat ${toCreate.length} subtask sekaligus ke workspace!`);
      setShowAiBreakdownModal(false);
      setShowAddTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssigneeIds([]);
      setTaskDeadline('');
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
      loadAiDigest(team.name, updated, members, true);
    } catch (err: any) {
      showToast('Gagal membuat subtask: ' + err.message);
    } finally {
      setCreatingSubtasks(false);
    }
  };

  const handleGenerateAiDod = async () => {
    if (!taskTitle.trim()) {
      showToast('Ketik nama/judul tugas terlebih dahulu! 💡');
      return;
    }
    setGeneratingDod(true);
    const res = await breakdownTaskWithAI(taskTitle, taskDesc);
    setGeneratingDod(false);
    if (res.success && res.data && res.data.definitionOfDone?.length > 0) {
      const dodText = '\n\n📋 *Kriteria Selesai (Definition of Done)*:\n' + res.data.definitionOfDone.map((d) => `• ${d}`).join('\n');
      setTaskDesc((prev) => (prev ? prev.trim() + dodText : dodText.trim()));
      showToast('✨ Kriteria selesai berhasil ditambahkan ke deskripsi!');
    } else {
      showToast('Gagal membuat kriteria selesai.');
    }
  };

  // ==========================================
  // AUTOMATION: BOT DEADLINE CHECK & NOTIFIKASI KETUA
  // ==========================================
  const checkDailyDeadlineAutomation = async (teamId: string) => {
    if (typeof window === 'undefined') return;
    const todayStr = new Date().toISOString().split('T')[0];
    const checkKey = `timjuara_auto_remind_${teamId}_${todayStr}`;
    if (localStorage.getItem(checkKey)) return;

    // Hitung jam WIB (UTC + 7)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const wibHours = (utcHours + 7) % 24;

    // Jika jam 8 pagi atau lebih (08:00 - 23:59 WIB)
    if (wibHours >= 8) {
      localStorage.setItem(checkKey, 'pending');
      try {
        const res = await triggerDeadlineReminders(teamId, false);
        if (res.success) {
          localStorage.setItem(checkKey, 'done');
          if (currentUser) {
            loadNotifications(currentUser.id);
          }
          if (res.sentCount && res.sentCount > 0) {
            showToast(`📢 Bot WhatsApp: ${res.sentCount} pengingat deadline otomatis berhasil dikirim jam 08:00 hari ini!`);
          }
        }
      } catch (err) {
        console.warn('Auto remind error:', err);
      }
    }
  };

  const handleManualTriggerTeamReminders = async () => {
    if (!team) return;
    setSendingTeamReminders(true);
    try {
      const res = await triggerDeadlineReminders(team.id, true);
      if (res.success) {
        showToast(`📢 Bot WhatsApp: Berhasil mengirim ${res.sentCount || 0} pengingat deadline ke WhatsApp tim!`);
        if (currentUser) {
          loadNotifications(currentUser.id);
        }
      } else {
        showToast('⚠️ Gagal: ' + (res.error || 'Periksa token Fonnte'));
      }
    } catch (err: any) {
      showToast('Gagal mengirim pengingat: ' + err.message);
    } finally {
      setSendingTeamReminders(false);
    }
  };

  const handleJoinTeamFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmittingTeamAction(true);
    const { success, team: joinedT, error } = await joinTeamByUsername(joinUsernameInput, currentUser.id);
    setSubmittingTeamAction(false);
    if (!success || !joinedT) {
      showToast(error || 'Gagal bergabung ke tim');
    } else {
      setShowJoinTeamModal(false);
      setJoinUsernameInput('');
      showToast(`Berhasil bergabung ke tim ${joinedT.name}!`);
      router.push(`/team/${joinedT.username}`);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [teamUsername]);

  // Current User Role in this team & Master Admin Privilege
  const currentMember = members.find((m) => m.user_id === currentUser?.id);
  const isKetua = currentMember?.role === 'ketua' || (team && currentUser && team.created_by === currentUser.id);
  const isMasterAdminUser = isMasterAdmin(currentUser);
  const canManageMembers = isKetua || isMasterAdminUser;

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
  // TASK ACTIONS (Multi-PIC, Real-Time WA & In-App Notif)
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

    const assignedIds = taskAssigneeIds.length > 0 ? taskAssigneeIds : [currentUser.id];

    const { task, error } = await createTask({
      team_id: team.id,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      task_link: taskLink.trim(),
      assigned_to: assignedIds[0],
      assigned_to_ids: assignedIds,
      deadline: deadlineIso,
      status: taskStatusInput,
      created_by: currentUser.id,
    });

    if (error) {
      showToast(`Gagal menambahkan tugas: ${error}`);
      return;
    }

    // Kirim notifikasi In-App & WA Real-Time ke seluruh anggota yang ditugaskan
    const targetMembers = members.filter((m) => assignedIds.includes(m.user_id));
    targetMembers.forEach((m) => {
      createNotification(
        m.user_id,
        '📌 Tugas Baru Ditugaskan',
        `Kamu ditugaskan untuk "${taskTitle.trim()}" di tim ${team.name}.`,
        `/team/${team.username}`,
        team.id
      );
    });

    const waPhones = targetMembers
      .map((m) => m.profile?.phone_number)
      .filter((p): p is string => Boolean(p && p.trim()));

    if (waPhones.length > 0) {
      const deadlineText = deadlineIso
        ? new Date(deadlineIso).toLocaleDateString('id-ID', { dateStyle: 'full' })
        : 'Tidak ada batas waktu';
      const waMsg = `🔔 *TUGAS BARU DITUGASKAN - TIMJUARA*\n\nHalo Rekan Tim! 👋\nKamu baru saja ditugaskan pada tugas baru di tim *${team.name}*:\n📌 *${taskTitle.trim()}*\n📅 Deadline: *${deadlineText}*\n${taskDesc.trim() ? `📝 Catatan: ${taskDesc.trim()}\n` : ''}\nBuka TimJuara: ${window.location.origin}/team/${team.username}`;
      sendRealtimeWhatsAppNotification(waPhones, waMsg, team.wa_gateway_token);
    }

    // Notifikasi Otomatis Bot ke Grup WhatsApp Tim
    const teamGroupId = team.wa_group_id || (typeof window !== 'undefined' ? localStorage.getItem('timjuara_team_wa_group_' + team.id) || undefined : undefined);
    if (teamGroupId) {
      const deadlineText = deadlineIso
        ? new Date(deadlineIso).toLocaleDateString('id-ID', { dateStyle: 'full' })
        : 'Tidak ada batas waktu';
      const picNames = targetMembers.map((m) => m.profile?.full_name || 'Anggota').join(', ') || 'Seluruh Tim';

      const groupWaMsg = `📢 *TUGAS BARU - ${team.name.toUpperCase()}* 🚀\n\nHalo Rekan-rekan Tim! 👋\nAda tugas baru yang baru saja ditambahkan ke workspace:\n\n📌 *Judul*: *${taskTitle.trim()}*\n👤 *Ditugaskan ke*: *${picNames}*\n📅 *Deadline*: *${deadlineText}*\n${taskDesc.trim() ? `📝 *Catatan*: ${taskDesc.trim()}\n` : ''}${taskLink.trim() ? `🔗 *Link*: ${taskLink.trim()}\n` : ''}\nYuk segera berproses bersama di TimJuara:\n👉 ${window.location.origin}/team/${team.username}\n\nSemangat berkolaborasi dan raih juara! 🔥`;

      sendTestWhatsAppMessage(teamGroupId, groupWaMsg, team.wa_gateway_token)
        .then((res) => {
          if (res.success) {
            showToast('📢 Bot WA: Notifikasi tugas baru terkirim ke grup!');
          } else {
            console.warn('Gagal kirim bot ke grup:', res.error);
            showToast('⚠️ Bot WA grup: ' + (res.error || 'Gagal mengirim pesan'));
          }
        })
        .catch((e) => {
          console.warn('Gagal kirim bot ke grup:', e);
        });
    }

    setTaskTitle('');
    setTaskDesc('');
    setTaskLink('');
    setTaskAssignee('');
    setTaskAssigneeIds([]);
    setTaskDeadline('');
    setTaskStatusInput('todo');
    setShowAddTaskModal(false);
    showToast('Tugas baru berhasil ditambahkan! 📋');

    const updated = await getTeamTasks(team.id);
    setTasks(updated);
  };

  const toggleAssignee = (userId: string) => {
    setTaskAssigneeIds((prev) => {
      const next = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
      setTaskAssignee(next[0] || '');
      return next;
    });
  };

  const openAddTaskModal = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskLink('');
    setTaskAssignee(currentUser?.id || '');
    setTaskAssigneeIds(currentUser ? [currentUser.id] : []);
    setTaskDeadline('');
    setTaskStatusInput('todo');
    setShowAddTaskModal(true);
  };

  // Open Edit Task Modal
  const openEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskLink(task.task_link || '');
    setTaskAssignee(task.assigned_to || '');
    setTaskAssigneeIds(
      task.assigned_to_ids && task.assigned_to_ids.length > 0
        ? task.assigned_to_ids
        : task.assigned_to
        ? [task.assigned_to]
        : []
    );
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

    const assignedIds = taskAssigneeIds.length > 0
      ? taskAssigneeIds
      : taskAssignee
      ? [taskAssignee]
      : [];

    const { success, error } = await updateTask(selectedTask.id, {
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      task_link: taskLink.trim(),
      assigned_to: assignedIds[0] || undefined,
      assigned_to_ids: assignedIds,
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

  // Quick 1-Click Submit Task for Review (Langsung ubah status jadi Menunggu Review / ACC)
  const handleQuickSubmitReview = async (task: Task) => {
    if (!currentUser || !team) return;

    const targetTaskId = task.id;
    const taskTitle = task.title;

    // 1. Optimistic Update langsung seketika di tampilan web
    setTasks((prev) =>
      prev.map((t) =>
        t.id === targetTaskId
          ? {
              ...t,
              status: 'review',
              review_notes: t.review_notes ? `${t.review_notes}` : '[STATUS:REVIEW]',
            }
          : t
      )
    );

    showToast('Tugas telah diajukan ke Ketua Tim untuk di-ACC! 🔍');

    try {
      // 2. Kirim update ke database
      await updateTask(targetTaskId, {
        status: 'review',
        review_notes: task.review_notes ? `${task.review_notes}` : '[STATUS:REVIEW]',
      });

      // 3. Notifikasi In-App & WA Real-Time ke Ketua Tim
      const ketuaMember = members.find(
        (m) => m.role === 'ketua' || (m as any).role === 'leader' || (team.created_by && m.user_id === team.created_by)
      );
      if (ketuaMember && ketuaMember.user_id !== currentUser.id) {
        createNotification(
          ketuaMember.user_id,
          '🔍 Tugas Diajukan untuk Dicek',
          `${currentUser.full_name} mengajukan "${taskTitle}" untuk dicek & di-ACC.`,
          `/team/${team.username}`,
          team.id
        );

        if (ketuaMember.profile?.phone_number) {
          const waMsg = `📋 *PENGAJUAN TUGAS UNTUK DICEK - TIMJUARA*\n\nHalo *${ketuaMember.profile.full_name}* (Ketua)! 👋\n*${currentUser.full_name}* telah menyelesaikan dan mengajukan tugas untuk di-ACC:\n📌 *${taskTitle}*\n${task.task_link ? `🔗 Link Hasil: ${task.task_link}\n` : ''}\nSilakan periksa di TimJuara: ${window.location.origin}/team/${team.username}`;
          sendRealtimeWhatsAppNotification([ketuaMember.profile.phone_number], waMsg, team.wa_gateway_token);
        }
      }

      // 4. Sinkronisasi ulang dengan database
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    } catch (err: any) {
      console.error('Exception in handleQuickSubmitReview:', err);
    }
  };

  // Submit Task for Review with Modal (Anggota -> Ketua)
  const openSubmitReview = (task: Task) => {
    setSelectedTask(task);
    setSubmitTaskLink(task.task_link || '');
    const cleanNotes = (task.review_notes || '').replace(/\[STATUS:REVIEW\]\s*/g, '').trim();
    setSubmitTaskNotes(cleanNotes);
    setShowReviewModal(true);
  };

  const handleConfirmSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !currentUser || !team) return;

    setIsSubmittingReview(true);
    const targetTaskId = selectedTask.id;
    const taskTitle = selectedTask.title;
    const notes = submitTaskNotes.trim();
    const link = submitTaskLink.trim();

    // 1. Optimistic Update di antarmuka web langsung seketika
    setTasks((prev) =>
      prev.map((t) =>
        t.id === targetTaskId
          ? {
              ...t,
              status: 'review',
              review_notes: notes || t.review_notes || '[STATUS:REVIEW]',
              task_link: link || t.task_link || '',
            }
          : t
      )
    );

    try {
      // 2. Kirim update ke database
      await updateTask(targetTaskId, {
        status: 'review',
        review_notes: notes || '[STATUS:REVIEW]',
        task_link: link || selectedTask.task_link || '',
      });

      // 3. Notifikasi In-App & WA Real-Time ke Ketua Tim
      const ketuaMember = members.find(
        (m) => m.role === 'ketua' || (m as any).role === 'leader' || (team.created_by && m.user_id === team.created_by)
      );
      if (ketuaMember && ketuaMember.user_id !== currentUser.id) {
        createNotification(
          ketuaMember.user_id,
          '🔍 Tugas Diajukan untuk Dicek',
          `${currentUser.full_name} mengajukan "${taskTitle}" untuk dicek & di-ACC.`,
          `/team/${team.username}`,
          team.id
        );

        if (ketuaMember.profile?.phone_number) {
          const waMsg = `📋 *PENGAJUAN TUGAS UNTUK DICEK - TIMJUARA*\n\nHalo *${ketuaMember.profile.full_name}* (Ketua)! 👋\n*${currentUser.full_name}* telah menyelesaikan dan mengajukan tugas untuk dicek:\n📌 *${taskTitle}*\n${link ? `🔗 Link Hasil: ${link}\n` : ''}${notes ? `📝 Catatan: ${notes}\n` : ''}\nSilakan periksa di TimJuara: ${window.location.origin}/team/${team.username}`;
          sendRealtimeWhatsAppNotification([ketuaMember.profile.phone_number], waMsg, team.wa_gateway_token);
        }
      }

      setShowReviewModal(false);
      setSelectedTask(null);
      showToast('Tugas telah diajukan ke Ketua Tim untuk di-ACC! 🔍');

      // Sinkronisasi ulang dengan database
      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    } catch (err: any) {
      console.error('Exception in handleConfirmSubmitReview:', err);
      showToast('Terjadi kesalahan saat mengajukan review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Approve Task (Ketua -> Done)
  const handleApproveTask = async (task: Task) => {
    if (!currentUser || !team) return;

    const completedBy = task.completed_by || task.assigned_to || currentUser.id;
    await updateTaskStatus(task.id, 'done', completedBy);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Notifikasi In-App & WA Real-Time ke seluruh PIC
    const assignedIds = task.assigned_to_ids && task.assigned_to_ids.length > 0
      ? task.assigned_to_ids
      : task.assigned_to
      ? [task.assigned_to]
      : [];

    const picMembers = members.filter((m) => assignedIds.includes(m.user_id));
    picMembers.forEach((m) => {
      if (m.user_id !== currentUser.id) {
        createNotification(
          m.user_id,
          '🎉 Tugas Telah Disetujui!',
          `Selamat! Tugas "${task.title}" telah disetujui selesai oleh Ketua.`,
          `/team/${team.username}`,
          team.id
        );
      }
    });

    const waPhones = picMembers
      .filter((m) => m.user_id !== currentUser.id)
      .map((m) => m.profile?.phone_number)
      .filter((p): p is string => Boolean(p && p.trim()));

    if (waPhones.length > 0) {
      const waMsg = `🎉 *TUGAS TELAH DISETUJUI - TIMJUARA*\n\nHalo Rekan Tim! 🚀\nSelamat! Tugas *${task.title}* pada tim *${team.name}* telah disetujui selesai oleh Ketua Tim.\nTerima kasih atas kerja kerasmu! 💪\nBuka TimJuara: ${window.location.origin}/team/${team.username}`;
      sendRealtimeWhatsAppNotification(waPhones, waMsg, team.wa_gateway_token);
    }

    // Notifikasi Otomatis Bot ke Grup WhatsApp Tim saat Tugas Selesai
    const teamGroupId = team.wa_group_id || (typeof window !== 'undefined' ? localStorage.getItem('timjuara_team_wa_group_' + team.id) || undefined : undefined);
    if (teamGroupId) {
      const completerProfile = members.find((m) => m.user_id === completedBy)?.profile;
      const completerName = completerProfile?.full_name || 'Rekan Tim';
      const groupWaMsg = `🎉 *TUGAS SELESAI & DISETUJUI - ${team.name.toUpperCase()}* 🏆\n\nKabar gembira untuk seluruh tim! Tugas berikut telah resmi diverifikasi & disetujui selesai:\n\n✅ *Tugas*: *${task.title}*\n👤 *Diselesaikan oleh*: *${completerName}*\n${task.task_link ? `🔗 *Hasil Kerja*: ${task.task_link}\n` : ''}\nHebat tim! Satu langkah lebih dekat menuju kemenangan! 🚀💪\n👉 Buka Workspace: ${window.location.origin}/team/${team.username}`;

      sendTestWhatsAppMessage(teamGroupId, groupWaMsg, team.wa_gateway_token)
        .then((res) => {
          if (res.success) {
            showToast('📢 Bot WA: Pengumuman tugas selesai terkirim ke grup!');
          } else {
            console.warn('Gagal kirim bot selesai ke grup:', res.error);
            showToast('⚠️ Bot WA grup: ' + (res.error || 'Gagal mengirim pesan'));
          }
        })
        .catch((e) => {
          console.warn('Gagal kirim bot selesai ke grup:', e);
        });
    }

    showToast('🎉 Tugas telah disetujui selesai oleh Ketua!');

    const updated = await getTeamTasks(team.id);
    setTasks(updated);
  };

  // Open Ketua Review & Verification Modal
  const openKetuaReviewModal = async (task: Task) => {
    setKetuaReviewTask(task);
    setKetuaReviewNotes('');
    setShowKetuaReviewModal(true);
    setLoadingReviewComments(true);
    try {
      const comments = await getTaskComments(task.id);
      setKetuaReviewComments(comments);
    } catch {
      setKetuaReviewComments([]);
    } finally {
      setLoadingReviewComments(false);
    }
  };

  // Reject / Request Revision (Ketua -> Member) with Comment integration
  const handleKetuaRequestRevision = async () => {
    if (!ketuaReviewTask || !team || !currentUser) return;
    if (!ketuaReviewNotes.trim()) {
      showToast('⚠️ Mohon tuliskan poin revisi/instruksi perbaikan untuk pengerja.');
      return;
    }

    setKetuaReviewLoading(true);
    try {
      // 1. Simpan komentar revisi otomatis ke riwayat diskusi tugas (task_comments)
      await addTaskComment(
        ketuaReviewTask.id,
        currentUser.id,
        `⚠️ [PERMINTAAN REVISI]: ${ketuaReviewNotes.trim()}`
      );

      // 2. Perbarui tugas ke status in_progress dengan catatan revisi
      await updateTask(ketuaReviewTask.id, {
        status: 'in_progress',
        review_notes: `Catatan Revisi dari Ketua: ${ketuaReviewNotes.trim()}`,
      });

      // 3. Notifikasi In-App & WA Real-Time ke seluruh PIC
      const assignedIds = ketuaReviewTask.assigned_to_ids && ketuaReviewTask.assigned_to_ids.length > 0
        ? ketuaReviewTask.assigned_to_ids
        : ketuaReviewTask.assigned_to
        ? [ketuaReviewTask.assigned_to]
        : [];

      const picMembers = members.filter((m) => assignedIds.includes(m.user_id));
      picMembers.forEach((m) => {
        createNotification(
          m.user_id,
          '⚠️ Permintaan Revisi Tugas',
          `Ketua meminta revisi pada "${ketuaReviewTask.title}": "${ketuaReviewNotes.trim()}"`,
          `/team/${team.username}`,
          team.id
        );
      });

      const waPhones = picMembers
        .map((m) => m.profile?.phone_number)
        .filter((p): p is string => Boolean(p && p.trim()));

      if (waPhones.length > 0) {
        const waMsg = `⚠️ *PERMINTAAN REVISI TUGAS - TIMJUARA*\n\nHalo Rekan Tim! 👋\nTugas *${ketuaReviewTask.title}* di tim *${team.name}* memerlukan revisi dari Ketua Tim:\n📝 Catatan Revisi: "${ketuaReviewNotes.trim()}"\n\nYuk segera diperiksa dan diperbaiki di TimJuara: ${window.location.origin}/team/${team.username}`;
        sendRealtimeWhatsAppNotification(waPhones, waMsg, team.wa_gateway_token);
      }

      setShowKetuaReviewModal(false);
      setShowRevisionModal(false);
      setKetuaReviewTask(null);
      setKetuaReviewNotes('');
      showToast('Permintaan revisi dan komentar berhasil dikirim ke pengerja.');

      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    } catch (err: any) {
      showToast('Gagal mengirim revisi: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setKetuaReviewLoading(false);
    }
  };

  // Approve Task (Ketua -> Done) with optional comment integration
  const handleKetuaApproveTask = async () => {
    if (!ketuaReviewTask || !team || !currentUser) return;

    setKetuaReviewLoading(true);
    try {
      // 1. Jika Ketua menulis catatan apresiasi/masukan, simpan ke komentar
      if (ketuaReviewNotes.trim()) {
        await addTaskComment(
          ketuaReviewTask.id,
          currentUser.id,
          `✅ [DISETUJUI SELESAI]: ${ketuaReviewNotes.trim()}`
        );
      }

      // 2. Tandai tugas resmi selesai
      const completedBy = ketuaReviewTask.completed_by || ketuaReviewTask.assigned_to || currentUser.id;
      await updateTask(ketuaReviewTask.id, {
        status: 'done',
        completed_by: completedBy,
        review_notes: ketuaReviewNotes.trim()
          ? `Disetujui: ${ketuaReviewNotes.trim()}`
          : (ketuaReviewTask.review_notes || 'Telah disetujui selesai oleh Ketua.'),
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // 3. Notifikasi In-App & WA Real-Time ke seluruh PIC
      const assignedIds = ketuaReviewTask.assigned_to_ids && ketuaReviewTask.assigned_to_ids.length > 0
        ? ketuaReviewTask.assigned_to_ids
        : ketuaReviewTask.assigned_to
        ? [ketuaReviewTask.assigned_to]
        : [];

      const picMembers = members.filter((m) => assignedIds.includes(m.user_id));
      picMembers.forEach((m) => {
        if (m.user_id !== currentUser.id) {
          createNotification(
            m.user_id,
            '🎉 Tugas Telah Disetujui!',
            `Selamat! Tugas "${ketuaReviewTask.title}" telah disetujui selesai oleh Ketua.${ketuaReviewNotes.trim() ? ` Catatan: "${ketuaReviewNotes.trim()}"` : ''}`,
            `/team/${team.username}`,
            team.id
          );
        }
      });

      const waPhones = picMembers
        .filter((m) => m.user_id !== currentUser.id)
        .map((m) => m.profile?.phone_number)
        .filter((p): p is string => Boolean(p && p.trim()));

      if (waPhones.length > 0) {
        const waMsg = `🎉 *TUGAS TELAH DISETUJUI - TIMJUARA*\n\nHalo Rekan Tim! 🚀\nSelamat! Tugas *${ketuaReviewTask.title}* pada tim *${team.name}* telah diverifikasi dan disetujui selesai oleh Ketua Tim.\n${ketuaReviewNotes.trim() ? `📝 Catatan Ketua: "${ketuaReviewNotes.trim()}"\n` : ''}Terima kasih atas kerja kerasmu! 💪\nBuka TimJuara: ${window.location.origin}/team/${team.username}`;
        sendRealtimeWhatsAppNotification(waPhones, waMsg, team.wa_gateway_token);
      }

      // Notifikasi Otomatis Bot ke Grup WhatsApp Tim saat Tugas Selesai Diverifikasi Ketua
      const teamGroupId = team.wa_group_id || (typeof window !== 'undefined' ? localStorage.getItem('timjuara_team_wa_group_' + team.id) || undefined : undefined);
      if (teamGroupId) {
        const completerProfile = members.find((m) => m.user_id === completedBy)?.profile;
        const completerName = completerProfile?.full_name || 'Rekan Tim';
        const groupWaMsg = `🎉 *TUGAS SELESAI & DISETUJUI - ${team.name.toUpperCase()}* 🏆\n\nKabar luar biasa untuk tim! Tugas berikut telah diverifikasi & disetujui selesai oleh Ketua:\n\n✅ *Tugas*: *${ketuaReviewTask.title}*\n👤 *Diselesaikan oleh*: *${completerName}*\n${ketuaReviewNotes.trim() ? `📝 *Catatan Ketua*: "${ketuaReviewNotes.trim()}"\n` : ''}${ketuaReviewTask.task_link ? `🔗 *Hasil Kerja*: ${ketuaReviewTask.task_link}\n` : ''}\nKerja bagus rekan-rekan! Terus melaju menuju target tim! 🚀💪\n👉 Workspace: ${window.location.origin}/team/${team.username}`;

        sendTestWhatsAppMessage(teamGroupId, groupWaMsg, team.wa_gateway_token)
          .then((res) => {
            if (res.success) {
              showToast('📢 Bot WA: Pengumuman tugas selesai terkirim ke grup!');
            } else {
              console.warn('Gagal kirim bot selesai ke grup:', res.error);
              showToast('⚠️ Bot WA grup: ' + (res.error || 'Gagal mengirim pesan'));
            }
          })
          .catch((e) => {
            console.warn('Gagal kirim bot selesai ke grup:', e);
          });
      }

      setShowKetuaReviewModal(false);
      setKetuaReviewTask(null);
      setKetuaReviewNotes('');
      showToast('🎉 Tugas telah disetujui & ditandai selesai!');

      const updated = await getTeamTasks(team.id);
      setTasks(updated);
    } catch (err: any) {
      showToast('Gagal menyelesaikan tugas: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setKetuaReviewLoading(false);
    }
  };

  // Compatibility helper
  const openRevisionModal = (task: Task) => {
    openKetuaReviewModal(task);
  };

  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleKetuaRequestRevision();
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
    if (!team || !currentMember || !currentUser) return;
    if (!confirm('Apakah Anda yakin ingin keluar dari tim ini?')) return;
    await removeTeamMember(team.id, currentMember.id);
    const otherTeams = userTeams.filter((t) => t.id !== team.id);
    if (otherTeams.length > 0) {
      router.push(`/team/${otherTeams[0].username}`);
    } else {
      router.push('/onboarding');
    }
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

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingPhone(true);
    const { success, error } = await updateUserPhoneNumber(currentUser.id, profilePhone.trim());
    setSavingPhone(false);

    if (error) {
      showToast(`Gagal menyimpan nomor WA: ${error}`);
      return;
    }

    if (success) {
      setCurrentUser({
        ...currentUser,
        phone_number: profilePhone.trim(),
      });
      showToast('Nomor WhatsApp berhasil disimpan! 📱');

      if (team) {
        const { members: updatedMembers } = await getTeamByUsername(team.username);
        setMembers(updatedMembers);
      }
    }
  };

  const handleTestWhatsApp = async () => {
    if (!profilePhone.trim()) {
      showToast('Masukkan nomor WhatsApp Anda terlebih dahulu.');
      return;
    }

    setTestingWa(true);
    const tokenToUse =
      team?.wa_gateway_token ||
      globalWaToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('master_wa_token') || localStorage.getItem('timjuara_fonnte_token')
        : undefined);

    const testMsg = `Halo *${currentUser?.full_name || 'Rekan Tim'}*! 👋\n\nIni adalah pesan uji coba dari Bot TimJuara untuk tim *${team?.name || 'Anda'}*.\nIntegrasi WhatsApp Gateway telah berhasil terhubung! 🚀`;
    const res = await sendTestWhatsAppMessage(profilePhone.trim(), testMsg, tokenToUse || undefined);
    setTestingWa(false);

    if (res.success) {
      showToast('Pesan uji coba berhasil dikirim ke WhatsApp Anda! 📲');
    } else {
      showToast(`Gagal mengirim WA: ${res.error || 'Periksa nomor WhatsApp Anda'}`);
    }
  };

  const handleShareGroupRecap = () => {
    if (!team) return;
    const pendingTasks = tasks.filter((t) => t.status !== 'done');
    if (pendingTasks.length === 0) {
      showToast('Semua tugas tim sudah selesai! 🎉');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let text = `📢 *REKAP TUGAS & DEADLINE TIM: ${team.name.toUpperCase()}*\n`;
    text += `_Diperbarui: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}_\n\n`;

    pendingTasks.forEach((t, idx) => {
      let deadlineNote = 'Tanpa Deadline';
      if (t.deadline) {
        const d = new Date(t.deadline);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) deadlineNote = `⚠️ *TERLEWAT ${Math.abs(diffDays)} HARI!*`;
        else if (diffDays === 0) deadlineNote = `🚨 *HARI INI!*`;
        else if (diffDays === 1) deadlineNote = `⏳ *BESOK!*`;
        else deadlineNote = `📅 ${diffDays} hari lagi (${new Date(t.deadline).toLocaleDateString('id-ID')})`;
      }

      const statusText = t.status === 'review' ? 'Menunggu Dicek' : t.status === 'in_progress' ? 'Dikerjakan' : 'Belum Mulai';
      const picNames = t.assignee_profiles && t.assignee_profiles.length > 0
        ? t.assignee_profiles.map((p) => p.full_name).join(', ')
        : (t.assignee_profile?.full_name || 'Belum ditugaskan');
      text += `${idx + 1}. *${t.title}*\n`;
      text += `   • Member Tugas: ${picNames}\n`;
      text += `   • Status: ${statusText}\n`;
      text += `   • Deadline: ${deadlineNote}\n`;
      if (t.task_link) text += `   • Link: ${t.task_link}\n`;
      text += `\n`;
    });

    text += `Semangat teman-teman! Pantau progress lengkap di TimJuara:\n${window.location.origin}/team/${team.username}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleSendBotGroupRecap = async () => {
    if (!team) return;
    const teamGroupId = team.wa_group_id || (typeof window !== 'undefined' ? localStorage.getItem('timjuara_team_wa_group_' + team.id) || undefined : undefined);
    if (!teamGroupId) {
      handleShareGroupRecap();
      return;
    }

    const pendingTasks = tasks.filter((t) => t.status !== 'done');
    if (pendingTasks.length === 0) {
      showToast('Semua tugas tim sudah selesai! 🎉');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let text = `📢 *REKAP TUGAS & DEADLINE TIM: ${team.name.toUpperCase()}*\n`;
    text += `_Diperbarui: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}_\n\n`;

    pendingTasks.forEach((t, idx) => {
      let deadlineNote = 'Tanpa Deadline';
      if (t.deadline) {
        const d = new Date(t.deadline);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) deadlineNote = `⚠️ *TERLEWAT ${Math.abs(diffDays)} HARI!*`;
        else if (diffDays === 0) deadlineNote = `🚨 *HARI INI!*`;
        else if (diffDays === 1) deadlineNote = `⏳ *BESOK!*`;
        else deadlineNote = `📅 ${diffDays} hari lagi (${new Date(t.deadline).toLocaleDateString('id-ID')})`;
      }

      const statusText = t.status === 'review' ? 'Menunggu Dicek' : t.status === 'in_progress' ? 'Dikerjakan' : 'Belum Mulai';
      const picNames = t.assignee_profiles && t.assignee_profiles.length > 0
        ? t.assignee_profiles.map((p) => p.full_name).join(', ')
        : (t.assignee_profile?.full_name || 'Belum ditugaskan');
      text += `${idx + 1}. *${t.title}*\n`;
      text += `   • Member: ${picNames}\n`;
      text += `   • Status: ${statusText}\n`;
      text += `   • Deadline: ${deadlineNote}\n`;
      if (t.task_link) text += `   • Link: ${t.task_link}\n`;
      text += `\n`;
    });

    text += `Semangat rekan-rekan tim! Pantau progress lengkap di TimJuara:\n👉 ${window.location.origin}/team/${team.username}`;

    setIsSendingGroupRecap(true);
    showToast('Mengirimkan rekap tugas ke Grup WhatsApp tim via Bot...');
    try {
      const tokenToUse = team.wa_gateway_token || globalWaToken || undefined;
      const res = await sendTestWhatsAppMessage(teamGroupId, text, tokenToUse);
      if (res.success) {
        showToast('✅ Berhasil mengirim rekap tugas ke Grup WhatsApp via Bot!');
      } else {
        showToast(`Gagal kirim bot ke grup: ${res.error}. Membuka WhatsApp manual...`);
        handleShareGroupRecap();
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.');
    } finally {
      setIsSendingGroupRecap(false);
    }
  };

  const handleOpenConnectTeamGroupModal = () => {
    if (!team) return;
    const currentGroupId = team.wa_group_id || (typeof window !== 'undefined' ? localStorage.getItem('timjuara_team_wa_group_' + team.id) || '' : '');
    const currentGroupName = team.wa_group_name || (typeof window !== 'undefined' ? localStorage.getItem('timjuara_team_wa_group_name_' + team.id) || '' : '');
    setTeamGroupInputId(currentGroupId);
    setTeamGroupInputName(currentGroupName);
    setShowConnectTeamGroupModal(true);
    if (teamAvailableGroups.length === 0) {
      handleFetchTeamBotGroups(false);
    }
  };

  const handleFetchTeamBotGroups = async (refresh: boolean = false) => {
    setLoadingTeamGroups(true);
    try {
      const tokenToUse = team?.wa_gateway_token || globalWaToken || undefined;
      const res = await getWhatsAppGroups(tokenToUse, refresh);
      if (res.success) {
        setTeamAvailableGroups(res.groups);
        if (res.groups.length === 0) {
          showToast('Bot belum terdaftar di grup WhatsApp manapun. Tambahkan bot ke grup Anda.');
        } else {
          showToast(`Berhasil memuat ${res.groups.length} grup WhatsApp dari bot Fonnte.`);
        }
      } else {
        showToast(res.error || 'Gagal memuat grup dari bot.');
      }
    } catch {
      showToast('Terjadi kesalahan saat memuat grup WhatsApp.');
    } finally {
      setLoadingTeamGroups(false);
    }
  };

  const handleSaveTeamGroupSettings = async () => {
    if (!team) return;
    setIsSavingTeamGroup(true);
    try {
      const res = await updateTeamWhatsAppGroup(team.id, teamGroupInputId.trim(), teamGroupInputName.trim());
      if (res.success) {
        setTeam((prev) => prev ? {
          ...prev,
          wa_group_id: teamGroupInputId.trim() || undefined,
          wa_group_name: teamGroupInputName.trim() || undefined,
        } : null);
        showToast('✅ Pengaturan Grup WhatsApp Tim berhasil disimpan!');
        setShowConnectTeamGroupModal(false);
      } else {
        showToast(`Gagal menyimpan: ${res.error}`);
      }
    } catch {
      showToast('Terjadi kesalahan saat menyimpan pengaturan grup.');
    } finally {
      setIsSavingTeamGroup(false);
    }
  };

  const handleDisconnectTeamGroupSettings = async () => {
    if (!team) return;
    setIsSavingTeamGroup(true);
    try {
      await updateTeamWhatsAppGroup(team.id, '', '');
      setTeam((prev) => prev ? { ...prev, wa_group_id: undefined, wa_group_name: undefined } : null);
      showToast('Hubungan grup WhatsApp tim telah diputuskan.');
      setShowConnectTeamGroupModal(false);
    } catch {
      showToast('Gagal memutuskan grup.');
    } finally {
      setIsSavingTeamGroup(false);
    }
  };

  const handleTestSendToTeamGroup = async () => {
    if (!teamGroupInputId.trim()) {
      showToast('⚠️ Masukkan atau pilih ID Grup WhatsApp terlebih dahulu.');
      return;
    }
    setIsTestingTeamGroup(true);
    try {
      const testMsg = `🤖 *TES KONEKSI BOT TIMJUARA KE GRUP TIM*\n\nHalo Rekan Tim! 👋\nGrup WhatsApp ini berhasil dihubungkan dengan bot notifikasi tim *${team?.name || 'TimJuara'}*.\n\nNotifikasi otomatis bot ke grup ini meliputi:\n1. 📋 *Tugas Baru*: Pemberitahuan saat ada tugas baru ditugaskan\n2. 🎉 *Tugas Selesai*: Pengumuman resmi saat tugas disetujui selesai\n\nSemangat berproses bersama dan raih kemenangan! 🚀💪`;
      const tokenToUse = team?.wa_gateway_token || globalWaToken || undefined;
      const res = await sendTestWhatsAppMessage(teamGroupInputId.trim(), testMsg, tokenToUse);
      if (res.success) {
        showToast('✅ Berhasil mengirim pesan uji coba ke grup WhatsApp!');
      } else {
        showToast(`❌ Gagal kirim ke grup: ${res.error}`);
      }
    } catch {
      showToast('Terjadi kesalahan saat mengirim ke grup.');
    } finally {
      setIsTestingTeamGroup(false);
    }
  };

  const handleSendTaskWAReminder = async (task: Task) => {
    const targets = task.assignee_profiles && task.assignee_profiles.length > 0
      ? task.assignee_profiles
      : (task.assignee_profile ? [task.assignee_profile] : []);

    const validTargets = targets.filter((p) => Boolean(p.phone_number && p.phone_number.trim()));

    if (validTargets.length === 0) {
      showToast(`Nomor WA member tugas belum terdaftar di profil.`);
      return;
    }

    let deadlineStr = 'Tidak ada batas waktu';
    if (task.deadline) {
      deadlineStr = new Date(task.deadline).toLocaleDateString('id-ID', { dateStyle: 'full' });
    }

    const tokenToUse =
      team?.wa_gateway_token ||
      globalWaToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('master_wa_token') || localStorage.getItem('timjuara_fonnte_token')
        : undefined);

    for (const pic of validTargets) {
      const message = `Halo *${pic.full_name}*! 👋\n\nPengingat tugas dari Tim *${team?.name}*:\n📌 *${task.title}*\n📅 Deadline: *${deadlineStr}*\nStatus: *${task.status === 'review' ? 'Menunggu Dicek' : task.status === 'in_progress' ? 'Sedang Dikerjakan' : 'Belum Selesai'}*\n\nYuk segera diselesaikan atau dicek! 💪\nBuka TimJuara: ${window.location.origin}/team/${team?.username}`;

      showToast(`Mengirim pengingat via Bot ke ${pic.full_name}...`);
      const res = await sendTestWhatsAppMessage(pic.phone_number!, message, tokenToUse || undefined);
      if (res.success) {
        showToast(`Pengingat berhasil dikirim oleh Bot ke WA ${pic.full_name}! 📲`);
      } else {
        showToast(`⚠️ Bot WA gagal (${res.error || 'belum terhubung'}). Mengalihkan ke WhatsApp manual...`);
        const cleanPhone = pic.phone_number!.replace(/[^0-9]/g, '').replace(/^0/, '62');
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      }
    }
  };

  // -------------------------------------------------------------
  // STATS & CALCULATIONS
  // -------------------------------------------------------------
  const { contributions, totalTasks, completedTasks, inReviewTasks, overallProgress } = calculateContributionStats(members, tasks);

  const filteredTasks = [...tasks]
    .filter((t) => {
      if (taskFilter === 'all') return true;
      return t.status === taskFilter;
    })
    .sort((a, b) => {
      // 1. Tugas yang sudah selesai ('done') SELALU ditaruh di paling bawah
      const aDone = a.status === 'done';
      const bDone = b.status === 'done';
      if (!aDone && bDone) return -1; // a (belum selesai) selalu di atas b (selesai)
      if (aDone && !bDone) return 1;  // a (selesai) selalu di bawah b (belum selesai)

      // 2. Jika sama-sama belum selesai:
      if (!aDone && !bDone) {
        // Urutkan deadline yang mendesak terlebih dahulu
        if (a.deadline && b.deadline) {
          const diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          if (diff !== 0) return diff;
        } else if (a.deadline && !b.deadline) {
          return -1;
        } else if (!a.deadline && b.deadline) {
          return 1;
        }

        // Urutkan status tindakan: review (butuh dicek) > in_progress (sedang dikerjakan) > todo (belum mulai)
        const statusWeight: Record<TaskStatus, number> = {
          review: 3,
          in_progress: 2,
          todo: 1,
          done: 0,
        };
        const swDiff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
        if (swDiff !== 0) return swDiff;
      }

      // Jika status sama, urutkan tugas terbaru di atas
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const getDeadlineBadge = (deadlineStr?: string, status?: TaskStatus) => {
    if (status === 'done') {
      return <span className="badge badge-success"><CheckCircle2 size={12} /> Selesai</span>;
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
    <div className="workspace-shell" style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION (Kiri)                                         */}
      {/* ========================================================================= */}
      <aside className="workspace-sidebar">
        {/* App & Team Header */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div
              onClick={() => setActiveTab('overview')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
              title="Overview Seluruh Tim"
            >
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                TJ
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>TimJuara</span>
            </div>

            {currentUser?.email?.toLowerCase() === 'admin@gmail.com' && (
              <Link href="/admin" className="badge" style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Crown size={10} /> Admin
              </Link>
            )}
          </div>

          {/* Active Team Dropdown Switcher (Gambar 1) */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowTeamSwitcher((prev) => !prev)}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-secondary)',
                border: showTeamSwitcher ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                userSelect: 'none',
              }}
              title="Klik untuk memilih & ganti tim yang dikelola"
            >
              {team?.avatar_url ? (
                <img
                  src={team.avatar_url}
                  alt={team.name}
                  className="avatar-photo"
                  style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div className="team-avatar-header" style={{ width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                  {team?.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {team?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{team?.username}</span>
                  {isKetua ? (
                    <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                      <Crown size={9} /> Ketua
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                      Anggota
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                size={16}
                color="var(--text-muted)"
                style={{
                  transform: showTeamSwitcher ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Dropdown Menu Daftar Tim */}
            {showTeamSwitcher && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  padding: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '6px 8px 4px' }}>
                  Ganti Tim yang Dikelola:
                </div>
                {userTeams.map((ut) => {
                  const isCurrent = ut.username === team?.username;
                  return (
                    <div
                      key={ut.id}
                      onClick={() => {
                        setShowTeamSwitcher(false);
                        if (ut.username !== team?.username) {
                          router.push(`/team/${ut.username}`);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isCurrent ? 'var(--primary-light)' : 'transparent',
                        color: isCurrent ? 'var(--primary)' : 'var(--text-main)',
                        transition: 'background 0.15s ease',
                        marginBottom: 2,
                      }}
                    >
                      {ut.avatar_url ? (
                        <img src={ut.avatar_url} alt={ut.name} className="avatar-photo" style={{ width: 28, height: 28, flexShrink: 0 }} />
                      ) : (
                        <div className="team-avatar-header" style={{ width: 28, height: 28, fontSize: '0.75rem', flexShrink: 0 }}>
                          {ut.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ut.name}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: isCurrent ? 'var(--primary)' : 'var(--text-muted)' }}>
                          @{ut.username} {ut.user_role === 'ketua' ? '• 👑 Ketua' : ''}
                        </div>
                      </div>
                      {isCurrent && <Check size={14} color="var(--primary)" style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })}

                <div style={{ borderTop: '1px solid var(--surface-border)', marginTop: 6, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamSwitcher(false);
                      setShowCreateTeamModal(true);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: 6, fontSize: '0.775rem', padding: '6px 8px' }}
                  >
                    <Plus size={13} /> Buat Tim Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamSwitcher(false);
                      setShowJoinTeamModal(true);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: 6, fontSize: '0.775rem', padding: '6px 8px' }}
                  >
                    <UserPlus size={13} /> Gabung Tim Lain
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Nav List (4 Main Menus) */}
        <div className="sidebar-nav-list" style={{ padding: '0 12px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span style={{ flex: 1 }}>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`sidebar-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          >
            <CheckCircle2 size={18} />
            <span style={{ flex: 1 }}>Tugas & Deadline</span>
            <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
              {tasks.length}
            </span>
            {inReviewTasks > 0 && (
              <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: '0.65rem', padding: '2px 5px' }}>
                {inReviewTasks}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`sidebar-nav-btn ${activeTab === 'research' ? 'active' : ''}`}
          >
            <FolderGit2 size={18} />
            <span style={{ flex: 1 }}>Materi & Riset</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
              {research.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span style={{ flex: 1 }}>Pengaturan</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid var(--surface-border)' }}>
          {/* User Mini Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="avatar-photo"
                style={{ width: 34, height: 34 }}
              />
            ) : (
              <div className="avatar-badge" style={{ width: 34, height: 34, fontSize: '0.75rem' }}>
                {currentUser?.full_name?.slice(0, 2).toUpperCase() || 'AG'}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.full_name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.email}
              </div>
            </div>
            <button
              onClick={async () => {
                await signOutUser();
                router.push('/auth');
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', flexShrink: 0 }}
              title="Keluar akun"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* WORKSPACE CONTENT PANE (Kanan)                                            */}
      {/* ========================================================================= */}
      <div className="workspace-content-pane">
        {/* Top Header Bar (Notifikasi & Menu di Kanan Atas) */}
        <header className="workspace-header" style={{ borderBottom: '1px solid var(--surface-border)', padding: '12px 20px', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {team?.avatar_url ? (
                <img
                  src={team.avatar_url}
                  alt={team.name}
                  className="avatar-photo"
                  style={{ width: 34, height: 34, objectFit: 'cover' }}
                />
              ) : (
                <div className="team-avatar-header" style={{ width: 34, height: 34, fontSize: '0.8rem', flexShrink: 0 }}>
                  {team?.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>
                  {activeTab === 'overview'
                    ? 'Overview Seluruh Tim'
                    : activeTab === 'tasks'
                    ? `${team?.name} • Tugas & Deadline`
                    : activeTab === 'research'
                    ? `${team?.name} • Materi & Riset`
                    : `${team?.name} • Pengaturan`}
                </h1>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{team?.username}</span>
              </div>
            </div>

            {/* Kanan Atas: Notifikasi, Theme Toggle & Profil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Tombol Notifikasi (Kanan Atas) */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifPopover((prev) => !prev)}
                  className="notif-btn"
                  style={{ width: 36, height: 36 }}
                  title="Notifikasi"
                >
                  <Bell size={18} />
                  {notifications.filter((n) => !n.is_read).length > 0 && (
                    <span className="notif-badge">
                      {notifications.filter((n) => !n.is_read).length}
                    </span>
                  )}
                </button>

                {showNotifPopover && (
                  <div
                    className="notif-popover"
                    style={{
                      position: 'absolute',
                      top: 44,
                      right: 0,
                      left: 'auto',
                      width: 320,
                      zIndex: 300,
                    }}
                  >
                    <div className="notif-header">
                      <span>🔔 Notifikasi</span>
                      {notifications.some((n) => !n.is_read) && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="notif-list" style={{ maxHeight: 260 }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                          Tidak ada notifikasi baru
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.is_read) {
                                await markNotificationAsRead(n.id);
                                setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
                              }
                            }}
                            className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>{n.title}</span>
                              <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
                                {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="theme-toggle-btn"
                style={{ width: 36, height: 36 }}
                title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
              >
                {isDarkMode ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
              </button>

              {/* User Avatar Mini */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6, borderLeft: '1px solid var(--surface-border)' }}>
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="avatar-photo"
                    style={{ width: 32, height: 32 }}
                  />
                ) : (
                  <div className="avatar-badge" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                    {currentUser?.full_name?.slice(0, 2).toUpperCase() || 'AG'}
                  </div>
                )}
                <span className="hide-mobile" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.full_name?.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="workspace-main" style={{ flex: 1, padding: '24px 16px 80px' }}>
          <div className="container" style={{ maxWidth: 1100 }}>
            {/* Master Admin Management Notice Banner */}
            {isMasterAdminUser && (
              <div
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
                    : 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                  border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #fde68a',
                  color: isDarkMode ? '#fde68a' : '#92400e',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 18px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  boxShadow: isDarkMode ? '0 2px 12px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(217, 119, 6, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', fontWeight: 700 }}>
                  <ShieldAlert size={20} color={isDarkMode ? '#fbbf24' : '#d97706'} />
                  <span>
                    🛡️ <strong>Mode Master Admin</strong>: Anda memiliki hak akses penuh untuk mengelola anggota, peran, dan tugas di tim ini.
                  </span>
                </div>
                <Link
                  href="/admin"
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.4)' : '#fcd34d',
                    color: isDarkMode ? '#fbbf24' : '#b45309',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '6px 14px',
                  }}
                >
                  ← Kembali ke Panel Admin
                </Link>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW SELURUH TIM (GLOBAL ACCOUNT OVERVIEW DARI /ONBOARDING)     */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                {/* Hero Banner Overview */}
                <div style={{ marginBottom: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff', color: isDarkMode ? '#a5b4fc' : '#4338ca', padding: '4px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>
                      <Sparkles size={14} /> Overview Seluruh Tim
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                      Halo, {currentUser?.full_name?.split(' ')[0]}! 👋
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      Pantau seluruh tugas aktif, progres tim, dan ruang kerja Anda dalam satu tempat.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateTeamModal(true)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    >
                      <PlusCircle size={15} /> Buat Tim Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowJoinTeamModal(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                    >
                      <UserPlus size={15} /> Gabung Tim
                    </button>
                  </div>
                </div>

                {/* Banner Status Bot Otomatis Jam 08:00 WIB untuk Ketua */}
                {isKetua && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: '12px 18px',
                      borderRadius: 14,
                      background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
                      border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid #bbf7d0',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <BellRing size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isDarkMode ? '#86efac' : '#15803d' }}>
                          Otomasi Bot Deadline Jam 08:00 WIB Aktif
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Bot memindai tugas yang mendekati batas waktu setiap hari jam 08:00 WIB dan mengirim notifikasi langsung ke WhatsApp & web ini.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualTriggerTeamReminders}
                      disabled={sendingTeamReminders}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#16a34a', borderColor: '#86efac' }}
                    >
                      <RefreshCw size={13} className={sendingTeamReminders ? 'animate-spin' : ''} />
                      {sendingTeamReminders ? 'Mengirim...' : 'Kirim Pengingat Sekarang'}
                    </button>
                  </div>
                )}

                {/* 4 Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
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
                        {allUserTasks.filter((t) => t.status === 'in_progress').length}
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
                        {allUserTasks.filter((t) => t.status === 'review' || t.review_notes?.toLowerCase().includes('revisi')).length}
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
                        {allUserTasks.filter((t) => t.status === 'done').length}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tugas Selesai</div>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* WIDGET AI 1: AI DAILY STANDUP & RISK PREDICTOR                            */}
                {/* ========================================================================= */}
                <div className="card ai-card" style={{ padding: '22px 24px', marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="ai-badge">
                        <Sparkles size={12} /> TimJuara AI
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        Daily Standup & Risk Predictor
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {aiDigest && (
                        <span
                          className={`badge ${
                            aiDigest.health === 'healthy'
                              ? 'badge-success'
                              : aiDigest.health === 'warning'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                          style={{ padding: '4px 10px', fontWeight: 700, fontSize: '0.78rem' }}
                        >
                          {aiDigest.health === 'healthy' && '🟢 '}
                          {aiDigest.health === 'warning' && '🟡 '}
                          {aiDigest.health === 'critical' && '🔴 '}
                          {aiDigest.healthLabel}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => loadAiDigest(undefined, undefined, undefined, true)}
                        disabled={loadingAiDigest}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
                        title="Analisis ulang kondisi tim dengan AI"
                      >
                        <RefreshCw size={13} className={loadingAiDigest ? 'animate-spin' : ''} />
                        {loadingAiDigest ? 'Menganalisis...' : 'Analisis Ulang'}
                      </button>
                    </div>
                  </div>

                  {loadingAiDigest && !aiDigest ? (
                    <div style={{ padding: '12px 0' }}>
                      <div className="ai-shimmer-loading" style={{ height: 20, width: '90%', marginBottom: 10 }} />
                      <div className="ai-shimmer-loading" style={{ height: 16, width: '75%', marginBottom: 10 }} />
                      <div className="ai-shimmer-loading" style={{ height: 16, width: '60%' }} />
                    </div>
                  ) : aiDigest ? (
                    <div>
                      {/* Summary text */}
                      <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6, margin: '0 0 16px 0', fontWeight: 500 }}>
                        {aiDigest.summary}
                      </p>

                      {/* 2-Column Grid: Risks vs Highlights */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
                        {/* Box 1: Risiko & Bottleneck */}
                        <div
                          style={{
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                            border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #fee2e2',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>
                            <AlertTriangle size={14} /> Deteksi Hambatan & Risiko (Bottleneck)
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                            {aiDigest.bottlenecks.map((b, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{b}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Box 2: Highlights & Pencapaian */}
                        <div
                          style={{
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                            border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #dcfce7',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>
                            <CheckCircle2 size={14} /> Pencapaian & Progres Terkini
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                            {aiDigest.highlights.map((h, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Rekomendasi Aksi Tim */}
                      {aiDigest.advice && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: isDarkMode ? 'rgba(99, 102, 241, 0.12)' : '#eef2ff',
                            border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid #c7d2fe',
                            fontSize: '0.84rem',
                            color: isDarkMode ? '#c7d2fe' : '#3730a3',
                          }}
                        >
                          <Lightbulb size={16} style={{ flexShrink: 0 }} />
                          <div>
                            <b>Saran Aksi Hari Ini:</b> {aiDigest.advice}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* ========================================================================= */}
                {/* WIDGET AI 2: FOKUS KAMU HARI INI (PERSONAL ACTIONABLE CARD)               */}
                {/* ========================================================================= */}
                {aiPersonalFocus && aiPersonalFocus.priorityTaskTitle && (
                  <div
                    className="card"
                    style={{
                      padding: '18px 22px',
                      marginBottom: 24,
                      border: isDarkMode ? '1px solid rgba(79, 70, 229, 0.35)' : '1px solid #c7d2fe',
                      background: isDarkMode
                        ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%)'
                        : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.1rem' }}>🎯</span>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Fokus Utama Kamu Hari Ini
                        </h4>
                        <span
                          className={`badge ${aiPersonalFocus.urgency === 'high' ? 'badge-danger' : 'badge-purple'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {aiPersonalFocus.urgency === 'high' ? '⚡ Mendesak' : 'Fokus Hari Ini'}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Personalisasi Akun: <b>{currentUser?.full_name?.split(' ')[0]}</b>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
                          {aiPersonalFocus.priorityTaskTitle}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                          {aiPersonalFocus.focusReason} {aiPersonalFocus.actionAdvice}
                        </p>
                      </div>

                      {aiPersonalFocus.priorityTaskId && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('tasks');
                            setTimeout(() => {
                              const el = document.getElementById(`task-${aiPersonalFocus.priorityTaskId}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 250);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                        >
                          <span>Kerjakan Sekarang</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Section: Tugas Aktif Anda di Seluruh Tim */}
                {(() => {
                  const uncompletedTasks = allUserTasks.filter((t) => t.status !== 'done');
                  if (uncompletedTasks.length === 0) return null;

                  const calculateAdaptiveScore = (t: typeof uncompletedTasks[0]) => {
                    let score = 0;
                    const isCurrent = team?.username && t.team_username === team.username;
                    if (isCurrent) score += 1000;

                    if (t.review_notes?.toLowerCase().includes('revisi')) score += 350;
                    else if (t.status === 'review') score += 200;
                    else if (t.status === 'in_progress') score += 100;

                    if (t.deadline) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const d = new Date(t.deadline);
                      d.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      if (diffDays < 0) score += 600 + Math.min(Math.abs(diffDays) * 10, 200);
                      else if (diffDays === 0) score += 500;
                      else if (diffDays === 1) score += 400;
                      else if (diffDays <= 3) score += 250;
                      else if (diffDays <= 7) score += 150;
                      else score += Math.max(0, 100 - diffDays);
                    }
                    return score;
                  };

                  const sortedTasks = [...uncompletedTasks].sort((a, b) => {
                    return calculateAdaptiveScore(b) - calculateAdaptiveScore(a);
                  });

                  const filteredTasks = sortedTasks.filter((t) => {
                    if (overviewTaskFilter === 'current_team') {
                      return team?.username && t.team_username === team.username;
                    }
                    if (overviewTaskFilter === 'urgent') {
                      if (!t.deadline) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const d = new Date(t.deadline);
                      d.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays <= 1 || t.review_notes?.toLowerCase().includes('revisi');
                    }
                    return true;
                  });

                  const displayedTasks = showAllOverviewTasks ? filteredTasks : filteredTasks.slice(0, 6);

                  const getUrgencyBadge = (deadlineStr?: string) => {
                    if (!deadlineStr) return null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const d = new Date(deadlineStr);
                    d.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                      return (
                        <span className="badge" style={{ background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.675rem', padding: '2px 8px' }}>
                          ⚠️ Terlewat {Math.abs(diffDays)} Hari!
                        </span>
                      );
                    }
                    if (diffDays === 0) {
                      return (
                        <span className="badge" style={{ background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: '0.675rem', padding: '2px 8px' }}>
                          🚨 Hari Ini!
                        </span>
                      );
                    }
                    if (diffDays === 1) {
                      return (
                        <span className="badge" style={{ background: '#f59e0b', color: '#fff', fontWeight: 800, fontSize: '0.675rem', padding: '2px 8px' }}>
                          ⏳ Besok!
                        </span>
                      );
                    }
                    if (diffDays <= 3) {
                      return (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.16)', color: '#d97706', fontWeight: 700, fontSize: '0.675rem', padding: '2px 8px' }}>
                          ⏱️ {diffDays} Hari Lagi
                        </span>
                      );
                    }
                    return null;
                  };

                  return (
                    <div style={{ marginBottom: 30 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle2 size={18} color="var(--primary)" /> Tugas Aktif Anda di Seluruh Tim
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Urutan adaptif: Tugas tim aktif & batas waktu terdekat diprioritaskan
                          </span>
                        </div>

                        {/* Filter Tabs */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setOverviewTaskFilter('adaptive')}
                            className={`btn btn-sm ${overviewTaskFilter === 'adaptive' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20 }}
                          >
                            ⚡ Prioritas Adaptif ({sortedTasks.length})
                          </button>
                          {team?.name && (
                            <button
                              type="button"
                              onClick={() => setOverviewTaskFilter('current_team')}
                              className={`btn btn-sm ${overviewTaskFilter === 'current_team' ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20 }}
                            >
                              📌 Tim Ini ({sortedTasks.filter((t) => t.team_username === team.username).length})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setOverviewTaskFilter('urgent')}
                            className={`btn btn-sm ${overviewTaskFilter === 'urgent' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20 }}
                          >
                            🔥 Mendesak
                          </button>
                        </div>
                      </div>

                      {displayedTasks.length === 0 ? (
                        <div className="card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Tidak ada tugas yang sesuai dengan filter ini.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {displayedTasks.map((task) => {
                            const isCurrentTeamTask = team?.username && task.team_username === team.username;
                            const handleOpenTask = () => {
                              if (task.team_username === team?.username) {
                                setActiveTab('tasks');
                                setTimeout(() => {
                                  const el = document.getElementById(`task-${task.id}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 150);
                              } else if (task.team_username) {
                                router.push(`/team/${task.team_username}?tab=tasks&taskId=${task.id}`);
                              }
                            };

                            return (
                              <div
                                key={task.id}
                                className="card"
                                onClick={handleOpenTask}
                                style={{
                                  padding: '14px 18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  flexWrap: 'wrap',
                                  gap: 12,
                                  transition: 'all 0.15s ease',
                                  borderLeft: isCurrentTeamTask ? '4px solid var(--primary)' : '1px solid var(--surface-border)',
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                      {task.title}
                                    </span>
                                    {isCurrentTeamTask ? (
                                      <span className="badge badge-primary" style={{ fontSize: '0.675rem', padding: '2px 8px', fontWeight: 800 }}>
                                        📌 {task.team_name || 'Tim Ini'}
                                      </span>
                                    ) : task.team_name ? (
                                      <span className="badge badge-neutral" style={{ fontSize: '0.675rem', padding: '2px 8px' }}>
                                        {task.team_name}
                                      </span>
                                    ) : null}

                                    {getUrgencyBadge(task.deadline)}

                                    {task.status === 'review' ? (
                                      <span className="badge badge-purple" style={{ fontSize: '0.675rem' }}>
                                        🔍 Menunggu Review / ACC Ketua
                                      </span>
                                    ) : task.review_notes?.toLowerCase().includes('revisi') ? (
                                      <span className="badge badge-warning" style={{ fontSize: '0.675rem' }}>
                                        ⚠️ Perlu Revisi
                                      </span>
                                    ) : (
                                      <span className="badge badge-blue" style={{ fontSize: '0.675rem' }}>
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
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenTask();
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  Buka Tugas <ArrowRight size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {filteredTasks.length > 6 && (
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                          <button
                            type="button"
                            onClick={() => setShowAllOverviewTasks(!showAllOverviewTasks)}
                            className="btn btn-secondary btn-sm"
                            style={{ borderRadius: 20, padding: '5px 16px', fontSize: '0.775rem' }}
                          >
                            {showAllOverviewTasks ? 'Tampilkan Lebih Sedikit' : `Lihat Semua ${filteredTasks.length} Tugas (${filteredTasks.length - 6} Lainnya)`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Section: Koleksi Ruang Kerja Tim Anda */}
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
                        value={searchTeamQuery}
                        onChange={(e) => setSearchTeamQuery(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: 34, height: 36, fontSize: '0.825rem' }}
                      />
                    </div>
                  </div>

                  {userTeams.filter((t) =>
                    !searchTeamQuery.trim() ||
                    t.name.toLowerCase().includes(searchTeamQuery.toLowerCase()) ||
                    t.username.toLowerCase().includes(searchTeamQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <LayoutGrid size={38} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                        {searchTeamQuery ? 'Tidak ada tim yang cocok dengan pencarian' : 'Anda belum bergabung ke tim manapun'}
                      </h4>
                      <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>
                        {searchTeamQuery ? `Tidak ada hasil untuk "${searchTeamQuery}".` : 'Buat tim pertama Anda atau bergabung ke tim rekan sekarang.'}
                      </p>
                      <button onClick={() => setShowCreateTeamModal(true)} className="btn btn-primary btn-sm">
                        <PlusCircle size={15} /> Buat Tim Baru Sekarang
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
                      {userTeams
                        .filter((t) =>
                          !searchTeamQuery.trim() ||
                          t.name.toLowerCase().includes(searchTeamQuery.toLowerCase()) ||
                          t.username.toLowerCase().includes(searchTeamQuery.toLowerCase())
                        )
                        .map((t) => {
                          const isLeader = t.user_role === 'ketua';
                          const isCurrentActive = t.username === team?.username;

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                if (t.username !== team?.username) {
                                  router.push(`/team/${t.username}`);
                                } else {
                                  setActiveTab('tasks');
                                }
                              }}
                              className="card"
                              style={{
                                cursor: 'pointer',
                                padding: 22,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                border: isCurrentActive ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                                  {t.avatar_url ? (
                                    <img
                                      src={t.avatar_url}
                                      alt={t.name}
                                      className="avatar-photo"
                                      style={{ width: 44, height: 44, objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background: isLeader
                                          ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                                          : 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.95rem',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {t.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isCurrentActive && (
                                      <span className="badge badge-primary" style={{ fontSize: '0.675rem' }}>
                                        Tim Aktif
                                      </span>
                                    )}
                                    {isLeader ? (
                                      <span className="badge badge-warning" style={{ fontSize: '0.675rem' }}>
                                        👑 Ketua
                                      </span>
                                    ) : (
                                      <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
                                        Anggota
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1.3 }}>
                                  {t.name}
                                </h3>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary)', display: 'inline-block', marginBottom: 10 }}>
                                  @{t.username}
                                </span>

                                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4em' }}>
                                  {t.description || 'Ruang kerja tim untuk kolaborasi dan manajemen tugas.'}
                                </p>
                              </div>

                              <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                    <Users size={11} /> {t.member_count}
                                  </span>
                                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                                    <CheckCircle2 size={11} /> {t.task_count}
                                  </span>
                                </div>

                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {isCurrentActive ? 'Kelola Tugas' : 'Buka Workspace'} <ArrowRight size={13} />
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
            {/* TAB 2: TIM SAYA (DROPDOWN TIM, INFO TIM, DAN SELURUH TUGAS DARI TIM INI)   */}
            {/* ========================================================================= */}
            {activeTab === 'tasks' && (
              <div className="animate-fade-in">
                {/* Team Info Banner */}
                <div className="card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
                    <div style={{ flexShrink: 0 }}>
                      {team?.avatar_url ? (
                        <img
                          src={team.avatar_url}
                          alt={team.name}
                          className="avatar-photo"
                          style={{ width: 56, height: 56, border: '2px solid var(--primary)', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="team-avatar-header" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
                          {team?.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, wordBreak: 'break-word' }}>
                          {team?.name}
                        </h2>
                        {isKetua ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            <Crown size={11} /> Ketua Tim
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            <User size={11} /> Anggota
                          </span>
                        )}
                      </div>
                      {team?.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                          {team.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>@{team?.username}</span>
                        <span>•</span>
                        <span>{members.length} Anggota</span>
                        <span>•</span>
                        <span>{tasks.length} Seluruh Tugas</span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Cepat: Salin Kode & Undangan */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={handleCopyCode} className="btn btn-secondary btn-sm" title="Salin kode username tim">
                      <Copy size={14} /> Salin Kode
                    </button>
                    <button onClick={handleCopyInviteLink} className="btn btn-secondary btn-sm" title="Salin tautan bergabung">
                      <ExternalLink size={14} /> Undangan
                    </button>
                  </div>
                </div>

                {/* Kemajuan Progres Tim Aktif (Solid Bar, Satu Warna var(--primary), Tanpa Gradasi) */}
                <div className="card" style={{ padding: '18px 22px', marginBottom: 20, background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Kemajuan Tim {team?.name} 🚀
                        </h3>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                          {overallProgress}% Selesai
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {completedTasks} dari {totalTasks} tugas telah tuntas disetujui
                        {inReviewTasks > 0 && ` • ${inReviewTasks} sedang menunggu review Ketua`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Tugas Selesai</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                          {completedTasks}/{totalTasks}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (Satu Warna Solid, Tanpa Gradasi) */}
                  <div style={{ width: '100%', height: 10, background: 'var(--surface-border)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${overallProgress}%`,
                        height: '100%',
                        background: 'var(--primary)',
                        borderRadius: 9999,
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>

                {/* Leader review prompt banner if any tasks are in review */}
                {isKetua && inReviewTasks > 0 && (
                  <div
                    style={{
                      background: isDarkMode ? 'rgba(168, 85, 247, 0.12)' : '#fdf4ff',
                      border: isDarkMode ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid #f0abfc',
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
                      <ShieldAlert size={20} color={isDarkMode ? '#c084fc' : '#a21caf'} />
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: isDarkMode ? '#f5d0fe' : '#86198f' }}>
                          Ada {inReviewTasks} tugas yang sudah diselesaikan anggota dan menunggu pengecekan Anda!
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: isDarkMode ? '#d8b4fe' : '#a21caf' }}>
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
                <div className="task-toolbar">
                  <div className="task-filters-scroll">
                    <button
                      onClick={() => setTaskFilter('all')}
                      className={`btn btn-sm task-filter-chip ${taskFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Semua ({tasks.length})
                    </button>
                    <button
                      onClick={() => setTaskFilter('todo')}
                      className={`btn btn-sm task-filter-chip ${taskFilter === 'todo' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Belum Dikerjakan ({tasks.filter((t) => t.status === 'todo').length})
                    </button>
                    <button
                      onClick={() => setTaskFilter('in_progress')}
                      className={`btn btn-sm task-filter-chip ${taskFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Sedang Dikerjakan ({tasks.filter((t) => t.status === 'in_progress').length})
                    </button>
                    <button
                      onClick={() => setTaskFilter('review')}
                      className={`btn btn-sm task-filter-chip ${taskFilter === 'review' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      🔍 Menunggu Review / ACC ({inReviewTasks})
                    </button>
                    <button
                      onClick={() => setTaskFilter('done')}
                      className={`btn btn-sm task-filter-chip ${taskFilter === 'done' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Selesai ({tasks.filter((t) => t.status === 'done').length})
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={team?.wa_group_id ? handleSendBotGroupRecap : handleShareGroupRecap}
                      disabled={isSendingGroupRecap}
                      className="btn btn-secondary btn-sm btn-rekap-wa"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                        color: team?.wa_group_id ? (isDarkMode ? '#4ade80' : '#16a34a') : undefined,
                        borderColor: team?.wa_group_id ? (isDarkMode ? 'rgba(34, 197, 94, 0.4)' : '#86efac') : undefined,
                        background: team?.wa_group_id ? (isDarkMode ? 'rgba(34, 197, 94, 0.08)' : '#f0fdf4') : undefined,
                      }}
                      title={team?.wa_group_id ? "Kirim ringkasan semua tugas & deadline langsung ke Grup WhatsApp tim via Bot" : "Kirim ringkasan semua tugas & deadline ke WhatsApp / Grup WA"}
                    >
                      <Share2 size={15} /> {isSendingGroupRecap ? 'Mengirim ke Grup...' : team?.wa_group_id ? '🤖 Rekap ke Grup WA' : 'Rekap ke WA'}
                    </button>
                    <button onClick={openAddTaskModal} className="btn btn-primary btn-add-task">
                      <Plus size={16} /> Tambah Tugas Baru
                    </button>
                  </div>
                </div>

                {/* Task List */}
                {filteredTasks.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--surface)' }}>
                    <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 6 }}>
                      {taskFilter === 'all' ? 'Belum ada tugas di tim ini' : 'Tidak ada tugas dalam kategori ini'}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      Mulai bagi tugas kelompok dan sertakan link pengerjaan agar tercapai target tepat waktu.
                    </p>
                    <button onClick={openAddTaskModal} className="btn btn-primary">
                      <Plus size={16} /> Buat Tugas Pertama
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filteredTasks.map((task) => {
                      const isDone = task.status === 'done';
                      const isInProgress = task.status === 'in_progress';
                      const isReview = task.status === 'review';
                      const isUnreadComment = (task.comments_count || 0) > (readCommentsMap[task.id] || 0);

                      let borderLeftColor = '#cbd5e1';
                      if (isDone) borderLeftColor = 'var(--success)';
                      else if (isReview) borderLeftColor = '#a855f7';
                      else if (isInProgress) borderLeftColor = 'var(--primary)';

                      return (
                        <div
                          key={task.id}
                          id={`task-${task.id}`}
                          className="card task-card-responsive"
                          style={{
                            borderLeft: `5px solid ${borderLeftColor}`,
                            background: isReview
                              ? isDarkMode
                                ? 'rgba(168, 85, 247, 0.08)'
                                : '#fdfaff'
                              : 'var(--surface)',
                            opacity: isDone ? 0.88 : 1,
                          }}
                        >
                          <div className="task-card-content">
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
                                background: isDone
                                  ? 'var(--success)'
                                  : isReview
                                  ? isDarkMode ? 'rgba(168, 85, 247, 0.22)' : '#f3e8ff'
                                  : isInProgress
                                  ? 'var(--primary-light)'
                                  : isDarkMode ? '#1e293b' : '#f1f5f9',
                                color: isDone
                                  ? 'white'
                                  : isReview
                                  ? isDarkMode ? '#c084fc' : '#7e22ce'
                                  : isInProgress
                                  ? 'var(--primary)'
                                  : 'var(--text-muted)',
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

                            <div className="task-card-body">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                                <h4
                                  style={{
                                    fontSize: '1.05rem',
                                    fontWeight: 700,
                                    textDecoration: isDone ? 'line-through' : 'none',
                                    color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {task.title}
                                </h4>
                                {getDeadlineBadge(task.deadline, task.status)}

                                {/* Indikator Komentar Belum Dibaca */}
                                {isUnreadComment && (
                                  <span
                                    className="badge unread-comment-indicator"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      background: '#ef4444',
                                      color: '#ffffff',
                                      padding: '2px 8px',
                                      borderRadius: 9999,
                                    }}
                                    title="Ada diskusi/komentar baru yang belum Anda baca!"
                                  >
                                    💬 Komentar Baru
                                  </span>
                                )}

                                {task.status === 'review' ? (
                                  <span
                                    className="badge badge-purple"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      background: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : '#f3e8ff',
                                      color: isDarkMode ? '#c084fc' : '#7e22ce',
                                      border: `1px solid ${isDarkMode ? 'rgba(168, 85, 247, 0.4)' : '#ddd6fe'}`,
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                    }}
                                  >
                                    🔍 Menunggu Review / ACC Ketua
                                  </span>
                                ) : isInProgress && task.review_notes?.toLowerCase().includes('revisi') ? (
                                  <span
                                    className="badge badge-warning"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      background: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                                      color: isDarkMode ? '#fbbf24' : '#b45309',
                                      border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.4)' : '#fde68a'}`,
                                      padding: '2px 8px',
                                      borderRadius: 6,
                                    }}
                                  >
                                    ⚠️ Perlu Revisi
                                  </span>
                                ) : null}
                              </div>

                              {task.description && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                  {task.description}
                                </p>
                              )}

                              {/* Review Notes from Member / Revision Notes from Leader */}
                              {(() => {
                                const cleanNotes = (task.review_notes || '').replace(/\[STATUS:REVIEW\]\s*/g, '').trim();
                                if (!cleanNotes) return null;
                                const isRevision = cleanNotes.toLowerCase().includes('revisi');
                                return (
                                  <div
                                    style={{
                                      background: isRevision
                                        ? isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2'
                                        : isReview
                                        ? isDarkMode ? 'rgba(168, 85, 247, 0.12)' : '#f5f3ff'
                                        : isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
                                      border: `1px solid ${
                                        isRevision
                                          ? isDarkMode ? 'rgba(239, 68, 68, 0.35)' : '#fecaca'
                                          : isReview
                                          ? isDarkMode ? 'rgba(168, 85, 247, 0.3)' : '#ddd6fe'
                                          : isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fde68a'
                                      }`,
                                      borderRadius: 8,
                                      padding: '8px 12px',
                                      marginBottom: 12,
                                      fontSize: '0.825rem',
                                      color: isRevision
                                        ? isDarkMode ? '#fca5a5' : '#b91c1c'
                                        : isReview
                                        ? isDarkMode ? '#d8b4fe' : '#5b21b6'
                                        : isDarkMode ? '#fcd34d' : '#92400e',
                                      wordBreak: 'break-word',
                                      overflowWrap: 'anywhere',
                                    }}
                                  >
                                    {isRevision ? '⚠️ ' : '💬 '}
                                    <b>{isRevision ? 'Catatan Revisi dari Ketua:' : 'Catatan untuk Ketua:'}</b>{' '}
                                    {cleanNotes.replace(/^Catatan Revisi dari Ketua:\s*/i, '')}
                                  </div>
                                );
                              })()}

                              {/* Task Link (Tautan Hasil Tugas) */}
                              {task.task_link && (
                                <div style={{ marginBottom: 12 }}>
                                  <a
                                    href={task.task_link.startsWith('http') ? task.task_link : `https://${task.task_link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm btn-task-link"
                                    style={{
                                      display: 'inline-flex',
                                      fontSize: '0.8rem',
                                      padding: '5px 12px',
                                      maxWidth: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <ExternalLink size={13} /> Buka Link Tugas ↗
                                  </a>
                                </div>
                              )}

                              {/* Assignee & Meta (Member Tugas dengan Foto Profil) */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: 'var(--text-subtle)' }}>Member Tugas:</span>
                                  {task.assignee_profiles && task.assignee_profiles.length > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <div className="pic-avatar-stack">
                                        {task.assignee_profiles.map((p) => (
                                          p.avatar_url ? (
                                            <img
                                              key={p.id}
                                              src={p.avatar_url}
                                              alt={p.full_name}
                                              className="avatar-photo pic-stack-item"
                                              style={{ width: 24, height: 24 }}
                                              title={p.full_name}
                                            />
                                          ) : (
                                            <div
                                              key={p.id}
                                              className="pic-stack-item"
                                              style={{ width: 24, height: 24, fontSize: '0.65rem' }}
                                              title={p.full_name}
                                            >
                                              {p.full_name.slice(0, 1).toUpperCase()}
                                            </div>
                                          )
                                        ))}
                                      </div>
                                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                        {task.assignee_profiles.map((p) => p.full_name).join(', ')}
                                      </span>
                                    </div>
                                  ) : task.assignee_profile ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      {task.assignee_profile.avatar_url ? (
                                        <img
                                          src={task.assignee_profile.avatar_url}
                                          alt={task.assignee_profile.full_name}
                                          className="avatar-photo"
                                          style={{ width: 22, height: 22 }}
                                        />
                                      ) : (
                                        <div className="avatar-badge" style={{ width: 22, height: 22, fontSize: '0.65rem' }}>
                                          {task.assignee_profile.full_name.slice(0, 1).toUpperCase()}
                                        </div>
                                      )}
                                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                        {task.assignee_profile.full_name}
                                      </span>
                                    </div>
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
                          <div className="task-card-actions">
                            {/* Primary Workflow Buttons based on Role & Status */}
                            <div className="task-actions-main">
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
                                      onClick={() => openKetuaReviewModal(task)}
                                      className="btn btn-success btn-sm"
                                    >
                                      <Check size={14} /> Revisi / Selesaikan Tugas
                                    </button>
                                  ) : (
                                    <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                      <button
                                        onClick={() => handleQuickSubmitReview(task)}
                                        className="btn btn-primary btn-sm"
                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', fontWeight: 700 }}
                                        title="Klik untuk langsung ajukan tugas ke Ketua agar dicek & di-ACC"
                                      >
                                        <Send size={13} /> {task.review_notes?.toLowerCase().includes('revisi') ? 'Ajukan Ulang Hasil Revisi' : 'Ajukan Dicek Ketua'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openSubmitReview(task)}
                                        className="btn btn-secondary btn-sm"
                                        title="Sematkan link hasil pengerjaan (Google Drive/Docs) dan catatan sebelum mengajukan"
                                        style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                                      >
                                        + Link / Catatan
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}

                              {task.status === 'review' && (
                                <>
                                  {isKetua ? (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%' }}>
                                      <button
                                        onClick={() => openKetuaReviewModal(task)}
                                        className="btn btn-success btn-sm"
                                        style={{ flex: 1 }}
                                      >
                                        <Check size={14} /> Review & Selesaikan
                                      </button>
                                      <button
                                        onClick={() => openKetuaReviewModal(task)}
                                        className="btn btn-danger btn-sm"
                                        style={{ flex: 1 }}
                                      >
                                        <RotateCcw size={14} /> Minta Revisi
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => openSubmitReview(task)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                        title="Perbarui link hasil kerja atau catatan untuk Ketua"
                                      >
                                        <Edit size={13} /> Edit Pengajuan (Tautan / Catatan)
                                      </button>
                                    </div>
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
                            </div>

                            {/* Secondary Buttons (WhatsApp, Comment, Edit & Delete) */}
                            <div className="task-actions-secondary">
                              {/* Tombol Diskusi / Komentar dengan Indikator Belum Dibaca */}
                              <button
                                onClick={() => openTaskComments(task)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '6px 10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  position: 'relative',
                                  color: isUnreadComment ? '#ef4444' : (task.comments_count || 0) > 0 ? 'var(--primary)' : 'inherit',
                                  borderColor: isUnreadComment ? '#ef4444' : (task.comments_count || 0) > 0 ? 'var(--primary-light)' : undefined,
                                }}
                                title={isUnreadComment ? 'Ada komentar baru yang belum Anda baca!' : 'Diskusi & Komentar Tugas'}
                              >
                                <MessageSquare size={14} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{task.comments_count || 0}</span>
                                {isUnreadComment && (
                                  <span
                                    className="unread-comment-indicator"
                                    style={{
                                      position: 'absolute',
                                      top: -4,
                                      right: -4,
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      background: '#ef4444',
                                    }}
                                  />
                                )}
                              </button>

                              {task.status !== 'done' && (
                                <button
                                  onClick={() => handleSendTaskWAReminder(task)}
                                  className="btn btn-secondary btn-sm btn-task-wa"
                                  style={{ padding: '6px 9px' }}
                                  title={`Kirim pengingat WhatsApp ke ${task.assignee_profile?.full_name || 'anggota'}`}
                                >
                                  <Smartphone size={14} />
                                </button>
                              )}

                              <button
                                onClick={() => openEditTask(task)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 9px' }}
                                title="Edit tugas"
                              >
                                <Edit size={14} />
                              </button>

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
                <div className="card" style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--surface)' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                  {research.map((item) => (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '20px 18px',
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
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--surface-secondary)', padding: 10, borderRadius: 8, border: '1px solid var(--surface-border)', marginBottom: 14, lineHeight: 1.4 }}>
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
          {/* TAB 4: PENGATURAN TIM & AKUN PRIBADI                                      */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              {/* Card Foto Profil Tim (Dapat diedit seluruh anggota tim) */}
              <div className="card" style={{ padding: '20px 24px', marginBottom: 24, background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260, flex: 1 }}>
                    <div
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => setShowTeamAvatarModal(true)}
                      title="Klik untuk ganti foto profil tim"
                    >
                      {team?.avatar_url ? (
                        <>
                          <img
                            src={team.avatar_url}
                            alt={team.name}
                            className="avatar-photo"
                            style={{ width: 64, height: 64, border: '2px solid var(--primary)', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = document.getElementById(`settings-team-fallback-${team.id}`);
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div
                            id={`settings-team-fallback-${team.id}`}
                            className="team-avatar-header"
                            style={{ width: 64, height: 64, fontSize: '1.5rem', display: 'none' }}
                          >
                            {team?.name.slice(0, 2).toUpperCase()}
                          </div>
                        </>
                      ) : (
                        <div className="team-avatar-header" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                          {team?.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        <Camera size={12} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{team?.name}</h3>
                        <span className="badge badge-primary">@{team?.username}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        Foto profil tim dapat diubah oleh seluruh anggota tim agar identitas tim lebih menarik.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowTeamAvatarModal(true)}
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <Camera size={16} /> Ganti Foto Tim
                    </button>
                    {team?.avatar_url && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!team) return;
                          setSavingTeamAvatar(true);
                          await updateTeamAvatar(team.id, '');
                          setSavingTeamAvatar(false);
                          setTeamAvatarUrl('');
                          setTeam((prev) => prev ? { ...prev, avatar_url: '' } : null);
                          showToast('Foto profil tim berhasil dihapus.');
                        }}
                        disabled={savingTeamAvatar}
                        className="btn btn-secondary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Hapus Foto Tim
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Share Box */}
              <div className="card" style={{ padding: 26, marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 6 }}>
                  Undang Teman Bergabung ke Tim 👥
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 18 }}>
                  Cukup berikan <b>Username Tim</b> di bawah kepada teman Anda. Teman Anda hanya perlu masuk ke TimJuara lalu memilih <b>&quot;Gabung ke Tim&quot;</b>.
                </p>

                <div className="share-box-inputs">
                  <div className="share-box-input-container" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-secondary)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', flex: 1, minWidth: 220 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Username Tim:</span>
                    <code style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', wordBreak: 'break-all' }}>
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

              {/* WhatsApp Group Connection Card */}
              <div
                className="card"
                style={{
                  padding: '22px 24px',
                  marginBottom: 24,
                  border: team.wa_group_id
                    ? (isDarkMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #bbf7d0')
                    : '1px solid var(--surface-border)',
                  background: team.wa_group_id
                    ? (isDarkMode ? 'linear-gradient(to bottom, rgba(34, 197, 94, 0.08) 0%, var(--surface) 180px)' : 'linear-gradient(to bottom, #f0fdf4 0%, var(--surface) 180px)')
                    : 'var(--surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260, flex: 1 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: team.wa_group_id ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7') : 'var(--surface-secondary)',
                        color: team.wa_group_id ? (isDarkMode ? '#4ade80' : '#16a34a') : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Grup WhatsApp Tim</h3>
                        {team.wa_group_id ? (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                            🟢 Terhubung
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                            ⚪ Belum Terhubung
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        {team.wa_group_id ? (
                          <span>
                            Grup: <strong style={{ color: 'var(--text-main)' }}>{team.wa_group_name || 'Grup Tim'}</strong> ({team.wa_group_id}). Bot otomatis mengumumkan tugas baru & tugas selesai ke grup ini!
                          </span>
                        ) : (
                          <span>
                            Hubungkan grup WhatsApp tim agar bot dapat otomatis mengirim pengumuman <b>Tugas Baru</b> dan <b>Tugas Selesai & Disetujui</b>.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {team.wa_group_id && (
                      <button
                        type="button"
                        onClick={handleSendBotGroupRecap}
                        disabled={isSendingGroupRecap}
                        className="btn btn-secondary btn-sm"
                        style={{
                          color: isDarkMode ? '#4ade80' : '#16a34a',
                          borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.35)' : '#86efac',
                        }}
                        title="Kirim pesan rekap tugas sekarang ke grup tim via Bot"
                      >
                        <BellRing size={14} /> {isSendingGroupRecap ? 'Mengirim...' : 'Kirim Rekap ke Grup'}
                      </button>
                    )}
                    {canManageMembers && (
                      <button
                        type="button"
                        onClick={handleOpenConnectTeamGroupModal}
                        className="btn btn-primary btn-sm"
                        style={{
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          borderColor: '#16a34a',
                        }}
                      >
                        <MessageSquare size={14} /> {team.wa_group_id ? 'Ubah Grup WhatsApp' : 'Hubungkan Grup WhatsApp'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Members Table */}
              <div className="card" style={{ padding: '24px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Daftar Anggota & Peran ({members.length})</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {canManageMembers
                        ? 'Sebagai Ketua Tim / Master Admin, Anda dapat mengatur siapa yang menjadi Ketua atau Anggota serta mengelola anggota tim.'
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
                        className="member-card-responsive"
                        style={{
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-secondary)',
                          border: '1px solid var(--surface-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                          <div className="avatar-badge" style={{ width: 40, height: 40, flexShrink: 0 }}>
                            {m.profile?.full_name?.slice(0, 2).toUpperCase() || 'AG'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', wordBreak: 'break-word' }}>
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
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                  {m.profile.email} •
                                </span>
                              )}
                              {m.profile?.phone_number && (
                                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                                  📱 {m.profile.phone_number} •
                                </span>
                              )}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Bergabung {new Date(m.joined_at).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Role Selector or Badge */}
                        <div className="member-card-actions">
                          {canManageMembers && (!isSelf || isMasterAdminUser) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'flex-end' }}>
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
                            <div style={{ marginLeft: 'auto' }}>
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

                {/* Leave Team Button for Regular Members */}
                {!isKetua && currentMember && !isMasterAdminUser && (
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
                  {/* Bagian 0: Foto Profil Saya (Default inisial) */}
                  <div className="profile-edit-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Camera size={16} color="var(--primary)" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Foto Profil</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Foto profil Anda akan ditampilkan pada kartu tugas dan menu. Bila belum diatur, sistem otomatis menampilkan inisial nama Anda.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt="Preview Profil"
                          className="avatar-photo"
                          style={{ width: 56, height: 56, border: '2px solid var(--primary)', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="avatar-badge" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
                          {profileName?.slice(0, 2).toUpperCase() || 'AG'}
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                          {userAvatarUrl ? 'Foto profil kustom aktif' : 'Menggunakan avatar inisial (bawaan)'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Tempel tautan gambar (Mendukung link Google Drive, Unsplash, Imgur, GitHub, dsb.)
                        </span>
                      </div>
                    </div>
                    <form onSubmit={handleUpdateUserAvatar} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/... atau https://images.unsplash.com/..."
                          value={userAvatarUrl}
                          onChange={(e) => setUserAvatarUrl(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingUserAvatar}
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {savingUserAvatar ? 'Menyimpan...' : 'Simpan Foto'}
                      </button>
                      {userAvatarUrl && (
                        <button
                          type="button"
                          onClick={async () => {
                            setUserAvatarUrl('');
                            if (currentUser) {
                              setSavingUserAvatar(true);
                              await updateUserAvatar(currentUser.id, '');
                              setSavingUserAvatar(false);
                              setCurrentUser((prev) => prev ? { ...prev, avatar_url: '' } : null);
                              showToast('Foto profil berhasil dihapus.');
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          Hapus Foto Profil
                        </button>
                      )}
                      <div style={{ width: '100%', marginTop: 2 }}>
                        <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          💡 <b>Tips Google Drive:</b> Anda bisa langsung menempelkan link Google Drive! Pastikan setelan akses berkas di Google Drive sudah disetel ke <i>&quot;Siapa saja yang memiliki link&quot;</i> (Publik) agar fotonya dapat diakses browser.
                        </span>
                      </div>
                    </form>
                  </div>

                  {/* Bagian 1: Ganti Nama Lengkap */}
                  <div className="profile-edit-box">
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

                  {/* Bagian 2: Nomor WhatsApp Saya */}
                  <div className="profile-edit-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Smartphone size={16} color="#16a34a" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Nomor WhatsApp</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Nomor ini digunakan untuk menerima pesan notifikasi otomatis dari bot saat tugas Anda mendekati deadline.
                    </p>
                    <form onSubmit={handleUpdatePhone} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <input
                            type="text"
                            placeholder="Contoh: 08123456789 atau 628123456789"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={savingPhone}
                          className="btn btn-primary"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {savingPhone ? 'Menyimpan...' : 'Simpan Nomor WA'}
                        </button>
                        {profilePhone.trim() && (
                          <button
                            type="button"
                            onClick={handleTestWhatsApp}
                            disabled={testingWa}
                            className="btn btn-outline"
                            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                            title="Uji coba pengiriman pesan bot ke nomor WhatsApp Anda"
                          >
                            <Send size={14} />
                            {testingWa ? 'Mengirim...' : 'Tes Kirim WA'}
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        💡 Masukkan nomor dengan awalan 08... atau 628... Sistem otomatis memformat nomor menjadi standar internasional.
                      </span>
                    </form>
                  </div>

                  {/* Bagian 3: Ganti Alamat Email */}
                  <div className="profile-edit-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Mail size={16} color="#059669" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Alamat Email</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Email utama yang digunakan untuk masuk (login) ke akun TimJuara Anda.
                    </p>
                    <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ℹ️ Catatan: Layanan email bawaan Supabase (Free Tier) memiliki kuota maksimal 2-3 pengiriman per jam.
                      </span>
                    </form>
                  </div>

                  {/* Bagian 4: Ganti Kata Sandi */}
                  <div className="profile-edit-box">
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
      {/* MOBILE BOTTOM NAVIGATION (Bawah)                                          */}
      {/* ========================================================================= */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`mobile-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`mobile-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
        >
          <CheckCircle2 size={20} />
          <span>Tugas & Deadline</span>
          {tasks.length > 0 && (
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              {tasks.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('research')}
          className={`mobile-nav-btn ${activeTab === 'research' ? 'active' : ''}`}
        >
          <FolderGit2 size={20} />
          <span>Materi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`mobile-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={20} />
          <span>Pengaturan</span>
        </button>
      </nav>
    </div>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Nama / Judul Tugas</label>
                    <button
                      type="button"
                      onClick={handleTriggerAiBreakdown}
                      className="ai-pill-btn"
                      style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                      title="Pecah tugas besar ini menjadi 3-4 subtask terstruktur secara otomatis dengan AI"
                    >
                      <Wand2 size={12} /> Pecah Tugas (AI)
                    </button>
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Keterangan / Detail Tugas</label>
                    <button
                      type="button"
                      onClick={handleGenerateAiDod}
                      disabled={generatingDod}
                      className="ai-pill-btn"
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      title="Otomatis tuliskan standar kelayakan pengerjaan (Definition of Done)"
                    >
                      <Sparkles size={11} /> {generatingDod ? 'Menulis...' : 'Generate Kriteria DoD'}
                    </button>
                  </div>
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
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Member Tugas (Bisa Lebih dari 1 Orang)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {taskAssigneeIds.length} dipilih
                    </span>
                  </label>
                  <div className="pic-selector-grid">
                    {members.map((m) => {
                      const isSelected = taskAssigneeIds.includes(m.user_id);
                      return (
                        <button
                          key={m.user_id}
                          type="button"
                          onClick={() => toggleAssignee(m.user_id)}
                          className={`pic-chip ${isSelected ? 'selected' : ''}`}
                        >
                          {m.profile?.avatar_url ? (
                            <img
                              src={m.profile.avatar_url}
                              alt={m.profile.full_name || ''}
                              className="avatar-photo"
                              style={{ width: 24, height: 24, flexShrink: 0 }}
                            />
                          ) : (
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isSelected ? 'var(--primary)' : '#cbd5e1',
                                color: isSelected ? 'white' : '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {m.profile?.full_name?.slice(0, 1).toUpperCase() || 'A'}
                            </span>
                          )}
                          <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.profile?.full_name || 'Anggota'}
                          </span>
                          {isSelected && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
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
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Member Tugas (Bisa Lebih dari 1 Orang)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {taskAssigneeIds.length} dipilih
                    </span>
                  </label>
                  <div className="pic-selector-grid">
                    {members.map((m) => {
                      const isSelected = taskAssigneeIds.includes(m.user_id);
                      return (
                        <button
                          key={m.user_id}
                          type="button"
                          onClick={() => toggleAssignee(m.user_id)}
                          className={`pic-chip ${isSelected ? 'selected' : ''}`}
                        >
                          {m.profile?.avatar_url ? (
                            <img
                              src={m.profile.avatar_url}
                              alt={m.profile.full_name || ''}
                              className="avatar-photo"
                              style={{ width: 24, height: 24, flexShrink: 0 }}
                            />
                          ) : (
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: isSelected ? 'var(--primary)' : '#cbd5e1',
                                color: isSelected ? 'white' : '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {m.profile?.full_name?.slice(0, 1).toUpperCase() || 'A'}
                            </span>
                          )}
                          <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.profile?.full_name || 'Anggota'}
                          </span>
                          {isSelected && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
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
        <div className="modal-overlay" onClick={() => !isSubmittingReview && setShowReviewModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ajukan Tugas untuk Dicek Ketua</h3>
                {selectedTask && (
                  <div style={{ fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 600, marginTop: 3 }}>
                    📌 Tugas: {selectedTask.title}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => setShowReviewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmSubmitReview}>
              <div className="modal-body">
                <div style={{
                  background: isDarkMode ? 'rgba(168, 85, 247, 0.12)' : '#f5f3ff',
                  border: isDarkMode ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid #ddd6fe',
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                  fontSize: '0.825rem',
                  color: isDarkMode ? '#d8b4fe' : '#5b21b6',
                }}>
                  📌 <b>Info:</b> Setelah diajukan, status tugas akan langsung berubah menjadi <i>&quot;🔍 Menunggu Review / ACC Ketua&quot;</i> agar Ketua Tim dapat memverifikasi hasil kerja Anda.
                </div>

                <div className="form-group">
                  <label className="form-label">Link Hasil Pengerjaan (Google Drive / Docs / Figma) <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>(Opsional jika link sudah ada di deskripsi/catatan)</span></label>
                  <input
                    type="text"
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
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => setShowReviewModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="btn btn-primary"
                  style={{ background: '#7c3aed', fontWeight: 700 }}
                >
                  <Send size={15} /> {isSubmittingReview ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan & Ajukan ke Ketua'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VERIFIKASI & REVIEW TUGAS OLEH KETUA                                */}
      {/* ========================================================================= */}
      {showKetuaReviewModal && ketuaReviewTask && (
        <div className="modal-overlay" onClick={() => !ketuaReviewLoading && setShowKetuaReviewModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Verifikasi & Review Tugas
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Periksa hasil pengerjaan, beri arahan revisi, atau konfirmasi penyelesaian tugas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !ketuaReviewLoading && setShowKetuaReviewModal(false)}
                disabled={ketuaReviewLoading}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Task Summary Box */}
              <div
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {ketuaReviewTask.title}
                  </h4>
                  {ketuaReviewTask.status === 'review' ? (
                    <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      🔍 Menunggu Review
                    </span>
                  ) : ketuaReviewTask.review_notes?.toLowerCase().includes('revisi') ? (
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      ⚠️ Dalam Masa Revisi
                    </span>
                  ) : (
                    <span className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      Sedang Dikerjakan
                    </span>
                  )}
                </div>

                {ketuaReviewTask.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    {ketuaReviewTask.description}
                  </p>
                )}

                {/* PIC Info & Deadline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-subtle)' }}>Member Tugas:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {ketuaReviewTask.assignee_profiles && ketuaReviewTask.assignee_profiles.length > 0
                        ? ketuaReviewTask.assignee_profiles.map((p) => p.full_name).join(', ')
                        : ketuaReviewTask.assignee_profile?.full_name || 'Belum ditugaskan'}
                    </span>
                  </div>

                  {ketuaReviewTask.deadline && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} />
                      <span>Deadline: {new Date(ketuaReviewTask.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {/* Link Tugas bila ada */}
                {ketuaReviewTask.task_link && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--surface-border)' }}>
                    <a
                      href={ketuaReviewTask.task_link.startsWith('http') ? ketuaReviewTask.task_link : `https://${ketuaReviewTask.task_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--primary)',
                        borderColor: 'var(--primary)',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={14} /> Buka & Periksa Link Hasil Kerja ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Catatan Terakhir dari Anggota/Sebelumnya */}
              {(() => {
                const cleanNotes = (ketuaReviewTask.review_notes || '').replace(/\[STATUS:REVIEW\]\s*/g, '').trim();
                if (!cleanNotes) return null;
                return (
                  <div
                    style={{
                      background: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : '#f5f3ff',
                      border: `1px solid ${isDarkMode ? 'rgba(168, 85, 247, 0.25)' : '#ddd6fe'}`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: '0.825rem',
                      color: isDarkMode ? '#d8b4fe' : '#5b21b6',
                    }}
                  >
                    💬 <b>Catatan Sebelumnya:</b>
                    <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{cleanNotes}</div>
                  </div>
                );
              })()}

              {/* Riwayat Komentar Singkat */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={14} /> Riwayat Diskusi ({ketuaReviewComments.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => openTaskComments(ketuaReviewTask)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Buka Kolom Diskusi Penuh ↗
                  </button>
                </div>

                <div
                  style={{
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#f1f5f9',
                    borderRadius: 8,
                    padding: 10,
                    maxHeight: 120,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {loadingReviewComments ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                      Memuat komentar...
                    </div>
                  ) : ketuaReviewComments.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                      Belum ada komentar pada tugas ini. Berikan catatan pertama di bawah!
                    </div>
                  ) : (
                    ketuaReviewComments.slice(-3).map((c) => (
                      <div
                        key={c.id}
                        style={{
                          fontSize: '0.8rem',
                          background: isDarkMode ? '#1e293b' : '#ffffff',
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--surface-border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.75rem' }}>
                            {c.author_profile?.full_name || 'Anggota'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                            {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', wordBreak: 'break-word' }}>{c.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form Input Catatan Ketua */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Catatan Evaluasi / Instruksi Ketua
                </label>
                <textarea
                  rows={3}
                  placeholder="Tulis poin revisi jika perlu perbaikan (misal: lengkapi analisis bab 2), atau catatan apresiasi jika sudah sesuai..."
                  value={ketuaReviewNotes}
                  onChange={(e) => setKetuaReviewNotes(e.target.value)}
                  className="form-textarea"
                  style={{ resize: 'vertical' }}
                  disabled={ketuaReviewLoading}
                />
                <span className="form-hint" style={{ fontSize: '0.75rem' }}>
                  💡 Catatan ini akan otomatis masuk ke riwayat diskusi tugas & dikirim ke WhatsApp/In-App anggota tim.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--surface-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setShowKetuaReviewModal(false)}
                disabled={ketuaReviewLoading}
                className="btn btn-secondary"
              >
                Batal
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleKetuaRequestRevision}
                  disabled={ketuaReviewLoading}
                  className="btn btn-danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  title="Kembalikan tugas ke status pengerjaan dengan catatan revisi"
                >
                  <RotateCcw size={14} /> Minta Revisi
                </button>

                <button
                  type="button"
                  onClick={handleKetuaApproveTask}
                  disabled={ketuaReviewLoading}
                  className="btn btn-success"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  title="Setujui hasil kerja dan tandai selesai resmi"
                >
                  <Check size={15} /> Sudah Oke, Tandai Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISKUSI & KOMENTAR TUGAS                                           */}
      {/* ========================================================================= */}
      {showCommentsModal && selectedTaskForComments && (
        <div className="modal-overlay" onClick={() => setShowCommentsModal(false)}>
          <div className="modal-card" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Diskusi Tugas</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedTaskForComments.title}
                </p>
              </div>
              <button
                onClick={() => setShowCommentsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Memuat riwayat diskusi...
                </div>
              ) : taskComments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <MessageCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>Belum ada diskusi pada tugas ini</p>
                  <p style={{ fontSize: '0.8rem' }}>Mulai percakapan atau tanyakan progres pekerjaan rekan tim di bawah!</p>
                </div>
              ) : (
                taskComments.map((comment) => {
                  const isMe = currentUser?.id === comment.user_id;
                  const commentDate = new Date(comment.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  });
                  return (
                    <div
                      key={comment.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: isMe ? 'var(--primary)' : 'var(--text-main)' }}>
                          {isMe ? 'Anda' : comment.author_profile?.full_name || 'Anggota'}
                        </span>
                        <span>•</span>
                        <span>{commentDate}</span>
                      </div>
                      <div className={`comment-bubble ${isMe ? 'comment-bubble-me' : 'comment-bubble-other'}`}>
                        {comment.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendComment} style={{ borderTop: '1px solid var(--surface-border)', padding: '14px 20px', background: 'var(--surface-secondary)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Tulis pesan atau tanggapan..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={sendingComment}
                  className="form-input"
                  style={{ flex: 1, padding: '9px 14px', fontSize: '0.875rem' }}
                />
                <button
                  type="submit"
                  disabled={sendingComment || !commentInput.trim()}
                  className="btn btn-primary"
                  style={{ padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={15} />
                  <span>Kirim</span>
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

      {/* ========================================================================= */}
      {/* MODAL: GANTI FOTO PROFIL TIM                                              */}
      {/* ========================================================================= */}
      {showTeamAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowTeamAvatarModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ganti Foto Profil Tim</h3>
              <button
                onClick={() => setShowTeamAvatarModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTeamAvatar}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Foto profil tim dapat diubah oleh seluruh anggota tim. Masukkan link URL gambar (contoh: Unsplash, Imgur, Cloudinary, dsb).
                </p>

                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  {teamAvatarUrl ? (
                    <img
                      src={teamAvatarUrl}
                      alt="Preview Foto Tim"
                      className="avatar-photo"
                      style={{ width: 80, height: 80, border: '3px solid var(--primary)', margin: '0 auto', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className="team-avatar-header"
                      style={{ width: 80, height: 80, fontSize: '1.8rem', margin: '0 auto' }}
                    >
                      {team?.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">URL Foto Tim</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... atau https://images.unsplash.com/..."
                    value={teamAvatarUrl}
                    onChange={(e) => setTeamAvatarUrl(e.target.value)}
                    className="form-input"
                  />
                  <span className="form-hint" style={{ lineHeight: 1.4, marginTop: 6, display: 'block' }}>
                    💡 <b>Mendukung Google Drive:</b> Anda bisa memakai link Google Drive (pastikan akses disetel ke <i>&quot;Siapa saja yang memiliki link&quot;</i> agar foto dapat tampil), Unsplash, Imgur, dsb.
                  </span>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {team?.avatar_url ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!team) return;
                      setSavingTeamAvatar(true);
                      await updateTeamAvatar(team.id, '');
                      setSavingTeamAvatar(false);
                      setTeamAvatarUrl('');
                      setTeam((prev) => prev ? { ...prev, avatar_url: '' } : null);
                      setShowTeamAvatarModal(false);
                      showToast('Foto profil tim berhasil dihapus.');
                    }}
                    disabled={savingTeamAvatar}
                    className="btn btn-danger btn-sm"
                  >
                    Hapus Foto Tim
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowTeamAvatarModal(false)}
                    className="btn btn-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingTeamAvatar}
                    className="btn btn-primary"
                  >
                    {savingTeamAvatar ? 'Menyimpan...' : 'Simpan Foto Tim'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HUBUNGKAN GRUP WHATSAPP TIM (TEAM WORKSPACE)                       */}
      {/* ========================================================================= */}
      {showConnectTeamGroupModal && team && (
        <div className="modal-overlay" onClick={() => !isSavingTeamGroup && !isTestingTeamGroup && setShowConnectTeamGroupModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={20} color="#16a34a" /> Hubungkan Grup WhatsApp Tim
              </h3>
              <button
                onClick={() => !isSavingTeamGroup && !isTestingTeamGroup && setShowConnectTeamGroupModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  background: isDarkMode ? 'rgba(34, 197, 94, 0.08)' : '#f0fdf4',
                  border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: isDarkMode ? '#86efac' : '#166534',
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                <strong>🤖 Bot WhatsApp TimJuara:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                  <li>Pemberitahuan otomatis saat <b>Tugas Baru</b> ditugaskan ke anggota.</li>
                  <li>Pengumuman apresiasi saat <b>Tugas Selesai & Disetujui</b> oleh Ketua.</li>
                </ul>
              </div>

              {/* Pilihan 1: Pilih dari Grup WhatsApp Bot */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>
                    Pilih dari Grup Bot WhatsApp:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleFetchTeamBotGroups(true)}
                    disabled={loadingTeamGroups}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Sinkronkan daftar grup yang diikuti nomor bot"
                  >
                    <RefreshCw size={11} className={loadingTeamGroups ? 'spin' : ''} />
                    {loadingTeamGroups ? 'Memuat...' : '🔄 Muat / Sinkron'}
                  </button>
                </div>

                {teamAvailableGroups.length > 0 ? (
                  <select
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                    onChange={(e) => {
                      const sel = teamAvailableGroups.find((g) => g.id === e.target.value);
                      if (sel) {
                        setTeamGroupInputId(sel.id);
                        setTeamGroupInputName(sel.name);
                      }
                    }}
                    value={teamGroupInputId}
                  >
                    <option value="">-- Pilih Grup WhatsApp --</option>
                    {teamAvailableGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    style={{
                      fontSize: '0.775rem',
                      color: 'var(--text-muted)',
                      background: isDarkMode ? 'var(--surface-secondary)' : '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px dashed var(--surface-border)',
                    }}
                  >
                    Belum ada grup termuat. Klik <b>&quot;Muat / Sinkron&quot;</b> atau masukkan ID grup di bawah.
                  </div>
                )}
              </div>

              {/* Pilihan 2: Input Manual ID Grup WhatsApp */}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  ID Grup WhatsApp <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 120363028391823901@g.us"
                  value={teamGroupInputId}
                  onChange={(e) => setTeamGroupInputId(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
                <span className="form-hint" style={{ fontSize: '0.725rem', marginTop: 4, display: 'block' }}>
                  Format ID Grup WhatsApp Fonnte biasanya berakhiran <code>@g.us</code>.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Nama Grup (Opsional)
                </label>
                <input
                  type="text"
                  placeholder={`Contoh: Grup ${team.name}`}
                  value={teamGroupInputName}
                  onChange={(e) => setTeamGroupInputName(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleTestSendToTeamGroup}
                  disabled={isTestingTeamGroup || !teamGroupInputId.trim()}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    color: isDarkMode ? '#4ade80' : '#16a34a',
                    borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.4)' : '#86efac',
                  }}
                  title="Kirim pesan uji coba ke grup ini"
                >
                  <MessageSquare size={13} />
                  {isTestingTeamGroup ? 'Mengirim...' : 'Kirim Pesan Tes'}
                </button>

                {team.wa_group_id && (
                  <button
                    type="button"
                    onClick={handleDisconnectTeamGroupSettings}
                    disabled={isSavingTeamGroup}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '0.775rem' }}
                  >
                    Putuskan Grup
                  </button>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowConnectTeamGroupModal(false)}
                disabled={isSavingTeamGroup || isTestingTeamGroup}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTeamGroupSettings}
                disabled={isSavingTeamGroup || !teamGroupInputId.trim()}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  borderColor: '#16a34a',
                }}
              >
                {isSavingTeamGroup ? 'Menyimpan...' : 'Simpan Grup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT TIM BARU DARI WORKSPACE                                       */}
      {/* ========================================================================= */}
      {showCreateTeamModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTeamModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlusCircle size={20} color="var(--primary)" /> Buat Tim Baru
              </h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTeamFromModal}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Buat ruang kerja tim baru untuk memulai kolaborasi tugas, materi riset, dan koordinasi deadline.
                </p>

                <div className="form-group">
                  <label className="form-label">Nama Tim *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PKM-KC Robotika Cerdas"
                    value={newTeamName}
                    onChange={(e) => {
                      setNewTeamName(e.target.value);
                      if (!newTeamUsername) {
                        const slug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                          .slice(0, 20);
                        setNewTeamUsername(slug);
                      }
                    }}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username Unik Tim *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>@</span>
                    <input
                      type="text"
                      required
                      placeholder="pkm-kc-robotika"
                      value={newTeamUsername}
                      onChange={(e) => setNewTeamUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="form-input"
                      style={{ paddingLeft: 30 }}
                    />
                  </div>
                  <span className="form-hint">Username digunakan sebagai kode unik untuk rekan bergabung ke tim Anda.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi Singkat Proyek</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Pengembangan robot pendeteksi korban bencana untuk kompetisi PKM 2026."
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingTeamAction}
                  className="btn btn-primary"
                >
                  {submittingTeamAction ? 'Membuat...' : 'Buat Tim Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GABUNG TIM LAIN DARI WORKSPACE                                     */}
      {/* ========================================================================= */}
      {showJoinTeamModal && (
        <div className="modal-overlay" onClick={() => setShowJoinTeamModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} color="var(--primary)" /> Gabung Tim Lain
              </h3>
              <button
                onClick={() => setShowJoinTeamModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleJoinTeamFromModal}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Masukkan username tim atau kode undangan yang dibagikan oleh ketua / rekan tim Anda.
                </p>

                <div className="form-group">
                  <label className="form-label">Username / Kode Tim *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>@</span>
                    <input
                      type="text"
                      required
                      placeholder="contoh: pkm-kc-169"
                      value={joinUsernameInput}
                      onChange={(e) => setJoinUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="form-input"
                      style={{ paddingLeft: 30 }}
                    />
                  </div>
                  <span className="form-hint">Dapatkan username tim dari ketua atau rekan satu tim Anda.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowJoinTeamModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingTeamAction}
                  className="btn btn-primary"
                >
                  {submittingTeamAction ? 'Bergabung...' : 'Gabung Tim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL AI TASK BREAKDOWN PREVIEW (TIMJUARA AI)                            */}
      {/* ========================================================================= */}
      {showAiBreakdownModal && (
        <div
          className="modal-overlay"
          onClick={() => !creatingSubtasks && setShowAiBreakdownModal(false)}
          style={{ zIndex: 10000 }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ai-badge">
                  <Wand2 size={12} /> AI Breakdown
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Pecah Tugas Cerdas
                </h3>
              </div>
              <button
                onClick={() => !creatingSubtasks && setShowAiBreakdownModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tugas Utama:</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                  "{taskTitle}"
                </div>
              </div>

              {loadingAiBreakdown ? (
                <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                  <div className="avatar-badge" style={{ width: 44, height: 44, margin: '0 auto 14px', animation: 'pulseGlow 1.5s infinite', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    <Sparkles size={20} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 6 }}>
                    AI sedang memecah tugas...
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Menganalisis peran PIC, estimasi durasi, dan kriteria penyelesaian (DoD).
                  </div>
                </div>
              ) : aiBreakdownResult ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Pilih Subtask yang Ingin Dibuat ({selectedSubtasks.length} dipilih):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSubtasks.length === aiBreakdownResult.subtasks.length) {
                          setSelectedSubtasks([]);
                        } else {
                          setSelectedSubtasks(aiBreakdownResult.subtasks.map((_, i) => i));
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {selectedSubtasks.length === aiBreakdownResult.subtasks.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                    {aiBreakdownResult.subtasks.map((sub, idx) => {
                      const isChecked = selectedSubtasks.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedSubtasks((prev) =>
                              isChecked ? prev.filter((i) => i !== idx) : [...prev, idx]
                            );
                          }}
                          className="ai-subtask-item"
                          style={{
                            cursor: 'pointer',
                            borderColor: isChecked ? 'var(--primary)' : undefined,
                            background: isChecked
                              ? (isDarkMode ? 'rgba(79, 70, 229, 0.12)' : '#f5f3ff')
                              : undefined,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ marginTop: 3, accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                  {sub.title}
                                </span>
                                <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                  ⏱ +{sub.estimatedDays} hari • {sub.suggestedRole}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {sub.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {aiBreakdownResult.definitionOfDone?.length > 0 && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: isDarkMode ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb',
                        border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid #fef3c7',
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#d97706', marginBottom: 6 }}>
                        📋 Standar Kelayakan (Definition of Done):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {aiBreakdownResult.definitionOfDone.map((dod, i) => (
                          <li key={i}>{dod}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowAiBreakdownModal(false)}
                className="btn btn-secondary"
              >
                Tutup
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {aiBreakdownResult && (
                  <button
                    type="button"
                    onClick={() => {
                      const lines = aiBreakdownResult.subtasks.map((s, i) => `${i + 1}. ${s.title} (${s.suggestedRole})\n   ${s.description}`).join('\n\n');
                      setTaskDesc((prev) => (prev ? prev.trim() + '\n\n' + lines : lines));
                      setShowAiBreakdownModal(false);
                      showToast('Daftar subtask disalin ke deskripsi tugas!');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem' }}
                  >
                    Salin ke Deskripsi
                  </button>
                )}

                {aiBreakdownResult && (
                  <button
                    type="button"
                    onClick={handleApplySubtasks}
                    disabled={creatingSubtasks || selectedSubtasks.length === 0}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Check size={15} />
                    {creatingSubtasks ? 'Membuat...' : `Buat ${selectedSubtasks.length} Subtask Sekaligus`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
