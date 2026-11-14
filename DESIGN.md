# K-Doma 디자인 시스템 & 공통 컴포넌트 규격서 (DESIGN.md)

이 문서는 집밥 레시피·냉장고 관리 웹앱 **'K-Doma'**의 톤앤매너, 디자인 토큰, 공통 컴포넌트 명세, 그리고 2차 화면 개발 가이드를 정의합니다. 삼성 모니모(Monimo) 실측 스크린샷 4종의 톤앤매너를 분석하여 완벽하게 반영하였습니다.

---

## 1. 모니모(Monimo) 스타일 분석 & 톤앤매너 정의

업로드된 모니모 스크린샷 4종을 면밀히 분석하여 도출한 디자인 원칙입니다.

1. **캔버스 & 서피스 구조**:
   - 데스크톱 외곽 캔버스: 옅은 쿨 그레이 (`#F0F2F5`).
   - **모든 화면 배경**: **순백색 (`#FFFFFF`)**.
   - 카드 서피스: 순백색(`#FFFFFF`), 모서리 반경 `20px` (`rounded-[20px]`), 아주 은은한 확산 그림자 (`shadow-[0_2px_12px_rgba(0,0,0,0.035)]`)와 1px 헤어라인 테두리(`border-[#F0F2F6]`) 결합.
   - 배경이 흰색이므로 카드 경계 및 영역 구분은 은은한 테두리(`border-[#F0F2F6]`), 소프트 섀도우, 넉넉한 여백, 그리고 파스텔 악센트 서피스로 명확한 위계를 형성합니다.
2. **시그니처 코발트 블루 (`#005CFF`)**:
   - 주 버튼, 선택된 탭바 아이콘 및 라벨, 선택 칩, 핵심 데이터 강조에 제한적으로 사용하여 높은 시각적 집중도를 확보합니다.
3. **모니모 파스텔 & 악센트 정보 카드**:
   - 스크린샷 상단 가로 스크롤 카드("지식과 취향을 채우는 소식", "내 레벨 Lv.3 혜택", "돈이 되는 젤리 습관")의 컬러웨이 채택:
     - **Mint (`#EAF6EE` / 글자 `#12804A`)**: 제철 소식 및 지식 큐레이션
     - **Periwinkle (`#5476F7` / 글자 `#FFFFFF`)**: 레벨업 및 핵심 혜택 하이라이트
     - **Peach (`#FFF0E6` / 글자 `#D94E1F`)**: 습관 및 오늘의 팁
     - **Lavender (`#F3EEFD` / 글자 `#6C40C7`)**: 미션 및 알림
     - **Sky (`#EAF3FF` / 글자 `#005CFF`)**: 스마트 안내
4. **버튼 계층 (Button Hierarchy)**:
   - **Primary**: 높이 `52px`, 모서리 `14px`, 꽉 찬 코발트 블루 (`#005CFF`), 볼드 화이트 텍스트 ("적용하기", "구경하기").
   - **Secondary**: 모니모 특유의 소프트 블루 배경 (`#EDF3FF`), 코발트 블루 텍스트 (`#005CFF`) ("이벤트 미리보기").
   - **Neutral**: 옅은 회색 배경 (`#F2F4F8`), 차콜 텍스트 (`#4E5968`).
5. **원형 아이콘 그리드**:
   - 스크린샷의 '마이삼성', '관심분야' 처럼 지름 `48px~56px`의 둥근 원형 배경(`bg-[#F2F4F8]` 또는 파스텔 틴트) 안에 선명한 단일 아이콘을 배치하고 하단에 `12px` 볼드 라벨 배치.
6. **다크 말풍선 툴팁**:
   - 스크린샷("오늘의 소식을 음성으로 들려드려요", "젤리 1개 획득") 형태: 다크 차콜(`#1A1E27`) 배경, 화이트 볼드 12px, 하단 삼각형 꼬리.
7. **하단 탭바 (BottomTab)**:
   - 순백색 배경, 활성 탭은 코발트 블루(`#005CFF`) 굵은 아이콘과 텍스트, 비활성은 소프트 그레이(`#9EA6B2`).

---

## 2. 디자인 토큰 (`src/index.css`의 `@theme`)

토큰은 `src/index.css`의 Tailwind `@theme` 한 곳에만 정의합니다. 화면 코드에서는 **색상 코드(`#005CFF`, `bg-[#005CFF]` 등)를 직접 쓰지 않고** 아래 클래스 이름을 씁니다.

- 클래스는 `bg-`, `text-`, `border-`, `ring-`, `fill-`, `divide-` 어디에나 붙일 수 있습니다. 예: `bg-primary`, `text-ink-muted`, `border-line`
- 투명도는 `/숫자`로 씁니다. 예: `bg-primary/20`, `text-teal/80`
- JS에서 색이 필요하면 `var(--color-이름)`을 씁니다. 예: StatusSignal의 `fill="var(--color-primary)"`
- 새 색이 필요하면 먼저 `@theme`에 토큰을 추가하고 이름으로 씁니다.

### 2.1 컬러

| 분류 | 클래스 이름 | 값 | 용도 |
|---|---|---|---|
| 브랜드 | `primary` | `#005CFF` | 주 버튼, 활성 탭, 강조 |
| | `primary-hover` / `primary-active` | `#004ED9` / `#0040B3` | 주 버튼 hover / 누름 |
| | `primary-light` | `#EDF3FF` | 보조 버튼, 강조 배지 배경 |
| | `primary-light-hover` / `primary-light-active` | `#E0ECFF` / `#D1E2FF` | 보조 버튼 hover / 누름 |
| 글자 | `ink` | `#191F28` | 본문, 제목, 선택된 날짜 원, 진한 버튼 |
| | `ink-hover` | `#2C3440` | 진한 버튼 hover |
| | `ink-secondary` | `#4E5968` | 보조 글자, 설명 |
| | `ink-tertiary` | `#6B7684` | 옅은 배지 글자 |
| | `ink-muted` | `#8B95A1` | 메타 정보, 안내 문구, placeholder |
| | `ink-disabled` | `#9EA6B2` | 비활성 탭 |
| 선 | `line` | `#E5E8EB` | 기본 테두리 |
| | `line-strong` | `#D1D6DB` | 진한 테두리, 손잡이, 비활성 버튼 |
| | `line-subtle` | `#F0F2F6` | 카드 구분선 |
| 면 | `white` | `#FFFFFF` | 모든 화면·카드 배경 |
| | `canvas` | `#F0F2F5` | 데스크톱 바깥 배경 |
| | `fill` | `#F2F4F8` | 입력창, 중립 버튼, 옅은 배지 |
| | `fill-subtle` | `#F8FAFD` | 옅은 박스, hover |
| | `fill-hover` | `#F0F4FA` | 옅은 박스 hover |
| | `thumb` | `#EAEFF5` | 이미지가 없을 때 자리 |
| 상태 | `danger` / `danger-light` | `#FF3B30` / `#FFF0EB` | 오류, 찜, 삭제 |
| | `have` | `#16A34A` | 재료 있음 (그린라이트) |
| | `warning` / `warning-light` | `#FF9500` / `#FFF8EB` | 재료 적음 |
| 파스텔 카드 | `mint` / `mint-bg` / `mint-line` | `#12804A` / `#EAF6EE` / `#D3EFE0` | 민트 카드 |
| | `teal` / `teal-bg` | `#0E8A6E` / `#E8F8F5` | 우리 집 |
| | `peach` / `peach-bg` / `peach-line` | `#D94E1F` / `#FFF0E6` / `#FFE2D1` | 피치 카드 |
| | `lavender` / `lavender-bg` / `lavender-line` | `#6C40C7` / `#F3EEFD` / `#E4D8FA` | 라벤더 카드 |
| | `sky-bg` / `sky-line` | `#EAF3FF` / `#D1E4FF` | 스카이 카드 (글자는 `primary`) |
| | `periwinkle` | `#5476F7` | 하이라이트 카드 (글자 `white`) |

### 2.2 모서리·그림자

| 클래스 | 값 | 용도 |
|---|---|---|
| `rounded-btn` | `14px` | 주 버튼, 썸네일 |
| `rounded-card` | `20px` | 카드 |
| `rounded-sheet` (`rounded-t-sheet`) | `24px` | 바텀시트, 큰 카드 |
| `rounded-full` | `9999px` | 칩, 알약 버튼 |
| `shadow-card` | `0 2px 12px rgba(0,0,0,0.035)` | 카드 |
| `shadow-nav` | `0 -2px 12px rgba(0,0,0,0.03)` | 하단 탭바 |
| `shadow-highlight` | `0 4px 14px rgba(84,118,247,0.25)` | 페리윙클 하이라이트 카드 |

글자 크기(`text-[13px]` 등)와 그 밖의 모서리 값은 아직 토큰으로 만들지 않았습니다.

---

## 3. 재료 상태 신호 규칙 (StatusSignal - 절대 준수 규칙)

재료 상태는 **색상이 아닌 모양(Shape)**으로 구분하여 색약자 및 흑백 환경에서도 직관적으로 판별할 수 있어야 합니다.

| 상태 | 기호 | 형태 정의 | 의미 | 용어 규칙 |
|---|:---:|---|---|---|
| **HAVE** | ● | 꽉 찬 원 (`circle` fill) | 있음 | '있음' |
| **LOW** | ◐ | 왼쪽 반만 찬 원 (`path` arc + `circle` stroke) | 적음 | **'조금' 절대 금지, '적음'으로 통일** |
| **NONE** | ◌ | 점선 원 (`circle` strokeDasharray 2.5) | 없음 | '없음' |

> **중요 규칙**:
> 1. 개수는 표기하지 않습니다.
> 2. `<StatusSignal status="HAVE|LOW|NONE" size={14} showLabel={false} />` 컴포넌트를 사용합니다.

---

## 4. 공통 컴포넌트 목록

| 컴포넌트 | 파일 경로 | 주요 역할 |
|---|---|---|
| **AppShell** | `src/components/layout/AppShell.tsx` | 최대 630px 중앙 정렬, Header & BottomTab 라우트 연동 |
| **Header** | `src/components/layout/Header.tsx` | K-DOMA 볼드 로고 + 코발트 장바구니 배지 / 서브페이지 뒤로가기 |
| **BottomTab** | `src/components/layout/BottomTab.tsx` | Today / 요리 / 기록 / 냉장고 / 마이 (코발트 블루 활성 탭) |
| **StatusSignal** | `src/components/common/StatusSignal.tsx` | ●(있음) / ◐(적음) / ◌(없음) 형태 기반 재료 상태 인디케이터 |
| **Button** | `src/components/common/Button.tsx` | Primary(`bg-primary`, 52px), Secondary(`bg-primary-light`), Neutral(`bg-fill`), Text |
| **Card** | `src/components/common/Card.tsx` | 순백색 20px 카드 및 5종 파스텔/하이라이트(mint, periwinkle, peach, lavender, sky) |
| **SearchInput** | `src/components/common/SearchInput.tsx` | 돋보기 아이콘, 원클릭 X 지우기 내장 검색창 |
| **BottomSheet** | `src/components/common/BottomSheet.tsx` | 드래그 핸들과 배경 딤이 있는 하단 슬라이드 시트 |
| **Modal** | `src/components/common/Modal.tsx` | 340px 중앙 확인/취소 팝업 |
| **Toast** | `src/components/common/Toast.tsx` | 하단 플로팅 알림 캡슐 |
| **StateView** | `src/components/common/StateView.tsx` | Loading / Empty / Error / Offline 표준 상태 화면 1세트 |

---

## 5. 전체 라우팅 맵 (1차 뼈대)

| 라우트 | 페이지 | 하단 탭바 | 구성 뼈대 |
|---|---|:---:|---|
| `/` | `TodayPage` | O | 접힌 주간 달력, 오늘 요리 카드, '오늘 한끼 뭐먹지?'(가로 스크롤 카드 + 세로 목록) |
| `/recipes` | `RecipesPage` | O | '요리 79', 찜 링크, 목록형/피드형 토글, 검색창, 2줄 필터, 요리 목록 |
| `/recipes/likes` | `LikesPage` | X | 뒤로, '찜', 목록형/사진형 토글, 찜 목록 |
| `/recipe/:recipeId` | `RecipeDetailPage` | X | 큰 사진, 요리명/태그/찜/공유, 영양성분, 재료(StatusSignal), 조리 순서, [오늘 기록에 추가] |
| `/cart` | `CartPage` | X | 뒤로, '장바구니', '꼭 사야 해요', '더 사두면 좋아요', [체크한 n개 냉장고에 등록] |
| `/records` | `RecordsPage` | O | 보기 전환 [달력 \| 타임라인]. 달력: 접힘/펼침 달력 + 선택한 날 요리 카드(없으면 안내 박스). 타임라인: 요리 완료한 날만 최신순, 같은 요리 카드(PlanCard), 아래 [N월 기록 더 보기]. 기록은 지난달 1일부터 받고 이전 달은 달력 이동·더 보기 때 월 단위로 더 받는다 |
| `/fridge` | `FridgePage` | O | '냉장고', 목록형/아이콘형 토글, 상태 필터 칩(전체/있음/적음/없음), 양념 선반, 냉장고, 안내 문구 |
| `/my` | `MyPage` | O | 프로필(이름/아이디/역할), 태링/버미 토글, [우리 집] 링크, [로그아웃] 모달 |
| `/my/home` | `HouseholdPage` | X | 뒤로, 가구 이름 '우리 집' 카드, 구성원 목록(태링-관리자, 버미-구성원), 초대 영역 |
| `/login` | `LoginPage` | X | 로고, 아이디/비밀번호 입력, [로그인], 빠른 계정 선택 |

---

## 6. 개발 지침

공통 컴포넌트(`Button`, `Card`, `StatusSignal`, `SearchInput`, `BottomSheet`, `Modal`, `Toast`, `StateView`)와 디자인 토큰(`src/index.css`의 `@theme`)을 기준으로 2차 각 화면별 세부 기능 및 레이아웃 작업을 진행합니다.
