import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, fullName, email, phoneNumber, password } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Prioritas 1: Jika Service Role Key tersedia, gunakan Supabase Auth Admin API
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const updatePayload: any = {};
      if (email && email.trim()) updatePayload.email = email.trim().toLowerCase();
      if (password && password.trim()) updatePayload.password = password.trim();
      if (fullName && fullName.trim()) {
        updatePayload.user_metadata = { full_name: fullName.trim() };
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
        if (authErr) {
          console.warn('Supabase Admin Auth update error:', authErr.message);
        }
      }

      // Update profiles
      const profileUpdates: any = {};
      if (fullName && fullName.trim()) profileUpdates.full_name = fullName.trim();
      if (email && email.trim()) profileUpdates.email = email.trim().toLowerCase();
      if (phoneNumber !== undefined) profileUpdates.phone_number = phoneNumber.trim();

      if (Object.keys(profileUpdates).length > 0) {
        await supabaseAdmin.from('profiles').update(profileUpdates).eq('id', userId);
      }

      return NextResponse.json({ success: true, message: 'Data pengguna berhasil diperbarui.' });
    }

    // Prioritas 2: Gunakan RPC Function via Client Supabase
    if (supabaseUrl && anonKey) {
      const supabase = createClient(supabaseUrl, anonKey);

      // Selalu perbarui profile terlebih dahulu untuk field yang dikirim
      const profileUpdates: any = {};
      if (fullName !== undefined && fullName.trim()) profileUpdates.full_name = fullName.trim();
      if (email !== undefined && email.trim()) profileUpdates.email = email.trim().toLowerCase();
      if (phoneNumber !== undefined) profileUpdates.phone_number = phoneNumber.trim();

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from('profiles').update(profileUpdates).eq('id', userId);
      }

      // Jalankan RPC jika ada email atau password yang perlu diperbarui di auth.users
      if ((email && email.trim()) || (password && password.trim())) {
        await supabase.rpc('admin_update_user', {
          target_user_id: userId,
          new_full_name: fullName || '',
          new_email: email || '',
          new_phone: phoneNumber || '',
          new_password: password || null,
        });
      }

      return NextResponse.json({ success: true, message: 'Data berhasil diperbarui.' });
    }

    return NextResponse.json({ success: true, message: 'Updated in local/demo environment.' });
  } catch (err: any) {
    console.error('Error in /api/admin/users/update:', err);
    return NextResponse.json({ success: false, error: err.message || 'Gagal memproses pembaruan pengguna.' }, { status: 500 });
  }
}
