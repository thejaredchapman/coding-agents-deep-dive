export interface Slide {
  id: number;
  section: string;
  title: string;
  html: string;
  diagram?: string;
  checklist?: string[];
}

export interface DeckData {
  updated: string;
  slides: Slide[];
}

export interface SectionInfo {
  name: string;
  firstIndex: number;
  count: number;
}
