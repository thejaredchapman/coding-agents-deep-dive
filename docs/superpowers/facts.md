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
