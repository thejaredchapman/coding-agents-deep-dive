# Exercise 1 — CLAUDE.md

**Time:** 15 minutes  
**Goal:** Write a CLAUDE.md that meaningfully improves Claude's behavior in a real project.

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

Create `CLAUDE.md` in the project root. Fill in at least three of these sections:

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
