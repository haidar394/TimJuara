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

    // Gunakan token yang dikirim dari tim atau fallback ke environment variable FONNTE_TOKEN
    const fonnteToken = token || process.env.FONNTE_TOKEN;

    if (!fonnteToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token API Fonnte belum dikonfigurasi. Masukkan token di Pengaturan Tim atau set FONNTE_TOKEN di .env.local.',
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
      return NextResponse.json(
        {
          success: false,
          error: result.reason || result.message || 'Gagal mengirim pesan melalui Fonnte.',
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
