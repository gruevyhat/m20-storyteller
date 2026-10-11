import { afterEach, describe, expect, it, vi } from 'vitest';
import { BESTIARY, beastImage } from '../bestiary/catalog';
import { beastPortrait } from '../bestiary/portrait';

afterEach(() => vi.unstubAllGlobals());

describe('portable creature portraits', () => {
  it('embeds the image bytes fetched from the deployment base', async () => {
    const fetchImage = vi.fn().mockResolvedValue(new Response(new Blob(['illustration'], { type: 'image/webp' })));
    vi.stubGlobal('fetch', fetchImage);
    expect(await beastPortrait(BESTIARY[0])).toBe(`data:image/webp;base64,${btoa('illustration')}`);
    expect(fetchImage).toHaveBeenCalledWith(beastImage(BESTIARY[0]));
    expect(beastImage(BESTIARY[0])).toBe(`${import.meta.env.BASE_URL}bestiary/${BESTIARY[0].id}.webp`);
  });

  it('rejects HTTP errors and a fallback HTML page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } })));
    await expect(beastPortrait(BESTIARY[0])).rejects.toThrow('could not be loaded');
    await expect(beastPortrait(BESTIARY[0])).rejects.toThrow('not an image');
  });
});
