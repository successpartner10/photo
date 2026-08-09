import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string | null;
  onSelect: (id: any) => void;
  onFileMenu: () => void;
}

export default function MobileNav({ tabs, activeTab, onSelect, onFileMenu }: Props) {
  return (
    <div style={{
      height: 52,
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      gap: 2,
      flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 90,
    }}>
      <button onClick={onFileMenu}
        style={{
          flex: 1, height: 44, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', fontSize: 18,
          borderRadius: 'var(--radius-sm)',
        }}>
        ☰
        <span style={{ fontSize: 9 }}>File</span>
      </button>
      {tabs.map(tab => (
        <button key={tab.id}
          onClick={() => onSelect(tab.id)}
          style={{
            flex: 1, height: 44, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            background: activeTab === tab.id ? 'var(--bg-overlay)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
            fontSize: 18,
            transition: 'all 0.12s var(--ease-out)',
          }}>
          {tab.icon}
          <span style={{ fontSize: 9 }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
