// A printable character sheet laid out like the standard M20 sheet (header fields; Attributes;
// Abilities; Spheres; Backgrounds, Arete, Willpower, Health, the Quintessence/Paradox wheel,
// Experience), drawn as vectors with jsPDF. The frame and ornament are original; no logo or book
// artwork is reproduced. Page two holds focus, rotes and notes.
import type { jsPDF as JsPDF } from 'jspdf';
import { ATTRIBUTES, SPHERES, WHEEL_SIZE, type Character, type Trait } from '../model/types';
import { MF_SUMMARY } from '../fortune/meritsFlawsText';

const TALENTS = ['Alertness', 'Art', 'Athletics', 'Awareness', 'Brawl', 'Empathy', 'Expression', 'Intimidation', 'Leadership', 'Streetwise', 'Subterfuge'];
const SKILLS = ['Crafts', 'Drive', 'Etiquette', 'Firearms', 'Martial Arts', 'Meditation', 'Melee', 'Research', 'Stealth', 'Survival', 'Technology'];
const KNOWLEDGES = ['Academics', 'Computer', 'Cosmology', 'Enigmas', 'Esoterica', 'Investigation', 'Law', 'Medicine', 'Occult', 'Politics', 'Science'];

const W = 612;
const H = 792;
const COL = [54, 222, 390];
const COL_W = 156;
const GILT: [number, number, number] = [176, 138, 58];
const INK: [number, number, number] = [30, 22, 18];
const SHADE: [number, number, number] = [222, 214, 232];

/** jsPDF's built-in fonts only cover Windows-1252; fold anything else to its closest plain letter. */
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
export function pdfSafe(s: string) {
  return [...s]
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      if (code < 256 || CP1252_EXTRA.has(ch)) return ch;
      if (ch === '−') return '-';
      if (ch === '→') return '->';
      if (ch === '●') return '*';
      if (ch === '○') return 'o';
      const base = ch.normalize('NFKD').replace(/[̀-ͯ]/g, '');
      return [...base].every((b) => b.codePointAt(0)! < 256) ? base : '?';
    })
    .join('');
}

/** The Dark Pack logo as a data URL, for the PDF footer. Null outside a browser. */
async function darkPackLogo(): Promise<string | null> {
  try {
    const url = (await import('../assets/darkpack-logo.png')).default;
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function characterPdf(c: Character, opts: { chronicle?: string } = {}): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf');
  const logo = await darkPackLogo();
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const text = (s: string, x: number, y: number, opts?: Parameters<JsPDF['text']>[3]) => doc.text(pdfSafe(s), x, y, opts);

  frame(doc);
  doc.setTextColor(...INK);

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...GILT);
  text('Awakened Character Record', W / 2, 62, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  doc.setTextColor(...INK);
  text('Mage: The Ascension 20th Anniversary Edition', W / 2, 75, { align: 'center' });

  // Header fields
  const fields: [string, string | undefined][][] = [
    [
      ['Name', c.name],
      ['Player', ''],
      ['Chronicle', opts.chronicle ?? ''],
    ],
    [
      ['Nature', c.nature],
      ['Demeanor', c.demeanor],
      ['Essence', c.essence],
    ],
    [
      ['Affiliation', splitAffiliation(c.affiliation).affiliation],
      ['Sect', splitAffiliation(c.affiliation).sect],
      ['Concept', c.concept],
    ],
  ];
  fields.forEach((col, i) =>
    col.forEach(([label, value], r) => {
      const y = 96 + r * 15;
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      text(`${label}:`, COL[i], y);
      const lw = doc.getTextWidth(`${label}: `);
      doc.setFont('times', 'normal');
      fitText(doc, value ?? '', COL[i] + lw, y, COL_W - lw);
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.3);
      doc.line(COL[i] + lw, y + 2, COL[i] + COL_W, y + 2);
    }),
  );

  // Attributes
  let y = section(doc, 'Attributes', 148);
  (['physical', 'social', 'mental'] as const).forEach((g, i) => {
    subhead(doc, g[0].toUpperCase() + g.slice(1), COL[i], y);
    ATTRIBUTES[g].forEach((n, r) => traitRow(doc, c.attributes[n] ?? { name: n, rating: 1 }, COL[i], y + 14 + r * 12));
  });

  // Abilities
  y = section(doc, 'Abilities', y + 56);
  const lists: [string, string[], Trait[]][] = [
    ['Talents', TALENTS, c.abilities.talents],
    ['Skills', SKILLS, c.abilities.skills],
    ['Knowledges', KNOWLEDGES, c.abilities.knowledges],
  ];
  lists.forEach(([title, names, traits], i) => {
    subhead(doc, title, COL[i], y);
    names.forEach((n, r) => traitRow(doc, traits.find((t) => t.name === n) ?? { name: n, rating: 0 }, COL[i], y + 14 + r * 11.2));
  });
  const others = lists.flatMap(([, names, traits]) => traits.filter((t) => !names.includes(t.name)));

  // Spheres
  y = section(doc, 'Spheres', y + 14 + 11 * 11.2 + 10);
  SPHERES.forEach((s, k) => {
    const i = Math.floor(k / 3);
    const r = k % 3;
    traitRow(doc, { name: s, rating: c.spheres[s] ?? 0 }, COL[i], y + 4 + r * 12);
  });

  // Advantages
  y = section(doc, 'Advantages', y + 46);
  // Backgrounds
  subhead(doc, 'Backgrounds', COL[0], y);
  const bgs = c.abilities.backgrounds;
  for (let r = 0; r < 6; r++) traitRow(doc, bgs[r] ?? { name: '', rating: 0 }, COL[0], y + 14 + r * 12, true);
  // Backgrounds past six spill into Other Traits; anything past that goes on page two.
  const otherRows = [...bgs.slice(6), ...others];
  subhead(doc, 'Other Traits', COL[0], y + 96);
  for (let r = 0; r < 7; r++) traitRow(doc, otherRows[r] ?? { name: '', rating: 0 }, COL[0], y + 110 + r * 12, true);
  const overflow = otherRows.slice(7);

  // Arete, Willpower
  const mid = COL[1] + COL_W / 2;
  subhead(doc, 'Arete', COL[1], y);
  dotRow(doc, mid, y + 14, 10, c.arete, 'circle');
  subhead(doc, 'Willpower', COL[1], y + 34);
  dotRow(doc, mid, y + 48, 10, c.willpower.permanent, 'circle');
  dotRow(doc, mid, y + 60, 10, c.willpower.temporary, 'square');

  // Quintessence / Paradox wheel
  subhead(doc, 'Quintessence', COL[1], y + 86);
  wheel(doc, mid, y + 142, c);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  text('Paradox', mid, y + 206, { align: 'center' });

  // Health
  subhead(doc, 'Health', COL[2], y);
  const levels = c.health.levels.slice(0, 10);
  const moreHealth = c.health.levels.length - levels.length;
  levels.forEach((l, r) => {
    const ry = y + 14 + r * 12;
    if (r % 2 === 1) {
      doc.setFillColor(...SHADE);
      doc.rect(COL[2] - 2, ry - 8.5, COL_W + 4, 11, 'F');
    }
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    text(l.name, COL[2], ry);
    if (l.penalty > -99) text(l.penalty === 0 ? '-0' : String(l.penalty), COL[2] + COL_W - 22, ry, { align: 'right' });
    box(doc, COL[2] + COL_W - 10, ry - 7, 8);
    const d = c.health.damage[r];
    if (d) mark(doc, d, COL[2] + COL_W - 10, ry - 7, 8);
  });

  // Experience
  subhead(doc, 'Experience', COL[2], y + 150);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.rect(COL[2], y + 158, COL_W, 44);

  doc.setFont('times', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  if (logo) doc.addImage(logo, 'PNG', 40, H - 58, 24, 24);
  text('Unofficial fan-made sheet from M20 Storyteller; not official World of Darkness material.', W / 2, H - 40, { align: 'center' });
  text(
    'Portions of the materials are the copyrights and trademarks of Paradox Interactive AB. All rights reserved. worldofdarkness.com',
    W / 2,
    H - 32,
    { align: 'center' },
  );

  // Page two
  doc.addPage();
  frame(doc);
  page2(doc, c, overflow, moreHealth);
  return doc;
}

function page2(doc: JsPDF, c: Character, overflow: Trait[], moreHealth: number) {
  const text = (s: string, x: number, y: number, opts?: Parameters<JsPDF['text']>[3]) => doc.text(pdfSafe(s), x, y, opts);
  let y = section(doc, 'Focus', 64);
  const width = W - 108;
  const para = (label: string, value: string | undefined) => {
    if (!value) return;
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    text(`${label}:`, 54, y);
    doc.setFont('times', 'normal');
    const lines = doc.splitTextToSize(pdfSafe(value), width - 70) as string[];
    lines.forEach((l, i) => text(l, 124, y + i * 12.5));
    y += Math.max(1, lines.length) * 12.5 + 4;
  };
  para('Paradigm', c.paradigm);
  para('Practice', c.practice);
  para('Instruments', c.instruments);

  const flow = (needed: number) => {
    if (y + needed > H - 60) {
      doc.addPage();
      frame(doc);
      y = 64;
    }
  };

  if (c.rotes.length) {
    flow(60);
    y = section(doc, 'Rotes', y + 10);
    for (const r of c.rotes) {
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(pdfSafe(r.desc), width) as string[];
      flow(16 + lines.length * 11.5);
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      text(r.name, 54, y);
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      lines.forEach((l, i) => text(l, 54, y + 12 + i * 11.5));
      y += 18 + lines.length * 11.5;
    }
  }

  const block = (title: string, body: string) => {
    if (!body.trim()) return;
    flow(60);
    y = section(doc, title, y + 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    for (const para of body.split(/\n+/)) {
      const lines = doc.splitTextToSize(pdfSafe(para), width) as string[];
      for (const l of lines) {
        flow(12);
        text(l, 54, y);
        y += 11.5;
      }
      y += 4;
    }
  };
  block(
    'Merits & Flaws',
    (c.meritsFlaws ?? []).map((m) => `${m.kind === 'merit' ? 'Merit' : 'Flaw'}: ${m.name} (${m.points} pt.)${m.note ? `, ${m.note}` : ''}${MF_SUMMARY[m.name] ? `. ${MF_SUMMARY[m.name]}` : ''}`).join('\n'),
  );
  block('More Traits', overflow.map((t) => `${t.name} ${t.rating}${t.specialty ? ` (${t.specialty})` : ''}`).join('\n'));
  if (moreHealth > 0) block('Health', `${moreHealth} more health level${moreHealth === 1 ? '' : 's'} than the sheet shows: ${c.health.levels.map((l) => l.name).join(', ')}.`);
  block('Paradox Flaws', c.flaws.join('\n'));
  block('Notes', c.notes);
  const extras = Object.entries(c.extra)
    .map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v.replace(/\n/g, '; ')}`)
    .join('\n');
  block('Other details', extras);
}

// ---------------------------------------------------------------------------
// Drawing helpers

function frame(doc: JsPDF) {
  doc.setFillColor(252, 249, 240);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(...GILT);
  doc.setLineWidth(2.2);
  doc.rect(22, 22, W - 44, H - 44);
  doc.setLineWidth(0.6);
  doc.rect(28, 28, W - 56, H - 56);
  // Corner lozenges
  for (const [x, y] of [
    [28, 28],
    [W - 28, 28],
    [28, H - 28],
    [W - 28, H - 28],
  ]) {
    doc.setFillColor(...GILT);
    doc.lines(
      [
        [6, 6],
        [-6, 6],
        [-6, -6],
        [6, -6],
      ],
      x,
      y - 6,
      [1, 1],
      'F',
      true,
    );
  }
}

function section(doc: JsPDF, title: string, y: number) {
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  const w = doc.getTextWidth(title);
  doc.text(title, W / 2, y, { align: 'center' });
  doc.setDrawColor(...GILT);
  doc.setLineWidth(2);
  doc.line(40, y - 5, W / 2 - w / 2 - 8, y - 5);
  doc.line(W / 2 + w / 2 + 8, y - 5, W - 40, y - 5);
  doc.setLineWidth(0.5);
  doc.line(40, y - 1.5, W / 2 - w / 2 - 8, y - 1.5);
  doc.line(W / 2 + w / 2 + 8, y - 1.5, W - 40, y - 1.5);
  return y + 14;
}

function subhead(doc: JsPDF, title: string, x: number, y: number) {
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(title, x + COL_W / 2, y, { align: 'center' });
}

function fitText(doc: JsPDF, s: string, x: number, y: number, maxW: number) {
  const safe = pdfSafe(s);
  let size = doc.getFontSize();
  while (size > 6 && doc.getStringUnitWidth(safe) * size > maxW) size -= 0.5;
  const prev = doc.getFontSize();
  doc.setFontSize(size);
  let out = safe;
  while (out.length > 1 && doc.getTextWidth(out) > maxW) out = out.slice(0, -2) + '…';
  doc.text(out, x, y);
  doc.setFontSize(prev);
}

/** "Name ____ ●●●○○" with the specialty in small italics. */
function traitRow(doc: JsPDF, t: Trait, x: number, y: number, blankLine = false) {
  doc.setTextColor(...INK);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  const dotsW = 5 * 7.2;
  const labelMax = COL_W - dotsW - 6;
  if (t.name) fitText(doc, t.name, x, y, labelMax);
  let used = t.name ? Math.min(labelMax, doc.getTextWidth(pdfSafe(t.name))) + 2 : 0;
  if (t.specialty) {
    doc.setFont('times', 'italic');
    doc.setFontSize(7);
    const spec = `(${t.specialty})`;
    const room = labelMax - used;
    if (room > 12) {
      fitText(doc, spec, x + used, y, room);
      used += Math.min(room, doc.getTextWidth(pdfSafe(spec))) + 2;
    }
  }
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  if (blankLine || used < labelMax) doc.line(x + used, y + 1.5, x + labelMax + 2, y + 1.5);
  const max = Math.max(5, Math.min(10, t.rating));
  for (let i = 0; i < 5; i++) {
    const cx = x + COL_W - dotsW + 3 + i * 7.2;
    doc.setLineWidth(0.6);
    if (i < t.rating) {
      doc.setFillColor(...INK);
      doc.circle(cx, y - 3, 2.6, 'FD');
    } else doc.circle(cx, y - 3, 2.6, 'S');
  }
  if (max > 5 && t.rating > 5) {
    doc.setFontSize(7);
    doc.text(`+${t.rating - 5}`, x + COL_W + 2, y);
  }
}

function dotRow(doc: JsPDF, cx: number, y: number, n: number, filled: number, shape: 'circle' | 'square') {
  const step = 12;
  const x0 = cx - ((n - 1) * step) / 2;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    if (shape === 'circle') {
      if (i < filled) {
        doc.setFillColor(...INK);
        doc.circle(x, y, 3.4, 'FD');
      } else doc.circle(x, y, 3.4, 'S');
    } else {
      box(doc, x - 3.6, y - 3.6, 7.2);
      if (i < filled) mark(doc, 'L', x - 3.6, y - 3.6, 7.2);
    }
  }
}

function box(doc: JsPDF, x: number, y: number, s: number) {
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.rect(x, y, s, s);
}

function mark(doc: JsPDF, kind: 'B' | 'L' | 'A' | 'Q', x: number, y: number, s: number) {
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.9);
  const p = 1.4;
  if (kind === 'Q') {
    doc.setFillColor(95, 140, 136);
    doc.rect(x + 0.8, y + 0.8, s - 1.6, s - 1.6, 'F');
    return;
  }
  doc.line(x + p, y + s - p, x + s - p, y + p);
  if (kind === 'L' || kind === 'A') doc.line(x + p, y + p, x + s - p, y + s - p);
  if (kind === 'A') doc.line(x + s / 2, y + p - 0.4, x + s / 2, y + s - p + 0.4);
}

/** Twenty boxes round a circle: Quintessence fills clockwise from the top, Paradox counter-clockwise. */
function wheel(doc: JsPDF, cx: number, cy: number, c: Character) {
  const r = 40;
  const s = 7;
  for (let i = 0; i < WHEEL_SIZE; i++) {
    const a = -Math.PI / 2 + (i / WHEEL_SIZE) * Math.PI * 2;
    const x = cx + Math.cos(a) * r - s / 2;
    const y = cy + Math.sin(a) * r - s / 2;
    box(doc, x, y, s);
    const fromEnd = WHEEL_SIZE - 1 - i;
    if (i < c.quintessence) mark(doc, 'Q', x, y, s);
    else if (fromEnd < c.paradox) mark(doc, fromEnd < c.permanentParadox ? 'A' : 'L', x, y, s);
  }
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text(`${c.quintessence} Q · ${c.paradox} P`, cx, cy + 3, { align: 'center' });
}

/**
 * "Cult of Ecstasy (Tradition)" → Affiliation "Traditions", Sect "Cult of Ecstasy";
 * "Orphan (self-Awakened)" → Affiliation "Orphan", Sect "self-Awakened".
 */
export function splitAffiliation(a?: string) {
  if (!a) return { affiliation: '', sect: '' };
  const head = a.replace(/\s*\(.*\)\s*$/, '');
  const paren = a.match(/\(([^)]*)\)/)?.[1] ?? '';
  const CAMPS: Record<string, string> = { Tradition: 'Traditions', Technocracy: 'Technocracy', 'Disparate Craft': 'Disparates' };
  if (CAMPS[paren]) return { affiliation: CAMPS[paren], sect: head };
  return { affiliation: head, sect: paren };
}

export async function downloadPdf(c: Character, filename: string, opts: { chronicle?: string } = {}) {
  const doc = await characterPdf(c, opts);
  doc.save(filename);
}
