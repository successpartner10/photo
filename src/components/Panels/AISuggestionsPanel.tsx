import React, { useState, useEffect, useCallback } from 'react';
import { useEditor } from '../../store/editorStore';
import { applyAutoEnhance, applyBackgroundRemoval, applyStyleFilter, applyGenerativeFill, applySmartText, applyAnimate } from '../../ai/aiEffects';
import { applyUpscale4x } from '../../ai/aiUpscale';
import { rasterToCanvasVectors } from '../../ai/aiVectorize';

// ── Dynamic AI capabilities registry ──
const AI_PRESETS = [
  { id: 'enhance', label: 'Auto Enhance', desc: 'Color + exposure + sharpness fix', icon: '✦', color: 'var(--accent)', action: 'auto-enhance' },
  { id: 'bg-remove', label: 'Remove Background', desc: 'AI matting & segmentation', icon: '◉', color: 'var(--accent3)', action: 'background-remove' },
  { id: 'bw', label: 'Black & White', desc: 'Classic monochrome', icon: '◐', color: 'var(--text-secondary)', action: 'style-filter', style: 'bw' },
  { id: 'vintage', label: 'Vintage Film', desc: 'Sepia + contrast fade', icon: '◒', color: 'var(--accent6)', action: 'style-filter', style: 'vintage' },
  { id: 'warm', label: 'Warm Tone', desc: 'Golden hour warmth', icon: '☀', color: 'var(--accent2)', action: 'style-filter', style: 'warm' },
  { id: 'cool', label: 'Cool Tone', desc: 'Crisp blue undertones', icon: '❆', color: 'var(--info)', action: 'style-filter', style: 'cool' },
  { id: 'dramatic', label: 'Dramatic', desc: 'High contrast punch', icon: '◆', color: 'var(--danger)', action: 'style-filter', style: 'dramatic' },
  { id: 'soft', label: 'Soft Glow', desc: 'Dreamy blur + brighten', icon: '◇', color: 'var(--accent5)', action: 'style-filter', style: 'soft' },
  { id: 'upscale', label: 'Upscale 4×', desc: 'Lanczos bicubic + sharpen', icon: '⬍', color: 'var(--accent)', action: 'upscale-4x' },
  { id: 'vector', label: 'Vectorize', desc: 'Trace → SVG vector paths', icon: '▣', color: 'var(--accent3)', action: 'vectorize' },
  { id: 'text', label: 'Smart Text', desc: 'AI headline + subtitle', icon: 'T', color: 'var(--accent4)', action: 'smart-text' },
  { id: 'animate', label: 'Animate', desc: 'Motion blur from still', icon: '▶', color: 'var(--accent2)', action: 'animate' },
];

const PAGE_SIZE = 4;

export default function AISuggestionsPanel() {
  const { fabricRef, addLayer, saveSnapshot } = useEditor();
  const [page, setPage] = useState(0);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? AI_PRESETS.filter(p => p.label.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase()))
    : AI_PRESETS;

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Auto-advance pages
  useEffect(() => {
    if (page >= pages) setPage(0);
  }, [pages, page]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPage(p => (p + 1) % Math.max(pages, 1));
    }, 8000);
    return () => clearInterval(interval);
  }, [pages]);

  const runAction = useCallback(async (preset: typeof AI_PRESETS[0]) => {
    const canvas = fabricRef.current; if (!canvas) return;
    setRunning(preset.id);
    try {
      const c = canvas;
      switch (preset.action) {
        case 'auto-enhance': await applyAutoEnhance(c); break;
        case 'background-remove': await applyBackgroundRemoval(c); break;
        case 'style-filter': await applyStyleFilter(c, preset.style || 'bw'); break;
        case 'upscale-4x': await applyUpscale4x(c, addLayer); break;
        case 'vectorize': await rasterToCanvasVectors(c, addLayer); break;
        case 'smart-text': await applySmartText(c, addLayer); break;
        case 'animate': await applyAnimate(c); break;
      }
      saveSnapshot();
      setResults(prev => [preset.label, ...prev].slice(0, 10));
    } catch (e) { console.error(e); }
    setRunning(null);
  }, [fabricRef, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">✦ AI SUGGESTIONS</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 700, letterSpacing: 1, color: 'var(--text-disabled)' }}>
          {filtered.length} CAPABILITIES
        </span>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Find effects..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{ width: '100%', padding: '7px 8px 7px 26px', fontSize: 10, borderRadius: 'var(--radius)', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }} />
        </div>
      </div>

      {/* Suggestions grid — 4 per page */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {currentPage.map(p => {
            const isRunning = running === p.id;
            return (
              <button key={p.id} onClick={() => runAction(p)} disabled={!!running}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 8px', borderRadius: 'var(--radius)',
                  border: `1px solid ${isRunning ? p.color : 'var(--border-default)'}`,
                  background: isRunning ? `${p.color}10` : 'var(--bg-elevated)',
                  cursor: running ? 'wait' : 'pointer', textAlign: 'center',
                  opacity: running ? 0.6 : 1, transition: 'all 0.12s',
                  borderLeft: `3px solid ${p.color}`,
                }}
                onMouseEnter={e => { if (!running) e.currentTarget.style.borderColor = p.color; }}
                onMouseLeave={e => { if (!running) e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: running ? p.color : 'var(--text-primary)' }}>
                    {p.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 8, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.desc}
                  </div>
                </div>
                {isRunning && <span style={{ fontSize: 12, animation: 'spin 1s linear infinite', color: p.color }}>⟳</span>}
              </button>
            );
          })}
        </div>

        {/* Pagination dots */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{
                width: i === page ? 16 : 6, height: 6, borderRadius: 3,
                background: i === page ? 'var(--accent)' : 'var(--border-default)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }} />
            ))}
          </div>
        )}

        {/* Page indicator */}
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <button onClick={() => setPage(p => (p + 1) % pages)} style={{
            padding: '5px 12px', borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
            border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            MORE SUGGESTIONS ({page + 1}/{pages})
          </button>
        </div>

        {/* Recent results */}
        {results.length > 0 && (
          <div style={{ marginTop: 14, padding: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-disabled)', marginBottom: 6 }}>
              RECENTLY APPLIED
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {results.map((r, i) => (
                <span key={i} style={{
                  padding: '3px 8px', borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700,
                  background: 'rgba(124,92,252,0.08)', color: 'var(--accent)',
                  border: '1px solid rgba(124,92,252,0.15)',
                }}>{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 8, color: 'var(--text-disabled)' }}>
        AI continuously learning · New capabilities added weekly
      </div>
    </div>
  );
}
