# 재료 이미지 AI 생성 프롬프트

냉장고·재료 추가 화면의 재료 이미지(노션 '냉장고' 10장)를 만드는 프롬프트.
노션 사본: '냉장고 > 냉장고 아이템 AI 생성' 페이지. 이 파일과 함께 고친다.
도구에 상관없이 쓸 수 있게 영어 프롬프트로 쓴다(이미지 모델은 영어가 결과가 안정적).

## 1. 작업 순서

### 1.1 이미지 만들기(재료 사전에 이미 있는 재료)

지금 재료 사전 170개는 모두 등록돼 있다. 이미지가 없는 98개(3.3장 + 굵은 소금)는 앱에서 회색 칸('AI')으로 보인다. 이미지만 넣으면 된다.

1. 아래 **공통 틀**의 `{SUBJECT}` 자리에 3장 표의 SUBJECT를 넣는다.
2. 정사각형(1:1)으로 만든다. 1024×1024 이상이면 된다.
3. 마음에 드는 1장을 골라 **512×512 PNG**로 줄여 `assets/ingredients-src/{imageKey}.png`에 저장한다.
   - 파일 이름은 `src/data/ingredients.json`의 `imageKey`와 같아야 한다.
4. `python3 scripts/build-ingredient-images.py` 실행 → `public/images/ingredients/{imageKey}.webp`(192px) 생성.
   - 필요: `pip install pillow`
   - 여백 자르기·크기 맞추기는 스크립트가 한다. 생성할 때 크기를 정확히 맞출 필요는 없다.
   - 원본 전체를 다시 변환하므로 여러 장을 넣고 한 번만 실행해도 된다.
5. 앱에서 냉장고 아이콘형(48px)으로 확인한다. 이름을 가리고도 무엇인지 알아보면 통과.
6. `assets/ingredients-src/*.png`와 `public/images/ingredients/*.webp`를 함께 커밋한다. 코드 수정은 필요 없다.

### 1.2 새 재료 추가(재료 사전에 없는 재료)

1. imageKey(영문 소문자·밑줄)·이름·구역·별칭을 정해 3.3장 표에 한 줄 추가한다. id는 마지막 번호 다음(`m_ing_264`부터).
   - 기존 재료와 다른 재료면 기존 재료 별칭에 겹치는 이름이 없는지 확인한다(예: 대파 ≠ 쪽파).
2. 같은 값으로 `src/data/ingredients.json`에 추가한다. 이미지가 없어도 등록하면 앱에서 회색 칸으로 보인다.
3. 이미지는 1.1 순서로 만든다.

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

> 돼지고기(pork)·소고기(beef)·닭고기(chicken)·치즈(cheese)는 2026-11-14 재료 사전에서 지웠다. 부위별 재료로 대체.

### 3.3 추가 재료(2026-11-14 재료 사전 등록, 이미지 대기)

아래 값으로 재료 사전(`src/data/ingredients.json`)에 이미 등록했다. 이미지를 만들면 `assets/ingredients-src/{imageKey}.png`에 넣고 변환 스크립트만 돌리면 된다.

| imageKey | 재료 | 사전 등록안 | SUBJECT |
|---|---|---|---|
| pear_juice | 배 음료(갈아만든 배 238ml 1캔) | id `m_ing_164`, name `배 음료`, zone `FRIDGE`, aliases `["갈아만든배", "갈아만든 배", "배음료", "배주스"]` | 아래 전용 프롬프트 |
| pork_ribs | 돼지갈비 | id `m_ing_166`, name `돼지갈비`, zone `FRIDGE`, aliases `["돼지 갈비", "찜갈비", "갈비찜용"]` | several raw pork spare rib pieces cut for braising, pink meat with white bones visible at the cut ends, loosely piled |
| pork_back_ribs | 돼지등갈비 | id `m_ing_168`, name `돼지등갈비`, zone `FRIDGE`, aliases `["등갈비", "돼지 등갈비", "쪽갈비", "베이비백립", "립"]` | one whole raw rack of pork baby back ribs, long curved row of parallel bones with meat on top, lying diagonally |
| chicken_stew_cut | 닭볶음탕용 닭 | id `m_ing_167`, name `닭볶음탕용 닭`, zone `FRIDGE`, aliases `["볶음탕용 닭", "닭볶음탕용", "닭도리탕용", "토막닭", "절단닭"]` | pile of raw whole chicken cut into bone-in pieces for stew (drumsticks, wings, thighs), pale pink skin-on, loosely piled |
| shishito_pepper | 꽈리고추 | id `m_ing_169`, name `꽈리고추`, zone `FRIDGE`, aliases `["꽈리 고추"]` | small pile of fresh bright green shishito peppers, short and wrinkled with crinkly skin and green stems |
| dried_baby_anchovy | 잔멸치 | id `m_ing_170`, name `잔멸치`, zone `FRIDGE`, aliases `["잔 멸치", "지리멸치", "볶음멸치", "세멸치", "멸치"]` | small heap of tiny dried silvery baby anchovies (jan-myeolchi), each about 2cm long |
| starch_syrup | 물엿 | id `m_ing_171`, name `물엿`, zone `SEASONING`, aliases `["쌀엿", "조청"]` | wide clear plastic tub with a white lid set beside it, filled with thick colorless glossy starch syrup, a thick drip of syrup running over the rim, no label |
| pork_belly_skin_on | 껍질 붙은 통삼겹 | id `m_ing_172`, name `껍질 붙은 통삼겹`, zone `FRIDGE`, aliases `["오겹살", "통오겹", "껍데기 통삼겹", "껍질 통삼겹", "수육용 삼겹"]` | one thick whole rectangular slab of raw skin-on pork belly, pale cream skin on top and clearly visible alternating layers of pink meat and white fat on the cut side |
| honey | 꿀 | id `m_ing_173`, name `꿀`, zone `SEASONING`, aliases `["벌꿀", "아카시아꿀", "잡화꿀"]` | round glass jar of golden amber honey with no lid, a wooden honey dipper resting in the jar with honey dripping from it, no label |
| beef_bulgogi | 불고깃감 소고기 | id `m_ing_174`, name `불고깃감 소고기`, zone `FRIDGE`, aliases `["불고기용 소고기", "불고깃감", "불고기감", "소불고기용", "불고기용"]` | loose pile of thinly sliced raw lean beef for bulgogi, deep red meat with very little fat, slices gently ruffled and folded |
| eggplant | 가지 | id `m_ing_175`, name `가지`, zone `FRIDGE`, aliases `["가지나물용"]` | two glossy deep purple Korean eggplants, long and slender with green caps, slightly crossed |
| whole_chicken | 생닭 한 마리 | id `m_ing_176`, name `생닭 한 마리`, zone `FRIDGE`, aliases `["생닭", "통닭", "닭 한 마리", "백숙용 닭", "삼계탕용 닭", "영계"]` | one whole raw plucked chicken, uncut, pale pink skin, legs tucked, breast side up |
| ginger | 생강 | id `m_ing_177`, name `생강`, zone `FRIDGE`, aliases `["통생강", "햇생강", "생강 뿌리"]` | one knobby piece of fresh ginger root with light tan skin, one small branch cut to show pale yellow fibrous flesh |
| potato_starch | 감자전분 | id `m_ing_178`, name `감자전분`, zone `SEASONING`, aliases `["감자 전분", "전분", "전분가루", "녹말", "감자녹말"]` | plain unlabeled white paper bag open at the top, spilling bright pure white fine starch powder into a small heap in front, a few compacted powdery lumps |
| aged_kimchi | 묵은지 | id `m_ing_179`, name `묵은지`, zone `FRIDGE`, aliases `["묵은지 김치", "묵은김치", "오래된 김치", "숙성김치"]` | one whole uncut quarter head of long-aged Korean napa cabbage kimchi (mukeunji), limp and softened leaves, deeper olive-yellow cabbage with darker brick-red seasoning, laid lengthwise |
| dried_parsley | 파슬리 가루 | id `m_ing_180`, name `파슬리 가루`, zone `SEASONING`, aliases `["파슬리가루", "파슬리", "건조 파슬리", "말린 파슬리"]` | small glass spice jar with no lid filled with dried green parsley flakes, a small heap of the flakes spilled in front |
| cherry_tomato | 방울토마토 | id `m_ing_181`, name `방울토마토`, zone `FRIDGE`, aliases `["방울 토마토", "체리토마토", "대추방울토마토", "미니토마토"]` | small cluster of five glossy red cherry tomatoes, two still attached to a green vine stem |
| pepperoncino | 페퍼론치노 | id `m_ing_182`, name `페퍼론치노`, zone `SEASONING`, aliases `["페페론치노", "페퍼론치니", "이탈리안 건고추"]` | small heap of whole dried small red Italian chili peppers (peperoncino), shiny wrinkled crimson skin, a few crushed flakes scattered |
| ramen_soup_packet | 라면 수프 | id `m_ing_183`, name `라면 수프`, zone `SEASONING`, aliases `["라면스프", "라면 스프", "라면수프", "분말스프"]` | one small plain unprinted red-orange foil seasoning sachet torn open at the corner, a little reddish-orange soup powder spilled in front |
| baguette | 바게트 빵 | id `m_ing_184`, name `바게트 빵`, zone `FRIDGE`, aliases `["바게트", "바게뜨", "프랑스빵"]` | one whole golden-brown crusty French baguette with diagonal scores, lying diagonally, two round slices cut in front |
| beef_yukhoe | 육회용 설깃살 | id `m_ing_185`, name `육회용 설깃살`, zone `FRIDGE`, aliases `["육회용 소고기", "설깃살", "육회용", "육회"]` | small mound of raw lean beef eye round cut into thin matchstick strips for yukhoe, bright deep red with no fat |
| pear | 배 | id `m_ing_186`, name `배`, zone `FRIDGE`, aliases `["신고배", "한국배", "나주배"]` | one whole round golden-brown Korean Asian pear (nashi) with a short stem, speckled skin |
| glass_noodles | 당면 | id `m_ing_187`, name `당면`, zone `FRIDGE`, aliases `["잡채면", "고구마당면", "납작당면"]` | bundle of dry grey translucent sweet potato glass noodles (dangmyeon), long strands folded in half |
| jjajang_powder | 짜장가루 | id `m_ing_188`, name `짜장가루`, zone `SEASONING`, aliases `["짜장 가루", "짜장분말", "분말짜장"]` | small heap of dark brown jjajang black bean sauce powder, a few lumps |
| chicken_drumettes | 닭봉 | id `m_ing_189`, name `닭봉`, zone `FRIDGE`, aliases `["닭 봉", "닭날개봉", "윙봉"]` | small pile of raw chicken drumettes, pale pink skin-on, bone-in |
| curry_powder | 카레가루 | id `m_ing_190`, name `카레가루`, zone `SEASONING`, aliases `["카레 가루", "카레분말", "분말카레", "카레"]` | small heap of bright yellow-orange curry powder |
| minari | 미나리 | id `m_ing_191`, name `미나리`, zone `FRIDGE`, aliases `["돌미나리", "물미나리"]` | bunch of fresh Korean water dropwort (minari), long thin pale green hollow stems with small serrated green leaves on top |
| sand_lance_fish_sauce | 까나리 액젓 | id `m_ing_192`, name `까나리 액젓`, zone `SEASONING`, aliases `["까나리액젓", "까나리"]` | tall plastic jug with a handle filled with clear golden-brown sand lance fish sauce, white cap, blank label |
| blue_crab | 꽃게 | id `m_ing_193`, name `꽃게`, zone `FRIDGE`, aliases `["꽃 게", "생꽃게", "냉동꽃게"]` | one whole raw blue swimming crab (kkotge) with mottled blue-grey shell and long claws |
| dried_red_chili | 건고추 | id `m_ing_194`, name `건고추`, zone `SEASONING`, aliases `["마른고추", "마른 고추", "건홍고추", "태양초 고추"]` | small pile of whole long dried Korean red chili peppers, dark glossy crimson, slightly flattened and wrinkled |
| white_wine | 화이트 와인 | id `m_ing_195`, name `화이트 와인`, zone `SEASONING`, aliases `["화이트와인", "요리용 화이트 와인", "백포도주"]` | one green glass wine bottle of white wine with a plain foil capsule, blank label |
| red_wine | 레드 와인 | id `m_ing_262`, name `레드 와인`, zone `SEASONING`, aliases `["레드와인", "요리용 레드 와인", "적포도주"]` | one dark glass wine bottle of red wine with a plain dark foil capsule, blank label, a small pour of deep red wine in a short glass beside it |
| korean_green_chili | 청고추 | id `m_ing_263`, name `청고추`, zone `FRIDGE`, aliases `["청 고추", "녹광고추"]` | three fresh long thick glossy dark green Korean chili peppers (cheong-gochu), smooth skin, gently curved, green stems |
| ssanghwa_tang | 쌍화탕 | id `m_ing_196`, name `쌍화탕`, zone `FRIDGE`, aliases `["쌍화탕 120ml", "쌍화차", "한방음료"]` | one small 120ml brown glass medicine bottle of Korean herbal drink with a gold metal cap, dark brown liquid, plain blank label |
| red_chili | 홍고추 | id `m_ing_197`, name `홍고추`, zone `FRIDGE`, aliases `["붉은고추", "빨간고추", "생홍고추"]` | two fresh long glossy red chili peppers with green stems, slightly crossed |
| black_rice | 흑미밥 | id `m_ing_198`, name `흑미밥`, zone `FRIDGE`, aliases `["흑미 밥", "흑미즉석밥", "잡곡밥"]` | white microwavable rice tray with the film partly peeled, cooked purple-black mixed black rice visible, no print |
| bulgogi_ham | 불고기맛 햄 | id `m_ing_199`, name `불고기맛 햄`, zone `FRIDGE`, aliases `["불고기햄", "불고기 햄", "김밥햄"]` | several long rectangular sticks of brown bulgogi-flavored ham for gimbap, lightly glazed |
| pickled_radish_gimbap | 김밥용 단무지 | id `m_ing_200`, name `김밥용 단무지`, zone `FRIDGE`, aliases `["단무지", "김밥단무지"]` | several long bright yellow pickled radish strips (danmuji) for gimbap, neatly stacked |
| burdock_gimbap | 김밥용 우엉 | id `m_ing_201`, name `김밥용 우엉`, zone `FRIDGE`, aliases `["우엉", "우엉조림", "김밥우엉"]` | small bundle of thin glossy brown braised burdock root strips for gimbap |
| crab_stick | 게맛살 | id `m_ing_202`, name `게맛살`, zone `FRIDGE`, aliases `["맛살", "크래미", "게살"]` | several imitation crab sticks with red-orange outer layer and white inside, one peeled open, no wrapper |
| truffle_oil | 트러플 오일 | id `m_ing_203`, name `트러플 오일`, zone `SEASONING`, aliases `["트러플오일", "송로버섯오일"]` | small slim glass bottle of golden truffle oil with a black cap, one small black truffle beside it, blank label |
| canned_whole_tomato | 홀 토마토 | id `m_ing_204`, name `홀 토마토`, zone `FRIDGE`, aliases `["홀토마토", "토마토 통조림", "토마토캔"]` | opened plain silver tin can with no label, whole peeled red tomatoes in red juice visible inside |
| chicken_powder | 치킨 파우더 | id `m_ing_205`, name `치킨 파우더`, zone `SEASONING`, aliases `["치킨파우더", "치킨스톡", "치킨 스톡", "치킨스톡 파우더"]` | small glass jar with no lid filled with pale yellow chicken stock powder, a little powder spilled in front, no label |
| fresh_basil | 생 바질 | id `m_ing_206`, name `생 바질`, zone `FRIDGE`, aliases `["바질", "생바질", "스위트바질"]` | small bunch of fresh sweet basil, bright green glossy oval leaves on stems |
| abalone | 전복 | id `m_ing_207`, name `전복`, zone `FRIDGE`, aliases `["활전복", "생전복"]` | two whole fresh abalone in shell, dark muscular foot visible, iridescent shell edge |
| coarse_salt | 굵은 소금 | id `m_ing_208`, name `굵은 소금`, zone `SEASONING`, aliases `["굵은소금", "천일염", "왕소금"]` | small heap of large coarse grey-white sea salt crystals in a small wooden bowl |
| pollock_roe | 명란젓 | id `m_ing_209`, name `명란젓`, zone `FRIDGE`, aliases `["명란", "명란젓갈", "백명란"]` | two whole salted pollock roe sacs (myeongnan), glossy pinkish-red |
| grana_padano | 그라나 파다노 치즈 | id `m_ing_210`, name `그라나 파다노 치즈`, zone `FRIDGE`, aliases `["그라나파다노", "그라나 파다노"]` | one wedge of hard aged pale straw-yellow Italian cheese with a thick hard rind and grainy texture, no rind lettering |
| parmigiano | 파르미지아노 레지아노 치즈 | id `m_ing_211`, name `파르미지아노 레지아노 치즈`, zone `FRIDGE`, aliases `["파르미지아노 레지아노", "파마산 치즈", "파마산치즈", "파르메산"]` | one wedge of hard aged golden Parmigiano cheese with a thick hard rind and crystalline crumbly texture, a few shards broken off in front, no rind lettering |
| lobster | 랍스터 | id `m_ing_212`, name `랍스터`, zone `FRIDGE`, aliases `["랍스타", "바닷가재"]` | one whole raw lobster, dark blue-green shell, large claws, lying diagonally |
| mussel | 홍합 | id `m_ing_213`, name `홍합`, zone `FRIDGE`, aliases `["생홍합", "담치"]` | small pile of fresh black-blue mussels in shell, one open showing orange meat |
| corn | 옥수수 | id `m_ing_214`, name `옥수수`, zone `FRIDGE`, aliases `["찰옥수수", "생옥수수"]` | one ear of fresh yellow corn with the husk partly peeled back |
| lemon | 레몬 | id `m_ing_215`, name `레몬`, zone `FRIDGE`, aliases `[]` | one whole bright yellow lemon and one half cut showing the juicy cross-section |
| canned_whelk | 골뱅이 캔 | id `m_ing_216`, name `골뱅이 캔`, zone `FRIDGE`, aliases `["골뱅이", "골뱅이통조림", "골뱅이 통조림"]` | opened plain silver tin can with no label, brown whelk meat in brine visible inside |
| dried_pollock_shreds | 황태채 | id `m_ing_217`, name `황태채`, zone `FRIDGE`, aliases `["황태", "북어채", "황태포"]` | small pile of shredded dried pollock (hwangtae-chae), fluffy pale yellow-white fibers |
| dried_rice_noodles | 건쌀국수 면 | id `m_ing_218`, name `건쌀국수 면`, zone `FRIDGE`, aliases `["쌀국수면", "쌀국수", "건쌀국수"]` | bundle of dry flat white rice noodles, folded |
| red_cabbage | 적양배추 | id `m_ing_219`, name `적양배추`, zone `FRIDGE`, aliases `["적채", "자색양배추"]` | one whole red cabbage head and one half cut showing purple and white layered cross-section |
| lettuce | 상추 | id `m_ing_220`, name `상추`, zone `FRIDGE`, aliases `["적상추", "청상추", "꽃상추"]` | small bunch of fresh Korean leaf lettuce (sangchu), ruffled green leaves with reddish tips |
| black_olives | 블랙 올리브 | id `m_ing_221`, name `블랙 올리브`, zone `FRIDGE`, aliases `["블랙올리브", "올리브", "슬라이스 올리브"]` | small heap of glossy whole pitted black olives, a few sliced rings |
| baby_napa_cabbage | 알배추 | id `m_ing_222`, name `알배추`, zone `FRIDGE`, aliases `["알배기배추", "쌈배추"]` | one small whole baby napa cabbage head with pale yellow-green crinkly leaves |
| instant_ramen | 라면 | id `m_ing_223`, name `라면`, zone `FRIDGE`, aliases `["진라면", "사리곰탕면", "사리곰탕", "곰탕면", "봉지라면", "인스턴트 라면", "라면사리"]` | one block of dry wavy instant ramen noodles, golden, square shape, no packaging |
| dried_wakame | 건미역 | id `m_ing_224`, name `건미역`, zone `FRIDGE`, aliases `["미역", "마른미역", "자른미역"]` | small pile of dried dark green-black cut wakame seaweed (miyeok) |
| beef_flank | 소고기 양지 | id `m_ing_225`, name `소고기 양지`, zone `FRIDGE`, aliases `["양지", "양지머리", "국거리 소고기", "국거리용 소고기"]` | one block of raw beef brisket flank (yangji) for soup, deep red meat with thin fat lines, a few cubes cut in front |
| pork_neck_bones | 돼지등뼈 | id `m_ing_226`, name `돼지등뼈`, zone `FRIDGE`, aliases `["등뼈", "감자탕용 등뼈", "돼지 등뼈"]` | pile of raw pork neck bones for gamjatang, chunky bones with red meat attached |
| young_napa_cabbage | 얼갈이배추 | id `m_ing_227`, name `얼갈이배추`, zone `FRIDGE`, aliases `["얼갈이", "얼갈이 배추"]` | bunch of young napa cabbage (eolgari), loose bright green leaves with white stems |
| frankfurter | 프랑크소시지 | id `m_ing_229`, name `프랑크소시지`, zone `FRIDGE`, aliases `["프랑크 소시지", "소시지", "후랑크소시지"]` | three plump frankfurter sausages, reddish-brown casing, one cut showing the cross-section |
| baked_beans | 베이크드 빈스 | id `m_ing_230`, name `베이크드 빈스`, zone `FRIDGE`, aliases `["베이크드빈스", "베이크드 빈"]` | opened plain silver tin can with no label, baked beans in orange tomato sauce visible inside |
| glutinous_rice | 찹쌀 | id `m_ing_231`, name `찹쌀`, zone `FRIDGE`, aliases `["찹쌀 쌀"]` | small heap of uncooked opaque milky-white glutinous rice grains |
| cheongju | 청주 | id `m_ing_232`, name `청주`, zone `SEASONING`, aliases `["정종", "요리용 청주"]` | one clear glass bottle of clear Korean rice wine (cheongju) with a white screw cap, blank label |
| oyster_mushroom | 느타리버섯 | id `m_ing_233`, name `느타리버섯`, zone `FRIDGE`, aliases `["느타리", "애느타리"]` | cluster of fresh grey-brown oyster mushrooms with fan-shaped caps |
| soup_soy_sauce | 국간장 | id `m_ing_234`, name `국간장`, zone `SEASONING`, aliases `["조선간장", "집간장", "국 간장"]` | one glass bottle of light brown Korean soup soy sauce with a green cap, blank label |
| jjajang_ramen_soup | 짜장라면 수프 | id `m_ing_235`, name `짜장라면 수프`, zone `SEASONING`, aliases `["짜장라면 스프", "짜장스프", "짜장수프"]` | one small plain unprinted dark brown foil seasoning sachet torn open at the corner, a little dark brown jjajang powder spilled in front |
| jjolmyeon_noodles | 쫄면사리 | id `m_ing_236`, name `쫄면사리`, zone `FRIDGE`, aliases `["쫄면", "쫄면 사리"]` | small coiled nest of thick chewy pale yellow jjolmyeon noodles, uncooked |
| sweet_potato | 고구마 | id `m_ing_237`, name `고구마`, zone `FRIDGE`, aliases `["밤고구마", "호박고구마"]` | two whole sweet potatoes with purple-red skin, one cut showing yellow flesh |
| shredded_mozzarella | 슈레드 피자치즈 | id `m_ing_238`, name `슈레드 피자치즈`, zone `FRIDGE`, aliases `["피자치즈", "모짜렐라", "모짜렐라 치즈", "슈레드치즈"]` | small heap of shredded white mozzarella pizza cheese |
| vanilla_ice_cream | 바닐라 아이스크림 | id `m_ing_239`, name `바닐라 아이스크림`, zone `FRIDGE`, aliases `["아이스크림", "바닐라아이스크림"]` | two round scoops of creamy vanilla ice cream with tiny vanilla bean specks, stacked, no cone, no bowl |
| dinner_roll | 모닝빵 | id `m_ing_240`, name `모닝빵`, zone `FRIDGE`, aliases `["모닝 빵", "미니빵"]` | three small soft golden-brown round dinner rolls, joined side by side |
| strawberry_jam | 딸기잼 | id `m_ing_241`, name `딸기잼`, zone `FRIDGE`, aliases `["딸기 잼"]` | small round glass jar of red strawberry jam with no lid, no label |
| canned_corn | 캔 옥수수 | id `m_ing_242`, name `캔 옥수수`, zone `FRIDGE`, aliases `["통조림 옥수수", "옥수수캔", "스위트콘"]` | opened plain silver tin can with no label, sweet yellow corn kernels visible inside |
| tortilla | 또르티야 | id `m_ing_243`, name `또르티야`, zone `FRIDGE`, aliases `["토르티야", "또띠아", "토르티아"]` | small stack of round flour tortillas with light brown toasted spots, top one slightly folded |
| oyster | 굴 | id `m_ing_244`, name `굴`, zone `FRIDGE`, aliases `["생굴", "석화"]` | small pile of fresh shucked raw oysters, glossy grey-white, one oyster on its half shell |
| small_green_onion | 쪽파 | id `m_ing_245`, name `쪽파`, zone `FRIDGE`, aliases `["실파"]` | small bunch of thin Korean green onions (jjokpa) with small white bulbs and slender green leaves |
| cream_cheese | 크림치즈 | id `m_ing_246`, name `크림치즈`, zone `FRIDGE`, aliases `["크림 치즈"]` | one rectangular block of white cream cheese with one corner scooped out, on its opened plain foil wrapper |
| condensed_milk | 연유 | id `m_ing_247`, name `연유`, zone `FRIDGE`, aliases `[]` | small plain white squeeze tube of sweetened condensed milk with a thick drizzle of creamy condensed milk in front, no print |
| smoked_salmon | 훈제 연어 | id `m_ing_248`, name `훈제 연어`, zone `FRIDGE`, aliases `["훈제연어", "연어"]` | several slices of smoked salmon, bright orange with white fat lines, gently folded |
| arugula | 루꼴라 | id `m_ing_249`, name `루꼴라`, zone `FRIDGE`, aliases `["루콜라", "로켓"]` | small loose pile of fresh arugula leaves, dark green, lobed shape |
| capers | 케이퍼 | id `m_ing_250`, name `케이퍼`, zone `FRIDGE`, aliases `["케이퍼스"]` | small heap of tiny round olive-green pickled capers, glossy |
| margarine | 마가린 | id `m_ing_251`, name `마가린`, zone `FRIDGE`, aliases `[]` | small plain white plastic tub of pale yellow margarine with the lid off, a spread swirl on top, no print |
| broccoli | 브로콜리 | id `m_ing_252`, name `브로콜리`, zone `FRIDGE`, aliases `[]` | one whole fresh head of broccoli with a thick stem |
| gruyere | 그뤼에르 치즈 | id `m_ing_253`, name `그뤼에르 치즈`, zone `FRIDGE`, aliases `["그뤼에르", "그뤼예르"]` | one wedge of pale yellow Gruyere cheese with a brown natural rind and a few tiny holes |
| emmental | 에멘탈 치즈 | id `m_ing_254`, name `에멘탈 치즈`, zone `FRIDGE`, aliases `["에멘탈", "에멘탈러"]` | one wedge of pale yellow Emmental cheese with large round holes |
| dumpling_wrapper | 왕만두피 | id `m_ing_255`, name `왕만두피`, zone `FRIDGE`, aliases `["만두피", "왕 만두피"]` | small stack of large round thin white dumpling wrappers, top one slightly lifted |
| cinnamon_powder | 시나몬 파우더 | id `m_ing_256`, name `시나몬 파우더`, zone `SEASONING`, aliases `["시나몬", "계피가루", "계피 가루"]` | small heap of reddish-brown ground cinnamon with two cinnamon sticks beside it |
| chocolate | 초콜릿 | id `m_ing_257`, name `초콜릿`, zone `FRIDGE`, aliases `["다크초콜릿", "초콜렛"]` | plain dark chocolate bar broken into a few square pieces, no wrapper, no embossed text |
| maple_syrup | 메이플시럽 | id `m_ing_258`, name `메이플시럽`, zone `SEASONING`, aliases `["메이플 시럽", "메이플"]` | small glass bottle of dark amber maple syrup with a small loop handle, blank label |
| apple_jam | 사과잼 | id `m_ing_259`, name `사과잼`, zone `FRIDGE`, aliases `["사과 잼"]` | small round glass jar of golden-brown apple jam with no lid, no label |
| brie | 브리 치즈 | id `m_ing_260`, name `브리 치즈`, zone `FRIDGE`, aliases `["브리", "브리치즈"]` | one wedge of soft brie cheese with a white bloomy rind and creamy pale yellow interior |
| heavy_cream | 동물성 생크림 | id `m_ing_261`, name `동물성 생크림`, zone `FRIDGE`, aliases `["생크림", "휘핑크림", "동물성생크림"]` | plain white unprinted milk carton style container of heavy cream next to a small dollop of thick whipped cream |
| perilla_leaf | 깻잎 | id `m_ing_165`, name `깻잎`, zone `FRIDGE`, aliases `["깻잎순", "들깻잎", "깻잎장아찌"]` | small neat stack of fresh green Korean perilla leaves (kkaennip), slightly fanned so the serrated edges and pointed tips are visible |

### 3.4 같은 재료 / 다른 재료(2026-11-14 사용자 확인)

기존 재료와 다른 재료는 기존 재료의 별칭에서 이미 지웠다.

| 기존 재료 | 새 재료 | 기존에서 지운 별칭 |
|---|---|---|
| 멸치액젓 `fish_sauce` | 까나리 액젓 `sand_lance_fish_sauce` | `까나리액젓` |
| 소금(가는 소금) `salt` | 굵은 소금 `coarse_salt` | `천일염`, `굵은소금`, `굵은 소금` |
| 맛술 `cooking_wine` | 청주 `cheongju` | `청주` |
| 대파 `scallion` | 쪽파 `small_green_onion` | `쪽파` |
| 베이컨 `bacon` | 프랑크소시지 `frankfurter` | `소시지` |
| 고추(풋고추) `green_chili` | 청고추 `korean_green_chili` | `청고추` |
| 올리고당 `syrup` | 물엿 `starch_syrup` | `물엿` |
| 소고기 `beef`(삭제함) | 소고기 양지 `beef_flank` | — |
| 치즈 `cheese`(삭제함) | 슈레드 피자치즈 `shredded_mozzarella` | `피자치즈`는 새 재료 별칭으로 옮김 |

- **같은 재료로 보는 것**: 미림 = 맛술 `cooking_wine`. 진라면·사리곰탕면 = 라면 `instant_ramen`(`m_ing_228`은 쓰지 않음). 화이트 와인·레드 와인은 맛술과 별도.
- **새로 만들지 않고 기존 재료로 쓰는 것**: 양배추·올리브 오일·바지락·콩나물·두부·사과·사각어묵·식빵 — 이미 있음. 구이용 돼지 삼겹살 → `pork_belly`, 구운 김 → `laver`(별칭 추가함).
- **상품명**: 진라면·사리곰탕면은 상품명을 별칭에만 넣는다. 라면은 포장 없이 면만 그린다.
- **흑미밥** `black_rice`: 즉석밥처럼 용기에 담긴 흑미밥으로 그린다.
- **물엿**: 이미지는 올리고당은 노란 짜는 병, 물엿은 넓은 투명 통으로 구분한다.
- **배 음료** `pear_juice`: 캔 디자인(색·배 그림·빨간 배지)은 실제 상품대로 쓰고 **'갈아만든 배' 로고 글자만 뺀다**(2026-11-14 사용자 결정, 저작권 문제 없음 확인). 캔 하나만, 옆에 배를 두지 않는다. imageKey·재료명은 일반명(`pear_juice`, 배 음료)으로 두고 상품명은 별칭에만 넣는다.

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
| 다진생강 ginger_minced | 〃 | small mound of pale yellow minced ginger in a small white ceramic dish (통생강은 넣지 않는다: 생강 `ginger`과 헷갈림) |

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
