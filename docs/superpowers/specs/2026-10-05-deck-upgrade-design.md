# Claude Code Deep Dive Deck: Upgrade Design

Date: 2026-10-05
Last updated: 2026-10-05
Target completion: Stage 1A (fixes, Claude ecosystem, Academy, README) Wednesday 2026-10-07. Stage 1B (in-depth Codex, Cursor and Gemini CLI sections, shortcuts for all four tools) Friday 2026-10-09. Stage 2 is planned after Stage 1 lands.
Status: Approved design, pending spec review

## Audience

Engineers who already use an AI coding tool. Two groups, both served:

- **Claude Code users** who want to go deeper (the original audience).
- **Codex, Cursor and Gemini CLI users** moving to Claude Code, and **Claude Code users** moving to any of those (for example, a team using more than one). Each extension point gets a side-by-side mapping in every direction, and each tool gets its own in-depth section.

## Goal

Upgrade the existing Marp deck (`deck.md`, `exercises/`) in two stages:

1. **Content**: correct stale or inaccurate material and add the Claude products and learning resources the deck never mentioned.
2. **Presentation**: rebuild the deck as an interactive HTML Artifact, keeping `deck.md` as the source of truth.

Stage 1 ships first because it changes slide counts and layout. Each stage gets its own plan and implementation cycle.

## Current state (audit findings)

| Area | Problem |
|---|---|
| Skills slides | Teach flat `skills/foo.md` files and `{{args}}`. Current skills are `skills/<name>/SKILL.md` with YAML frontmatter, and arguments use `$ARGUMENTS`. |
| Hooks slides | Registration JSON lacks the nested `matcher` / `hooks` structure. `write_file` is not a real tool name (real: `Write`, `Edit`, `Bash`). The Stop payload shown has no `usage` field; Verified empirically on Claude Code 2.1.290: the Stop payload carries `transcript_path` and `last_assistant_message` but no usage fields, so usage must be read from the transcript. Events missing: SessionStart, UserPromptSubmit, SubagentStop, PreCompact. Exit code 2 blocks on more than PreToolUse. |
| Subagents slides | No mention of custom subagents defined in `.claude/agents/*.md`. |
| MCP slides | `~/.claude/mcp.json` is the wrong location. Missing `claude mcp add`, scopes, `.mcp.json`, and HTTP transport replacing SSE. Server example uses the low-level `Server` class; `McpServer` is preferred. |
| Model ID | `claude-sonnet-4-6` appears in slides and exercise 5. Current ID is `claude-sonnet-5-5`. |
| README | Claims 75 slides; `deck.md` is about 55. |
| Missing topics | Plugins, permissions and settings, headless mode, and every Claude product other than Claude Code. |

Every correction must be verified against current docs (via the claude-code-guide agent or code.claude.com) before it is written. No feature description is written from memory.

## Stage 1: Content

### 1a. Fix existing slides and exercises

Correct each finding above in `deck.md` and in the matching `exercises/0N-*.md`. Exercise commands must work as written; run them where feasible.

### 1b. New section: The Claude ecosystem (about 8 slides)

| Product | Coverage |
|---|---|
| Claude Tag | Claude in Slack: what it is (public beta, Team and Enterprise only), setup (Slack Marketplace install, `/invite @Claude`, `@Claude connect` pairing), and how it differs from the earlier Claude Code in Slack that Pro and Max still use. |
| Claude Cowork | What it is and where it fits; has its own Academy course. |
| Claude Code surfaces | CLI, desktop app (Mac/Windows), web app at claude.ai/code, VS Code and JetBrains extensions; fast mode (`/fast`). |
| Remote Control and cloud sessions | Remote Control (`claude remote-control`, `--remote-control` / `--rc`, `/remote-control` / `/rc`) drives a session that keeps running locally from claude.ai/code or the iOS/Android app. Cloud sessions (Claude Code on the web) run on Anthropic infrastructure. Contrast the two. Cover cross-session messaging. Remote Control needs a Pro, Max, Team or Enterprise plan. |
| Claude Agent SDK | Programmatic counterpart to subagents and hooks. |
| Claude API | Messages API, tool use, prompt caching, Managed Agents (server-hosted agents with a managed sandbox). |
| Claude in Chrome | Browser automation from Claude Code. |
| Artifacts and Claude Docs | Publishing pages and docs; this is what Stage 2 uses. |
| Models | Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 4.5, and how to choose. |
| Plugins and plugin evals | Plugins bundle skills, hooks and MCP servers; `claude plugin eval`. |

The closing section gains a "which product for what" table beside the existing extension-point table.

### 1c. New short slides

- Plugins (may fold into the ecosystem section if it fits in one slide).
- Permissions and settings, and headless mode.

### 1d. New section: Keep learning (Claude Academy)

`platform.claude.com/docs/en/resources/courses` redirects to https://academy.claude.com/courses, so the deck links to Claude Academy (27 courses, counted 2026-10-07). Mapping:

| Deck section | Course |
|---|---|
| Foundations | Claude Code 101, Claude Code in action |
| Subagents | Introduction to subagents |
| Skills | Introduction to agent skills |
| MCP | Introduction to Model Context Protocol, then Model Context Protocol: Advanced topics |
| Claude Tag | Introduction to Claude Tag |
| API and SDK | Building with the Claude API, Claude Platform 101 |
| Team practice | The AI-native SDLC playbook, AI Fluency for builders |
| Cloud providers | Claude with Amazon Bedrock, Claude with Google Cloud's Vertex AI |

Each exercise page gets a "go deeper" link to its matching course. The remaining catalog (AI Fluency for educators, nonprofits, students, and so on) gets one pointer slide with the catalog link. Course URLs follow `https://academy.claude.com/courses/<slug>`; confirm each slug resolves before publishing.

### 1e. New section: Claude Code alongside Codex, Cursor and Gemini CLI

"Google's version" is taken to mean **Gemini CLI**, its direct counterpart. While verifying, also check Google's other coding products (for example Jules, Antigravity, Gemini Code Assist) and mention any that matter in one pointer slide; no deep dive unless asked.

**1e-1. Overview (about 8 slides): the Rosetta stone.** Every row reads the same in every direction. The tone is neutral: describe differences, don't rank tools.

| Extension point | Claude Code | Codex | Cursor | Gemini CLI |
|---|---|---|---|---|
| Standing instructions | CLAUDE.md | (verified, e.g. AGENTS.md) | (verified, e.g. project rules) | (verified, e.g. GEMINI.md) |
| Subagents | `.claude/agents/*.md` | (verified) | (verified) | (verified) |
| Skills / reusable workflows | `skills/<name>/SKILL.md` | (verified) | (verified) | (verified) |
| MCP | `claude mcp add`, `.mcp.json` | (verified) | (verified) | (verified) |
| Hooks / lifecycle automation | settings `hooks` | (verified or "no equivalent") | (verified or "no equivalent") | (verified or "no equivalent") |
| Permissions and sandboxing | permission modes, allow/deny rules | (verified) | (verified) | (verified) |
| Headless / CI | `claude -p` | (verified) | (verified) | (verified) |
| Remote / cloud | Remote Control, cloud sessions | (verified) | (verified) | (verified) |
| Shortcuts | see 1e-2 | see 1e-2 | see 1e-2 | see 1e-2 |

Cells marked "verified" are filled only from current official docs for each tool, with source URL and date in `facts.md`. Where a tool has no equivalent, the cell says so.

Overview slides: mental model; the table (split as needed); moving a project in; moving a project out (including whether an instructions file such as `AGENTS.md` can be reused, per docs); using more than one tool in a team; gotchas in each direction.

**1e-2. In-depth section per tool (about 8 slides each, four tools).** Each section has the same shape so readers can compare:

1. What it is and where it runs (terminal, IDE, cloud), install and sign-in.
2. Instructions and context files: location, format, precedence, how to generate one.
3. Extensibility: subagents or agents, skills or custom commands, plugins or extensions, each with a minimal working example.
4. MCP: config location, add command, a working example.
5. Hooks and automation: events, config, one example, or "no equivalent".
6. Permissions, sandboxing and approval modes, with defaults.
7. Headless and CI use, with one runnable example.
8. **Shortcuts reference**: keyboard shortcuts, slash commands and CLI flags that matter day to day, grouped (navigation, editing, mode switching, session control, context management). For Claude Code this section also replaces any shortcut mentions currently scattered through the deck.

Each tool's section ends with a "coming from <other tools>" box. The Claude Code section is the existing deck plus the new shortcuts slide; the Codex, Cursor and Gemini CLI sections are new.

Each exercise page gets a one-line "Coming from Codex, Cursor or Gemini CLI" note with the equivalent file or command.

### 1f. Housekeeping

Update `README.md`: real slide count, new topic table rows, new exercises or links.

## Stage 2: Interactive HTML Artifact

- Single self-contained page: keyboard and swipe navigation, section sidebar, progress bar.
- Light and dark themes in the existing Claude orange palette.
- Inline SVG diagrams replacing ASCII art: parallel subagents, hook lifecycle, the "putting it together" flow, and the ecosystem map.
- Copy buttons on code blocks.
- Per-section exercise checklists, saved per viewer.
- Keep Academy courses as a clickable roadmap.
- `deck.md` remains the source of truth. A small build script converts slides to the HTML page. The Marp PDF/HTML export keeps working.
- Publish privately as an Artifact; sharing is the owner's decision.
- Load the `artifact-design` and `artifact-capabilities` skills before writing the page.

## Out of scope

- The companion projects `../claude-code-updates` and `../4d-orchestrator-mcp`, except where exercises reference them.
- Rewriting the deck's teaching structure (concept, how it works, exercise).

## Testing and verification

- Stage 1: every changed factual claim has a cited doc source in the PR description; exercise commands run successfully or are marked as untested; `npx @marp-team/marp-cli deck.md --pdf` still renders.
- Stage 2: build script output opens offline, navigation works by keyboard and touch, themes switch, layout holds at phone width, and checklist state survives reload.

## Risks

- Docs may disagree with each other or change; record the doc URL and date next to each corrected claim.
- Product names (Cowork, Tag, Managed Agents) come from the Academy catalog and environment, so each gets a docs check before it gets a slide.
- Codex, Cursor and Gemini CLI change quickly. Each comparison cell records its source URL and date, and the slide footer says "compared as of 2026-10-07" (or the actual completion date). Competitor claims I can't verify are left out.
- Date risk: adding three in-depth tool sections and four shortcuts references roughly doubles the deck's new content. Stage 1 is split so the Claude-only fixes still land Wednesday 2026-10-07 and the in-depth tool sections land Friday 2026-10-09. If Friday slips, cut slides from 1e-2 before cutting verification; shortcuts slides are the last to cut because they are the most-requested reference.
- Shortcuts change often and differ by terminal and OS; each shortcuts slide states the OS it was checked on and the docs version or date.
- The Artifact build adds a toolchain; keep the script dependency-free (Node standard library) so the repo stays easy to run.
