#!/usr/bin/env python3
"""
Generates the official 2500x1686 px Rich Menu graphic for PLODPLOI (ปลดปล่อย).
3 vertical zones:
- Left: แจ้งปัญหา & รีวิว (x: 0, y: 0, w: 833, h: 1686)
- Center: หาห้องน้ำใกล้ฉัน (x: 833, y: 0, w: 834, h: 1686)
- Right: กรองห้องน้ำ (x: 1667, y: 0, w: 833, h: 1686)
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

WIDTH = 2500
HEIGHT = 1686
OUTPUT_PATH = "public/richmenu-2500x1686.png"

FONT_PATH = "/System/Library/Fonts/Supplemental/SukhumvitSet.ttc"
LOGO_PATH = "public/logo-plodploi-circle.png"

def get_font(size, bold=False, medium=False):
    idx = 5 if bold else (3 if medium else 2)
    return ImageFont.truetype(FONT_PATH, size, index=idx)

def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def draw_star(draw, cx, cy, r_outer, r_inner, fill):
    points = []
    for i in range(10):
        r = r_outer if i % 2 == 0 else r_inner
        angle = i * math.pi / 5 - math.pi / 2
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=fill)

def draw_filter_icon(draw, cx, cy, size, fill):
    # Modern filter funnel or slider bars
    # Draw funnel: top horizontal, slopes down to neck, straight down
    w = size
    h = size
    top_y = cy - h//2
    draw.polygon([
        (cx - w//2, top_y),
        (cx + w//2, top_y),
        (cx + w//6, cy + 10),
        (cx + w//6, cy + h//2),
        (cx - w//6, cy + h//2),
        (cx - w//6, cy + 10)
    ], fill=fill)
    # Filter lines
    draw.rectangle([cx - w//2 - 10, top_y - 18, cx + w//2 + 10, top_y - 6], fill=fill)

def main():
    img = Image.new("RGBA", (WIDTH, HEIGHT), (241, 245, 249, 255))
    draw = ImageDraw.Draw(img)

    # 1. Subtle top branding strip
    draw.rectangle([0, 0, WIDTH, 16], fill=(25, 118, 210, 255))

    # Zones definitions
    zones = [
        {"name": "left", "x0": 0, "x1": 833, "w": 833},
        {"name": "mid", "x0": 833, "x1": 1667, "w": 834},
        {"name": "right", "x0": 1667, "x1": 2500, "w": 833},
    ]

    # Draw divider lines
    draw.line([(833, 40), (833, HEIGHT - 40)], fill=(203, 213, 225, 255), width=3)
    draw.line([(1667, 40), (1667, HEIGHT - 40)], fill=(203, 213, 225, 255), width=3)

    margin_x = 44
    margin_top = 70
    margin_bottom = 70
    card_h = HEIGHT - margin_top - margin_bottom

    # ==========================================
    # ZONE 1: LEFT - แจ้งปัญหา & รีวิว
    # ==========================================
    zx0 = zones[0]["x0"] + margin_x
    zx1 = zones[0]["x1"] - margin_x
    draw_rounded_rect(draw, (zx0, margin_top, zx1, margin_top + card_h), radius=48, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=3)

    # Top category tag
    tag_w = 340
    tag_h = 60
    tag_x0 = (zx0 + zx1 - tag_w) // 2
    draw_rounded_rect(draw, (tag_x0, margin_top + 45, tag_x0 + tag_w, margin_top + 45 + tag_h), radius=30, fill=(254, 242, 242, 255))
    f_tag = get_font(32, bold=True)
    draw.text((tag_x0 + tag_w//2, margin_top + 45 + tag_h//2), "📢 ช่วยเหลือ & รายงาน", fill=(220, 38, 38, 255), font=f_tag, anchor="mm")

    # Icon circle
    badge_cy = margin_top + 260
    badge_r = 120
    draw.ellipse([(zones[0]["w"]//2 - badge_r, badge_cy - badge_r), (zones[0]["w"]//2 + badge_r, badge_cy + badge_r)], fill=(254, 243, 199, 255), outline=(252, 211, 77, 255), width=4)
    draw_star(draw, zones[0]["w"]//2, badge_cy - 10, 75, 35, fill=(245, 158, 11, 255))

    # Icon badge details
    f_badge_sub = get_font(28, bold=True)
    draw.text((zones[0]["w"]//2, badge_cy + 75), "REVIEW & REPORT", fill=(180, 83, 9, 255), font=f_badge_sub, anchor="mm")

    # Title
    f_title = get_font(68, bold=True)
    draw.text((zones[0]["w"]//2, margin_top + 460), "แจ้งปัญหา & รีวิว", fill=(18, 59, 102, 255), font=f_title, anchor="mm")

    f_sub = get_font(38, medium=True)
    draw.text((zones[0]["w"]//2, margin_top + 530), "ฟอร์มแจ้งซ่อมและให้คะแนน", fill=(100, 116, 139, 255), font=f_sub, anchor="mm")

    # Info pills
    pill_y = margin_top + 640
    pill_w = zx1 - zx0 - 90
    pill_h = 100
    pill_x0 = zx0 + 45

    items_left = [
        ("⭐ ให้คะแนน & บันทึกรีวิว", "แชร์ประสบการณ์ความสะอาด"),
        ("⚠️ แจ้งปัญหาห้องน้ำชำรุด", "น้ำไม่ไหล ชักโครกตัน กลอนพัง"),
        ("📸 แนบภาพถ่ายหน้างาน", "ส่งตรงให้ผู้ดูแลตึกตรวจสอบ"),
    ]

    for title, desc in items_left:
        draw_rounded_rect(draw, (pill_x0, pill_y, pill_x0 + pill_w, pill_y + pill_h), radius=28, fill=(248, 250, 252, 255), outline=(226, 232, 240, 255), width=2)
        f_pt = get_font(34, bold=True)
        draw.text((pill_x0 + 36, pill_y + 32), title, fill=(30, 41, 59, 255), font=f_pt, anchor="lm")
        f_pd = get_font(26, medium=True)
        draw.text((pill_x0 + 36, pill_y + 70), desc, fill=(100, 116, 139, 255), font=f_pd, anchor="lm")
        pill_y += pill_h + 30

    # Action button
    btn_y1 = margin_top + card_h - 60
    btn_y0 = btn_y1 - 120
    draw_rounded_rect(draw, (zx0 + 60, btn_y0, zx1 - 60, btn_y1), radius=60, fill=(18, 59, 102, 255))
    f_btn = get_font(44, bold=True)
    draw.text(((zx0 + zx1)//2, (btn_y0 + btn_y1)//2), "แตะเพื่อเปิดฟอร์ม ↗", fill=(255, 255, 255, 255), font=f_btn, anchor="mm")


    # ==========================================
    # ZONE 2: CENTER - หาห้องน้ำใกล้ฉัน (HERO)
    # ==========================================
    mid_cx = zones[1]["x0"] + zones[1]["w"] // 2
    zx0_m = zones[1]["x0"] + margin_x
    zx1_m = zones[1]["x1"] - margin_x
    draw_rounded_rect(draw, (zx0_m, margin_top, zx1_m, margin_top + card_h), radius=48, fill=(234, 243, 255, 255), outline=(147, 197, 253, 255), width=4)

    # Top tag
    tag_m_w = 400
    tag_m_x0 = (zx0_m + zx1_m - tag_m_w) // 2
    draw_rounded_rect(draw, (tag_m_x0, margin_top + 45, tag_m_x0 + tag_m_w, margin_top + 45 + tag_h), radius=30, fill=(25, 118, 210, 255))
    draw.text((tag_m_x0 + tag_m_w//2, margin_top + 45 + tag_h//2), "📍 ฟีเจอร์หลัก • แนะนำ", fill=(255, 255, 255, 255), font=f_tag, anchor="mm")

    # Center Logo
    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo_sz = 340
        logo = logo.resize((logo_sz, logo_sz), Image.Resampling.LANCZOS)
        # White circular backing plate
        plate_r = 185
        draw.ellipse([(mid_cx - plate_r, margin_top + 245 - plate_r), (mid_cx + plate_r, margin_top + 245 + plate_r)], fill=(255, 255, 255, 255), outline=(191, 219, 254, 255), width=6)
        img.paste(logo, (mid_cx - logo_sz//2, margin_top + 245 - logo_sz//2), logo)
        # re-get draw after paste
        draw = ImageDraw.Draw(img)

    # Title
    f_hero_title = get_font(74, bold=True)
    draw.text((mid_cx, margin_top + 460), "หาห้องน้ำใกล้ฉัน", fill=(18, 59, 102, 255), font=f_hero_title, anchor="mm")

    f_hero_sub = get_font(40, bold=True)
    draw.text((mid_cx, margin_top + 530), "ค้นหาด้วยตำแหน่ง GPS จริง", fill=(25, 118, 210, 255), font=f_hero_sub, anchor="mm")

    # Hero features
    pill_y = margin_top + 640
    pill_m_w = zx1_m - zx0_m - 90
    pill_m_x0 = zx0_m + 45

    items_mid = [
        ("🎯 รัศมีใกล้ตัวแม่นยำ (150 ม.)", "เรียงตามระยะเดินจริงใน มธ. ท่าพระจันทร์"),
        ("🧭 แสดงแผนที่ & การนำทาง", "กดดูเส้นทางเดินผ่าน Google Maps ทันที"),
        ("⚡ การ์ดห้องน้ำพร้อมใช้อัตโนมัติ", "ส่ง Carousel การ์ดห้องน้ำในแชททันที"),
    ]

    for title, desc in items_mid:
        draw_rounded_rect(draw, (pill_m_x0, pill_y, pill_m_x0 + pill_m_w, pill_y + pill_h), radius=28, fill=(255, 255, 255, 255), outline=(191, 219, 254, 255), width=2)
        f_pt = get_font(34, bold=True)
        draw.text((pill_m_x0 + 36, pill_y + 32), title, fill=(30, 58, 138, 255), font=f_pt, anchor="lm")
        f_pd = get_font(26, medium=True)
        draw.text((pill_m_x0 + 36, pill_y + 70), desc, fill=(71, 85, 105, 255), font=f_pd, anchor="lm")
        pill_y += pill_h + 30

    # Center Action Button
    draw_rounded_rect(draw, (zx0_m + 50, btn_y0, zx1_m - 50, btn_y1), radius=60, fill=(25, 118, 210, 255))
    draw.text((mid_cx, (btn_y0 + btn_y1)//2), "📍 ส่งตำแหน่ง GPS ตอนนี้", fill=(255, 255, 255, 255), font=f_btn, anchor="mm")


    # ==========================================
    # ZONE 3: RIGHT - กรองห้องน้ำ
    # ==========================================
    zx0_r = zones[2]["x0"] + margin_x
    zx1_r = zones[2]["x1"] - margin_x
    right_cx = zones[2]["x0"] + zones[2]["w"] // 2
    draw_rounded_rect(draw, (zx0_r, margin_top, zx1_r, margin_top + card_h), radius=48, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=3)

    # Top tag
    tag_r_w = 340
    tag_r_x0 = (zx0_r + zx1_r - tag_r_w) // 2
    draw_rounded_rect(draw, (tag_r_x0, margin_top + 45, tag_r_x0 + tag_r_w, margin_top + 45 + tag_h), radius=30, fill=(240, 253, 244, 255))
    draw.text((tag_r_x0 + tag_r_w//2, margin_top + 45 + tag_h//2), "⚡ ค้นหาแบบเฉพาะเจาะจง", fill=(22, 101, 52, 255), font=f_tag, anchor="mm")

    # Icon circle
    draw.ellipse([(right_cx - badge_r, badge_cy - badge_r), (right_cx + badge_r, badge_cy + badge_r)], fill=(236, 253, 245, 255), outline=(110, 231, 183, 255), width=4)
    draw_filter_icon(draw, right_cx, badge_cy - 10, 110, fill=(16, 185, 129, 255))

    draw.text((right_cx, badge_cy + 75), "FILTER & OPTIONS", fill=(4, 120, 87, 255), font=f_badge_sub, anchor="mm")

    # Title
    draw.text((right_cx, margin_top + 460), "กรองห้องน้ำ", fill=(18, 59, 102, 255), font=f_title, anchor="mm")
    draw.text((right_cx, margin_top + 530), "เลือกสิ่งอำนวยความสะดวก", fill=(100, 116, 139, 255), font=f_sub, anchor="mm")

    # Info pills
    pill_y = margin_top + 640
    pill_r_w = zx1_r - zx0_r - 90
    pill_r_x0 = zx0_r + 45

    items_right = [
        ("♿ ห้องน้ำคนพิการ & ทางลาด", "รองรับผู้ใช้วีลแชร์เข้าถึงง่าย"),
        ("💦 มีสายฉีดชำระ / สุขภัณฑ์พร้อม", "ตรวจสอบอุปกรณ์ก่อนเดินไป"),
        ("🕒 เปิดตลอด 24 ชั่วโมง", "สำหรับอ่านหนังสือ / ทำงานดึก"),
    ]

    for title, desc in items_right:
        draw_rounded_rect(draw, (pill_r_x0, pill_y, pill_r_x0 + pill_r_w, pill_y + pill_h), radius=28, fill=(248, 250, 252, 255), outline=(226, 232, 240, 255), width=2)
        f_pt = get_font(34, bold=True)
        draw.text((pill_r_x0 + 36, pill_y + 32), title, fill=(30, 41, 59, 255), font=f_pt, anchor="lm")
        f_pd = get_font(26, medium=True)
        draw.text((pill_r_x0 + 36, pill_y + 70), desc, fill=(100, 116, 139, 255), font=f_pd, anchor="lm")
        pill_y += pill_h + 30

    # Right Action Button
    draw_rounded_rect(draw, (zx0_r + 60, btn_y0, zx1_r - 60, btn_y1), radius=60, fill=(18, 59, 102, 255))
    draw.text(((zx0_r + zx1_r)//2, (btn_y0 + btn_y1)//2), "เลือกตัวกรองค้นหา ⚙️", fill=(255, 255, 255, 255), font=f_btn, anchor="mm")

    # Save image as RGB JPEG/PNG < 1MB
    # Converting to RGB for JPEG or optimized PNG
    rgb_img = Image.new("RGB", (WIDTH, HEIGHT), (241, 245, 249))
    rgb_img.paste(img, mask=img.split()[3]) # paste with alpha
    
    # Save optimized JPEG
    jpg_path = "public/richmenu-2500x1686.jpg"
    rgb_img.save(jpg_path, "JPEG", quality=92, optimize=True)
    jpg_size = os.path.getsize(jpg_path)
    print(f"Saved JPEG: {jpg_path} ({jpg_size:,} bytes = {jpg_size / 1024:.1f} KB)")

    # Also save PNG
    rgb_img.save(OUTPUT_PATH, "PNG", optimize=True)
    png_size = os.path.getsize(OUTPUT_PATH)
    print(f"Saved PNG: {OUTPUT_PATH} ({png_size:,} bytes = {png_size / 1024:.1f} KB)")

if __name__ == "__main__":
    main()
