---
marp: true
theme: default
paginate: true
style: |
  section {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #0f0f0f;
    color: #f0f0f0;
    font-size: 23px;
    padding: 40px 56px;
  }
  pre { font-size: 0.78em; }
  table { font-size: 0.82em; }
  p { margin: 0.5em 0; }
  h1 { color: #d97757; font-size: 2.2rem; }
  h2 { color: #d97757; font-size: 1.6rem; }
  h3 { color: #e8a87c; }
  code { background: #1e1e1e; color: #ce9178; border-radius: 4px; padding: 2px 6px; }
  pre { background: #1e1e1e; border-left: 3px solid #d97757; border-radius: 6px; }
  pre code { background: transparent; color: #d4d4d4; }
  strong { color: #e8a87c; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  td code, th code { white-space: normal; overflow-wrap: anywhere; font-size: 0.8em; padding: 1px 4px; }
  table:has(th:nth-child(5)) th:first-child, table:has(th:nth-child(5)) td:first-child { width: 13%; }
  th { background: #d97757; color: #fff; padding: 5px 10px; }
  td { padding: 4px 10px; border-bottom: 1px solid #333; color: #f0f0f0; }
  table tr, table tbody tr { background: #161616; }
  table tbody tr:nth-child(2n) { background: #1f1f1f; }
  .small { font-size: 0.8rem; color: #aaa; }
---

# Coding Agents — Deep Dive
## The Five Extension Points

Claude Code · Codex · Cursor · Gemini CLI

Built for engineers who already use an AI coding agent and want to go further.

---

# What we're covering

| Extension Point | What it does |
|-----------------|-------------|
| **CLAUDE.md** | Persistent instructions that shape every session |
| **Subagents** | Spawn independent agents for parallel or isolated work |
| **Skills** | Reusable slash commands that invoke complex workflows |
| **MCP** | Connect Claude to external tools, APIs, and data |
| **Hooks** | Shell scripts that fire on Claude Code lifecycle events |

Each section: concept → how it works → hands-on exercise.

Then: the Claude ecosystem, a side-by-side of **Claude Code, Codex, Cursor and Gemini CLI** with a shortcuts reference for each, and where to keep learning.

---

# 1. CLAUDE.md
## Your persistent context layer

---

## What is CLAUDE.md?

Every session, Claude Code reads `CLAUDE.md` files automatically before doing anything else.

- **Project root:** applies to the whole project
- **Subdirectory:** applies when working in that folder
- **`~/.claude/CLAUDE.md`:** global, applies everywhere

It's not a prompt — it's a **standing set of rules** Claude treats as ground truth.

---

## What belongs in CLAUDE.md?

```markdown
# Project: payments-service

## Architecture
- Hexagonal architecture. Domain layer has zero framework imports.
- New services go in src/domain/services/

## Toolchain
- Package manager: pnpm (never npm/yarn)
- Test runner: vitest — run `pnpm test` before any commit
- Linter: biome — `pnpm lint:fix` before pushing

## Rules
- Never modify migration files after they've been committed
- All new API endpoints require a corresponding OpenAPI spec entry
- No console.log in committed code — use the logger module
```

---

## What does NOT belong in CLAUDE.md?

- Secrets, API keys, credentials
- Long prose that could be a README
- Instructions that change every session (use the chat instead)
- Everything — be surgical. Longer ≠ better.

**The test:** would a new engineer need to know this on day one?

---

## CLAUDE.md hierarchy

```
~/.claude/CLAUDE.md          ← global rules (always loaded)
  project/CLAUDE.md          ← project rules (loaded in project)
    project/src/CLAUDE.md    ← subtree rules (loaded in src/)
```

Rules **stack** — they don't override each other. More specific files add context; they don't replace parent rules.

---

## AGENTS.md and other files

Other coding agents read `AGENTS.md`. Claude Code reads it too (v2.1.277 and later):

| Your repo has | Claude Code reads |
|---------------|-------------------|
| `AGENTS.md` only | `AGENTS.md` |
| `CLAUDE.md` only | `CLAUDE.md` |
| Both | `CLAUDE.md` only |

To use one file for every tool, keep `AGENTS.md` as the source and put `@AGENTS.md` in your `CLAUDE.md`.

Also useful: `CLAUDE.local.md` for private instructions you don't commit, `.claude/rules/` for rules scoped to certain files, and `/init` to draft a CLAUDE.md from your codebase.

---

## 🛠 Exercise 1 — CLAUDE.md

See `exercises/01-claude-md.md`

**Goal:** Write a CLAUDE.md for an existing project that makes Claude meaningfully better at working in it.

Time: 15 minutes

---

# 2. Subagents
## Parallel and isolated work

---

## What is a subagent?

When Claude Code spawns a subagent, it launches a **new, independent Claude session** with its own context, tools, and instructions.

The parent waits (or continues) while the subagent works. Results come back as text.

```
Main Claude
  ├── Subagent A: "audit the auth module for security issues"
  ├── Subagent B: "generate test cases for the payment service"
  └── Subagent C: "write migration docs for this PR"
       ↓ all run in parallel ↓
  Parent collects results and synthesizes
```

---

## When to use subagents

✅ **Parallel work** — tasks that don't depend on each other

✅ **Context isolation** — task needs a clean slate (no prior conversation baggage)

✅ **Specialization** — different subagents get different CLAUDE.md instructions

✅ **Long-running tasks** — don't fill the main context window

❌ **Sequential work** — each step depends on the previous one

❌ **Simple one-step tasks** — spawning has overhead

---

## Spawning a subagent

In your CLAUDE.md or a skill, you can instruct Claude to spawn:

```markdown
## Agent Patterns

For audit tasks: spawn a subagent with subagent_type="code-reviewer".
For parallel research: spawn up to 3 subagents simultaneously.
Each subagent should return a structured JSON summary.
```

Or ask Claude directly in chat:
> "Spawn three subagents to analyze authentication, authorization, and session handling in parallel."

---

## Custom subagents

Save a specialist as a file and reuse it. A subagent is Markdown with YAML frontmatter, in `.claude/agents/` (project) or `~/.claude/agents/` (personal):

```markdown
---
name: reviewer
description: Reviews code for security and error handling. Use after code changes.
tools: Read, Grep, Glob
model: sonnet
---

You are a code reviewer. Report findings as: severity, file and line,
problem, suggested fix. Do not edit files.
```

`description` tells Claude when to delegate. `tools` limits what the subagent can do. Other fields include `disallowedTools`, `permissionMode`, `skills`, `mcpServers` and `isolation: worktree`.

---

## Running a custom subagent

| How | Example |
|-----|---------|
| **Name it** (guaranteed) | `@agent-reviewer review src/auth.ts` |
| **Describe the task** | Claude delegates when a subagent's `description` fits |
| **Whole session** | `claude --agent reviewer` |
| **No file needed** | `claude --agents '{"reviewer": {...}}'` for one session |

Built in: **Explore** (read-only search), **Plan** (research in plan mode), **general-purpose**. Subagents can spawn subagents, up to three levels deep by default.

---

## Subagent output

Subagents return their final message as a string. The parent can:
- Parse structured output (JSON, markdown)
- Synthesize multiple results
- Use output as context for next steps

**Key rule:** subagents start cold — they don't see the parent conversation. Brief them explicitly in the spawn prompt.

---

## 🛠 Exercise 2 — Subagents

See `exercises/02-subagents.md`

**Goal:** Use a subagent to do a code review in parallel with your main task.

Time: 15 minutes

---

# 3. Skills
## Reusable slash commands

---

## What is a Skill?

A Skill is a folder with a `SKILL.md` file that defines a reusable workflow. Type `/my-skill` and Claude Code loads the instructions inside it. Claude can also load a skill on its own when its `description` matches what you're doing.

Skills live in `.claude/skills/` (project) or `~/.claude/skills/` (personal).

```
~/.claude/skills/
  deploy-check/SKILL.md   → /deploy-check
  standup/SKILL.md        → /standup

.claude/skills/
  seed-db/SKILL.md        → /seed-db (project-only)
```

A skill folder can also hold extra files (`reference.md`, `scripts/`) that `SKILL.md` points to.

---

## Anatomy of a Skill

```markdown
---
name: deploy-check
description: Runs the pre-deploy verification sequence and reports READY or BLOCKED
---

# Deploy Checklist

## Steps

1. Run `npm test` and confirm all tests pass
2. Check `git status` — no uncommitted changes
3. Verify environment variables are set: DATABASE_URL, API_KEY
4. Run `npm run build` and confirm no errors
5. Check the last 5 commits for any migration files
6. Report: READY or BLOCKED with reasons

Report format:
**Status:** READY | BLOCKED
**Blockers:** (if any)
**Last commit:** (hash + message)
```

The block between the `---` lines is YAML frontmatter. `description` is what Claude reads to decide when the skill applies.

---

## Frontmatter fields worth knowing

| Field | What it does |
|-------|-------------|
| `name` | Command name. Defaults to the folder name |
| `description` | When Claude should use the skill |
| `argument-hint` | Autocomplete hint, e.g. `[issue-number]` |
| `disable-model-invocation` | `true` = only you can run it with `/name` |
| `allowed-tools` | Tools pre-approved while the skill runs |
| `context: fork` | Run the skill in an isolated subagent |

---

## Skills vs. CLAUDE.md

| | CLAUDE.md | Skill |
|-|-----------|-------|
| **When active** | Every session automatically | Only when invoked with `/skill-name` |
| **Purpose** | Standing rules and context | On-demand workflows |
| **Complexity** | Rules, not procedures | Step-by-step workflows |
| **Example** | "Always use pnpm" | "/deploy-check runs a 6-step verification" |

---

## Passing arguments to Skills

Everything you type after the skill name is available as `$ARGUMENTS`:

```
/review src/auth/session.ts
```

```markdown
---
name: review
description: Reviews a file or diff for security, error handling and test gaps
argument-hint: "[file]"
---

# Code Review Skill

Review the file or diff provided in $ARGUMENTS.

Focus on:
- Security vulnerabilities
- Error handling gaps
- Test coverage
```

Positional arguments are `$0`, `$1`, and so on. A line starting with `` !`git diff HEAD` `` runs the command first and injects its output.

---

## 🛠 Exercise 3 — Skills

See `exercises/03-skills.md`

**Goal:** Build a `/standup` skill that generates a daily standup summary from git log.

Time: 15 minutes

---

# 4. MCP
## Model Context Protocol

---

## What is MCP?

MCP (Model Context Protocol) is a standard for connecting AI models to external tools, data sources, and APIs.

An MCP server exposes **tools** — functions Claude can call like any other tool.

```
Claude Code
    │
    ├── mcp: filesystem    → read/write files
    ├── mcp: github        → PRs, issues, commits
    ├── mcp: postgres      → query your database
    ├── mcp: slack         → send messages, read channels
    └── mcp: your-server   → whatever you build
```

---

## MCP vs. plain API calls

| | Direct Bash/API | MCP Tool |
|-|-----------------|----------|
| **Discovery** | Claude has to know the command | Claude sees the tool's description |
| **Auth** | Handle in scripts | Server handles it |
| **Error handling** | Ad hoc | Structured error responses |
| **Reuse** | Per-project | Register once, available everywhere |
| **Composability** | Manual | Tools combine naturally |

---

## Registering an MCP server

Use `claude mcp add`:

```bash
# Local process (stdio). Everything after -- is the server command
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/Documents

# Remote server (HTTP)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# See what's registered, and whether it connected
claude mcp list
```

Inside a session, `/mcp` shows status and handles sign-in for servers that need OAuth.

---

## Scopes and `.mcp.json`

| Scope | Flag | Stored in | Shared? |
|-------|------|-----------|---------|
| **local** (default) | none | `~/.claude.json` | No. You, this project |
| **project** | `--scope project` | `.mcp.json` in the repo root | Yes, via git |
| **user** | `--scope user` | `~/.claude.json` | No. You, every project |

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" }
    },
    "docs": { "type": "stdio", "command": "node", "args": ["./docs-server.js"] }
  }
}
```

`${VAR}` and `${VAR:-default}` expand from the environment, so tokens stay out of git. Teammates approve project servers the first time they use them.

---

## Building an MCP server (TypeScript)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "time-server", version: "1.0.0" });

server.registerTool(
  "get_time",
  {
    description: "Get the current date and time",
    inputSchema: { timezone: z.string().optional() },
  },
  async ({ timezone }) => ({
    content: [{ type: "text", text: new Date().toLocaleString("en-US", { timeZone: timezone }) }],
  })
);

await server.connect(new StdioServerTransport());
```

Then register it: `claude mcp add time-server -- node dist/index.js`.

---

## Transports

| Transport | Use case |
|-----------|---------|
| **stdio** | Local servers run as child processes (most common) |
| **HTTP** | Remote servers, multiple clients. The recommended remote transport |
| **SSE** | Older remote transport. Deprecated in favor of HTTP |

Claude Code starts a stdio server itself and talks to it over stdin and stdout, so a stdio server must never print anything else to stdout.

---

## 🛠 Exercise 4 — MCP

See `exercises/04-mcp.md`

**Goal:** Register a pre-built MCP server (filesystem or GitHub) and use it in a real task.

Time: 20 minutes

---

# 5. Hooks
## Lifecycle automation

---

## What are Hooks?

Hooks are commands Claude Code runs automatically at specific points in its lifecycle. Unlike CLAUDE.md, a hook is **enforced**: the model can't ignore it.

```
SessionStart      → a session begins or resumes
UserPromptSubmit  → you send a prompt, before Claude sees it
PreToolUse        → before a tool runs (can block it)
PostToolUse       → after a tool succeeds
Stop              → Claude finishes a turn
SubagentStop      → a subagent finishes
PreCompact        → before the context is compacted
```

There are more than 30 events in total. The hook receives a JSON payload on stdin describing what happened.

---

## Hook use cases

| Event | What you can do |
|-------|----------------|
| **SessionStart** | Load project context, check the environment |
| **UserPromptSubmit** | Validate or enrich prompts, block bad ones |
| **PreToolUse** | Block dangerous commands, rewrite tool input, add logging |
| **PostToolUse** | Run a formatter or linter after edits, update trackers |
| **Stop** | Log cost and tokens, send notifications, trigger CI |
| **SubagentStop** | Collect or check subagent results |
| **PreCompact** | Save state before the context is summarized |

---

## Registering a hook

In `~/.claude/settings.json` (user), `.claude/settings.json` (project, shareable) or `.claude/settings.local.json` (project, private):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "python3 ~/hooks/usage.py" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "bash ~/hooks/lint_on_save.sh" }
        ]
      }
    ]
  }
}
```

An event holds **matcher groups**; each holds a list of **hooks**. `matcher` filters by tool name (`Bash`, `Edit`, `Write`, `mcp__server__tool`). Types: `command`, `http`, `mcp_tool`, `prompt`, `agent`.

---

## What a hook receives

Every hook gets common fields on stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/home/you/.claude/projects/.../abc123.jsonl",
  "cwd": "/home/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test" }
}
```

`tool_name` and `tool_input` appear on the tool events. Read stdin with `json.load(sys.stdin)` in Python or `process.stdin` in Node.

---

## The Stop hook payload

A Stop hook has no token counts in its payload. We captured one from a real run:

```json
{
  "session_id": "0737079f-...",
  "transcript_path": "/home/you/.claude/projects/.../0737079f-....jsonl",
  "cwd": "/home/you/my-project",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": false,
  "last_assistant_message": "ok"
}
```

To report cost or tokens, open `transcript_path` (a JSONL file) and read the `message.usage` and `message.model` of the `assistant` entries. That is what Exercise 5 does, with models like `claude-sonnet-5-5`.

---

## Hook exit codes

| Exit code | Meaning |
|-----------|---------|
| **0** | Success. If stdout is JSON, Claude Code parses it |
| **2** | **Block**, on events that can be blocked |
| **Other** | Non-blocking error. The action proceeds |

What exit 2 does depends on the event:

| Event | Exit 2 effect |
|-------|---------------|
| `PreToolUse` | Blocks the tool call |
| `UserPromptSubmit` | Blocks the prompt |
| `Stop` | Prevents Claude from stopping |
| `PostToolUse` | Shows the message to Claude (the tool already ran) |
| `PreCompact` | Blocks compaction |

---

## 🛠 Exercise 5 — Hooks

See `exercises/05-hooks.md`

**Goal:** Write a usage-reporting Stop hook, a file-edit logger, and a command blocker.

Time: 15 minutes

---

# 6. The Claude ecosystem
## Beyond the terminal

---

## Where Claude Code runs

| Surface | What it is |
|---------|-----------|
| **CLI** | The terminal interface, built for daily use |
| **Desktop app** | The Code tab in the Claude desktop app (macOS, Windows) |
| **Web** | claude.ai/code. Sessions run in the cloud |
| **VS Code** | The Claude Code extension |
| **JetBrains** | The Claude Code plugin for JetBrains IDEs |

Settings are shared: a plugin installed at user scope in the terminal, the desktop app or VS Code works in all three. Cloud sessions don't load your local plugins.

**Fast mode** (`/fast`, or `Option+O` / `Alt+O`): the same Opus model on a faster, pricier configuration, up to 2.5x faster. Opus only; needs usage credits on subscription plans.

---

## Remote Control vs cloud sessions

| | Remote Control | Cloud session |
|-|----------------|---------------|
| **Runs on** | Your machine | Anthropic's infrastructure (or your org's runners) |
| **You drive it from** | claude.ai/code or the Claude mobile app | claude.ai/code, mobile, Slack |
| **Your files, MCP servers, config** | Stay local and available | Cloned into the cloud environment |
| **Start** | `claude remote-control`, `claude --remote-control` (or `--rc`), or `/remote-control` (`/rc`) in a session | Start a session at claude.ai/code |

Remote Control needs Pro, Max, Team or Enterprise. On Team and Enterprise an Owner must enable it first. API keys aren't supported.

---

## Claude Tag
## Claude in your team's Slack

Claude Tag is Claude working in your Slack channels as your organization's shared identity, with access an admin configures. It's in public beta, on Team and Enterprise plans only.

Setup, done by an Owner of the Claude organization:

1. Install the Claude app from the Slack Marketplace
2. `/invite @Claude` to a channel, then send `@Claude connect` (a Slack workspace admin must do this)
3. Paste the one-time pairing code (valid 15 minutes) into the admin page
4. Launch, and pick channels

On Pro and Max, the earlier Claude Code in Slack works instead: each user connects their own account, and `@Claude` starts a cloud session in a channel.

---

## Claude Cowork

Cowork brings Claude Code's agentic architecture to **knowledge work, with no terminal**. Describe an outcome, step away, and come back to finished work: documents, organized files, researched summaries.

- Runs tasks in the cloud (beta on Team and Enterprise), saved to your Claude account
- Available in the desktop app, on the web, on mobile, and in the Chrome side panel, on paid plans
- Example: "Organize my Downloads folder by type and date"

Same engine, different audience. Claude Code is for developers working in a repo; Cowork is for everyone else on the team.

---

## Build your own: SDK, API, Managed Agents

| You want to | Use |
|-------------|-----|
| Embed Claude Code's agent in your own Python or TypeScript app | **Agent SDK**: the same tools, agent loop and context management |
| Work interactively in a terminal | **Claude Code CLI** |
| Call the model directly and write your own tool loop | **Claude API** (client SDKs) |
| Have Anthropic host the agent in a managed sandbox | **Managed Agents** (beta) |

The Agent SDK exposes the five extension points from this deck: hooks, subagents, MCP, skills and permissions. Other languages can drive the CLI with `claude -p --output-format json`.

---

## Claude in Chrome

Connect Claude Code to your browser: `claude --chrome`, then `/chrome` to check the connection.

- Opens tabs in your own logged-in browser; pauses for logins and CAPTCHAs
- Read console logs and the DOM, test a local web app, fill forms, extract data, record GIFs
- Works with Chrome, Edge and other Chromium browsers. Needs the extension and a claude.ai login (not an API key)

For native Mac apps that a browser can't reach, Claude Code also has computer use.

---

## Which model?

| Model | API ID | Best for | Price per MTok (in / out) |
|-------|--------|----------|--------------------------|
| **Fable 5.1** | `claude-fable-5-1` | Demanding reasoning, long-horizon agent work | $10 / $50 |
| **Opus 5.5** | `claude-opus-5-5` | Long-running agentic coding. The docs' starting point | $4 / $20 |
| **Sonnet 5.5** | `claude-sonnet-5-5` | Best mix of speed and intelligence | $2 / $10 |
| **Haiku 5.5** | `claude-haiku-5-5` | High-volume, latency-sensitive tasks | from $0.10 / $0.50 |

All four have a 1M-token context window. Switch in a session with `/model`, or `Option+P` / `Alt+P`.

---

## Plugins

A **plugin** packages skills, subagents, hooks and MCP servers as one installable unit. Use one to share a setup with your team; use the individual pieces on their own when you don't need to.

```
my-plugin/
  .claude-plugin/plugin.json   ← manifest (name, version)
  skills/review/SKILL.md       → /my-plugin:review
  agents/reviewer.md           ← subagent
  hooks/hooks.json             ← lifecycle hooks
  .mcp.json                    ← MCP servers
```

- Browse and install: `/plugin` in a session. Disable from the shell with `claude plugin disable`
- A **marketplace** is a catalog (`.claude-plugin/marketplace.json`). Install by name: `commit-commands@claude-plugins-official`
- Try one from a folder with `--plugin-dir`
- Test one with `claude plugin eval`. Check its files with `claude plugin validate`

A plugin can run code as you. Review one before you install it.

---

## Permissions

Every tool call is checked. You choose how much Claude can do without asking.

| Mode | What happens |
|------|-------------|
| `default` (Manual) | Asks the first time each tool is used |
| `acceptEdits` | Auto-accepts file edits and simple filesystem commands |
| `plan` | Reads and explores, but doesn't edit |
| `auto` | A classifier reviews actions instead of you |
| `dontAsk` | Denies anything that would prompt. Good for CI |
| `bypassPermissions` | Skips prompts. Use only in a sandbox |

Cycle modes with `Shift+Tab`. Set a default with `defaultMode` in settings.

---

## Permission rules

Allow and deny specific tool calls in `settings.json`:

```json
{
  "permissions": {
    "allow": ["Bash(npm run test *)", "Read"],
    "deny": ["Read(./.env)", "Bash(rm *)"]
  }
}
```

A deny rule at **any** level beats an allow rule. Managed (organization) settings sit at the top and can't be overridden.

---

## Non-interactive (headless) mode

`claude -p` runs one prompt and exits. It works in scripts and CI.

```bash
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"
cat build-error.txt | claude -p "explain the root cause" > output.txt
```

| Flag | What it does |
|------|-------------|
| `--output-format text\|json\|stream-json` | Plain text, one JSON object, or a stream. JSON includes `total_cost_usd` |
| `--allowedTools "Read,Edit"` | Pre-approve tools so nothing waits on a prompt |
| `--permission-mode dontAsk` | Deny everything not pre-approved |
| `--continue`, `--resume <id>` | Continue an earlier conversation |
| `--bare` | Skip hooks, plugins, MCP and CLAUDE.md for a reproducible CI run. Needs `ANTHROPIC_API_KEY` |

The same engine is available as a Python and TypeScript library: the Agent SDK.

---

# 7. Four coding agents, side by side
## Claude Code · Codex · Cursor · Gemini CLI

---

## The same five ideas everywhere

Every one of these tools has the same building blocks. The ideas transfer; the file names, formats and commands differ.

| Idea | What it is |
|------|-----------|
| **Instructions file** | Standing rules loaded every session |
| **Subagents** | Specialists with their own context |
| **Skills / commands** | Reusable workflows |
| **MCP** | External tools and data |
| **Hooks** | Scripts at lifecycle events |

The next slides map each idea across all four tools, using each vendor's official docs.

<p class="small">Compared as of 2026-10-07. A dash (—) means we could not confirm it in the official docs on that date. It does not mean the feature is missing.</p>

---

## Rosetta table: instructions, agents, skills, MCP

| | Claude Code | Codex | Cursor | Gemini CLI |
|-|-------------|-------|--------|------------|
| **Instructions** | `CLAUDE.md` (also reads `AGENTS.md` if no `CLAUDE.md`) | `AGENTS.md`, `AGENTS.override.md` | `.cursor/rules/*.mdc`, `AGENTS.md` | `GEMINI.md` (can read `AGENTS.md`) |
| **Subagents** | `.claude/agents/*.md` | `.codex/agents/*.toml` | `.cursor/agents/*.md` (also reads `.claude/` and `.codex/`) | `.gemini/agents/*.md` |
| **Skills** | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` | `.agents/skills/` or `.cursor/skills/` | `.gemini/skills/` or `.agents/skills/`; custom commands in `.toml` |
| **MCP** | `claude mcp add`, `.mcp.json` | `codex mcp add`, `config.toml` | `.cursor/mcp.json` | `gemini mcp add` |

<p class="small">Compared as of 2026-10-07. — = not confirmed in official docs.</p>

---

## Rosetta table: hooks, permissions, CI, cloud

| | Claude Code | Codex | Cursor | Gemini CLI |
|-|-------------|-------|--------|------------|
| **Hooks** | `settings.json`, 30+ events | `hooks.json` or `config.toml`, same shape | `.cursor/hooks.json`, camelCase events | `settings.json`, `BeforeTool` style events |
| **Exit code 2 blocks** | Yes | Yes | Yes | Yes |
| **Permissions** | Modes + allow/deny rules | Sandbox + approval policy | `/sandbox` | `--approval-mode` + sandbox |
| **Non-interactive** | `claude -p` | `codex exec` | `agent -p` | `gemini -p` |
| **Remote / cloud** | Remote Control, cloud sessions | `--remote` app server | Cloud Agents | — |

<p class="small">Compared as of 2026-10-07. — = not confirmed in official docs.</p>

---

## What carries over between tools

| Shared | Detail |
|--------|--------|
| **`AGENTS.md`** | Read by Codex and Cursor. Claude Code reads it when there is no `CLAUDE.md`. Gemini CLI reads it if you set `context.fileName` |
| **`SKILL.md` skills** | The same folder format in all four. Codex, Cursor and Gemini CLI all read `.agents/skills/` |
| **Subagent files** | Cursor also reads `.claude/agents/` and `.codex/agents/` |
| **Hook config** | Codex uses the same `matcher` + nested `hooks` JSON shape as Claude Code |

Claude Code looks in `.claude/skills/`, not `.agents/skills/`, so copy shared skills there.

<p class="small">Compared as of 2026-10-07.</p>

---

## Moving a project into Claude Code

| From | What to do |
|------|-----------|
| **Instructions** | Keep your `AGENTS.md`. Claude Code reads it when there's no `CLAUDE.md`. To add Claude-only notes, create `CLAUDE.md` containing `@AGENTS.md` |
| **MCP (Codex)** | Each `[mcp_servers.x]` becomes `claude mcp add x -- <command>`. Example: `codex mcp add context7 -- npx -y @upstash/context7-mcp` is `claude mcp add context7 -- npx -y @upstash/context7-mcp` |
| **MCP (Cursor)** | `.cursor/mcp.json` already uses `mcpServers`. Copy it to `.mcp.json`, and add `"type": "http"` to `url` entries |
| **Skills** | Copy `.agents/skills/*` into `.claude/skills/` |
| **Subagents** | Cursor's Markdown files are close. Codex's `.toml` becomes Markdown, with `developer_instructions` as the body |
| **Hooks** | Codex hooks keep their shape. Re-check matcher tool names |

<p class="small">Compared as of 2026-10-07.</p>

---

## Moving a project out of Claude Code

| To | What to do |
|----|-----------|
| **Codex / Cursor** | Put shared rules in `AGENTS.md`. Both read it |
| **Gemini CLI** | Set `context.fileName` to include `AGENTS.md`, or keep a `GEMINI.md` |
| **MCP** | Re-add each server. Codex: `codex mcp add <name> -- <command>`. Gemini CLI: `gemini mcp add <name> <command>`. Cursor: `.cursor/mcp.json` |
| **Skills** | Move to `.agents/skills/`, which Codex, Cursor and Gemini CLI all read |
| **Subagents** | Cursor reads `.claude/agents/` as is. Codex needs `.toml`. Gemini CLI uses `.gemini/agents/` |
| **Hooks** | Event names and JSON differ in Cursor and Gemini CLI; rewrite them |

<p class="small">Compared as of 2026-10-07.</p>

---

## Using more than one tool on a team

Aim for one source of truth, and keep tool-specific config small.

1. **`AGENTS.md`** holds the shared rules. Add `@AGENTS.md` to `CLAUDE.md`
2. **`.agents/skills/`** holds shared skills, copied to `.claude/skills/` for Claude Code
3. **MCP and hook config stay per tool.** They differ in format (JSON, TOML) and in event names
4. **Review permissions per tool.** Defaults differ: Codex sandboxes by default, Claude Code asks per tool, Gemini CLI has approval modes

Pick conventions once and write them in `AGENTS.md`, not in four places.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gotchas going in either direction

- **Filenames are not interchangeable.** `CLAUDE.md` is not read by Codex; `GEMINI.md` is not read by Cursor
- **Skills look the same but live in different folders.** Check the folder, not just the format
- **Hook event names differ.** Claude Code `PreToolUse`, Gemini CLI `BeforeTool`, Cursor `preToolUse`
- **Nested instruction files:** closer files win in Codex and Cursor; Claude Code and Gemini CLI both load more specific files as you work in subfolders
- **Docs move.** Codex's docs now live at `learn.chatgpt.com`; re-check a command before you rely on it

<p class="small">Compared as of 2026-10-07.</p>

---

# 8. Claude Code: shortcuts and commands
## The day-to-day reference

---

## Claude Code shortcuts (1/2): session, modes, navigation

| Group | Shortcut | Action |
|-------|----------|--------|
| **Session** | `Ctrl+C` | Interrupt; if idle, clear input; press again to exit |
| | `Esc` | Stop Claude mid-turn, or close a dialog |
| | `Esc` `Esc` | Clear the draft, or open the rewind menu when empty |
| | `Ctrl+B` | Send running tasks to the background |
| | `Ctrl+D` | Exit (press twice) |
| **Modes** | `Shift+Tab` | Cycle permission modes |
| | `Option+P` / `Alt+P` | Switch model |
| | `Option+T` / `Alt+T` | Toggle extended thinking |
| | `Option+O` / `Alt+O` | Toggle fast mode |
| **Navigate** | `Ctrl+R` | Reverse-search history |
| | `Ctrl+O` | Transcript viewer (tool details) |
| | `Ctrl+T` | Show or hide the task checklist |
| | `Ctrl+L` | Redraw the screen |

<p class="small">Checked on macOS, 2026-10-07. On macOS the `Alt` combinations in the next slide need Option set as Meta in your terminal.</p>

---

## Claude Code shortcuts (2/2): editing and input

| Group | Shortcut | Action |
|-------|----------|--------|
| **Edit** | `Ctrl+A` / `Ctrl+E` | Start / end of line |
| | `Ctrl+K` / `Ctrl+U` | Delete to end / start of line |
| | `Ctrl+W` | Delete back to previous whitespace |
| | `Ctrl+Y` | Paste what you just deleted |
| | `Ctrl+G` | Edit the prompt in your editor |
| | `Ctrl+S` | Stash or restore the prompt |
| | `Ctrl+V` | Paste an image |
| **Newline** | `\` then `Enter`, or `Ctrl+J` | Works in any terminal |
| | `Shift+Enter` | Native in iTerm2, WezTerm, Ghostty, Kitty, Warp, Apple Terminal |
| **Prefixes** | `/` | Command or skill |
| | `!` | Run a shell command and show Claude the output |
| | `@` | Mention a file |
| | `?` on empty input | Show the shortcut panel |

---

## Claude Code commands cheat sheet (1/2)

| Command | Does |
|---------|------|
| `/init` | Draft a `CLAUDE.md` for the project |
| `/clear` | Start a new conversation |
| `/compact` | Summarize to free context |
| `/context` | Show context usage |
| `/model`, `/fast` | Switch model; toggle fast mode |
| `/permissions` | Manage allow, ask and deny rules |
| `/memory` | Edit CLAUDE.md and auto memory |

---

## Claude Code commands cheat sheet (2/2)

| Command | Does |
|---------|------|
| `/mcp`, `/plugin`, `/skills`, `/hooks` | Inspect and manage extensions |
| `/resume`, `/rewind` | Reopen a conversation; roll back |
| `/diff` | Review changes in the working tree |
| `/tasks` | Background work and subagents |
| `/usage` | Cost and plan limits (`/cost` is an alias) |
| `/remote-control` (`/rc`) | Continue this session from claude.ai |
| `/btw` | Side question that doesn't add to context |
| `/doctor` | Diagnose your setup |

Type `/` to see everything, including your skills and plugin commands.

---

# 9. Codex
## OpenAI's coding agent

---

## Codex: what it is and how to start

Codex runs as a terminal CLI and as a desktop app, which can also run chats in the cloud.

```bash
# macOS / Linux
curl -fsSL https://chatgpt.com/codex/install.sh | sh

codex                      # interactive terminal UI
codex "explain this repo"  # start with a prompt
codex resume               # reopen a recent session
```

Sign in with your ChatGPT account (or another available method). Windows has a separate installer, and an npm install is available.

User config lives in `~/.codex/config.toml`; a project can add `.codex/config.toml`.

<p class="small">Compared as of 2026-10-07. Docs: learn.chatgpt.com/docs (developers.openai.com/codex redirects there).</p>

---

## Codex: instructions

Codex reads `AGENTS.md`, from several places, then merges them:

1. Global: `~/.codex/AGENTS.override.md`, or `~/.codex/AGENTS.md`
2. Project: from the Git root down to your current directory, each level checked for `AGENTS.override.md`, then `AGENTS.md`

Files are joined root to current directory, so **closer files override earlier guidance**. The combined size is capped at 32 KiB by default (`project_doc_max_bytes`).

`/init` creates an `AGENTS.md` scaffold for the project.

<p class="small">Compared as of 2026-10-07.</p>

---

## Codex: subagents and skills

**Subagents** are TOML files in `.codex/agents/` (project) or `~/.codex/agents/` (personal):

```toml
name = "reviewer"
description = "Reviews code for security and error handling"
developer_instructions = """
You are a code reviewer. Report findings with severity, file and line.
"""
sandbox_mode = "read-only"
```

Built in: `default`, `worker`, `explorer`. Ask for them in a prompt ("spawn one agent per point").

**Skills** use the same `SKILL.md` format as Claude Code, in `.agents/skills/<name>/` (repo) or `~/.agents/skills/` (personal). Plugins: `codex plugin add <plugin>`.

<p class="small">Compared as of 2026-10-07.</p>

---

## Codex: MCP

In `config.toml`:

```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"
```

Or from the shell:

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
codex mcp list
```

Project-level servers go in `.codex/config.toml` (trusted projects only).

<p class="small">Compared as of 2026-10-07.</p>

---

## Codex: hooks

Hooks live in `hooks.json` or `config.toml`, at `~/.codex/` or `<repo>/.codex/`. The shape matches Claude Code's:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          { "type": "command", "command": "python3 ~/.codex/hooks/session_start.py" }
        ]
      }
    ]
  }
}
```

Events include `PreToolUse`, `PostToolUse`, `PermissionRequest`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `PreCompact`, `SessionStart`, `SessionEnd`. Exit `2` blocks. Hooks get `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `model` on stdin.

<p class="small">Compared as of 2026-10-07.</p>

---

## Codex: permissions

Two separate controls:

| Sandbox (`sandbox_mode`) | What Codex can do |
|--------------------------|-------------------|
| `workspace-write` | Edit files and run commands in the working directory. The default in version-controlled folders |
| `read-only` | Read and run commands but not modify. The default elsewhere |
| `danger-full-access` | No sandbox and no approvals |

| Approvals (`approval_policy`) | Behavior |
|-------------------------------|----------|
| `on-request` | Asks before going outside the sandbox or using the network |
| `never` | No prompts; the sandbox still applies |

Change them in the terminal UI with **`/permissions`**.

<p class="small">Compared as of 2026-10-07.</p>

---

## Codex: non-interactive use

```bash
codex exec "run the tests and fix failures"
codex exec resume <SESSION_ID>
```

| Flag | Does |
|------|------|
| `--json` | Newline-delimited JSON events |
| `-o, --output-last-message <file>` | Write the final message to a file |
| `--output-schema <file>` | Validate the result against a JSON Schema |
| `--ephemeral` | Don't save session files |
| `-s read-only\|workspace-write\|danger-full-access` | Set the sandbox |
| `-a on-request\|never` | Set approvals |

<p class="small">Compared as of 2026-10-07.</p>

---

## Codex shortcuts and commands (partial)

| What | Verified |
|------|----------|
| `@` | Mention a file |
| `!` | Run a shell command |
| `Ctrl+G` | Open your editor (`$VISUAL` / `$EDITOR`) for a long prompt |
| `/init` | Generate an `AGENTS.md` scaffold |
| `/status` | Show session info |
| `/permissions` | Change sandbox and approvals |
| `/model` | Choose the model |
| `/review` | Review uncommitted changes |
| `/mcp` | Show MCP server status |
| `codex resume` | Reopen a recent session |

**Not confirmed:** a complete list of terminal key bindings. Codex's docs point to a "CLI interactive shortcuts" section we could not retrieve. Run `/help` in Codex or see the Developer commands page.

<p class="small">Compared as of 2026-10-07.</p>

---

## Codex: equivalents elsewhere

| Codex | Claude Code | Cursor | Gemini CLI |
|-------|-------------|--------|------------|
| `AGENTS.md` | `CLAUDE.md` or `AGENTS.md` | `.cursor/rules`, `AGENTS.md` | `GEMINI.md` |
| `.codex/agents/*.toml` | `.claude/agents/*.md` | `.cursor/agents/*.md` | `.gemini/agents/*.md` |
| `codex mcp add` | `claude mcp add` | `.cursor/mcp.json` | `gemini mcp add` |
| `/permissions` | `Shift+Tab`, `/permissions` | `Shift+Tab` (modes) | `Shift+Tab` (approval modes) |
| `codex exec` | `claude -p` | `agent -p` | `gemini -p` |

<p class="small">Compared as of 2026-10-07.</p>

---

# 10. Cursor
## The editor and its agent

---

## Cursor: what it is and how to start

Cursor has several surfaces that share rules and MCP servers:

- **Desktop app** with an Agent chat panel
- **CLI**, with the command `agent`
- **Cloud Agents** that run in isolated VMs (paid plan)

```bash
# macOS, Linux, WSL
curl https://cursor.com/install -fsS | bash

agent --version
agent            # interactive
agent update     # update
```

Add `~/.local/bin` to your `PATH` after installing. Modes: **Agent**, **Plan** (`/plan`), **Ask** (`/ask`).

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor: instructions

Four kinds, in precedence order **Team, then Project, then User**:

| Kind | Where |
|------|-------|
| **Project Rules** | `.cursor/rules/*.mdc` (must be `.mdc`) |
| **User Rules** | Global, in Cursor settings. Used by Agent chat, not Inline Edit |
| **Team Rules** | Managed from the dashboard |
| **`AGENTS.md`** | Plain Markdown in the project root. Nested files allowed; deeper wins |

```markdown
---
description: React component conventions
globs: src/**/*.tsx
alwaysApply: false
---
Use function components. Keep props types in the same file.
```

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor: subagents and skills

**Subagents** are Markdown with YAML frontmatter in `.cursor/agents/` (also reads `.claude/agents/` and `.codex/agents/`):

```markdown
---
name: verifier
description: Confirms a change works end to end
model: inherit
readonly: true
---
You verify completed work. Run the checks and report what you saw.
```

Invoke with `/verifier ...`, by name, or let the Agent delegate. Built in: Explore, Bash, Browser.

**Skills** are `SKILL.md` folders in `.agents/skills/` or `.cursor/skills/`, run by typing `/` in Agent chat.

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor: MCP

In `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "local-tool": {
      "command": "npx",
      "args": ["-y", "mcp-server"],
      "env": { "API_KEY": "value" }
    },
    "remote-tool": {
      "url": "http://localhost:3000/mcp",
      "headers": { "API_KEY": "value" }
    }
  }
}
```

Transports: stdio, SSE and Streamable HTTP. The MCP docs describe the Cursor Marketplace and manual `mcp.json`; they don't describe a CLI add command.

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor: hooks

`hooks.json` in `~/.cursor/` (user) or `<project>/.cursor/` (project):

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [
      { "command": "./hooks/format.sh", "timeout": 30, "type": "command", "matcher": "*" }
    ]
  }
}
```

Events use camelCase: `sessionStart`, `preToolUse`, `postToolUse`, `beforeShellExecution`, `afterFileEdit`, `beforeSubmitPrompt`, `subagentStart`, `subagentStop`, `preCompact`, `stop`, and more. Exit `2` blocks; other failures let the action proceed unless `failClosed: true`.

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor: permissions and cloud

In the CLI, `/sandbox` or `--sandbox enabled|disabled` toggles sandboxing and network access, and the setting persists across sessions. Allow and deny rule syntax wasn't covered in the pages we checked.

**Cloud Agents** run in isolated VMs with a full dev environment. Start one from:

- The desktop **Cloud** dropdown, `cursor.com/agents` on web, or the iOS app
- `@cursor` in Slack, GitHub or Bitbucket comments, or Linear
- The API

In the CLI, start a message with **`&`** to send it to the cloud.

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor: non-interactive use

```bash
agent -p "find and fix the failing test"
agent -p "summarize the repo" --output-format json
agent resume              # also: agent --continue
agent --resume <thread-id>
agent ls                  # list previous chats
```

`-p` (or `--print`) is for scripts, CI and automation. Output formats: `text` and `json`.

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor shortcuts (1/2): CLI

| Key | Action |
|-----|--------|
| `Shift+Tab` | Rotate Agent, Plan, Ask modes |
| `Shift+Enter` or `Ctrl+J` | New line |
| `Up` | Previous messages |
| `Ctrl+R` | Review changes |
| `Ctrl+D` twice | Exit |

Slash commands: `/plan`, `/ask`, `/summarize`, `/resume`. Start a message with `&` to send it to the cloud.

<p class="small">Compared as of 2026-10-07.</p>

---

## Cursor shortcuts (2/2): editor (macOS)

| Key | Action |
|-----|--------|
| `Cmd+I` / `Cmd+L` | Toggle side panel |
| `Cmd+K` | Inline edit |
| `Cmd+Shift+L` | Add selection as context |
| `Cmd+N` | New chat |
| `Cmd+.` | Mode menu |
| `Cmd+Shift+P` | Command palette |
| `Tab` | Accept a suggestion |

<p class="small">Compared as of 2026-10-07. Editor keys are macOS only on the docs page.</p>

---

## Cursor: equivalents elsewhere

| Cursor | Claude Code | Codex | Gemini CLI |
|--------|-------------|-------|------------|
| `.cursor/rules/*.mdc`, `AGENTS.md` | `CLAUDE.md` or `AGENTS.md` | `AGENTS.md` | `GEMINI.md` |
| `.cursor/agents/*.md` | `.claude/agents/*.md` | `.codex/agents/*.toml` | `.gemini/agents/*.md` |
| `.cursor/mcp.json` | `claude mcp add`, `.mcp.json` | `codex mcp add` | `gemini mcp add` |
| `hooks.json`, camelCase | `settings.json` hooks | `hooks.json`, same shape | `BeforeTool` style hooks |
| `agent -p` | `claude -p` | `codex exec` | `gemini -p` |

<p class="small">Compared as of 2026-10-07.</p>

---

# 11. Gemini CLI
## Google's coding agent

---

## Gemini CLI: what it is and how to start

An open-source terminal agent from Google.

```bash
npm install -g @google/gemini-cli
gemini
```

On first run, choose **Sign in with Google**. Some account types need a Google Cloud project. Check usage with `/stats model`.

Settings live in `settings.json`. Google has other coding products (Jules, Antigravity, Gemini Code Assist); this section covers the CLI.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI: instructions

`GEMINI.md` is loaded from three places and concatenated:

1. Global: `~/.gemini/GEMINI.md`
2. Workspace: your workspace directories and their parents
3. Just in time: when a tool touches a path, `GEMINI.md` files in that directory and its ancestors

Split a big file with `@file.md` imports. `/memory show` prints the combined context, and `/memory reload` rescans it. `/init` generates a starter file.

To use `AGENTS.md` too, set `context.fileName` in `settings.json`; it accepts several names.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI: agents, commands, skills, extensions

**Subagents**: Markdown with YAML frontmatter in `.gemini/agents/` or `~/.gemini/agents/`.

```markdown
---
name: reviewer
description: Reviews code for security and error handling
max_turns: 30
---
You are a code reviewer. Report severity, file and line, and a fix.
```

Invoke with `@reviewer ...`. Built in: `codebase_investigator`, `cli_help`, `generalist`, `browser_agent` (off by default).

**Custom commands**: TOML in `.gemini/commands/`. `git/commit.toml` becomes `/git:commit`.

```toml
description = "Summarize a file"
prompt = "Summarize this in three bullets: {{args}}"
```

**Skills**: `.gemini/skills/` or `.agents/skills/`. **Extensions** bundle all of these.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI: MCP and extensions

```bash
gemini mcp add github npx -y @modelcontextprotocol/server-github
gemini mcp add remote https://example.com/mcp --transport http
gemini mcp add db npx my-db-server --env KEY=value
gemini mcp add db npx my-db-server --include-tools query,schema
```

Inside a session, `/mcp` manages servers.

An **extension** packages prompts, MCP servers, custom commands, themes, hooks, subagents and skills:

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md",
  "mcpServers": { "nodeServer": { "command": "node", "args": ["server.js"] } }
}
```

`gemini extensions install <url>`, `list`, `link .` for local development.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI: hooks

Hooks go in `settings.json`, and manage with `/hooks`:

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          { "name": "security-check", "type": "command",
            "command": "$GEMINI_PROJECT_DIR/.gemini/hooks/security.sh", "timeout": 5000 }
        ]
      }
    ]
  }
}
```

Events: `SessionStart`, `SessionEnd`, `BeforeAgent`, `AfterAgent`, `BeforeModel`, `AfterModel`, `BeforeToolSelection`, `BeforeTool`, `AfterTool`, `PreCompress`, `Notification`.

Exit `0` parses stdout as JSON, exit `2` blocks, other codes warn and continue.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI: permissions

**Approval modes** (`--approval-mode`): `default`, `auto_edit`, `yolo`, `plan`. In a session, `Shift+Tab` cycles them and `Ctrl+Y` toggles YOLO. `/permissions` manages folder trust.

**Sandboxing**, any one of:

- Flag: `-s` or `--sandbox`
- Environment: `GEMINI_SANDBOX=true|docker|podman|sandbox-exec|runsc|lxc`
- Setting: `"sandbox": true`

Methods include macOS Seatbelt, containers, Windows native, gVisor and LXC.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI: non-interactive use

Headless mode starts when you pass `-p` or run without a TTY.

```bash
gemini -p "summarize the open TODOs" -o json
cat build.log | gemini -p "explain the failure"
gemini -p "refactor foo.ts" --approval-mode auto_edit
```

| Output | Contains |
|--------|----------|
| `json` | `response`, `stats`, optional `error` |
| `stream-json` | Events: `init`, `message`, `tool_use`, `tool_result`, `error`, `result` |

Exit codes: `0` success, `1` error, `42` input error, `53` turn limit exceeded. `-i` runs a prompt and then stays interactive.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI shortcuts (1/2): session, modes, navigation

| Group | Shortcut | Action |
|-------|----------|--------|
| **Session** | `Ctrl+C` | Cancel; quit when input is empty |
| | `Ctrl+D` | Exit when input is empty |
| | `Esc` | Dismiss or cancel |
| | `Ctrl+Z` | Suspend |
| **Modes** | `Shift+Tab` | Cycle approval modes |
| | `Ctrl+Y` | Toggle YOLO |
| | `Alt+M` | Toggle Markdown rendering |
| **Navigate** | `Ctrl+R` | Reverse search history |
| | `Ctrl+P` / `Ctrl+N` | Previous / next history |
| | `Ctrl+O` | Expand or collapse blocks |
| | `Ctrl+T` | Toggle the full TODO list |
| | `Ctrl+L` | Clear and redraw |

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI shortcuts (2/2): editing and input

| Group | Shortcut | Action |
|-------|----------|--------|
| **Edit** | `Ctrl+A` / `Ctrl+E` | Start / end of line |
| | `Ctrl+K` / `Ctrl+U` | Delete to end / start |
| | `Ctrl+W` | Delete previous word |
| | `Ctrl+G` | Open prompt in editor |
| **Input** | `Shift+Enter` or `Ctrl+J` | New line |
| | `Tab` | Queue the prompt after the current task |
| | `@path`, `!cmd` | Inject a file; run a shell command |

`/vim` toggles Vim mode.

<p class="small">Compared as of 2026-10-07.</p>

---

## Gemini CLI: equivalents elsewhere

| Gemini CLI | Claude Code | Codex | Cursor |
|------------|-------------|-------|--------|
| `GEMINI.md` | `CLAUDE.md` or `AGENTS.md` | `AGENTS.md` | `.cursor/rules`, `AGENTS.md` |
| `.gemini/agents/*.md` | `.claude/agents/*.md` | `.codex/agents/*.toml` | `.cursor/agents/*.md` |
| Custom commands (`.toml`) | Skills (`SKILL.md`) | Skills (`SKILL.md`) | Skills (`SKILL.md`) |
| `gemini mcp add` | `claude mcp add` | `codex mcp add` | `.cursor/mcp.json` |
| `gemini -p` | `claude -p` | `codex exec` | `agent -p` |

<p class="small">Compared as of 2026-10-07.</p>

---

# 12. Choosing and using any tool
## Pick one, check it, use it safely

What AI coding assistants are, what they can do, and how to use any of them responsibly.

<p class="small">Merged from the former ai-coding-assistants-guide. Its facts were read from vendor docs on 2026-10-02 and were not re-verified here; where it overlaps the sections above, the sections above win.</p>

---

## The landscape

| Tool | Made by | Style |
|---|---|---|
| Aider | Open source | Terminal pair programmer that commits every change to git |
| Claude Code | Anthropic | Agent for terminal, IDEs, desktop, and web |
| Codex | OpenAI | Terminal, IDE, desktop, and cloud coding agent |
| Cursor | Anysphere | AI code editor with Tab, chat, and an agent mode |
| Gemini CLI | Google | Open-source terminal agent |
| GitHub Copilot | GitHub / Microsoft | Suggestions and chat in your editor, plus agent tasks |
| Windsurf (now Devin Desktop) | Cognition | Standalone AI IDE with an agent |

---

## What is a coding assistant?

A coding assistant is an AI that helps you write, read, fix, and explain code. You describe what you want in plain language and it responds with code, explanations, or actions. Some only suggest text as you type. Others can act: open files, edit them, run commands, and check their own work.

### What using one really means

- You become the reviewer. Your job shifts from typing every line to deciding what is right.
- You stay accountable. The tool drafts, you ship.
- The more it can do, the more it can do wrong. Autonomy and risk grow together.
- Clear instructions give clear results. Vague requests give vague code.

---

## What to look for in any of them

- Control: can you choose when it asks before editing files or running commands?
- Privacy: where does your code go, and is it used for training?
- Fit: does it work in the editor or terminal you already use?
- Cost: is pricing per seat, per use, or bring-your-own key, and what are the limits?
- Approval: is it on your organization's approved list?

<p class="small">No tool is best for everyone. Pick for your work, your team, and your rules.</p>

> **Professional use: check with IT first.** If you are using an AI coding assistant for work, check with your IT or security team before you use it. Your organization may restrict which tools are allowed, what data and code can be shared with them, and how the output may be used. It is your responsibility to follow those rules. This guide is general information, not legal, security, or compliance advice.

---

## Pick Your Tool: Step 0: is it approved?

Before you compare features, check with your IT or security team. If a tool is not approved for work, it does not matter how good it is.

> **Risk.** Using an unapproved tool on work code can break company policy. It is your responsibility to check first.

---

## Pick Your Tool: Tick what matters to you (1/2)

*In the interactive app you can tick the needs that matter to you and the tools re-rank themselves. The table shows which needs each tool fits.*

| Tool | Fits these needs |
|---|---|
| Claude Code | Hand off big multi-file tasks, Work in the terminal, Stay in my current editor, Run tasks in the cloud, Rules, skills, MCP customization, GitHub-centered workflow, Team or enterprise plans |
| GitHub Copilot | Suggestions while I type, Hand off big multi-file tasks, Stay in my current editor, Free or very low cost, Run tasks in the cloud, Rules, skills, MCP customization, GitHub-centered workflow, Team or enterprise plans |
| Cursor | Suggestions while I type, Hand off big multi-file tasks, Choose any model, Rules, skills, MCP customization, Team or enterprise plans |
| Windsurf (Devin Desktop) | Hand off big multi-file tasks, Rules, skills, MCP customization |

---

## Pick Your Tool: Tick what matters to you (2/2)

| Tool | Fits these needs |
|---|---|
| OpenAI Codex | Hand off big multi-file tasks, Work in the terminal, Stay in my current editor, Open source, Run tasks in the cloud, Rules, skills, MCP customization, Team or enterprise plans |
| Gemini CLI | Hand off big multi-file tasks, Work in the terminal, Free or very low cost, Open source, Rules, skills, MCP customization, Very large context window |
| Aider | Work in the terminal, Free or very low cost, Choose any model, Open source, Every change is a git commit |

<p class="small">This ranks tools by how many of your needs match what the vendors' docs describe. It is a starting point, not a verdict. Try your top two on a small real task.</p>

---

## Pick Your Tool: The rubric: need to best fit (1/4)

| If you need | Look at | Why | Watch out for |
|---|---|---|---|
| Suggestions while I type | GitHub Copilot, Cursor | Built for help inside the editor as you work. | Suggestions can look right and be wrong. Read each one. |
| Hand off a big multi-file task | Claude Code, Codex, Cursor, GitHub Copilot agent | Agent modes plan, edit several files, and prepare changes for review. | The more it does alone, the more you must review. |
| Stay in the terminal | Claude Code, Codex, Gemini CLI, Aider | Command-line tools that fit scripts and remote machines. | Steeper learning curve for beginners. |
| Stay in my current editor | GitHub Copilot, Claude Code (VS Code, JetBrains), Codex (IDE), Cline, Continue | Extensions bring the assistant to the editor you use. | Check your editor is supported on your plan. |

---

## Pick Your Tool: The rubric: need to best fit (2/4)

| If you need | Look at | Why | Watch out for |
|---|---|---|---|
| Spend little or nothing | GitHub Copilot Free, Gemini CLI free tier, Aider with your own key | Free tiers, or you pay only for the API you use. | Free tiers have request limits. |
| Choose any model | Aider, Cursor | Aider works with many providers. Cursor lists 50+ models. | You manage keys, cost, and quality yourself. |
| Open source I can inspect | Aider, Codex CLI, Gemini CLI | Source code is public (Apache-2.0 for Codex CLI and Gemini CLI). | Open source does not mean no data leaves your machine. |
| Easy undo of every change | Aider | Commits each change to git automatically. | Use a git branch with any tool. |

---

## Pick Your Tool: The rubric: need to best fit (3/4)

| If you need | Look at | Why | Watch out for |
|---|---|---|---|
| Run tasks in the cloud | Codex (Codex Web), Claude Code (web), GitHub Copilot agent | Long tasks run off your machine and report back. | Cloud runs have limited access and still need review. |
| Heavy customization | Claude Code, Cursor, Windsurf | Rules, skills, MCP servers, memories, and workflows. | More setup, and more places for mistakes. |
| Very large codebase | Gemini CLI | 1M token context window with Gemini 3 models. | Bigger context is not the same as better answers. |
| GitHub-centered team | GitHub Copilot, Claude Code (GitHub Actions) | Works with pull requests, issues, and code review. | Check which features your plan includes. |

---

## Pick Your Tool: The rubric: need to best fit (4/4)

| If you need | Look at | Why | Watch out for |
|---|---|---|---|
| I am new to coding | Any tool, set to approve every step | Manual mode (Claude Code), Review mode (Codex), or Aider's commit-per-change keep you in control. | Never use auto or full-auto modes until you can review the result. |
| I work at a company with rules | Whichever your IT team approves | Approval is the first gate, before features or price. | Using an unapproved tool can break policy, and the responsibility is yours. |

---

## Pick Your Tool: Score your own shortlist

Give each finalist 1 to 5 on every row, then add them up. Weigh the rows that matter most to you.

| Criterion | Ask yourself |
|---|---|
| Approval | Is it allowed by IT? A no here ends the comparison. |
| Data and privacy | Where does my code go? Is it used for training? Can I keep secrets out? |
| Control | Can I make it ask before editing files or running commands? |
| Fit | Does it work in my editor or terminal, on my operating system? |
| Quality on my code | Did it do well on a small real task from my own project? |
| Cost | Per seat, per use, or bring-your-own key? What are the limits? |
| Customization | Can I give it my team's rules and recipes? |
| Team support | Is there an admin, billing, and a plan for teams? |

---

## Compare Them All: At a glance (1/2)

| Tool | Lives in | Best for | Models |
|---|---|---|---|
| Claude Code | Terminal, VS Code, JetBrains, desktop, web | Big multi-file tasks and customizable workflows | Anthropic |
| GitHub Copilot | Your editor and GitHub | Help while you code, plus agent tasks on GitHub | Set by GitHub and your plan |
| Cursor | Its own editor | People who want AI built into the editor | 50+ models from several providers |
| Windsurf (Devin Desktop) | Its own standalone IDE | Agent-driven edits inside an IDE | Set by the product and your plan |

---

## Compare Them All: At a glance (2/2)

| Tool | Lives in | Best for | Models |
|---|---|---|---|
| Codex | Terminal, IDE, desktop app, cloud | Delegating tasks, including in the cloud | OpenAI |
| Gemini CLI | Terminal | Free-tier terminal work and very large context | Google Gemini |
| Aider | Terminal | Git-friendly pairing with the model you choose | Many providers |

<p class="small">Details come from each vendor's own docs, read on 2 Oct 2026. This space moves fast, so check the vendor site before you decide.</p>

---

## Compare Them All: Which one should you pick?

- Want help while you type in an editor: GitHub Copilot or Cursor.
- Want to hand off a whole task and review the result: Claude Code, Codex, or an IDE agent like Cursor or Windsurf.
- Want to pay little or nothing: Gemini CLI's free tier, GitHub Copilot Free, or Aider with a cheap model.
- Want to choose or switch models freely: Aider or Cursor.
- Work in a locked-down company: ask IT which tools are approved before you install anything.

---

## Compare Them All: The same rules apply to all of them

- Work on a git branch and commit before you start.
- Read every change before you accept it.
- Never paste secrets or customer data into any assistant.
- Start with the most cautious permission setting, and check what the default is first.

> **Risk.** Every tool on these pages can be wrong, and the ones that run commands can also break things. The safer the setting, the slower it feels. That trade is worth it until you trust the workflow.

---

## More Assistants: Also worth knowing (1/2)

These did not get a full page, but you may meet them at work. Facts come from each vendor's own pages, read on 2 Oct 2026.

| Tool | Made by | What it is | Worth knowing |
|---|---|---|---|
| Amazon Q Developer | AWS | Code suggestions, inline chat, agentic tasks, and vulnerability scanning in IDEs, a CLI, and the AWS console | Has a free tier. AWS plans to end IDE plugin support on 30 Apr 2027 and points users to Kiro. |
| Kiro | AWS | Agentic platform with an IDE, CLI, web, and mobile. Turns prompts into specs, designs, and tasks first. | Credit-based pricing, with models from several providers. |
| Cline | Cline Bot Inc. | Open-source (Apache 2.0) agent for VS Code, JetBrains, a CLI, and a desktop app | Asks approval for every edit and command unless you turn on auto-approve. Works with many providers. |
| Continue | Open source | Chat, edit, agent mode, and autocomplete in VS Code and JetBrains, plus a CLI | You choose your own models. |

---

## More Assistants: Also worth knowing (2/2)

| Tool | Made by | What it is | Worth knowing |
|---|---|---|---|
| Zed | Zed Industries | A code editor with an agent panel, edit prediction, and an inline assistant | Bring your own API keys, use local models, or use Zed-hosted ones. Supports external agents. |

<p class="small">Other tools exist too, including JetBrains' own AI features, which I could not confirm from their page.</p>

### Why a long list does not mean a better choice

- Most of these use the same few underlying models, so the difference is the workflow around them.
- Pick two, try both on one small real task, and keep the one that fits.
- Ask IT which are approved before you try any of them at work.

---

## IT Review Checklist: Why this page exists

If you use an AI coding assistant for work, your IT or security team decides what is allowed. This checklist helps you ask good questions, so approval takes days, not months.

> **Risk.** It is your responsibility to get approval before you use a tool on work code or data. These are questions to ask, not answers. This guide is not legal, security, or compliance advice.

---

## IT Review Checklist: Questions to bring to IT (1/2)

| Topic | Ask |
|---|---|
| Approval | Is this tool on the approved list? Is a specific plan or account type required? |
| Account type | Must I use a company account, not a personal one? Who pays? |
| Data handling | Where is my code sent and stored? For how long? Is it used to train models? |
| Allowed data | What data classes can I put in a prompt? Which are never allowed (customer data, secrets, regulated data)? |
| Access control | Is single sign-on required? Who can add or remove users? |
| Logging | Are prompts and actions logged? Who can see the logs? |
| Extensions | Are plugins, MCP servers, and extensions approved one by one, or blocked? |
| Permissions | Which modes are allowed? Is auto or full-auto approval banned? |

---

## IT Review Checklist: Questions to bring to IT (2/2)

| Topic | Ask |
|---|---|
| Network | Does it need to reach the internet? Does it work behind our proxy? |
| Legal | Who owns the output? Are there license or IP rules for AI-written code? |
| Compliance | Do we have rules (SOC 2, HIPAA, PCI, export controls) that limit use? |
| Disclosure | Do I need to say when AI helped write code? |

### Before you ask

- Know which tool, which plan, and which task you want to use it for.
- Be ready to say what code or data it would see.
- Read the vendor's security and privacy page so your questions are specific.
- Write down the answer, with the date and who gave it.

---

## Using AI Responsibly: What using AI responsibly means

A coding assistant works like a fast, tireless, eager intern. It will try anything you let it, and it cannot always tell a good idea from a bad one. Using it responsibly means you stay the person in charge of what ships.

- You own the result. If Claude writes it and you ship it, it is your code.
- Check the work. Run it, test it, read it. Confident does not mean correct.
- Protect other people's data. Customers, coworkers, and patients did not agree to be pasted into a prompt.
- Follow your company policy on AI tools, and say so when AI helped build something.
- Respect licenses. Do not ship code you cannot trace to a source you are allowed to use.

---

## Using AI Responsibly: The risks, in plain English

| What can go wrong | What it looks like |
|---|---|
| It is confidently wrong | Invents a function or setting that does not exist, and says it with total certainty. |
| It deletes or overwrites | A cleanup request removes files you needed. Without git, they may be gone. |
| It runs commands as you | Anything you can do on your computer, it can do: install software, move files, change settings. |
| It leaks secrets | Passwords and API keys in a file it reads can end up in a prompt, a log, or committed code. |
| It is tricked by content | Text in a web page, issue, or file can contain hidden instructions aimed at the AI (prompt injection). |
| It adds risky packages | It may install a library that is outdated, unmaintained, or malicious. |
| You stop understanding your code | If nobody can explain it, nobody can fix it at 2am. |

---

## Using AI Responsibly: Habits that keep you safe

- Start with the most cautious approval setting your tool offers, and read every change and every command.
- Use git for everything, and commit before big changes.
- Never run it as administrator or in a folder with files you cannot lose.
- Never paste passwords, keys, customer data, or health data.
- Ask it to explain anything you do not understand, before you accept it.
- If something feels off, stop with Escape and ask what it is doing.

> **Risk.** The risk is not that Claude is careless. It is that it is fast. A mistake you would catch on step two can pile up to step twenty before you look up.

---

## Safeguards: Keep secrets out of reach

- Do not keep passwords, keys, or tokens in the project folder. Use a secrets manager or environment variables outside the repo.
- Add secret files such as .env to .gitignore so they never reach git.
- Many tools can be told to ignore files or deny reading them. Check your tool's docs for how, and turn it on.
- If a secret ever reaches a prompt or a commit, treat it as leaked and rotate it.

```
# Claude Code example: block reading a secrets file
# .claude/settings.json
{
  "permissions": {
    "deny": ["Read(./.env)"]
  }
}
```

<p class="small">Deny rules block in every Claude Code mode, including bypass. Check the permissions docs for the exact rule syntax in your version.</p>

---

## Safeguards: Limit the blast radius

- Work on a git branch, and commit before you start.
- Use a sandbox, container, or throwaway folder for riskier modes. Claude Code has /sandbox, and Codex sandboxes file access.
- Never run an agent as an administrator.
- Keep production credentials off any machine where an agent runs unattended.

---

## Safeguards: Verify AI-written code

AI code can look right and be wrong. Treat it like a pull request from someone you have not met.

- Read the diff. If you cannot explain a change, do not merge it.
- Run the tests, and add a test for anything new.
- Run your linter and a security scanner.
- Check any new dependency: does it exist, is it maintained, is it the real package?
- Keep changes small, so review stays possible.

---

## Safeguards: Watch for prompt injection

Text in a web page, an issue, a file, or an MCP tool result can contain hidden instructions aimed at the AI. If your assistant reads outside content, it may try to follow them.

> **Risk.** Be extra careful when an agent can both read untrusted content and take actions like running commands or sending data. Keep approvals on in that situation.

---

## Saving Money (Any Tool): How the tools charge

| Tool | Cost model, per vendor docs |
|---|---|
| GitHub Copilot | A free tier, and paid plans with larger AI credit allowances. Students, teachers, and open source maintainers can qualify for premium features at no cost. |
| Gemini CLI | Free with a personal Google login: 60 requests a minute and 1,000 a day. An API key has a free tier of 1,000 requests a day. |
| Amazon Q Developer | Free tier of 50 agentic chat interactions a month; paid options for more. |
| Kiro | Credit-based, with different credit costs for different models. |
| Aider, Cline, Continue | The software is open source. You pay your model provider for what you use. |
| Claude Code | A Claude subscription or Anthropic Console account. API pricing is per million tokens, with batch requests 50% off. |
| Codex | Sign in with a ChatGPT plan, or use an API key. |
| Cursor, Windsurf | Plans and limits change, so read the current pricing page. |

---

## Saving Money (Any Tool): Habits that save money on any tool

- Use the smallest model that does the job, and move up only when you must.
- Plan before you build. A reviewed plan avoids expensive rework.
- Start a fresh conversation for each task, because long history costs more on every request.
- Be specific. Naming the file and the goal beats "look around and fix it".
- Keep instruction files short, since they load every session.
- Connect only the extensions and servers you need.
- Watch your usage screen or command, and set alerts where the tool offers them.

<p class="small">Claude-specific commands such as /cost and /clear are covered in the Claude Code deep dive.</p>

---

# 13. Claude Code field guide
## Install to cost, for beginners

The step-by-step track from install to cost control. It overlaps sections 1 to 6 on purpose, so someone new can read it start to finish.

<p class="small">Merged from the former ai-coding-assistants-guide. Its facts were read from vendor docs on 2026-10-02 and were not re-verified here; where it overlaps the sections above, the sections above win.</p>

---

## Install: Requirements

A terminal, and a Claude subscription or an Anthropic Console account. The recommended installer does not need Node.js. No IDE is required, though VS Code and JetBrains extensions, a desktop app, and a web version exist.

---

## Install: Install (recommended)

```
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# or Homebrew
brew install --cask claude-code
```

<p class="small">Native installs update themselves in the background. Homebrew installs do not, so run brew upgrade now and then.</p>

---

## Install: Authenticate

```
claude
```

<p class="small">You are prompted to log in the first time you run claude. If ANTHROPIC_API_KEY is set, it asks you to approve the key instead.</p>

### Verify

```
claude --version
```

<p class="small">If your shell says claude is not found, open a new terminal window. If it still fails, the install folder is not on your PATH yet.</p>

---

## First Session: First things to do

1. Open a terminal in a project you know well (a git repo, not your home folder).
2. Run claude, then ask for an architecture overview to confirm it can read your code.
3. Run /init to generate a starter CLAUDE.md, then edit it with your real conventions.
4. Check which permission mode you are in (Shift+Tab cycles modes). Recent versions can start in auto mode, so run claude --permission-mode default to approve each action until you trust the workflow.
5. Make one small change on a new git branch so it is easy to review or discard.
6. Run /cost to see usage, and /clear between unrelated tasks.

<p class="small">If you want to learn more, please go to academy.claude.com</p>

---

## First Session: Courses worth knowing (academy.claude.com)

- AI Fluency: Framework and Foundations: collaborate with AI effectively, ethically, and safely using the 4D framework (about 4 hours)
- AI Capabilities and Limitations: build an accurate picture of what language models can and cannot do (about 3.5 hours)
- Building Effective Human-Agent Teams (beta): preparing your team for multiplayer AI, best for team leaders (about 45 minutes)
- Claude Code 101: the agentic loop, context windows, the Explore, Plan, Code, Commit workflow, CLAUDE.md, subagents, MCP, and hooks (about 1.5 hours; a Claude account or API key is needed)
- Claude Code in Action: running longer, less supervised sessions, permission modes, scheduling, GitHub Actions, and verifying unattended work (about 1 hour; assumes you already use Claude Code)

<p class="small">The Claude Code courses are linked from the Claude Code docs at academy.claude.com/courses/claude-code-101 and academy.claude.com/courses/claude-code-in-action.</p>

---

## First Session: If you are a creative

- Draft and revise: ask for three different takes on a story, script, or pitch, then merge the best parts.
- Build a small personal site or portfolio page and iterate on the design by describing what you want changed.
- Put your voice and style rules in CLAUDE.md so drafts sound like you.
- Use it as a sounding board: ask it to critique your idea before you commit to it.

<p class="small">Just like the Green Lanterns, creativity is key. The ring only builds what you can imagine, and Claude works the same way: the clearer and more inventive your idea, the better the result. Specificity begets clarity.</p>

---

## First Session: If you are a professional

- Ask for an overview of an unfamiliar codebase or document set before you start work.
- Automate repetitive chores: tests, release notes, report formatting, data cleanup.
- Write team conventions into a project CLAUDE.md and commit it so everyone shares them.
- Review every change before merging, and never paste secrets or restricted data (see Safety &amp; Data).

### Start in a project directory

```
cd your-project
claude
```

<p class="small">Claude Code reads your project context on startup — git history, file structure, and any CLAUDE.md files.</p>

---

## First Session: Useful first prompts

- "What does this codebase do? Give me an architecture overview."
- "What are the main entry points?"
- "Find all the places where user authentication happens."
- "What tests exist and how do I run them?"

### Key shortcuts

|  |  |
|---|---|
| Escape | Cancel current generation |
| Ctrl+C | Exit Claude Code |
| ↑ / ↓ | Navigate prompt history |
| /help | Show all slash commands |
| /clear | Clear conversation context |

---

## Models: Three tiers, one idea

Anthropic ships models in sizes. Small ones are fast and cheap, large ones think harder and cost more. Pick the smallest model that does the job, and move up only when the answer is not good enough.

|  |  |
|---|---|
| Haiku | Fastest and cheapest. High-volume, latency-sensitive tasks. |
| Sonnet | The balance of speed and intelligence. A good everyday default. |
| Opus | Long-running agentic coding and knowledge work. |
| Fable | The top of the lineup, for demanding reasoning and long-horizon agent work. |

---

## Models: Current models

| Model | API ID | Price per million tokens (in / out) | Context | Retirement |
|---|---|---|---|---|
| Fable 5.1 | claude-fable-5-1 | $10 / $50 | 1M | Not sooner than 1 Sep 2027 |
| Opus 5.5 | claude-opus-5-5 | $4 / $20 | 1M | Not sooner than 22 Sep 2027 |
| Sonnet 5.5 | claude-sonnet-5-5 | $2 / $10 | 1M | Not sooner than 28 Sep 2027 |
| Haiku 5.5 | claude-haiku-5-5 | from $0.10 / $0.50 | 1M | Check the deprecations page |

<p class="small">Corrected against Anthropic's models overview on 2026-10-07: Haiku 5.5 is the current small model, and Haiku 4.5 is now legacy (see the next table). The docs suggest starting with Opus 5.5 for most workloads and moving to Fable 5.1 when Opus at higher effort still falls short. Batch requests are 50% off.</p>

---

## Models: Older models and their status (1/5)

| Model | API ID | Status | Date |
|---|---|---|---|
| Haiku 4.5 | claude-haiku-4-5-20251001 | Active (legacy) | Not sooner than 15 Oct 2026 |
| Mythos 5.1 / 5 | claude-mythos-5-1, claude-mythos-5 | Active | Not sooner than 1 Sep 2027 / 9 Jun 2027 |
| Fable 5 | claude-fable-5 | Active (legacy) | Not sooner than 9 Jun 2027 |
| Opus 5 | claude-opus-5 | Active (legacy) | Not sooner than 24 Jul 2027 |

---

## Models: Older models and their status (2/5)

| Model | API ID | Status | Date |
|---|---|---|---|
| Sonnet 5 | claude-sonnet-5 | Active (legacy) | Not sooner than 30 Jun 2027 |
| Opus 4.8 / 4.7 / 4.6 | claude-opus-4-8, -4-7, -4-6 | Active (legacy) | Not sooner than 28 May 2027 / 16 Apr 2027 / 5 Feb 2027 |
| Sonnet 4.6 | claude-sonnet-4-6 | Active (legacy) | Not sooner than 17 Feb 2027 |
| Opus 4.5 | claude-opus-4-5-20251101 | Active (legacy) | Not sooner than 24 Nov 2026 |

---

## Models: Older models and their status (3/5)

| Model | API ID | Status | Date |
|---|---|---|---|
| Sonnet 4.5 | claude-sonnet-4-5-20250929 | Deprecated | Retires 30 Nov 2026 |
| Opus 4.1 | claude-opus-4-1-20250805 | Retired | 5 Aug 2026 |
| Opus 4, Sonnet 4 | claude-opus-4-20250514, claude-sonnet-4-20250514 | Retired | 15 Jun 2026 |
| Haiku 3 | claude-3-haiku-20240307 | Retired | 20 Apr 2026 |

---

## Models: Older models and their status (4/5)

| Model | API ID | Status | Date |
|---|---|---|---|
| Sonnet 3.7, Haiku 3.5 | claude-3-7-sonnet-20250219, claude-3-5-haiku-20241022 | Retired | 19 Feb 2026 |
| Opus 3 | claude-3-opus-20240229 | Retired | 5 Jan 2026 |
| Sonnet 3.5 (both versions) | claude-3-5-sonnet-20240620, -20241022 | Retired | 28 Oct 2025 |
| Claude 2, 2.1, Sonnet 3 | claude-2.0, claude-2.1, claude-3-sonnet-20240229 | Retired | 21 Jul 2025 |

---

## Models: Older models and their status (5/5)

| Model | API ID | Status | Date |
|---|---|---|---|
| Claude 1, Instant | claude-1.x, claude-instant-1.x | Retired | 6 Nov 2024 |

<p class="small">Status comes from Anthropic's model deprecations page, as read by the original guide on 2 Oct 2026 (not re-checked here). Retired models fail if you call them, and Anthropic gives at least 60 days' notice before retiring a public model. Check that page before you build on any model.</p>

### Switch models inside Claude Code

```
/model
```

<p class="small">Look up current prices on the Anthropic pricing page, since they change between generations.</p>

---

## CLAUDE.md & .md Files: What it does

CLAUDE.md is a markdown file Claude Code reads automatically at the start of every session. It's your standing instructions — conventions, rules, toolchain specifics. Think of it as onboarding documentation for your AI collaborator.

### Locations

- ~/.claude/CLAUDE.md — global, applies to every project
- {project}/CLAUDE.md — project-specific rules
- {project}/{dir}/CLAUDE.md — subtree rules (applied when working in that folder)

---

## CLAUDE.md & .md Files: Starter template

```
# Project: my-service

## Toolchain
- Package manager: pnpm (never npm or yarn)
- Test runner: vitest — run `pnpm test` before committing
- Linter: biome — `pnpm lint:fix` before pushing

## Architecture
- Hexagonal. Domain layer has zero framework imports.
- New services go in src/domain/services/

## Rules
- Never modify migration files after they've been committed
- No console.log in committed code — use the logger module
- All API endpoints need a corresponding OpenAPI spec entry
```

---

## CLAUDE.md & .md Files: Which .md file does what

| File | Who reads it | When it loads |
|---|---|---|
| CLAUDE.md | Claude | Automatically, every session. Standing rules. |
| SKILL.md | Claude | When your request matches its description, or when you type /name. |
| README.md | Humans (and Claude on request) | Only if someone opens it. Describes the project to people. |
| AGENTS.md | Any AI coding tool | A shared convention across tools. Claude Code reads CLAUDE.md, so point it at AGENTS.md with an @AGENTS.md import. |
| intent.md | You decide | Not built in. A team convention: a short file explaining why the project exists and what done looks like. Reference it from CLAUDE.md or ask Claude to read it. |
| PLAN.md | You and Claude | Not built in. A saved plan for a task so work survives a /clear. |

<p class="small">The difference in one line: CLAUDE.md is how to work here, intent.md is why we are doing this, a plan is what we do next, and a skill is a recipe.</p>

---

## CLAUDE.md & .md Files: Example intent.md

```
# Intent: invoice-export

## Why
Finance needs a monthly CSV of all invoices. Today it is done by hand.

## Done means
- One command produces the CSV
- Totals match the billing dashboard
- No customer emails appear in the file

## Not in scope
- PDF export
- Changing the invoice database schema
```

---

## CLAUDE.md & .md Files: What NOT to put in CLAUDE.md

- Secrets, API keys, or credentials
- Long explanations — keep it terse and actionable
- Things Claude already knows (standard patterns, common libraries)
- Everything — longer is not better. Be surgical.

---

## Skills: What skills are

Skills are folders containing a SKILL.md file that defines a reusable workflow. Type /skill-name to run one, or let Claude pick it up on its own when your request matches its description. Great for repetitive multi-step tasks.

### Create a skill

```
# Skills live in:
~/.claude/skills/<name>/SKILL.md   # global
.claude/skills/<name>/SKILL.md      # project-only

# Create one:
mkdir -p ~/.claude/skills/standup
vim ~/.claude/skills/standup/SKILL.md
```

---

## Skills: Example: /standup skill

```
---
name: standup
description: Generate a daily standup from git history. Use when the user asks for a standup, daily update, or what they did yesterday.
---

# Daily Standup

1. Run `git log --oneline --since="yesterday midnight" --until="midnight" --author="$(git config user.name)"`
2. Run `git status` to see in-progress work
3. Output format:

**Yesterday:** [bullets from commits]
**Today:** [in-progress items]
**Blockers:** [any / none]
```

---

## Skills: What triggers a skill automatically

Every skill has a short description at the top of its SKILL.md. Claude reads the descriptions, and when your request matches one, it loads that skill without you typing anything. So the description is the trigger.

- Your words: asking to "review this PR" can load a review skill.
- The task: writing tests, planning, debugging, or deploying can load the skill built for it.
- The files: working in a certain language or framework can match a skill written for it.
- You: typing /skill-name always runs it, no matching needed.

<p class="small">Write descriptions as "Use when ..." with the exact situations you want. Vague descriptions fire at the wrong times or never.</p>

---

## Skills: Skill vs. plugin

A skill is one recipe. A plugin is a package that can bundle several skills, slash commands, subagents, hooks, and MCP servers so a whole team installs the same setup in one step.

```
/plugin
```

<p class="small">Run /plugin to browse and install plugins. Treat plugins like any software you install: only use ones from sources you trust, because they can run code on your machine.</p>

---

## Skills: Useful skills to build

- /standup — generate daily standup from git log
- /review — run a structured code review on a file
- /deploy-check — verify the project is ready to deploy
- /doc — generate documentation for a function or module
- /test — write tests for a specific file or function

---

## MCP & Plugins: What an MCP server is

MCP (Model Context Protocol) is an open standard for plugging outside tools into Claude. An MCP server gives Claude new abilities: read your GitHub issues, query a database, check a calendar, drive a browser. Without one, Claude only sees your files and terminal.

### Add and inspect servers

```
claude mcp add <name> -- <command>   # add a server
claude mcp list                      # see what is connected
/mcp                                 # status inside a session
```

---

## MCP & Plugins: MCP vs. skills vs. plugins

| Thing | What it is | Example |
|---|---|---|
| MCP server | Connects Claude to an outside system | Read and comment on GitHub issues |
| Skill | A written recipe Claude follows | How we do a code review here |
| Plugin | A bundle of skills, commands, hooks, and servers | A team starter pack |

---

## MCP & Plugins: Rules of thumb

- Connect only the servers a task needs. Each one adds tool descriptions to the context, which costs money and can distract Claude.
- Prefer read-only access. A server that can only read cannot delete anything.
- Use a limited account or token for each server, never your admin credentials.

> **Risk.** An MCP server acts with your accounts and permissions. A server that can send email, write to a database, or push code can do that wrong just as fast as it can do it right.

---

## Plans & Permissions: You choose how much to trust it

Claude Code can read files, edit files, and run commands. The permission mode decides how often it has to stop and ask you. Press Shift+Tab to cycle between modes. Recent versions (v2.1.283 and later) start new terminal and VS Code sessions in auto mode, so check which mode you are in before you begin.

| Mode | What runs without asking | Risk level |
|---|---|---|
| Manual (default) | Reads only. Asks before edits, commands, and network access. | Lowest. Start here. |
| Accept edits | Reads, file edits, and common file commands like mkdir, mv, cp | Low to medium |
| Plan | Reads only. No edits until you approve a plan. | Lowest. Nothing changes. |
| Auto | Everything, while a second model reviews each action in the background | Medium to high |
| Don't ask | Only tools you pre-approved. Everything else is denied. | Low. Meant for CI and scripts. |
| Bypass permissions | Everything, with no checks (--dangerously-skip-permissions) | Highest. Containers and VMs only. |

---

## Plans & Permissions: Start in Manual mode

```
# one session
claude --permission-mode default

# every session: add to ~/.claude/settings.json
{
  "permissions": { "defaultMode": "default" }
}
```

<p class="small">Manual is the mode that reviews every action. Its config value is "default".</p>

---

## Plans & Permissions: Make a plan first

Planning costs a little and saves a lot. A plan lets you catch a wrong approach before any file changes, instead of after twenty.

1. Press Shift+Tab until you reach plan mode.
2. Describe the goal, the limits, and what done looks like.
3. Let Claude explore and write the plan. It cannot change anything yet.
4. Read it. Ask for changes. Ask what could go wrong.
5. Approve it, then work in Manual or Accept edits mode.
6. Save the plan to PLAN.md so it survives /clear.

---

## Plans & Permissions: Plan template

```
# Plan: add CSV export

## Goal
One command exports last month's invoices to CSV.

## Constraints
- No schema changes
- Do not touch the billing module

## Steps
1. Add export function in src/export/invoices.ts
2. Add a test with 3 sample invoices
3. Wire up the CLI command

## Verify
- npm test passes
- Output totals match the dashboard
```

---

## Plans & Permissions: Manually accepting edits

In Manual mode, Claude shows each change as a diff: red lines are removed, green lines are added. You press accept or reject. Reading the diff is the whole point, so do not hold the accept key down without looking.

> **Risk.** The risk of skipping review: a small mistake lands in your project and you do not find out until it breaks something real. If you cannot explain what a change does, reject it and ask Claude to explain.

---

## Plans & Permissions: Auto mode: what you are agreeing to

Auto mode saves you from clicking approve a hundred times. A second model reviews each action in the background and blocks the risky ones, but that is a safety check, not a guarantee. You are still trusting Claude to make many small decisions without you.

- It can edit or delete many files in one go.
- It can run commands that install software or change your system.
- A wrong guess early on can snowball into many wrong steps before you look.

> **Risk.** If you are new to coding, set Manual mode as your default. Use auto mode only on a git branch with everything saved, in a folder that holds nothing you cannot afford to lose, and only for tasks you could review afterward.

---

## Plans & Permissions: Safety net before you give Claude more freedom

- Work on a git branch, and commit before you start.
- Keep secrets out of the project folder, or in a file Claude is told to ignore.
- Know the undo: git diff shows what changed, git restore puts files back.
- Run the tests after every task, not only at the end.

---

## Safety & Data (Claude Code): What Claude Code can see

- Files you are working in (reads them when needed)
- Git history and status
- Terminal output from commands it runs
- Environment variables (be careful with secrets)

### What Claude Code cannot do

- Access files outside your project without explicit permission
- Make network calls directly (only via tools you approve)
- Run commands without showing them to you first (in Manual mode)

---

## Safety & Data (Claude Code): Data classification rules

- Never paste production data (PII, credentials, PHI) into Claude Code prompts
- Treat Claude Code conversations as internal-confidential by default
- If you're unsure whether data is safe to share, don't share it
- Use sanitized/synthetic data for examples in prompts

### Review before accepting

Claude Code shows you every file it wants to modify. Read the diff before accepting. You are responsible for code you ship. In Manual mode Claude asks first. In auto mode it acts on its own, so you review the results afterward.

---

## Cost & Limits: How billing works

Claude Code needs a Claude subscription or an Anthropic Console account. With API billing you pay per token (input and output). Either way, cost depends on the model you pick and how much context each request carries, so a quick question is cheap and a long, sprawling session is not. Run /cost to see where you stand.

---

## Cost & Limits: Cost control tips

- Use the smallest model that works. Haiku or Sonnet for routine work, Opus only when you are stuck (switch with /model).
- Plan first. A reviewed plan avoids expensive rework and wrong turns.
- Use /clear between unrelated tasks, and /compact to shrink a long session.
- Be specific. Naming the file and the goal beats "look around and fix it".
- Keep CLAUDE.md short, since it loads every session.
- Connect only the MCP servers you need. Each one adds to every request.
- Install the cost tracker Stop hook to see per-turn cost in real time
- Set COST_ALERT_12H and COST_ALERT_DAY env vars to get spend alerts

---

## Cost & Limits: Install the cost tracker

```
git clone https://github.com/thejaredchapman/claude-code-usage-guard
cd claude-code-usage-guard
bash install.sh
```

---

# 14. More assistants
## Seven profiles: what it is, how to start, pros and cons

Claude Code, GitHub Copilot, Cursor, Windsurf (Devin Desktop), OpenAI Codex, Gemini CLI and Aider, in the same shape.

<p class="small">Merged from the former ai-coding-assistants-guide. Its facts were read from vendor docs on 2026-10-02 and were not re-verified here; where it overlaps the sections above, the sections above win.</p>

---

## Claude Code: Pros & Cons: What it is

Anthropic's agentic coding tool. It reads your codebase, edits files, runs commands, and connects to your dev tools. It runs in the terminal, VS Code, JetBrains, a desktop app, and the web, and all of them share the same engine, CLAUDE.md files, settings, and MCP servers.

### Get started

```
curl -fsSL https://claude.ai/install.sh | bash   # macOS, Linux, WSL
cd your-project
claude
```

---

## Claude Code: Pros & Cons: How to use it

- Run claude in a project and log in when prompted.
- Press Shift+Tab to see and change the permission mode.
- Use plan mode for anything bigger than a small edit.
- Put rules in CLAUDE.md, recipes in skills, and automatic actions in hooks.
- Use /clear between tasks and /cost to watch spend.

---

## Claude Code: Pros & Cons: Pros and cons

**Pros**

- Works across files and tools, including git, commits, and pull requests.
- Extensible: CLAUDE.md, skills, hooks, subagents, MCP servers, and an Agent SDK.
- Several permission modes let you set how closely it is watched.
- Same setup in terminal, IDEs, desktop, and web.
- Can also read an AGENTS.md written for other tools.

**Cons**

- Anthropic models by default; other providers only through some setups.
- Most surfaces need a Claude subscription or Anthropic Console account.
- Costs can grow on long sessions with lots of context.
- Terminal-first, which is a learning curve for beginners.

---

## Claude Code: Pros & Cons: Keep it safe

> **Risk.** Recent versions can start in auto mode. Switch to Manual with claude --permission-mode default until you have a git branch and tests to catch mistakes.

---

## GitHub Copilot: What it is

GitHub's assistant. Per GitHub's docs it responds while you work (suggesting code, answering questions, explaining code), handles multi-step agent tasks (researching a repo, proposing plans, editing files, preparing pull requests), and can be customized with instructions, prompts, and custom agents. It also works with MCP servers and third-party coding agents.

---

## GitHub Copilot: Get started

```
# 1. Try Copilot Free or subscribe to a paid plan.
# 2. Through an organization? Request access at
#    github.com/settings/copilot
# 3. Install the extension in your editor and sign in.
#
# Documented editors: VS Code, Visual Studio, JetBrains IDEs,
# Xcode, Eclipse, Vim/Neovim, Azure Data Studio.
```

---

## GitHub Copilot: How to use it

- Accept suggestions as you type, and read each one first.
- Ask chat to explain code, plan a task, or refactor.
- Use agent features for multi-step work and review the pull request it prepares.
- Add custom instructions so it follows your conventions.

---

## GitHub Copilot: Pros and cons

**Pros**

- A free tier exists, so you can try it at no cost.
- Students, teachers, and open source maintainers can qualify for premium features at no cost.
- Works in many editors, from VS Code and JetBrains to Xcode and Neovim.
- Built into GitHub, so it fits pull requests and code review.
- Business and Enterprise plans for organizations.

**Cons**

- What you get depends on your plan, including its AI credit allowance.
- Models and features vary by plan, so check what yours includes.
- Suggestions can look right and still be wrong.
- Less of a standalone, scriptable terminal workflow than the CLI agents.

---

## GitHub Copilot: Keep it safe

> **Risk.** Suggestions are easy to accept by reflex. Read them as carefully as code from a stranger, especially around security and data handling.

---

## Cursor: What it is

An AI code editor that Cursor describes as "a coding agent for building ambitious software". It offers Tab and inline editing, chat, an agent mode for complex tasks, codebase understanding, and code review. It supports 50+ models from Anthropic, OpenAI, Google, and others.

### Get started

```
# Download Cursor from cursor.com
# macOS 12+ (.dmg), Windows 10+ (.exe),
# Linux (apt, dnf, or AppImage)
# Open the app, finish setup, and open your project folder.
```

---

## Cursor: How to use it

- Use Tab and inline editing for quick changes as you type.
- Use chat to ask about the project.
- Use agent mode for bigger tasks, and review the diff.
- Customize it with rules, skills, MCP servers, and plugins.

---

## Cursor: Pros and cons

**Pros**

- Choose from 50+ models across several providers.
- Tab, chat, and agent are all inside one editor.
- Customizable with plugins, skills, MCP, and rules.
- Connects to GitHub, GitLab, Azure DevOps, Bitbucket, Slack, Linear, and more.

**Cons**

- You work inside its editor, so you have to switch.
- Plans and usage limits change, so read the current pricing page.
- Your code goes to cloud models, so check company policy first.
- Agent edits can be large and easy to over-accept.

---

## Cursor: Keep it safe

> **Risk.** Cursor makes accepting changes very smooth. Slow down on agent edits and read the diff for every file before you accept.

---

## Windsurf (Devin Desktop): What it is

Windsurf is now called Devin Desktop, an AI IDE with an agent called Cascade. Cognition, the maker of Devin, acquired Windsurf in July 2025 and announced the rename in June 2026, according to press reports. The docs describe it as a standalone IDE, not VS Code-based, and some URLs and package names still say "windsurf".

### Get started

```
# Download for Mac, Windows, or Linux from the Windsurf / Devin Desktop site.
# Setup: pick a theme, optionally import VS Code or Cursor settings,
# sign in, then start your first AI session.
```

---

## Windsurf (Devin Desktop): How to use it

- Describe a task to the agent in plain language.
- Watch which files it touches and review each change.
- Add memories and rules so it follows your conventions.
- Use workflows for repeated tasks and MCP servers for outside tools.

---

## Windsurf (Devin Desktop): Pros and cons

**Pros**

- Memories and rules customize how it behaves.
- Workflows automate repetitive tasks.
- One-click app deploys.
- Can import your VS Code or Cursor settings.

**Cons**

- The product was renamed in 2026, so names in docs and packages can differ.
- It is a standalone IDE, so you have to adopt it.
- Some extensions are incompatible, including other AI completion tools.
- Agent actions still need careful review.

---

## Windsurf (Devin Desktop): Keep it safe

> **Risk.** When an agent can run terminal commands, read each command before approving it. Never approve a command you do not understand.

---

## OpenAI Codex: What it is

OpenAI's coding agent. It comes as a terminal CLI, an IDE integration (VS Code, Cursor, Windsurf), a desktop app, and Codex Web, a cloud agent at chatgpt.com/codex. The CLI is open source under the Apache-2.0 license.

### Get started

```
# macOS / Linux
curl -fsSL https://chatgpt.com/codex/install.sh | sh
# or: npm install -g @openai/codex
# or: brew install --cask codex

cd your-project
codex
```

---

## OpenAI Codex: How to use it

- Sign in with ChatGPT, or use an API key.
- Describe a task, for example "Tell me about this project".
- Pick permissions: Review mode asks before acting, Autonomous mode does not. Adjust per session with /permissions.
- Run /init to create an AGENTS.md of project instructions.

---

## OpenAI Codex: Pros and cons

**Pros**

- Open-source CLI under Apache-2.0.
- Choice of terminal, IDE, desktop app, or cloud.
- Works with a ChatGPT plan sign-in.
- Sandboxing limits file access and writable folders.
- AGENTS.md is a convention several tools share.

**Cons**

- OpenAI models only.
- Cloud tasks run in a sandbox with limits on what they can reach.
- Plan and sign-in options affect what you can use.
- Results still need a human review before you merge.

---

## OpenAI Codex: Keep it safe

> **Risk.** Autonomous mode edits files and runs commands without asking. Use it only in a disposable folder or container, never on your main machine with real credentials.

---

## Gemini CLI: What it is

Google's open-source (Apache 2.0) terminal agent. It has built-in file operations, shell commands, web fetching, and Google Search grounding, and it supports MCP servers.

### Get started

```
npm install -g @google/gemini-cli
# or run without installing: npx @google/gemini-cli
# also available through Homebrew, MacPorts, and Anaconda

cd your-project
gemini
```

---

## Gemini CLI: How to use it

- Sign in with a Google account when prompted.
- Describe a task or ask about the codebase.
- Use gemini -p "question" for a one-off, non-interactive prompt.
- Choose a model with -m, and add project guidance in GEMINI.md.

---

## Gemini CLI: Pros and cons

**Pros**

- Open source under Apache 2.0.
- Free tier with a personal Google login: 60 requests a minute and 1,000 a day.
- 1M token context window with Gemini 3 models.
- Web fetch, Google Search grounding, and MCP support built in.

**Cons**

- Gemini models only.
- Free-tier request limits can interrupt long sessions.
- Quality varies by task, so test it on your own work.
- Fewer ready-made workflows than the most mature agents.

---

## Gemini CLI: Keep it safe

> **Risk.** The free tier is a good reason to try it, not a reason to relax. It can edit files and run commands, so read each action it asks to take.

---

## Aider: What it is

An open-source terminal pair programmer. You choose which files it can see, tell it what to change, and it edits them. By default it commits every change to git with a descriptive message, so each step is easy to undo.

### Get started

```
python -m pip install aider-install   # Python 3.8-3.13
aider-install

cd your-project
aider --model sonnet --api-key anthropic=<key>
# other examples: --model o3-mini --api-key openai=<key>
```

---

## Aider: How to use it

- Add files with /add so it can edit them.
- Ask questions without editing anything with /ask.
- Request changes with /code.
- Use /architect for a two-model plan-and-edit flow.
- Undo an aider commit with /undo.

---

## Aider: Pros and cons

**Pros**

- Works with many model providers, so you pick the model.
- Every edit is a git commit, so rollback is simple.
- Open source; you pay only for the API you use.
- Lightweight and runs in any terminal.

**Cons**

- Terminal only, with a plain interface.
- You bring your own API key and manage which files are in context.
- Needs a supported Python version.
- Less hands-off than agents that plan and run everything themselves.

---

## Aider: Keep it safe

> **Risk.** Because it commits each change, you get a built-in safety net. Still read each diff, and keep your API key out of any file you commit.

---

# Putting it together

---

## The full picture

```
CLAUDE.md      → standing rules (always active)
    ↓
Skill invoked  → /deploy-check
    ↓
Claude calls   → MCP tool (github: list PRs)
    ↓
PostToolUse    → hook logs the call
    ↓
Claude spawns  → Subagent: "review this PR for security issues"
    ↓
Turn ends      → Stop hook fires, logs cost + tokens
```

---

## Which extension point for what?

| Problem | Solution |
|---------|----------|
| Claude ignores your conventions | `CLAUDE.md` |
| Repetitive multi-step workflow | **Skill** |
| Claude needs access to external data | **MCP server** |
| Need to run something before/after tool calls | **Hook** |
| Task is too big for one context window | **Subagent** |
| Review + implementation in parallel | **Subagents** |
| Share a whole setup with a team | **Plugin** |
| Run Claude in CI or a script | **Non-interactive mode** (`claude -p`) |

---

## Which product for what?

| You want to | Use |
|-------------|-----|
| Code in a terminal or IDE | **Claude Code** (CLI, desktop, VS Code, JetBrains) |
| Continue a session from your phone | **Remote Control** |
| Ask Claude in your team's Slack | **Claude Tag** (Team and Enterprise) |
| Do non-coding knowledge work, no terminal | **Cowork** |
| Drive a real browser | **Claude in Chrome** |
| Build your own agent in code | **Agent SDK** |
| Have Anthropic host an agent | **Managed Agents** |

---

# Keep learning
## Claude Academy

---

## Courses that match this deck

Free courses from Anthropic at [academy.claude.com](https://academy.claude.com/courses).

| Deck section | Course |
|--------------|--------|
| Foundations | [Claude Code 101](https://academy.claude.com/courses/claude-code-101), [Claude Code in action](https://academy.claude.com/courses/claude-code-in-action) |
| Subagents | [Introduction to subagents](https://academy.claude.com/courses/introduction-to-subagents) |
| Skills | [Introduction to agent skills](https://academy.claude.com/courses/introduction-to-agent-skills) |
| MCP | [Introduction to Model Context Protocol](https://academy.claude.com/courses/introduction-to-model-context-protocol), then [MCP: Advanced topics](https://academy.claude.com/courses/model-context-protocol-advanced-topics) |
| Claude Tag | [Introduction to Claude Tag](https://academy.claude.com/courses/introduction-to-claude-tag) |
| Cowork | [Introduction to Claude Cowork](https://academy.claude.com/courses/introduction-to-claude-cowork) |
| API and SDK | [Building with the Claude API](https://academy.claude.com/courses/building-with-the-claude-api), [Claude Platform 101](https://academy.claude.com/courses/claude-platform-101) |
| Team practice | [The AI-native SDLC playbook](https://academy.claude.com/courses/ai-native-sdlc-playbook), [AI Fluency for builders](https://academy.claude.com/courses/ai-fluency-for-builders) |
| Cloud providers | [Claude with Amazon Bedrock](https://academy.claude.com/courses/claude-with-amazon-bedrock), [Claude with Google Cloud's Vertex AI](https://academy.claude.com/courses/claude-with-google-cloud-s-vertex-ai) |

---

## The rest of the catalog

The Academy has 27 courses (counted on 2026-10-07). Beyond the ones above, there is a whole **AI Fluency** track on working with AI well (the "4D" framework: Delegation, Description, Discernment, Diligence), with versions for builders, educators, students, small businesses and nonprofits.

Browse everything: [academy.claude.com/courses](https://academy.claude.com/courses)

For the other tools in this deck, use each vendor's own docs (linked on the Resources slide). The Academy teaches Claude's products.

---

## Resources

- **Claude Code docs:** [code.claude.com/docs](https://code.claude.com/docs)
- **MCP SDK:** github.com/modelcontextprotocol/typescript-sdk
- **MCP server registry:** github.com/modelcontextprotocol/servers
- **Codex docs:** [learn.chatgpt.com/docs](https://learn.chatgpt.com/docs)
- **Cursor docs:** [cursor.com/docs](https://cursor.com/docs)
- **Gemini CLI docs:** [geminicli.com/docs](https://geminicli.com/docs/)
- **Claude Academy:** [academy.claude.com](https://academy.claude.com/courses)

---

# Questions?

Five extension points. One afternoon to learn them.
CLAUDE.md · Subagents · Skills · MCP · Hooks

<p class="small">Built by Jared Chapman · github.com/thejaredchapman</p>
