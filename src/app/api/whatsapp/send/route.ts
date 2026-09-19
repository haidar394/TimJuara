import { NextResponse } from 'next/server';

// Fungsi normalisasi nomor telepon Indonesia ke format 628...
export function normalizeIndonesianPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

declare global {
  var __GLOBAL_FONNTE_TOKEN__: string | undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target, message, token } = body;

    if (!target || !message) {
      return NextResponse.json(
        { success: false, error: 'Target nomor WhatsApp dan pesan wajib diisi.' },
        { status: 400 }
      );
    }

    // Jika token valid dikirim dari client (misal Admin test atau dashboard), simpan ke memory cache
    if (token && typeof token === 'string' && token.trim().length > 5) {
      globalThis.__GLOBAL_FONNTE_TOKEN__ = token.trim();
    }

    // Gunakan token yang dikirim, atau dari cache memori, atau dari database/env
    let fonnteToken = token || globalThis.__GLOBAL_FONNTE_TOKEN__;

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
            // Fallback: cek jika tersimpan di salah satu record teams
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
        console.error('Error fetching global token from system_settings/teams:', e);
      }
    }

    if (!fonnteToken) {
      fonnteToken = process.env.FONNTE_TOKEN;
    }

    if (!fonnteToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token API Fonnte belum dikonfigurasi. Masukkan token di Panel Master Admin (/admin).',
        },
        { status: 400 }
      );
    }

    const normalizedTarget = normalizeIndonesianPhone(target);

    // Kirim request ke Fonnte API
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: fonnteToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: normalizedTarget,
        message: message,
        countryCode: '62',
      }),
    });

    const result = await response.json();

    if (!response.ok || result.status === false) {
      const rawReason = (result.reason || result.message || '').toLowerCase();
      let friendlyError = result.reason || result.message || 'Gagal mengirim pesan melalui Fonnte.';

      if (
        rawReason.includes('device disconnected') ||
        rawReason.includes('device not connected') ||
        rawReason.includes('not ready') ||
        rawReason.includes('disconnected')
      ) {
        friendlyError = 'WhatsApp di Fonnte terputus (Device Disconnected). Silakan buka fonnte.com -> Menu Device -> Connect/Scan QR ulang.';
      } else if (
        rawReason.includes('invalid token') ||
        rawReason.includes('token not found') ||
        rawReason.includes('unauthorized')
      ) {
        friendlyError = 'Token Fonnte tidak valid. Periksa kembali Device Token di Panel Master Admin (/admin) atau di fonnte.com.';
      } else if (
        rawReason.includes('quota') ||
        rawReason.includes('limit') ||
        rawReason.includes('expired') ||
        rawReason.includes('package')
      ) {
        friendlyError = 'Kuota pesan atau masa aktif paket Fonnte telah habis. Cek status paket/device di fonnte.com.';
      }

      return NextResponse.json(
        {
          success: false,
          error: friendlyError,
          raw: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan WhatsApp berhasil dikirim!',
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem saat mengirim WA.' },
      { status: 500 }
    );
  }
}
