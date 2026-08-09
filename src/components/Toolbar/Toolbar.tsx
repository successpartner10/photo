import React from 'react';
import { useEditor } from '../../store/editorStore';
import { TOOLS } from '../../data/presets';
import { ToolType } from '../../types/editor';

export default function Toolbar() {
  const { state, dispatch } = useEditor();
  const { basicMode } = state.globalSettings;

  const groups = basicMode
    ? (['basic', 'shape'] as const)
    : (['basic', 'select', 'shape', 'vector', 'raster'] as const);

  return (
    <div
      style={{
        width: 50, background: '#252525', borderRight: '1px solid #333',
        display: 'flex', flexDirection: 'column', padding: '4px 0',
        overflowY: 'auto', gap: 1, flexShrink: 0,
      }}
    >
      {/* Logo / Basic toggle */}
      <button
        onClick={() => dispatch({ type: 'SET_BASIC_MODE', payload: !basicMode })}
        title={basicMode ? 'Switch to Advanced mode' : 'Switch to Basic mode'}
        style={{
          padding: '8px 0 6px', textAlign: 'center', fontSize: 18, fontWeight: 700,
          color: basicMode ? '#7C5CFC' : '#7C5CFC',
          border: 'none', background: 'transparent', cursor: 'pointer',
          borderBottom: '1px solid #333', marginBottom: 4, letterSpacing: -1,
        }}
      >
        {basicMode ? 'D◉' : 'D'}
      </button>

      {groups.map((group) => {
        const groupTools = TOOLS.filter((t) => t.group === group);
        return (
          <React.Fragment key={group}>
            {groupTools.map((tool) => {
              const isActive = state.tool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.id as ToolType })}
                  title={tool.label}
                  style={{
                    width: 40, height: 38, margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? '#7C5CFC' : 'transparent',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontSize: 17, color: isActive ? '#fff' : '#aaa',
                    transition: 'all 0.12s', position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.target as HTMLElement).style.color = '#ddd';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.target as HTMLElement).style.color = '#aaa';
                  }}
                >
                  {tool.icon}
                  {/* Tooltip-like keyboard hint */}
                  <span style={{
                    position: 'absolute', right: -2, bottom: 2, fontSize: 7,
                    color: isActive ? '#ffffffaa' : '#555',
                    fontWeight: 600,
                  }}>
                    {tool.id === 'select' ? 'V' : tool.id === 'move' ? 'M' :
                     tool.id === 'rect' ? 'R' : tool.id === 'ellipse' ? 'E' :
                     tool.id === 'line' ? 'L' : tool.id === 'text' ? 'T' :
                     tool.id === 'pen' ? 'P' : tool.id === 'brush' ? 'B' :
                     tool.id === 'fill' ? 'G' : ''}
                  </span>
                </button>
              );
            })}
            <div style={{ height: 1, background: '#333', margin: '3px 10px' }} />
          </React.Fragment>
        );
      })}

      {/* Color indicators */}
      <div style={{ marginTop: 'auto', padding: '4px 0', borderTop: '1px solid #333' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            title="Foreground color"
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: '#111111', border: '2px solid #555', cursor: 'pointer',
            }}
          />
          <div
            title="Background color"
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: '#ffffff', border: '2px solid #555', cursor: 'pointer',
              marginTop: -6,
            }}
          />
          <button
            onClick={() => {
              const t = document.createElement('input');
              t.type = 'color'; t.value = '#ffffff';
              t.click();
            }}
            style={{
              background: 'none', border: 'none', color: '#888',
              cursor: 'pointer', fontSize: 10, marginTop: 2,
            }}
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}
