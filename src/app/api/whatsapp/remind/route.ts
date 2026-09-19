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
        id, team_id, title, description, task_link, assigned_to, deadline, status,
        profiles!tasks_assigned_to_fkey (id, full_name, phone_number),
        teams!tasks_team_id_fkey (id, name, wa_gateway_token, wa_notifications_enabled)
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

    for (const t of tasks) {
      const teamInfo: any = t.teams;
      const profileInfo: any = t.profiles;

      // Cek apakah notifikasi di tim ini diaktifkan
      if (teamInfo && teamInfo.wa_notifications_enabled === false) {
        skippedCount++;
        results.push({
          taskId: t.id,
          title: t.title,
          assignee: profileInfo?.full_name || 'Tidak diketahui',
          phone: profileInfo?.phone_number || '',
          status: 'skipped',
          reason: 'Notifikasi WA dinonaktifkan oleh pengaturan tim',
        });
        continue;
      }

      const token = teamInfo?.wa_gateway_token || process.env.FONNTE_TOKEN;
      if (!token) {
        skippedCount++;
        results.push({
          taskId: t.id,
          title: t.title,
          assignee: profileInfo?.full_name || 'Tidak diketahui',
          phone: profileInfo?.phone_number || '',
          status: 'skipped',
          reason: 'Token API Fonnte belum dipasang di tim ini',
        });
        continue;
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

    return NextResponse.json({
      success: true,
      message: `Proses pengingat selesai. Terkirim: ${sentCount}, Dilewati: ${skippedCount}, Gagal: ${failedCount}`,
      sentCount,
      skippedCount,
      failedCount,
      details: results,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Terjadi kesalahan sistem saat memproses pengingat.',
    }, { status: 500 });
  }
}
