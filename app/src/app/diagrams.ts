import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HOOK_STEPS, HookLifecycle } from './hook-lifecycle';
import { TOOLS } from './tools';

// Inline SVG diagrams. Colors come from the theme's CSS variables so they work in light and dark.

@Component({
  selector: 'app-diagram-subagents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 640 270" role="img" aria-labelledby="sa-t sa-d" class="diagram">
      <title id="sa-t">Parallel subagents</title>
      <desc id="sa-d">
        The main agent sends three tasks to three subagents that run in parallel. Each subagent returns a text result to the parent, which combines them.
      </desc>
      <defs>
        <marker id="sa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" class="arrowhead" />
        </marker>
      </defs>
      <rect x="20" y="90" width="150" height="70" rx="10" class="box accent" />
      <text x="95" y="120" class="label strong on">Main agent</text>
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
    <figure class="stepper">
      <svg viewBox="0 0 700 250" role="img" aria-labelledby="hk-t hk-d" class="diagram">
        <title id="hk-t">Hook lifecycle, interactive</title>
        <desc id="hk-d">
          A session starts, you submit a prompt, then for each tool call PreToolUse runs, the tool runs, and PostToolUse runs. When the agent finishes the turn, Stop runs. Use the controls below to step through. A hook that exits with code 2 at PreToolUse blocks the tool call.
        </desc>
        <defs>
          <marker id="hk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" class="arrowhead" />
          </marker>
        </defs>
        <path d="M122 47 L 145 47 M257 47 L 280 47 M392 47 L 415 47 M527 47 L 550 47" class="line" marker-end="url(#hk-arrow)" />
        <path d="M580 74 C 580 140, 336 140, 336 80" class="line dashed" marker-end="url(#hk-arrow)" />
        <text x="458" y="132" class="label small">repeat for each tool call</text>
        <path d="M640 74 L 640 168" class="line" marker-end="url(#hk-arrow)" />
        <text x="630" y="125" class="label small right">turn ends</text>
        @for (s of boxes; track s.id) {
          <g class="node" [class]="'node ' + life.stateOf(s.id)">
            <rect [attr.x]="s.x" [attr.y]="s.y" width="112" height="54" rx="3" class="box" />
            <text [attr.x]="s.x + 56" [attr.y]="s.y + 23" class="label strong tight">{{ s.label }}</text>
            <text [attr.x]="s.x + 56" [attr.y]="s.y + 41" class="label small">{{ s.note }}</text>
          </g>
        }
        @if (life.blocked() && life.stateOf('PreToolUse') !== 'todo') {
          <text x="336" y="14" class="label danger">✕ exit code 2: blocked</text>
        }
      </svg>

      <p class="caption" aria-live="polite"><strong>{{ life.activeStep().label }}.</strong> {{ life.caption() }}</p>

      <div class="stepper-controls">
        <button type="button" (click)="life.prev(); stop()" [disabled]="life.atStart()">← Back</button>
        <button type="button" (click)="life.next(); stop()" [disabled]="life.atEnd()">Step →</button>
        <button type="button" (click)="togglePlay()" [attr.aria-pressed]="playing()">{{ playing() ? 'Pause' : 'Play' }}</button>
        <button type="button" (click)="restart()">Restart</button>
        <label class="check">
          <input type="checkbox" [checked]="life.blocked()" (change)="life.setBlocked($any($event.target).checked)" />
          <span>Hook exits with code 2 at PreToolUse</span>
        </label>
      </div>
    </figure>
  `,
})
export class DiagramHooks {
  protected readonly life = new HookLifecycle();
  protected readonly playing = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly boxes = HOOK_STEPS.map((s) => ({
    ...s,
    ...({ SessionStart: { x: 10, y: 20 }, UserPromptSubmit: { x: 145, y: 20 }, PreToolUse: { x: 280, y: 20 }, Tool: { x: 415, y: 20 }, PostToolUse: { x: 550, y: 20 }, Stop: { x: 550, y: 170 } } as const)[s.id],
  }));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected togglePlay(): void {
    if (this.playing()) return this.stop();
    if (this.life.atEnd()) this.life.reset();
    this.playing.set(true);
    this.timer = setInterval(() => {
      if (this.life.atEnd()) return this.stop();
      this.life.next();
    }, 1500);
  }

  protected restart(): void {
    this.stop();
    this.life.reset();
  }

  protected stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.playing.set(false);
  }
}

@Component({
  selector: 'app-diagram-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 640 330" role="img" aria-labelledby="fl-t fl-d" class="diagram">
      <title id="fl-t">The five extension points working together</title>
      <desc id="fl-d">
        An instructions file sets standing rules. A skill is invoked, the agent calls an MCP tool, a PostToolUse hook logs the call, the agent spawns a subagent, and when the turn ends a Stop hook logs cost and tokens.
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
    { y: 10, name: 'Instructions file', what: 'standing rules, always active' },
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
      @for (c of tools; track c.id; let ci = $index) {
        <text [attr.x]="230 + ci * 105" y="22" [class]="'label strong t-' + c.id">{{ c.glyph }} {{ c.name }}</text>
      }
      @for (r of rows; track r; let ri = $index) {
        <text x="20" [attr.y]="58 + ri * 36" class="label left">{{ r }}</text>
        <line x1="20" x2="620" [attr.y1]="42 + ri * 36" [attr.y2]="42 + ri * 36" class="grid" />
        @for (c of tools; track c.id; let ci = $index) {
          <circle [attr.cx]="230 + ci * 105" [attr.cy]="54 + ri * 36" r="9" [class]="'dot t-' + c.id" />
        }
      }
    </svg>
  `,
})
export class DiagramEcosystem {
  /** The five-ideas grid is a claim about these four agents only; Copilot, Devin Desktop and Aider do not have all five. */
  protected readonly tools = TOOLS.filter((t) => ['claude', 'codex', 'cursor', 'gemini'].includes(t.id));
  protected readonly rows = ['Instructions file', 'Subagents', 'Skills', 'MCP', 'Hooks'];
}

export const DIAGRAMS = [DiagramSubagents, DiagramHooks, DiagramFlow, DiagramEcosystem];
