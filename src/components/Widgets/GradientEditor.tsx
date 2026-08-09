import React, { useState, useCallback } from 'react';

interface GradientStop {
  offset: number;
  color: string;
}

interface Props {
  onApply: (gradient: { type: 'linear' | 'radial'; angle: number; stops: GradientStop[] }) => void;
  onClose: () => void;
}

export default function GradientEditor({ onApply, onClose }: Props) {
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(0);
  const [stops, setStops] = useState<GradientStop[]>([
    { offset: 0, color: '#ff6b6b' },
    { offset: 100, color: '#6c5ce7' },
  ]);

  const addStop = () => {
    const midOffset = stops.length === 1 ? 50 : stops[0].offset + (stops[stops.length - 1].offset - stops[0].offset) / 2;
    setStops([...stops, { offset: Math.round(midOffset), color: '#ffffff' }].sort((a, b) => a.offset - b.offset));
  };

  const removeStop = (idx: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((_, i) => i !== idx));
  };

  const updateStop = (idx: number, changes: Partial<GradientStop>) => {
    setStops(stops.map((s, i) => i === idx ? { ...s, ...changes } : s));
  };

  const gradientCSS = type === 'linear'
    ? `linear-gradient(${angle}deg, ${stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`
    : `radial-gradient(circle, ${stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1e1e1e', borderRadius: 12, padding: 20,
        border: '1px solid #333', width: 380, maxWidth: '90vw',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>◧ Gradient Editor</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {/* Preview */}
        <div style={{
          width: '100%', height: 60, borderRadius: 8,
          background: gradientCSS, marginBottom: 16,
          border: '1px solid #333',
        }} />

        {/* Type */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['linear', 'radial'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '8px', borderRadius: 6,
              border: type === t ? '1px solid #7C5CFC' : '1px solid #333',
              background: type === t ? '#7C5CFC22' : '#1a1a1a',
              color: type === t ? '#fff' : '#888', cursor: 'pointer',
              fontSize: 12, textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {/* Angle (linear only) */}
        {type === 'linear' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#777', marginBottom: 4 }}>Angle: {angle}°</div>
            <input type="range" min={0} max={360} value={angle}
              onChange={e => setAngle(+e.target.value)}
              style={{ width: '100%', accentColor: '#7C5CFC' }} />
          </div>
        )}

        {/* Stops */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#777' }}>Color Stops</span>
            <button onClick={addStop} style={{
              background: 'transparent', border: '1px solid #444', borderRadius: 4,
              color: '#aaa', cursor: 'pointer', fontSize: 10, padding: '2px 8px',
            }}>+ Add Stop</button>
          </div>
          {stops.map((stop, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input type="color" value={stop.color}
                onChange={e => updateStop(i, { color: e.target.value })}
                style={{ width: 32, height: 28, border: '1px solid #444', borderRadius: 4, cursor: 'pointer', background: 'transparent' }} />
              <input type="range" min={0} max={100} value={stop.offset}
                onChange={e => updateStop(i, { offset: +e.target.value })}
                style={{ flex: 1, accentColor: '#7C5CFC' }} />
              <span style={{ fontSize: 10, color: '#888', width: 32, textAlign: 'right' }}>{stop.offset}%</span>
              <button onClick={() => removeStop(i)}
                disabled={stops.length <= 2}
                style={{
                  background: 'none', border: 'none', color: stops.length <= 2 ? '#333' : '#E85D75',
                  cursor: stops.length <= 2 ? 'default' : 'pointer', fontSize: 14,
                }}>×</button>
            </div>
          ))}
        </div>

        {/* Apply */}
        <button onClick={() => onApply({ type, angle, stops })} style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: '#7C5CFC', color: '#fff', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>
          Apply Gradient
        </button>
      </div>
    </div>
  );
}
