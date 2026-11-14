"""재료 이미지 배포용 변환: assets/ingredients-src/*.png (512 원본) → public/images/ingredients/*.webp (192)

실행: python3 scripts/build-ingredient-images.py   (필요: pip install pillow)
원본을 추가·교체한 뒤 다시 실행하면 전체를 새로 만든다.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'ingredients-src')
OUT = os.path.join(ROOT, 'public', 'images', 'ingredients')
SIZE = 192      # 48px 타일 × 3배 화면
QUALITY = 82

# 크기 맞추기: 재료(그림자 포함)의 테두리 상자를 기준으로 화면 차지 정도를 비슷하게 맞춘다
WHITE_DIFF = 10     # 흰색과 이 값 넘게 다르면 재료로 본다(옅은 그림자 포함)
TARGET_AREA = 0.62  # 테두리 상자 넓이 / 전체 넓이 목표
MAX_SIDE = 0.90     # 긴 변 최대 비율(여백 5%씩). 병처럼 가는 재료는 여기서 멈춘다


def build(path: str) -> Image.Image:
    im = Image.open(path).convert('RGB')
    w, h = im.size
    mask = im.point(lambda v: 255 if v < 255 - WHITE_DIFF else 0).convert('L')
    bbox = mask.getbbox()
    if not bbox:
        return im.resize((SIZE, SIZE), Image.LANCZOS)
    obj = im.crop(bbox)
    ow, oh = obj.size
    scale_area = (TARGET_AREA * w * h / (ow * oh)) ** 0.5
    scale_fit = MAX_SIDE * min(w / ow, h / oh)
    k = min(scale_area, scale_fit) * SIZE / w
    nw, nh = max(1, round(ow * k)), max(1, round(oh * k))
    canvas = Image.new('RGB', (SIZE, SIZE), (255, 255, 255))
    canvas.paste(obj.resize((nw, nh), Image.LANCZOS), ((SIZE - nw) // 2, (SIZE - nh) // 2))
    return canvas


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.webp'):
            os.remove(os.path.join(OUT, f))
    total = 0
    files = sorted(f for f in os.listdir(SRC) if f.endswith('.png'))
    for f in files:
        dst = os.path.join(OUT, f[:-4] + '.webp')
        build(os.path.join(SRC, f)).save(dst, 'WEBP', quality=QUALITY, method=6)
        total += os.path.getsize(dst)
    print(f'{len(files)}개 변환, 합계 {total // 1024}KB')


if __name__ == '__main__':
    main()
