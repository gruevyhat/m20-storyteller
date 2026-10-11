import { beastImage, type Beast } from './catalog';

/** Embed the local illustration so saved NPCs and exports remain portable. */
export async function beastPortrait(beast: Beast): Promise<string> {
  const response = await fetch(beastImage(beast));
  if (!response.ok) throw new Error('Creature illustration could not be loaded.');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Creature illustration is not an image.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid illustration data.'));
    reader.onerror = () => reject(new Error('Creature illustration could not be read.'));
    reader.readAsDataURL(blob);
  });
}
