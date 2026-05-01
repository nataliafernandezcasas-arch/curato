"""Square Midi logo for Google Wallet circular logo slot (660x660)."""
from PIL import Image, ImageDraw
import subprocess
from pathlib import Path

OUT = Path(__file__).parent

# Render the navy logo SVG at different sizes, then center on a square canvas
def make_square(size, out_path, bg=(197, 232, 108)):
    # Midi logo rendered at 70% width of canvas
    logo_w = int(size * 0.82)
    logo_h = int(logo_w * (150 / 480))
    # Render SVG to temp PNG
    tmp = OUT / "_tmp_logo.png"
    subprocess.run([
        "rsvg-convert", "-w", str(logo_w), "-h", str(logo_h),
        str(Path("/Users/isa/Documents/Claude Code/Midi/Brand/Midi_Logo_Navy.svg")),
        "-o", str(tmp),
    ], check=True)
    logo = Image.open(tmp).convert("RGBA")

    # Square canvas (Lime bg so it matches the Google card)
    canvas = Image.new("RGBA", (size, size), bg + (255,))
    # Paste centered
    cx = (size - logo_w) // 2
    cy = (size - logo_h) // 2
    canvas.paste(logo, (cx, cy), logo)
    canvas.save(out_path, "PNG", optimize=True)
    tmp.unlink()
    print(f"Saved {out_path.name} ({size}x{size})")

for size, suffix in [(220, ""), (440, "@2x"), (660, "@3x")]:
    make_square(size, OUT / f"logo_square{suffix}.png")
