import { useEffect, useMemo, useState } from 'react';
import { addBook, buildIndex, loadLibrary, removeBook, snippet, type Library } from '../rules/library';

export default function RulesPage() {
  const [lib, setLib] = useState<Library | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    loadLibrary().then(setLib);
  }, []);

  const index = useMemo(() => (lib && lib.sections.length ? buildIndex(lib.sections) : null), [lib]);
  const results = useMemo(() => (index && query.trim().length > 1 ? index.search(query).slice(0, 40) : []), [index, query]);
  const terms = query.split(/\s+/).filter(Boolean);

  async function onFiles(files: FileList | null) {
    if (!files || !lib) return;
    let next = lib;
    for (const f of Array.from(files)) {
      setBusy(`Indexing ${f.name}…`);
      next = await addBook(next, f.name.replace(/\.(md|markdown|txt)$/i, ''), await f.text());
    }
    setLib(next);
    setBusy('');
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="panel flex h-fit flex-col gap-3">
        <h2 className="h-section">Your books</h2>
        <p className="text-xs text-muted">
          Load markdown or text you own, such as text extracted from your own PDFs. It's indexed and kept only in this browser. Nothing is uploaded, and no rulebook text
          ships with this app.
        </p>
        <label className="btn cursor-pointer">
          Add files…
          <input type="file" accept=".md,.markdown,.txt" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        </label>
        {busy && <p className="text-sm text-brass">{busy}</p>}
        <ul className="flex flex-col gap-1 text-sm">
          {lib?.books.map((b) => (
            <li key={b.name} className="flex items-center justify-between gap-2">
              <span className="truncate" title={b.name}>
                {b.name}
                <span className="text-xs text-muted"> · {b.sections} sections</span>
              </span>
              <button className="btn-ghost" onClick={async () => setLib(await removeBook(lib, b.name))} aria-label={`Remove ${b.name}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex flex-col gap-3">
        <input
          type="search"
          className="px-2 py-1"
          placeholder={index ? 'Search: botch ritual, Paradox spirit, Correspondence range…' : 'Add a book to search'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!index}
          autoFocus
        />
        {query.trim().length > 1 && <p className="text-sm text-muted">{results.length ? `${results.length} sections` : 'No matches.'}</p>}
        <ol className="flex flex-col gap-3">
          {results.map((r) => {
            const isOpen = open === r.id;
            return (
              <li key={r.id} className="panel py-2">
                <button className="w-full text-left" onClick={() => setOpen(isOpen ? null : String(r.id))} aria-expanded={isOpen}>
                  <div className="text-xs text-muted">
                    {r.book}
                    {r.path.length > 1 && ` › ${r.path.slice(0, -1).join(' › ')}`}
                  </div>
                  <div className="font-display text-lg leading-tight text-brass-bright">{r.heading}</div>
                </button>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-parchment/90">{isOpen ? r.text : snippet(r.text, terms)}</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
