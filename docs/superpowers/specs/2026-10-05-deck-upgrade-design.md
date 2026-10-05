# Claude Code Deep Dive Deck: Upgrade Design

Date: 2026-10-05
Status: Approved design, pending spec review

## Goal

Upgrade the existing Marp deck (`deck.md`, `exercises/`) in two stages:

1. **Content**: correct stale or inaccurate material and add the Claude products and learning resources the deck never mentioned.
2. **Presentation**: rebuild the deck as an interactive HTML Artifact, keeping `deck.md` as the source of truth.

Stage 1 ships first because it changes slide counts and layout. Each stage gets its own plan and implementation cycle.

## Current state (audit findings)

| Area | Problem |
|---|---|
| Skills slides | Teach flat `skills/foo.md` files and `{{args}}`. Current skills are `skills/<name>/SKILL.md` with YAML frontmatter, and arguments use `$ARGUMENTS`. |
| Hooks slides | Registration JSON lacks the nested `matcher` / `hooks` structure. `write_file` is not a real tool name (real: `Write`, `Edit`, `Bash`). The Stop payload shown has no `usage` field; Stop hooks receive a `transcript_path`, so usage must be read from the transcript. Events missing: SessionStart, UserPromptSubmit, SubagentStop, PreCompact. Exit code 2 blocks on more than PreToolUse. |
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
| Claude Tag | Claude in Slack: what it is, install with `/install-slack-app`, when to use it instead of the CLI. |
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

`platform.claude.com/docs/en/resources/courses` redirects to https://academy.claude.com/courses, so the deck links to Claude Academy (28 courses). Mapping:

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

### 1e. Housekeeping

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
- The Artifact build adds a toolchain; keep the script dependency-free (Node standard library) so the repo stays easy to run.
