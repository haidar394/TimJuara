import { NextResponse } from 'next/server';

declare global {
  var __GLOBAL_FONNTE_TOKEN__: string | undefined;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenQuery = searchParams.get('token');
    const refreshQuery = searchParams.get('refresh') === 'true';

    return await fetchFonnteGroups(tokenQuery || undefined, refreshQuery);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Gagal memuat grup WhatsApp.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, refresh } = body;

    return await fetchFonnteGroups(token, Boolean(refresh));
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Gagal memuat grup WhatsApp.' }, { status: 500 });
  }
}

async function fetchFonnteGroups(customToken?: string, shouldRefresh?: boolean) {
  let fonnteToken = (customToken || '').trim() || globalThis.__GLOBAL_FONNTE_TOKEN__;

  if (!fonnteToken) {
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'fonnte_token')
          .maybeSingle();
        if (data?.value) {
          fonnteToken = data.value;
        } else {
          const { data: teamWithToken } = await supabase
            .from('teams')
            .select('wa_gateway_token')
            .not('wa_gateway_token', 'is', null)
            .neq('wa_gateway_token', '')
            .limit(1)
            .maybeSingle();
          if (teamWithToken?.wa_gateway_token) {
            fonnteToken = teamWithToken.wa_gateway_token;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching global token for groups:', e);
    }
  }

  if (!fonnteToken) {
    fonnteToken = process.env.FONNTE_TOKEN;
  }

  if (!fonnteToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'Token WhatsApp gateway belum dikonfigurasi. Silakan hubungkan WhatsApp gateway terlebih dahulu.',
      },
      { status: 400 }
    );
  }

  // Jika diminta sinkronisasi ulang dengan WhatsApp
  if (shouldRefresh) {
    try {
      await fetch('https://api.fonnte.com/fetch-group', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
        },
      });
    } catch (e) {
      console.warn('Fetch group trigger notice:', e);
    }
  }

  // Ambil daftar grup WhatsApp yang diikuti device
  const res = await fetch('https://api.fonnte.com/get-whatsapp-group', {
    method: 'POST',
    headers: {
      Authorization: fonnteToken,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil grup dari server Fonnte.' },
      { status: 500 }
    );
  }

  if (data.status === false) {
    const reason = (data.reason || data.message || '').toLowerCase();
    let friendly = data.reason || data.message || 'Gagal memuat grup.';
    if (reason.includes('device disconnected') || reason.includes('disconnected')) {
      friendly = 'Device WhatsApp terputus. Silakan hubungkan kembali device di dashboard Fonnte.';
    } else if (reason.includes('invalid token') || reason.includes('unauthorized')) {
      friendly = 'Token Fonnte tidak valid. Periksa kembali token API Fonnte.';
    }
    return NextResponse.json({ success: false, error: friendly, raw: data }, { status: 400 });
  }

  // Format array grup
  let rawList: any[] = [];
  if (Array.isArray(data.data)) {
    rawList = data.data;
  } else if (Array.isArray(data)) {
    rawList = data;
  } else if (data.data && typeof data.data === 'object') {
    rawList = Object.values(data.data);
  }

  const groups = rawList
    .map((g: any) => {
      const id = g.id || g.jid || g.group_id || '';
      const name = g.name || g.subject || g.title || id;
      return { id: String(id), name: String(name) };
    })
    .filter((g) => Boolean(g.id));

  return NextResponse.json({
    success: true,
    groups,
    total: groups.length,
  });
}
