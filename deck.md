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

# Claude Code — Deep Dive
## The Five Extension Points

Built for engineers who already use Claude Code and want to go further.

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

In `~/.claude/mcp.json` (global) or `.mcp.json` (project):

```json
{
  "mcpServers": {
    "my-docs": {
      "command": "node",
      "args": ["/path/to/my-docs-server/dist/index.js"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://localhost/mydb"
      }
    }
  }
}
```

---

## Building an MCP server (TypeScript)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "get_weather",
    description: "Get current weather for a city",
    inputSchema: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"]
    }
  }]
}));
```

---

## Transports

| Transport | Use case |
|-----------|---------|
| **stdio** | Local servers run as child processes (most common) |
| **HTTP/SSE** | Remote servers, multi-client scenarios |

Most local MCP servers use stdio. Claude Code starts the process and communicates via stdin/stdout.

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

Hooks are shell commands that Claude Code runs automatically at specific points in its lifecycle.

```
PreToolUse   → before Claude calls any tool
PostToolUse  → after a tool call completes
Stop         → when Claude finishes a turn
Notification → when Claude sends a notification
```

The hook receives a JSON payload on stdin describing what happened.

---

## Hook use cases

| Hook | What you can do |
|------|----------------|
| **PreToolUse** | Block dangerous commands, add logging, inject context |
| **PostToolUse** | Validate file changes, run linters, update trackers |
| **Stop** | Log cost/tokens, send notifications, trigger CI |
| **Notification** | Route alerts to Slack, email, or a dashboard |

---

## Registering a hook

In `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "python3 /path/to/usage_tracker.py"
      }
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "bash /path/to/lint_on_save.sh",
        "matcher": "write_file"
      }
    ]
  }
}
```

---

## The Stop hook payload

```json
{
  "model": "claude-sonnet-4-6",
  "usage": {
    "input_tokens": 12400,
    "output_tokens": 890,
    "cache_creation_input_tokens": 8200,
    "cache_read_input_tokens": 3100
  },
  "stop_reason": "end_turn"
}
```

Read from `sys.stdin` in Python, `process.stdin` in Node.

---

## Hook exit codes

| Exit code | Meaning |
|-----------|---------|
| **0** | Success — continue normally |
| **Non-zero** | Failure — Claude Code shows the error |
| **2** (PreToolUse) | **Block the tool call** — Claude abandons the action |

Exit code 2 on `PreToolUse` is a gate: your hook can prevent Claude from running a command.

---

## 🛠 Exercise 5 — Hooks

See `exercises/05-hooks.md`

**Goal:** Install the cost tracker Stop hook and verify it fires after a turn.

Time: 10 minutes

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
