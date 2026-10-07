---
marp: true
theme: default
paginate: true
style: |
  section {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #0f0f0f;
    color: #f0f0f0;
  }
  h1 { color: #d97757; font-size: 2.2rem; }
  h2 { color: #d97757; font-size: 1.6rem; }
  h3 { color: #e8a87c; }
  code { background: #1e1e1e; color: #ce9178; border-radius: 4px; padding: 2px 6px; }
  pre { background: #1e1e1e; border-left: 3px solid #d97757; border-radius: 6px; }
  pre code { background: transparent; color: #d4d4d4; }
  strong { color: #e8a87c; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #d97757; color: #fff; padding: 8px 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #333; }
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
    "local-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["./tools/docs-server/dist/index.js"]
    }
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

An event holds **matcher groups**; each group holds a list of **hooks**. The `matcher` filters by tool name (`Bash`, `Edit`, `Write`, `Read`, `mcp__server__tool`). Handler types: `command`, `http`, `mcp_tool`, `prompt`, `agent`.

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

## Claude Code commands cheat sheet

| Command | Does |
|---------|------|
| `/init` | Draft a `CLAUDE.md` for the project |
| `/clear` | Start a new conversation |
| `/compact` | Summarize to free context |
| `/context` | Show context usage |
| `/model`, `/fast` | Switch model; toggle fast mode |
| `/permissions` | Manage allow, ask and deny rules |
| `/mcp`, `/plugin`, `/skills`, `/hooks` | Inspect and manage extensions |
| `/memory` | Edit CLAUDE.md and auto memory |
| `/resume`, `/rewind` | Reopen a conversation; roll back |
| `/diff` | Review changes in the working tree |
| `/tasks` | Background work and subagents |
| `/usage` | Cost and plan limits (`/cost` is an alias) |
| `/remote-control` (`/rc`) | Continue this session from claude.ai |
| `/btw` | Ask a side question without adding to context |
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

## Cursor shortcuts

**CLI**

| Key | Action |
|-----|--------|
| `Shift+Tab` | Rotate Agent, Plan, Ask |
| `Shift+Enter` or `Ctrl+J` | New line |
| `Up` | Previous messages |
| `Ctrl+R` | Review changes |
| `Ctrl+D` twice | Exit |

**Editor (macOS)**

| Key | Action |
|-----|--------|
| `Cmd+I` / `Cmd+L` | Toggle side panel |
| `Cmd+K` | Inline edit |
| `Cmd+Shift+L` | Add selection as context |
| `Cmd+N` | New chat |
| `Cmd+.` | Mode menu |
| `Cmd+Shift+P` | Command palette |
| `Tab` | Accept a suggestion |

<p class="small">Compared as of 2026-10-07. Editor keys are macOS; Windows and Linux keys are not on the docs page.</p>

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

## Gemini CLI shortcuts

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

The Academy has 28 courses. Beyond the ones above, there is a whole **AI Fluency** track on working with AI well (the "4D" framework: Delegation, Description, Discernment, Diligence), with versions for builders, educators, students, small businesses and nonprofits.

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
