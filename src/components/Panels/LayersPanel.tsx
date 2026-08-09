import React, { useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { LayerType } from '../../types/editor';

const LT: Record<LayerType, string> = {
  raster: 'R', vector: 'V', text: 'T', adjustment: 'A', 'smart-object': 'S', group: 'G',
};

export default function LayersPanel() {
  const { doc, updateLayerProp, removeLayer, duplicateLayer, addLayer, dispatch } = useEditor();
  const [search, setSearch] = useState('');
  const layers = doc.layers;
  const filtered = layers.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ps-panel)' }}>
      {/* Blend mode bar */}
      <div style={{
        padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 4,
        borderBottom: '1px solid #222', fontSize: 10, color: 'var(--ps-text-dim)',
      }}>
        <span style={{ fontSize: 10 }}>Blend:</span>
        <select
          value={layers[layers.length - 1]?.blendMode || 'normal'}
          onChange={e => { const id = layers[layers.length - 1]?.id; if (id) updateLayerProp(id, { blendMode: e.target.value as any }); }}
          style={{ flex: 1, fontSize: 10, background: 'var(--ps-input)', border: '1px solid #222', color: 'var(--ps-text)', padding: '2px 4px' }}>
          {['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'].map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <span style={{ fontSize: 10, color: 'var(--ps-text-muted)' }}>{layers.length}</span>
      </div>

      {/* Search */}
      <div style={{ padding: '4px 6px', borderBottom: '1px solid #222' }}>
        <input type="text" placeholder="Filter..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', fontSize: 10, padding: '3px 6px', background: 'var(--ps-input)', border: '1px solid #222', color: 'var(--ps-text)' }} />
      </div>

      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {[...filtered].reverse().map(layer => (
          <div key={layer.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 6px', borderBottom: '1px solid #1a1a1a',
              cursor: 'pointer', background: layer.id === layers[layers.length - 1]?.id ? 'var(--ps-hover)' : 'transparent',
              fontSize: 10, color: layer.visible ? 'var(--ps-text)' : 'var(--ps-text-muted)',
              opacity: layer.visible ? 1 : 0.5,
            }}>
            {/* Eye toggle */}
            <span onClick={e => { e.stopPropagation(); updateLayerProp(layer.id, { visible: !layer.visible }); }}
              style={{ cursor: 'pointer', width: 16, textAlign: 'center', color: layer.visible ? 'var(--ps-text-dim)' : '#444' }}>
              {layer.visible ? '👁' : '─'}
            </span>

            {/* Type badge */}
            <span style={{
              fontSize: 9, fontWeight: 700, color: layer.type === 'text' ? '#ff6' : layer.type === 'smart-object' ? '#6cf' : 'var(--ps-text-dim)',
              width: 14, textAlign: 'center',
            }}>{LT[layer.type]}</span>

            {/* Name */}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {layer.name}
            </span>

            {/* Lock */}
            {layer.locked && <span style={{ fontSize: 9, color: '#666' }}>🔒</span>}
            {layer.clippingMaskId && <span style={{ fontSize: 9, color: 'var(--ps-accent)' }}>✂</span>}

            {/* Opacity */}
            <input type="range" min={0} max={100} value={Math.round(layer.opacity * 100)}
              onChange={e => updateLayerProp(layer.id, { opacity: +e.target.value / 100 })}
              style={{ width: 40, flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Bottom buttons */}
      <div style={{
        padding: '4px 6px', borderTop: '1px solid #222',
        display: 'flex', gap: 2,
      }}>
        {(['raster', 'vector', 'text', 'group'] as LayerType[]).map(t => (
          <button key={t}
            onClick={() => addLayer({ name: t.charAt(0).toUpperCase() + t.slice(1), type: t, visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: t === 'group' })}
            style={{
              flex: 1, padding: '4px 2px', fontSize: 9, color: 'var(--ps-text-dim)',
              background: 'var(--ps-input)', border: '1px solid #333', cursor: 'pointer',
            }}>
            +{LT[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
