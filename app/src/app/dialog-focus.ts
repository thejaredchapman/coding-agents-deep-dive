import { DestroyRef, inject } from '@angular/core';

/**
 * Call from a dialog component's constructor. Remembers what had focus, and gives it back when the
 * dialog is destroyed. Returns a keydown handler that keeps Tab inside the dialog.
 */
export function useDialogFocus(): (event: KeyboardEvent, dialog: HTMLElement) => void {
  const previous = document.activeElement as HTMLElement | null;
  inject(DestroyRef).onDestroy(() => previous?.focus?.());

  return (event, dialog) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
