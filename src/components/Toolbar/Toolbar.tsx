import React from 'react';
import { useEditor } from '../../store/editorStore';
import { ToolType } from '../../types/editor';

const TOOLS: { id: ToolType; label: string; shortcut: string; col: number }[] = [
  { id: 'select', label: 'Move', shortcut: 'V', col: 0 },
  { id: 'marquee', label: 'Marquee', shortcut: 'M', col: 0 },
  { id: 'lasso', label: 'Lasso', shortcut: 'L', col: 0 },
  { id: 'magic-wand', label: 'Wand', shortcut: 'W', col: 0 },
  { id: 'rect', label: 'Rect', shortcut: 'U', col: 0 },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'U', col: 0 },
  { id: 'line', label: 'Line', shortcut: 'U', col: 0 },
  { id: 'pen', label: 'Pen', shortcut: 'P', col: 1 },
  { id: 'text', label: 'Text', shortcut: 'T', col: 1 },
  { id: 'brush', label: 'Brush', shortcut: 'B', col: 1 },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', col: 1 },
  { id: 'fill', label: 'Fill', shortcut: 'G', col: 1 },
  { id: 'gradient', label: 'Grad', shortcut: 'G', col: 1 },
  { id: 'clone', label: 'Clone', shortcut: 'S', col: 1 },
  { id: 'healing', label: 'Heal', shortcut: 'J', col: 1 },
  { id: 'shape-builder', label: 'Shape', shortcut: 'U', col: 1 },
];

const COLORS: { [key: string]: string } = {
  '0': '#1e1e1e', '1': '#2d2d2d',
};

const ICONS: Record<string, string> = {
  select: '✥', marquee: '⬜', lasso: '⭝', 'magic-wand': '✦',
  rect: '▭', ellipse: '○', line: '╲', pen: '✎', text: 'T',
  brush: '🖌', eraser: '⌫', fill: '🪣', gradient: '◧',
  clone: '◎', healing: '🩹', 'shape-builder': '◈',
};

export default function Toolbar() {
  const { state, dispatch } = useEditor();
  const col0 = TOOLS.filter(t => t.col === 0);
  const col1 = TOOLS.filter(t => t.col === 1);

  const ToolBtn = ({ tool }: { tool: typeof TOOLS[0] }) => {
    const active = state.tool === tool.id;
    return (
      <button
        onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.id })}
        title={`${tool.label} (${tool.shortcut})`}
        style={{
          width: 24, height: 24, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '1px auto',
          background: active ? 'var(--ps-active)' : 'transparent',
          border: active ? '1px solid var(--ps-accent)' : '1px solid transparent',
          borderRadius: 0, cursor: 'pointer', fontSize: 13, color: active ? '#fff' : 'var(--ps-text-dim)',
          transition: 'none',
        }}>
        <span style={{ fontSize: tool.id === 'text' ? 14 : 12, fontWeight: tool.id === 'text' ? 700 : 400 }}>
          {ICONS[tool.id] || tool.shortcut}
        </span>
      </button>
    );
  };

  return (
    <div style={{
      width: 'var(--toolbar-w)', background: 'var(--ps-bg)',
      borderRight: '1px solid #222', display: 'flex',
      flexDirection: 'column', flexShrink: 0, padding: '4px 0',
    }}>
      {/* Column layout — Photoshop uses two columns */}
      <div style={{ display: 'flex', padding: '0 2px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {col0.map(t => <ToolBtn key={t.id} tool={t} />)}
        </div>
        <div style={{ width: 1, background: '#222', margin: '2px 0' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {col1.map(t => <ToolBtn key={t.id} tool={t} />)}
        </div>
      </div>

      {/* Color chips */}
      <div style={{ marginTop: 'auto', padding: '4px' }}>
        <div style={{
          width: 22, height: 22, background: '#111', border: '2px solid #555',
          margin: '0 auto 2px', cursor: 'pointer',
        }} />
        <div style={{
          width: 22, height: 22, background: '#fff', border: '2px solid #555',
          margin: '0 auto', cursor: 'pointer', marginTop: -6,
        }} />
        <div style={{
          width: 14, height: 14, border: '1px solid #555', margin: '4px auto 0',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: 'var(--ps-text-dim)',
        }}>↺</div>
      </div>
    </div>
  );
}
