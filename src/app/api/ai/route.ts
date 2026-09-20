import { NextResponse } from 'next/server';

declare global {
  var __GLOBAL_GEMINI_KEY__: string | undefined;
}

// Ambil Gemini API Key dari Memori / Environment / Database Supabase
async function getGeminiKey(overrideKey?: string): Promise<string> {
  if (overrideKey && typeof overrideKey === 'string' && overrideKey.trim().length > 10) {
    globalThis.__GLOBAL_GEMINI_KEY__ = overrideKey.trim();
    return overrideKey.trim();
  }

  if (globalThis.__GLOBAL_GEMINI_KEY__) {
    return globalThis.__GLOBAL_GEMINI_KEY__;
  }

  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }

  try {
    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'gemini_api_key')
        .maybeSingle();

      if (data?.value) {
        globalThis.__GLOBAL_GEMINI_KEY__ = data.value.trim();
        return data.value.trim();
      }
    }
  } catch (e) {
    console.error('Error reading gemini_api_key from system_settings:', e);
  }

  return '';
}

// Helper panggil Google Gemini REST API (gemini-2.0-flash / gemini-1.5-flash)
async function callGeminiApi(prompt: string, apiKey: string): Promise<string | null> {
  if (!apiKey) return null;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1200,
          },
        }),
      });

      if (!res.ok) {
        console.warn(`Gemini model ${model} returned status ${res.status}`);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch (err) {
      console.warn(`Error calling Gemini model ${model}:`, err);
    }
  }

  return null;
}

// Fallback Heuristik Cerdas untuk Standup Overview Seluruh Tim
function generateHeuristicStandup(teamName: string, tasks: any[], members: any[], userTeamsList?: any[]) {
  const total = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done');

  // PENTING: Hanya tugas yang BELUM SELESAI (status !== 'done') yang boleh dihitung sebagai butuh review/revisi
  const reviewTasks = tasks.filter((t) => {
    if (t.status === 'done') return false;
    const isMarkedReview = t.review_notes && t.review_notes.includes('[STATUS:REVIEW]');
    return t.status === 'review' || isMarkedReview || Boolean(t.review_notes?.toLowerCase().includes('revisi'));
  });

  const inProgress = tasks.filter((t) => t.status === 'in_progress' && t.status !== 'done');
  const todoTasks = tasks.filter((t) => t.status === 'todo' && t.status !== 'done');

  const now = new Date();
  const overdueOrNear = tasks.filter((t) => {
    if (t.status === 'done' || !t.deadline) return false;
    const diff = (new Date(t.deadline).getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff <= 2;
  });

  const completionRate = total > 0 ? Math.round((doneTasks.length / total) * 100) : 0;

  let health: 'healthy' | 'warning' | 'critical' = 'healthy';
  let healthLabel = 'Sangat Sehat';

  if (overdueOrNear.length > 2 || (total > 3 && completionRate < 25)) {
    health = 'critical';
    healthLabel = 'Kritis / Butuh Intervensi';
  } else if (overdueOrNear.length > 0 || reviewTasks.length > 0) {
    health = 'warning';
    healthLabel = 'Perlu Perhatian';
  }

  const bottlenecks: string[] = [];
  if (reviewTasks.length > 0) {
    const revTitles = reviewTasks.slice(0, 2).map((t) => `"${t.title}"${t.team_name ? ` (${t.team_name})` : ''}`).join(' dan ');
    bottlenecks.push(`${reviewTasks.length} tugas memerlukan pengecekan atau revisi dari Ketua Tim: ${revTitles}.`);
  }
  if (overdueOrNear.length > 0) {
    const titles = overdueOrNear.slice(0, 2).map((t) => `"${t.title}"${t.team_name ? ` (${t.team_name})` : ''}`).join(' dan ');
    bottlenecks.push(`Tugas ${titles} memiliki batas waktu kurang dari 48 jam atau melewati deadline.`);
  }
  if (todoTasks.length > inProgress.length && todoTasks.length > 2) {
    bottlenecks.push(`Ada ${todoTasks.length} tugas yang belum mulai dikerjakan rekan tim.`);
  }

  const highlights: string[] = [];
  const teamsCount = userTeamsList && userTeamsList.length > 0 ? userTeamsList.length : undefined;

  if (doneTasks.length > 0) {
    highlights.push(
      teamsCount
        ? `${doneTasks.length} dari ${total} tugas di ${teamsCount} tim berhasil diselesaikan (${completionRate}% selesai).`
        : `${doneTasks.length} dari ${total} tugas berhasil diselesaikan (${completionRate}% selesai).`
    );
    const recentDone = doneTasks.slice(0, 2).map((t) => `"${t.title}"${t.team_name ? ` (${t.team_name})` : ''}`).join(', ');
    highlights.push(`Tugas selesai terbaru: ${recentDone}.`);
  } else {
    highlights.push(
      teamsCount
        ? `Aktif memantau ${teamsCount} tim dengan total ${total} tugas terdaftar.`
        : `Workspace tim aktif dengan ${total} total tugas terdaftar.`
    );
  }

  let summary = '';
  if (userTeamsList && userTeamsList.length > 0) {
    const teamNames = userTeamsList.slice(0, 3).map((t: any) => t.name).join(', ') + (userTeamsList.length > 3 ? ` dan ${userTeamsList.length - 3} tim lainnya` : '');
    summary = `Secara keseluruhan di ${userTeamsList.length} tim yang Anda ikuti (${teamNames}), kondisi saat ini ${healthLabel} dengan progres penyelesaian ${completionRate}%. `;
  } else {
    summary = `Tim ${teamName} saat ini berada pada kondisi ${healthLabel} dengan progres penyelesaian ${completionRate}%. `;
  }

  if (overdueOrNear.length > 0) {
    summary += `Fokus paling mendesak hari ini adalah menyelesaikan ${overdueOrNear.length} tugas yang mendekati batas waktu agar tidak menghambat ritme tim.`;
  } else if (inProgress.length > 0) {
    summary += `Ada ${inProgress.length} tugas sedang aktif dikerjakan. Kolaborasi berjalan dengan tempo yang baik.`;
  } else {
    summary += `Seluruh anggota siap melaju ke fase berikutnya.`;
  }

  let advice = overdueOrNear.length > 0
    ? `Segera buka komunikasi di grup WhatsApp dan dampingi PIC tugas yang mendekati deadline hari ini.`
    : `Pertahankan momentum kerja tim dan pastikan hasil kerja diunggah ke folder materi tepat waktu.`;

  return {
    health,
    healthLabel,
    completionRate,
    summary,
    bottlenecks: bottlenecks.length > 0 ? bottlenecks : ['Semua tugas berjalan lancar tanpa hambatan atau bottleneck kritis.'],
    highlights,
    advice,
  };
}

// Fallback Heuristik Cerdas untuk Fokus Personal Anggota
function generateHeuristicFocus(userName: string, userTasks: any[], teamName: string) {
  const activeTasks = userTasks.filter((t) => t.status !== 'done');
  if (activeTasks.length === 0) {
    return {
      priorityTaskId: undefined,
      priorityTaskTitle: undefined,
      focusReason: `Hebat, ${userName}! Semua tugas yang ditugaskan kepadamu saat ini sudah selesai.`,
      actionAdvice: `Pantau tugas tim lainnya atau tawarkan bantuan kepada rekan satu tim di ${teamName}.`,
      urgency: 'normal',
    };
  }

  // Cari yang revisi dulu
  const revisiTask = activeTasks.find((t) => t.review_notes?.toLowerCase().includes('revisi'));
  if (revisiTask) {
    return {
      priorityTaskId: revisiTask.id,
      priorityTaskTitle: revisiTask.title,
      focusReason: `Tugas "${revisiTask.title}" memiliki catatan revisi dari Ketua yang perlu segera diperbaiki.`,
      actionAdvice: `Buka catatan revisi, perbaiki hasil kerja, lalu ajukan ulang agar cepat disetujui resmi.`,
      urgency: 'high',
    };
  }

  // Cari yang mendekati deadline
  const now = new Date();
  activeTasks.sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const topTask = activeTasks[0];
  const isUrgent = topTask.deadline && (new Date(topTask.deadline).getTime() - now.getTime()) / (1000 * 3600 * 24) <= 2;

  return {
    priorityTaskId: topTask.id,
    priorityTaskTitle: topTask.title,
    focusReason: isUrgent
      ? `Tugas "${topTask.title}" memiliki deadline paling dekat yang harus selesai lebih dulu.`
      : `Tugas "${topTask.title}" adalah prioritas utama dari daftar kerjamu saat ini.`,
    actionAdvice: topTask.status === 'in_progress'
      ? `Lanjutkan proses pengerjaan dan lampirkan link progres ke dokumen tugas.`
      : `Klik Mulai Kerjakan untuk memberi tahu rekan tim bahwa tugas ini sedang berjalan.`,
    urgency: isUrgent ? 'high' : 'medium',
  };
}

// Fallback Heuristik Cerdas untuk Pemecahan Tugas (Task Breakdown)
function generateHeuristicBreakdown(taskTitle: string, taskDesc?: string) {
  const titleLower = taskTitle.toLowerCase();

  // Pattern PKM / Proposal / Karya Tulis
  if (titleLower.includes('proposal') || titleLower.includes('pkm') || titleLower.includes('karya tulis') || titleLower.includes('bab')) {
    return {
      subtasks: [
        {
          title: `Riset Literatur & Penentuan Metodologi (${taskTitle})`,
          description: 'Cari minimal 5 referensi jurnal kredibel 5 tahun terakhir dan rumuskan diagram alir metode kerja.',
          estimatedDays: 2,
          suggestedRole: 'Hustler / Researcher',
        },
        {
          title: `Penyusunan Draft Bab Pendahuluan & Gagasan Utama`,
          description: 'Tuliskan latar belakang masalah, urgensi solusi, dan kebaruan ide dibandingkan kompetitor.',
          estimatedDays: 3,
          suggestedRole: 'Hacker / Penulis Utama',
        },
        {
          title: `Penyusunan Anggaran Biaya & Jadwal Kegiatan`,
          description: 'Rincikan kebutuhan biaya operasional secara realistis sesuai format panduan lomba.',
          estimatedDays: 2,
          suggestedRole: 'Hustler / Finansial',
        },
        {
          title: `Review Internal, Proofreading & Cek Format Panduan`,
          description: 'Periksa kesesuaian margin, font, daftar pustaka APA style, dan batasan halaman resmi lomba.',
          estimatedDays: 1,
          suggestedRole: 'Ketua Tim / Reviewer',
        },
      ],
      definitionOfDone: [
        'Format dokumen 100% patuh terhadap guidebook resmi lomba',
        'Semua sitasi memiliki daftar pustaka yang valid',
        'File PDF final sudah diunggah ke Google Drive tim',
      ],
    };
  }

  // Pattern UI/UX, Design, Figma, Prototype
  if (titleLower.includes('desain') || titleLower.includes('figma') || titleLower.includes('ui') || titleLower.includes('ux') || titleLower.includes('prototype')) {
    return {
      subtasks: [
        {
          title: `User Flow & Wireframe Kasar (Low-Fidelity)`,
          description: 'Rancang alur interaksi pengguna dari halaman awal hingga solusi utama tercapai.',
          estimatedDays: 2,
          suggestedRole: 'Hipster / UI-UX Designer',
        },
        {
          title: `Desain High-Fidelity & Design System (Komponen/Warna)`,
          description: 'Buat tampilan antarmuka visual pixel-perfect dengan palet warna dan tipografi konsisten.',
          estimatedDays: 3,
          suggestedRole: 'Hipster / UI Designer',
        },
        {
          title: `Prototyping Interaktif & Micro-interactions`,
          description: 'Hubungkan frame Figma agar dapat diklik dan didemokan di hadapan dewan juri.',
          estimatedDays: 2,
          suggestedRole: 'Hipster / Prototype Specialist',
        },
        {
          title: `Usability Testing Kilat & Finalisasi Asset Link`,
          description: 'Uji prototype ke 3 orang rekan tim dan pastikan link Figma public viewable.',
          estimatedDays: 1,
          suggestedRole: 'Seluruh Tim',
        },
      ],
      definitionOfDone: [
        'Link Figma siap demo dengan tombol interaktif yang responsif',
        'Tidak ada frame yang kosong atau teks placeholder yang tertinggal',
        'Desain sudah disetujui Ketua Tim',
      ],
    };
  }

  // Pattern Video Teaser / Pitch Deck / Presentasi
  if (titleLower.includes('video') || titleLower.includes('pitch') || titleLower.includes('slide') || titleLower.includes('presentasi')) {
    return {
      subtasks: [
        {
          title: `Penyusunan Storyboard & Naskah Narasi (Script)`,
          description: 'Susun struktur 10 slide pitch deck standar kompetisi (Hook, Problem, Solution, Market, Demo).',
          estimatedDays: 2,
          suggestedRole: 'Hustler / Storyteller',
        },
        {
          title: `Visual Slide Design & Infografis Data`,
          description: 'Buat slide presentasi yang memukau secara visual, minim teks tebal, dan kaya ilustrasi.',
          estimatedDays: 2,
          suggestedRole: 'Hipster / Designer',
        },
        {
          title: `Simulasi & Latihan Pitching (Dry Run 5 Menit)`,
          description: 'Latihan presentasi tepat waktu dengan simulasi pertanyaan juri.',
          estimatedDays: 1,
          suggestedRole: 'Presenter & Seluruh Tim',
        },
      ],
      definitionOfDone: [
        'Durasi presentasi pas di bawah batas waktu panitia',
        'File PDF slide dan link video cadangan sudah siap di cloud',
      ],
    };
  }

  // Default General Task Breakdown
  return {
    subtasks: [
      {
        title: `Tahap 1: Pengumpulan Bahan & Perencanaan (${taskTitle})`,
        description: 'Kumpulkan referensi, template, dan batasan teknis yang diperlukan untuk tugas ini.',
        estimatedDays: 1,
        suggestedRole: 'PIC Tugas',
      },
      {
        title: `Tahap 2: Eksekusi Pengerjaan Utama (${taskTitle})`,
        description: 'Lakukan pengerjaan inti sesuai target dan hasil yang diharapkan oleh tim.',
        estimatedDays: 3,
        suggestedRole: 'PIC Tugas',
      },
      {
        title: `Tahap 3: Verifikasi Kualitas & Pengajuan Review Ketua`,
        description: 'Periksa kelengkapan, lampirkan link hasil kerja, dan ajukan review ke Ketua Tim.',
        estimatedDays: 1,
        suggestedRole: 'PIC Tugas & Ketua Tim',
      },
    ],
    definitionOfDone: [
      'Hasil kerja terlampir dalam bentuk link dokumen/drive yang bisa diakses',
      'Sudah diverifikasi dan disetujui selesai oleh Ketua Tim',
    ],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, apiKey, teamName, tasks, members, userName, userTasks, taskTitle, taskDesc } = body;

    const geminiKey = await getGeminiKey(apiKey);

    // ==========================================
    // ACTION 0: TEST CONNECTION DARI MASTER ADMIN
    // ==========================================
    if (action === 'test_connection') {
      if (!geminiKey) {
        return NextResponse.json({
          success: false,
          error: 'API Key Google Gemini belum diisi.',
        });
      }

      const testRes = await callGeminiApi(
        'Jawablah dengan 1 kalimat singkat Bahasa Indonesia: "Koneksi Google Gemini AI di TimJuara berhasil aktif."',
        geminiKey
      );

      if (testRes) {
        return NextResponse.json({
          success: true,
          message: testRes,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Gagal terhubung ke Google Gemini. Pastikan API Key valid dari Google AI Studio.',
        });
      }
    }

    // ==========================================
    // ACTION 1: OVERVIEW STANDUP & RISK DIGEST
    // ==========================================
    if (action === 'overview_standup') {
      const taskList = Array.isArray(tasks) ? tasks : [];
      const memberList = Array.isArray(members) ? members : [];
      const teamsList = Array.isArray(body.userTeams) ? body.userTeams : [];
      const currentTeam = teamName || (teamsList.length > 0 ? `Seluruh Tim (${teamsList.length} Tim)` : 'Seluruh Tim');

      // Coba panggil Gemini jika key tersedia
      if (geminiKey) {
        const teamsContext = teamsList.length > 0
          ? `Pengguna saat ini tergabung dalam ${teamsList.length} tim berikut: ${teamsList.map((t: any) => t.name).join(', ')}.\n`
          : `Nama Tim / Workspace: "${currentTeam}"\n`;

        const prompt = `
Kamu adalah Asisten AI TimJuara, platform manajemen kerja tim lomba dan kelompok mahasiswa.
Analisis data progres kerja dari SELURUH TIM yang diikuti oleh akun pengguna ini:
${teamsContext}Total Tugas Lintas Tim (${taskList.length} tugas):
${JSON.stringify(
  taskList.map((t) => ({
    title: t.title,
    team: t.team_name || currentTeam,
    status: t.status,
    deadline: t.deadline,
    isRevision: Boolean(t.review_notes?.toLowerCase().includes('revisi')) && t.status !== 'done',
  })).slice(0, 35),
  null,
  2
)}

Instruksi Analisis PENTING:
1. Ringkasan ("summary") WAJIB mencakup gambaran umum dari SELURUH TIM yang diikuti oleh pengguna (misal: "Secara keseluruhan di ${teamsList.length || 'seluruh'} tim yang Anda ikuti..."), bukan hanya satu tim.
2. Tugas yang berstatus 'done' berarti SUDAH SELESAI dan TIDAK BOLEH dianggap sebagai hambatan ataupun butuh revisi.
3. Hanya anggap tugas sebagai hambatan (bottleneck) jika statusnya 'review' (menunggu acc ketua) atau mendekati/melewati batas waktu (dan statusnya belum 'done').
4. Buat bahasa Indonesia yang elegan, memotivasi, dan jelas.

Berikan output HANYA DALAM FORMAT JSON VALID tanpa markdown code block, dengan struktur persis berikut:
{
  "health": "healthy" | "warning" | "critical",
  "healthLabel": "Sangat Sehat" | "Perlu Perhatian" | "Kritis",
  "completionRate": 75,
  "summary": "Ringkasan progres 2-3 kalimat berbahasa Indonesia tentang seluruh tim yang diikuti pengguna yang memotivasi dan jelas.",
  "bottlenecks": ["Poin hambatan 1", "Poin hambatan 2"],
  "highlights": ["Pencapaian 1", "Pencapaian 2"],
  "advice": "Satu saran praktis dan terpenting untuk koordinasi seluruh tim hari ini."
}
        `.trim();

        const aiResponse = await callGeminiApi(prompt, geminiKey);
        if (aiResponse) {
          try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json({ success: true, source: 'gemini', data: parsed });
          } catch (e) {
            console.warn('Gagal parse JSON Gemini standup, beralih ke heuristik:', e);
          }
        }
      }

      // Fallback Cerdas
      const heuristicData = generateHeuristicStandup(currentTeam, taskList, memberList, teamsList);
      return NextResponse.json({ success: true, source: 'heuristic', data: heuristicData });
    }

    // ==========================================
    // ACTION 2: FOKUS KAMU HARI INI (PERSONAL ACTION)
    // ==========================================
    if (action === 'personal_focus') {
      const uTasks = Array.isArray(userTasks) ? userTasks : [];
      const name = userName || 'Rekan Tim';
      const currentTeam = teamName || 'TimJuara';

      if (geminiKey && uTasks.length > 0) {
        const prompt = `
Sebagai Asisten AI TimJuara, tentukan 1 tugas paling prioritas yang harus dikerjakan hari ini untuk anggota tim "${name}" di tim "${currentTeam}".
Daftar Tugas Aktif:
${JSON.stringify(
  uTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    deadline: t.deadline,
    isRevision: Boolean(t.review_notes?.toLowerCase().includes('revisi')),
  })),
  null,
  2
)}

Berikan output HANYA DALAM FORMAT JSON VALID tanpa markdown code block, dengan format:
{
  "priorityTaskId": "id tugas",
  "priorityTaskTitle": "judul tugas",
  "focusReason": "Alasan singkat 1 kalimat mengapa ini paling penting hari ini",
  "actionAdvice": "Langkah konkret apa yang harus dilakukan",
  "urgency": "high" | "medium" | "normal"
}
        `.trim();

        const aiResponse = await callGeminiApi(prompt, geminiKey);
        if (aiResponse) {
          try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json({ success: true, source: 'gemini', data: parsed });
          } catch (e) {
            console.warn('Gagal parse JSON Gemini personal focus, beralih ke heuristik:', e);
          }
        }
      }

      const heuristicFocus = generateHeuristicFocus(name, uTasks, currentTeam);
      return NextResponse.json({ success: true, source: 'heuristic', data: heuristicFocus });
    }

    // ==========================================
    // ACTION 3: AI TASK BREAKDOWN (PECAH TUGAS)
    // ==========================================
    if (action === 'breakdown_tasks') {
      const title = taskTitle || '';
      const desc = taskDesc || '';

      if (!title.trim()) {
        return NextResponse.json({ success: false, error: 'Judul tugas wajib diisi untuk dipecah.' }, { status: 400 });
      }

      if (geminiKey) {
        const prompt = `
Sebagai Lead Project Manager Tim Lomba, pecah tugas besar berikut menjadi 3 sampai 4 subtask konkret dan berurutan:
Judul Tugas Besar: "${title}"
Catatan Tambahan: "${desc}"
Konteks: Tim lomba & kerja kelompok mahasiswa/pelajar Indonesia.

Keluarkan HANYA DALAM FORMAT JSON VALID tanpa markdown:
{
  "subtasks": [
    {
      "title": "Judul subtask konkret dan jelas",
      "description": "Deskripsi singkat cara pengerjaannya",
      "estimatedDays": 2,
      "suggestedRole": "Peran PIC yang cocok (contoh: Hipster / Designer, Hacker / Developer, Hustler / Writer)"
    }
  ],
  "definitionOfDone": [
    "Syarat 1 tugas dianggap selesai",
    "Syarat 2 tugas dianggap selesai"
  ]
}
        `.trim();

        const aiResponse = await callGeminiApi(prompt, geminiKey);
        if (aiResponse) {
          try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return NextResponse.json({ success: true, source: 'gemini', data: parsed });
          } catch (e) {
            console.warn('Gagal parse JSON Gemini task breakdown, beralih ke heuristik:', e);
          }
        }
      }

      const heuristicBreakdown = generateHeuristicBreakdown(title, desc);
      return NextResponse.json({ success: true, source: 'heuristic', data: heuristicBreakdown });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Terjadi kesalahan sistem AI.' }, { status: 500 });
  }
}
