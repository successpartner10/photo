import React from 'react';
import LayersPanel from '../Panels/LayersPanel';
import QuickActionsPanel from '../Panels/QuickActionsPanel';
import AISuggestionsPanel from '../Panels/AISuggestionsPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import ReviewStudio from '../Panels/ReviewStudio';
import CollagePanel from '../Panels/CollagePanel';

interface Props {
  sheet: string | null;
  setSheet: (s: string | null) => void;
  handleNew: () => void;
  handleOpen: () => void;
  handleSave: () => void;
  uploading: string;
  canUndo: boolean;
  canRedo: boolean;
  cur: any;
  doc: any;
  state: any;
  dispatch: any;
  saveSnapshot: any;
  fabricRef: any;
  cr: any;
}

function Logo() {
  return (
    <svg width="120" height="22" viewBox="0 0 120 22" style={{ display: 'block' }}>
      <text x="0" y="18" fontFamily="Segoe UI, system-ui, sans-serif" fontWeight="800" fontSize="18" fill="#6c5ce7">ink</text>
      <text x="36" y="18" fontFamily="Segoe UI, system-ui, sans-serif" fontWeight="300" fontSize="18" fill="#888">ception</text>
    </svg>
  );
}

export default function MobileStudio(p: Props) {
  const { sheet, setSheet, handleNew, handleOpen, handleSave, canUndo, canRedo, doc, state, dispatch, saveSnapshot } = p;
  const closeSheet = () => setSheet(null);

  return (
    <>
      {/* TOP BAR */}
      <div style={{ height: 48, background: '#111', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, flexShrink: 0, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <button onClick={() => setSheet(sheet === 'menu' ? null : 'menu')}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', borderRadius: 6 }}>
          ☰
        </button>
        <div style={{ flex: 1 }}><Logo /></div>
        <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: canUndo ? '#aaa' : '#333', borderRadius: 6 }}>↩</button>
        <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: canRedo ? '#aaa' : '#333', borderRadius: 6 }}>↪</button>
        <button onClick={handleSave}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#000', background: '#00b894', borderRadius: 6 }}>Save</button>
      </div>

      {/* MENU SHEET */}
      {sheet === 'menu' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111', borderRadius: '12px 12px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 0px)', maxHeight: '70vh', overflow: 'auto', animation: 'slideUp .25s ease-out' }}>
            <div style={{ width: 36, height: 4, background: '#2a2a2a', borderRadius: 2, margin: '8px auto' }} />
            <div style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: '#fff' }}>Menu</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px 16px' }}>
              <MCard icon="📄" label="New Design" onClick={handleNew} />
              <MCard icon="📂" label="Open File" onClick={handleOpen} />
              <MCard icon="💾" label="Save" onClick={handleSave} color="#00b894" />
              <MCard icon="↩" label="Undo" onClick={() => { dispatch({ type: 'UNDO' }); closeSheet(); }} disabled={!canUndo} />
              <MCard icon="↪" label="Redo" onClick={() => { dispatch({ type: 'REDO' }); closeSheet(); }} disabled={!canRedo} />
              <MCard icon="📐" label="Resize" onClick={() => setSheet('resize')} />
            </div>
          </div>
        </div>
      )}

      {/* PANEL SHEETS */}
      {[
        ['layers', 'Layers', LayersPanel],
        ['effects', 'Effects', QuickActionsPanel],
        ['ai', 'AI Tools', AISuggestionsPanel],
        ['export', 'Export', ExportPanel],
        ['resize', 'Resize', TemplatesPanel],
        ['collage', 'Collage', CollagePanel],
        ['preview', 'Preview', ReviewStudio],
      ].map(([id, _label, Panel]) => sheet === id && (
        <div key={id} onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ height: '65vh', background: '#111', borderRadius: '12px 12px 0 0', display: 'flex', flexDirection: 'column', animation: 'slideUp .25s ease-out' }}>
            <div style={{ width: 36, height: 4, background: '#2a2a2a', borderRadius: 2, margin: '8px auto' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}><Panel /></div>
          </div>
        </div>
      ))}

      {/* BOTTOM BAR */}
      <div style={{ height: 72, background: '#111', borderTop: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', padding: '0 4px', gap: 2, flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {[
          ['layers', 'Layers', '📑'],
          ['effects', 'Effects', '✨'],
          ['ai', 'AI', '🤖'],
          ['resize', 'Resize', '📐'],
          ['export', 'Export', '📤'],
        ].map(([id, label, icon]) => (
          <button key={id} onClick={() => setSheet(sheet === id ? null : id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 60, gap: 2, borderRadius: 6, background: sheet === id ? '#1a1a1a' : 'transparent', color: sheet === id ? '#fff' : '#555', fontSize: 10, fontWeight: 600 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function MCard({ icon, label, onClick, color, disabled }: { icon: string; label: string; onClick: () => void; color?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', opacity: disabled ? 0.4 : 1, textAlign: 'center', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || '#f0f0f0' }}>{label}</span>
    </button>
  );
}
