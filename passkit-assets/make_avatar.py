"""Generate an avatar strip image for Midi Pass — initials 'IF' on purple gradient."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).parent

PURPLE = (130, 93, 199)       # #825DC7
PURPLE_DEEP = (107, 26, 191)  # #6B1ABF
LIME = (197, 232, 108)        # #C5E86C
NAVY = (38, 33, 63)           # #26213F
CREAM = (255, 253, 241)       # #FFFDF1


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def load_font(size, weight="Bold"):
    for p in [
        f"/Users/isa/Library/Fonts/DMSans-{weight}.ttf",
        f"/System/Library/Fonts/Supplemental/DMSans-{weight}.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


def make_strip(w, h, out_path):
    img = Image.new("RGB", (w, h), PURPLE)
    px = img.load()
    # Horizontal gradient purple → purple_deep with soft diagonal highlight
    for x in range(w):
        t = x / max(w - 1, 1)
        base = lerp(PURPLE, PURPLE_DEEP, t)
        for y in range(h):
            d = (x * 0.35 + y * 0.6) / (w + h)
            shade = 0.92 + 0.18 * (1 - abs(0.5 - d) * 2)
            px[x, y] = tuple(min(255, int(c * shade)) for c in base)

    draw = ImageDraw.Draw(img, "RGBA")

    # Avatar circle (centered, navy with lime initials)
    circle_radius = int(h * 0.38)
    cx = w // 2
    cy = h // 2
    # Soft drop shadow
    for r_offset in range(8, 0, -1):
        alpha = int(30 - r_offset * 3)
        draw.ellipse(
            [cx - circle_radius - r_offset, cy - circle_radius - r_offset + 3,
             cx + circle_radius + r_offset, cy + circle_radius + r_offset + 3],
            fill=(0, 0, 0, max(0, alpha)),
        )
    # Main circle
    draw.ellipse(
        [cx - circle_radius, cy - circle_radius, cx + circle_radius, cy + circle_radius],
        fill=NAVY,
    )
    # Inner ring (lime)
    ring_width = max(2, int(h * 0.012))
    draw.ellipse(
        [cx - circle_radius, cy - circle_radius, cx + circle_radius, cy + circle_radius],
        outline=LIME,
        width=ring_width,
    )

    # Initials
    initials = "IF"
    font_size = int(circle_radius * 1.05)
    f = load_font(font_size, "Bold")
    tw = draw.textlength(initials, font=f)
    # Use getbbox for vertical metrics
    bbox = f.getbbox(initials)
    th = bbox[3] - bbox[1]
    draw.text(
        (cx - tw / 2, cy - th / 2 - bbox[1]),
        initials,
        fill=LIME,
        font=f,
    )

    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({w}x{h})")


# Apple Wallet strip sizes: 375x144 @1x, 750x288 @2x, 1125x432 @3x
for w, h, suffix in [(375, 144, ""), (750, 288, "@2x"), (1125, 432, "@3x")]:
    make_strip(w, h, OUT / f"strip_avatar{suffix}.png")
