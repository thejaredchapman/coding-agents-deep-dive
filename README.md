# Coding Agents — Deep Dive

A Marp training deck on the five extension points of AI coding agents — instructions files, subagents, skills, MCP and hooks — with hands-on exercises for each. It covers Claude Code, Codex, Cursor and Gemini CLI side by side, for engineers who already use one of them and want to go further, or who are moving between them.

The core walkthrough is currently taught with Claude Code examples; the cross-tool sections give each tool equal depth.

## Topics

| Extension Point | Slides | Exercise |
|-----------------|--------|---------|
| CLAUDE.md | ~12 | `exercises/01-claude-md.md` |
| Subagents | ~14 | `exercises/02-subagents.md` |
| Skills | ~12 | `exercises/03-skills.md` |
| MCP | ~16 | `exercises/04-mcp.md` |
| Hooks | ~14 | `exercises/05-hooks.md` |
| Putting it together | ~7 | — |

## Render the deck

```bash
npx @marp-team/marp-cli deck.md --pdf
```

Or as HTML:

```bash
npx @marp-team/marp-cli deck.md --html
```

Or use the [Marp VS Code extension](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) for live preview.

## Format

- **Format:** Marp markdown (`deck.md`)
- **Theme:** Custom dark theme matching Claude Code's aesthetic
- **Exercises:** Standalone markdown files, one per section

## Companion projects

The exercises reference two companion projects in this repo:

- `../claude-code-updates/` — Cost tracker Stop hook (Exercise 5)
- `../4d-orchestrator-mcp/` — MCP server built in TypeScript (Exercise 4 context)

## Delivery

This deck was designed for a 90-minute session:
- 60 minutes of slides (~12 min per section)
- 30 minutes of exercises (run during or after)

The pedagogy: show the concept, show how it works, then make them build it immediately while the context is warm.
