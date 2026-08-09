// ---- Complete Type Definitions for AI-Powered Design Editor ----

export type ToolType =
  | 'select' | 'move' | 'rect' | 'ellipse' | 'line'
  | 'text' | 'pen' | 'brush' | 'eraser' | 'fill'
  | 'eyedropper' | 'gradient' | 'clone' | 'healing'
  | 'magic-wand' | 'lasso' | 'marquee' | 'shape-builder';

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken'
  | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light'
  | 'soft-light' | 'difference' | 'exclusion';

export type LayerType = 'raster' | 'vector' | 'text' | 'adjustment' | 'smart-object' | 'group';

export type ShapeBuilderMode = 'union' | 'subtract' | 'intersect' | 'difference';

export type FilterType =
  | 'blur' | 'sharpen' | 'noise' | 'pixelate' | 'emboss'
  | 'edge-detect' | 'grayscale' | 'sepia' | 'invert'
  | 'brightness' | 'contrast' | 'saturation' | 'hue-rotate'
  | 'vintage' | 'cool-tone' | 'warm-tone';

export interface FilterDef {
  type: FilterType;
  label: string;
  icon: string;
  category: 'blur' | 'color' | 'artistic' | 'stylize';
}

export interface SmartObject {
  id: string;
  sourceLayerId: string;
  originalData: string; // data URL of original
  width: number;
  height: number;
  transforms: string[]; // history of applied transforms
}

export interface ClippingMask {
  id: string;
  maskLayerId: string;
  targetLayerId: string;
}

export interface EditorLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  fabricObjectId?: string;
  parentId?: string;
  children?: string[];
  isGroup: boolean;
  smartObjectRef?: string;
  clippingMaskId?: string;
}

export interface DocumentTab {
  id: string;
  name: string;
  layers: EditorLayer[];
  canvas: CanvasState;
  history: string[];
  historyIndex: number;
  isDirty: boolean;
  lastSaved: number | null;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
  backgroundColor: string;
}

export interface EditorState {
  documents: DocumentTab[];
  activeDocumentId: string;
  tool: ToolType;
  isDrawing: boolean;
  globalSettings: {
    basicMode: boolean;
    snapToGrid: boolean;
    showGuides: boolean;
    autosaveInterval: number; // ms, 0 = off
  };
}

export interface PlatformPreset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  safeZone?: { top: number; right: number; bottom: number; left: number };
}

export interface ExportPreset {
  id: string;
  name: string;
  format: ExportFormat;
  quality?: number;
  dpi?: number;
  transparency?: boolean;
  colorProfile?: 'sRGB' | 'AdobeRGB' | 'CMYK';
}

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' | 'gif' | 'tiff' | 'psd';

export type AIAction =
  | 'auto-enhance' | 'background-remove' | 'generative-fill'
  | 'generative-expand' | 'style-filter' | 'animate'
  | 'layer-segment' | 'upscale' | 'smart-text';

export type AIFilterStyle = 'bw' | 'cool' | 'warm' | 'vintage' | 'dramatic' | 'soft';

export interface AIOperation {
  id: string;
  action: AIAction;
  status: 'idle' | 'processing' | 'done' | 'error';
  prompt?: string;
  styleFilter?: AIFilterStyle;
  beforeSnapshot?: string;
  afterSnapshot?: string;
  timestamp: number;
}
