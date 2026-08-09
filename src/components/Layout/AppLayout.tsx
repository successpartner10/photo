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
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';

type Tab = 'layers' | 'review' | 'adjust' | 'collage' | 'ai' | 'export' | 'resize';

const TABS: { id: Tab; label: string }[] = [
  { id: 'layers', label: 'Layers' },
  { id: 'adjust', label: 'Adjustments' },
  { id: 'ai', label: 'AI Tools' },
  { id: 'collage', label: 'Collage' },
  { id: 'review', label: 'Preview' },
  { id: 'resize', label: 'Resize' },
  { id: 'export', label: 'Export' },
];

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef } = useEditor();
  const [tab, setTab] = useState<Tab>('layers');
  const [mobileTab, setMobileTab] = useState<Tab | null>(null);
  const cr = useRef<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const { basicMode } = state.globalSettings;

  const cur = state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];

  useEffect(() => {
    const c = () => setIsDesktop(window.innerWidth >= 1024);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, []);

  const handleNew = () => {
    dispatch({ type: 'CREATE_DOCUMENT', payload: { name: `Untitled ${state.documents.length + 1}`, width: 1080, height: 1920 } });
    setActiveMenu(null);
  };
  const handleOpen = useCallback(() => {
    const i = document.createElement('input'); i.type = 'file';
    i.accept = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';
    i.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      setUploadStatus(`Opening ${f.name}...`);
      if (cr.current) cr.current.importFile(f);
      setTimeout(() => setUploadStatus(''), 1500);
    };
    i.click(); setActiveMenu(null);
  }, []);
  const handleSave = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const a = document.createElement('a'); a.download = `${doc.name || 'design'}.png`;
    a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 }); a.click();
    setActiveMenu(null);
  }, [fabricRef, doc.name]);

  const menus: Record<string, { label: string; shortcut?: string; onClick: () => void }[]> = {
    File: [
      { label: 'New', shortcut: 'Ctrl+N', onClick: handleNew },
      { label: 'Open...', shortcut: 'Ctrl+O', onClick: handleOpen },
      { label: 'Save', shortcut: 'Ctrl+S', onClick: handleSave },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', onClick: handleSave },
      { label: 'Export PNG...', onClick: handleSave },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', onClick: () => { dispatch({ type: 'UNDO' }); setActiveMenu(null); } },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z', onClick: () => { dispatch({ type: 'REDO' }); setActiveMenu(null); } },
    ],
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--ps-bg)' }}>
      {/* ═══════ MENU BAR ═══════ */}
      <div className="ps-menubar">
        {/* Logo */}
        <span style={{ fontFamily: 'Segoe UI, sans-serif', fontSize: 11, fontWeight: 700, color: '#fff', marginRight: 16, letterSpacing: -0.3 }}>
          Inkception
        </span>

        {/* Dropdown menus */}
        {Object.entries(menus).map(([name, items]) => (
          <div key={name} style={{ position: 'relative' }}>
            <span className="menu"
              onClick={() => setActiveMenu(activeMenu === name ? null : name)}
              style={{ background: activeMenu === name ? 'var(--ps-hover)' : 'transparent' }}>
              {name}
            </span>
            {activeMenu === name && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, minWidth: 200,
                background: 'var(--ps-panel)', border: '1px solid #222',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 300,
              }}>
                {items.map(item => (
                  <div key={item.label}
                    onClick={item.onClick}
                    style={{
                      padding: '5px 20px', cursor: 'pointer', fontSize: 11,
                      color: 'var(--ps-text-dim)', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--ps-accent)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ps-text-dim)'; }}>
                    <span>{item.label}</span>
                    {item.shortcut && <span style={{ fontSize: 10, color: '#666', marginLeft: 40 }}>{item.shortcut}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="separator" />

        {/* Canvas size */}
        <select value={`${doc.canvas.width}x${doc.canvas.height}`}
          onChange={e => { const [w, h] = e.target.value.split('x').map(Number); if (w && h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); } }}
          style={{ fontSize: 10, background: 'transparent', border: 'none', color: 'var(--ps-text-dim)', padding: '2px 16px 2px 4px', cursor: 'pointer', marginLeft: 8 }}>
          <option>{doc.canvas.width}×{doc.canvas.height}</option>
          {PLATFORM_PRESETS.filter(p => p.id !== 'custom').slice(0, 8).map(p => (
            <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform} {p.width}×{p.height}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        {/* Quick actions */}
        <button onClick={() => dispatch({ type: 'UNDO' })} disabled={cur.historyIndex < 0}
          style={{ padding: '4px 8px', fontSize: 11, color: cur.historyIndex >= 0 ? 'var(--ps-text-dim)' : '#444', cursor: cur.historyIndex >= 0 ? 'pointer' : 'default' }}
          title="Undo">↩</button>
        <button onClick={() => dispatch({ type: 'REDO' })} disabled={cur.historyIndex >= cur.history.length - 1}
          style={{ padding: '4px 8px', fontSize: 11, color: cur.historyIndex < cur.history.length - 1 ? 'var(--ps-text-dim)' : '#444' }}
          title="Redo">↪</button>

        <div className="separator" />

        <button onClick={handleSave}
          style={{ padding: '4px 8px', fontSize: 11, color: 'var(--ps-success)' }} title="Save">💾</button>
      </div>

      {/* Click outside menu closes it */}
      {activeMenu && <div onClick={() => setActiveMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />}

      {/* Upload toast */}
      {uploadStatus && (
        <div style={{ position: 'fixed', top: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: 'var(--ps-accent)', color: '#fff', padding: '4px 16px', fontSize: 11 }}>{uploadStatus}</div>
      )}

      {/* ═══════ BODY ═══════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isDesktop && <Toolbar />}
        <Canvas ref={cr} />

        {/* Right panels — desktop */}
        {isDesktop && (
          <div style={{
            width: 'var(--panel-w)', background: 'var(--ps-panel)',
            borderLeft: '1px solid #222', display: 'flex',
            flexDirection: 'column', flexShrink: 0,
          }}>
            {/* Photoshop-style tabs */}
            <div className="ps-tabs">
              {TABS.map(t => (
                <div key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`ps-tab ${tab === t.id ? 'ps-tab-active' : ''}`}>
                  {t.label}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>{renderPanel()}</div>
          </div>
        )}
      </div>

      {/* Mobile */}
      {!isDesktop && (
        <>
          <div style={{
            height: 44, background: 'var(--ps-panel)', borderTop: '1px solid #222',
            display: 'flex', alignItems: 'center', padding: '0 2px', gap: 1,
            flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            <button onClick={() => setActiveMenu(activeMenu === 'File' ? null : 'File')}
              style={{ flex: 1, height: 38, color: 'var(--ps-text-dim)', fontSize: 10, fontWeight: 600 }}>
              File
            </button>
            {TABS.slice(0, 6).map(t => {
              const a = mobileTab === t.id;
              return (
                <button key={t.id} onClick={() => setMobileTab(a ? null : t.id)}
                  style={{
                    flex: 1, height: 38, fontSize: 9, fontWeight: 600,
                    color: a ? '#fff' : 'var(--ps-text-dim)',
                    background: a ? 'var(--ps-hover)' : 'transparent',
                  }}>
                  {t.label}
                </button>
              );
            })}
          </div>
          {mobileTab && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--ps-panel)', display: 'flex', flexDirection: 'column' }}>
              <div className="ps-panel-header" style={{ borderBottom: '1px solid #222' }}>
                <span>{TABS.find(t => t.id === mobileTab)?.label}</span>
                <button onClick={() => setMobileTab(null)} style={{ fontSize: 18, color: 'var(--ps-text-dim)', padding: '0 8px' }}>×</button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {mobileTab === 'layers' && <LayersPanel />}
                {mobileTab === 'adjust' && <QuickActionsPanel />}
                {mobileTab === 'ai' && <AISuggestionsPanel />}
                {mobileTab === 'collage' && <CollagePanel />}
                {mobileTab === 'review' && <ReviewStudio />}
                {mobileTab === 'resize' && <TemplatesPanel />}
                {mobileTab === 'export' && <ExportPanel />}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════ STATUS BAR ═══════ */}
      <div className="ps-statusbar">
        <span>Tool: {state.tool}</span>
        <span style={{ margin: '0 12px' }}>|</span>
        <span>Layers: {doc.layers.length}</span>
        <div style={{ flex: 1 }} />
        <span>{doc.isDirty ? '● Unsaved' : 'Saved'}</span>
        <span style={{ margin: '0 12px', color: '#444' }}>|</span>
        <span style={{ color: '#555' }}>{doc.canvas.width} × {doc.canvas.height} px</span>
      </div>
    </div>
  );
}
