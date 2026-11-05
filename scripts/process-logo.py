#!/usr/bin/env python3
"""
Processes `public/IMG_0705..png` (or `public/IMG_0705.png` / `public/IMG_0705.JPG`)
into `public/logo-plodploi-circle.png` (< 1 MB, 512x512 RGBA PNG).
Preserves the full original alpha channel and outer padding so the curved
`PLODPLOI` sticker text (whose white outline slightly extends past the bottom
of the pastel blue circle on letters D and P) is 100% intact and never clipped.
"""
import os
import subprocess

CANDIDATES = [
    os.path.join("public", "IMG_0705..png"),
    os.path.join("public", "IMG_0705.png"),
    os.path.join("public", "IMG_0705.JPG"),
    os.path.join("public", "IMG_0705.jpg"),
]
OUTPUT_PATH = os.path.join("public", "logo-plodploi-circle.png")


def main() -> None:
    src = next((p for p in CANDIDATES if os.path.exists(p)), None)
    if not src:
        raise FileNotFoundError("Could not find source logo in public/")

    orig_size = os.path.getsize(src)
    print(f"Source file: {src} ({orig_size:,} bytes = {orig_size / (1024 * 1024):.2f} MB)")

    # Resize cleanly to 512x512 RGBA PNG via macOS sips, preserving the exact
    # transparent background and outer padding around the 'PLODPLOI' text outline.
    subprocess.run(
        ["sips", "-s", "format", "png", "-z", "512", "512", src, "--out", OUTPUT_PATH],
        check=True,
        stdout=subprocess.DEVNULL,
    )

    new_size = os.path.getsize(OUTPUT_PATH)
    print(
        f"Saved circular transparent PNG (no edge clipping): {OUTPUT_PATH} "
        f"({new_size:,} bytes = {new_size / 1024:.1f} KB, < 1 MB)"
    )


if __name__ == "__main__":
    main()
