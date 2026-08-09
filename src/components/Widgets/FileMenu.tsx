import React, { useEffect, useRef } from 'react';

interface Props {
  onClose: () => void; onNew: () => void; onOpen: () => void;
  onSave: () => void; onSaveAs: () => void; onExportPNG: () => void;
  onShare: () => void; canUndo: boolean; canRedo: boolean;
  onUndo: () => void; onRedo: () => void;
}

export default function FileMenu({ onClose, onNew, onOpen, onSave, onSaveAs, onExportPNG, onShare, canUndo, canRedo, onUndo, onRedo }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h);
    window.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('keydown', k); };
  }, [onClose]);

  const sections = [
    {
      label: 'FILE',
      items: [
        { id: 'new', label: 'New Project', key: 'Ctrl+N', onClick: onNew },
        { id: 'open', label: 'Open File...', key: 'Ctrl+O', onClick: onOpen },
        { id: 'div1', label: '', divider: true, onClick: () => {} },
        { id: 'save', label: 'Save', key: 'Ctrl+S', onClick: onSave },
        { id: 'saveas', label: 'Save As (2x)', key: 'Ctrl+Shift+S', onClick: onSaveAs },
        { id: 'export', label: 'Export PNG', key: 'Ctrl+E', onClick: onExportPNG },
        { id: 'div2', label: '', divider: true, onClick: () => {} },
        { id: 'share', label: 'Share & Collaborate', onClick: onShare },
      ],
    },
    {
      label: 'EDIT',
      items: [
        { id: 'undo', label: 'Undo', key: 'Ctrl+Z', disabled: !canUndo, onClick: onUndo },
        { id: 'redo', label: 'Redo', key: 'Ctrl+Shift+Z', disabled: !canRedo, onClick: onRedo },
      ],
    },
  ];

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 6, minWidth: 220,
      background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)', boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      zIndex: 200, overflow: 'hidden', animation: 'fadeIn 0.12s var(--ease-out)',
    }}>
      {sections.map((s, si) => (
        <React.Fragment key={si}>
          {si > 0 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
          <div style={{ padding: '5px 14px 3px', fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800, letterSpacing: 1.8, color: 'var(--text-disabled)' }}>
            {s.label}
          </div>
          <div style={{ padding: '3px 0' }}>
            {s.items.map(item =>
              item.divider ? <div key={item.id} style={{ height: 1, background: 'var(--border-subtle)', margin: '3px 12px' }} /> : (
                <button key={item.id} onClick={() => { if (!item.disabled) item.onClick(); }} disabled={item.disabled}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '7px 14px', fontFamily: 'var(--font-display)', fontSize: 11,
                    fontWeight: 600, letterSpacing: 0.5,
                    color: item.disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
                    cursor: item.disabled ? 'default' : 'pointer', textAlign: 'left',
                    transition: 'background 0.06s',
                  }}
                  onMouseEnter={e => { if (!item.disabled) (e.target as HTMLElement).style.background = 'var(--accent-dim)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.key && <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--text-disabled)', fontFamily: 'var(--font-body)' }}>{item.key}</span>}
                </button>
              )
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
