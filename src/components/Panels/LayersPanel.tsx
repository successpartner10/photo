import React, { useState, useCallback } from 'react';
import { useEditor } from '../../store/editorStore';
import { EditorLayer, LayerType } from '../../types/editor';

const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  raster: '🖼', vector: '🔷', text: '📝',
  adjustment: '⚙️', 'smart-object': '🧠', group: '📁',
};

export default function LayersPanel() {
  const { doc, updateLayerProp, removeLayer, duplicateLayer, addLayer, dispatch } = useEditor();
  const [search, setSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);

  const layers = doc.layers;
  const filteredLayers = layers.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddLayer = (type: LayerType) => {
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    addLayer({
      name: `${name} ${layers.length}`,
      type,
      visible: true, locked: false, opacity: 1,
      blendMode: 'normal', isGroup: type === 'group',
    });
  };

  const handleRightClick = useCallback((e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, layerId });
  }, []);

  const handleContextAction = useCallback((action: string, layerId: string) => {
    setContextMenu(null);
    switch (action) {
      case 'duplicate': duplicateLayer(layerId); break;
      case 'delete': removeLayer(layerId); break;
      case 'smart-object':
        updateLayerProp(layerId, { type: 'smart-object', smartObjectRef: `smart-${layerId}`, name: `${layers.find(l => l.id === layerId)?.name || 'Layer'} (Smart)` });
        break;
      case 'clipping-mask':
        updateLayerProp(layerId, { clippingMaskId: `clip-${Date.now()}` });
        break;
      case 'merge-down': {
        const idx = layers.findIndex(l => l.id === layerId);
        if (idx > 0) {
          dispatch({ type: 'MERGE_LAYERS', payload: [layerId, layers[idx - 1].id] });
        }
        break;
      }
    }
  }, [duplicateLayer, removeLayer, updateLayerProp, layers, dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: 1 }}>
          Layers
        </span>
        <span style={{ fontSize: 11, color: '#666' }}>{layers.length}</span>
      </div>

      {/* Blend mode bar */}
      <div style={{
        padding: '6px 8px', display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: '#777',
        borderBottom: '1px solid #222',
      }}>
        <span>Blend:</span>
        <select
          value={layers.find(l => l.id === (doc.layers[doc.layers.length - 1]?.id))?.blendMode || 'normal'}
          onChange={e => {
            const lastId = layers[layers.length - 1]?.id;
            if (lastId) updateLayerProp(lastId, { blendMode: e.target.value as any });
          }}
          style={{
            background: '#1a1a1a', border: '1px solid #333', color: '#aaa',
            fontSize: 10, padding: '2px 4px', borderRadius: 3, cursor: 'pointer',
          }}>
          {['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion'].map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div style={{ padding: '6px 8px' }}>
        <input type="text" placeholder="Search layers..." value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #333',
            background: '#1a1a1a', color: '#ccc', fontSize: 11, outline: 'none',
            boxSizing: 'border-box',
          }} />
      </div>

      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 4px' }}>
        {[...filteredLayers].reverse().map((layer, i) => {
          const isActive = i === 0; // top layer active by position
          return (
            <div key={layer.id}
              onClick={() => {}} onContextMenu={e => handleRightClick(e, layer.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 7px',
                margin: '1px 0', borderRadius: 6,
                background: isActive ? '#7C5CFC18' : 'transparent',
                border: isActive ? '1px solid #7C5CFC33' : '1px solid transparent',
                cursor: 'pointer', transition: 'background 0.1s',
                opacity: layer.visible ? 1 : 0.5,
              }}
            >
              {/* Visibility */}
              <button onClick={e => { e.stopPropagation(); updateLayerProp(layer.id, { visible: !layer.visible }); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: layer.visible ? '#aaa' : '#555', padding: 0, width: 18 }}>
                {layer.visible ? '👁' : '—'}
              </button>

              {/* Type + smart object badge */}
              <span style={{ fontSize: 12 }}>
                {layer.type === 'smart-object' ? '🧠' : LAYER_TYPE_LABELS[layer.type]}
              </span>
              {layer.clippingMaskId && <span style={{ fontSize: 10, color: '#7C5CFC' }}>✂</span>}

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, color: isActive ? '#fff' : '#bbb',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {layer.name}
                </div>
              </div>

              {/* Lock badge */}
              {layer.locked && <span style={{ fontSize: 10, color: '#888' }}>🔒</span>}

              {/* Opacity mini slider */}
              <input type="range" min={0} max={100} value={Math.round(layer.opacity * 100)}
                onChange={e => { e.stopPropagation(); updateLayerProp(layer.id, { opacity: +e.target.value / 100 }); }}
                onClick={e => e.stopPropagation()}
                style={{ width: 32, height: 3, accentColor: '#7C5CFC', flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      {/* Add layer buttons */}
      <div style={{
        padding: '6px 8px', borderTop: '1px solid #333',
        display: 'flex', gap: 3, flexWrap: 'wrap',
      }}>
        {(['raster', 'vector', 'text', 'group', 'adjustment'] as LayerType[]).map(type => (
          <button key={type} onClick={() => handleAddLayer(type)}
            style={{
              flex: 1, padding: '4px 2px', borderRadius: 4,
              border: '1px solid #333', background: '#1e1e1e',
              color: '#999', cursor: 'pointer', fontSize: 10, whiteSpace: 'nowrap',
            }}>
            + {type === 'smart-object' ? 'Smart' : LAYER_TYPE_LABELS[type]} {type}
          </button>
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div onClick={() => setContextMenu(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y,
            zIndex: 100, background: '#2a2a2a', border: '1px solid #444',
            borderRadius: 8, padding: 4, minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {[
              { id: 'duplicate', label: '📋 Duplicate Layer' },
              { id: 'smart-object', label: '🧠 Convert to Smart Object' },
              { id: 'clipping-mask', label: '✂ Create Clipping Mask' },
              { id: 'merge-down', label: '⬇ Merge Down' },
              { id: 'delete', label: '🗑 Delete Layer', danger: true },
            ].map(item => (
              <div key={item.id} onClick={() => handleContextAction(item.id, contextMenu.layerId)}
                style={{
                  padding: '6px 10px', cursor: 'pointer', fontSize: 11,
                  color: (item as any).danger ? '#E85D75' : '#ccc',
                  borderRadius: 4, transition: 'background 0.1s',
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
