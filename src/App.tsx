import { EditorProvider } from './store/editorStore';
import AppLayout from './components/Layout/AppLayout';

export default function App() {
  return (
    <EditorProvider>
      <AppLayout />
    </EditorProvider>
  );
}
