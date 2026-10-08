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

**Last updated: 2026-10-07.** The interactive app shows this date in its footer, taken from the last commit that touched `deck.md`.

## Interactive app (Angular)

`app/` is an Angular 22 app that presents the same slides with keyboard and swipe navigation, a file-tree contents pane, a statusline, day and night themes, a command palette (`/` or `Ctrl+K`), a tool picker that re-tints the deck for Claude Code, Codex, Cursor or Gemini CLI, an explorer of every extension point, an interactive hooks diagram, copy buttons on code, and saved exercise checklists. Three reference pages sit beside the deck: **Providers** (`#/providers`, official links for each tool), **Free learning** (`#/learn`, each provider's own program with a cost note and a link) and **Guide** (`#/guide`, merged in from the former ai-coding-assistants-guide: an interactive tool picker, comparison, IT review checklist, safeguards, cost habits and a profile for seven assistants including Copilot, Windsurf and Aider). `deck.md` stays the source of truth: a script turns it into `app/public/slides.json`.

```bash
npm install                 # build-time tools (marked)
npm --prefix app install    # Angular
npm run app:start           # dev server at http://localhost:4200
npm run app:build           # regenerates slides, then builds to app/dist/app/browser
npm run app:test            # Vitest component and service tests
npm test                    # tests for the slide build script
```

Keys: `→` `Space` next, `←` previous, `Home` `End`, `/` or `Ctrl+K` search, `E` explorer, `M` tool picker, `S` contents, `T` theme, `P` providers, `L` free learning, `G` guide, `D` back to the deck, `?` help. On a touch screen, swipe. Deep links work: `#/36` opens slide 36. The build is static files; host the `browser` folder anywhere (the base href is relative).

After you edit `deck.md`, run `npm run build:slides` (or `app:build`) to refresh the app's data.

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
npm run check:links                  # live check of every https link in the deck, exercises, README and providers.json
```

`check:links` fails on 404s and network errors. Sites that refuse automated requests (401/403/429) are listed as "blocked"; open those in a browser. The guide's content lives in `app/public/guide.json` (hand-maintained; its facts were read from vendor docs on 2026-10-02 and are not re-verified here, and its Claude Code deep-dive chapters were left out because the deck covers them). The provider and free-learning data lives in `app/public/providers.json`; every claim in it is recorded with its source in `docs/superpowers/facts.md`.

Needs Node 18 or later and no dependencies.

## Format

- **Deck:** Marp markdown (`deck.md`), dark theme in the front matter
- **App:** Angular 22 in `app/`, generated slide data in `app/public/slides.json`
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
