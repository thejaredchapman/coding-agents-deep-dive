# Verified facts for the deck upgrade

Checked: 2026-10-05, Claude Code 2.1.290 on macOS. "Empirical" means observed by running Claude Code, not read from docs.

Method note: WebFetch summaries can be wrong. The hooks page summary claimed the Stop payload has flat token fields and showed an odd model ID; a real run showed it does not (see Hooks). Claims marked "docs (full text)" come from the page text itself; claims marked "docs (summary)" should be re-checked before they go on a slide.

## Corrections to the earlier audit and spec

| Earlier claim | Verified result |
|---|---|
| Stop hooks get `usage` in the payload (original deck) | Wrong. Empirical: no `usage`, `model` or token fields. |
| Claude Tag installs with `/install-slack-app` | Not in the official docs. Install from the Slack Marketplace, `/invite @Claude`, `@Claude connect`, paste pairing code. |
| "headless" is the docs' term | The docs page is titled "Run Claude Code programmatically" and says non-interactive mode / `claude -p`. "Headless" stays as a searchable keyword only. |

## Claude Code: CLAUDE.md and AGENTS.md

Source: https://code.claude.com/docs/en/memory (docs, full text; saved locally)

| Claim | Verified text |
|---|---|
| Reads AGENTS.md | Yes, from Claude Code v2.1.277. By default it reads `AGENTS.md` only when there is no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working directory or above. If both exist, only the `CLAUDE.md` files load. |
| Use both | Import it from `CLAUDE.md` with an `@AGENTS.md` import, or set **Project instructions** (via `/config`) to `claude-md-and-agents-md`. Other values: `claude-md-or-agents-md` (default), `claude-md`, `managed-only`. |
| Not read | `AGENTS.local.md`, `AGENTS.override.md`, anything under `.agents/`. |
| Other memory features | `.claude/rules/` path-scoped rules; auto memory (Claude writes its own notes; first 200 lines or 25KB load each session); `@path` imports; `CLAUDE.local.md` for uncommitted personal instructions. |
| Caveat | In some sessions `AGENTS.md` support is unavailable; the docs say to import it from a `CLAUDE.md` there. |

## Claude Code: skills

Source: https://code.claude.com/docs/en/skills (docs, full text)

| Claim | Verified text |
|---|---|
| Layout | `~/.claude/skills/<name>/SKILL.md` (personal), `.claude/skills/<name>/SKILL.md` (project), `<subdir>/.claude/skills/<name>/SKILL.md` (nested), `<plugin>/skills/<name>/SKILL.md` (plugin). `SKILL.md` is required; extra files (reference.md, scripts/) allowed. |
| Frontmatter | `name` (optional, defaults to directory), `description` (recommended), `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context` (`fork`), `agent`, `background`, `paths`, `shell`, `metadata`. |
| Arguments | `$ARGUMENTS` (all), `$ARGUMENTS[N]` or `$N` (0-based), `$name` for names declared in `arguments`. Also `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`. |
| Invocation | `/skill-name [arguments]`, or automatic when `description` matches. Up to six skills can be chained in one message. |
| Dynamic context | A line starting `` !`command` `` runs the command and injects its output before Claude reads the skill. |
| Minimal example | `---` / `name: summarize-changes` / `description: Summarizes uncommitted changes and flags anything risky` / `---` then `` !`git diff HEAD` `` and instructions. |
| Precedence | Enterprise, then personal, then project; plugin skills are namespaced `/plugin-name:skill-name`. |

## Claude Code: hooks

Source: https://code.claude.com/docs/en/hooks (docs, summary) plus an empirical Stop payload capture.

| Claim | Verified text |
|---|---|
| Events | SessionStart, Setup, SessionEnd, UserPromptSubmit, UserPromptExpansion, Stop, StopFailure, PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch, PermissionRequest, PermissionDenied, WorktreeCreate, WorktreeRemove, FileChanged, CwdChanged, DirectoryAdded, ConfigChange, InstructionsLoaded, Notification, MessageDisplay, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, SubagentStart, SubagentStop, TeammateIdle, TaskCreated, TaskCompleted, Elicitation, ElicitationResult. |
| Settings shape | `{"hooks":{"PreToolUse":[{"matcher":"Bash\|Edit\|Write","hooks":[{"type":"command","command":"..."}]}]}}`. Handler types: `command`, `http`, `mcp_tool`, `prompt`, `agent`. |
| Locations | `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed policy, plugin `hooks/hooks.json`, skill/subagent frontmatter. |
| Tool names for matchers | `Bash`, `Edit`, `Write`, `Read`, `Grep`, `Glob`, `PowerShell`, `mcp__<server>__<tool>`. |
| Common stdin fields | `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`. |
| Stop payload (empirical) | `session_id`, `transcript_path`, `cwd`, `prompt_id`, `permission_mode`, `hook_event_name`, `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`. No `usage`, `model` or token counts. |
| Where usage comes from | Read the transcript at `transcript_path` (this is what `../claude-code-usage-guard/usage_guard.py` does). That tool notes the transcript can lag at Stop time. |
| Exit code 2 | Blocks on PreToolUse, UserPromptSubmit, ConfigChange, PreCompact, WorktreeCreate, Elicitation; on Stop it prevents stopping; on PostToolUse it shows stderr to Claude (tool already ran). Other non-zero codes are non-blocking errors. |
| JSON output | `permissionDecision` (`allow`/`deny`/`ask`/`defer`) under `hookSpecificOutput` for PreToolUse; top-level `decision: "block"` for others. |

## Claude Code: subagents

Source: https://code.claude.com/docs/en/sub-agents (docs, summary)

| Claim | Verified text |
|---|---|
| File | Markdown with YAML frontmatter in `.claude/agents/` (project) or `~/.claude/agents/` (user). Required: `name`, `description`. Optional: `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `isolation` (`worktree`), `color`, and more. |
| Example | `name: test-runner`, `description: Runs tests and reports failures...`, `tools: Bash, Read, Grep`, `model: sonnet`, body = system prompt. |
| Invoke | Automatic delegation; `@agent-<name>`; `claude --agent <name>`; `--agents '<json>'` for session-only. |
| Built-in | Explore, Plan, general-purpose, claude. |
| Nesting | Subagents can spawn subagents, 3 levels by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`). |

## Claude Code: MCP

Source: https://code.claude.com/docs/en/mcp (docs, summary)

| Claim | Verified text |
|---|---|
| Add | `claude mcp add --transport http <name> <url>`; stdio: `claude mcp add --transport stdio <name> -- <command> [args...]` (the `--` is required); `--env KEY=VALUE`; `--header`. |
| Scopes | local (default, `~/.claude.json`, this project only), project (`.mcp.json` in repo root, shared via git), user (`~/.claude.json`, all projects). Flag: `--scope project\|user`. |
| `.mcp.json` | `{"mcpServers":{"name":{"type":"http","url":"...","headers":{...}}}}`; stdio entries use `type`, `command`, `args`, `env`. `${VAR}` and `${VAR:-default}` expand. A `url` without `type` is an error. |
| Transports | HTTP recommended; SSE deprecated. |
| Manage | `claude mcp list`, `get`, `remove`, `add-json`, `login`, `logout`, `serve`; `/mcp` in a session. |
| Not found | `~/.claude/mcp.json` is not a documented location. |

## Claude Code: plugins

Source: https://code.claude.com/docs/en/plugins (docs, full text)

| Claim | Verified text |
|---|---|
| What it is | A directory of skills, agents, hooks, MCP servers, or other components installed as one unit. Manifest at `.claude-plugin/plugin.json`. |
| Install | `/plugin` in a session (Discover tab); `claude plugin disable` from the shell; `--plugin-dir` loads straight from a folder. |
| Marketplaces | A repo or directory with `.claude-plugin/marketplace.json`. Install by name, for example `commit-commands@claude-plugins-official`. Official marketplace is added on first interactive start. |
| Scopes | user, project, local. |
| Evals | "Test plugins with evals" lives at https://code.claude.com/docs/en/plugin-evals (page not yet read; read before writing a slide). |

## Claude Code: permissions and non-interactive use

Sources: https://code.claude.com/docs/en/permissions (docs, partial), https://code.claude.com/docs/en/headless (docs, full text)

| Claim | Verified text |
|---|---|
| Modes | `default` (labeled Manual), `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. Cycle with Shift+Tab. |
| Rule syntax | `Bash(git diff *)` prefix match (space before `*` matters); `--allowedTools "Read,Edit,Bash"`. |
| Non-interactive | `claude -p "prompt"`. `--output-format text\|json\|stream-json`; `--json-schema`; `--continue`, `--resume <id>`; `--permission-mode`; `--permission-prompts none`; `--bare` for CI (skips hooks, skills, plugins, MCP, CLAUDE.md; needs `ANTHROPIC_API_KEY`). `--output-format json` includes `total_cost_usd`. |
| Example | `claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"` |

## Claude Code: Remote Control

Source: https://code.claude.com/docs/en/remote-control (docs, full text)

| Claim | Verified text |
|---|---|
| What it is | Connects claude.ai/code or the Claude iOS/Android app to a session running on your machine; execution stays local. |
| Start | `claude remote-control` (server mode; `--name`, `--capacity`); `claude --remote-control` or `--rc` (interactive session); `/remote-control` or `/rc` inside a session (also in the VS Code extension and the Desktop Code tab). |
| Requirements | Pro, Max, Team or Enterprise; API keys not supported; on Team and Enterprise an Owner must enable it in Claude Code admin settings. |
| Versus cloud | The page has a "Remote Control vs cloud sessions" table: Remote Control runs on your machine; cloud sessions (Claude Code on the web) run on Anthropic infrastructure; self-hosted environments run on your organization's. |

## Claude Tag and Claude in Slack

Sources: https://claude.com/docs/claude-tag/admins/setup-overview and https://code.claude.com/docs/en/slack (docs, full text)

| Claim | Verified text |
|---|---|
| Claude Tag | Claude working in your team's Slack channels, as the organization's shared identity with admin-configured access. Public beta. Team or Enterprise only; not Free, Pro or Max. |
| Setup | An Owner of the Claude organization runs setup at claude.ai/admin-settings/claude-tag. Install the Claude app from the Slack Marketplace (claude.com/claude-for-slack), `/invite @Claude`, send `@Claude connect` (Slack workspace admin only), paste the pairing code (expires in 15 minutes), then launch. Routines must be enabled in the org. |
| Not found | No `/install-slack-app` command appears in either page. |
| Earlier version | "Claude Code in Slack" runs each session under an individual account; being retired for Team and Enterprise in favor of Claude Tag; still the path for Pro and Max. Works in channels, not DMs. |
| Date | An "August 3, 2026" replacement date appeared only in a third-party search snippet; do not use it. |

## Claude Cowork

Source: https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork (search summary only; read the page before writing a slide)

| Claim | Verified text |
|---|---|
| What it is | Uses the same agentic architecture as Claude Code with no terminal; for knowledge work beyond coding. |
| Availability | Paid plans (Pro, Max, Team, Enterprise); Desktop (macOS, Windows), web, mobile, Chrome side panel; some surfaces vary by plan. |

## Claude Code shortcuts

Source: https://code.claude.com/docs/en/interactive-mode (docs, full text). macOS note: Alt shortcuts (`Alt+B/F/D/Y`) need Option set as Meta in the terminal. Docs add that `Option+P/T/O` work on macOS without it only where stated.

| Group | Shortcut | Action |
|---|---|---|
| Session control | `Ctrl+C` | Interrupt; if idle, clear input; second press exits |
| | `Ctrl+D` | Exit (press twice) |
| | `Esc` | Interrupt Claude / close dialog |
| | `Esc` `Esc` | Clear draft, or open rewind menu when input is empty |
| | `Ctrl+B` | Background running tasks |
| | `Ctrl+Z` | Suspend (Unix) |
| | `Ctrl+Enter` or `Ctrl+X Ctrl+S` | Send queued messages now |
| Mode switching | `Shift+Tab` | Cycle permission modes |
| | `Option+P` / `Alt+P` | Switch model |
| | `Option+T` / `Alt+T` | Toggle extended thinking |
| | `Option+O` / `Alt+O` | Toggle fast mode |
| Navigation | `Ctrl+R` | Reverse-search history |
| | `Up` / `Down` or `Ctrl+P` / `Ctrl+N` | Move cursor / history |
| | `Ctrl+O` | Toggle transcript viewer |
| | `Ctrl+T` | Toggle task checklist |
| | `Ctrl+L` | Redraw screen |
| Editing | `Ctrl+A` / `Ctrl+E` | Start / end of line |
| | `Ctrl+K` / `Ctrl+U` / `Ctrl+W` | Delete to end / start / previous whitespace |
| | `Ctrl+Y` | Paste deleted text |
| | `Ctrl+_` | Undo input edit |
| | `Ctrl+G` or `Ctrl+X Ctrl+E` | Edit prompt in external editor |
| | `Ctrl+S` | Stash or restore prompt |
| | `Ctrl+V` (`Cmd+V` iTerm2, `Alt+V` Windows/WSL) | Paste image |
| Multiline | `\` then `Enter`; `Ctrl+J`; `Shift+Enter` (supported terminals); `Option+Enter` (Option as Meta) | New line |
| Quick prefixes | `/` command or skill; `!` shell mode; `@` file mention; `?` on empty input shows the shortcut panel | |

Slash commands: full list at https://code.claude.com/docs/en/commands (fetched, saved locally; condense before the cheat-sheet slide).

## Claude ecosystem (Task 7 sources)

Checked 2026-10-07. Docs (full text) unless noted.

| Topic | Verified text | Source |
|---|---|---|
| Models (current) | Fable 5.1 `claude-fable-5-1` ($10/$50 per MTok, "demanding reasoning and long-horizon agentic work"); Opus 5.5 `claude-opus-5-5` ($4/$20, "long-running agentic coding and knowledge work"; the docs' suggested starting point); Sonnet 5.5 `claude-sonnet-5-5` ($2/$10, "best combination of speed and intelligence"); Haiku 5.5 `claude-haiku-5-5` (from $0.10/$0.50, "high-volume, latency-sensitive tasks"). All 1M context, 128K max output. Haiku 4.5 (`claude-haiku-4-5-20251001`) is now legacy. Correction: the earlier plan and spec listed Haiku 4.5 as current. | https://platform.claude.com/docs/en/about-claude/models/overview |
| Fast mode | Claude Opus with a faster API configuration, up to 2.5x faster at higher cost; not a different model. Toggle `/fast` (CLI) or `Option+O` / `Alt+O`. Supported on Opus 5.5, Opus 5, Opus 4.8; not on Sonnet or Haiku. Opus 5.5 fast pricing $8/$40. Needs usage credits on subscription plans; Team and Enterprise Owners must enable it. Research preview. | https://code.claude.com/docs/en/fast-mode |
| Agent SDK | "Claude Code as a library": the same tools, agent loop and context management, in Python and TypeScript. Capabilities: built-in tools, hooks, subagents, MCP, permissions, sessions, skills/commands/memory, plugins. To use from another language, run the CLI with `-p --output-format json`. Third parties may not offer claude.ai login for SDK-based products; use API keys. | https://code.claude.com/docs/en/agent-sdk/overview |
| SDK vs CLI vs API vs Managed Agents | Agent SDK = Claude Code's agent in your own process; CLI = interactive terminal use; Client SDK = call the Claude API directly (you write the tool loop, or use the beta tool runner); Managed Agents = Anthropic hosts the agent harness with sessions in a managed cloud sandbox (or your own self-hosted sandbox). | same |
| Managed Agents | Pre-configured agent harness on managed infrastructure for long-running, asynchronous work. Concepts: Agent, Environment, Session, Events. Built-in tools: Bash, file operations, web search and fetch, MCP servers. Beta; requests need the `managed-agents-2026-04-01` beta header (from a search summary; confirm on the page). | https://platform.claude.com/docs/en/managed-agents/overview |
| Claude in Chrome | Extension plus Claude Code: `claude --chrome`, `/chrome` to check or reconnect, "Enabled by default" option. Opens tabs in your logged-in browser; pauses for logins and CAPTCHAs. Works with Chrome, Edge and other Chromium browsers; not WSL. Needs a direct Anthropic plan (Pro, Max, Team, Enterprise), the extension (1.0.36+) and a `/login` session (not API-key auth). Uses: test local web apps, read console logs, fill forms, extract data, record GIFs. | https://code.claude.com/docs/en/chrome |
| Cowork | Same agentic architecture as Claude Code, no terminal; describe an outcome and get finished work (documents, organized files, research). Runs in the cloud (beta on Team and Enterprise); Desktop (macOS, Windows), web, mobile, Chrome side panel; Pro, Max, Team, Enterprise with per-surface differences. | https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork |
| Surfaces | Claude Code runs in the terminal CLI, the Claude Desktop app (Code tab), the web at claude.ai/code (cloud sessions), the VS Code extension and JetBrains IDEs. A plugin installed at user scope in the terminal, desktop local sessions or VS Code is available in the other two; cloud sessions do not load local plugins. | https://code.claude.com/docs/en/plugins |
| Computer use | Claude Code can control native macOS apps when a task cannot be done in a browser (page exists; not read). | https://code.claude.com/docs/en/computer-use |

Not verified, so left out of slides: Artifacts and Claude Docs details.

## Codex (OpenAI)

Checked 2026-10-05. Docs moved: `developers.openai.com/codex/...` URLs return 308 redirects to `learn.chatgpt.com/docs/...` (an OpenAI-owned host; followed and noted). All rows are docs (summary) unless noted; re-read the page before a slide quotes a field name.

| Row | Verified text | Source |
|---|---|---|
| Instructions | `AGENTS.md`. Global `~/.codex/AGENTS.override.md` or `~/.codex/AGENTS.md`; project files from the Git root down to the cwd, checking `AGENTS.override.md`, then `AGENTS.md`, then fallback names; concatenated root to cwd, closer files override. Cap `project_doc_max_bytes`, default 32 KiB. `/init` generates an `AGENTS.md` scaffold (per the slash-command page). | https://learn.chatgpt.com/docs/agent-configuration/agents-md |
| Subagents | TOML files in `.codex/agents/` (project) or `~/.codex/agents/` (user). Required: `name`, `description`, `developer_instructions`. Optional: `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config`. Built-ins: `default`, `worker`, `explorer`. Concurrency cap `agents.max_concurrent_threads_per_session`. | https://learn.chatgpt.com/docs/agent-configuration/subagents |
| Skills | `SKILL.md` with YAML frontmatter (`name`, `description`), optional `scripts/`, `references/`, `assets/`. Locations `~/.agents/skills` (global), `.agents/skills` (repo). Progressive disclosure. | https://learn.chatgpt.com/docs/customization/overview |
| MCP | `config.toml` tables: `[mcp_servers.<name>]` with `command`, `args`, `env`, `env_vars`, `cwd`; HTTP servers use `url`, `bearer_token_env_var`, `http_headers`. CLI: `codex mcp add <name> [--env K=V] -- <command...>`, `codex mcp add <name> --url <url>`, `list`, `login`, `logout`, `remove`. Project-level `.codex/config.toml` for trusted projects; global `~/.codex/config.toml`. | https://learn.chatgpt.com/docs/extend/mcp?surface=cli |
| Hooks | Events: PreToolUse, PermissionRequest, PostToolUse, PreCompact, PostCompact, UserPromptSubmit, SubagentStop, Stop, SessionStart, SessionEnd, Interrupt, SubagentStart. Files: `~/.codex/hooks.json`, `~/.codex/config.toml`, `<repo>/.codex/hooks.json`, `<repo>/.codex/config.toml`. JSON shape matches Claude Code's (`matcher` plus nested `hooks`, `type: "command"`). Exit 2 blocks. Stdin: `session_id`, `transcript_path`, `cwd`, `hook_event_name`, `model`, `turn_id`. | https://learn.chatgpt.com/docs/hooks |
| Permissions | Sandbox: `workspace-write` (default in version-controlled folders), `read-only` (default otherwise), `danger-full-access`. Approvals: `on-request`, `never` (`untrusted` deprecated). Switch in the TUI with `/permissions`. Config keys `approval_policy`, `sandbox_mode`, `approvals_reviewer`. | https://learn.chatgpt.com/docs/agent-approvals-security |
| Headless / CI | `codex exec [PROMPT]` (alias `codex e`), `codex exec resume [SESSION_ID]`; flags `--json`, `-o/--output-last-message`, `--output-schema`, `--ephemeral`. Global flags `-m`, `-s/--sandbox`, `-a/--ask-for-approval`, `-C`, `-c`, `-p/--profile`, `--yolo`. | https://learn.chatgpt.com/docs/developer-commands?surface=cli |
| Other CLI | `codex resume`, `fork`, `review [--uncommitted\|--base BRANCH\|--commit SHA]`, `sandbox -- COMMAND`, `plugin add/list/remove`, `plugin marketplace add/list`, `doctor`, `login`, `update`. | same |
| Remote / cloud | `--remote` connects the CLI to an app-server; the desktop-app slash list has `/cloud` and `/cloud-environment`. Not verified for the CLI. | same, https://learn.chatgpt.com/docs/reference/slash-commands |
| Slash commands | The only fetched list is for the ChatGPT desktop app: `/approve`, `/cloud`, `/cloud-environment`, `/compact`, `/fast`, `/feedback`, `/fork`, `/goal`, `/ide-context`, `/init`, `/local`, `/mcp`, `/memories`, `/model`, `/pet`, `/personality`, `/plan`, `/project`, `/reasoning`, `/review`, `/side`, `/status`, `/task`, `/worktree`. The CLI TUI list differs (for example `/permissions`) and is **unverified**. | https://learn.chatgpt.com/docs/reference/slash-commands |
| Keyboard shortcuts | **Unverified.** No official page fetched lists CLI TUI shortcuts; none is installed locally to check. Do not publish a Codex shortcuts table until verified from the repo docs or a local `codex` run. | n/a |

## Cursor

Checked 2026-10-05. Docs (summary) unless noted.

| Row | Verified text | Source |
|---|---|---|
| Instructions | Project Rules in `.cursor/rules/*.mdc` (must be `.mdc`; frontmatter `alwaysApply`, `globs`, `description`); User Rules (global, used by Agent chat, not Inline Edit); Team Rules; plus `AGENTS.md` in the project root, nested files supported, deeper wins. Precedence: Team, then Project, then User. | https://cursor.com/docs/rules |
| Subagents | Markdown + YAML frontmatter in `.cursor/agents/`, `.claude/agents/` or `.codex/agents/` (project) and the `~/` equivalents; project wins on name conflicts. Fields `name`, `description`, `model` (default `inherit`), `readonly`, `is_background`. Invoke `/name ...`, by name in prose, or automatically. Built-ins: Explore, Bash, Browser. | https://cursor.com/docs/subagents |
| Skills | `SKILL.md` in `.agents/skills/` or `.cursor/skills/` (project) and `~/.agents/skills/` or `~/.cursor/skills/` (user); required `name` and `description`; optional `paths`, `disable-model-invocation`, `metadata`. Invoke by typing `/` in Agent chat. | https://cursor.com/docs/skills |
| MCP | `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global); `{"mcpServers":{"name":{"command","args","env"}}}` or `{"url","headers"}`. Transports stdio, SSE, Streamable HTTP. No documented CLI add command on that page. | https://cursor.com/docs/mcp |
| Hooks | `hooks.json` at `~/.cursor/hooks.json` or `<project>/.cursor/hooks.json` (plus enterprise paths). Shape `{"version":1,"hooks":{"afterFileEdit":[{"command":"./hooks/format.sh","timeout":30,"type":"command","matcher":"*"}]}}`. Events (camelCase) include sessionStart, sessionEnd, preToolUse, postToolUse, subagentStart, subagentStop, beforeShellExecution, afterFileEdit, beforeSubmitPrompt, preCompact, stop. Exit 2 blocks. | https://cursor.com/docs/hooks |
| Permissions | CLI `/sandbox` command or `--sandbox <enabled\|disabled>`; allow/deny rules not covered on the pages fetched. | https://cursor.com/docs/cli/overview |
| Headless / CI | CLI command is `agent`: `agent -p "prompt"` (or `--print`), `--output-format text\|json`. Install `curl https://cursor.com/install -fsS \| bash`. A search snippet showing `cursor --headless` is wrong; do not use. | https://cursor.com/docs/cli/using |
| Remote / cloud | Cloud Agents run in isolated VMs; start from Cursor iOS, web (cursor.com/agents), the desktop Cloud dropdown, Slack `@cursor`, GitHub or Bitbucket `@cursor`, Linear, or the API; paid plan required. In the CLI, prepending `&` to a message sends it to the cloud (from the CLI page; the cloud-agent page does not mention it). | https://cursor.com/docs/cloud-agent |
| CLI shortcuts | Up (history), `Shift+Tab` (rotate Agent, Plan, Ask), `Shift+Enter` or `Ctrl+J` (newline), `Ctrl+D` double-press (exit), `Ctrl+R` (review changes). Slash: `/plan`, `/ask`, `/summarize`, `/resume`. Resume: `agent resume`, `agent --continue`, `agent --resume <id>`, `agent ls`. | https://cursor.com/docs/cli/using |
| IDE shortcuts (macOS) | General: `Cmd+I` or `Cmd+L` toggle side panel, `Cmd+E` agent layout, `Cmd+.` mode menu, `Cmd+/` loop models, `Cmd+Shift+J` settings, `Cmd+Shift+P` palette. Chat: `Return` queue message, `Cmd+Return` force send, `Cmd+Shift+Backspace` cancel, `Cmd+Shift+L` add selection as context, `Shift+Tab` rotate modes, `Cmd+N` or `Cmd+R` new chat, `Cmd+T` new tab. Inline edit: `Cmd+K`, `Return`, `Opt+Return` (quick question). Tab: `Tab` accept, `Cmd+Right` next word. Terminal: `Cmd+K`, `Cmd+Return`. macOS only on the page; Windows and Linux keys are not documented there. | https://cursor.com/docs/configuration/kbd |

## Gemini CLI (Google)

Checked 2026-10-05. "Google's version" taken as Gemini CLI. Docs (summary) unless noted; the shortcut and slash-command pages were extracted in full.

| Row | Verified text | Source |
|---|---|---|
| Instructions | `GEMINI.md`: global `~/.gemini/GEMINI.md`; workspace and parent directories; just-in-time when a tool touches a path. All found files are concatenated. `@file.md` imports. `/memory show` and `/memory reload`. `/init` generates a GEMINI.md. `context.fileName` in `settings.json` accepts several names including `AGENTS.md`. | https://geminicli.com/docs/cli/gemini-md/, https://geminicli.com/docs/reference/commands/ |
| Subagents | Markdown + YAML frontmatter in `.gemini/agents/*.md` (project) or `~/.gemini/agents/*.md` (user). Required `name`, `description`; optional `kind`, `tools`, `mcpServers`, `model`, `temperature`, `max_turns` (30), `timeout_mins` (10). Invoke automatically or `@agent-name ...`. Built-ins: `codebase_investigator`, `cli_help`, `generalist`, `browser_agent` (off by default). `/agents` manages them. | https://geminicli.com/docs/core/subagents/ |
| Skills | Locations: user `~/.gemini/skills/` or `~/.agents/skills/`; workspace `.gemini/skills/` or `.agents/skills/` (the `.agents` alias wins within a tier); also extension and built-in skills. Manage with `/skills list/link/enable/disable/reload` and `gemini skills list/install/uninstall`. Frontmatter schema not documented on that page. | https://geminicli.com/docs/cli/skills/ |
| Custom commands | TOML files in `~/.gemini/commands/` or `<project>/.gemini/commands/`; required `prompt`, optional `description`; subdirectories become `:` namespaces (`git/commit.toml` is `/git:commit`); `{{args}}` placeholder; `!{...}` shell injection; `@{path}` file injection. | https://geminicli.com/docs/cli/custom-commands/ |
| Extensions | Bundle prompts, MCP servers, custom commands, themes, hooks, subagents and skills. Manifest `gemini-extension.json` (`name`, `version`, `mcpServers`, optional `contextFileName`); layout `commands/`, `skills/`, `GEMINI.md`. `gemini extensions install/uninstall/list/update/enable/disable/link/new/validate`. | https://geminicli.com/docs/extensions/, .../writing-extensions/ |
| MCP | `gemini mcp add <name> <command>`, `gemini mcp add <name> <url> --transport http`, `--env KEY=value`, `--include-tools a,b`; `/mcp` in a session. Example: `gemini mcp add github npx -y @modelcontextprotocol/server-github`. | https://geminicli.com/docs/cli/cli-reference/ |
| Hooks | Events: SessionStart, SessionEnd, BeforeAgent, AfterAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool, AfterTool, PreCompress, Notification. Shape: `{"hooks":{"BeforeTool":[{"matcher":"write_file\|replace","hooks":[{"name":"security-check","type":"command","command":"$GEMINI_PROJECT_DIR/.gemini/hooks/security.sh","timeout":5000}]}]}}`. Exit 0 parses stdout as JSON; exit 2 blocks; other codes warn. `/hooks` manages. | https://geminicli.com/docs/hooks/ |
| Permissions | `--approval-mode default\|auto_edit\|yolo\|plan` (`--yolo` deprecated); `Shift+Tab` cycles approval modes, `Ctrl+Y` toggles YOLO; `/permissions` manages folder trust. Sandboxing: `-s/--sandbox`, `GEMINI_SANDBOX=true\|docker\|podman\|sandbox-exec\|runsc\|lxc`, or `"sandbox": true`; methods macOS Seatbelt, containers, Windows native, gVisor, LXC. | cli-reference, https://geminicli.com/docs/cli/sandbox/, keyboard-shortcuts |
| Headless / CI | Triggered by `-p/--prompt` or a non-TTY. `-o/--output-format text\|json\|stream-json`. JSON has `response`, `stats`, optional `error`. Exit codes 0, 1, 42 (input error), 53 (turn limit). `-i` runs a prompt then stays interactive. | https://geminicli.com/docs/cli/headless/ |
| Remote / cloud | **Unverified** for Gemini CLI. `/setup-github` sets up GitHub Actions with Gemini. Check Jules, Antigravity and Gemini Code Assist separately. | commands page |
| Slash commands | `/about /agents /auth /bug /chat /clear /commands /compress /copy /directory /docs /editor /extensions /help /hooks /ide /init /mcp /memory /model /permissions /plan /policies /privacy /quit /restore /rewind /resume /settings /shells /setup-github /skills /stats /terminal-setup /theme /tools /upgrade /vim`; `@path` injects files; `!cmd` runs shell (lone `!` toggles shell mode). | https://geminicli.com/docs/reference/commands/ |

Gemini CLI shortcuts (full page, https://geminicli.com/docs/reference/keyboard-shortcuts/):

| Group | Shortcut | Action |
|---|---|---|
| Session control | `Ctrl+C` | Cancel request, or quit when input is empty; clears input otherwise |
| | `Ctrl+D` | Exit when input is empty |
| | `Esc` or `Ctrl+[` | Dismiss dialogs / cancel focus |
| | `Ctrl+Z` | Suspend to background |
| | `Ctrl+B` | Toggle background shell visibility |
| Mode switching | `Shift+Tab` | Cycle approval modes |
| | `Ctrl+Y` | Toggle YOLO auto-approval |
| | `Ctrl+S` | Toggle mouse mode |
| | `Alt+M` | Toggle Markdown rendering |
| Navigation | `Ctrl+R` | Reverse search history |
| | `Ctrl+P` / `Ctrl+N` | Previous / next history entry |
| | `Shift+Up/Down`, `Page Up/Down` | Scroll |
| | `Ctrl+O` | Expand / collapse blocks |
| | `Ctrl+T` | Toggle full TODO list |
| | `Ctrl+L` | Clear and redraw screen |
| | `F12` / `F4` / `F9` | Debug console / IDE context / copy mode |
| Editing | `Ctrl+A` / `Ctrl+E` | Start / end of line |
| | `Ctrl+K` / `Ctrl+U` | Delete to end / start of line |
| | `Ctrl+W` or `Ctrl+Backspace` | Delete previous word |
| | `Ctrl+Z` (also `Alt+Z`, `Cmd+Z`) | Undo edit (while editing text) |
| | `Ctrl+G` | Open prompt or plan in external editor |
| | `Ctrl+V` | Paste |
| Multiline and queue | `Shift+Enter`, `Ctrl+Enter`, `Alt+Enter`, `Ctrl+J` | New line |
| | `Tab` | Queue the prompt to run after the current task |
| | Vi mode | `/vim` toggles; full NORMAL-mode key set on the page |

## Cross-tool findings worth a slide

| Finding | Source |
|---|---|
| `SKILL.md` skills exist in Claude Code, Codex, Cursor and Gemini CLI; Codex, Cursor and Gemini CLI all read `.agents/skills/` (Cursor and Gemini also have their own `.cursor/` and `.gemini/` paths). | Codex, Cursor, Gemini rows above |
| Cursor reads `.claude/agents/` and `.codex/agents/` as well as `.cursor/agents/`. | https://cursor.com/docs/subagents |
| Hook config is near-identical between Claude Code and Codex (`matcher` plus nested `hooks`, exit 2 blocks); Cursor and Gemini CLI use their own event names and shapes. | Hooks rows |
| `AGENTS.md` is read by Codex and Cursor; Gemini CLI can be configured to read it via `context.fileName`; Claude Code reads `CLAUDE.md` (check whether Claude Code reads `AGENTS.md` before stating anything). | Instructions rows |
| Non-interactive flag is `-p` in Claude Code, Gemini CLI and the Cursor `agent` CLI; Codex uses `codex exec`. | Headless rows |

## Open items (not yet verified; nothing below may go in a slide yet)

- Codex CLI slash commands and keyboard shortcuts (no official CLI list reached; Codex is not installed locally).
- Gemini CLI remote or cloud story; Jules, Antigravity, Gemini Code Assist.
- Claude Cowork official page; Claude in Chrome; Artifacts; Agent SDK; Managed Agents; fast mode page; cross-session messaging; plugin-evals page; Claude Code slash command cheat sheet (full page saved locally at `~/.claude/projects/.../tool-results/toolu_017svwJm6WmgBJe5eDuebWjx.txt`).
- Cursor permission rules (allow/deny) and Windows/Linux IDE shortcuts.

## Providers and free learning pages (checked 2026-10-07)

Data lives in `app/public/providers.json`; `npm test` validates its shape.

| Program | What was verified | Not verified |
|---|---|---|
| Claude Academy (academy.claude.com) | Site says "Free courses, tutorials, and use cases from Anthropic's education team". 27 distinct course links counted live (the earlier "28" was a miscount, now fixed). | Sign-in and certificate details. |
| OpenAI Academy (academy.openai.com) | Page read directly: pathways Apply AI at Work, Build with AI ("Learn to use Codex across the software development lifecycle or build with the OpenAI API"), Lead AI Adoption, Teach and learn with AI. | Cost verified 2026-10-07 by reading OpenAI's help article (help.openai.com/en/articles/20001270) in a real browser: "Academy courses are free. You must have a ChatGPT account to start a course and save your progress." The Academy home page states no price. |
| Cursor Learn (cursor.com/learn) | Page read directly; 13 lesson URLs found. | No price stated; lesson titles are derived from the URLs. |
| Google: Hands-on with Gemini CLI codelab | Page read: audience, what you learn, prerequisites (Gmail account, Chrome). | No price or duration stated. |
| Google: DeepLearning.AI Gemini CLI course | Page read: Beginner, 1h23m, 11 video lessons, graded assignment needs PRO; hosted by DeepLearning.AI, taught by a Google developer advocate. | Price not listed. |
| Google Skills (skills.google) | Home page read in a real browser 2026-10-07: GEAR program, 35 monthly credits "at no cost", Subscriptions. | The deep link /paths/1282/course_templates/1448 redirected to the home page, so the specific Gemini CLI course was dropped. |

## Guide content (merged from ai-coding-assistants-guide)

Sections 12 to 14 of `deck.md` were converted from that repo's `src/content.ts` on 2026-10-07: all 23 chapters (Start here, Claude Code deep dive, assistant profiles) plus its welcome text, as 101 slides. The tool picker's data lives in `app/src/app/needs-picker.data.ts`. Its claims were sourced there from vendor docs read on 2026-10-02 and were **not re-verified** here, except:

- **Corrected:** the current-models table now lists Haiku 5.5 (`claude-haiku-5-5`) as current and Haiku 4.5 as legacy, matching the Models row above. The older-models status table is unchanged and unchecked.
- **Corrected:** the `/standup` skill's git command now uses `--since="yesterday midnight" --until="midnight"` (as in the exercises), and the cost-tracker install URL points to `thejaredchapman/claude-code-usage-guard` (the old URL 404s).
- **Unverified:** "v2.1.283 and later start in auto mode".
- The guide overlaps the deck (models, CLAUDE.md, skills, MCP, permissions). Where they differ, the deck's verified facts win.

## Parity research for Codex, Cursor and Gemini CLI (2026-10-07, before any slides are built)

Goal: give each tool the same three layers Claude Code has: an **ecosystem** section (where it runs, cloud and integrations, models, plugins, programmatic use), a **field guide** (install, first session, models, safety and data, cost and limits) and **shortcuts**. Rows marked **cross-check** came from a fetch summary that contradicted itself or the page, so re-read the page before quoting it.

### Codex (OpenAI)

| Topic | Finding | Source |
|---|---|---|
| Install | Mac/Linux `curl -fsSL https://chatgpt.com/codex/install.sh \| sh`; Windows `powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 \| iex"`; also `npm install -g @openai/codex`, `brew install --cask codex`, GitHub Releases. Sign in: run `codex`, choose "Sign in with ChatGPT"; API key also possible. Apache-2.0. | https://github.com/openai/codex |
| Surfaces | CLI (`codex`), IDE integration (VS Code, Cursor, Windsurf), desktop app (`codex app`), cloud ("Codex Web", chatgpt.com/codex). | same |
| Cloud | Start from ChatGPT web, mobile or desktop: "Work in > Cloud", pick or create an environment, "Start a new task". Environments hold repos, tools, internet access, package managers, network secrets and env vars; each task gets its own workspace. Full environment creation needs web or desktop. Slack: the page only says "Use ChatGPT in Slack"; Codex-specific Slack workflow not stated. | https://learn.chatgpt.com/docs/cloud |
| Models | Astra ("most capable"), GPT-6.1 Sol, GPT-6 Luna ("most efficient"). Switch with `/model` or `codex --model gpt-6.1-sol`. Reasoning effort: Light/Low, Medium, High/Extra High, Max, Ultra (for parallel sub-tasks). The page says GPT-5.5 retires 2026-10-14. **Cross-check:** one summary wrote "GPT-6 Sol" and another "GPT-6.1 Sol"; confirm exact names. | https://learn.chatgpt.com/docs/models |
| Pricing and limits | Codex is included in ChatGPT Free, Go, Plus, Pro, Business, Edu and Enterprise. Free $0, Go $8, Plus $20, Pro from $100 ($100/$200/$500 tiers), Business $20 per user per month annual ($25 monthly). Limits per five hours, for example Plus on GPT-6 Luna 350 to 3,000 local messages and on GPT-6.1 Sol 15 to 160. Credits extend usage (Luna 2.5 in / 0.25 cached / 12.5 out per million tokens; Sol 50 / 2.5 / 250). | https://learn.chatgpt.com/docs/pricing |
| Safety | OS sandbox: macOS Seatbelt (`sandbox-exec`), Linux `bwrap` plus `seccomp`, Windows native or WSL2. Default `workspace-write`; network off by default; domain allowlists with wildcards; private destinations blocked by default. Asks approval for edits outside the workspace, network, commands outside a trusted set, destructive tool calls. OTel telemetry is opt-in. **No training or retention statement on that page.** | https://learn.chatgpt.com/docs/agent-approvals-security |
| Slash commands (CLI) | `/model /fast /plan /goal /personality /new /clear /rename /resume /fork /side /app /permissions /approve /review /ide /mention /skills /apps /plugins /mcp /status /usage /compact /diff /ps /stop /quit /exit /archive /delete /vim /keymap /theme /statusline /title /pets /memories /experimental /debug-config /copy /raw /feedback /init /import /logout /agent /subagents /hooks`, plus Windows `/sandbox-add-read-dir` and `/setup-default-sandbox`. `/import` migrates from Cursor or Claude Code. **Cross-check:** the summary called this page "Claude Code's command-line interface"; that is wrong, the page is Codex CLI. Official page: https://developers.openai.com/codex/cli/slash-commands (redirects to learn.chatgpt.com). | https://learn.chatgpt.com/docs/cli/slash-commands |
| Shortcuts | The CLI page lists: `Esc`, `Ctrl+C`, a newline key, `@` file mention, `!` shell command, image paste, `Esc` twice to edit the previous message, `?` for the shortcut overlay; `/keymap` rebinds. **Cross-check:** the fetch summary garbled the newline row ("submit"); other sources say `Ctrl+J` or `Alt+Enter`. Confirm the exact bindings from the page text or a local `codex` run before a slide quotes them. | https://learn.chatgpt.com/docs/codex/cli |
| Programmatic | `codex exec` (known), `--remote`, plugin marketplace. SDK, GitHub Action and Slack pages were not reached (the `/docs/sdk` URL returned 404). | n/a |

### Cursor

| Topic | Finding | Source |
|---|---|---|
| What it is | "a coding agent for building ambitious software"; connects to GitHub, GitLab, Azure DevOps, Bitbucket, JetBrains, Slack, Linear. | https://cursor.com/docs |
| Models | Cursor models pool (Grok 4.7/4.6/4.5, Composer 2.5; fast variants at 2x) and an "other models" pool at API rates (Anthropic, OpenAI, Google, Meta, Moonshot, Z.ai). Auto modes: Cost, Balance, Intelligence, billed at the list price of the routed model. | https://cursor.com/docs/models |
| Pricing | Hobby free (limited Agent requests, Composer); Pro $20; Pro Plus $60; Ultra $200; Teams $40 or $120 per user; Enterprise custom. Cloud agents, MCPs, skills and hooks are listed under Individual. The pricing page does not give exact usage limits per tier. | https://cursor.com/docs/models, https://cursor.com/pricing |
| Privacy | Privacy Mode is available to free and Pro users; with it on, "we will not train on your data". SOC 2 Type II, ISO/IEC 27001:2022, ISO/IEC 42001:2023; reports at trust.cursor.com; no infrastructure in China. Details live on a separate data-use page not fetched (`/docs/account/privacy` returned 404). | https://cursor.com/security |
| Integrations | GitHub app connects repos for Cloud Agents and Bugbot; setup needs a Cursor admin and a GitHub org admin; GHES 3.8+ supported. Slack and Linear are named in the overview; their pages were not fetched. | https://cursor.com/docs/integrations/github |
| Programmatic | Cloud Agents API (Beta, all plans), TypeScript SDK, Python SDK, SDK Bridge, plus Enterprise APIs (Bugbot, Admin, Analytics, AI Code Tracking) and an Origin API in early beta. | https://cursor.com/docs/api |
| Shortcuts | The keyboard page lists macOS keys only (VS Code key bindings as the baseline); Windows and Linux keys are still not documented there. | https://cursor.com/docs/configuration/kbd |

### Gemini CLI (Google)

| Topic | Finding | Source |
|---|---|---|
| Install and sign-in | `npm install -g @google/gemini-cli`, then `gemini`; "Sign in with Google"; some account types need a Google Cloud project; API key and Vertex AI routes exist. | https://geminicli.com/docs/get-started/ |
| Models | Gemini 3 (`gemini-3-pro-preview`, `gemini-3-flash-preview`) and Gemini 2.5 (`gemini-2.5-pro`, `gemini-2.5-flash`). Auto is the recommended default. Switch with `/model` or `--model`; `/model` does not change sub-agent models. The page does not state a context window. | https://geminicli.com/docs/cli/model/ |
| Quota | Google account (Code Assist): 1,000 requests a day. Unpaid Gemini API key: 250 model requests per user per day. Google AI Pro 1,500; AI Ultra 2,000; Code Assist Standard 1,500; Enterprise 2,000; pay-as-you-go varies. `/stats model` shows usage. **The merged guide's "API key 1,000 a day" is out of date.** | https://geminicli.com/docs/resources/quota-and-pricing/ |
| Privacy | The page does not say whether prompts or code are used for training; it points to the privacy notice for each sign-in type (free individuals, paid tiers, API unpaid and paid, Vertex). Usage statistics can be turned off. | https://geminicli.com/docs/resources/tos-privacy/ |
| IDE | VS Code and compatible editors (including Antigravity), JetBrains IDEs, Zed, other ACP editors. Shares open files, cursor and up to 16 KB of selection; native diff view. `/ide install`, `/ide enable`, `/ide status`. | https://geminicli.com/docs/ide-integration/ |
| GitHub | `run-gemini-cli` action: PR review, issue triage, `@gemini-cli` mentions; set up with `/setup-github`; secrets `GEMINI_API_KEY` and `GITHUB_TOKEN`; add `.gemini/` and `gha-creds-*.json` to `.gitignore`. | https://github.com/google-github-actions/run-gemini-cli |
| Docs map | Features include Checkpointing, Git worktrees, Model routing, Model steering, Notifications, Plan mode, Remote subagents, Rewind, Sandboxing, Telemetry, Token caching, Trusted folders, `.geminiignore`, Policy engine. Gaps in our deck: checkpointing and rewind, worktrees, remote subagents, trusted folders, policy engine. | https://geminicli.com/docs/ |

### Not found or not verified

- Codex: SDK, GitHub and Slack integration pages; the exact text of the CLI shortcuts; training and retention statements.
- Cursor: Windows and Linux keys; the data-use page; Slack and Linear integration pages.
- Gemini CLI: training use of prompts for each sign-in type; any hosted or cloud agent beyond the GitHub Action and remote subagents.
- Copilot, Windsurf and Aider: no new research. Their only coverage is the merged profiles (2026-10-02, unverified).

### GitHub Copilot (checked 2026-10-08, docs.github.com unless noted)

| Topic | Finding | Source |
|---|---|---|
| What it is | "an AI assistant that helps you write, understand, and ship software": assistive (suggestions, explanations), agentic (researches a repo, proposes a plan, edits files, reviews pull requests), customizations, external integrations (third-party agents, MCP servers). | /copilot/get-started/what-is-github-copilot |
| Plans | Free ("limited access to a selection of Copilot features"); Pro $10/month, 1,000 base plus 500 flex AI credits; Pro+ $39, 3,900 plus 3,100; Max $100, 10,000 plus 10,000; Business $19 per seat, 1,900 credits; Enterprise $39 per seat, 3,900. Copilot Student is free for verified students; verified teachers and maintainers of popular open source projects "may be eligible" for free Copilot Pro. **The merged guide's "premium requests" wording and plan list are out of date.** | /copilot/get-started/plans |
| Cloud agent | Start from the agents panel, a conversation, or an issue or pull request on GitHub.com (also code scanning alerts). Runs in "an ephemeral cloud development environment"; edits files, runs tests and linters; handles branch, commits and push; you review before a pull request. Max 59 minutes per session; one repository per task; blocked if a ruleset is incompatible (add Copilot as a bypass actor). Owners can disable it per repository. | /copilot/concepts/agents/coding-agent/about-coding-agent |
| Instructions | `.github/copilot-instructions.md` (repo-wide); `.github/instructions/NAME.instructions.md` with `applyTo` globs (path-specific; both apply together); `AGENTS.md` anywhere (nearest wins), or `CLAUDE.md` / `GEMINI.md` in the repo root. Priority: personal, then repository, then organization. `excludeAgent` can exclude `code-review` or `cloud-agent`. | /copilot/how-tos/configure-custom-instructions/add-repository-instructions |
| Skills | Project: `.github/skills`, `.claude/skills`, `.agents/skills`; personal: `~/.copilot/skills`, `~/.agents/skills`. Supported in the cloud agent, code review, Copilot CLI, the Copilot app, and agent mode in VS Code and JetBrains. The page does not name `SKILL.md`. | /copilot/concepts/agents/about-agent-skills |
| MCP | IDEs: `mcp.json`. CLI: local and remote servers, GitHub MCP server built in. GitHub.com: configured per repository, applies to the cloud agent and code review. Orgs control it with the "MCP servers in Copilot" policy (Business and Enterprise only). | /copilot/concepts/context/mcp |
| Hooks | Cloud agent and Copilot CLI. Repo: `.github/hooks/*.json`; personal (CLI): `~/.copilot/hooks/*.json`. Events: sessionStart, sessionEnd, userPromptSubmitted, preToolUse, postToolUse, agentStop, subagentStop, errorOccurred. JSON has `version: 1` and hooks of `type: "command"` with `bash` or `powershell`, optional `cwd`, `env`, `timeoutSec`. Exit-code behavior not stated. | /copilot/concepts/agents/cloud-agent/about-hooks |
| CLI | Install: `npm install -g @github/copilot` (Node 22+), `winget install GitHub.Copilot`, `brew install --cask copilot-cli`, `curl -fsSL https://gh.io/copilot-install \| bash`. Sign in with `/login`, or a fine-grained token with the "Copilot Requests" permission in `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` or `GITHUB_TOKEN` (classic tokens not accepted). `copilot` interactive; `-p` / `--prompt` programmatic. `Shift+Tab` cycles ask/execute and plan mode. `/compact /context /feedback /model /mcp`. Approval flags `--allow-all-tools`, `--allow-tool='TOOL_SPEC'`, `--deny-tool='TOOL_SPEC'` (specs like `shell(COMMAND)`, `write`, or an MCP server name). Run it only in trusted directories. `copilot config [KEY] [VALUE]` with `--global/--repo/--local`. | /copilot/how-tos/set-up/install-copilot-cli, /copilot/concepts/agents/about-copilot-cli, /copilot/reference/cli-command-reference |
| CLI keys | `Ctrl+C` twice to exit; `Ctrl+G` or `Ctrl+X` then `e` edits the prompt externally; `Shift+Enter` or `Alt+Enter` newline; `@ FILE` includes a file; `# NUMBER` adds an issue or pull request; `! COMMAND` runs a shell command; `Ctrl+X` then `h` hides the sessions sidebar. | cli-command-reference |
| IDE keys (VS Code) | Windows/Linux: `Tab` accept, `Esc` dismiss, `Alt+]` next, `Alt+[` previous, `Alt+\` trigger, `Ctrl+Enter` open Copilot; macOS uses `Option` for the Alt keys. VS Code AI features: open Chat `Ctrl+Alt+I` / `Ctrl+Cmd+I`, new chat `Ctrl+N` / `Cmd+N`, inline chat `Ctrl+I` / `Cmd+I`, Quick Chat `Ctrl+Shift+Alt+L` / `Shift+Option+Cmd+L`; slash commands `/plan /explain /fix /tests /doc /new`. | /copilot/reference/keyboard-shortcuts-for-github-copilot-in-the-ide; https://code.visualstudio.com/docs/copilot/reference/copilot-vscode-features |
| Models | Families: OpenAI (GPT-5 and GPT-6), Anthropic (Haiku, Opus, Sonnet, Fable), Google Gemini, Microsoft MAI-Code, Moonshot Kimi K3, xAI Grok. Depends on plan and surface. 1M context in VS Code and Copilot CLI only; reasoning levels in VS Code, CLI and cloud agent; both use more credits. Auto selection exists. Plan-to-model mapping not stated. | /copilot/reference/ai-models/supported-models |
| Data and training | Setting "Allow GitHub to use my data for AI model training" in Copilot settings; **default enabled as of April 24, 2026**; set it to Disabled to opt out. It appears only for Free, Pro, Pro+ and Max; Business and Enterprise data is covered by GitHub's Data Protection Agreement. Retention figures (28 days for CLI, none for IDE Business/Enterprise) come from community posts via search, not GitHub docs: **unverified**. | /copilot/how-tos/manage-your-account/manage-policies |

### Devin Desktop (formerly Windsurf) (checked 2026-10-08, docs.devin.ai/desktop)

| Topic | Finding | Source |
|---|---|---|
| What it is | "a next-generation AI IDE built to keep you in the flow". Formerly Windsurf; repository URLs keep the `windsurf` name, the package is `devin-desktop`. Mac, Windows 10+, Linux (tar, deb, rpm). Setup: theme (optional VS Code or Cursor settings import), sign in with a Devin account or API key, start. Command palette `Cmd+Shift+P` / `Ctrl+Shift+P`. windsurf.com and docs.windsurf.com redirect to devin.ai and docs.devin.ai. | /desktop/getting-started |
| Cascade | Modes: Code ("create and make modifications") and Chat (questions). A background planning agent refines a long-term plan. Tools: Search, Analyze, Web Search, MCP, terminal. Named checkpoints; reverting is currently irreversible. `@` mentions reference past conversations. `Cmd/Ctrl+L` opens Cascade; Enter twice sends a queued message. Terminal approval levels are **not** stated on the page fetched. | /desktop/cascade/cascade |
| Rules | Workspace: `.devin/rules/*.md` (preferred) or `.windsurf/rules/*.md`; legacy `.windsurfrules`; global `~/.codeium/windsurf/memories/global_rules.md`; `AGENTS.md` anywhere. Limits 12,000 characters per workspace rule file and 6,000 for global rules. `trigger`: `always_on`, `model_decision`, `glob`, `manual` (`@rule-name`). Memories live in `~/.codeium/windsurf/memories/` and "do NOT consume credits". | /desktop/cascade/memories |
| Skills and workflows | Skills in `.devin/skills/<name>/` (or `.windsurf/skills/`), global `~/.codeium/windsurf/skills/` or `~/.config/devin/skills/`, also `.agents/skills/` and `.claude/skills/`; `SKILL.md` with `name` and `description`; automatic, or `@skill-name`. Workflows are single `.md` files run with a `/slash-command`. Hooks: not mentioned. | /desktop/cascade/skills |
| MCP | `~/.config/devin/mcp_config.json` (macOS/Linux) or `%APPDATA%\devin\mcp_config.json`; `mcpServers` with `command`, `args`, `env`, optional `disabledTools`. Cascade has no MCP marketplace or one-click install (those are for the Devin Local agent). Limit of 100 tools. Admins: custom registries, allowlist, regex patterns. | /desktop/cascade/mcp |
| Plans | Free $0 ("light quota", limited models); Pro $20 per month (OpenAI, Claude, Gemini and open source models); Max $200; Teams $80 per month plus $40 per seat; Enterprise custom. "Pro and Max include free SWE-2 access through October 16, 2026." Quotas refresh daily or weekly; no exact numbers. | https://devin.ai/pricing |
| Not found | Privacy and training statement, terminal approval levels, hooks, keyboard shortcut list beyond the two above (the terminal and FAQ pages returned 404). | n/a |

### Aider (checked 2026-10-08, aider.chat)

| Topic | Finding | Source |
|---|---|---|
| Install | `python -m pip install aider-install` then `aider-install` (Python 3.8-3.13); `curl -LsSf https://aider.chat/install.sh \| sh`; Windows `powershell -ExecutionPolicy ByPass -c "irm https://aider.chat/install.ps1 \| iex"`; uv, pipx and pip also work. | /docs/install.html |
| Modes | `code`, `ask` ("never make changes"), `architect` (an architect model proposes, an editor model makes the edits), `help`. `/code /ask /architect /help` for one message; `/chat-mode <mode>` or `--chat-mode` to stick. Suggested flow: discuss in ask, then switch to code. | /docs/usage/modes.html |
| Conventions | A markdown file such as `CONVENTIONS.md`, loaded with `/read` or `--read` (read-only, cacheable); persist with `read: CONVENTIONS.md` in `.aider.conf.yml`. No `AGENTS.md` statement found. | /docs/usage/conventions.html |
| Commands | `/add /drop /ls /read-only /context /clear /copy /diff /run (!) /test /lint /git /web /paste /voice /model /editor-model /weak-model /models /reasoning-effort /think-tokens /settings /commit /undo /reset /save /load /map /map-refresh /tokens /multiline-mode /ok /exit /report`. | /docs/usage/commands.html |
| Keys | `Up` history, `Ctrl-R` search history, `Ctrl-C` interrupt. Emacs mode (default): `Ctrl-X Ctrl-E` external editor, `Ctrl-A/E`, `Ctrl-P/N`, `Ctrl-K`. Vi mode with `--vim`. `Meta-Enter` newline; `{` and `}` delimit multiline blocks. | commands page |
| Git | Every edit is committed with a descriptive message (Conventional Commits by default); dirty files are committed first; "(aider)" is appended to author or committer; `/undo`, `/diff`, `/commit`, `/git`; `--attribute-author`, `--attribute-co-authored-by`; `--no-auto-commits`, `--no-dirty-commits`, `--no-git` discouraged. | /docs/git.html |
| Repo map | A concise map of the whole git repository, ranked by a graph algorithm; `--map-tokens` budget defaults to 1k tokens. | /docs/repomap.html |
| Scripting | `--message` / `-m`, `--message-file`, `--yes`, `--auto-commits`, `--dry-run`. The Python API "is not officially supported or documented". | /docs/scripting.html |
| Watch files | `--watch-files`: comments starting or ending with `AI`, `AI!` (make changes) or `AI?` (answer) in any editor; aider removes them after implementing. | /docs/usage/watch.html |
| Models | Providers include OpenAI, Anthropic, Gemini, GROQ, LM Studio, xAI, Azure, Cohere, DeepSeek, Ollama, OpenRouter, GitHub Copilot, Vertex AI, Amazon Bedrock and OpenAI-compatible APIs; `--model`, aliases, keys from env vars, `--api-key` or `.env`. OpenRouter has free models with daily limits. "Models weaker than GPT 3.5 may have problems." The recommended-models list on that page looks dated. | /docs/llms.html |
| Privacy | Analytics are opt-in; "never collects your code, chat messages, keys or personal info"; code goes directly to the LLM provider you configure; `aider --analytics-disable`. | /docs/more/analytics.html |
| Not found | Any official MCP support statement; hooks; a permission model (it edits only files you add and commits to git). | n/a |
