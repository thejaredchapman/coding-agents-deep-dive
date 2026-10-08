export interface GuideBlock {
  heading: string;
  text?: string;
  code?: string;
  bullets?: string[];
  table?: string[][];
  cols?: string[];
  note?: string;
  warn?: string;
  pros?: string[];
  cons?: string[];
  picker?: boolean;
}

export interface GuideSection {
  id: string;
  title: string;
  group: string;
  content: GuideBlock[];
}

export interface GuideNeed {
  id: string;
  label: string;
}

export interface GuideToolFit {
  id: string;
  name: string;
  needs: string[];
}

export interface GuideData {
  source: string;
  imported: string;
  splash: {
    tagline: string;
    what: { title: string; text: string };
    meaning: { title: string; bullets: string[] };
    why: { title: string; bullets: string[]; note: string };
    disclaimer: { title: string; text: string };
  };
  needs: GuideNeed[];
  toolFit: GuideToolFit[];
  sections: GuideSection[];
}

export interface RankedTool extends GuideToolFit {
  hits: string[];
}
