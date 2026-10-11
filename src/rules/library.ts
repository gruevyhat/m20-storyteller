// Bring-your-own rules search. The user loads markdown they own (e.g. text extracted from
// their own rulebook PDFs). It is indexed and stored only in this browser; nothing is uploaded
// and no rulebook text ships with the app.
import MiniSearch from 'minisearch';
import { del, get, set } from 'idb-keyval';

export interface Section {
  id: string;
  book: string;
  path: string[]; // heading trail
  heading: string;
  text: string;
}

export interface Library {
  books: { name: string; sections: number; chars: number }[];
  sections: Section[];
}

const KEY = 'rules-library';
const MAX_CHUNK = 4000;

/** Obsidian block anchors ("^orphans") at the end of a line or on a line of their own. */
const stripAnchors = (s: string) => s.replace(/(^|[ \t])\^[A-Za-z0-9-]+[ \t]*$/gm, '').replace(/\n{3,}/g, '\n\n');

const clean = (s: string) =>
  stripAnchors(s)
    .replace(/\[([^\]]+)\]\([^)\s]*#[^)]*\)/g, '$1') // links to headings or anchors, in this book or another
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*|__/g, '')
    .trim();

export function chunkMarkdown(markdown: string, book: string): Section[] {
  const out: Section[] = [];
  const trail: string[] = [];
  let buf: string[] = [];
  let n = 0;
  const flush = () => {
    const text = clean(buf.join('\n'));
    buf = [];
    if (text.length < 40) return;
    for (let i = 0; i < text.length; i += MAX_CHUNK) {
      out.push({ id: `${book}#${n++}`, book, path: [...trail], heading: trail[trail.length - 1] ?? book, text: text.slice(i, i + MAX_CHUNK) });
    }
  };
  for (const line of markdown.split('\n')) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      const depth = h[1].length;
      trail.length = Math.min(trail.length, depth - 1);
      while (trail.length < depth - 1) trail.push('');
      trail.push(clean(h[2]));
      continue;
    }
    buf.push(line);
  }
  flush();
  for (const s of out) s.path = s.path.filter(Boolean);
  return out;
}

export function buildIndex(sections: Section[]) {
  const index = new MiniSearch<Section>({
    fields: ['heading', 'text'],
    storeFields: ['book', 'path', 'heading', 'text'],
    searchOptions: { boost: { heading: 3 }, prefix: true, fuzzy: 0.15, combineWith: 'AND' },
  });
  index.addAll(sections);
  return index;
}

export async function loadLibrary(): Promise<Library> {
  const lib = (await get<Library>(KEY).catch(() => undefined)) ?? { books: [], sections: [] };
  // Books loaded before anchors were stripped at import still carry them.
  const tidy = (t: string) => clean(t);
  return { ...lib, sections: lib.sections.map((x) => ({ ...x, heading: tidy(x.heading), path: x.path.map(tidy), text: tidy(x.text) })) };
}

export async function addBook(lib: Library, name: string, markdown: string): Promise<Library> {
  const sections = chunkMarkdown(markdown, name);
  const next: Library = {
    books: [...lib.books.filter((b) => b.name !== name), { name, sections: sections.length, chars: markdown.length }],
    sections: [...lib.sections.filter((s) => s.book !== name), ...sections],
  };
  await set(KEY, next);
  return next;
}

export async function removeBook(lib: Library, name: string): Promise<Library> {
  const next: Library = { books: lib.books.filter((b) => b.name !== name), sections: lib.sections.filter((s) => s.book !== name) };
  if (next.books.length) await set(KEY, next);
  else await del(KEY);
  return next;
}

/** A short window of text around the first matching term. */
export function snippet(text: string, terms: string[], width = 320) {
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t.toLowerCase());
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  const start = Math.max(0, at - width / 3);
  return (start > 0 ? '…' : '') + text.slice(start, start + width).trim() + (start + width < text.length ? '…' : '');
}
