# 재료 이미지 AI 생성 프롬프트

냉장고·재료 추가 화면의 재료 이미지(노션 '냉장고' 10장)를 만드는 프롬프트.
도구에 상관없이 쓸 수 있게 영어 프롬프트로 쓴다(이미지 모델은 영어가 결과가 안정적).

## 1. 작업 순서

1. 아래 **공통 틀**의 `{SUBJECT}` 자리에 3장 표의 SUBJECT를 넣는다.
2. 정사각형(1:1)으로 만든다. 1024×1024 이상이면 된다.
3. 마음에 드는 1장을 골라 **512×512 PNG**로 줄여 `assets/ingredients-src/{imageKey}.png`에 저장한다.
   - 파일 이름은 `src/data/ingredients.json`의 `imageKey`와 같아야 한다.
4. `python3 scripts/build-ingredient-images.py` 실행 → `public/images/ingredients/{imageKey}.webp`(192px) 생성.
   - 여백 자르기·크기 맞추기는 스크립트가 한다. 생성할 때 크기를 정확히 맞출 필요는 없다.
5. 앱에서 냉장고 아이콘형(48px)으로 확인한다. 이름을 가리고도 무엇인지 알아보면 통과.

## 2. 공통 틀

### 프롬프트

```
A single {SUBJECT}, photorealistic studio product photograph, centered,
isolated on a pure white background (#FFFFFF), soft diffused lighting from the top left,
a subtle soft contact shadow directly beneath, three-quarter front view from slightly above (about 30 degrees),
sharp focus, natural true-to-life colors, the subject fills about 70% of the frame with even margins,
no text, no labels, no logos, no brand packaging, no hands, no props, no table surface,
square 1:1 composition
```

### 네거티브 프롬프트(지원하는 도구만)

```
text, letters, numbers, label text, logo, brand name, trademark, watermark, signature,
multiple different ingredients, cutting board, wooden table, plate (unless specified), utensils, hands,
colored background, gradient background, patterned background, harsh shadow, reflection floor,
cartoon, illustration, 3d render, clay, pixel art, flat icon, blurry, cropped subject, out of frame
```

### 스타일 규칙(노션 10.2)

| 규칙 | 이유 |
|---|---|
| 흰 배경(투명 아님) | 앱에서 `mix-blend-multiply`로 타일 배경색에 섞는다 |
| 재료 하나만, 가운데 | 48px에서 알아보려면 하나만 있어야 한다 |
| 같은 각도·조명·그림자 | 그리드에 섞였을 때 따로 놀지 않게 |
| 글자·로고·상표 없음 | 상표 문제. 병 라벨은 **빈 흰 라벨**까지만 허용 |
| 양념은 병·통으로 | 내용물 색 + 병 모양·뚜껑 색으로 구분(4장) |

## 3. 재료별 SUBJECT (현재 이미지 기준, 71개)

지금 들어가 있는 이미지와 같은 모양이 나오게 쓴 문구다. 이미지를 다시 만들 때 그대로 쓴다.

### 3.1 양념 선반(SEASONING)

| imageKey | 재료 | SUBJECT |
|---|---|---|
| soy_sauce | 간장 | slim glass bottle of dark soy sauce with a red cap, blank white label |
| chili_paste | 고추장 | red plastic rectangular tub of Korean red chili paste (gochujang) with a closed red lid |
| soybean_paste | 된장 | brown plastic rectangular tub of Korean soybean paste (doenjang) with a closed brown lid |
| ssamjang | 쌈장 | green plastic rectangular tub of Korean ssamjang dipping paste with a closed green lid |
| chili_powder | 고춧가루 | small heap of coarse Korean red chili flakes (gochugaru) |
| sesame_oil | 참기름 | small glass bottle of golden amber sesame oil with a gold cap, no label |
| perilla_oil | 들기름 | small glass bottle of dark amber perilla oil with a gold cap, blank white label |
| sugar | 설탕 | glass shaker with a steel top filled with white granulated sugar |
| salt | 소금 | glass shaker with a steel top filled with fine white salt |
| vinegar | 식초 | glass bottle of pale yellow clear vinegar with a gold cap, no label |
| cooking_wine | 맛술 | slim glass bottle of clear rice cooking wine (mirin) with a gold cap, blank white label |
| garlic_minced | 다진마늘 | small glass jar with a gold lid filled with minced garlic |
| ginger_minced | 다진생강 | small glass jar with a gold lid filled with minced ginger |
| black_pepper | 후추 | wooden pepper mill with a clear body filled with black peppercorns |
| syrup | 올리고당 | squeeze bottle of golden clear corn syrup with a yellow cap, no label |
| oyster_sauce | 굴소스 | small glass bottle of dark brown oyster sauce with a gold cap, blank white label |
| ketchup | 케첩 | red squeeze bottle of tomato ketchup with a white cap, plain label |
| mayonnaise | 마요네즈 | soft plastic squeeze bottle of mayonnaise with a yellow cap, no label |
| fish_sauce | 멸치액젓 | glass bottle of reddish-brown anchovy fish sauce with a gold cap, blank white label |
| tuna_fish_sauce | 참치액젓 | glass bottle of amber tuna fish sauce with a gold cap, blank white label |
| sesame_seeds | 통깨 | small heap of toasted sesame seeds |
| olive_oil | 올리브유 | glass bottle of green-gold olive oil with a gold cap, no label |
| cooking_oil | 식용유 | plastic bottle of yellow cooking oil with a yellow cap, blank white label |
| pancake_mix | 부침가루 | small heap of white Korean pancake flour mix powder |
| broth_coin | 코인육수 | several round dried broth tablets (coin broth) in front of a plain resealable pouch, no text |
| salted_shrimp | 새우젓 | glass jar of Korean salted fermented tiny shrimp (saeujeot), no lid |

### 3.2 냉장고(FRIDGE)

| imageKey | 재료 | SUBJECT |
|---|---|---|
| onion | 양파 | whole yellow onion with golden brown skin |
| scallion | 대파 | single stalk of Korean green onion (daepa) with white stem and green leaves, diagonal |
| egg | 계란 | single brown chicken egg |
| tofu | 두부 | block of firm white tofu |
| kimchi | 김치 | small mound of Korean napa cabbage kimchi |
| milk | 우유 | plain white milk carton, no print |
| shrimp | 새우 | three raw whole shrimp with heads, stacked |
| rice_cake | 떡 | pile of cylindrical Korean rice cake sticks (tteokbokki tteok) |
| rice_cake_slices | 떡국떡 | pile of thin oval sliced Korean rice cakes (tteokguk tteok) |
| potato | 감자 | single whole potato |
| squid | 오징어 | whole raw squid with tentacles, diagonal |
| fish_cake | 어묵 | stack of flat square Korean fish cake sheets (eomuk) |
| bean_sprouts | 콩나물 | small heap of soybean sprouts with yellow heads |
| zucchini | 애호박 | single Korean zucchini (aehobak), light green |
| mushroom | 버섯 | three shiitake mushrooms |
| button_mushroom | 양송이버섯 | group of white button mushrooms, one cut in half |
| enoki | 팽이버섯 | bunch of enoki mushrooms |
| carrot | 당근 | single carrot with green leafy top, diagonal |
| spinach | 시금치 | bunch of fresh spinach |
| clam | 바지락 | small pile of fresh Manila clams in shell |
| bacon | 베이컨 | several raw bacon strips, stacked |
| dumpling | 만두 | three Korean dumplings (mandu) |
| radish | 무 | whole Korean white radish (mu) with green top |
| chili_pepper | 청양고추 | two small hot green Korean chili peppers (cheongyang) |
| green_chili | 고추 | single long mild green chili pepper |
| canned_tuna | 참치캔 | opened plain silver tin can of tuna with the lid peeled back, no label |
| cabbage | 양배추 | whole green cabbage head |
| laver | 김 | small stack of roasted seasoned seaweed sheets (gim) |
| spam | 스팸 | plain unlabeled rectangular can of luncheon meat with several pink slices in front |
| apple | 사과 | single red apple with a leaf |
| somen | 소면 | upright bundle of dry thin white somen noodles tied with a band |
| cucumber | 오이 | single Korean cucumber, diagonal |
| pasta | 파스타면 | upright bundle of dry spaghetti tied with twine |
| rice | 쌀 | small heap of uncooked white short-grain rice |
| mackerel | 고등어 | whole raw mackerel, diagonal |
| garlic | 마늘 | whole garlic bulb |
| chicken_breast | 닭가슴살 | two raw boneless chicken breasts |
| bread | 식빵 | loaf of white sandwich bread with a few slices cut |
| beef_brisket | 차돌박이 | thin slices of raw marbled beef brisket (chadolbagi), layered |
| beef_short_plate | 우삼겹 | rolled thin slices of raw marbled beef short plate (usamgyeop) |
| pork_shoulder | 돼지고기 앞다리살 | raw pork shoulder block with a few cubes cut for stew |
| pork_belly | 돼지고기 삼겹살 | three thick strips of raw pork belly (samgyeopsal), stacked |
| instant_rice | 즉석밥 | white microwavable rice tray with the film partly peeled, cooked rice visible, no print |
| sliced_cheddar | 슬라이스 체다치즈 | stack of orange cheddar cheese slices, slightly fanned |
| butter | 버터 | block of butter with one piece cut, on its opened plain wrapper |

> 돼지고기(pork)·소고기(beef)·닭고기(chicken)·치즈(cheese)는 재료 사전에서 빠질 예정이라 만들지 않는다.

### 3.3 추가 예정(재료 사전 미등록)

이미지를 먼저 만들고, 재료 사전(`src/data/ingredients.json`)에 등록할 때 아래 값을 쓴다.
**등록됨** 표시는 이미 사전에 들어간 항목이다(실제 id·별칭은 사전 기준). 다음 새 id는 `m_ing_178`부터.

| imageKey | 재료 | 사전 등록안 | SUBJECT |
|---|---|---|---|
| pear_juice | 배 음료(갈아만든 배 238ml 1캔) | **등록됨** id `m_ing_164`, name `배 음료`, zone `FRIDGE`, aliases `["갈아만든배", "갈아만든 배", "배음료", "배주스"]` | 아래 전용 프롬프트 |
| pork_ribs | 돼지갈비 | **등록됨** id `m_ing_167`, name `돼지갈비`, zone `FRIDGE`, aliases `["돼지 갈비", "찜갈비", "돼지갈비찜용"]` | several raw pork spare rib pieces cut for braising, pink meat with white bones visible at the cut ends, loosely piled |
| pork_back_ribs | 돼지등갈비 | **등록됨** id `m_ing_168`, name `돼지등갈비`, zone `FRIDGE`, aliases `["등갈비", "돼지 등갈비"]` | one whole raw rack of pork baby back ribs, long curved row of parallel bones with meat on top, lying diagonally |
| chicken_stew_cut | 닭볶음탕용 닭 | **등록됨** id `m_ing_166`, name `닭볶음탕용 닭`, zone `FRIDGE`, aliases `["토막닭", "닭볶음탕용 닭고기", "볶음탕용 닭"]` | pile of raw whole chicken cut into bone-in pieces for stew (drumsticks, wings, thighs), pale pink skin-on, loosely piled |
| shishito_pepper | 꽈리고추 | **등록됨** id `m_ing_169`, name `꽈리고추`, zone `FRIDGE`, aliases `["꽈리 고추"]` | small pile of fresh bright green shishito peppers, short and wrinkled with crinkly skin and green stems |
| dried_baby_anchovy | 잔멸치 | **등록됨** id `m_ing_170`, name `잔멸치`, zone `FRIDGE`, aliases `["잔 멸치", "지리멸치", "볶음멸치", "세멸치"]` | small heap of tiny dried silvery baby anchovies (jan-myeolchi), each about 2cm long |
| ~~starch_syrup~~ | 물엿 | **만들지 않음** — 올리고당(`m_ing_13`)과 합침. 별칭 `["물엿", "쌀엿", "조청"]`로 처리하고 아이콘은 `syrup` 사용 (2026-11-14 사용자 결정). id `m_ing_171`은 비워둔다 | - |
| perilla_leaf | 깻잎 | **등록됨** id `m_ing_165`, name `깻잎`, zone `FRIDGE`, aliases `["깻잎순"]` | small neat stack of fresh green Korean perilla leaves (kkaennip), slightly fanned so the serrated edges and pointed tips are visible |
| pork_belly_skin_on | 껍질 붙은 통삼겹 | **등록됨** id `m_ing_172`, name `껍질 붙은 통삼겹`, zone `FRIDGE`, aliases `["돼지 껍질 붙은 통삼겹", "오겹살", "통오겹살", "껍데기 붙은 통삼겹"]` | one thick rectangular block of raw skin-on pork belly, pale skin on top and layered meat and fat visible on the side |
| honey | 꿀 | **등록됨** id `m_ing_173`, name `꿀`, zone `SEASONING`, aliases `["벌꿀", "아카시아꿀"]` | clear glass jar of golden honey with a wooden honey dipper resting on top, a thick drip running down the side, no label |
| beef_bulgogi | 불고깃감 소고기 | **등록됨** id `m_ing_174`, name `불고깃감 소고기`, zone `FRIDGE`, aliases `["불고기용 소고기", "불고깃감", "불고기감", "소고기 불고기용"]` | loose pile of thin raw beef slices for bulgogi, bright red with light marbling, softly folded |
| ginger | 생강 | **등록됨** id `m_ing_175`, name `생강`, zone `FRIDGE`, aliases `["통생강", "생강 1톨"]`. 다진생강(`m_ing_153`, `ginger_minced`)과는 별도 | one fresh knobby ginger root with light tan skin, a small piece cut off showing pale yellow flesh |
| eggplant | 가지 | **등록됨** id `m_ing_176`, name `가지`, zone `FRIDGE`, aliases `[]` | two long glossy dark purple Korean eggplants with green calyx, crossed |
| potato_starch | 감자전분 | **등록됨** id `m_ing_177`, name `감자전분`, zone `SEASONING`, aliases `["전분", "녹말가루", "감자녹말", "전분가루"]` (이미지 아직 없음) | clear plastic bag of fine white potato starch powder, top folded open, a small mound of powder spilled in front, no label |

- **물엿**: 따로 등록하지 않고 올리고당(`m_ing_13`)의 별칭으로 둔다(2026-11-14 사용자 결정).
- 캔 디자인(색·배 그림·빨간 배지)은 실제 상품대로 쓰고 **'갈아만든 배' 로고 글자만 뺀다**(2026-11-14 사용자 결정, 저작권 문제 없음 확인). 캔 하나만, 옆에 배를 두지 않는다.
- imageKey·재료명은 일반명(`pear_juice`, 배 음료)으로 두고 상품명은 별칭에만 넣는다.

#### pear_juice 전용 프롬프트

```
A single slim 238ml aluminum beverage can of Korean pear juice, standing upright, photorealistic studio product photograph, centered,
can design: glossy ivory cream body, realistic yellow-green Asian pear with green leaves illustrated on the upper left,
a halved pear showing white flesh and seeds illustrated on the lower right,
a large red scalloped starburst badge in the center left completely blank with no lettering,
a thin dark maroon horizontal band below the badge left blank, silver aluminum top and bottom rim,
isolated on a pure white background (#FFFFFF), soft diffused lighting from the top left,
a subtle soft contact shadow directly beneath, three-quarter front view from slightly above (about 30 degrees),
sharp focus, natural true-to-life colors, the can fills about 70% of the frame height with even margins,
no text, no letters, no logo, no brand name, no numbers on the can, no hands, no props, no fruit beside the can, no table surface,
square 1:1 composition
```

- 네거티브: 공통 틀 + `korean text, hangul, english text, fruit next to can, multiple cans`
- 글자가 조금이라도 생기면 다시 생성한다. 빨간 배지·갈색 띠는 비어 있어야 한다.

## 4. 2차 다시 만들 대상

48px에서 서로 헷갈리거나 상표가 떠오르는 이미지. **2차 단계에서 진행.**
2차는 "양념은 병 모양 통일" 규칙을 풀어 **병 모양·뚜껑 색·크기로 구분**한다(노션 10.2 변경 필요).

### 4.1 헷갈리는 묶음

| 묶음 | 문제 | 새 SUBJECT |
|---|---|---|
| 참기름 sesame_oil | 호박색 병 4개가 같아 보임 | short round squat glass bottle of golden sesame oil with a **red** cap, a few toasted sesame seeds scattered in front |
| 들기름 perilla_oil | 〃 | tall square glass bottle of dark green-brown perilla oil with a **green** cap, no label |
| 멸치액젓 fish_sauce | 〃 | wide plastic jug with a handle filled with dark reddish-brown anchovy fish sauce, **blue** cap, blank label |
| 참치액젓 tuna_fish_sauce | 〃 | slim tall glass bottle of light amber tuna fish sauce with a **black** cap, blank label |
| 식초 vinegar | 맛술과 같아 보임 | tall slim clear plastic bottle of pale yellow vinegar with a **white** flip cap, no label |
| 맛술 cooking_wine | 〃 | short wide glass bottle of clear rice cooking wine with a **silver** screw cap, blank label |
| 소금 salt | 설탕과 같은 통 | small heap of coarse white sea salt crystals in a small white ceramic bowl |
| 설탕 sugar | 〃 | small stack of white sugar cubes with granulated sugar spilled around |
| 다진마늘 garlic_minced | 다진생강과 같은 병 | small mound of minced garlic with one whole peeled garlic clove beside it |
| 다진생강 ginger_minced | 〃 | small mound of minced ginger with a piece of fresh ginger root beside it |

### 4.2 상표가 떠오르는 이미지

| imageKey | 문제 | 새 SUBJECT |
|---|---|---|
| spam | 파란 캔 + 노란 뚜껑이 특정 상품과 비슷 | several pink slices of luncheon meat fanned out, **no can** |
| canned_tuna | 노랑·파랑 띠가 특정 상품과 비슷 | opened plain **silver** tin can with no label, chunks of tuna visible inside |
| ketchup | 라벨 모양이 특정 상품과 비슷(현재는 예외로 둠) | red squeeze bottle of tomato ketchup with a red cap, **no label** |

### 4.3 병이 가늘어 48px에서 작게 보이는 문제

긴 변이 이미 이미지 높이의 약 95%라 스크립트로는 더 키울 수 없다. 다시 만들 때 SUBJECT 앞에 아래를 붙인다.

```
short and wide bottle, compact proportions,
```

## 5. 확인 기준

- [ ] 48px 타일에서 이름 없이 알아볼 수 있다
- [ ] 같은 묶음(4.1) 안에서 서로 구분된다
- [ ] 글자·로고가 없다(빈 라벨은 허용)
- [ ] 배경이 순백이고 그림자가 옅다
- [ ] 다른 이미지 옆에 두어도 각도·조명이 어긋나지 않는다
