import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { normalizeIndonesianPhone } from '../send/route';

export async function POST(request: Request) {
  return handleReminders(request);
}

export async function GET(request: Request) {
  return handleReminders(request);
}

async function handleReminders(request: Request) {
  try {
    let teamIdFilter: string | undefined;
    let forceSend = false;

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        teamIdFilter = body.teamId;
        forceSend = Boolean(body.force);
      } catch {
        // Body opsional jika dipanggil tanpa payload
      }
    } else {
      const url = new URL(request.url);
      teamIdFilter = url.searchParams.get('teamId') || undefined;
      forceSend = url.searchParams.get('force') === 'true';
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: false,
        error: 'Koneksi Supabase belum terkonfigurasi.',
      }, { status: 500 });
    }

    // 1. Ambil data tugas yang belum selesai dan memiliki deadline
    let taskQuery = supabase
      .from('tasks')
      .select(`
        id, team_id, title, description, task_link, assigned_to, assigned_to_ids, deadline, status,
        profiles!tasks_assigned_to_fkey (id, full_name, phone_number),
        teams!tasks_team_id_fkey (id, name, username, wa_gateway_token, wa_notifications_enabled, wa_group_id)
      `)
      .in('status', ['todo', 'in_progress'])
      .not('deadline', 'is', null);

    if (teamIdFilter) {
      taskQuery = taskQuery.eq('team_id', teamIdFilter);
    }

    const { data: tasks, error: taskError } = await taskQuery;

    if (taskError) {
      return NextResponse.json({
        success: false,
        error: `Gagal mengambil data tugas: ${taskError.message}`,
      }, { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada tugas yang memerlukan pengingat saat ini.',
        sentCount: 0,
        skippedCount: 0,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results: Array<{
      taskId: string;
      title: string;
      assignee: string;
      phone: string;
      status: 'sent' | 'skipped' | 'failed';
      reason?: string;
    }> = [];

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Ambil token dan status global dari system_settings (Master Admin)
    let globalFonnteToken = process.env.FONNTE_TOKEN || '';
    let globalWaEnabled = true;

    try {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['fonnte_token', 'wa_notifications_enabled']);

      if (settings) {
        for (const s of settings) {
          if (s.key === 'fonnte_token' && s.value) globalFonnteToken = s.value;
          if (s.key === 'wa_notifications_enabled') globalWaEnabled = s.value !== 'false';
        }
      }
    } catch (e) {
      console.error('Error fetching global settings in remind route:', e);
    }

    if (!globalWaEnabled) {
      return NextResponse.json({
        success: false,
        message: 'Pengingat WhatsApp otomatis sedang dinonaktifkan oleh Master Admin.',
        sentCount: 0,
        skippedCount: 0,
      });
    }

    // Map untuk mengelompokkan tugas per tim (untuk notifikasi grup & notifikasi web ke ketua)
    const teamRemindersMap: Record<string, {
      team: any;
      urgentTasks: Array<{ title: string; deadlineLabel: string; assignee: string }>;
      sentPersonalCount: number;
    }> = {};

    for (const t of tasks) {
      const teamInfo: any = t.teams;
      let profileInfo: any = t.profiles;

      // Jika assigned_to kosong tapi assigned_to_ids ada, coba ambil profil PIC pertama
      if (!profileInfo && Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.length > 0) {
        try {
          const { data: picData } = await supabase
            .from('profiles')
            .select('id, full_name, phone_number')
            .eq('id', t.assigned_to_ids[0])
            .maybeSingle();
          if (picData) profileInfo = picData;
        } catch {}
      }

      const token = globalFonnteToken || teamInfo?.wa_gateway_token;
      if (!token) {
        skippedCount++;
        results.push({
          taskId: t.id,
          title: t.title,
          assignee: profileInfo?.full_name || 'Tidak diketahui',
          phone: profileInfo?.phone_number || '',
          status: 'skipped',
          reason: 'Token API Fonnte belum dikonfigurasi di Panel Master Admin',
        });
        continue;
      }

      // Hitung selisih hari deadline
      const deadlineDate = new Date(t.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Kirim jika:
      // - Hari ini (diffDays === 0)
      // - Besok (diffDays === 1)
      // - Terlewat (diffDays < 0)
      // - Atau dipicu manual paksa (forceSend && diffDays <= 3)
      let deadlineLabel = '';
      if (diffDays === 0) {
        deadlineLabel = '🚨 *HARI INI!*';
      } else if (diffDays === 1) {
        deadlineLabel = '⏳ *BESOK*';
      } else if (diffDays < 0) {
        deadlineLabel = `⚠️ *TERLEWAT ${Math.abs(diffDays)} HARI*`;
      } else if (forceSend && diffDays <= 3) {
        deadlineLabel = `🗓️ *${diffDays} Hari Lagi*`;
      } else {
        // Belum mendekati batas pengingat
        skippedCount++;
        continue;
      }

      // Simpan ke teamRemindersMap
      if (teamInfo?.id) {
        if (!teamRemindersMap[teamInfo.id]) {
          teamRemindersMap[teamInfo.id] = {
            team: teamInfo,
            urgentTasks: [],
            sentPersonalCount: 0,
          };
        }
        teamRemindersMap[teamInfo.id].urgentTasks.push({
          title: t.title,
          deadlineLabel,
          assignee: profileInfo?.full_name || 'Anggota Tim',
        });
      }

      const phone = profileInfo?.phone_number;
      if (!phone || !phone.trim()) {
        skippedCount++;
        results.push({
          taskId: t.id,
          title: t.title,
          assignee: profileInfo?.full_name || 'Belum ditugaskan',
          phone: '',
          status: 'skipped',
          reason: 'Anggota belum mengisi nomor WhatsApp di profil',
        });
        continue;
      }

      const formattedDeadline = new Date(t.deadline).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const message = `🔔 *PENGINGAT DEADLINE TUGAS - TIMJUARA*
      
Halo *${profileInfo.full_name}*,
Mengingatkan tugas kamu pada tim *${teamInfo?.name || 'Tim Lomba'}*:

📋 *Tugas:* ${t.title}
⏰ *Status Batas Waktu:* ${deadlineLabel} (${formattedDeadline})
${t.task_link ? `🔗 *Link Tugas:* ${t.task_link}\n` : ''}${t.description ? `📝 *Catatan:* ${t.description.slice(0, 150)}\n` : ''}
Semangat menyelesaikan tugasnya ya! 💪
_Notifikasi otomatis aplikasi TimJuara_`;

      const normalizedPhone = normalizeIndonesianPhone(phone);

      try {
        const fonnteRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: normalizedPhone,
            message: message.trim(),
            countryCode: '62',
          }),
        });

        const fonnteData = await fonnteRes.json();

        if (fonnteRes.ok && fonnteData.status !== false) {
          sentCount++;
          if (teamInfo?.id && teamRemindersMap[teamInfo.id]) {
            teamRemindersMap[teamInfo.id].sentPersonalCount++;
          }
          results.push({
            taskId: t.id,
            title: t.title,
            assignee: profileInfo.full_name,
            phone: normalizedPhone,
            status: 'sent',
          });
        } else {
          failedCount++;
          results.push({
            taskId: t.id,
            title: t.title,
            assignee: profileInfo.full_name,
            phone: normalizedPhone,
            status: 'failed',
            reason: fonnteData.reason || fonnteData.message || 'Gagal mengirim lewat Fonnte',
          });
        }
      } catch (err: any) {
        failedCount++;
        results.push({
          taskId: t.id,
          title: t.title,
          assignee: profileInfo.full_name,
          phone: normalizedPhone,
          status: 'failed',
          reason: err.message,
        });
      }
    }

    // 2. Kirim Ringkasan ke Grup WhatsApp Tim & Buat Notifikasi Web untuk Ketua Tim
    let groupsNotified = 0;
    const leadersNotified: string[] = [];

    for (const [teamId, groupData] of Object.entries(teamRemindersMap)) {
      const { team, urgentTasks, sentPersonalCount } = groupData;
      if (urgentTasks.length === 0) continue;

      const tokenToUse = globalFonnteToken || team.wa_gateway_token;

      // a) Kirim Rekap ke Grup WhatsApp Tim (jika wa_group_id dihubungkan)
      if (team.wa_group_id && tokenToUse) {
        try {
          const taskItems = urgentTasks
            .slice(0, 5)
            .map((u, i) => `${i + 1}. *${u.title}* (${u.deadlineLabel})\n   👤 PIC: ${u.assignee}`)
            .join('\n\n');

          const groupMsg = `⏰ *PENGINGAT DEADLINE TUGAS - ${team.name.toUpperCase()}* 🚀\n\nHalo Rekan-rekan Tim! 👋\nPengingat otomatis jam 08:00 WIB untuk tugas yang mendekati batas waktu:\n\n${taskItems}\n\nYuk saling bantu dan selesaikan bersama di TimJuara:\n👉 https://timjuara.vercel.app/team/${team.username || ''}\n\nSemangat raih juara! 💪🔥`;

          const normalizedGroupId = normalizeIndonesianPhone(team.wa_group_id);
          const groupRes = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
              Authorization: tokenToUse,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              target: normalizedGroupId,
              message: groupMsg.trim(),
              countryCode: '62',
            }),
          });
          if (groupRes.ok) {
            groupsNotified++;
          }
        } catch (err) {
          console.warn('Gagal kirim rekap deadline ke grup WA:', err);
        }
      }

      // b) Buat Notifikasi di Web untuk KETUA TIM
      try {
        const { data: leaderMembers } = await supabase
          .from('team_members')
          .select('user_id, role')
          .eq('team_id', teamId)
          .in('role', ['ketua', 'leader']);

        if (leaderMembers && leaderMembers.length > 0) {
          const todayDateStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' });
          for (const lm of leaderMembers) {
            await supabase.from('notifications').insert({
              user_id: lm.user_id,
              team_id: teamId,
              title: '📢 Bot Deadline WhatsApp Terkirim',
              message: `Bot WhatsApp berhasil mengirimkan pengingat untuk ${urgentTasks.length} tugas yang mendekati deadline di tim "${team.name}" hari ini (${todayDateStr}).`,
              link: `/team/${team.username || ''}?tab=overview`,
              is_read: false,
            });
            leadersNotified.push(lm.user_id);
          }
        }
      } catch (err) {
        console.warn('Gagal membuat notifikasi web untuk ketua tim:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proses pengingat selesai. Terkirim: ${sentCount}, Dilewati: ${skippedCount}, Gagal: ${failedCount}, Grup Terkirim: ${groupsNotified}, Ketua Dinotifikasi: ${leadersNotified.length}`,
      sentCount,
      skippedCount,
      failedCount,
      groupsNotified,
      leadersNotifiedCount: leadersNotified.length,
      details: results,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Terjadi kesalahan sistem saat memproses pengingat.',
    }, { status: 500 });
  }
}
