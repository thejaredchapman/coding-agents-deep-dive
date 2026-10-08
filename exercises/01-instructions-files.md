# Exercise 1 — Instructions files

**Time:** 15 minutes  
**Goal:** Write an instructions file that meaningfully improves your agent's behavior in a real project.

---

## Your tool

The steps below were **run for real in Claude Code**. For every other tool the table gives the matching file and command from its own docs (checked 2026-10-08); we did not run those tools, so check your tool's docs if something differs.

| Tool | Create this file | Draft one for you |
|---|---|---|
| Aider | `CONVENTIONS.md`, then `aider --read CONVENTIONS.md` | Write it by hand |
| Claude Code | `CLAUDE.md` | `/init` |
| Codex | `AGENTS.md` | `/init` |
| Cursor | `.cursor/rules/<name>.mdc` or `AGENTS.md` | Write it by hand (no `/init` is documented) |
| Devin Desktop | `.devin/rules/<name>.md` or `AGENTS.md` | Write it by hand |
| Gemini CLI | `GEMINI.md` | `/init` |
| GitHub Copilot | `.github/copilot-instructions.md` or `AGENTS.md` | Write it by hand |

Part A (the audit) works the same in every tool. Where the steps say `CLAUDE.md`, read it as your tool's file.

---

## Setup

Pick a project you already have on your machine — a side project, a work repo, or even this `developer_improvements` folder itself.

---

## Part A — Audit (5 min)

Open Claude Code in your chosen project. Ask:

```
What do you know about this project's conventions, toolchain, and architecture?
```

Note what Claude gets right and what it misses or guesses incorrectly.

---

## Part B — Write the CLAUDE.md (8 min)

Create `CLAUDE.md` in the project root. You can run `/init` in a Claude Code session to have Claude draft one from your codebase, then cut it down to what matters. Or write it by hand and fill in at least three of these sections:

```markdown
# Project: [name]

## Architecture
(How is the code organized? What patterns does it follow? What's off-limits?)

## Toolchain
(Package manager, test runner, linter, build command. Be exact — no ambiguity.)

## Conventions
(Naming, file structure, import style, anything Claude gets wrong.)

## Rules
(Hard constraints: files never to modify, commands never to run, patterns to always follow.)

## Common Tasks
(Describe how to do the 2-3 most common tasks in this project.)
```

**Already have an `AGENTS.md`?** If your repo has one and no `CLAUDE.md`, Claude Code reads the `AGENTS.md` as your project instructions (Claude Code v2.1.277 or later). If you add a `CLAUDE.md`, Claude reads that instead, so put `@AGENTS.md` on a line in it to include both. For instructions that are only yours and shouldn't be committed, use `CLAUDE.local.md`.

**Rules for good CLAUDE.md content:**
- Specific over general. "Use pnpm" > "use a package manager"
- What, not why. Save explanations for the README.
- Only things Claude actually needs. Don't document things it already knows.

---

## Part C — Test it (2 min)

Start a new Claude Code session in the same project and repeat the audit question:

```
What do you know about this project's conventions, toolchain, and architecture?
```

Compare the before/after. Note what improved and what's still missing.

---

## Reflection

- What did Claude misunderstand before that it now gets right?
- What didn't make it into CLAUDE.md that you thought would matter?
- What would you add after running a real task?

---

**Go deeper:** [Claude Code 101](https://academy.claude.com/courses/claude-code-101) on Claude Academy.

**Coming from another tool?** Codex reads `AGENTS.md`; Cursor reads `.cursor/rules/*.mdc` and `AGENTS.md`; Gemini CLI reads `GEMINI.md`.
