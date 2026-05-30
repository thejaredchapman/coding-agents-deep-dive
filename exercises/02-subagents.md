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

## Things to notice

- Subagents don't see your conversation history — they start cold
- The more explicit your spawn prompt, the better the output
- Subagent results come back as text you can then reason over
- Context isolation means the subagent won't be anchored to your assumptions

---

## Reflection

- What's the difference between asking Claude inline vs. spawning a subagent?
- When would you want the subagent to have its own CLAUDE.md instructions?
- What structured output format makes it easiest to synthesize multiple subagent results?
