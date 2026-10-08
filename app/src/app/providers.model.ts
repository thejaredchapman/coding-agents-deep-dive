import { ToolId } from './tools';

export interface ProviderLink {
  label: string;
  url: string;
  kind: 'product' | 'docs' | 'code' | 'company';
}

export interface Provider {
  id: ToolId;
  name: string;
  product: string;
  summary: string;
  links: ProviderLink[];
  /** Shown on the learning page when the provider has no program of its own. */
  learningNote?: string;
}

export interface LearningItem {
  title: string;
  url?: string;
}

export interface LearningProgram {
  provider: ToolId;
  title: string;
  url: string;
  cost: string;
  summary: string;
  items: LearningItem[];
}

export interface ProvidersData {
  checked: string;
  providers: Provider[];
  learning: LearningProgram[];
}
