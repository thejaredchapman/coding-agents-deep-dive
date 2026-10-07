import { TOOLS, ToolId, toolFromHeader } from './tools';

/**
 * Marks tool columns (data-t) so the stylesheet can highlight the reader's tool, and adds compare
 * controls (show/hide columns, filter rows) to tables that compare three or more tools.
 * Safe to call repeatedly on the same content.
 */
export function enhanceTables(root: HTMLElement): void {
  root.querySelectorAll('table').forEach((table) => {
    const wrap = wrapTable(table);
    table.querySelectorAll('td code, th code').forEach(addSoftBreaks);
    if (table.hasAttribute('data-enhanced')) return;
    const headerCells = Array.from(table.querySelectorAll('thead th'));
    const columnTools = headerCells.map((th) => toolFromHeader(th.textContent ?? ''));
    const toolColumns = columnTools.filter((t): t is ToolId => t !== null);
    if (toolColumns.length === 0) return;
    table.setAttribute('data-enhanced', '');

    const tag = (cell: Element | undefined, tool: ToolId | null) => {
      if (cell && tool) {
        cell.setAttribute('data-t', tool);
        cell.classList.add('tc');
      }
    };
    headerCells.forEach((th, i) => tag(th, columnTools[i]));
    table.querySelectorAll('tbody tr').forEach((row) => {
      columnTools.forEach((tool, i) => tag(row.children[i], tool));
    });

    if (toolColumns.length >= 3) wrap.before(buildControls(table, toolColumns));
  });
}

function buildControls(table: HTMLTableElement, tools: ToolId[]): HTMLElement {
  const box = document.createElement('fieldset');
  box.className = 'table-tools';
  const legend = document.createElement('legend');
  legend.textContent = 'Compare';
  box.appendChild(legend);

  const setColumn = (tool: ToolId, visible: boolean) => {
    table.querySelectorAll(`[data-t="${tool}"]`).forEach((cell) => cell.classList.toggle('col-hidden', !visible));
  };

  for (const id of tools) {
    const info = TOOLS.find((t) => t.id === id)!;
    const label = document.createElement('label');
    label.className = 'chip';
    label.dataset['t'] = id;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.dataset['t'] = id;
    input.addEventListener('change', () => {
      const boxes = Array.from(box.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
      if (boxes.every((b) => !b.checked)) input.checked = true; // always keep one column
      setColumn(id, input.checked);
    });
    const text = document.createElement('span');
    text.textContent = `${info.glyph} ${info.name}`;
    label.append(input, text);
    box.appendChild(label);
  }

  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Filter rows';
  search.setAttribute('aria-label', 'Filter rows');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    table.querySelectorAll<HTMLElement>('tbody tr').forEach((row) => {
      row.hidden = q !== '' && !(row.textContent ?? '').toLowerCase().includes(q);
    });
  });
  box.appendChild(search);
  return box;
}

/** Puts the table in a keyboard-scrollable region so a wide table scrolls inside the slide, not the page. */
function wrapTable(table: HTMLTableElement): HTMLElement {
  const existing = table.parentElement;
  if (existing?.classList.contains('table-wrap')) return existing;
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Table. Scroll sideways if it is wider than the screen.');
  table.replaceWith(wrap);
  wrap.appendChild(table);
  return wrap;
}

/** Lets long paths such as .cursor/rules/*.mdc wrap at natural points instead of in the middle of a word. */
function addSoftBreaks(code: Element): void {
  if (code.hasAttribute('data-wbr') || code.children.length > 0) return;
  code.setAttribute('data-wbr', '');
  // Break after / _ - and after a dot that follows a letter or digit, so .claude and *.md stay whole.
  const parts = (code.textContent ?? '').split(/(?<=[/_-]|[A-Za-z0-9]\.)/);
  if (parts.length < 2) return;
  code.textContent = '';
  parts.forEach((part, i) => {
    if (i > 0) code.appendChild(document.createElement('wbr'));
    code.appendChild(document.createTextNode(part));
  });
}
