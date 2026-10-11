import { useState } from 'react';
import { characterMarkdown, download, fileSlug } from '../export/markdown';
import { chronicleTitle, type Character } from '../model/types';
import { useChronicle } from '../store/chronicle';

/** Download a character as an Obsidian statblock note or as a printable sheet. */
export function ExportMenu({ c }: { c: Character }) {
  const [busy, setBusy] = useState(false);
  const { chronicle } = useChronicle();
  return (
    <span className="flex items-center gap-1">
      <span className="label">Export</span>
      <button className="btn" onClick={() => download(`${fileSlug(c)}.md`, characterMarkdown(c), 'text/markdown')}>
        Markdown
      </button>
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const { downloadPdf } = await import('../export/pdf');
            await downloadPdf(c, `${fileSlug(c)}.pdf`, { chronicle: chronicleTitle(chronicle) });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Drawing…' : 'PDF sheet'}
      </button>
    </span>
  );
}
