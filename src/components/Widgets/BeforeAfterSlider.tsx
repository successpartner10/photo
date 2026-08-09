import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  beforeImage?: string;
  afterImage?: string;
  label?: string;
  onClose?: () => void;
}

export default function BeforeAfterSlider({ beforeImage, afterImage, label = 'Before / After', onClose }: Props) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handleMouseDown = useCallback(() => { draggingRef.current = true; }, []);
  const handleMouseUp = useCallback(() => { draggingRef.current = false; }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      setSliderPos(x);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const defaultBefore = beforeImage || 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#e0e0e0" width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="#999" font-size="18">Before</text></svg>'
  );
  const defaultAfter = afterImage || 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#d0e8d0" width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="#4CAF50" font-size="18">After</text></svg>'
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1e1e1e', borderRadius: 12, padding: 16,
        border: '1px solid #333', maxWidth: '90vw', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>{label}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        {/* Comparison container */}
        <div ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          style={{
            position: 'relative', width: '100%', maxWidth: 700, height: 400,
            overflow: 'hidden', borderRadius: 8, cursor: 'ew-resize',
            userSelect: 'none', border: '1px solid #444',
          }}
        >
          {/* After image (full underneath) */}
          <img src={defaultAfter} alt="After" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }} />

          {/* Before image (clipped) */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: `${sliderPos}%`, height: '100%',
            overflow: 'hidden',
          }}>
            <img src={defaultBefore} alt="Before" style={{
              position: 'absolute', top: 0, left: 0,
              width: `${containerRef.current ? containerRef.current.offsetWidth : 700}px`,
              height: '100%', objectFit: 'cover', minWidth: '100%',
            }} />
          </div>

          {/* Slider line */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${sliderPos}%`, width: 3,
            background: '#7C5CFC', boxShadow: '0 0 8px rgba(124,92,252,0.6)',
            transform: 'translateX(-50%)',
          }} />

          {/* Slider handle */}
          <div style={{
            position: 'absolute', top: '50%', left: `${sliderPos}%`,
            transform: 'translate(-50%, -50%)',
            width: 40, height: 40, borderRadius: '50%',
            background: '#7C5CFC', border: '3px solid #fff',
            boxShadow: '0 0 12px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#fff', fontWeight: 700,
          }}>
            ⇔
          </div>

          {/* Labels */}
          <div style={{
            position: 'absolute', bottom: 10, left: 15,
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            padding: '2px 10px', borderRadius: 4, fontSize: 11,
          }}>
            Before
          </div>
          <div style={{
            position: 'absolute', bottom: 10, right: 15,
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            padding: '2px 10px', borderRadius: 4, fontSize: 11,
          }}>
            After
          </div>
        </div>

        {/* Export/share bar */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button style={actionBtn}>📋 Copy Comparison</button>
          <button style={{ ...actionBtn, background: '#7C5CFC' }}>📤 Export as Widget</button>
          <button style={actionBtn}>🔗 Share Link</button>
        </div>
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #444',
  background: '#2a2a2a', color: '#ccc', cursor: 'pointer', fontSize: 12,
};
