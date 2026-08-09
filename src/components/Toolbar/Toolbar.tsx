import React from 'react';
import { useEditor } from '../../store/editorStore';
import { ToolType } from '../../types/editor';

const GROUPS: { label: string; tools: { id: ToolType; label: string; key: string; icon: string }[] }[] = [
  { label: 'Select', tools: [
    { id: 'select', label: 'Move', key: 'V', icon: '✥' },
    { id: 'marquee', label: 'Marquee', key: 'M', icon: '⬜' },
    { id: 'lasso', label: 'Lasso', key: 'L', icon: '⭝' },
    { id: 'magic-wand', label: 'Wand', key: 'W', icon: '✦' },
  ]},
  { label: 'Draw', tools: [
    { id: 'rect', label: 'Rect', key: 'U', icon: '▭' },
    { id: 'ellipse', label: 'Ellipse', key: 'U', icon: '○' },
    { id: 'line', label: 'Line', key: 'U', icon: '╲' },
    { id: 'pen', label: 'Pen', key: 'P', icon: '✎' },
    { id: 'text', label: 'Text', key: 'T', icon: 'T' },
    { id: 'shape-builder', label: 'Shape', key: 'U', icon: '◈' },
  ]},
  { label: 'Paint', tools: [
    { id: 'brush', label: 'Brush', key: 'B', icon: '🖌' },
    { id: 'eraser', label: 'Eraser', key: 'E', icon: '⌫' },
    { id: 'fill', label: 'Fill', key: 'G', icon: '🪣' },
    { id: 'gradient', label: 'Gradient', key: 'G', icon: '◧' },
    { id: 'clone', label: 'Clone', key: 'S', icon: '◎' },
    { id: 'healing', label: 'Heal', key: 'J', icon: '🩹' },
  ]},
];

export default function Toolbar() {
  const { state, dispatch } = useEditor();
  const { basicMode } = state.globalSettings;
  const groups = basicMode ? GROUPS.slice(0, 2) : GROUPS;

  return (
    <div style={{
      width: 'var(--toolbar-w)', background: 'var(--surface)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
      padding: '6px 0',
    }}>
      {groups.map(grp => (
        <div key={grp.label} style={{ marginBottom: 2 }}>
          <div style={{
            fontSize: 8, fontWeight: 800, letterSpacing: 1.8,
            color: 'var(--text3)', padding: '8px 8px 4px',
            textTransform: 'uppercase', textAlign: 'center',
          }}>
            {grp.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, padding: '0 4px' }}>
            {grp.tools.map(t => {
              const active = state.tool === t.id;
              return (
                <button key={t.id}
                  onClick={() => dispatch({ type: 'SET_TOOL', payload: t.id })}
                  title={`${t.label} (${t.key})`}
                  style={{
                    width: 26, height: 26, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', borderRadius: 'var(--radius)',
                    background: active ? 'var(--accent)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontSize: t.id === 'text' ? 14 : 14,
                    fontWeight: t.id === 'text' ? 800 : 400,
                    color: active ? '#fff' : 'var(--text2)',
                    transition: 'all .08s',
                  }}>
                  {t.icon}
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 8px 0' }} />
        </div>
      ))}

      {/* Color chips */}
      <div style={{ marginTop: 'auto', padding: '8px' }}>
        <div style={{ width: 24, height: 24, background: '#111', border: '2px solid var(--border)', borderRadius: 'var(--radius)', margin: '0 auto 3px', cursor: 'pointer' }} />
        <div style={{ width: 24, height: 24, background: '#fff', border: '2px solid var(--border)', borderRadius: 'var(--radius)', margin: '-5px auto 6px', cursor: 'pointer' }} />
        <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text3)', textAlign: 'center', letterSpacing: 1 }}>FG/BG</div>
      </div>
    </div>
  );
}
