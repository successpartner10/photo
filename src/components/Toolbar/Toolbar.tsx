import React, { useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { ToolType } from '../../types/editor';

type ToolGroup = { label: string; color: string; tools: { id: ToolType; label: string; shortcut: string }[] };

const TOOL_GROUPS: ToolGroup[] = [
  { label: 'SELECT', color: 'var(--accent)', tools: [
    { id: 'select', label: 'Select', shortcut: 'V' },
    { id: 'move', label: 'Move', shortcut: 'M' },
    { id: 'marquee', label: 'Marquee', shortcut: 'M' },
    { id: 'lasso', label: 'Lasso', shortcut: 'L' },
    { id: 'magic-wand', label: 'Magic Wand', shortcut: 'W' },
  ]},
  { label: 'DRAW', color: 'var(--accent3)', tools: [
    { id: 'rect', label: 'Rectangle', shortcut: 'R' },
    { id: 'ellipse', label: 'Ellipse', shortcut: 'E' },
    { id: 'line', label: 'Line', shortcut: '\\' },
    { id: 'pen', label: 'Pen', shortcut: 'P' },
    { id: 'shape-builder', label: 'Shape Builder', shortcut: 'U' },
  ]},
  { label: 'PAINT', color: 'var(--accent2)', tools: [
    { id: 'brush', label: 'Brush', shortcut: 'B' },
    { id: 'eraser', label: 'Eraser', shortcut: 'E' },
    { id: 'fill', label: 'Fill', shortcut: 'G' },
    { id: 'gradient', label: 'Gradient', shortcut: 'G' },
    { id: 'clone', label: 'Clone Stamp', shortcut: 'S' },
    { id: 'healing', label: 'Healing Brush', shortcut: 'H' },
  ]},
];

export default function Toolbar() {
  const { state, dispatch } = useEditor();
  const { basicMode } = state.globalSettings;
  const [search, setSearch] = useState('');

  const visibleGroups = basicMode ? TOOL_GROUPS.slice(0, 2) : TOOL_GROUPS;
  const filteredGroups = search.trim()
    ? visibleGroups.map(g => ({ ...g, tools: g.tools.filter(t => t.label.toLowerCase().includes(search.toLowerCase()) || t.shortcut.toLowerCase().includes(search.toLowerCase())) })).filter(g => g.tools.length > 0)
    : visibleGroups;

  return (
    <div style={{
      width: 'var(--toolbar-w)', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '14px 12px 10px', borderBottom: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800,
        letterSpacing: 3, color: 'var(--accent)', userSelect: 'none',
      }}>
        DESIGN<span style={{ fontWeight: 300, color: 'var(--text-muted)', fontSize: 10 }}>EDITOR</span>
      </div>

      {/* AI Search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search tools..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 8px 7px 28px', fontSize: 10, borderRadius: 'var(--radius)', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }} />
        </div>
        {search.trim() && filteredGroups.length === 0 && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--text-disabled)', textAlign: 'center', padding: '6px 0' }}>
            No tools match "{search}"
          </div>
        )}
      </div>

      {/* Tool groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {filteredGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 800,
              letterSpacing: 2.5, color: group.color, padding: '8px 12px 4px',
            }}>
              {group.label}
            </div>
            {group.tools.map(tool => {
              const isActive = state.tool === tool.id;
              return (
                <button key={tool.id}
                  onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '7px 12px',
                    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
                    letterSpacing: 0.8, textAlign: 'left',
                    background: isActive ? 'rgba(124,92,252,0.08)' : 'transparent',
                    borderLeft: isActive ? `3px solid ${group.color}` : '3px solid transparent',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    borderRadius: 0, cursor: 'pointer',
                    transition: 'all 0.08s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, color: isActive ? group.color : 'var(--text-disabled)', width: 18, textAlign: 'center' }}>
                    {tool.shortcut}
                  </span>
                  <span style={{ flex: 1 }}>{tool.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Color chips */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 22, height: 22, borderRadius: 'var(--radius)', background: '#1a1a1a', border: '2px solid var(--border-strong)', cursor: 'pointer' }} />
          <div style={{ width: 22, height: 22, borderRadius: 'var(--radius)', background: '#ffffff', border: '2px solid var(--border-strong)', cursor: 'pointer' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-disabled)' }}>FG / BG</span>
        <div style={{ marginTop: 6 }}>
          <button onClick={() => dispatch({ type: 'SET_BASIC_MODE', payload: !basicMode })} style={{
            width: '100%', padding: '6px', borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
            border: '1px solid var(--border-default)', background: basicMode ? 'rgba(124,92,252,0.08)' : 'transparent',
            color: basicMode ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer',
          }}>
            {basicMode ? 'ADVANCED' : 'BASIC'}
          </button>
        </div>
      </div>
    </div>
  );
}
