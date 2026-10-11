import { describe, expect, it } from 'vitest';
import { chunkMarkdown } from '../rules/library';

describe('rules library', () => {
  it('drops Obsidian block anchors from headings and text', () => {
    const md = '# Orphans ^orphans\n\nMages without a Tradition are called Orphans, and many prefer it. ^orphans-def\n\n^loose-anchor\nThey learn magick the hard way, from scraps and mistakes.\n';
    const [s] = chunkMarkdown(md, 'Book');
    expect(s.heading).toBe('Orphans');
    expect(s.text).not.toMatch(/\^/);
    expect(s.text).toContain('prefer it.');
    expect(s.text).toContain('the hard way');
  });

  it('turns links to anchors in this or another book into plain text', () => {
    const [s] = chunkMarkdown('# Allies\n\nSee Mage 20 ([Fame](mage-20-20th-anniversary-edition-final-version.md#^fame), [Beat Cop](#^beat-cop)) for sample characters and their Traits.\n', 'Book');
    expect(s.text).toBe('See Mage 20 (Fame, Beat Cop) for sample characters and their Traits.');
  });

  it('keeps carets that are not anchors', () => {
    const [s] = chunkMarkdown('# Math\n\nRaise the result to x^2 for each success, as the chart on that page shows.\n', 'Book');
    expect(s.text).toContain('x^2');
  });
});
