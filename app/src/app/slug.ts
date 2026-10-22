/** Lowercase, hyphen-separated, ASCII-only. Used for the file-path style breadcrumb. */
export function slug(text: string, max = 48): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
  return s || 'untitled';
}

/** A path such as ~/deep-dive/05-hooks/what-are-hooks.md for a slide. */
export function slidePath(section: string, title: string): string {
  const numbered = /^(\d+)\.\s*(.*)$/.exec(section);
  const dir = numbered ? `${numbered[1].padStart(2, '0')}-${slug(numbered[2])}` : slug(section);
  return `~/deep-dive/${dir}/${slug(title)}.md`;
}
