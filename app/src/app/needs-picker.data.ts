export interface Need { id: string; label: string }
export interface ToolFit { id: string; name: string; needs: string[] }
export interface RankedTool extends ToolFit { hits: string[] }

export const NEEDS: readonly Need[] = [
  {
    id: 'suggest',
    label: 'Suggestions while I type'
  },
  {
    id: 'agent',
    label: 'Hand off big multi-file tasks'
  },
  {
    id: 'terminal',
    label: 'Work in the terminal'
  },
  {
    id: 'editor',
    label: 'Stay in my current editor'
  },
  {
    id: 'cheap',
    label: 'Free or very low cost'
  },
  {
    id: 'models',
    label: 'Choose any model'
  },
  {
    id: 'oss',
    label: 'Open source'
  },
  {
    id: 'cloud',
    label: 'Run tasks in the cloud'
  },
  {
    id: 'custom',
    label: 'Rules, skills, MCP customization'
  },
  {
    id: 'git',
    label: 'Every change is a git commit'
  },
  {
    id: 'github',
    label: 'GitHub-centered workflow'
  },
  {
    id: 'bigctx',
    label: 'Very large context window'
  },
  {
    id: 'team',
    label: 'Team or enterprise plans'
  }
];

export const TOOL_FIT: readonly ToolFit[] = [
  { id: "claude-code", name: "Claude Code", needs: ['agent', 'terminal', 'editor', 'cloud', 'custom', 'github', 'team'] },
  { id: "copilot", name: "GitHub Copilot", needs: ['suggest', 'agent', 'editor', 'cheap', 'cloud', 'custom', 'github', 'team'] },
  { id: "cursor", name: "Cursor", needs: ['suggest', 'agent', 'models', 'custom', 'team'] },
  { id: "windsurf", name: "Windsurf (Devin Desktop)", needs: ['agent', 'custom'] },
  { id: "codex", name: "OpenAI Codex", needs: ['agent', 'terminal', 'editor', 'oss', 'cloud', 'custom', 'team'] },
  { id: "gemini-cli", name: "Gemini CLI", needs: ['agent', 'terminal', 'cheap', 'oss', 'custom', 'bigctx'] },
  { id: "aider", name: "Aider", needs: ['terminal', 'cheap', 'models', 'oss', 'git'] },
];

/** Rank tools by how many of the picked needs they match; ties fall back to name order. */
export function rankTools(tools: readonly ToolFit[], picked: string[]): RankedTool[] {
  return tools
    .map((t) => ({ ...t, hits: t.needs.filter((n) => picked.includes(n)) }))
    .sort((a, b) => b.hits.length - a.hits.length || a.name.localeCompare(b.name));
}
