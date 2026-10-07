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

---

## Resources

- **Claude Code docs:** claude.ai/docs/claude-code
- **MCP SDK:** github.com/modelcontextprotocol/typescript-sdk
- **MCP server registry:** github.com/modelcontextprotocol/servers
- **Cost tracker hook:** (this repo) `../claude-code-updates/`
- **4D Orchestrator MCP:** (this repo) `../4d-orchestrator-mcp/`

---

# Questions?

Five extension points. One afternoon to learn them.
CLAUDE.md · Subagents · Skills · MCP · Hooks

<p class="small">Built by Jared Chapman · github.com/thejaredchapman</p>
