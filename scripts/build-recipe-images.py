"""레시피 사진 배포용 변환: assets/recipes-src/*.jpg|png (원본) → public/images/recipes/*.webp (가로 최대 800px)

실행: python3 scripts/build-recipe-images.py   (필요: pip install pillow)
사진을 추가·교체할 때는 원본을 assets/recipes-src/{레시피id}.jpg 로 넣고 다시 실행한 뒤,
recipes.json 의 photoUrl 은 /images/recipes/{레시피id}.webp 로 적는다.
같은 이름으로 사진을 바꾸면 브라우저 캐시(최대 7일, public/_headers) 때문에 예전 사진이 보일 수 있다 → 새 이름 권장.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'recipes-src')
OUT = os.path.join(ROOT, 'public', 'images', 'recipes')
MAX_SIDE = 800  # 상세 화면 전체 폭(약 390px) × 2배 화면
QUALITY = 75


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.webp'):
            os.remove(os.path.join(OUT, f))
    before = after = 0
    files = sorted(f for f in os.listdir(SRC) if f.lower().endswith(('.jpg', '.jpeg', '.png')))
    for f in files:
        src = os.path.join(SRC, f)
        im = Image.open(src).convert('RGB')
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        dst = os.path.join(OUT, os.path.splitext(f)[0] + '.webp')
        im.save(dst, 'WEBP', quality=QUALITY, method=6)
        before += os.path.getsize(src)
        after += os.path.getsize(dst)
    print(f'{len(files)}개 변환, {before // 1024}KB → {after // 1024}KB')


if __name__ == '__main__':
    main()
