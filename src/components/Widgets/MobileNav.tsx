import React from 'react';

interface Tab { id: string; label: string; }
interface Props { tabs: Tab[]; activeTab: string | null; onSelect: (id: any) => void; onFileMenu: () => void; }

export default function MobileNav({ tabs, activeTab, onSelect, onFileMenu }: Props) {
  return (
    <div style={{ height: 54, background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', padding: '0 4px', gap: 2, flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 90 }}>
      <button onClick={onFileMenu} style={{ flex: 1, height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, background: 'transparent', border: 'none', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800, letterSpacing: 1.5 }}>FILE</span>
      </button>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onSelect(tab.id)} style={{
          flex: 1, height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          background: activeTab === tab.id ? 'var(--bg-overlay)' : 'transparent', border: 'none',
          borderRadius: 'var(--radius-sm)', color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
          fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1.2, transition: 'all 0.12s',
        }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
