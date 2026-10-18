"""Makes the web logo, app icons and favicon from the owner's logo (art/dorothy-logo.jpg).

    python3 scripts/logo-assets.py

Needs Pillow. Writes public/logo.webp (900 px wide), public/logo-small.webp (360 px),
public/icon-512.png, icon-192.png, apple-touch-icon.png, icon-maskable-512.png and favicon.png.

The logo is a picture on a flat cream background. The background around the artwork is
found by flood fill from the corners and made transparent (with a softened edge), so the
logo sits on the page with no visible box. The icons keep the cream (WALL, the same as
--wall in src/styles.css and the manifest), since iOS turns transparent corners black.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
WALL = (254, 247, 229)  # #fef7e5

src = Image.open(ROOT / "art" / "dorothy-logo.jpg").convert("RGB")
w, h = src.size
MARK = (255, 0, 255)
flooded = src.copy()
for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    ImageDraw.floodfill(flooded, corner, MARK, thresh=14)
# opaque where the picture is, transparent where the flood reached; the edge is softened a little
is_bg = ImageChops.difference(flooded, Image.new("RGB", (w, h), MARK)).convert("L").point(lambda v: 255 if v == 0 else 0)
alpha = is_bg.point(lambda v: 255 - v).filter(ImageFilter.GaussianBlur(1.1))
# the same cream everywhere for the icons
cream = src.copy()
cream.paste(Image.new("RGB", (w, h), WALL), mask=is_bg)
logo_rgba = cream.copy()
logo_rgba.putalpha(alpha)

pub = ROOT / "public"

def save_logo(width, name):
    img = logo_rgba.resize((width, round(h * width / w)), Image.LANCZOS)
    img.save(pub / name, "WEBP", quality=88, alpha_quality=100, method=6)

save_logo(900, "logo.webp")
save_logo(360, "logo-small.webp")

def square(x, y, size, out, px, margin=0.0, circle=False):
    """The girl in her hat, cropped square and drawn on the cream wall."""
    crop = cream.crop((x, y, x + size, y + size))
    inner = round(px * (1 - 2 * margin))
    crop = crop.resize((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGB", (px, px), WALL)
    canvas.paste(crop, ((px - inner) // 2, (px - inner) // 2))
    if circle:
        rgba = canvas.convert("RGBA")
        mask = Image.new("L", (px * 4, px * 4), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, px * 4 - 1, px * 4 - 1), fill=255)
        rgba.putalpha(mask.resize((px, px), Image.LANCZOS))
        rgba.save(pub / out)
    else:
        canvas.save(pub / out)

FACE = (385, 215, 750)  # x, y, size of the crop around the girl's face and hat
square(*FACE, "icon-512.png", 512)
square(*FACE, "icon-192.png", 192)
square(*FACE, "apple-touch-icon.png", 180)  # iOS turns transparent corners black, so no alpha here
square(*FACE, "icon-maskable-512.png", 512, margin=0.12)  # keeps the hat inside a round mask
square(*FACE, "favicon.png", 64, circle=True)
print("done")
