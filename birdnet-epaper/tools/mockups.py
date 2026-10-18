"""Render 200x200 1-bit mockups of the BirdNET Kids e-paper display.

Usage: python3 mockups.py path/to/data.json out_dir [--now 2026-10-18T14:05]

Uses the real detections in data.json (newest 10 by last_seen). Bird photos are
replaced by a code-drawn stand-in, dithered exactly the way real photos will be
(photo_to_1bit), so the look of the picture area is representative.
Writes <name>.png at 1x (what the panel shows) and <name>@3x.png for viewing.
"""
import json
import sys
from datetime import datetime

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

W = H = 200
SANS = "/usr/share/fonts/truetype/freefont/FreeSans.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(SANS_BOLD if bold else SANS, size)


# ---------------------------------------------------------------- dithering

def atkinson(gray):
    """Atkinson dither (spreads 6/8 of the error): keeps whites clean, which
    suits e-paper better than Floyd-Steinberg's grey mush."""
    w, h = gray.size
    flat = gray.tobytes()
    px = [list(flat[y * w:(y + 1) * w]) for y in range(h)]
    out = Image.new("1", (w, h), 1)
    o = out.load()
    for y in range(h):
        row = px[y]
        for x in range(w):
            old = row[x]
            new = 255 if old >= 128 else 0
            o[x, y] = 1 if new else 0
            err = (old - new) // 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < w and yy < h:
                    px[yy][xx] += err
    return out


def photo_to_1bit(img, size):
    """The real pipeline step: centre-crop to the box, boost contrast, sharpen,
    lift the background a little, then dither."""
    tw, th = size
    img = ImageOps.fit(img.convert("L"), (tw, th), Image.LANCZOS, centering=(0.5, 0.45))
    img = ImageOps.autocontrast(img, cutoff=1)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=140, threshold=2))
    img = img.point(lambda v: min(255, int(v * 0.92 + 30)))  # gamma-ish lift
    return atkinson(img)


def stand_in_photo(seed=0):
    """A grey 'photo' of a small bird on a twig over a blurred background."""
    s = 400
    img = Image.new("L", (s, s), 200)
    d = ImageDraw.Draw(img)
    for i in range(14):  # bokeh blobs
        r = 30 + (i * 37 + seed * 11) % 70
        x, y = (i * 97 + seed * 31) % s, (i * 61 + seed * 17) % s
        d.ellipse((x - r, y - r, x + r, y + r), fill=150 + (i * 23) % 90)
    img = img.filter(ImageFilter.GaussianBlur(28))
    d = ImageDraw.Draw(img)
    d.line((0, 300, 400, 270), fill=60, width=14)                      # twig
    d.line((260, 280, 330, 230), fill=70, width=7)
    d.polygon([(110, 230), (40, 300), (70, 310), (140, 255)], fill=55)  # tail
    d.ellipse((110, 150, 270, 290), fill=120)                           # body
    d.ellipse((150, 200, 265, 285), fill=215)                           # belly
    d.ellipse((115, 170, 220, 260), fill=80)                            # wing
    d.ellipse((215, 105, 305, 195), fill=110)                           # head
    d.polygon([(295, 140), (345, 152), (296, 162)], fill=40)            # beak
    d.ellipse((262, 132, 280, 150), fill=20)                            # eye
    d.ellipse((268, 136, 273, 141), fill=245)
    d.line((185, 285, 180, 300), fill=40, width=5)                      # legs
    d.line((215, 285, 215, 298), fill=40, width=5)
    return img.filter(ImageFilter.GaussianBlur(1.2))


# ------------------------------------------------------------------- icons

ICONS = {  # 12x12, '#' = black
    "Migrant": [
        "............", ".....##.....", ".....###....", "#....####...",
        "##..#######.", "############", "##..#######.", "#....####...",
        ".....###....", ".....##.....", "............", "............"],
    "Resident": [
        ".....##.....", "....####....", "...######...", "..########..",
        ".##########.", "############", ".##......##.", ".##..##..##.",
        ".##..##..##.", ".##..##..##.", ".##########.", "............"],
    "Raptor": [
        "....####....", "..########..", ".####..####.", "####......##",
        "###.........", "###.........", "####........", ".#####......",
        "..######....", "....####....", "......##....", "............"],
    "Nocturnal": [
        "....####....", "..####......", ".####.......", ".###........",
        "####........", "####........", "####........", "####.......#",
        ".####.....##", ".#########..", "..#######...", "....####...."],
    "Waterbird": [
        "............", "............", "............", ".##...##...##",
        "#..#.#..#.#..", "....#....#...", "............", ".##...##...##",
        "#..#.#..#.#..", "....#....#...", "............", "............"],
    "Rare": [
        "............", "...######...", "..#..##..#..", ".#..#..#..#.",
        "############", ".#...##...#.", "..#..##..#..", "...#.##.#...",
        "....####....", ".....##.....", "............", "............"],
    "Dawn Caller": [
        "............", ".....##.....", ".#...##...#.", "..#......#..",
        "....####....", "...######...", "#.########.#", "..########..",
        "############", "............", "############", "............"],
    "Low confidence": [
        "....####....", "...##..##...", "...#....##..", "........##..",
        ".......##...", "......##....", ".....##.....", ".....##.....",
        "............", ".....##.....", ".....##.....", "............"],
    "thermo": [
        "....##......", "...#..#.....", "...#..#.....", "...#..#.....",
        "...#..#.....", "...#..#.....", "...####.....", "..######....",
        ".########...", ".########...", "..######....", "...####....."],
    "drop": [
        ".....#......", ".....#......", "....###.....", "....###.....",
        "...#####....", "..#######...", "..#######...", ".#########..",
        ".#########..", ".#########..", "..#######...", "....###....."],
}


def icon(img, name, x, y, ink=0):
    for j, row in enumerate(ICONS[name]):
        for i, c in enumerate(row[:12]):
            if c == "#":
                img.putpixel((x + i, y + j), ink)


# ------------------------------------------------------------------ helpers

HE_AGO = {"min": "לפני {} דק׳", "hr1": "לפני שעה", "hr": "לפני {} שעות", "day": "אתמול"}


def ago(now, then):
    m = int((now - then).total_seconds() // 60)
    if m < 60:
        return HE_AGO["min"].format(max(m, 1))
    if m < 120:
        return HE_AGO["hr1"]
    if m < 24 * 60:
        return HE_AGO["hr"].format(m // 60)
    return HE_AGO["day"]


def stars(week_count):
    """Rarity for kids: 5 stars = rarely heard."""
    for limit, n in ((3, 5), (10, 4), (40, 3), (150, 2)):
        if week_count < limit:
            return n
    return 1


def star(d, cx, cy, r, filled):
    import math
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=0 if filled else 1, outline=0)


def text(d, xy, s, f, anchor="la", fill=0, rtl=False):
    kw = {"direction": "rtl", "language": "he"} if rtl else {}
    d.text(xy, s, font=f, fill=fill, anchor=anchor, **kw)


def top_bar(img, d, now, temp=23.4, hum=61, inverted=True):
    ink, paper = (1, 0) if inverted else (0, 1)
    d.rectangle((0, 0, W - 1, 19), fill=paper)
    if not inverted:
        d.line((0, 19, W, 19), fill=0)
    icon(img, "thermo", 3, 4, ink)
    text(d, (16, 10), f"{temp:.0f}°", font(15, True), "lm", ink)
    icon(img, "drop", 52, 4, ink)
    text(d, (65, 10), f"{hum}%", font(15, True), "lm", ink)
    text(d, (W - 4, 10), now.strftime("%H:%M"), font(17, True), "rm", ink)


def new_canvas():
    img = Image.new("1", (W, H), 1)
    d = ImageDraw.Draw(img)
    d.fontmode = "1"  # no anti-aliasing: e-paper has no grey
    return img, d


# ------------------------------------------------------------------ layouts

def layout_big_photo(bird, now, idx):
    img, d = new_canvas()
    img.paste(photo_to_1bit(stand_in_photo(idx), (W, 112)), (0, 20))
    top_bar(img, d, now)
    text(d, (W // 2, 148), bird["he_name"], font(24, True), "mm", rtl=True)
    text(d, (W // 2, 170), bird["name"], font(13), "mm")
    d.line((8, 181, W - 8, 181), fill=0)
    x = 6
    for b in bird["badges"][:3]:
        icon(img, b["en"], x, 186)
        x += 15
    text(d, (W - 6, 192), ago(now, datetime.fromisoformat(bird["last_seen"])), font(13, True), "rm", rtl=True)
    return img


def layout_side(bird, now, idx):
    img, d = new_canvas()
    top_bar(img, d, now, inverted=False)
    img.paste(photo_to_1bit(stand_in_photo(idx), (100, 120)), (0, 21))
    d.line((100, 21, 100, 140), fill=0)
    # Hebrew is read right to left: the text column sits on the right.
    words = bird["he_name"].split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font(19, True), direction="rtl", language="he") > 94 and cur:
            lines.append(cur)
            cur = w
        else:
            cur = t
    lines.append(cur)
    y = 36
    for ln in lines[:3]:
        text(d, (W - 4, y), ln, font(19, True), "rm", rtl=True)
        y += 21
    en = bird["name"]
    while d.textlength(en, font=font(11)) > 94:
        en = en[:-2] + "…"
    text(d, (W - 4, y + 2), en, font(11), "rm")
    y += 20
    for b in bird["badges"][:3]:
        icon(img, b["en"], W - 16, y)
        text(d, (W - 20, y + 6), b["he"], font(11), "rm", rtl=True)
        y += 14
    d.rectangle((0, 142, W - 1, 199), fill=1)
    d.line((0, 142, W, 142), fill=0)
    seen = datetime.fromisoformat(bird["last_seen"])
    text(d, (W - 6, 156), "נשמע ב-" + seen.strftime("%H:%M"), font(15, True), "rm", rtl=True)
    text(d, (6, 156), f"#{idx + 1}", font(15, True), "lm")
    text(d, (W // 2, 174), "פעמים השבוע: " + str(bird["week_count"]), font(11), "mm", rtl=True)
    for k in range(10):  # which of the latest 10 this is (1 = newest, on the right)
        cx = W - 14 - k * 19
        if k == idx:
            d.ellipse((cx - 5, 188 - 5, cx + 5, 188 + 5), fill=0)
        else:
            d.ellipse((cx - 3, 188 - 3, cx + 3, 188 + 3), outline=0)
    return img


def layout_trading_card(bird, now, idx):
    img, d = new_canvas()
    top_bar(img, d, now)
    d.rounded_rectangle((3, 23, W - 4, H - 4), radius=10, outline=0, width=2)
    disc = photo_to_1bit(stand_in_photo(idx), (92, 92))
    mask = Image.new("1", (92, 92), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 91, 91), fill=1)
    img.paste(disc, (W // 2 - 46, 28), mask)
    d.ellipse((W // 2 - 47, 27, W // 2 + 46, 120), outline=0, width=2)
    # ribbon with the name
    d.polygon([(10, 124), (W - 11, 124), (W - 4, 136), (W - 11, 148), (10, 148), (3, 136)], fill=0)
    text(d, (W // 2, 136), bird["he_name"], font(20, True), "mm", fill=1, rtl=True)
    text(d, (W // 2, 158), bird["name"], font(12), "mm")
    n = stars(bird["week_count"])
    for k in range(5):
        star(d, W // 2 + 2 * 16 - k * 16, 176, 7, k < n)
    x = 12
    for b in bird["badges"][:2]:
        icon(img, b["en"], x, 170)
        x += 15
    text(d, (W - 12, 188), ago(now, datetime.fromisoformat(bird["last_seen"])), font(11, True), "rm", rtl=True)
    return img


def layout_list(birds, now, sel):
    img, d = new_canvas()
    top_bar(img, d, now)
    text(d, (W // 2, 31), "10 הציפורים האחרונות", font(13, True), "mm", rtl=True)
    y = 41
    for k, b in enumerate(birds[:10]):
        f = font(13, k == sel)
        if k == sel:
            d.rectangle((0, y, W - 1, y + 15), fill=0)
        ink = 1 if k == sel else 0
        text(d, (W - 4, y + 8), b["he_name"], f, "rm", ink, rtl=True)
        text(d, (4, y + 8), datetime.fromisoformat(b["last_seen"]).strftime("%H:%M"), font(12), "lm", ink)
        y += 16
    return img


def layout_new_bird(bird, now, idx):
    img, d = new_canvas()
    top_bar(img, d, now)
    for k in range(0, W, 8):  # confetti edge
        d.rectangle((k, 22 + (k // 8) % 2 * 3, k + 3, 25 + (k // 8) % 2 * 3), fill=0)
    text(d, (W // 2, 42), "ציפור חדשה!", font(22, True), "mm", rtl=True)
    img.paste(photo_to_1bit(stand_in_photo(idx), (120, 96)), (40, 56))
    d.rectangle((39, 55, 160, 152), outline=0)
    text(d, (W // 2, 168), bird["he_name"], font(20, True), "mm", rtl=True)
    text(d, (W // 2, 188), "נשמעה בפעם הראשונה", font(12), "mm", rtl=True)
    return img


def save(img, out, name):
    img.save(f"{out}/{name}.png")
    img.convert("L").resize((W * 3, H * 3), Image.NEAREST).save(f"{out}/{name}@3x.png")


def main():
    data_path, out = sys.argv[1], sys.argv[2]
    now = datetime.fromisoformat(sys.argv[sys.argv.index("--now") + 1]) if "--now" in sys.argv else datetime.now()
    birds = sorted(json.load(open(data_path, encoding="utf-8")), key=lambda b: b["last_seen"], reverse=True)[:10]
    save(layout_big_photo(birds[0], now, 0), out, "a-big-photo")
    save(layout_side(birds[2], now, 2), out, "b-side-card")
    save(layout_trading_card(birds[9], now, 9), out, "c-trading-card")
    save(layout_list(birds, now, 2), out, "d-top10-list")
    save(layout_new_bird(birds[6], now, 6), out, "e-new-bird")
    raw = W * H // 8
    print(f"full screen 1-bit = {raw} bytes; photo box 200x112 = {200 * 112 // 8} bytes")


if __name__ == "__main__":
    main()
