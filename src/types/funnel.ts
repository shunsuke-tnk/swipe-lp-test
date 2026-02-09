export interface SlideTransition {
  from: string;
  to: string;
  count: number;
}

export interface FunnelStep {
  slideId: string;
  slideName: string;
  visitors: number;
  dropOffRate: number;
  ctaClicks: number;
  avgDuration: number;
}

export interface FunnelData {
  transitions: SlideTransition[];
  steps: FunnelStep[];
  entryDistribution: { slideId: string; count: number }[];
  exitDistribution: { slideId: string; count: number }[];
  totalSessions: number;
}

// For Recharts Sankey diagram
export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
