'use client';

import dynamic from 'next/dynamic';

// Render purely on the client to eliminate any SSR hydration mismatches from browser extensions (Bitwarden, etc.)
const TeamWorkspace = dynamic(() => import('@/components/TeamWorkspace'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="avatar-badge" style={{ margin: '0 auto 16px', width: 44, height: 44, animation: 'pulseGlow 1.5s infinite' }}>
          TJ
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Memuat ruang kerja tim...</p>
      </div>
    </div>
  ),
});

export default function TeamWorkspacePage() {
  return <TeamWorkspace />;
}
