"""Generate a clean square 'M' monogram for Google Wallet circular logo crop."""
from PIL import Image, ImageDraw, ImageFont
import subprocess
from pathlib import Path

OUT = Path(__file__).parent
LIME = (197, 232, 108)
NAVY = (38, 33, 63)


def make_mark(size, out_path):
    # Build SVG: full Midi logo, but show only the 'M' portion in viewBox
    # The M in the source SVG spans x=107 → x=340 (the first character), y=117 → y=319
    svg = f"""<svg width="{size}" height="{size}" viewBox="80 80 280 280" xmlns="http://www.w3.org/2000/svg">
  <rect x="80" y="80" width="280" height="280" fill="#C5E86C"/>
  <path d="M143.512 117.913H107.027V318.914H145.927C145.927 232.586 145.927 198.296 143.782 181.595L204.411 270.472L264.506 181.595C262.361 198.296 262.361 192.104 262.361 277.868H301.26V117.913H264.506L204.141 205.661L143.512 117.913Z" fill="#26213F"/>
  <path d="M340.078 277.874H301.178V318.915H340.078V277.874Z" fill="#26213F"/>
</svg>"""
    tmp_svg = OUT / "_tmp_mark.svg"
    tmp_svg.write_text(svg)
    subprocess.run([
        "rsvg-convert", "-w", str(size), "-h", str(size),
        str(tmp_svg), "-o", str(out_path),
    ], check=True)
    tmp_svg.unlink()
    print(f"Saved {out_path.name} ({size}x{size})")


for size, suffix in [(220, ""), (440, "@2x"), (660, "@3x")]:
    make_mark(size, OUT / f"logo_mark{suffix}.png")
