#!/usr/bin/env python3
"""Export a standing figure (spec §7.2) from a layered PSD.

Usage: .cache/psd-venv/bin/python -I tools/figures/export.py <recipe.json> --source <dir> [--only id]

The recipe names, for each figure, the PSD, the crop, whether to mirror it (`flip`), and which
layer of the eye and mouth groups stands for each shape. The art itself is not in the repository: PSDs are read from
--source, and the PNGs go to the recipe's `out` directory, which .gitignore excludes.

How the layers are made: the figure is composited once with eyes and mouth hidden (base), and
once per shape. Each shape's image keeps only the pixels that differ from the base, so stacking
it on the base gives exactly the full composite, whatever the layer order inside the PSD
(hair over the eyes, for instance). Scaling happens before the comparison, for the same reason.

Bounds: PSD <= 80 MiB, canvas <= 12 megapixels, <= 24 shapes per figure. psd-tools 1.24.0.
"""
import argparse
import json
import logging
import sys
import warnings
from pathlib import Path

warnings.filterwarnings('ignore')
logging.disable(logging.WARNING)

from PIL import Image, ImageChops  # noqa: E402
from psd_tools import PSDImage  # noqa: E402

MAX_BYTES = 80 * 1024 * 1024
MAX_PIXELS = 12_000_000
MAX_SHAPES = 24


def find(psd, path):
    node = psd
    for name in path.split('/'):
        node = next((child for child in node if child.name == name), None)
        if node is None:
            raise SystemExit(f'group not found: {path}')
    return list(node)


def pick(variants, entry, what):
    index, name = entry
    if not 0 <= index < len(variants) or variants[index].name != str(name):
        raise SystemExit(f'{what}: layer #{index} is not named {name!r}; the PSD differs from the recipe')
    return variants[index]


def export(figure_id, recipe, source, out_root, scale):
    path = source / recipe['source']
    if path.stat().st_size > MAX_BYTES:
        raise SystemExit(f'{path.name}: larger than {MAX_BYTES} bytes')
    psd = PSDImage.open(path)
    if psd.width * psd.height > MAX_PIXELS:
        raise SystemExit(f'{path.name}: canvas larger than {MAX_PIXELS} pixels')
    left, top, right, bottom = recipe['crop']
    if not (0 <= left < right <= psd.width and 0 <= top < bottom <= psd.height):
        raise SystemExit(f'{figure_id}: crop outside the canvas')
    size = (round((right - left) * scale), round((bottom - top) * scale))

    groups = {part: find(psd, recipe[part]['group']) for part in ('eyes', 'mouth')}
    shapes = {part: {k: v for k, v in recipe[part].items() if k != 'group'} for part in groups}
    if sum(len(s) for s in shapes.values()) > MAX_SHAPES:
        raise SystemExit(f'{figure_id}: more than {MAX_SHAPES} shapes')

    def render(shown):
        for variants in groups.values():
            for layer in variants:
                layer.visible = layer in shown
        image = psd.composite(viewport=(left, top, right, bottom), force=True).convert('RGBA')
        if recipe.get('flip'):  # the figure faces the other way: mirror every layer alike
            image = image.transpose(Image.FLIP_LEFT_RIGHT)
        return image.resize(size, Image.LANCZOS)

    out = out_root / figure_id
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.png'):
        old.unlink()
    base = render([])
    base.save(out / 'base.png', optimize=True)
    written = ['base']
    for part, table in shapes.items():
        for shape, entry in table.items():
            layer = pick(groups[part], entry, f'{figure_id} {part}.{shape}')
            full = render([layer])
            changed = ImageChops.difference(full, base).convert('L').point(lambda v: 255 if v else 0)
            if changed.getbbox() is None:
                raise SystemExit(f'{figure_id} {part}.{shape}: the layer changes nothing inside the crop')
            patch = Image.new('RGBA', size, (0, 0, 0, 0))
            patch.paste(full, (0, 0), changed)
            patch.save(out / f'{part}-{shape}.png', optimize=True)
            written.append(f'{part}-{shape}')
    (out / 'figure.json').write_text(json.dumps({'width': size[0], 'height': size[1]}) + '\n')
    total = sum((out / f'{name}.png').stat().st_size for name in written)
    print(f'{figure_id}: {size[0]}x{size[1]}, {len(written)} images, {total} bytes -> {out}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('recipe', type=Path)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--only')
    args = parser.parse_args()
    recipe = json.loads(args.recipe.read_text())
    out_root = (args.recipe.parent / recipe['out']).resolve()
    if args.recipe.parent.resolve() not in out_root.parents:
        raise SystemExit('out must be below the recipe directory')
    for figure_id, entry in recipe['figures'].items():
        if args.only in (None, figure_id):
            export(figure_id, entry, args.source.expanduser(), out_root, recipe['scale'])


if __name__ == '__main__':
    sys.exit(main())
