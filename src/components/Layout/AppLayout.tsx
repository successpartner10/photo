import React, { useState, useRef, useCallback, useEffect } from 'react';
import Canvas from '../Canvas/Canvas';
import { useEditor } from '../../store/editorStore';
import MobileStudio from './MobileStudio';
import DesktopPanels from './DesktopPanels';

function DesktopLogo() {
  return (
    <svg width="130" height="24" viewBox="0 0 130 24" style={{ display: 'block' }}>
      <text x="0" y="20" fontFamily="Segoe UI, system-ui, sans-serif" fontWeight="800" fontSize="20" fill="#6c5ce7">ink</text>
      <text x="40" y="20" fontFamily="Segoe UI, system-ui, sans-serif" fontWeight="300" fontSize="20" fill="#888">ception</text>
    </svg>
  );
}

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef } = useEditor();
  const cr = useRef<any>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const [uploading, setUploading] = useState('');

  const cur = state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];
  const canUndo = cur.historyIndex >= 0;
  const canRedo = cur.historyIndex < cur.history.length - 1;

  useEffect(() => {
    const ck = () => setIsDesktop(window.innerWidth >= 1024);
    ck(); window.addEventListener('resize', ck);
    return () => window.removeEventListener('resize', ck);
  }, []);

  const handleNew = () => {
    dispatch({ type: 'CREATE_DOCUMENT', payload: { name: `Design ${state.documents.length + 1}`, width: 1080, height: 1920 } });
    setSheet(null);
  };

  const handleOpen = useCallback(() => {
    const i = document.createElement('input'); i.type = 'file';
    i.accept = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';
    i.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      setUploading(f.name);
      if (cr.current) cr.current.importFile(f);
      setTimeout(() => setUploading(''), 2000);
    };
    i.click();
  }, []);

  const handleSave = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const a = document.createElement('a'); a.download = `${doc.name || 'design'}.png`;
    a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 }); a.click();
  }, [fabricRef, doc.name]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0a0a0a' }}>
      {/* Upload toast */}
      {uploading && (
        <div style={{ position: 'fixed', top: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#6c5ce7', color: '#fff', padding: '8px 20px', borderRadius: '0 0 12px 12px', fontSize: 13, fontWeight: 600 }}>
          Importing {uploading}...
        </div>
      )}

      {/* DESKTOP: top nav */}
      {isDesktop && (
        <div style={{ height: 48, background: '#111', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 0, flexShrink: 0 }}>
          <DesktopLogo />
          <div style={{ flex: 1 }} />
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
            style={{ padding: '8px 12px', fontSize: 14, fontWeight: 600, color: canUndo ? '#aaa' : '#333', borderRadius: 6 }}>Undo</button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
            style={{ padding: '8px 12px', fontSize: 14, fontWeight: 600, color: canRedo ? '#aaa' : '#333', borderRadius: 6 }}>Redo</button>
          <button onClick={handleSave}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#000', background: '#00b894', borderRadius: 6, marginLeft: 8 }}>Save</button>
        </div>
      )}

      {/* MAIN BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Canvas ref={cr} />
        {isDesktop && <DesktopPanels />}
      </div>

      {/* MOBILE STUDIO */}
      {!isDesktop && (
        <MobileStudio
          sheet={sheet} setSheet={setSheet}
          handleNew={handleNew} handleOpen={handleOpen} handleSave={handleSave}
          uploading={uploading} canUndo={canUndo} canRedo={canRedo}
          cur={cur} doc={doc} state={state} dispatch={dispatch}
          saveSnapshot={saveSnapshot} fabricRef={fabricRef} cr={cr}
        />
      )}
    </div>
  );
}
