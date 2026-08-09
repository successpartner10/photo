import React, { useEffect, useRef } from 'react';

interface MegaColumn {
  title: string;
  items: { label: string; shortcut?: string; icon?: string; onClick: () => void; disabled?: boolean; danger?: boolean }[];
}

interface Props {
  columns: MegaColumn[];
  onClose: () => void;
  width?: number;
}

export default function MegaMenu({ columns, onClose, width = 520 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h);
    window.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('keydown', k); };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, minWidth: width, maxWidth: 700,
      background: 'var(--elevated)', border: '1px solid var(--border)',
      borderRadius: '0 0 var(--radius) var(--radius)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      zIndex: 500, overflow: 'hidden',
      animation: 'fadeIn .12s ease-out',
      display: 'flex',
    }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{
          flex: 1, padding: '8px 0',
          borderRight: ci < columns.length - 1 ? '1px solid var(--border)' : 'none',
          minWidth: 160,
        }}>
          <div style={{
            padding: '6px 16px 8px', fontSize: 10, fontWeight: 800,
            letterSpacing: 1.4, color: 'var(--text3)', textTransform: 'uppercase',
          }}>
            {col.title}
          </div>
          {col.items.map(item => (
            <button key={item.label}
              onClick={() => { if (!item.disabled) { item.onClick(); onClose(); } }}
              disabled={item.disabled}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 16px', textAlign: 'left',
                fontSize: 13, fontWeight: 500,
                color: item.disabled ? 'var(--text3)' : item.danger ? 'var(--red)' : 'var(--text)',
                borderRadius: 0, cursor: item.disabled ? 'default' : 'pointer',
                transition: 'background .06s',
              }}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.danger ? 'var(--red)' : 'var(--text)'; }}>
              {item.icon && <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.shortcut && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{item.shortcut}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
