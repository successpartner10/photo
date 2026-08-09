import React, { useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { BlendMode, LayerType } from '../../types/editor';

const BLEND_MODES: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion',
];

export default function PropertiesPanel() {
  const { doc, updateLayerProp, dispatch } = useEditor();
  const layers = doc.layers;
  const activeLayer = layers[layers.length - 1]; // Top layer is "active"

  if (!activeLayer) {
    return (
      <div style={{ padding: 20, color: '#666', textAlign: 'center', fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
        Select a layer to edit its properties
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid #333',
        fontSize: 13, fontWeight: 600, color: '#ccc',
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        Properties
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Layer name */}
        <Field label="Name">
          <input type="text" value={activeLayer.name}
            onChange={e => updateLayerProp(activeLayer.id, { name: e.target.value })}
            style={inputStyle} />
        </Field>

        {/* Type + badges */}
        <Field label="Type">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#aaa', fontSize: 12, textTransform: 'capitalize' }}>{activeLayer.type}</span>
            {activeLayer.type === 'smart-object' && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#7C5CFC22', color: '#7C5CFC' }}>
                Smart Object
              </span>
            )}
            {activeLayer.clippingMaskId && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#E85D7522', color: '#E85D75' }}>
                Clipping Mask
              </span>
            )}
          </div>
        </Field>

        {/* Opacity */}
        <Field label={`Opacity — ${Math.round(activeLayer.opacity * 100)}%`}>
          <input type="range" min={0} max={100} value={Math.round(activeLayer.opacity * 100)}
            onChange={e => updateLayerProp(activeLayer.id, { opacity: +e.target.value / 100 })}
            style={{ width: '100%', accentColor: '#7C5CFC' }} />
        </Field>

        {/* Blend */}
        <Field label="Blend Mode">
          <select value={activeLayer.blendMode}
            onChange={e => updateLayerProp(activeLayer.id, { blendMode: e.target.value as BlendMode })}
            style={selectStyle}>
            {BLEND_MODES.map(bm => (
              <option key={bm} value={bm} style={{ textTransform: 'capitalize' }}>{bm}</option>
            ))}
          </select>
        </Field>

        {/* Lock + visible */}
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={checkboxLabel}>
            <input type="checkbox" checked={activeLayer.locked}
              onChange={e => updateLayerProp(activeLayer.id, { locked: e.target.checked })} />
            Lock
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" checked={activeLayer.visible}
              onChange={e => updateLayerProp(activeLayer.id, { visible: e.target.checked })} />
            Visible
          </label>
        </div>

        {/* Smart Object controls */}
        {activeLayer.type === 'smart-object' && (
          <div style={{
            marginTop: 4, padding: 10, background: '#1a1a1a',
            borderRadius: 8, border: '1px solid #333',
          }}>
            <div style={{ fontSize: 11, color: '#7C5CFC', fontWeight: 600, marginBottom: 6 }}>
              🧠 Smart Object
            </div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>
              Source preserved — transforms are non-destructive
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => updateLayerProp(activeLayer.id, { type: 'raster' })}
                style={subBtn}>Rasterize</button>
              <button style={subBtn}>Edit Source</button>
              <button style={subBtn}>Relink</button>
            </div>
          </div>
        )}

        {/* Clipping Mask info */}
        {activeLayer.clippingMaskId && (
          <div style={{
            marginTop: 4, padding: 10, background: '#1a1a1a',
            borderRadius: 8, border: '1px solid #333',
          }}>
            <div style={{ fontSize: 11, color: '#E85D75', fontWeight: 600, marginBottom: 4 }}>
              ✂ Clipping Mask
            </div>
            <div style={{ fontSize: 10, color: '#888' }}>
              Mask ID: {activeLayer.clippingMaskId}
            </div>
            <button onClick={() => updateLayerProp(activeLayer.id, { clippingMaskId: undefined })}
              style={{ ...subBtn, marginTop: 6 }}>Release Mask</button>
          </div>
        )}

        {/* Quick actions */}
        <div style={{
          marginTop: 8, padding: 10, background: '#1a1a1a',
          borderRadius: 8, border: '1px solid #333',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <button onClick={() => dispatch({ type: 'DUPLICATE_LAYER', payload: activeLayer.id })} style={subBtn}>
              📋 Duplicate
            </button>
            <button onClick={() => {
              updateLayerProp(activeLayer.id, { type: 'smart-object', smartObjectRef: `smart-${activeLayer.id}` });
            }} style={subBtn}>
              🧠 Smart Object
            </button>
            <button onClick={() => updateLayerProp(activeLayer.id, { clippingMaskId: `clip-${Date.now()}` })}
              style={subBtn}>
              ✂ Clip Mask
            </button>
            <button onClick={() => {
              const idx = layers.findIndex(l => l.id === activeLayer.id);
              if (idx > 0) dispatch({ type: 'MERGE_LAYERS', payload: [activeLayer.id, layers[idx - 1].id] });
            }} style={subBtn}>
              ⬇ Merge Down
            </button>
          </div>
        </div>

        {/* Debug info */}
        <div style={{
          padding: 8, background: '#111', borderRadius: 6, fontSize: 10,
          color: '#555', display: 'flex', flexDirection: 'column', gap: 3,
        }}>
          <span>ID: {activeLayer.id.slice(0, 20)}...</span>
          <span>Blend: {activeLayer.blendMode} · {Math.round(activeLayer.opacity * 100)}%</span>
          <span>Group: {activeLayer.isGroup ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 6, border: '1px solid #333',
  background: '#1a1a1a', color: '#ccc', fontSize: 12, outline: 'none',
  width: '100%', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', textTransform: 'capitalize',
};
const checkboxLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#bbb', cursor: 'pointer',
};
const subBtn: React.CSSProperties = {
  flex: 1, padding: '5px 6px', borderRadius: 4, border: '1px solid #333',
  background: '#222', color: '#aaa', cursor: 'pointer', fontSize: 10,
};
