import { ToolId } from './tools';

/** Guide chapter id -> the deck slide (1-based, as in #/N) that covers the same topic in depth. */
export const GUIDE_TO_DECK: Record<string, number> = {
  pick: 53,
  compare: 53,
  'claude-md': 3,
  skills: 18,
  mcp: 25,
  models: 48,
  permissions: 50,
  'claude-code': 62,
  codex: 67,
  cursor: 77,
  'gemini-cli': 88,
};

const BY_SLIDE: Record<number, string[]> = { 48: ['models'], 50: ['permissions'], 51: ['permissions'] };

const BY_SECTION: Record<string, string[]> = {
  '1. CLAUDE.md': ['claude-md'],
  '3. Skills': ['skills'],
  '4. MCP': ['mcp'],
  '7. Four coding agents, side by side': ['compare', 'pick'],
  '8. Claude Code: shortcuts and commands': ['claude-code'],
  '9. Codex': ['codex'],
  '10. Cursor': ['cursor'],
  '11. Gemini CLI': ['gemini-cli'],
};

/** Guide chapters that cover the same ground as a slide, most specific match first. */
export function guideIdsForSlide(slideNumber: number, section: string): string[] {
  return BY_SLIDE[slideNumber] ?? BY_SECTION[section] ?? [];
}

/** The guide profile that belongs to each of the deck's four tools. */
export const GUIDE_PROFILE: Record<ToolId, string> = {
  claude: 'claude-code',
  codex: 'codex',
  cursor: 'cursor',
  gemini: 'gemini-cli',
};

export function toolForGuideId(id: string): ToolId | null {
  return (Object.keys(GUIDE_PROFILE) as ToolId[]).find((t) => GUIDE_PROFILE[t] === id) ?? null;
}
