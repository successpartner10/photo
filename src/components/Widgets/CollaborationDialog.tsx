import React, { useState } from 'react';

interface Props {
  projectName: string;
  onClose: () => void;
}

export default function CollaborationDialog({ projectName, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');

  const shareLink = `https://designeditor.app/p/${encodeURIComponent(projectName.toLowerCase().replace(/\s+/g, '-'))}-${Math.random().toString(36).slice(2, 8)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1e1e1e', borderRadius: 12, padding: 20,
        border: '1px solid #333', width: 420, maxWidth: '90vw',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>👥 Share & Collaborate</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
          Share "{projectName}" with others
        </div>

        {/* Permission */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#777', marginBottom: 6, textTransform: 'uppercase' }}>Permission</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['view', 'edit'] as const).map(p => (
              <button key={p} onClick={() => setPermission(p)} style={{
                flex: 1, padding: '8px', borderRadius: 6,
                border: permission === p ? '1px solid #7C5CFC' : '1px solid #333',
                background: permission === p ? '#7C5CFC22' : '#1a1a1a',
                color: permission === p ? '#fff' : '#888', cursor: 'pointer',
                fontSize: 12, textTransform: 'capitalize',
              }}>
                {p === 'view' ? '👁 View only' : '✏️ Can edit'}
              </button>
            ))}
          </div>
        </div>

        {/* Link */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#777', marginBottom: 6, textTransform: 'uppercase' }}>Shareable Link</div>
          <div style={{
            display: 'flex', gap: 6, padding: '6px 10px', background: '#111',
            borderRadius: 6, border: '1px solid #333', alignItems: 'center',
          }}>
            <span style={{ flex: 1, fontSize: 11, color: '#7C5CFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shareLink}
            </span>
            <button onClick={handleCopy} style={{
              padding: '4px 12px', borderRadius: 4, border: 'none',
              background: copied ? '#4CAF50' : '#7C5CFC',
              color: '#fff', cursor: 'pointer', fontSize: 11,
            }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Collaborators */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#777', marginBottom: 6, textTransform: 'uppercase' }}>Collaborators</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#7C5CFC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 600,
            }}>Y</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>You (Owner)</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#555' }}>
            🔒 Real-time co-editing · Coming soon
          </div>
        </div>

        {/* Comments */}
        <div style={{
          padding: 10, background: '#111', borderRadius: 6, border: '1px solid #333',
        }}>
          <div style={{ fontSize: 10, color: '#777', marginBottom: 6 }}>Comments</div>
          <div style={{ fontSize: 11, color: '#666', textAlign: 'center', padding: '8px' }}>
            💬 Comment system · Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
