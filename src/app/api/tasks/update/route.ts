import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, updates } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'Task ID wajib disertakan.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || (!supabaseServiceKey && !anonKey)) {
      return NextResponse.json({ success: false, error: 'Koneksi Supabase belum terkonfigurasi.' }, { status: 500 });
    }

    // Gunakan Service Role Client jika tersedia (bypass RLS), jika tidak gunakan anon client
    const client = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
      : createClient(supabaseUrl, anonKey);

    const cleanUpdates: any = { ...updates };
    delete cleanUpdates.id;
    delete cleanUpdates.profiles;
    delete cleanUpdates.assignee_profile;
    delete cleanUpdates.assignee_profiles;
    delete cleanUpdates.comments_count;

    if ('assigned_to_ids' in cleanUpdates && Array.isArray(cleanUpdates.assigned_to_ids)) {
      const ids = cleanUpdates.assigned_to_ids.filter(Boolean);
      cleanUpdates.assigned_to_ids = ids;
      cleanUpdates.assigned_to = ids[0] || null;
    } else if ('assigned_to' in cleanUpdates) {
      cleanUpdates.assigned_to = cleanUpdates.assigned_to && cleanUpdates.assigned_to.trim() ? cleanUpdates.assigned_to.trim() : null;
      if (cleanUpdates.assigned_to) {
        cleanUpdates.assigned_to_ids = [cleanUpdates.assigned_to];
      } else {
        cleanUpdates.assigned_to_ids = [];
      }
    }

    if ('deadline' in cleanUpdates) {
      cleanUpdates.deadline = cleanUpdates.deadline && cleanUpdates.deadline.trim() ? cleanUpdates.deadline.trim() : null;
    }
    if ('completed_by' in cleanUpdates) {
      cleanUpdates.completed_by = cleanUpdates.completed_by && cleanUpdates.completed_by.trim() ? cleanUpdates.completed_by.trim() : null;
    }
    if ('task_link' in cleanUpdates) {
      cleanUpdates.task_link = cleanUpdates.task_link?.trim() || '';
    }

    // 1. Coba update langsung
    let { data, error } = await client
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', taskId)
      .select();

    // 2. Jika error karena kolom yang belum ada di schema atau foreign key
    if (error) {
      console.warn('API updateTask error, mencoba fallback kolom:', error.message);
      const fallbackUpdates = { ...cleanUpdates };

      if (error.message.includes('assigned_to_ids')) delete fallbackUpdates.assigned_to_ids;
      if (error.message.includes('review_notes')) delete fallbackUpdates.review_notes;
      if (error.message.includes('task_link')) delete fallbackUpdates.task_link;
      if (error.message.includes('completed_by') || error.message.toLowerCase().includes('foreign key')) delete fallbackUpdates.completed_by;

      const retryRes = await client.from('tasks').update(fallbackUpdates).eq('id', taskId).select();
      data = retryRes.data;
      error = retryRes.error;

      // 3. Penanganan Khusus Jika Database Menolak status 'review' (Check Constraint)
      if (error && (error.message.includes('check constraint') || error.message.includes('tasks_status_check')) && fallbackUpdates.status === 'review') {
        console.warn('Database memiliki CHECK constraint tanpa "review". Menggunakan bridge status [STATUS:REVIEW]...');
        const bridgeUpdates = {
          ...fallbackUpdates,
          status: 'in_progress',
          review_notes: `[STATUS:REVIEW] ${fallbackUpdates.review_notes || ''}`.trim(),
        };
        const bridgeRes = await client.from('tasks').update(bridgeUpdates).eq('id', taskId).select();
        data = bridgeRes.data;
        error = bridgeRes.error;
      }
    }

    if (error) {
      console.error('Server updateTask final error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data?.[0] || null });
  } catch (err: any) {
    console.error('Server updateTask exception:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
