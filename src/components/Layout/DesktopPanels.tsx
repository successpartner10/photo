import React, { useState } from 'react';
import LayersPanel from '../Panels/LayersPanel';
import QuickActionsPanel from '../Panels/QuickActionsPanel';
import AISuggestionsPanel from '../Panels/AISuggestionsPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import ReviewStudio from '../Panels/ReviewStudio';
import CollagePanel from '../Panels/CollagePanel';

type Tab = 'layers' | 'adjust' | 'ai' | 'collage' | 'preview' | 'resize' | 'export';

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'layers', label: 'Layers', color: '#6c5ce7' },
  { id: 'adjust', label: 'Effects', color: '#e84393' },
  { id: 'ai', label: 'AI', color: '#00cec9' },
  { id: 'collage', label: 'Layout', color: '#fdcb6e' },
  { id: 'preview', label: 'Preview', color: '#74b9ff' },
  { id: 'resize', label: 'Resize', color: '#00b894' },
  { id: 'export', label: 'Export', color: '#00b894' },
];

export default function DesktopPanels() {
  const [tab, setTab] = useState<Tab>('layers');

  return (
    <div style={{ width: 300, background: '#111', borderLeft: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', background: '#1a1a1a', borderBottom: '1px solid #2a2a2a', height: 40, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '0 12px', fontSize: 11, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? t.color : '#555', whiteSpace: 'nowrap', borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent', borderRadius: 0, background: 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'layers' && <LayersPanel />}
        {tab === 'adjust' && <QuickActionsPanel />}
        {tab === 'ai' && <AISuggestionsPanel />}
        {tab === 'collage' && <CollagePanel />}
        {tab === 'preview' && <ReviewStudio />}
        {tab === 'resize' && <TemplatesPanel />}
        {tab === 'export' && <ExportPanel />}
      </div>
    </div>
  );
}
