# Exercise 2 — Subagents

**Time:** 15 minutes  
**Goal:** Use a subagent to run a code review in parallel with your main work.

---

## The pattern

Subagents are useful when you have work that:
- Doesn't depend on what you're doing right now
- Would clutter your current context if done inline
- Needs a fresh, unbiased perspective

Code review is the textbook case.

---

## Part A — Spawn a parallel reviewer (10 min)

Pick a file or module you recently changed (or use any file in this repo).

In your Claude Code session, ask:

```
Spawn a subagent to review [path/to/file.ts] for:
- Security vulnerabilities
- Missing error handling
- Any logic that looks fragile under load

Have the subagent return a structured report with: severity (HIGH/MEDIUM/LOW), finding, and suggested fix.
```

While the subagent runs, continue working on something else in the main session.

---

## Part B — Parallel research (5 min)

Try spawning multiple subagents simultaneously:

```
Spawn three subagents in parallel:
1. Find all places in the codebase where user input is passed to a SQL query
2. Find all TODO and FIXME comments and categorize them by component
3. List every external API call and note whether errors are handled

Have each return a JSON array of findings.
```

---

## Part C — Define your own subagent (optional, 5 min)

Instead of describing the reviewer in every prompt, save it as a file. Create `.claude/agents/reviewer.md` in your project:

```markdown
---
name: reviewer
description: Reviews code for security, error handling and fragile logic. Use after code changes.
tools: Read, Grep, Glob
model: sonnet
---

You are a code reviewer. Review the code you are pointed at and report findings as a list.
Each finding has: severity (HIGH, MEDIUM or LOW), the file and line, the problem, and a suggested fix.
Do not edit any files.
```

The file's name and description tell Claude when to hand work to it. `tools` limits what it can do (here, read-only). Personal subagents go in `~/.claude/agents/` instead.

Run it by name with `@agent-`, which guarantees Claude uses exactly this subagent:

```
@agent-reviewer review src/auth.ts
```

You can also ask in plain language ("use the reviewer subagent to review src/auth.ts"), but Claude then chooses from every subagent it can see. If you have others with similar descriptions, it may pick one of those instead. Use `@agent-` when it matters which one runs.

Or make the whole session run as the reviewer: `claude --agent reviewer`.

---

## Things to notice

- Subagents don't see your conversation history — they start cold
- The more explicit your spawn prompt, the better the output
- Subagent results come back as text you can then reason over
- Context isolation means the subagent won't be anchored to your assumptions
- A subagent file gives you a reusable, version-controlled specialist (Part C)

---

## Reflection

- What's the difference between asking Claude inline vs. spawning a subagent?
- When would you want the subagent to have its own CLAUDE.md instructions?
- What structured output format makes it easiest to synthesize multiple subagent results?
