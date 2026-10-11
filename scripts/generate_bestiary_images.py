#!/usr/bin/env python3
"""Render the original Bestiary with the locally installed mflux Z-Image model.

Run with the Python interpreter in the mflux environment. This keeps one model
loaded across the batch, resumes existing images, and never downloads weights.
"""
import argparse
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model-path', type=Path, required=True)
    parser.add_argument('--only', nargs='+', help='Render selected creature IDs')
    parser.add_argument('--replace', action='store_true', help='Regenerate existing selected images')
    args = parser.parse_args()
    if not args.model_path.is_dir():
        parser.error('The local model path must exist.')
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'

    import mlx.core as mx
    from PIL import Image
    from mflux.models.common.config.model_config import ModelConfig
    from mflux.models.z_image.variants.z_image import ZImage

    prompts = json.loads((ROOT / 'scripts/bestiary-image-prompts.json').read_text())
    if args.only:
        unknown = set(args.only) - {row['id'] for row in prompts}
        if unknown:
            parser.error(f'Unknown creature IDs: {sorted(unknown)}')
        prompts = [row for row in prompts if row['id'] in args.only]
    output = ROOT / 'public/bestiary'
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / 'scripts/bestiary-image-manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    pending = []
    for row in prompts:
        path = output / f"{row['id']}.webp"
        if path.exists() and not args.replace:
            with Image.open(path) as image:
                image.load()
                if image.size != (768, 512):
                    raise ValueError(f'Unexpected image dimensions: {path}')
            if row['id'] not in manifest:
                raise ValueError(f'Missing provenance for existing image: {path}')
            print(f"SKIP {row['id']}", flush=True)
        else:
            pending.append(row)
    if not pending:
        print('All requested illustrations already exist.', flush=True)
        return

    model = ZImage(model_config=ModelConfig.z_image_turbo(), model_path=str(args.model_path), compute_precision=mx.float16)
    for index, row in enumerate(pending, 1):
        print(f"RENDER {index}/{len(pending)} {row['id']}", flush=True)
        result = model.generate_image(seed=row['seed'], prompt=row['prompt'], num_inference_steps=4,
                                      width=768, height=512, scheduler='flow_match_euler_discrete')
        target = output / f"{row['id']}.webp"
        temporary = target.with_suffix('.partial.webp')
        result.image.save(temporary, format='WEBP', quality=88, method=6)
        temporary.replace(target)
        manifest[row['id']] = {
            'model': 'filipstrand/Z-Image-Turbo-mflux-4bit', 'engine': 'mflux',
            'seed': row['seed'], 'steps': 4, 'computePrecision': 'float16',
            'width': 768, 'height': 512, 'prompt': row['prompt'],
        }
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
        print(f"SAVED {row['id']} ({target.stat().st_size} bytes)", flush=True)
        del result
        mx.clear_cache()


if __name__ == '__main__':
    main()
