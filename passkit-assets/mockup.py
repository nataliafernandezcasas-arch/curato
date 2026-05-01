"""Generate a visual mockup of the Midi Pass as it would appear in Apple Wallet."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import qrcode

ROOT = Path(__file__).parent
OUT = ROOT / "mockup_preview.png"

# Scale 2x for retina
S = 2
W, H = 375 * S, 470 * S  # Approximate Apple Wallet card aspect

LIME = (197, 232, 108)
NAVY = (38, 33, 63)
PURPLE = (130, 93, 199)
PURPLE_DEEP = (107, 26, 191)
WHITE = (255, 255, 255)

# Try DM Sans; fall back to system fonts
def load_font(size, weight="Regular"):
    candidates = [
        f"/Users/isa/Library/Fonts/DMSans-{weight}.ttf",
        f"/System/Library/Fonts/Supplemental/DMSans-{weight}.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()

img = Image.new("RGB", (W, H), LIME)
draw = ImageDraw.Draw(img)

# ---- Top bar: logo + ALLOWANCE ----
# Logo (navy)
logo = Image.open(ROOT / "logo@2x.png").convert("RGBA")
logo = logo.resize((int(logo.width * 0.7 * S / 2), int(logo.height * 0.7 * S / 2)))
img.paste(logo, (18 * S, 18 * S), logo)

# Logo text "Midi Pass"
f_small = load_font(11 * S, "Medium")
draw.text((18 * S, 18 * S + logo.height + 4 * S), "Midi Pass", fill=NAVY, font=f_small)

# ALLOWANCE header (top-right)
f_label = load_font(10 * S, "Medium")
f_value_lg = load_font(18 * S, "Bold")
label_txt = "ALLOWANCE"
value_txt = "$1.24M / $1.5M"
lw = draw.textlength(label_txt, font=f_label)
vw = draw.textlength(value_txt, font=f_value_lg)
draw.text((W - 18 * S - lw, 20 * S), label_txt, fill=PURPLE, font=f_label)
draw.text((W - 18 * S - vw, 38 * S), value_txt, fill=NAVY, font=f_value_lg)

# ---- Strip image (gradient) ----
strip = Image.open(ROOT / "strip@2x.png").convert("RGB")
strip_h = 72 * S
strip = strip.resize((W, strip_h))
img.paste(strip, (0, 100 * S))

# ---- Main content area ----
content_y = 100 * S + strip_h + 20 * S

# Thumbnail (creator photo placeholder) — circle with initials
thumb_size = 72 * S
thumb = Image.new("RGBA", (thumb_size, thumb_size), (0, 0, 0, 0))
td = ImageDraw.Draw(thumb)
td.ellipse([0, 0, thumb_size - 1, thumb_size - 1], fill=NAVY)
f_init = load_font(30 * S, "Bold")
init = "IF"
iw = td.textlength(init, font=f_init)
td.text(((thumb_size - iw) / 2, thumb_size * 0.25), init, fill=LIME, font=f_init)
img.paste(thumb, (18 * S, content_y), thumb)

# Name + IG + Tier (right of thumbnail)
tx = 18 * S + thumb_size + 16 * S
f_prim_lbl = load_font(10 * S, "Medium")
f_prim_val = load_font(20 * S, "Bold")
draw.text((tx, content_y + 2 * S), "NOMBRE", fill=PURPLE, font=f_prim_lbl)
draw.text((tx, content_y + 18 * S), "Isabella Fernández", fill=NAVY, font=f_prim_val)

# Secondary + auxiliary row
sec_y = content_y + 56 * S
f_sec_val = load_font(14 * S, "SemiBold")
draw.text((tx, sec_y), "INSTAGRAM", fill=PURPLE, font=f_prim_lbl)
draw.text((tx, sec_y + 14 * S), "@isabella.fdz", fill=NAVY, font=f_sec_val)

aux_x = W - 120 * S
draw.text((aux_x, sec_y), "NIVEL", fill=PURPLE, font=f_prim_lbl)
draw.text((aux_x, sec_y + 14 * S), "Prime", fill=NAVY, font=f_sec_val)

# ---- QR code ----
qr = qrcode.QRCode(box_size=4 * S, border=1)
qr.add_data("https://midi.io/pass/if-creator-2026")
qr.make()
qr_img = qr.make_image(fill_color=NAVY, back_color=LIME).convert("RGB")
qw, qh = qr_img.size
qx = (W - qw) // 2
qy = H - qh - 44 * S
img.paste(qr_img, (qx, qy))

# QR caption
f_cap = load_font(10 * S, "Regular")
cap = "midi.io/pass"
cw = draw.textlength(cap, font=f_cap)
draw.text(((W - cw) / 2, qy + qh + 6 * S), cap, fill=NAVY, font=f_cap)

# Rounded-corner mask (Apple Wallet look)
mask = Image.new("L", (W, H), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle([0, 0, W - 1, H - 1], radius=24 * S, fill=255)
out = Image.new("RGB", (W, H), (240, 240, 245))  # outside background
out.paste(img, (0, 0), mask)

out.save(OUT, "PNG", optimize=True)
print(f"Mockup saved to {OUT}")
