import React from 'react';
import { EditorProvider } from './store/editorStore';
import AppLayout from './components/Layout/AppLayout';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e.message || String(e) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0a0a', color: '#ccc', fontFamily: 'system-ui, sans-serif',
          padding: 40, textAlign: 'center',
        }}>
          <h1 style={{ fontWeight: 800, marginBottom: 12, color: '#a78bfa' }}>Inkception</h1>
          <p style={{ color: '#f87171', marginBottom: 16 }}>Something went wrong loading the editor.</p>
          <pre style={{
            background: '#111', padding: 16, borderRadius: 8, maxWidth: 600,
            overflow: 'auto', fontSize: 12, color: '#888', textAlign: 'left',
          }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()}
            style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 6,
              background: '#7c5cfc', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <EditorProvider>
        <AppLayout />
      </EditorProvider>
    </ErrorBoundary>
  );
}
