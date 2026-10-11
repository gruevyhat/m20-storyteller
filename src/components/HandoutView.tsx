// Renders a text handout in its template's look. All sizes are in em, so the same markup works as
// a small preview card and full size on the player screen: set the font size on the wrapper.
import type { CSSProperties } from 'react';
import { parseLines, type HandoutStyle, type Line } from '../handouts/templates';

interface Look {
  box: string;
  heading: string;
  text: string;
  field?: string;
  label?: string;
  rule?: string;
  /** Whether "Label: value" lines are fields; prose styles keep colons as plain text. */
  fields: boolean;
}

const LOOKS: Record<HandoutStyle, Look> = {
  letter: {
    box: 'bg-[#efe6d0] text-[#2b2118] font-hand px-[1.6em] py-[1.4em] shadow-[inset_0_0_3em_rgba(120,90,40,0.35)]',
    heading: 'text-[1.5em] mb-[0.3em]',
    text: 'text-[1.35em] leading-[1.25]',
    fields: false,
  },
  telegram: {
    box: 'bg-[#e9dfb4] text-[#1d1a12] font-type uppercase px-[1.4em] py-[1.2em] border-t-[0.5em] border-[#b0892f]',
    heading: 'text-[0.85em] tracking-[0.3em] text-center border-b border-[#1d1a12]/40 pb-[0.4em] mb-[0.6em]',
    text: 'text-[1.05em] leading-[1.5] tracking-wide',
    field: 'text-[0.85em] leading-[1.5]',
    label: 'mr-[0.5em] opacity-70',
    fields: true,
  },
  newspaper: {
    box: 'bg-[#e6e1d3] text-[#1a1a1a] font-display px-[1.4em] py-[1.2em]',
    heading: 'font-sans font-bold text-[1.9em] leading-[1.05] uppercase tracking-tight border-b-2 border-[#1a1a1a] pb-[0.2em] mb-[0.4em]',
    text: 'text-[1.08em] leading-[1.3] text-justify',
    fields: false,
  },
  report: {
    box: 'bg-[#f2f0e8] text-[#1c1c22] font-type px-[1.4em] py-[1.2em] border border-[#6b7a8c]',
    heading: 'font-sans font-semibold uppercase tracking-[0.25em] text-[0.95em] text-[#33445a] border-b-2 border-[#33445a] pb-[0.3em] mb-[0.5em]',
    text: 'text-[1em] leading-[1.4]',
    field: 'grid grid-cols-[8em_1fr] gap-x-[0.8em] border-b border-dotted border-[#6b7a8c] py-[0.3em] text-[1em] leading-[1.4]',
    label: 'font-sans text-[0.75em] uppercase tracking-wider text-[#33445a] pt-[0.25em]',
    fields: true,
  },
  memo: {
    box: 'relative bg-white text-[#141414] font-type px-[1.6em] py-[1.4em] border border-[#bbb]',
    heading: 'font-sans font-bold uppercase tracking-[0.2em] text-[1.05em] mb-[0.6em]',
    text: 'text-[1em] leading-[1.45]',
    field: 'grid grid-cols-[5em_1fr] gap-x-[0.6em] py-[0.1em] text-[1em] leading-[1.4]',
    label: 'font-sans text-[0.8em] uppercase tracking-wider text-[#555] pt-[0.2em]',
    fields: true,
  },
  journal: {
    box: 'bg-[#f4efe1] text-[#24304a] font-hand pl-[3em] pr-[1.4em] py-[1.2em] bg-[linear-gradient(to_bottom,transparent_1.55em,rgba(80,120,170,0.3)_1.55em,rgba(80,120,170,0.3)_1.6em)] bg-[length:100%_1.6em] border-l-[0.15em] border-[#c97a7a]',
    heading: 'text-[1.45em] leading-[1.1] underline decoration-1 underline-offset-[0.2em] mb-[0.2em]',
    text: 'text-[1.35em] leading-[1.18]',
    fields: false,
  },
  manuscript: {
    box: 'bg-[#2a1d14] text-[#e3cf9a] font-display px-[1.8em] py-[1.5em] border-[0.3em] border-double border-[#8a6a2a] shadow-[inset_0_0_4em_rgba(0,0,0,0.6)]',
    heading: 'text-center text-[1.6em] font-semibold tracking-[0.08em] text-[#e8c34f] mb-[0.5em]',
    text: 'text-[1.2em] leading-[1.35] italic first-of-type:first-letter:float-left first-of-type:first-letter:mr-[0.1em] first-of-type:first-letter:text-[2.6em] first-of-type:first-letter:leading-[0.85] first-of-type:first-letter:not-italic first-of-type:first-letter:text-[#c9a227]',
    rule: 'my-[0.8em] border-t border-[#8a6a2a]',
    fields: false,
  },
  messages: { box: '', heading: '', text: '', fields: true },
  email: {
    box: 'bg-white text-[#202124] font-sans px-[1.4em] py-[1.2em] border border-[#ccc]',
    heading: 'text-[1.2em] font-semibold mb-[0.4em]',
    text: 'text-[1em] leading-[1.45]',
    field: 'grid grid-cols-[4.5em_1fr] gap-x-[0.5em] text-[0.9em] border-b border-[#e3e3e3] py-[0.15em]',
    label: 'text-[#5f6368]',
    fields: true,
  },
  missing: {
    box: 'bg-[#f7f5ef] text-[#151515] font-sans px-[1.4em] py-[1.2em] text-center border-[0.25em] border-[#151515]',
    heading: 'font-bold uppercase text-[2.6em] leading-none tracking-[0.12em] text-[#b3231d] mb-[0.3em]',
    text: 'text-[1em] leading-[1.4]',
    field: 'text-[1.1em] leading-[1.35]',
    label: 'font-bold uppercase text-[0.8em] tracking-wider mr-[0.5em]',
    rule: 'my-[0.6em] border-t-[0.15em] border-dashed border-[#151515]',
    fields: true,
  },
  obituary: {
    box: 'bg-[#ebe7dc] text-[#1a1a1a] font-display px-[1.6em] py-[1.4em] border-[0.4em] border-[#1a1a1a] outline outline-1 outline-offset-[-0.7em] outline-[#1a1a1a]',
    heading: 'text-center text-[1.9em] font-semibold leading-tight',
    text: 'text-[1.1em] leading-[1.35] text-center first-of-type:italic first-of-type:mb-[0.6em]',
    fields: false,
  },
  receipt: {
    box: 'mx-auto max-w-[22em] bg-[#fbfbf7] text-[#222] font-mono px-[1.2em] py-[1em] shadow-md',
    heading: 'text-center font-bold uppercase tracking-wider text-[1.05em]',
    text: 'text-[0.9em] leading-[1.4] text-center',
    field: 'flex items-baseline gap-[0.4em] text-[0.95em] leading-[1.6]',
    label: 'shrink-0',
    rule: 'my-[0.5em] border-t border-dashed border-[#888]',
    fields: true,
  },
  card: {
    box: 'mx-auto max-w-[24em] aspect-[7/4] grid place-content-center bg-[#f3eee2] text-[#1d1a24] font-display text-center px-[1.6em] py-[1.2em] shadow-lg border border-[#d8cfb8]',
    heading: 'text-[1.7em] font-semibold tracking-[0.06em]',
    text: 'text-[1.1em] italic leading-[1.3]',
    rule: 'mx-auto my-[0.5em] w-[4em] border-t border-[#8a7020]',
    fields: false,
  },
};

export function HandoutView({ style, text, size = '1rem', className = '' }: { style: HandoutStyle; text: string; size?: string; className?: string }) {
  const css: CSSProperties = { fontSize: size };
  if (style === 'messages') return <Messages text={text} css={css} className={className} />;
  const look = LOOKS[style];
  const lines = parseLines(text, look.fields);
  return (
    <div className={`overflow-hidden rounded-[0.2em] text-left ${look.box} ${className}`} style={css}>
      {style === 'memo' && (
        <span className="pointer-events-none absolute right-[1em] top-[0.8em] rotate-[8deg] border-[0.15em] border-[#b3231d] px-[0.4em] font-sans text-[0.9em] font-bold uppercase tracking-[0.2em] text-[#b3231d]/80">
          Confidential
        </span>
      )}
      <div className={style === 'newspaper' ? '[column-width:16em] [column-gap:1.5em] [&>h3]:[column-span:all]' : ''}>
        {lines.map((l, i) => (
          <LineView key={i} line={l} look={look} style={style} />
        ))}
      </div>
    </div>
  );
}

function LineView({ line, look, style }: { line: Line; look: Look; style: HandoutStyle }) {
  switch (line.kind) {
    case 'heading':
      return <h3 className={look.heading}>{line.text}</h3>;
    case 'rule':
      return <hr className={look.rule ?? 'my-[0.6em] border-t border-current opacity-30'} />;
    case 'blank':
      return <div className="h-[0.6em]" />;
    case 'field':
      return style === 'receipt' ? (
        <div className={look.field}>
          <span className={look.label}>{line.label}</span>
          <span className="flex-1 border-b border-dotted border-[#999]" />
          <span>{line.value}</span>
        </div>
      ) : (
        <div className={look.field}>
          <span className={look.label}>
            {line.label}
            {style === 'missing' || style === 'telegram' ? ':' : ''}
          </span>
          <span>{line.value}</span>
        </div>
      );
    default:
      return <p className={`whitespace-pre-wrap ${look.text}`}>{line.text}</p>;
  }
}

function Messages({ text, css, className }: { text: string; css: CSSProperties; className: string }) {
  const lines = parseLines(text);
  // The first sender owns the phone; their messages sit on the right.
  const owner = lines.find((l) => l.kind === 'field')?.label;
  let last = '';
  return (
    <div className={`mx-auto flex max-w-[26em] flex-col gap-[0.3em] rounded-[1.2em] bg-[#0f0f12] px-[0.9em] py-[1em] font-sans ${className}`} style={css}>
      {lines.map((l, i) => {
        if (l.kind === 'heading') return <div key={i} className="text-center text-[0.8em] font-semibold text-[#aaa]">{l.text}</div>;
        if (l.kind === 'field') {
          const mine = l.label === owner;
          const showName = !mine && l.label !== last;
          last = l.label;
          return (
            <div key={i} className={`flex max-w-[80%] flex-col ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
              {showName && <span className="ml-[0.8em] text-[0.7em] text-[#8e8e93]">{l.label}</span>}
              <span className={`rounded-[1.1em] px-[0.8em] py-[0.35em] text-[1em] leading-[1.3] ${mine ? 'bg-[#2f6fdb] text-white' : 'bg-[#2c2c2e] text-[#f2f2f7]'}`}>{l.value}</span>
            </div>
          );
        }
        if (l.kind === 'text') return <div key={i} className="text-center text-[0.75em] text-[#8e8e93]">{l.text}</div>;
        return null;
      })}
    </div>
  );
}
