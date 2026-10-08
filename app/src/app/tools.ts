export type ToolId = 'claude' | 'codex' | 'cursor' | 'gemini' | 'copilot' | 'devin' | 'aider';

export interface ToolInfo {
  id: ToolId;
  name: string;
  /** A shape as well as a color, so the tool is never identified by color alone. */
  glyph: string;
  /** Sidebar section that holds this tool's in-depth slides. */
  section: string;
}

export const TOOLS: readonly ToolInfo[] = [
  { id: 'aider', name: 'Aider', glyph: '✚', section: '27. Aider: in depth' },
  { id: 'claude', name: 'Claude Code', glyph: '●', section: '30. Claude Code: in depth' },
  { id: 'codex', name: 'Codex', glyph: '▲', section: '9. Codex' },
  { id: 'cursor', name: 'Cursor', glyph: '■', section: '10. Cursor' },
  { id: 'devin', name: 'Devin Desktop', glyph: '⬢', section: '24. Devin Desktop (Windsurf): in depth' },
  { id: 'gemini', name: 'Gemini CLI', glyph: '◆', section: '11. Gemini CLI' },
  { id: 'copilot', name: 'GitHub Copilot', glyph: '★', section: '21. GitHub Copilot: in depth' },
];

export function toolById(id: ToolId): ToolInfo {
  return TOOLS.find((t) => t.id === id)!;
}

/** Maps a table header cell such as "Claude Code" or "Codex" to a tool, or null. */
export function toolFromHeader(text: string): ToolId | null {
  const clean = text.trim().toLowerCase();
  return TOOLS.find((t) => t.name.toLowerCase() === clean)?.id ?? null;
}

export function isToolId(value: unknown): value is ToolId {
  return TOOLS.some((t) => t.id === value);
}
