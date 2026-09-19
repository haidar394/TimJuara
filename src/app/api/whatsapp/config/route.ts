import { NextResponse } from 'next/server';

declare global {
  var __GLOBAL_FONNTE_TOKEN__: string | undefined;
}

export async function GET() {
  try {
    let token = globalThis.__GLOBAL_FONNTE_TOKEN__ || process.env.FONNTE_TOKEN || '';

    if (!token) {
      try {
        const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'fonnte_token')
            .maybeSingle();
          if (data?.value) {
            token = data.value;
            globalThis.__GLOBAL_FONNTE_TOKEN__ = token;
          } else {
            const { data: teamWithToken } = await supabase
              .from('teams')
              .select('wa_gateway_token')
              .not('wa_gateway_token', 'is', null)
              .neq('wa_gateway_token', '')
              .limit(1)
              .maybeSingle();
            if (teamWithToken?.wa_gateway_token) {
              token = teamWithToken.wa_gateway_token;
              globalThis.__GLOBAL_FONNTE_TOKEN__ = token;
            }
          }
        }
      } catch (e) {
        console.error('Error in GET /api/whatsapp/config:', e);
      }
    }

    return NextResponse.json({
      configured: Boolean(token),
      token: token || null,
    });
  } catch (err: any) {
    return NextResponse.json({ configured: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Token wajib diisi.' }, { status: 400 });
    }

    const cleanToken = token.trim();
    globalThis.__GLOBAL_FONNTE_TOKEN__ = cleanToken;

    // Coba simpan ke Supabase jika tersedia
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
      if (isSupabaseConfigured && supabase) {
        await supabase.from('system_settings').upsert([
          { key: 'fonnte_token', value: cleanToken, updated_at: new Date().toISOString() },
          { key: 'wa_notifications_enabled', value: 'true', updated_at: new Date().toISOString() },
        ]);

        await supabase
          .from('teams')
          .update({ wa_gateway_token: cleanToken, wa_notifications_enabled: true })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }
    } catch (e) {
      console.warn('Could not sync to Supabase database tables:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Token Fonnte berhasil disimpan di memori dan server.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
