import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BESTIARY } from '../bestiary/catalog';

const images = resolve('public/bestiary');
const prompts = JSON.parse(readFileSync(resolve('scripts/bestiary-image-prompts.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve('scripts/bestiary-image-manifest.json'), 'utf8'));

describe('delivered Bestiary artwork', () => {
  it('ships exactly one distinct WebP illustration for every original creature', () => {
    const expected = BESTIARY.map((beast) => `${beast.id}.webp`).sort();
    expect(readdirSync(images).filter((name) => name.endsWith('.webp')).sort()).toEqual(expected);
    const hashes = new Set<string>();
    for (const filename of expected) {
      const bytes = readFileSync(resolve(images, filename));
      expect(bytes.subarray(0, 4).toString(), filename).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString(), filename).toBe('WEBP');
      expect(bytes.length, filename).toBeGreaterThan(2000);
      hashes.add(createHash('sha256').update(bytes).digest('hex'));
    }
    expect(hashes.size).toBe(BESTIARY.length);
  });

  it('records the actual mflux model, prompt and seed for every delivered image', () => {
    const ids = BESTIARY.map((beast) => beast.id).sort();
    expect(Object.keys(manifest).sort()).toEqual(ids);
    expect(prompts.map((row: { id: string }) => row.id).sort()).toEqual(ids);
    for (const beast of BESTIARY) {
      const record = manifest[beast.id];
      expect(record.engine).toBe('mflux');
      expect(record.model).toBe('filipstrand/Z-Image-Turbo-mflux-4bit');
      expect(record.seed).toBe(beast.imageSeed);
      expect(record.width).toBe(768);
      expect(record.height).toBe(512);
      expect(record.prompt).toBe(prompts.find((row: { id: string }) => row.id === beast.id).prompt);
    }
  });
});
