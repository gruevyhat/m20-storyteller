// The look picker and text box for a text handout, used for drafts and for saved handouts.
import { HANDOUT_TEMPLATES, type HandoutStyle } from '../handouts/templates';
import type { Handout } from '../model/types';

export function HandoutEditor({ h, onChange, rows = 10 }: { h: Pick<Handout, 'style' | 'text'>; onChange: (p: Partial<Handout>) => void; rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted">Look</span>
        <select value={h.style ?? ''} onChange={(e) => onChange({ style: (e.target.value || undefined) as HandoutStyle | undefined })}>
          <option value="">Plain</option>
          {HANDOUT_TEMPLATES.map((t) => (
            <option key={t.style} value={t.style}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <textarea rows={rows} value={h.text ?? ''} onChange={(e) => onChange({ text: e.target.value })} aria-label="Handout text" className="font-mono text-sm" />
      <p className="text-xs leading-relaxed text-muted">
        <code># Heading</code> for a headline or name · <code>Label: value</code> for form fields, or sender and message in text messages · <code>[[secret]]</code> is
        blacked out for players · <code>---</code> draws a line.
      </p>
    </div>
  );
}
