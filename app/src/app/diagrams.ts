import { ChangeDetectionStrategy, Component } from '@angular/core';

// Inline SVG diagrams. Colors come from the theme's CSS variables so they work in light and dark.

@Component({
  selector: 'app-diagram-subagents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 640 260" role="img" aria-labelledby="sa-t sa-d" class="diagram">
      <title id="sa-t">Parallel subagents</title>
      <desc id="sa-d">
        Main Claude sends three tasks to three subagents that run in parallel. Each subagent returns a text result to the parent, which combines them.
      </desc>
      <defs>
        <marker id="sa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" class="arrowhead" />
        </marker>
      </defs>
      <rect x="20" y="95" width="150" height="70" rx="10" class="box accent" />
      <text x="95" y="125" class="label strong">Main Claude</text>
      <text x="95" y="146" class="label small">parent session</text>
      @for (t of tasks; track t.y) {
        <path [attr.d]="'M170 130 C 250 130, 250 ' + (t.y + 28) + ', 330 ' + (t.y + 28)" class="line" marker-end="url(#sa-arrow)" />
        <rect x="330" [attr.y]="t.y" width="170" height="56" rx="10" class="box" />
        <text x="415" [attr.y]="t.y + 24" class="label strong">{{ t.name }}</text>
        <text x="415" [attr.y]="t.y + 43" class="label small">{{ t.task }}</text>
        <path [attr.d]="'M500 ' + (t.y + 28) + ' L 560 ' + (t.y + 28) + ' L 560 130 L 530 130'" class="line dashed" marker-end="url(#sa-arrow)" />
      }
      <text x="590" y="122" class="label small">results</text>
      <text x="590" y="138" class="label small">come back</text>
    </svg>
  `,
})
export class DiagramSubagents {
  protected readonly tasks = [
    { y: 20, name: 'Subagent A', task: 'audit auth' },
    { y: 102, name: 'Subagent B', task: 'tests for payments' },
    { y: 184, name: 'Subagent C', task: 'migration docs' },
  ];
}

@Component({
  selector: 'app-diagram-hooks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 640 250" role="img" aria-labelledby="hk-t hk-d" class="diagram">
      <title id="hk-t">Hook lifecycle</title>
      <desc id="hk-d">
        A session starts, you submit a prompt, then for each tool call PreToolUse runs, the tool runs, and PostToolUse runs. The loop repeats until Claude finishes, then Stop runs and the session ends. PreToolUse can block a call with exit code 2.
      </desc>
      <defs>
        <marker id="hk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" class="arrowhead" />
        </marker>
      </defs>
      @for (s of steps; track s.x) {
        <rect [attr.x]="s.x" y="30" width="108" height="52" rx="10" class="box" [class.accent]="s.hook" />
        <text [attr.x]="s.x + 54" y="52" class="label strong">{{ s.a }}</text>
        <text [attr.x]="s.x + 54" y="70" class="label small">{{ s.b }}</text>
      }
      <path d="M128 56 L 140 56" class="line" marker-end="url(#hk-arrow)" />
      <path d="M268 56 L 280 56" class="line" marker-end="url(#hk-arrow)" />
      <path d="M408 56 L 420 56" class="line" marker-end="url(#hk-arrow)" />
      <path d="M548 56 L 560 56" class="line" marker-end="url(#hk-arrow)" />
      <path d="M474 82 C 474 150, 280 150, 280 90" class="line dashed" marker-end="url(#hk-arrow)" />
      <text x="378" y="150" class="label small">repeat for each tool call</text>
      <rect x="250" y="176" width="140" height="46" rx="10" class="box accent" />
      <text x="320" y="196" class="label strong">Stop</text>
      <text x="320" y="212" class="label small">Claude finished the turn</text>
      <path d="M474 82 C 520 130, 430 200, 392 199" class="line dashed" marker-end="url(#hk-arrow)" />
      <text x="20" y="130" class="label small left">Exit code 2 on PreToolUse</text>
      <text x="20" y="146" class="label small left">blocks the tool call.</text>
      <path d="M150 124 C 160 100, 200 92, 214 86" class="line dashed" marker-end="url(#hk-arrow)" />
    </svg>
  `,
})
export class DiagramHooks {
  protected readonly steps = [
    { x: 20, a: 'SessionStart', b: 'session begins', hook: true },
    { x: 150, a: 'UserPromptSubmit', b: 'you send a prompt', hook: true },
    { x: 280, a: 'PreToolUse', b: 'can block', hook: true },
    { x: 420, a: 'Tool runs', b: 'Bash, Edit, MCP…', hook: false },
    { x: 550, a: 'PostToolUse', b: 'after success', hook: true },
  ];
}

@Component({
  selector: 'app-diagram-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 640 330" role="img" aria-labelledby="fl-t fl-d" class="diagram">
      <title id="fl-t">The five extension points working together</title>
      <desc id="fl-d">
        CLAUDE.md sets standing rules. A skill is invoked, Claude calls an MCP tool, a PostToolUse hook logs the call, Claude spawns a subagent, and when the turn ends a Stop hook logs cost and tokens.
      </desc>
      <defs>
        <marker id="fl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" class="arrowhead" />
        </marker>
      </defs>
      @for (s of steps; track s.y; let i = $index) {
        <rect x="150" [attr.y]="s.y" width="340" height="40" rx="10" class="box" [class.accent]="i % 2 === 0" />
        <text x="170" [attr.y]="s.y + 25" class="label strong left">{{ s.name }}</text>
        <text x="480" [attr.y]="s.y + 25" class="label small right">{{ s.what }}</text>
        @if (i < steps.length - 1) {
          <path [attr.d]="'M320 ' + (s.y + 40) + ' L 320 ' + (s.y + 50)" class="line" marker-end="url(#fl-arrow)" />
        }
      }
    </svg>
  `,
})
export class DiagramFlow {
  protected readonly steps = [
    { y: 10, name: 'CLAUDE.md', what: 'standing rules, always active' },
    { y: 60, name: 'Skill', what: '/deploy-check is invoked' },
    { y: 110, name: 'MCP tool', what: 'github: list PRs' },
    { y: 160, name: 'PostToolUse hook', what: 'logs the call' },
    { y: 210, name: 'Subagent', what: 'reviews the PR in isolation' },
    { y: 260, name: 'Stop hook', what: 'logs cost and tokens' },
  ];
}

@Component({
  selector: 'app-diagram-ecosystem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 640 230" role="img" aria-labelledby="ec-t ec-d" class="diagram">
      <title id="ec-t">Five extension points across four coding agents</title>
      <desc id="ec-d">
        A grid with five rows (instructions, subagents, skills, MCP, hooks) and four columns (Claude Code, Codex, Cursor, Gemini CLI). Every cell is marked: all four tools have all five ideas, with different file names and formats.
      </desc>
      @for (c of tools; track c; let ci = $index) {
        <text [attr.x]="230 + ci * 105" y="22" class="label strong">{{ c }}</text>
      }
      @for (r of rows; track r; let ri = $index) {
        <text x="20" [attr.y]="58 + ri * 36" class="label left">{{ r }}</text>
        <line x1="20" x2="620" [attr.y1]="42 + ri * 36" [attr.y2]="42 + ri * 36" class="grid" />
        @for (c of tools; track c; let ci = $index) {
          <circle [attr.cx]="230 + ci * 105" [attr.cy]="54 + ri * 36" r="9" class="dot" />
        }
      }
    </svg>
  `,
})
export class DiagramEcosystem {
  protected readonly tools = ['Claude Code', 'Codex', 'Cursor', 'Gemini CLI'];
  protected readonly rows = ['Instructions file', 'Subagents', 'Skills', 'MCP', 'Hooks'];
}

export const DIAGRAMS = [DiagramSubagents, DiagramHooks, DiagramFlow, DiagramEcosystem];
