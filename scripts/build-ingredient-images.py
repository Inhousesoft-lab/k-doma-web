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


def build(path: str) -> Image.Image:
    im = Image.open(path).convert('RGB')
    return im.resize((SIZE, SIZE), Image.LANCZOS)


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
