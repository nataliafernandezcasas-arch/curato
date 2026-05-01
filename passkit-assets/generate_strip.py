"""Generate PassKit strip image (purple gradient) and icon at @1x, @2x, @3x."""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).parent

# Midi brand colors
PURPLE = (130, 93, 199)      # #825DC7
PURPLE_DEEP = (107, 26, 191) # #6B1ABF
LIME = (197, 232, 108)       # #C5E86C
NAVY = (38, 33, 63)          # #26213F


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_strip(w, h, out):
    """Left-to-right gradient PURPLE → PURPLE_DEEP with subtle vertical depth."""
    img = Image.new("RGB", (w, h), PURPLE)
    px = img.load()
    for x in range(w):
        t = x / max(w - 1, 1)
        base = lerp(PURPLE, PURPLE_DEEP, t)
        for y in range(h):
            # subtle diagonal highlight for depth
            d = (x * 0.35 + y * 0.6) / (w + h)
            shade = 0.92 + 0.18 * (1 - abs(0.5 - d) * 2)  # highlight band through middle
            px[x, y] = tuple(min(255, int(c * shade)) for c in base)
    img.save(out, "PNG", optimize=True)
    print(f"Created {out.name} ({w}x{h})")


def icon(size, out):
    """Lime square icon with navy Midi 'M' mark."""
    # We'll render it as a rounded lime square with the navy logo centered.
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=LIME)
    img.save(out, "PNG", optimize=True)
    print(f"Created {out.name} ({size}x{size}) — lime base; overlay logo via rsvg step")


# Strip: 375x144 @1x, 750x288 @2x, 1125x432 @3x
for w, h, suffix in [(375, 144, ""), (750, 288, "@2x"), (1125, 432, "@3x")]:
    gradient_strip(w, h, OUT / f"strip{suffix}.png")

# Icon base: lime squircle. We'll composite the navy logo mark on top separately.
for size, suffix in [(29, ""), (58, "@2x"), (87, "@3x")]:
    icon(size, OUT / f"icon_base{suffix}.png")
