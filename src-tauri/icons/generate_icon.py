#!/usr/bin/env python3
"""
EchoWord Icon Generator
生成现代简约风格的应用图标
"""

from PIL import Image, ImageDraw, ImageFont
import math

def create_gradient_background(size):
    """创建渐变背景"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 渐变色: emerald -> cyan -> blue
    colors = [
        (16, 185, 129),   # emerald-500
        (6, 182, 212),    # cyan-500
        (59, 130, 246),   # blue-500
    ]

    for y in range(size):
        # 计算当前行的颜色
        ratio = y / size
        if ratio < 0.5:
            # emerald -> cyan
            t = ratio * 2
            r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * t)
            g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * t)
            b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * t)
        else:
            # cyan -> blue
            t = (ratio - 0.5) * 2
            r = int(colors[1][0] + (colors[2][0] - colors[1][0]) * t)
            g = int(colors[1][1] + (colors[2][1] - colors[1][1]) * t)
            b = int(colors[1][2] + (colors[2][2] - colors[1][2]) * t)

        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    return img

def create_rounded_mask(size, radius):
    """创建圆角蒙版"""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
    return mask

def draw_wave_pattern(draw, size):
    """绘制声波纹理"""
    wave_color = (255, 255, 255, 38)  # 15% opacity

    for i in range(5):
        y_base = size * (0.3 + i * 0.1)
        amplitude = size * (0.08 - i * 0.01)
        frequency = 3 + i * 0.5

        points = []
        for x in range(0, size + 2, 2):
            wave = math.sin((x / size) * math.pi * frequency) * amplitude
            y = y_base + wave
            points.append((x, y))

        if len(points) > 1:
            draw.line(points, fill=wave_color, width=int(size * 0.015))

def draw_letter_e(draw, size):
    """绘制现代几何风格的字母 E"""
    center_x = size * 0.5
    center_y = size * 0.55
    letter_size = size * 0.35

    line_width = letter_size * 0.7
    line_height = letter_size * 0.08
    spacing = letter_size * 0.35

    fill_color = (255, 255, 255, 242)  # 95% opacity

    # 上横线
    draw.rounded_rectangle(
        [(center_x - line_width/2, center_y - spacing),
         (center_x + line_width/2, center_y - spacing + line_height)],
        radius=line_height/2,
        fill=fill_color
    )

    # 中横线 (稍短)
    mid_width = line_width * 0.6
    draw.rounded_rectangle(
        [(center_x - line_width/2, center_y - line_height/2),
         (center_x - line_width/2 + mid_width, center_y + line_height/2)],
        radius=line_height/2,
        fill=fill_color
    )

    # 下横线
    draw.rounded_rectangle(
        [(center_x - line_width/2, center_y + spacing - line_height),
         (center_x + line_width/2, center_y + spacing)],
        radius=line_height/2,
        fill=fill_color
    )

    # 左竖线
    draw.rounded_rectangle(
        [(center_x - line_width/2, center_y - spacing),
         (center_x - line_width/2 + line_height, center_y + spacing)],
        radius=line_height/2,
        fill=fill_color
    )

def generate_icon(size, output_path):
    """生成指定尺寸的图标"""
    # 创建渐变背景
    img = create_gradient_background(size)

    # 应用圆角蒙版
    radius = int(size * 0.18)
    mask = create_rounded_mask(size, radius)
    img.putalpha(mask)

    # 绘制声波纹理
    draw = ImageDraw.Draw(img, 'RGBA')
    draw_wave_pattern(draw, size)

    # 绘制字母 E
    draw_letter_e(draw, size)

    # 保存
    img.save(output_path, 'PNG')
    print(f'Generated: {output_path} ({size}x{size})')

def generate_ico(sizes, output_path):
    """生成 Windows ICO 文件"""
    images = []
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))

        # 创建渐变背景
        temp = create_gradient_background(size)
        radius = int(size * 0.18)
        mask = create_rounded_mask(size, radius)
        temp.putalpha(mask)

        # 绘制声波和字母
        draw = ImageDraw.Draw(temp, 'RGBA')
        draw_wave_pattern(draw, size)
        draw_letter_e(draw, size)

        images.append(temp)

    # 保存为 ICO
    images[0].save(output_path, format='ICO', sizes=[(s, s) for s in sizes])
    print(f'Generated: {output_path} (multi-size ICO)')

if __name__ == '__main__':
    # 生成各种尺寸的 PNG
    sizes = [32, 64, 128, 256, 512, 1024]
    for size in sizes:
        generate_icon(size, f'icon-{size}.png')

    # 生成 128@2x
    generate_icon(256, 'icon-128@2x.png')

    # 生成主图标
    generate_icon(1024, 'icon.png')

    # 生成 ICO (Windows)
    generate_ico([16, 32, 48, 64, 128, 256], 'icon.ico')

    # 生成标准尺寸
    generate_icon(32, '32x32.png')
    generate_icon(64, '64x64.png')
    generate_icon(128, '128x128.png')
    generate_icon(256, '128x128@2x.png')

    print('\n✅ All icons generated successfully!')
