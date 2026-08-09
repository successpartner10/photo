import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import {
  EditorState, EditorLayer, ToolType, CanvasState, AIOperation,
  DocumentTab, BlendMode, SmartObject, ClippingMask
} from '../types/editor';

// ---- Helpers ----
function makeId(prefix = 'layer'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_CANVAS: CanvasState = {
  zoom: 1, panX: 0, panY: 0, width: 1200, height: 800, backgroundColor: '#ffffff',
};

function makeDoc(name: string, w: number, h: number): DocumentTab {
  return {
    id: makeId('doc'),
    name,
    canvas: { ...DEFAULT_CANVAS, width: w, height: h },
    layers: [
      { id: 'bg-1', name: 'Background', type: 'raster', visible: true, locked: false,
        opacity: 1, blendMode: 'normal', isGroup: false },
    ],
    history: [], historyIndex: -1, isDirty: false, lastSaved: null,
  };
}

const initialState: EditorState = {
  documents: [makeDoc('Untitled Project', 1200, 800)],
  activeDocumentId: '',
  tool: 'select' as ToolType,
  isDrawing: false,
  globalSettings: { basicMode: false, snapToGrid: true, showGuides: true, autosaveInterval: 30000 },
};
initialState.activeDocumentId = initialState.documents[0].id;

// ---- Helpers to get current doc from state ----
function currentDoc(state: EditorState): DocumentTab {
  return state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];
}
function updateCurrentDoc(state: EditorState, updater: (doc: DocumentTab) => DocumentTab): EditorState {
  return {
    ...state,
    documents: state.documents.map(d => d.id === state.activeDocumentId ? updater(d) : d),
  };
}
function pushDocHistory(doc: DocumentTab): DocumentTab {
  const snap = JSON.stringify({ layers: doc.layers, canvas: doc.canvas });
  const newHistory = doc.history.slice(0, doc.historyIndex + 1);
  newHistory.push(snap);
  return { ...doc, history: newHistory.slice(-100), historyIndex: newHistory.length - 1, isDirty: true };
}

// ---- Actions ----
type EditorAction =
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'SET_BASIC_MODE'; payload: boolean }
  | { type: 'CREATE_DOCUMENT'; payload: { name: string; width: number; height: number } }
  | { type: 'CLOSE_DOCUMENT'; payload: string }
  | { type: 'SWITCH_DOCUMENT'; payload: string }
  | { type: 'RENAME_DOCUMENT'; payload: { id: string; name: string } }
  | { type: 'ADD_LAYER'; payload: EditorLayer }
  | { type: 'REMOVE_LAYER'; payload: string }
  | { type: 'UPDATE_LAYER'; payload: { id: string; changes: Partial<EditorLayer> } }
  | { type: 'REORDER_LAYERS'; payload: EditorLayer[] }
  | { type: 'DUPLICATE_LAYER'; payload: string }
  | { type: 'MERGE_LAYERS'; payload: string[] }
  | { type: 'SET_CANVAS'; payload: Partial<CanvasState> }
  | { type: 'PUSH_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_AUTOSAVE'; payload: number }
  | { type: 'MARK_SAVED' };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, tool: action.payload };
    case 'SET_BASIC_MODE':
      return { ...state, globalSettings: { ...state.globalSettings, basicMode: action.payload } };
    case 'CREATE_DOCUMENT': {
      const doc = makeDoc(action.payload.name, action.payload.width, action.payload.height);
      return { ...state, documents: [...state.documents, doc], activeDocumentId: doc.id };
    }
    case 'CLOSE_DOCUMENT': {
      const remaining = state.documents.filter(d => d.id !== action.payload);
      if (remaining.length === 0) {
        const newDoc = makeDoc('Untitled Project', 1200, 800);
        return { ...state, documents: [newDoc], activeDocumentId: newDoc.id };
      }
      return { ...state, documents: remaining, activeDocumentId: remaining[remaining.length - 1].id };
    }
    case 'SWITCH_DOCUMENT':
      return { ...state, activeDocumentId: action.payload };
    case 'RENAME_DOCUMENT':
      return { ...state, documents: state.documents.map(d => d.id === action.payload.id ? { ...d, name: action.payload.name } : d) };
    case 'ADD_LAYER':
      return updateCurrentDoc(state, doc => ({ ...doc, layers: [...doc.layers, action.payload], isDirty: true }));
    case 'REMOVE_LAYER':
      return updateCurrentDoc(state, doc => ({
        ...doc, layers: doc.layers.filter(l => l.id !== action.payload), isDirty: true
      }));
    case 'UPDATE_LAYER':
      return updateCurrentDoc(state, doc => ({
        ...doc, layers: doc.layers.map(l => l.id === action.payload.id ? { ...l, ...action.payload.changes } : l), isDirty: true
      }));
    case 'REORDER_LAYERS':
      return updateCurrentDoc(state, doc => ({ ...doc, layers: action.payload, isDirty: true }));
    case 'DUPLICATE_LAYER': {
      const doc = currentDoc(state);
      const src = doc.layers.find(l => l.id === action.payload);
      if (!src) return state;
      const copy: EditorLayer = { ...src, id: makeId('layer'), name: src.name + ' copy', fabricObjectId: undefined };
      return updateCurrentDoc(state, d => ({ ...d, layers: [...d.layers, copy], isDirty: true }));
    }
    case 'MERGE_LAYERS': {
      const doc = currentDoc(state);
      const toMerge = doc.layers.filter(l => action.payload.includes(l.id));
      if (toMerge.length < 2) return state;
      const merged: EditorLayer = {
        id: makeId('layer'), name: 'Merged', type: 'raster',
        visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false,
      };
      return updateCurrentDoc(state, d => ({
        ...d, layers: d.layers.filter(l => !action.payload.includes(l.id)).concat(merged), isDirty: true
      }));
    }
    case 'SET_CANVAS':
      return updateCurrentDoc(state, doc => ({ ...doc, canvas: { ...doc.canvas, ...action.payload }, isDirty: true }));
    case 'PUSH_HISTORY':
      return updateCurrentDoc(state, doc => pushDocHistory(doc));
    case 'UNDO': {
      const doc = currentDoc(state);
      if (doc.historyIndex < 0) return state;
      const prev = JSON.parse(doc.history[doc.historyIndex]);
      return updateCurrentDoc(state, d => ({
        ...d, layers: prev.layers, canvas: prev.canvas, historyIndex: d.historyIndex - 1, isDirty: true
      }));
    }
    case 'REDO': {
      const doc = currentDoc(state);
      if (doc.historyIndex >= doc.history.length - 1) return state;
      const next = JSON.parse(doc.history[doc.historyIndex + 1]);
      return updateCurrentDoc(state, d => ({
        ...d, layers: next.layers, canvas: next.canvas, historyIndex: d.historyIndex + 1, isDirty: true
      }));
    }
    case 'SET_AUTOSAVE':
      return { ...state, globalSettings: { ...state.globalSettings, autosaveInterval: action.payload } };
    case 'MARK_SAVED':
      return updateCurrentDoc(state, doc => ({ ...doc, isDirty: false, lastSaved: Date.now() }));
    default:
      return state;
  }
}

// ---- Context ----
interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  fabricRef: React.MutableRefObject<any | null>;
  aiOperations: React.MutableRefObject<AIOperation[]>;
  smartObjects: React.MutableRefObject<Map<string, SmartObject>>;
  clippingMasks: React.MutableRefObject<Map<string, ClippingMask>>;
  // convenience
  doc: DocumentTab;
  addLayer: (layer: Omit<EditorLayer, 'id'> & { id?: string }) => string;
  saveSnapshot: () => void;
  updateLayerProp: (id: string, changes: Partial<EditorLayer>) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  exportCanvas: (format: string, quality?: number, dpi?: number) => string | void;
  importImage: (dataUrl: string, name?: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const fabricRef = useRef<any>(null);
  const aiOpsRef = useRef<AIOperation[]>([]);
  const smartObjectsRef = useRef<Map<string, SmartObject>>(new Map());
  const clippingMasksRef = useRef<Map<string, ClippingMask>>(new Map());

  const doc = state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];

  // ---- Autosave ----
  useEffect(() => {
    if (state.globalSettings.autosaveInterval <= 0) return;
    const timer = setInterval(() => {
      const d = state.documents.find(doc => doc.id === state.activeDocumentId);
      if (d?.isDirty) {
        const key = `autosave_${d.id}`;
        localStorage.setItem(key, JSON.stringify({ ...d, savedAt: Date.now() }));
        dispatch({ type: 'MARK_SAVED' });
      }
    }, state.globalSettings.autosaveInterval);
    return () => clearInterval(timer);
  }, [state.globalSettings.autosaveInterval, state.activeDocumentId, state.documents]);

  // Load autosave on startup
  useEffect(() => {
    if (state.documents.length === 1 && !state.documents[0].isDirty) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('autosave_'));
      if (keys.length > 0) {
        const saved = JSON.parse(localStorage.getItem(keys[0])!);
        if (saved && saved.canvas) {
          // Could restore here
        }
      }
    }
  }, []);

  const addLayer = useCallback((layer: Omit<EditorLayer, 'id'> & { id?: string }): string => {
    const id = layer.id || makeId('layer');
    dispatch({ type: 'ADD_LAYER', payload: { ...layer, id } as EditorLayer });
    return id;
  }, []);

  const saveSnapshot = useCallback(() => { dispatch({ type: 'PUSH_HISTORY' }); }, []);

  const updateLayerProp = useCallback((id: string, changes: Partial<EditorLayer>) => {
    dispatch({ type: 'UPDATE_LAYER', payload: { id, changes } });
  }, []);

  const removeLayer = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_LAYER', payload: id });
  }, []);

  const duplicateLayer = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_LAYER', payload: id });
  }, []);

  // ---- Export functionality ----
  const exportCanvas = useCallback((format: string, quality = 0.9, dpi = 72): string | void => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const scale = dpi / 72;
    const w = state.documents.find(d => d.id === state.activeDocumentId)?.canvas.width || 1200;
    const h = state.documents.find(d => d.id === state.activeDocumentId)?.canvas.height || 800;

    const dataURL = canvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : (format === 'webp' ? 'webp' : 'png'),
      quality,
      multiplier: scale,
      width: w * scale,
      height: h * scale,
    });

    if (format === 'svg') {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `${doc?.name || 'export'}.${format}`;
    link.href = dataURL;
    link.click();
    return dataURL;
  }, [fabricRef, state.activeDocumentId, state.documents, doc]);

  // ---- Import image ----
  const importImage = useCallback(async (dataUrl: string, name = 'Imported Image') => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const img = await new Promise<HTMLImageElement>((resolve) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.src = dataUrl;
    });

    const { Image: FabricImage } = await import('fabric');
    const fImg = new FabricImage(img, {
      left: doc.canvas.width / 2 - img.width / 2,
      top: doc.canvas.height / 2 - img.height / 2,
    });
    fImg.scaleToWidth(Math.min(img.width, doc.canvas.width * 0.8));
    canvas.add(fImg);
    canvas.setActiveObject(fImg);
    canvas.renderAll();
    addLayer({ name, type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false, fabricObjectId: `import-${Date.now()}` });
    saveSnapshot();
  }, [fabricRef, doc.canvas, addLayer, saveSnapshot]);

  const ctx: EditorContextValue = {
    state, dispatch, fabricRef, aiOperations: aiOpsRef,
    smartObjects: smartObjectsRef, clippingMasks: clippingMasksRef,
    doc, addLayer, saveSnapshot, updateLayerProp, removeLayer, duplicateLayer,
    exportCanvas, importImage,
  };

  return <EditorContext.Provider value={ctx}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor inside EditorProvider');
  return ctx;
}
