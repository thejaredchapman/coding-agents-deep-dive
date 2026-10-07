import { ChangeDetectionStrategy, Component } from '@angular/core';

// Inline SVG diagrams. Colors come from the theme's CSS variables so they work in light and dark.

@Component({
  selector: 'app-diagram-subagents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 640 270" role="img" aria-labelledby="sa-t sa-d" class="diagram">
      <title id="sa-t">Parallel subagents</title>
      <desc id="sa-d">
        Main Claude sends three tasks to three subagents that run in parallel. Each subagent returns a text result to the parent, which combines them.
      </desc>
      <defs>
        <marker id="sa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" class="arrowhead" />
        </marker>
      </defs>
      <rect x="20" y="90" width="150" height="70" rx="10" class="box accent" />
      <text x="95" y="120" class="label strong on">Main Claude</text>
      <text x="95" y="141" class="label small on">parent session</text>
      @for (t of tasks; track t.y) {
        <path [attr.d]="'M170 125 C 250 125, 250 ' + (t.y + 28) + ', 330 ' + (t.y + 28)" class="line" marker-end="url(#sa-arrow)" />
        <rect x="330" [attr.y]="t.y" width="170" height="56" rx="10" class="box" />
        <text x="415" [attr.y]="t.y + 24" class="label strong">{{ t.name }}</text>
        <text x="415" [attr.y]="t.y + 43" class="label small">{{ t.task }}</text>
        <path [attr.d]="'M500 ' + (t.y + 28) + ' L 545 ' + (t.y + 28)" class="line dashed" />
      }
      <path d="M545 48 L 545 232 L 95 232 L 95 164" class="line dashed" marker-end="url(#sa-arrow)" />
      <text x="320" y="252" class="label small">each result comes back to the parent, which combines them</text>
    </svg>
  `,
})
export class DiagramSubagents {
  protected readonly tasks = [
    { y: 20, name: 'Subagent A', task: 'audit auth' },
    { y: 97, name: 'Subagent B', task: 'tests for payments' },
    { y: 174, name: 'Subagent C', task: 'migration docs' },
  ];
}

@Component({
  selector: 'app-diagram-hooks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 700 240" role="img" aria-labelledby="hk-t hk-d" class="diagram">
      <title id="hk-t">Hook lifecycle</title>
      <desc id="hk-d">
        A session starts, you submit a prompt, then for each tool call PreToolUse runs, the tool runs, and PostToolUse runs. The loop repeats for each tool call until Claude finishes the turn, then Stop runs. PreToolUse can block a call with exit code 2.
      </desc>
      <defs>
        <marker id="hk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" class="arrowhead" />
        </marker>
      </defs>
      @for (s of steps; track s.x; let i = $index) {
        <rect [attr.x]="s.x" y="20" width="112" height="54" rx="10" class="box" [class.accent]="s.hook" />
        <text [attr.x]="s.x + 56" y="43" class="label strong tight" [class.on]="s.hook">{{ s.a }}</text>
        <text [attr.x]="s.x + 56" y="61" class="label small" [class.on]="s.hook">{{ s.b }}</text>
        @if (i < steps.length - 1) {
          <path [attr.d]="'M' + (s.x + 112) + ' 47 L ' + (s.x + 135) + ' 47'" class="line" marker-end="url(#hk-arrow)" />
        }
      }
      <path d="M580 74 C 580 140, 336 140, 336 80" class="line dashed" marker-end="url(#hk-arrow)" />
      <text x="458" y="132" class="label small">repeat for each tool call</text>
      <path d="M640 74 L 640 168" class="line" marker-end="url(#hk-arrow)" />
      <text x="650" y="125" class="label small left">turn ends</text>
      <rect x="560" y="170" width="112" height="54" rx="10" class="box accent" />
      <text x="616" y="193" class="label strong on">Stop</text>
      <text x="616" y="211" class="label small on">turn finished</text>
      <text x="10" y="196" class="label small left">Exit code 2 from PreToolUse</text>
      <text x="10" y="212" class="label small left">blocks the tool call.</text>
    </svg>
  `,
})
export class DiagramHooks {
  protected readonly steps = [
    { x: 10, a: 'SessionStart', b: 'session begins', hook: true },
    { x: 145, a: 'UserPromptSubmit', b: 'you send a prompt', hook: true },
    { x: 280, a: 'PreToolUse', b: 'can block', hook: true },
    { x: 415, a: 'Tool runs', b: 'Bash, Edit, MCP', hook: false },
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
        <text x="170" [attr.y]="s.y + 25" class="label strong left" [class.on]="i % 2 === 0">{{ s.name }}</text>
        <text x="470" [attr.y]="s.y + 25" class="label small right" [class.on]="i % 2 === 0">{{ s.what }}</text>
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
