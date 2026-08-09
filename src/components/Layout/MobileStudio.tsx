import React, { useState, useCallback, useEffect } from 'react';
import { PLATFORM_PRESETS } from '../../data/presets';
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

export default function MobileStudio(p: Props) {
  const { sheet, setSheet, handleNew, handleOpen, handleSave, canUndo, canRedo, cur, doc, state, dispatch, saveSnapshot, fabricRef } = p;

  const closeSheet = () => setSheet(null);

  return (
    <>
      {/* ═══════ TOP BAR ═══════ */}
      <div style={{
        height: 'var(--nav-h)', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8,
        flexShrink: 0, paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <button onClick={() => setSheet(sheet === 'menu' ? null : 'menu')}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', borderRadius: 'var(--radius-xs)' }}>
          ☰
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', flex: 1 }}>
          <span style={{ color: 'var(--accent)' }}>ink</span>ception
        </span>
        <button onClick={() => { dispatch({ type: 'UNDO' }); }} disabled={!canUndo}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: canUndo ? 'var(--text2)' : 'var(--text3)', borderRadius: 'var(--radius-xs)' }}>
          ↩
        </button>
        <button onClick={() => { dispatch({ type: 'REDO' }); }} disabled={!canRedo}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: canRedo ? 'var(--text2)' : 'var(--text3)', borderRadius: 'var(--radius-xs)' }}>
          ↪
        </button>
        <button onClick={handleSave}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#000', background: 'var(--green)', borderRadius: 'var(--radius-xs)' }}>
          Save
        </button>
      </div>

      {/* ═══════ MENU SHEET ═══════ */}
      {sheet === 'menu' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', maxHeight: '70vh', overflow: 'auto' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 8px', fontSize: 14, fontWeight: 800, color: '#fff' }}>Menu</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px 16px' }}>
              <MenuCard icon="📄" label="New Design" onClick={handleNew} />
              <MenuCard icon="📂" label="Open File" onClick={handleOpen} />
              <MenuCard icon="💾" label="Save" onClick={handleSave} color="var(--green)" />
              <MenuCard icon="↩" label="Undo" onClick={() => { dispatch({ type: 'UNDO' }); closeSheet(); }} disabled={!canUndo} />
              <MenuCard icon="↪" label="Redo" onClick={() => { dispatch({ type: 'REDO' }); closeSheet(); }} disabled={!canRedo} />
              <MenuCard icon="📐" label="Resize" onClick={() => setSheet('resize')} />
            </div>
          </div>
        </div>
      )}

      {/* ═══════ LAYERS SHEET ═══════ */}
      {sheet === 'layers' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ height: '65vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ flex: 1, overflow: 'hidden' }}><LayersPanel /></div>
          </div>
        </div>
      )}

      {/* ═══════ EFFECTS SHEET ═══════ */}
      {sheet === 'effects' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ flex: 1, overflow: 'hidden' }}><QuickActionsPanel /></div>
          </div>
        </div>
      )}

      {/* ═══════ AI SHEET ═══════ */}
      {sheet === 'ai' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ flex: 1, overflow: 'hidden' }}><AISuggestionsPanel /></div>
          </div>
        </div>
      )}

      {/* ═══════ EXPORT SHEET ═══════ */}
      {sheet === 'export' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ flex: 1, overflow: 'hidden' }}><ExportPanel /></div>
          </div>
        </div>
      )}

      {/* ═══════ RESIZE SHEET ═══════ */}
      {sheet === 'resize' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ height: '65vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ flex: 1, overflow: 'hidden' }}><TemplatesPanel /></div>
          </div>
        </div>
      )}

      {/* ═══════ COLLAGE SHEET ═══════ */}
      {sheet === 'collage' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ flex: 1, overflow: 'hidden' }}><CollagePanel /></div>
          </div>
        </div>
      )}

      {/* ═══════ PREVIEW SHEET ═══════ */}
      {sheet === 'preview' && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="sheet" style={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ flex: 1, overflow: 'hidden' }}><ReviewStudio /></div>
          </div>
        </div>
      )}

      {/* ═══════ BOTTOM BAR ═══════ */}
      <div style={{
        height: 'var(--bottom-h)', background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 4px', gap: 2,
        flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <TabBtn icon="📑" label="Layers" active={sheet === 'layers'} onClick={() => setSheet(sheet === 'layers' ? null : 'layers')} />
        <TabBtn icon="✨" label="Effects" active={sheet === 'effects'} onClick={() => setSheet(sheet === 'effects' ? null : 'effects')} />
        <TabBtn icon="🤖" label="AI" active={sheet === 'ai'} onClick={() => setSheet(sheet === 'ai' ? null : 'ai')} />
        <TabBtn icon="📐" label="Resize" active={sheet === 'resize'} onClick={() => setSheet(sheet === 'resize' ? null : 'resize')} />
        <TabBtn icon="📤" label="Export" active={sheet === 'export'} onClick={() => setSheet(sheet === 'export' ? null : 'export')} />
      </div>
    </>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 60, gap: 2,
      borderRadius: 'var(--radius-xs)', background: active ? 'var(--card)' : 'transparent',
      color: active ? '#fff' : 'var(--text3)', fontSize: 10, fontWeight: 600,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MenuCard({ icon, label, onClick, color, disabled }: { icon: string; label: string; onClick: () => void; color?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="card" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '20px 12px', opacity: disabled ? 0.4 : 1,
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || 'var(--text)' }}>{label}</span>
    </button>
  );
}
