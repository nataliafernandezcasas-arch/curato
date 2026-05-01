"""High-end strip image for Midi Pass — elegant dark purple gradient, no text.
Like Bumerang but with Midi's purple palette.
"""
from PIL import Image
from pathlib import Path

OUT = Path(__file__).parent

# Midi colors for dark/elegant mode
NAVY = (38, 33, 63)           # #26213F
PURPLE_DEEP = (107, 26, 191)  # #6B1ABF
PURPLE = (130, 93, 199)       # #825DC7
CREAM = (255, 253, 241)       # #FFFDF1


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_strip(w, h, out_path):
    """Diagonal sheen gradient navy → purple → navy, like Bumerang's dark silk."""
    img = Image.new("RGB", (w, h), NAVY)
    px = img.load()
    for y in range(h):
        for x in range(w):
            # Diagonal "silk" gradient
            t = (x * 0.6 + y * 0.4) / (w + h)
            # Mix from navy to purple_deep to purple and back
            if t < 0.33:
                c = lerp(NAVY, PURPLE_DEEP, t / 0.33)
            elif t < 0.66:
                c = lerp(PURPLE_DEEP, PURPLE, (t - 0.33) / 0.33)
            else:
                c = lerp(PURPLE, PURPLE_DEEP, (t - 0.66) / 0.34)

            # Highlight bands (thin bright streaks) for silk-like texture
            band_t = ((x * 0.3 + y * 0.7) / (w + h) * 5) % 1.0
            if band_t < 0.04:
                c = tuple(min(255, int(ci * 1.15)) for ci in c)
            elif band_t < 0.08:
                c = tuple(min(255, int(ci * 1.08)) for ci in c)

            px[x, y] = c
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path.name} ({w}x{h})")


for w, h, suffix in [(375, 144, ""), (750, 288, "@2x"), (1125, 432, "@3x")]:
    make_strip(w, h, OUT / f"strip_highend{suffix}.png")
