import React, { useState, useRef, useCallback, useEffect } from 'react';
import Canvas from '../Canvas/Canvas';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';
import MobileStudio from './MobileStudio';
import DesktopPanels from './DesktopPanels';

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef } = useEditor();
  const cr = useRef<any>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sheet, setSheet] = useState<'menu' | 'layers' | 'effects' | 'ai' | 'export' | 'resize' | null>(null);
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

  const mobileProps = { sheet, setSheet, handleNew, handleOpen, handleSave, uploading, canUndo, canRedo, cur, doc, state, dispatch, saveSnapshot, fabricRef, cr };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* Upload toast */}
      {uploading && (
        <div style={{ position: 'fixed', top: 'var(--nav-h)', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'var(--accent)', color: '#fff', padding: '8px 20px', borderRadius: '0 0 var(--radius) var(--radius)', fontSize: 13, fontWeight: 600 }}>Importing {uploading}...</div>
      )}

      {/* ═══ MAIN BODY ═══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Canvas ref={cr} />
        {isDesktop && <DesktopPanels />}
      </div>

      {/* ═══ MOBILE STUDIO ═══ */}
      {!isDesktop && <MobileStudio {...mobileProps} />}
    </div>
  );
}
