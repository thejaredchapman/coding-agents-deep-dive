# Coding Agents — Deep Dive

A 107-slide Marp training deck on the five extension points of AI coding agents — instructions files, subagents, skills, MCP and hooks — with a hands-on exercise for each. It covers **Claude Code, Codex, Cursor and Gemini CLI** side by side, for engineers who already use one of them and want to go further, or who are moving between them.

The five-section walkthrough is taught with Claude Code examples, because the exercises need one concrete tool. The cross-tool sections then give each tool the same depth, with its own shortcuts reference. All facts come from each vendor's official docs, checked on 2026-10-07 (see `docs/superpowers/facts.md` for the sources).

## Contents

| Section | Slides | Exercise |
|---------|--------|---------|
| 1. CLAUDE.md and `AGENTS.md` | 7 | `exercises/01-claude-md.md` |
| 2. Subagents | 8 | `exercises/02-subagents.md` |
| 3. Skills | 7 | `exercises/03-skills.md` |
| 4. MCP | 8 | `exercises/04-mcp.md` |
| 5. Hooks | 8 | `exercises/05-hooks.md` |
| 6. The Claude ecosystem (surfaces, Remote Control, Claude Tag, Cowork, Agent SDK, Chrome, models, plugins, permissions, headless) | 12 | — |
| 7. Four coding agents, side by side | 9 | — |
| 8. Claude Code shortcuts and commands | 5 | — |
| 9. Codex | 10 | — |
| 10. Cursor | 11 | — |
| 11. Gemini CLI | 11 | — |
| Putting it together, Keep learning (Claude Academy) | 8 | — |

Each exercise ends with a **Go deeper** link to a Claude Academy course and a **Coming from another tool?** note for Codex, Cursor and Gemini CLI.

## Render the deck

```bash
npx @marp-team/marp-cli deck.md --pdf
```

Or as HTML:

```bash
npx @marp-team/marp-cli deck.md --html
```

Or use the [Marp VS Code extension](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) for live preview. `.marprc.yml` turns on HTML so the small footnote lines render.

## Verify

```bash
node scripts/check-deck.mjs          # stale strings, required content, slide count
node scripts/check-deck.mjs --links  # also checks every Claude Academy link
```

Needs Node 18 or later and no dependencies.

## Format

- **Deck:** Marp markdown (`deck.md`), dark theme in the front matter
- **Exercises:** standalone markdown files, one per section
- **Facts:** `docs/superpowers/facts.md` records every verified claim with its source and date. Items marked unverified there (for example the full Codex CLI shortcut list) are not in the slides as fact.

## Delivery

The 107 slides are too many for one session. Pick a path:

- **90-minute core:** sections 1–5 with their exercises (about 40 slides)
- **Ecosystem add-on:** section 6
- **Moving between tools:** sections 7–11, or just the section for the tool your audience uses
- **Reference:** sections 8–11 double as shortcut and command cheat sheets

The pedagogy: show the concept, show how it works, then make them build it immediately while the context is warm.

## Keeping it current

Coding agents change quickly. Every comparison slide says "compared as of 2026-10-07". Before presenting, re-check the sources in `docs/superpowers/facts.md`, especially the Codex, Cursor and Gemini CLI rows.
