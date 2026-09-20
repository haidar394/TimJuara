import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || (!supabaseServiceKey && !anonKey)) {
    return null;
  }

  return supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : createClient(supabaseUrl, anonKey);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ success: false, error: 'teamId wajib disertakan.' }, { status: 400 });
    }

    const client = getSupabaseAdmin();
    if (!client) {
      return NextResponse.json({ success: false, error: 'Supabase belum terkonfigurasi.' }, { status: 500 });
    }

    let wa_group_id: string | null = null;
    let wa_group_name: string | null = null;
    let avatar_url: string | null = null;

    // 1. Coba ambil dari tabel teams
    const { data: team } = await client
      .from('teams')
      .select('wa_group_id, wa_group_name, avatar_url')
      .eq('id', teamId)
      .maybeSingle();

    if (team) {
      if (team.wa_group_id) wa_group_id = team.wa_group_id;
      if (team.wa_group_name) wa_group_name = team.wa_group_name;
      if (team.avatar_url) avatar_url = team.avatar_url;
    }

    // 2. Ambil dari fallback system_settings jika ada nilai yang belum terisi
    const { data: sysSettings } = await client
      .from('system_settings')
      .select('key, value')
      .in('key', [
        `team_wa_group_${teamId}`,
        `team_wa_group_name_${teamId}`,
        `team_avatar_${teamId}`,
      ]);

    if (sysSettings && sysSettings.length > 0) {
      for (const item of sysSettings) {
        if (item.key === `team_wa_group_${teamId}` && !wa_group_id && item.value) {
          wa_group_id = item.value;
        }
        if (item.key === `team_wa_group_name_${teamId}` && !wa_group_name && item.value) {
          wa_group_name = item.value;
        }
        if (item.key === `team_avatar_${teamId}` && !avatar_url && item.value) {
          avatar_url = item.value;
        }
      }
    }

    return NextResponse.json({
      success: true,
      settings: {
        wa_group_id,
        wa_group_name,
        avatar_url,
      },
    });
  } catch (err: any) {
    console.error('Error GET /api/teams/settings:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      teamId,
      wa_group_id,
      wa_group_name,
      avatar_url,
      wa_gateway_token,
      wa_notifications_enabled,
    } = body;

    if (!teamId) {
      return NextResponse.json({ success: false, error: 'teamId wajib disertakan.' }, { status: 400 });
    }

    const client = getSupabaseAdmin();
    if (!client) {
      return NextResponse.json({ success: false, error: 'Supabase belum terkonfigurasi.' }, { status: 500 });
    }

    const cleanGroupId = typeof wa_group_id === 'string' ? wa_group_id.trim() : wa_group_id;
    const cleanGroupName = typeof wa_group_name === 'string' ? wa_group_name.trim() : wa_group_name;
    const cleanAvatar = typeof avatar_url === 'string' ? avatar_url.trim() : avatar_url;

    // 1. Update tabel public.teams
    const teamUpdates: Record<string, any> = {};
    if (cleanGroupId !== undefined) teamUpdates.wa_group_id = cleanGroupId || null;
    if (cleanGroupName !== undefined) teamUpdates.wa_group_name = cleanGroupName || null;
    if (cleanAvatar !== undefined) teamUpdates.avatar_url = cleanAvatar || null;
    if (wa_gateway_token !== undefined) teamUpdates.wa_gateway_token = wa_gateway_token || null;
    if (wa_notifications_enabled !== undefined) teamUpdates.wa_notifications_enabled = Boolean(wa_notifications_enabled);

    if (Object.keys(teamUpdates).length > 0) {
      const { error: teamErr } = await client
        .from('teams')
        .update(teamUpdates)
        .eq('id', teamId);

      if (teamErr) {
        console.warn('API teams update warning (kolom mungkin belum dibuat di teams):', teamErr.message);
      }
    }

    // 2. Backup permanen ke tabel system_settings (Anti-Gagal: Selalu tersedia di cloud lintas device)
    const settingsToUpsert: Array<{ key: string; value: string; updated_at: string }> = [];
    const nowIso = new Date().toISOString();

    if (cleanGroupId !== undefined) {
      settingsToUpsert.push({
        key: `team_wa_group_${teamId}`,
        value: cleanGroupId || '',
        updated_at: nowIso,
      });
    }

    if (cleanGroupName !== undefined) {
      settingsToUpsert.push({
        key: `team_wa_group_name_${teamId}`,
        value: cleanGroupName || '',
        updated_at: nowIso,
      });
    }

    if (cleanAvatar !== undefined) {
      settingsToUpsert.push({
        key: `team_avatar_${teamId}`,
        value: cleanAvatar || '',
        updated_at: nowIso,
      });
    }

    if (settingsToUpsert.length > 0) {
      const { error: sysErr } = await client
        .from('system_settings')
        .upsert(settingsToUpsert, { onConflict: 'key' });

      if (sysErr) {
        console.warn('Fallback system_settings upsert error:', sysErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan tim berhasil disimpan secara permanen di database sentral.',
      data: {
        wa_group_id: cleanGroupId,
        wa_group_name: cleanGroupName,
        avatar_url: cleanAvatar,
      },
    });
  } catch (err: any) {
    console.error('Error POST /api/teams/settings:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
