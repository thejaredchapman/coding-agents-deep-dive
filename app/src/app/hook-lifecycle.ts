import { computed, signal } from '@angular/core';

export interface HookStep {
  id: 'SessionStart' | 'UserPromptSubmit' | 'PreToolUse' | 'Tool' | 'PostToolUse' | 'Stop';
  label: string;
  note: string;
  caption: string;
  /** True for steps that are hooks you can configure, false for the tool itself. */
  hook: boolean;
}

export const HOOK_STEPS: readonly HookStep[] = [
  { id: 'SessionStart', label: 'SessionStart', note: 'session begins', hook: true,
    caption: 'A session begins or resumes. Use it to load project context or check the environment.' },
  { id: 'UserPromptSubmit', label: 'UserPromptSubmit', note: 'you send a prompt', hook: true,
    caption: 'You send a prompt, before the agent sees it. Validate or enrich it, or block it.' },
  { id: 'PreToolUse', label: 'PreToolUse', note: 'can block', hook: true,
    caption: 'Before a tool runs. Block dangerous commands with exit code 2, rewrite the input, or log it.' },
  { id: 'Tool', label: 'Tool runs', note: 'Bash, Edit, MCP', hook: false,
    caption: 'The tool runs: Bash, Edit, Write, or an MCP tool.' },
  { id: 'PostToolUse', label: 'PostToolUse', note: 'after success', hook: true,
    caption: 'After the tool succeeds. Run a formatter or linter, or update a tracker. The change has already happened.' },
  { id: 'Stop', label: 'Stop', note: 'turn finished', hook: true,
    caption: 'The agent finishes the turn. Log cost and tokens, send a notification, or trigger CI.' },
];

const BLOCKED_CAPTION =
  'Your hook exits with code 2, so the tool call is blocked. Its message goes back to the agent, which can try another approach. The tool and PostToolUse are skipped.';

export type StepState = 'done' | 'active' | 'todo' | 'skipped';

/** State for the interactive hook lifecycle: a walk through the events, with an optional block. */
export class HookLifecycle {
  readonly steps = HOOK_STEPS;
  private readonly pos = signal(0);
  readonly blocked = signal(false);

  readonly pathIds = computed<string[]>(() =>
    this.steps.filter((s) => !(this.blocked() && (s.id === 'Tool' || s.id === 'PostToolUse'))).map((s) => s.id),
  );
  readonly activeStep = computed(() => this.steps.find((s) => s.id === this.pathIds()[this.pos()])!);
  readonly atEnd = computed(() => this.pos() >= this.pathIds().length - 1);
  readonly atStart = computed(() => this.pos() === 0);
  readonly caption = computed(() =>
    this.blocked() && this.activeStep().id === 'PreToolUse' ? BLOCKED_CAPTION : this.activeStep().caption,
  );

  stateOf(id: string): StepState {
    const path = this.pathIds();
    const at = path.indexOf(id);
    if (at === -1) return 'skipped';
    if (at < this.pos()) return 'done';
    return at === this.pos() ? 'active' : 'todo';
  }

  next(): void {
    this.pos.update((p) => Math.min(p + 1, this.pathIds().length - 1));
  }

  prev(): void {
    this.pos.update((p) => Math.max(p - 1, 0));
  }

  reset(): void {
    this.pos.set(0);
  }

  setBlocked(blocked: boolean): void {
    const currentId = this.activeStep().id;
    this.blocked.set(blocked);
    // Stay on the same step if it still exists on the new path; otherwise clamp.
    const at = this.pathIds().indexOf(currentId);
    this.pos.set(at === -1 ? Math.min(this.pos(), this.pathIds().length - 1) : at);
  }
}
