import { describe, expect, it } from 'vitest';
import { MarkovNames, NAME_STYLES, randomName } from '../names/markov';
import { CORPORA } from '../names/corpora';
import { rngFromSeed } from '../fortune/random';

describe('Markov names', () => {
  it('is reproducible from the seed', () => {
    expect(randomName(rngFromSeed('a'), 'czech')).toBe(randomName(rngFromSeed('a'), 'czech'));
  });

  it('makes new names, not copies of the training lists', () => {
    for (const c of CORPORA) {
      const known = new Set([...c.given, ...c.family].map((n) => n.toLowerCase()));
      for (let i = 0; i < 200; i++) {
        const name = randomName(rngFromSeed(`${c.key}-${i}`), c.key);
        expect(name, name).toMatch(/^\p{Lu}/u);
        expect(name.split(' ').length, name).toBeGreaterThanOrEqual(2);
        expect(name, name).not.toMatch(/(\p{L})\1\1|(\p{L}{2})\2\2/iu);
        const [first] = name.split(' ');
        // The given name (family name first for Japanese) is never lifted verbatim.
        if (c.key !== 'japanese') expect(known.has(first.toLowerCase()), name).toBe(false);
      }
    }
  });

  it('only capitalizes after Mac in Scots names', () => {
    const m = new MarkovNames(['Macaraeg', 'Macapagal'], 3, false);
    const out = m.generate(rngFromSeed('x'));
    if (out) expect(out).not.toMatch(/^Mac\p{Lu}/u);
  });

  it('offers every naming tradition', () => {
    expect(NAME_STYLES.map((s) => s.key)).toEqual(CORPORA.map((c) => c.key));
  });
});
