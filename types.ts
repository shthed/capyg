export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface PaletteColor extends RGB {
  id: number;
  hex: string;
  count: number; // Number of regions using this color
}

export interface Region {
  path: string; // SVG path data
  colorId: number;
  labelPoint: { x: number; y: number }; // Where to place the number
  area: number;
}

export interface ProcessedArt {
  width: number;
  height: number;
  palette: PaletteColor[];
  regions: Region[];
  originalUrl: string;
}

export interface AIAnalysis {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  funFact: string;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  EDITOR = 'EDITOR',
}
