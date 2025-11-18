export enum Verbosity {
  PRECISE = 'precise',
  MODERATE = 'moderate',
  EXHAUSTIVE = 'exhaustive'
}

export enum NodeDensity {
  AGGRESSIVE = 'aggressive', // Minimal nodes
  MODERATE = 'moderate',     // Balanced
  DEFAULT = 'default'        // Current behavior
}

export enum LayoutDirection {
  TOP_BOTTOM = 'top-bottom',
  ZIG_ZAG = 'zig-zag'
}

export enum NodeShape {
  RECTANGLE = 'rectangle', // Process
  DIAMOND = 'diamond',     // Decision
  PILL = 'pill',           // Start/End
  PARALLELOGRAM = 'parallelogram' // Input/Output
}

export interface FlowchartNode {
  id: string;
  label: string;
  shape: NodeShape;
  // Calculated layout properties
  x?: number;
  y?: number;
  level?: number;
}

export interface FlowchartEdge {
  source: string;
  target: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface GenerateResponse {
  data?: FlowchartData;
  error?: string;
}