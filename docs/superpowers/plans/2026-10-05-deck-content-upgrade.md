# Deck Content Upgrade (Stage 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct stale material in `deck.md` and `exercises/`, and add the ecosystem, plugins, permissions/headless and Claude Academy sections from the spec.

**Architecture:** A dependency-free Node check script (`scripts/check-deck.mjs`) encodes the spec's acceptance criteria as banned strings, required strings, a slide-count match with the README, and an optional link check. Each content task starts by running the check to see it fail, edits the deck and exercises from a verified facts file, and ends with the check passing. No claim is written from memory: Task 1 records each verified fact with its source URL and date.

**Tech Stack:** Marp markdown, Node 18+ standard library only, `npx @marp-team/marp-cli` for rendering.

Spec: `docs/superpowers/specs/2026-10-05-deck-upgrade-design.md`

**Last updated:** 2026-10-05
**Target completion:** Stage 1A Wednesday 2026-10-07; Stage 1B Friday 2026-10-09

| Day | Tasks |
|---|---|
| Mon 2026-10-05 | Plan and spec written (done) |
| Tue 2026-10-06 | Tasks 1-2 (check script; facts for Claude Code, Codex, Cursor, Gemini CLI), then Tasks 3-5 if time allows |
| Wed 2026-10-07 | Stage 1A: Tasks 6-9, Task 10 (README, check, render) |
| Thu 2026-10-08 | Stage 1B: Task 8b (overview), Tasks 8c (Claude Code shortcuts), 8d (Codex) |
| Fri 2026-10-09 | Stage 1B: Tasks 8e (Cursor), 8f (Gemini CLI), final check and render, README slide count |

Stage 1A is shippable on its own; run Task 10 at the end of 1A and again after 1B. If Friday slips, cut slides from Tasks 8d-8f before cutting verification; the shortcuts slides are the last to cut.

---

### Task 1: Acceptance check script

**Files:**
- Create: `scripts/check-deck.mjs`

**Interfaces:**
- Produces: `node scripts/check-deck.mjs` exits 0 when all checks pass, 1 otherwise, printing one `FAIL:` line per problem. `node scripts/check-deck.mjs --links` additionally requests every `academy.claude.com` URL found and fails on non-2xx.

- [ ] **Step 1: Write the script**

```js
#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';

const deck = readFileSync('deck.md', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const exercises = readdirSync('exercises')
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ name: `exercises/${f}`, text: readFileSync(`exercises/${f}`, 'utf8') }));
const all = [{ name: 'deck.md', text: deck }, ...exercises];

const BANNED = ['{{args}}', 'write_file', 'claude-sonnet-4-6', '~/.claude/mcp.json'];
const REQUIRED = [
  ['deck.md', 'SKILL.md'], ['deck.md', '$ARGUMENTS'],
  ['deck.md', 'matcher'], ['deck.md', 'transcript_path'],
  ['deck.md', 'SessionStart'], ['deck.md', 'UserPromptSubmit'],
  ['deck.md', '.claude/agents'], ['deck.md', 'claude mcp add'],
  ['deck.md', 'claude-sonnet-5-5'],
  ['deck.md', 'Claude Tag'], ['deck.md', 'Cowork'],
  ['deck.md', 'Remote Control'], ['deck.md', 'Agent SDK'],
  ['deck.md', 'Managed Agents'], ['deck.md', 'plugin'],
  ['deck.md', 'headless'], ['deck.md', 'academy.claude.com'],
  ['deck.md', 'Codex'], ['deck.md', 'Cursor'],
  ['deck.md', 'AGENTS.md'], ['deck.md', 'compared as of'],
  ['deck.md', 'Gemini CLI'], ['deck.md', 'GEMINI.md'],
  ['deck.md', 'Claude Code shortcuts'], ['deck.md', 'Codex shortcuts'],
  ['deck.md', 'Cursor shortcuts'], ['deck.md', 'Gemini CLI shortcuts'],
];

const failures = [];

for (const { name, text } of all) {
  for (const b of BANNED) if (text.includes(b)) failures.push(`${name} contains banned string: ${b}`);
}
for (const [file, s] of REQUIRED) {
  const doc = all.find((d) => d.name === file);
  if (!doc.text.includes(s)) failures.push(`${file} is missing required string: ${s}`);
}

function countSlides(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  let inFence = false;
  let n = 1;
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    else if (!inFence && line.trim() === '---') n++;
  }
  return n;
}
const slides = countSlides(deck);
const claimed = readme.match(/(\d+)-slide/);
if (!claimed || Number(claimed[1]) !== slides) {
  failures.push(`README claims ${claimed ? claimed[1] : 'no'}-slide but deck has ${slides}`);
}

if (process.argv.includes('--links')) {
  const urls = new Set();
  for (const { text } of all) {
    for (const m of text.matchAll(/https:\/\/academy\.claude\.com[^\s)>\]"'`]*/g)) urls.add(m[0]);
  }
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!res.ok) failures.push(`link ${url} returned ${res.status}`);
    } catch (e) {
      failures.push(`link ${url} failed: ${e.message}`);
    }
  }
}

for (const f of failures) console.log(`FAIL: ${f}`);
console.log(failures.length ? `${failures.length} problem(s); deck has ${slides} slides` : `OK; deck has ${slides} slides`);
process.exit(failures.length ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/check-deck.mjs`
Expected: exit 1, with `FAIL:` lines for `{{args}}`, `write_file`, `claude-sonnet-4-6`, `~/.claude/mcp.json`, every missing required string, and the README slide-count mismatch.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-deck.mjs
git commit -m "test: add deck acceptance check script

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Verified facts file

**Files:**
- Create: `docs/superpowers/facts.md`

**Interfaces:**
- Produces: `docs/superpowers/facts.md`, a table with columns `Claim | Verified text | Source URL | Checked`. Tasks 3-9 copy wording and examples only from this file.

- [ ] **Step 1: Verify each topic against current docs**

Use the `claude-code-guide` agent (or WebFetch on `https://code.claude.com/docs/en/<page>`) to answer each question. Record exact field names, file paths and commands as the docs show them.

| Topic | Questions to answer |
|---|---|
| Skills | Directory layout and filename; required and optional frontmatter fields; the arguments placeholder; project vs user location. |
| Hooks | Full event list; settings JSON shape with `matcher` and nested `hooks`; real tool names for matchers; stdin payload fields for PreToolUse, PostToolUse, Stop; exit code behavior (0, 2, other) per event; where usage data comes from for a Stop hook. |
| Subagents | `.claude/agents/*.md` format and frontmatter; project vs user location; how to invoke. |
| MCP | `claude mcp add` syntax; scopes (local, project, user); `.mcp.json` location; transports (stdio, HTTP, whether SSE is deprecated); current TypeScript SDK server class. |
| Claude Tag | What it is; setup steps from the official docs (Slack Marketplace, `/invite @Claude`, `@Claude connect`); plan and availability requirements. Note: `/install-slack-app` is not in the official docs. |
| Claude Cowork | What it is; where it fits; availability. |
| Remote Control | `claude remote-control`, `--remote-control`/`--rc`, `/remote-control`/`/rc`; plan requirements; cloud sessions difference; cross-session messaging. Start from `https://code.claude.com/docs/en/remote-control`. |
| Surfaces | CLI, desktop app, web, VS Code, JetBrains; fast mode (`/fast`). |
| Agent SDK, API, Managed Agents | One-sentence description and docs URL each; Messages API, tool use, prompt caching. |
| Claude in Chrome, Artifacts, Claude Docs | One-sentence description each. |
| Plugins | What a plugin bundles; install/enable commands; `claude plugin eval`. |
| Permissions, settings, headless | Permission modes; allow/deny rule syntax; settings file locations and precedence; the non-interactive flag (`-p`) and output formats. |
| Academy | Fetch `https://academy.claude.com/courses`; confirm each slug in the Task 9 table. |
| Codex | For each Rosetta row in the spec (instructions file, subagents, skills/workflows, MCP config location, hooks, permissions/sandbox, headless/CI, remote/cloud): the equivalent, its file or command, or "no equivalent". Whether `AGENTS.md` is read, and whether Claude Code can reuse it. Use the official OpenAI Codex docs. |
| Gemini CLI | Same rows (instructions file such as GEMINI.md, subagents, custom commands/skills, extensions, MCP, hooks, permissions/sandbox, headless/CI, remote/cloud). Use the official Google docs. Also check Jules, Antigravity and Gemini Code Assist. |
| Shortcuts | For each of Claude Code, Codex, Cursor and Gemini CLI: keyboard shortcuts, slash commands and CLI flags from the official interactive-mode or shortcuts pages, grouped as navigation, editing, mode switching, session control, context management. Record the OS checked. |
| Cursor | Same rows: project rules location and format, subagents/agents, reusable commands, MCP config location, hooks, permissions, headless/CLI, background or cloud agents. Use the official Cursor docs. |

- [ ] **Step 2: Write `docs/superpowers/facts.md`**

Format, one row per claim:

```markdown
# Verified facts for the deck upgrade

| Claim | Verified text | Source URL | Checked |
|---|---|---|---|
| Skill file layout | (exact text from docs) | https://code.claude.com/docs/en/skills | 2026-10-05 |
```

If a docs answer contradicts the spec or the required strings in `scripts/check-deck.mjs` (for example `headless`, `matcher`, `transcript_path`), update the spec's audit table or the script's `REQUIRED` list to match the docs and note the change in the commit message.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/facts.md scripts/check-deck.mjs docs/superpowers/specs
git commit -m "docs: record verified Claude Code facts with sources

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Skills slides and Exercise 3

**Files:**
- Modify: `deck.md` (section 3, "What is a Skill?", "Anatomy of a Skill", "Passing arguments to Skills"; about lines 198-270)
- Modify: `exercises/03-skills.md`

**Interfaces:**
- Consumes: skills rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check and note skills failures**

Run: `node scripts/check-deck.mjs`
Expected: FAIL lines for `{{args}}`, `SKILL.md`, `$ARGUMENTS`.

- [ ] **Step 2: Rewrite the slides**

Replace the directory-tree slide with the `skills/<name>/SKILL.md` layout from the facts file. Replace the anatomy example with a `SKILL.md` that has YAML frontmatter (use the exact field names from facts.md) followed by the existing Deploy Checklist steps. Replace `{{args}}` with `$ARGUMENTS` in the arguments slide and its example. Keep the "Skills vs. CLAUDE.md" table.

- [ ] **Step 3: Update `exercises/03-skills.md`**

Make the `/standup` skill a `standup/SKILL.md` directory with frontmatter and `$ARGUMENTS` where it takes arguments. Update every path and command in the exercise to match.

- [ ] **Step 4: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL lines mentioning `{{args}}`, `SKILL.md` or `$ARGUMENTS`.

- [ ] **Step 5: Run the exercise commands**

Create the skill from the exercise in a scratch directory, confirm it loads (`/standup` appears in the slash menu), and note the result in the commit message. Mark as untested if it cannot be run.

- [ ] **Step 6: Commit**

```bash
git add deck.md exercises/03-skills.md
git commit -m "fix: update skills slides and exercise to SKILL.md layout

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Hooks slides, Exercise 5 and model IDs

**Files:**
- Modify: `deck.md` (section 5, lines about 389-485; Stop payload example uses a model ID)
- Modify: `exercises/05-hooks.md`

**Interfaces:**
- Consumes: hooks rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL lines for `write_file`, `claude-sonnet-4-6`, `matcher`, `transcript_path`, `SessionStart`, `UserPromptSubmit`.

- [ ] **Step 2: Rewrite the hook slides**

- Event list slide: add every event from facts.md, including SessionStart, UserPromptSubmit, SubagentStop, PreCompact.
- Registration slide: use the nested `matcher` and `hooks` JSON shape from facts.md, with real tool names (`Write|Edit`, `Bash`).
- Payload slide: replace the Stop payload with the fields from facts.md, including `transcript_path`, and add one line saying usage is read from the transcript.
- Exit code slide: state exit code 2 behavior per event as listed in facts.md.
- Replace `claude-sonnet-4-6` with `claude-sonnet-5-5` anywhere it appears.

- [ ] **Step 3: Update `exercises/05-hooks.md`**

Fix the registration JSON (nested shape), replace the `write_file` / `str_replace_based_edit_tool` check with the real tool names, change the sample output model to `claude-sonnet-5-5`, and add one reflection question about exit code 2.

- [ ] **Step 4: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL lines mentioning `write_file`, `claude-sonnet-4-6`, `matcher`, `transcript_path`, `SessionStart` or `UserPromptSubmit`.

- [ ] **Step 5: Run the exercise Part B hook**

Register the log hook in a scratch project's `.claude/settings.json`, ask Claude to edit a file, and confirm `~/.claude/write_log.txt` gets a line. Note the result in the commit message, or mark as untested.

- [ ] **Step 6: Commit**

```bash
git add deck.md exercises/05-hooks.md
git commit -m "fix: correct hook registration, events, payload and model ID

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: MCP slides and Exercise 4

**Files:**
- Modify: `deck.md` (section 4, lines about 283-385)
- Modify: `exercises/04-mcp.md`

**Interfaces:**
- Consumes: MCP rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL lines for `~/.claude/mcp.json` and `claude mcp add`.

- [ ] **Step 2: Rewrite the slides**

- Registration slide: lead with `claude mcp add` (syntax from facts.md), then show the `.mcp.json` project file, then a scopes table (local, project, user) from facts.md. Remove `~/.claude/mcp.json`.
- Server example: use the current TypeScript SDK server class named in facts.md.
- Transports slide: reflect the HTTP/SSE status from facts.md.

- [ ] **Step 3: Update `exercises/04-mcp.md`**

Replace any `~/.claude/mcp.json` instructions with `claude mcp add` and `.mcp.json`, and add a step that runs `claude mcp list` to confirm registration.

- [ ] **Step 4: Run the check and the exercise**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL lines mentioning `~/.claude/mcp.json` or `claude mcp add`. Then run the exercise's registration commands in a scratch project and confirm `claude mcp list` shows the server; otherwise mark as untested.

- [ ] **Step 5: Commit**

```bash
git add deck.md exercises/04-mcp.md
git commit -m "fix: update MCP registration, scopes and server example

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Subagents and CLAUDE.md slides and exercises

**Files:**
- Modify: `deck.md` (sections 1 and 2)
- Modify: `exercises/01-claude-md.md`, `exercises/02-subagents.md`

**Interfaces:**
- Consumes: subagent rows and any CLAUDE.md rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL line for `.claude/agents`.

- [ ] **Step 2: Add a custom-subagents slide after "Spawning a subagent"**

Show a `.claude/agents/<name>.md` file with the frontmatter fields from facts.md, state project vs user location, and say how to invoke it. Add one sentence to the "Spawning a subagent" slide pointing to it.

- [ ] **Step 3: Audit section 1 and exercises 01/02**

Compare the CLAUDE.md hierarchy slide and both exercises with facts.md (for example `CLAUDE.local.md`, imports, the `/init` command if the docs list them). Fix anything that disagrees; add a facts row for each change. If nothing disagrees, say so in the commit message.

- [ ] **Step 4: Update `exercises/02-subagents.md`**

Add an optional part: create `.claude/agents/reviewer.md` and invoke it.

- [ ] **Step 5: Run the check, then commit**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL line for `.claude/agents`.

```bash
git add deck.md exercises/01-claude-md.md exercises/02-subagents.md
git commit -m "feat: add custom subagents slide and audit CLAUDE.md content

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Ecosystem section

**Files:**
- Modify: `deck.md` (insert a new section `# 6. The Claude ecosystem` before `# Putting it together`)

**Interfaces:**
- Consumes: ecosystem rows in `docs/superpowers/facts.md` (Tag, Cowork, Remote Control, surfaces, Agent SDK, API, Managed Agents, Chrome, Artifacts and Docs, models).

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL lines for `Claude Tag`, `Cowork`, `Remote Control`, `Agent SDK`, `Managed Agents`.

- [ ] **Step 2: Write the section (about 8 slides)**

One slide each, wording only from facts.md:

1. Section title slide `# 6. The Claude ecosystem`.
2. Claude Code surfaces (CLI, desktop, web, VS Code, JetBrains, fast mode).
3. Remote Control vs cloud sessions: a two-column table with the three start commands and plan requirements; one line on cross-session messaging.
4. Claude Tag (Claude in Slack): what it is, setup steps per facts.md (Slack Marketplace, `/invite @Claude`, `@Claude connect`), and the earlier Claude Code in Slack for Pro and Max.
5. Claude Cowork: what it is and where it fits.
6. Agent SDK and Claude API: Messages API, tool use, prompt caching, Managed Agents; a table mapping "extension point" to "SDK equivalent" (subagents, hooks, MCP, skills).
7. Claude in Chrome, Artifacts and Claude Docs: one line each.
8. Models: a table with Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 4.5, their IDs from Global Constraints, and one line on choosing.

- [ ] **Step 3: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL lines for the five strings above.

- [ ] **Step 4: Commit**

```bash
git add deck.md
git commit -m "feat: add Claude ecosystem section

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Plugins, permissions and headless slides, closing tables

**Files:**
- Modify: `deck.md` (insert after the ecosystem section; extend "Which extension point for what?")

**Interfaces:**
- Consumes: plugins and permissions/headless rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL lines for `plugin` and `headless`.

- [ ] **Step 2: Write the slides**

1. Plugins: what a plugin bundles (skills, hooks, MCP servers, per facts.md), install/enable commands, and `claude plugin eval`.
2. Permissions and settings: modes, allow/deny rule syntax, and file locations with precedence, as in facts.md.
3. Headless mode: the non-interactive flag and output formats, with one runnable example from facts.md and a line on using it in CI.

- [ ] **Step 3: Extend the closing section**

Add rows to "Which extension point for what?" for plugins and headless. Add a second table, "Which product for what?", mapping needs (continue a session from your phone, ask Claude in Slack, build your own agent, host an agent server-side) to the ecosystem products.

- [ ] **Step 4: Run the check, then commit**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL lines for `plugin` or `headless`.

```bash
git add deck.md
git commit -m "feat: add plugins, permissions and headless slides

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8b: Overview: Claude Code alongside Codex, Cursor and Gemini CLI

**Files:**
- Modify: `deck.md` (insert a new section `# Claude Code alongside Codex, Cursor and Gemini CLI` after Task 8's slides)
- Modify: `exercises/01..05-*.md` (one-line note each)

**Interfaces:**
- Consumes: Codex and Cursor rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL lines for `Codex`, `Cursor`, `Gemini CLI`, `GEMINI.md`, `AGENTS.md`, `compared as of`.

- [ ] **Step 2: Write the section (about 8 slides)**

Wording only from facts.md; neutral tone; "no equivalent" where verified:

1. Title and mental model: where the three tools overlap and differ.
2-3. The Rosetta table from the spec (Claude Code, Codex, Cursor, Gemini CLI columns; nine rows), split over two or three slides if it overflows.
4. Moving a project in: carry one project's instructions and MCP config from Codex, Cursor or Gemini CLI into Claude Code, with exact file names and commands, and whether `AGENTS.md` can be reused (per docs).
5. Moving a project out: the reverse, from Claude Code into each of the other three.
6. Using more than one tool in a team: which files are shared, which are tool-specific.
7. Gotchas in each direction: approval and sandbox defaults, config formats, where context persists.
8. Footer slide or line on every comparison slide: `compared as of <date>` using the date the facts were checked.

- [ ] **Step 3: Add the exercise notes**

Append to each exercise a line: `Coming from Codex, Cursor or Gemini CLI: <equivalent file or command from facts.md>`. Use "no equivalent" where facts.md says so.

- [ ] **Step 4: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL lines for `Codex`, `Cursor`, `Gemini CLI`, `GEMINI.md`, `AGENTS.md` or `compared as of`.

- [ ] **Step 5: Commit**

```bash
git add deck.md exercises
git commit -m "feat: add cross-tool overview and Rosetta table

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8c: In-depth section: Claude Code shortcuts and power use

**Files:**
- Modify: `deck.md` (add a section `# Claude Code shortcuts and power use` after Task 8b's slides; one section per tool, in the order 8c, 8d, 8e, 8f)

**Interfaces:**
- Consumes: Claude Code shortcuts and power use rows and the Shortcuts rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL line for `Claude Code shortcuts`.

- [ ] **Step 2: Write the 8 slides**

Wording and examples only from facts.md. Shape (spec 1e-2): 1 what it is, where it runs, install and sign-in; 2 instructions and context files (location, format, precedence); 3 extensibility (subagents or agents, skills or commands, plugins or extensions, each with a minimal working example); 4 MCP (config location, add command, example); 5 hooks and automation, or "no equivalent"; 6 permissions, sandboxing and approval modes with defaults; 7 headless and CI with one runnable example; 8 `Claude Code shortcuts` reference, grouped as navigation, editing, mode switching, session control, context management, with the OS checked and the date.

For this section, slides 1-7 mostly consolidate material already in the deck; link back to the earlier sections instead of repeating them, and spend the slide budget on the shortcuts slide plus a slash-command cheat sheet. Remove shortcut mentions scattered elsewhere in the deck.

- [ ] **Step 3: Add the "coming from" box**

End the section with a box listing the equivalent file or command in each of the other three tools, from facts.md.

- [ ] **Step 4: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL line for `Claude Code shortcuts`.

- [ ] **Step 5: Commit**

```bash
git add deck.md
git commit -m "feat: add in-depth Claude Code shortcuts and power use section with shortcuts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8d: In-depth section: Codex

**Files:**
- Modify: `deck.md` (add a section `# Codex` after Task 8b's slides; one section per tool, in the order 8c, 8d, 8e, 8f)

**Interfaces:**
- Consumes: Codex rows and the Shortcuts rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL line for `Codex shortcuts`.

- [ ] **Step 2: Write the 8 slides**

Wording and examples only from facts.md. Shape (spec 1e-2): 1 what it is, where it runs, install and sign-in; 2 instructions and context files (location, format, precedence); 3 extensibility (subagents or agents, skills or commands, plugins or extensions, each with a minimal working example); 4 MCP (config location, add command, example); 5 hooks and automation, or "no equivalent"; 6 permissions, sandboxing and approval modes with defaults; 7 headless and CI with one runnable example; 8 `Codex shortcuts` reference, grouped as navigation, editing, mode switching, session control, context management, with the OS checked and the date.

- [ ] **Step 3: Add the "coming from" box**

End the section with a box listing the equivalent file or command in each of the other three tools, from facts.md.

- [ ] **Step 4: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL line for `Codex shortcuts`.

- [ ] **Step 5: Commit**

```bash
git add deck.md
git commit -m "feat: add in-depth Codex section with shortcuts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8e: In-depth section: Cursor

**Files:**
- Modify: `deck.md` (add a section `# Cursor` after Task 8b's slides; one section per tool, in the order 8c, 8d, 8e, 8f)

**Interfaces:**
- Consumes: Cursor rows and the Shortcuts rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL line for `Cursor shortcuts`.

- [ ] **Step 2: Write the 8 slides**

Wording and examples only from facts.md. Shape (spec 1e-2): 1 what it is, where it runs, install and sign-in; 2 instructions and context files (location, format, precedence); 3 extensibility (subagents or agents, skills or commands, plugins or extensions, each with a minimal working example); 4 MCP (config location, add command, example); 5 hooks and automation, or "no equivalent"; 6 permissions, sandboxing and approval modes with defaults; 7 headless and CI with one runnable example; 8 `Cursor shortcuts` reference, grouped as navigation, editing, mode switching, session control, context management, with the OS checked and the date.

- [ ] **Step 3: Add the "coming from" box**

End the section with a box listing the equivalent file or command in each of the other three tools, from facts.md.

- [ ] **Step 4: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL line for `Cursor shortcuts`.

- [ ] **Step 5: Commit**

```bash
git add deck.md
git commit -m "feat: add in-depth Cursor section with shortcuts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8f: In-depth section: Gemini CLI

**Files:**
- Modify: `deck.md` (add a section `# Gemini CLI` after Task 8b's slides; one section per tool, in the order 8c, 8d, 8e, 8f)

**Interfaces:**
- Consumes: Gemini CLI rows and the Shortcuts rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: FAIL line for `Gemini CLI shortcuts`.

- [ ] **Step 2: Write the 8 slides**

Wording and examples only from facts.md. Shape (spec 1e-2): 1 what it is, where it runs, install and sign-in; 2 instructions and context files (location, format, precedence); 3 extensibility (subagents or agents, skills or commands, plugins or extensions, each with a minimal working example); 4 MCP (config location, add command, example); 5 hooks and automation, or "no equivalent"; 6 permissions, sandboxing and approval modes with defaults; 7 headless and CI with one runnable example; 8 `Gemini CLI shortcuts` reference, grouped as navigation, editing, mode switching, session control, context management, with the OS checked and the date.

Also add one pointer slide for Google's other coding products (Jules, Antigravity, Gemini Code Assist) if facts.md confirms they are relevant, saying only what the docs state.

- [ ] **Step 3: Add the "coming from" box**

End the section with a box listing the equivalent file or command in each of the other three tools, from facts.md.

- [ ] **Step 4: Run the check**

Run: `node scripts/check-deck.mjs`
Expected: no FAIL line for `Gemini CLI shortcuts`.

- [ ] **Step 5: Commit**

```bash
git add deck.md
git commit -m "feat: add in-depth Gemini CLI section with shortcuts

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Claude Academy section and exercise links

**Files:**
- Modify: `deck.md` (insert `# Keep learning` after the closing tables, before Resources; update Resources)
- Modify: `exercises/01..05-*.md` (add a "Go deeper" line)

**Interfaces:**
- Consumes: Academy rows in `docs/superpowers/facts.md`.

- [ ] **Step 1: Run the check with links**

Run: `node scripts/check-deck.mjs --links`
Expected: FAIL line for missing `academy.claude.com`.

- [ ] **Step 2: Write the Keep learning slides**

Slide 1, the mapping table (title and slug, base `https://academy.claude.com/courses/`):

| Deck section | Course | Slug |
|---|---|---|
| Foundations | Claude Code 101 | `claude-code-101` |
| Foundations | Claude Code in action | `claude-code-in-action` |
| Subagents | Introduction to subagents | `introduction-to-subagents` |
| Skills | Introduction to agent skills | `introduction-to-agent-skills` |
| MCP | Introduction to Model Context Protocol | `introduction-to-model-context-protocol` |
| MCP | Model Context Protocol: Advanced topics | `model-context-protocol-advanced-topics` |
| Claude Tag | Introduction to Claude Tag | `introduction-to-claude-tag` |
| Cowork | Introduction to Claude Cowork | `introduction-to-claude-cowork` |
| API and SDK | Building with the Claude API | `building-with-the-claude-api` |
| API and SDK | Claude Platform 101 | `claude-platform-101` |
| Team practice | The AI-native SDLC playbook | `ai-native-sdlc-playbook` |
| Team practice | AI Fluency for builders | `ai-fluency-for-builders` |
| Cloud providers | Claude with Amazon Bedrock | `claude-with-amazon-bedrock` |
| Cloud providers | Claude with Google Cloud's Vertex AI | `claude-with-google-cloud-s-vertex-ai` |

Render each course as a full link. Slide 2: one pointer to the full catalog at `https://academy.claude.com/courses` (28 courses, including the AI Fluency track). Update the Resources slide: replace `claude.ai/docs/claude-code` with `https://code.claude.com/docs`.

- [ ] **Step 3: Add "Go deeper" lines to exercises**

Append to each exercise: 01 Claude Code 101; 02 Introduction to subagents; 03 Introduction to agent skills; 04 Introduction to Model Context Protocol; 05 Claude Code in action. Each is a full link.

- [ ] **Step 4: Run the check with links**

Run: `node scripts/check-deck.mjs --links`
Expected: no `academy.claude.com` FAIL lines and no `link ... returned` failures. If a slug fails, correct it from the live catalog and update this table and the spec.

- [ ] **Step 5: Commit**

```bash
git add deck.md exercises
git commit -m "feat: add Claude Academy learning paths and exercise links

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: README and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README**

Set the slide count to the number printed by `node scripts/check-deck.mjs`, in the form `N-slide` in the first paragraph. Update the topics table: new rows for the ecosystem, plugins/permissions/headless and Keep learning, with approximate slide counts. Add a `## Verify` section with `node scripts/check-deck.mjs --links`. Update the delivery section's timing if the added sections change it.

- [ ] **Step 2: Run the full check**

Run: `node scripts/check-deck.mjs --links`
Expected: `OK; deck has N slides`, exit 0.

- [ ] **Step 3: Render the deck**

Run: `npx @marp-team/marp-cli deck.md --pdf -o /tmp/deck-check.pdf` (or the scratchpad directory)
Expected: exits 0 and writes the PDF. Open it and spot-check the new tables and code blocks for overflow; shorten any slide that overflows.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README for upgraded deck

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-review

- **Spec coverage:** 1a is Tasks 3-6; 1b is Task 7; 1c is Task 8; 1d is Task 9; 1e-1 (overview and Rosetta table) is Task 8b and 1e-2 (in-depth tool sections with shortcuts) is Tasks 8c-8f; 1f is Task 10; the facts-before-claims rule is Task 2; the testing section is Task 1 plus the exercise runs and the render in Task 10. The slide-count and README items are in Tasks 1 and 10. Stage 2 is deliberately excluded and gets its own plan.
- **Placeholders:** Slide wording that depends on docs is sourced from `facts.md`, which Task 2 creates from named URLs and questions; the required fields and shapes are listed per task.
- **Consistency:** Banned and required strings in Task 1 match the strings each later task names. If Task 2 changes a required string, the same commit updates the script.
