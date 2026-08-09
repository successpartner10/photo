import React, { useState, useRef, useCallback, useEffect } from 'react';
import Canvas from '../Canvas/Canvas';
import Toolbar from '../Toolbar/Toolbar';
import LayersPanel from '../Panels/LayersPanel';
import AISuggestionsPanel from '../Panels/AISuggestionsPanel';
import QuickActionsPanel from '../Panels/QuickActionsPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import ReviewStudio from '../Panels/ReviewStudio';
import CollagePanel from '../Panels/CollagePanel';
import FileMenu from '../Widgets/FileMenu';
import Logo from '../Widgets/Logo';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';

type Tab = 'layers' | 'review' | 'adjust' | 'collage' | 'ai' | 'export' | 'resize';

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'layers', label: 'Layers', color: 'var(--c-purple)' },
  { id: 'review', label: 'Review', color: 'var(--c-teal)' },
  { id: 'adjust', label: 'Adjust', color: 'var(--c-red)' },
  { id: 'collage', label: 'Collage', color: 'var(--c-orange)' },
  { id: 'ai', label: 'AI', color: 'var(--accent)' },
  { id: 'export', label: 'Export', color: 'var(--c-green)' },
  { id: 'resize', label: 'Resize', color: 'var(--c-blue)' },
];

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef } = useEditor();
  const [tab, setTab] = useState<Tab>('layers');
  const [mobilePanel, setMobilePanel] = useState<Tab | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const cr = useRef<any>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { basicMode } = state.globalSettings;
  const [uploadStatus, setUploadStatus] = useState('');

  const cur = state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];
  const canUndo = cur.historyIndex >= 0;
  const canRedo = cur.historyIndex < cur.history.length - 1;

  // MOBILE-FIRST: default is mobile, only show desktop panels if > 1024px
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleNew = () => {
    dispatch({ type: 'CREATE_DOCUMENT', payload: { name: `Untitled ${state.documents.length + 1}`, width: 1080, height: 1920 } });
    setShowFileMenu(false);
    setShowMobileMenu(false);
  };

  const handleOpen = useCallback(() => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';
    i.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      setUploadStatus(`Importing ${f.name}...`);
      if (cr.current) cr.current.importFile(f);
      setTimeout(() => setUploadStatus(''), 1500);
    };
    i.click();
    setShowFileMenu(false);
    setShowMobileMenu(false);
  }, []);

  const handleSave = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.download = `${doc.name || 'design'}.png`;
    a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    a.click();
    setShowFileMenu(false);
    setShowMobileMenu(false);
  }, [fabricRef, doc.name]);

  const handleQuickAction = useCallback((action: string) => {
    const c = cr.current ? cr.current.getCanvas() : null;
    if (!c) return;
    switch (action) {
      case 'save': handleSave(); break;
      case 'undo': dispatch({ type: 'UNDO' }); break;
      case 'redo': dispatch({ type: 'REDO' }); break;
    }
  }, [handleSave, dispatch]);

  const renderPanel = () => {
    switch (tab) {
      case 'layers': return <LayersPanel />;
      case 'review': return <ReviewStudio />;
      case 'adjust': return <QuickActionsPanel />;
      case 'collage': return <CollagePanel />;
      case 'ai': return <AISuggestionsPanel />;
      case 'export': return <ExportPanel />;
      case 'resize': return <TemplatesPanel />;
    }
  };

  const renderMobilePanelContent = (id: Tab) => {
    switch (id) {
      case 'layers': return <LayersPanel />;
      case 'review': return <ReviewStudio />;
      case 'adjust': return <QuickActionsPanel />;
      case 'collage': return <CollagePanel />;
      case 'ai': return <AISuggestionsPanel />;
      case 'export': return <ExportPanel />;
      case 'resize': return <TemplatesPanel />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-root)', overflow: 'hidden' }}>
      {/* ═══ MOBILE-FIRST HEADER ═══ */}
      <div style={{
        height: 48, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 0,
        flexShrink: 0, zIndex: 100, paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        {/* Hamburger / File menu */}
        <button onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 20, fontWeight: 700 }}>
          ☰
        </button>

        <Logo size={20} />

        {/* Desktop-only tab list */}
        {isDesktop && (
          <>
            <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 12px' }} />
            <div style={{ display: 'flex', gap: 0, flex: 1, overflow: 'hidden', minWidth: 0 }}>
              {state.documents.map(d => (
                <div key={d.id} onClick={() => dispatch({ type: 'SWITCH_DOCUMENT', payload: d.id })}
                  style={{ padding: '10px 14px', borderRadius: '4px 4px 0 0', fontSize: 10, cursor: 'pointer', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 600, background: d.id === state.activeDocumentId ? 'var(--bg-elevated)' : 'transparent', color: d.id === state.activeDocumentId ? '#fff' : 'var(--text-muted)', borderBottom: d.id === state.activeDocumentId ? '2px solid var(--accent)' : '2px solid transparent' }}>
                  <span style={{ fontSize: 7, color: d.isDirty ? 'var(--c-amber)' : 'var(--text-disabled)', fontWeight: 800 }}>{d.isDirty ? '●' : '○'}</span>
                  {d.name}
                </div>
              ))}
              <button onClick={handleNew} style={{ padding: '8px 10px', fontSize: 16, fontWeight: 300, color: 'var(--text-muted)' }}>+</button>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 12px' }} />

            <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo} style={tb}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
              </button>
              <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo} style={tb}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              </button>

              <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 4px' }} />

              <select value={`${doc.canvas.width}x${doc.canvas.height}`} onChange={e => { const [w, h] = e.target.value.split('x').map(Number); if (w && h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); } }}
                style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 600, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', padding: '4px 20px 4px 6px', borderRadius: 'var(--radius)', maxWidth: 115 }}>
                <option>{doc.canvas.width}×{doc.canvas.height}</option>
                {PLATFORM_PRESETS.filter(p => p.id !== 'custom').slice(0, 6).map(p => <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform}: {p.width}×{p.height}</option>)}
              </select>

              <button onClick={handleSave} style={{ ...tb, color: 'var(--c-green)' }} title="Save Ctrl+S">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              </button>

              <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', margin: '0 4px' }} />

              <button onClick={() => dispatch({ type: 'SET_BASIC_MODE', payload: !basicMode })}
                style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1, color: basicMode ? 'var(--accent)' : 'var(--text-muted)', border: basicMode ? '1px solid rgba(124,92,252,.3)' : '1px solid var(--border-default)', borderRadius: 'var(--radius)', padding: '4px 8px', background: basicMode ? 'rgba(124,92,252,.06)' : 'transparent' }}>
                {basicMode ? 'BASIC' : 'ADV'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ═══ MOBILE FILE MENU OVERLAY ═══ */}
      {showMobileMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex' }}>
          <div onClick={() => setShowMobileMenu(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
          <div style={{
            position: 'absolute', top: 50, left: 8, right: 8, maxWidth: 320,
            background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)', overflow: 'hidden', animation: 'fadeIn .12s ease-out',
          }}>
            <div style={{
              padding: '6px 12px', fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800,
              letterSpacing: 1.5, color: 'var(--text-disabled)', borderBottom: '1px solid var(--border-subtle)',
            }}>FILE</div>
            {[
              { label: 'New Project', onClick: handleNew },
              { label: 'Open File...', onClick: handleOpen },
              { label: 'Save (PNG)', onClick: handleSave },
              { label: 'Undo', onClick: () => { dispatch({ type: 'UNDO' }); setShowMobileMenu(false); }, disabled: !canUndo },
              { label: 'Redo', onClick: () => { dispatch({ type: 'REDO' }); setShowMobileMenu(false); }, disabled: !canRedo },
            ].map(item => (
              <button key={item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                style={{
                  width: '100%', padding: '12px 16px', textAlign: 'left',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
                  color: item.disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
                  borderBottom: '1px solid var(--border-subtle)', borderRadius: 0,
                  cursor: item.disabled ? 'default' : 'pointer',
                }}>
                {item.label}
              </button>
            ))}
            <button onClick={() => setShowMobileMenu(false)}
              style={{ width: '100%', padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderRadius: 0 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload toast */}
      {uploadStatus && (
        <div style={{
          position: 'fixed', top: 50, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
          background: 'var(--accent)', color: '#fff', padding: '6px 18px',
          borderRadius: '0 0 8px 8px', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
        }}>{uploadStatus}</div>
      )}

      {/* ═══ MAIN BODY ═══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left toolbar — DESKTOP ONLY */}
        {isDesktop && <Toolbar />}

        {/* Canvas — always visible, full width on mobile */}
        <Canvas ref={cr} />

        {/* Right panel — DESKTOP ONLY */}
        {isDesktop && (
          <div style={{
            width: 'var(--panel-w)', background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)', overflowX: 'auto',
            }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, padding: '10px 2px', fontFamily: 'var(--font-display)',
                    fontSize: 7, fontWeight: tab === t.id ? 800 : 600, letterSpacing: 1,
                    background: tab === t.id ? 'var(--bg-surface)' : 'transparent', border: 'none',
                    borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
                    color: tab === t.id ? t.color : 'var(--text-disabled)', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>{renderPanel()}</div>
          </div>
        )}
      </div>

      {/* ═══ MOBILE BOTTOM BAR ═══ */}
      {!isDesktop && (
        <div style={{
          height: 'auto', background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-default)',
          padding: '4px 4px calc(4px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, zIndex: 90,
        }}>
          {/* Action row */}
          <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
            <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
              style={{ flex: 1, height: 36, borderRadius: 'var(--radius)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: canUndo ? 'var(--text-secondary)' : 'var(--text-disabled)', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↩
            </button>
            <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
              style={{ flex: 1, height: 36, borderRadius: 'var(--radius)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: canRedo ? 'var(--text-secondary)' : 'var(--text-disabled)', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↪
            </button>
            <select value={`${doc.canvas.width}x${doc.canvas.height}`}
              onChange={e => { const [w, h] = e.target.value.split('x').map(Number); if (w && h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); } }}
              style={{ flex: 2, height: 36, borderRadius: 'var(--radius)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600, padding: '0 8px', textAlign: 'center', maxWidth: 120 }}>
              <option>{doc.canvas.width}×{doc.canvas.height}</option>
              {PLATFORM_PRESETS.filter(p => p.id !== 'custom').map(p => <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform} {p.width}×{p.height}</option>)}
            </select>
            <button onClick={handleSave}
              style={{ flex: 1, height: 36, borderRadius: 'var(--radius)', background: 'var(--c-green)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
              💾
            </button>
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', gap: 3, padding: '0 4px' }}>
            {TABS.map(t => {
              const active = mobilePanel === t.id;
              return (
                <button key={t.id}
                  onClick={() => setMobilePanel(active ? null : t.id)}
                  style={{
                    flex: 1, height: 38, borderRadius: 'var(--radius)', border: 'none',
                    background: active ? 'var(--bg-overlay)' : 'transparent',
                    color: active ? t.color : 'var(--text-muted)',
                    fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700,
                    letterSpacing: 0.8, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 1,
                    transition: 'all .1s',
                  }}>
                  <span style={{ fontSize: 14 }}>{t.id === 'layers' ? '📑' : t.id === 'review' ? '👁' : t.id === 'adjust' ? '⚡' : t.id === 'collage' ? '🖼' : t.id === 'ai' ? '✦' : t.id === 'export' ? '📤' : '📐'}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MOBILE PANEL OVERLAY ═══ */}
      {!isDesktop && mobilePanel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column',
          animation: 'slideUp .15s ease-out', paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-default)', padding: '10px 14px' }}>
            <span className="title" style={{ color: TABS.find(t => t.id === mobilePanel)?.color }}>
              {TABS.find(t => t.id === mobilePanel)?.label}
            </span>
            <button onClick={() => setMobilePanel(null)}
              style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-muted)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius)' }}>
              ×
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: '100%' }}>{renderMobilePanelContent(mobilePanel)}</div>
          </div>
        </div>
      )}

    </div>
  );
}

const tb: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'var(--text-secondary)',
  cursor: 'pointer', padding: '4px 5px', borderRadius: 'var(--radius)',
  display: 'flex', alignItems: 'center',
};
