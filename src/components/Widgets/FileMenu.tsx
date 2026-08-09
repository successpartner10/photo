import React, { useEffect, useRef } from 'react';

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface Props {
  onClose: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportPNG: () => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export default function FileMenu({ onClose, onNew, onOpen, onSave, onSaveAs, onExportPNG, onShare, canUndo, canRedo, onUndo, onRedo }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const sections: { label?: string; items: MenuItem[] }[] = [
    {
      label: 'FILE',
      items: [
        { id: 'new', label: 'New Project', shortcut: 'Ctrl+N', icon: '📄', onClick: onNew },
        { id: 'open', label: 'Open File...', shortcut: 'Ctrl+O', icon: '📂', onClick: onOpen },
        { id: 'div1' as any, label: '', divider: true, onClick: () => {} },
        { id: 'save', label: 'Save', shortcut: 'Ctrl+S', icon: '💾', onClick: onSave },
        { id: 'saveas', label: 'Save As (2x)...', shortcut: 'Ctrl+Shift+S', icon: '📥', onClick: onSaveAs },
        { id: 'export', label: 'Export PNG', shortcut: 'Ctrl+E', icon: '🖼', onClick: onExportPNG },
        { id: 'div2' as any, label: '', divider: true, onClick: () => {} },
        { id: 'share', label: 'Share & Collaborate', icon: '👥', onClick: onShare },
      ],
    },
    {
      label: 'EDIT',
      items: [
        { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', icon: '↩', disabled: !canUndo, onClick: onUndo },
        { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', icon: '↪', disabled: !canRedo, onClick: onRedo },
      ],
    },
  ];

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0,
      marginTop: 4, minWidth: 240,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
      zIndex: 200,
      overflow: 'hidden',
      animation: 'fadeIn 0.15s var(--ease-out)',
    }}>
      {sections.map((section, si) => (
        <React.Fragment key={si}>
          {si > 0 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
          {section.label && (
            <div style={{
              padding: '6px 14px 4px',
              fontSize: 9, fontWeight: 700, color: 'var(--text-disabled)',
              textTransform: 'uppercase', letterSpacing: 1.2,
            }}>
              {section.label}
            </div>
          )}
          <div style={{ padding: '4px 0' }}>
            {section.items.map(item =>
              item.divider ? (
                <div key={item.id} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 12px' }} />
              ) : (
                <button key={item.id}
                  onClick={() => { if (!item.disabled) item.onClick(); }}
                  disabled={item.disabled}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '7px 14px',
                    fontSize: 12, color: item.danger ? 'var(--danger)' : 'var(--text-primary)',
                    cursor: item.disabled ? 'default' : 'pointer',
                    opacity: item.disabled ? 0.3 : 1,
                    transition: 'background 0.08s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!item.disabled) (e.target as HTMLElement).style.background = 'var(--bg-overlay)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.shortcut && (
                    <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'monospace' }}>
                      {item.shortcut}
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
