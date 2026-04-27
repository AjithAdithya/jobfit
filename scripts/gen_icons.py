"""
Generate JF monogram PNG icons at 16, 48, 128px.
Matches the Navbar Monogram: cream circle, dark border, bold "JF", crimson star.
"""
import os
from PIL import Image, ImageDraw, ImageFont

CREAM   = (237, 233, 227, 255)
INK     = (28,  25,  23,  255)
CRIMSON = (192, 20,  20,  255)

def find_font(size):
    for path in [
        "FjallaOne-Regular.ttf",
        "C:/Windows/Fonts/impact.ttf",
        "C:/Windows/Fonts/ariblk.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()

def find_star_font(size):
    for path in [
        "C:/Windows/Fonts/seguisym.ttf",
        "C:/Windows/Fonts/seguiemj.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()

def draw_monogram(size):
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = s / 2, s / 2
    r = s * 0.42
    stroke = max(2, int(s * 0.05))

    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=CREAM, outline=INK, width=stroke)

    font = find_font(int(s * 0.38))
    bbox = draw.textbbox((0, 0), "JF", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw/2 - bbox[0], cy - th/2 - bbox[1]), "JF", font=font, fill=INK)

    if size >= 32:
        sfont = find_star_font(int(s * 0.18))
        draw.text((cx + r*0.62, cy - r*0.72), "✶", font=sfont, fill=CRIMSON)

    return img.resize((size, size), Image.LANCZOS)

ROOT       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT, "public")
os.makedirs(PUBLIC_DIR, exist_ok=True)

outputs = {
    16:  [os.path.join(PUBLIC_DIR, "icon16.png")],
    48:  [os.path.join(PUBLIC_DIR, "icon48.png")],
    128: [
        os.path.join(PUBLIC_DIR, "icon128.png"),
        os.path.join(ROOT, "website", "app", "icon.png"),
    ],
}

for size, paths in outputs.items():
    img = draw_monogram(size)
    for path in paths:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img.save(path, "PNG")
        print(f"OK {path}")

favicon = draw_monogram(32)
fp = os.path.join(ROOT, "website", "app", "favicon.png")
favicon.save(fp, "PNG")
print(f"OK {fp}")
print("Done.")
