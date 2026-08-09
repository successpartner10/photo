import React, { useState, useCallback, useEffect } from 'react';
import { useEditor } from '../../store/editorStore';
import { applyAutoEnhance, applyBackgroundRemoval, applyStyleFilter, applySmartText, applyAnimate } from '../../ai/aiEffects';
import { applyUpscale4x } from '../../ai/aiUpscale';
import { rasterToCanvasVectors } from '../../ai/aiVectorize';

const AI = [
  { id: 'enhance', label: 'Auto Enhance', desc: 'Color, exposure & sharpness', action: 'auto-enhance' },
  { id: 'bg', label: 'Remove Background', desc: 'AI matting & segmentation', action: 'bg-remove' },
  { id: 'bw', label: 'Black & White', desc: 'Monochrome conversion', action: 'style', style: 'bw' },
  { id: 'vintage', label: 'Vintage Film', desc: 'Sepia + contrast fade', action: 'style', style: 'vintage' },
  { id: 'warm', label: 'Warm Tone', desc: 'Golden hour warmth', action: 'style', style: 'warm' },
  { id: 'cool', label: 'Cool Tone', desc: 'Blue undertones', action: 'style', style: 'cool' },
  { id: 'dramatic', label: 'Dramatic', desc: 'High contrast punch', action: 'style', style: 'dramatic' },
  { id: 'soft', label: 'Soft Glow', desc: 'Blur + brighten', action: 'style', style: 'soft' },
  { id: 'upscale', label: 'Upscale 4×', desc: 'Lanczos bicubic + sharpen', action: 'upscale' },
  { id: 'vector', label: 'Vectorize', desc: 'Trace → SVG paths', action: 'vectorize' },
  { id: 'text', label: 'Smart Text', desc: 'AI headline + subtitle', action: 'text' },
  { id: 'animate', label: 'Motion Blur', desc: 'Animate still image', action: 'animate' },
];

export default function AISuggestionsPanel() {
  const { fabricRef, addLayer, saveSnapshot } = useEditor();
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);

  const runAI = useCallback(async (item: typeof AI[0]) => {
    const c = fabricRef.current; if (!c) return;
    setRunning(item.id);
    try {
      switch (item.action) {
        case 'auto-enhance': await applyAutoEnhance(c); break;
        case 'bg-remove': await applyBackgroundRemoval(c); break;
        case 'style': await applyStyleFilter(c, item.style || 'bw'); break;
        case 'upscale': await applyUpscale4x(c, addLayer); break;
        case 'vectorize': await rasterToCanvasVectors(c, addLayer); break;
        case 'text': await applySmartText(c, addLayer); break;
        case 'animate': await applyAnimate(c); break;
      }
      saveSnapshot();
      setResults(prev => [item.label, ...prev].slice(0, 8));
    } catch (e) { console.error(e); }
    setRunning(null);
  }, [fabricRef, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ps-panel)' }}>
      <div style={{
        padding: 16, background: '#222', borderBottom: '1px solid #1a1a1a',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ps-text)' }}>AI Tools</div>
        <div style={{ fontSize: 10, color: 'var(--ps-text-muted)', marginTop: 2 }}>One-click smart edits</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {AI.map(item => (
            <button key={item.id}
              onClick={() => runAI(item)}
              disabled={!!running}
              style={{
                padding: '10px 8px', fontSize: 10, cursor: running ? 'wait' : 'pointer',
                background: running === item.id ? 'var(--ps-hover)' : 'var(--ps-input)',
                border: running === item.id ? '1px solid var(--ps-accent)' : '1px solid #333',
                color: running === item.id ? '#fff' : 'var(--ps-text-dim)',
                textAlign: 'left', opacity: running ? 0.6 : 1,
              }}>
              <div style={{ fontWeight: 600, marginBottom: 1 }}>{item.label}</div>
              <div style={{ fontSize: 9, color: 'var(--ps-text-muted)' }}>{item.desc}</div>
              {running === item.id && <div style={{ fontSize: 9, color: 'var(--ps-accent)', marginTop: 2 }}>Processing...</div>}
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: 12, padding: 8, background: 'var(--ps-input)', border: '1px solid #222' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ps-text-muted)', marginBottom: 4 }}>Recently Applied</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {results.map((r, i) => (
                <span key={i} style={{ fontSize: 9, padding: '2px 6px', background: '#222', color: 'var(--ps-text-dim)', border: '1px solid #333' }}>{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
