"""재료 사전 검사: src/data/ingredients.json

실행: python3 scripts/check-ingredients.py   (문제가 있으면 종료 코드 1)
- id·imageKey 중복
- zone·category 값
- 이름·별칭이 다른 재료와 겹치는지(띄어쓰기 무시)
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZONES = {'SEASONING', 'FRIDGE'}
CATEGORIES = {'SAUCE', 'MEAT', 'SEAFOOD', 'PRODUCE', 'GRAIN', 'DAIRY', 'ETC'}


def norm(s: str) -> str:
    return re.sub(r'\s+', '', s)


def main() -> int:
    items = json.load(open(os.path.join(ROOT, 'src', 'data', 'ingredients.json'), encoding='utf-8'))
    errors = []
    seen_id, seen_key, seen_name = {}, {}, {}
    for i in items:
        label = f"{i.get('id')} {i.get('name')}"
        for field, seen in (('id', seen_id), ('imageKey', seen_key)):
            v = i.get(field)
            if v in seen:
                errors.append(f'{field} 중복: {v} ({seen[v]} / {label})')
            seen[v] = label
        if i.get('zone') not in ZONES:
            errors.append(f"zone 값 오류: {label} → {i.get('zone')}")
        if i.get('category') not in CATEGORIES:
            errors.append(f"category 값 오류: {label} → {i.get('category')}")
        for n in [i['name']] + i.get('aliases', []):
            k = norm(n)
            if k in seen_name and seen_name[k] != label:
                errors.append(f'이름·별칭 겹침: "{n}" ({seen_name[k]} / {label})')
            seen_name.setdefault(k, label)
    for e in errors:
        print(e)
    print(f'재료 {len(items)}개, 문제 {len(errors)}개')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
