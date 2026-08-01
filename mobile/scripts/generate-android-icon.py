#!/usr/bin/env python3
"""Generate Android adaptive icon foreground with safe-zone padding.

Android masks adaptive icons (circle, squircle, etc.). Only the inner ~66%
of the canvas is guaranteed visible. This script scales the logo down and
centers it so nothing important gets clipped.

Usage: python3 scripts/generate-android-icon.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "icon.png"
OUTPUT = ROOT / "assets" / "images" / "android-icon-foreground.png"
CANVAS = 1024
# Slightly inside the 66% safe zone for extra headroom on launchers.
SAFE_ZONE_RATIO = 0.58


def content_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.split()[-1]
    return alpha.getbbox() or (0, 0, image.width, image.height)


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    bbox = content_bbox(source)
    cropped = source.crop(bbox)

    max_dim = int(CANVAS * SAFE_ZONE_RATIO)
    scale = min(max_dim / cropped.width, max_dim / cropped.height)
    new_size = (max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale)))
    resized = cropped.resize(new_size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    offset = ((CANVAS - new_size[0]) // 2, (CANVAS - new_size[1]) // 2)
    canvas.paste(resized, offset, resized)
    canvas.save(OUTPUT, optimize=True)

    out_bbox = content_bbox(canvas)
    fill_w = out_bbox[2] - out_bbox[0]
    fill_h = out_bbox[3] - out_bbox[1]
    print(f"Wrote {OUTPUT}")
    print(f"  Content size: {fill_w}x{fill_h} ({100 * fill_w / CANVAS:.0f}% of canvas)")


if __name__ == "__main__":
    main()
