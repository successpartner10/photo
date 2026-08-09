import React, { useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { EditorLayer, LayerType } from '../../types/editor';

const LAYER_LABELS: Record<LayerType, string> = {
  raster: 'R', vector: 'V', text: 'T', adjustment: 'Adj', 'smart-object': 'Smart', group: 'Grp',
};

export default function LayersPanel() {
  const { doc, updateLayerProp, removeLayer, duplicateLayer, addLayer, dispatch } = useEditor();
  const [search, setSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);

  const layers = doc.layers;
  const filtered = layers.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (type: LayerType) => {
    addLayer({ name: type.charAt(0).toUpperCase() + type.slice(1), type,
      visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: type === 'group' });
  };

  const handleRightClick = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, layerId });
  };

  const ctxAction = (action: string, id: string) => {
    setContextMenu(null);
    switch (action) {
      case 'dup': duplicateLayer(id); break;
      case 'del': removeLayer(id); break;
      case 'smart': updateLayerProp(id, { type: 'smart-object', smartObjectRef: `s-${Date.now()}` }); break;
      case 'clip': updateLayerProp(id, { clippingMaskId: `c-${Date.now()}` }); break;
      case 'merge': {
        const idx = layers.findIndex(l => l.id === id);
        if (idx > 0) dispatch({ type: 'MERGE_LAYERS', payload: [id, layers[idx - 1].id] });
        break;
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">LAYERS</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, color: 'var(--text-disabled)' }}>{layers.length}</span>
      </div>

      <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <select value={layers[layers.length - 1]?.blendMode || 'normal'}
          onChange={e => { const id = layers[layers.length - 1]?.id; if (id) updateLayerProp(id, { blendMode: e.target.value as any }); }}
          style={{ width: '100%', fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 0.5 }}>
          {['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion'].map(b => (
            <option key={b} value={b}>{b.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div style={{ padding: '6px 8px' }}>
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 10 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 5px' }}>
        {[...filtered].reverse().map((layer) => {
          const isTop = layer.id === layers[layers.length - 1]?.id;
          return (
            <div key={layer.id}
              onContextMenu={e => handleRightClick(e, layer.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                margin: '1px 0', borderRadius: 'var(--radius-sm)',
                background: isTop ? 'var(--accent-dim)' : 'transparent',
                border: isTop ? '1px solid rgba(124,92,252,0.2)' : '1px solid transparent',
                cursor: 'pointer', transition: 'background 0.1s',
                opacity: layer.visible ? 1 : 0.35,
              }}>
              <button onClick={e => { e.stopPropagation(); updateLayerProp(layer.id, { visible: !layer.visible }); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={layer.visible ? 'var(--text-secondary)' : 'var(--text-disabled)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {layer.visible
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  }
                </svg>
              </button>

              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                color: isTop ? 'var(--accent-light)' : 'var(--text-muted)',
                width: 18, textAlign: 'center',
              }}>
                {layer.type === 'smart-object' ? 'S' : LAYER_LABELS[layer.type]}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
                  color: isTop ? '#fff' : 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {layer.name}
                </div>
              </div>

              {layer.locked && <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, color: 'var(--text-disabled)' }}>LOCK</span>}
              {layer.clippingMaskId && <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, color: 'var(--accent)' }}>CLIP</span>}

              <input type="range" min={0} max={100} value={Math.round(layer.opacity * 100)}
                onChange={e => { e.stopPropagation(); updateLayerProp(layer.id, { opacity: +e.target.value / 100 }); }}
                onClick={e => e.stopPropagation()} style={{ width: 28, flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {(['raster', 'vector', 'text', 'group', 'adjustment'] as LayerType[]).map(t => (
          <button key={t} onClick={() => handleAdd(t)} style={{
            flex: 1, padding: '5px 3px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
            color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 0.8, whiteSpace: 'nowrap',
          }}>+ {LAYER_LABELS[t]}</button>
        ))}
      </div>

      {contextMenu && (
        <>
          <div onClick={() => setContextMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100,
            background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', padding: 4, minWidth: 160,
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          }}>
            {[
              { id: 'dup', label: 'DUPLICATE' },
              { id: 'smart', label: 'SMART OBJECT' },
              { id: 'clip', label: 'CLIPPING MASK' },
              { id: 'merge', label: 'MERGE DOWN' },
              { id: 'del', label: 'DELETE', danger: true },
            ].map(item => (
              <div key={item.id} onClick={() => ctxAction(item.id, contextMenu.layerId)}
                style={{
                  padding: '6px 10px', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
                  color: (item as any).danger ? 'var(--danger)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                {item.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
