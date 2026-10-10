# My little Lisa PET TOWN — 인계 패키지 (v1.27 / versionCode 7)

**펫샵 게임(My little Lisa Pet shop v10.0)에서 갈라져 나온 새 앱**입니다. 패키지 `com.seungjin.pettown`(TEST: `com.seungjin.pettown.test`),
앱 이름 "My little Lisa PET TOWN", 아이콘 = 기존 강아지·고양이 + 빨간 지붕 집. 폰에 펫샵 앱과 **같이 설치**되고 세이브도 따로입니다.
같이하기 포트도 다름(HTTP 47810 / UDP 47811, 발견 문자열 PETTOWN?/PETTOWN!) → 두 앱이 서로 간섭하지 않음.

> **새 대화를 연 Claude에게:** 이 파일을 먼저 읽으세요. 사용자와는 항상 한국어로, 쉽고 친절하게.
> **APK는 사용자가 "APK 만들어줘"라고 할 때만 빌드** (2026-09-25 요청). 평소엔 수정만 해 두기. 빌드하면 일반판 APK 하나만 전달(TEST판·소스는 요청 시에만). 사용량 한도로 끊겼다 재개되면 묻지 말고 이어서.

## ▶ 빌드 (Android SDK 필요 없음)
```bash
pip install --break-system-packages cryptography apksigtool
python3 build_town.py 1.7 8      # versionName versionCode (다음: 1.7 / 8) -> apk/MyLittleLisaPetTown_v1.1.apk + _TEST.apk
apksigtool verify apk/MyLittleLisaPetTown_v1.1.apk    # "v2 verified", 인증서 6dc029d1...
```
- `build_town.py`: `apktool_src/`(디코딩된 앱: 매니페스트·res·smali) + `assets/` → apktool.jar로 재조립 → 정렬 + v2 서명(key.pem/cert.pem, **새 키 금지**).
- 앱 이름/아이콘/패키지/네이티브 코드(smali)를 바꿀 땐 `apktool_src/`를 고치면 됨. 아이콘 원본 스크립트는 없음(ic_bg.png가 그림).
- 빌드 후 이전 버전 APK는 apk/에서 지우기. 테스트: `node serve.js`(8934) → `node tests/town1.js`, `town2.js`, `town3.js`, `smoke.js`.

## PET TOWN 1단계 (v1.0) — 마을 건설 경영
- **town.js** (TOWN): `TOWN_DEF`(집 8종·나무/꽃 7종·시설 5종), `TOWN_BAL`(밸런스 값), `TOWN_MS`(주민 수 해금표)
  - 상태 `S.town = { objs:[{id,k,x,y,r,n,pd,paid,cw,cr}], seq, day, svc, low, best, ms, log, why }` — 모든 집/나무/시설은 플레이어가 놓은 물건
  - 새 게임: 펫샵 + 오두막 4채(주민 8, 가능 8). 배경 집(예전 v10.0 자동 집)은 없어짐
  - 행복 H = 45 + 편의시설(≤40) + 나무·꽃(≤12, 묘목 20%·자라는 중 50%) + 가게 서비스(svc −20~+15) − 혼잡(주민 > 시설이 돌볼 수 있는 수)
    - 기존 큰 시설도 점수: 공원10/40명, 호수8/30, 가로수길6/20, 기념광장5/10, 미용실5/15, 카페6/20, 병원6/25, 닭장2/5 (행복/돌봄 수), 기본 돌봄 16명
    - svc: 손님 떠남(원하는 동물 없음 −0.6, 기다리다 −1, 용품 없음 −0.4), 판매(+0.5, 찰떡 +1, 안 맞음 −0.3), 카페 화남 −1 / 서빙 +0.4, 병원 자리없음 −0.8 / 치료 +0.6, 미용실 대기 −1.2. 매일 아침 ×0.6로 옅어짐
  - 매일 아침 `newDay`: 목표 주민 = 가능 × occFrac(H) (H20→35% … H70→100%), 하루 입주 = 가능×15% (+정류장당 1). 이탈: 7일(GRACE) 지나고 H<35가 3일 연속이면 일부 떠남
  - 펫샵 효과: 손님 빈도 ×(0.75+주민/60, 최대 3) (game.js nextCust), 동시 손님 +주민/40(최대 4), 소비력 ×(0.9+주민/500≤.3)×(0.9+H/500)
  - 손님의 80%는 **자기 집에서 걸어 나와** 가게로 옴(c.home, 걷는 시간만큼 인내심 추가), 떠날 때 집으로 돌아감 (world.js)
  - 해금(최고 주민 수 기준): 12 탑집·정류장 / 20 가족집·분수·👨‍👩‍👧가족손님(+12% 용품세트) / 30 마당집·놀이터 / 45 농가·🐶코커 / 60 2층집·🧐수집가(특정 품종 Lv3+ 또는 ⭐, ×1.8) / 90 연립·🐱엑조틱 / 130 빌라·🦜금강앵무 / 180 💎부자↑ / 250 🦎비어디드·🌟유명인↑
  - 새 품종은 data.js 끝 + `TOWN_SP`(game.js unlocked가 레벨 대신 주민 수로 판단), 그림은 art.js 표
  - 액션: 'tbuild' {k,x,y,r}, 'tmove' {id,x,y,r}, 'tdemo' {id}(비용 50% 환불). 같은 건물 하나 더 지을 때마다 +10%(무료 시작 집 제외)
  - 회전 = x/y 뒤집기(화면에서 좌우 반전, 발자국 w/d 교환). drawHouse는 `MR`로 좌표를 뒤집어서 그림
  - 샵이 커져서 겹치면 tick에서 가장 가까운 빈 자리로 자동 이동
- **townui.js** (TOWNUI): 상단 칩(👥 현재/가능 + 얼굴·행복, 시계 아래) → 마을 패널(PANELS.town), 🏗️건설 버튼(하단) → PANELS.tbuild(탭: 집/나무·꽃/시설, 썸네일은 실제 그리기 코드로 1회 생성),
  배치 모드 `App.tplace={k,x,y,r,mv}`: 지도 탭 = 위치, 🔄 회전, ✔ 짓기(초록/빨강 발자국), 나무·꽃·벤치·가로등은 연속 심기. 건물 탭 → PANELS.tobj(옮기기/철거)
- 마을 크기: VILLAGE_X0 −60, VILLAGE_Y0 −60, 동쪽 끝 W+70 (cafecore.js), 남쪽 VILLAGE_S_MAX +24 (hospcore.js). 최소 줌 0.2

## PET TOWN 2단계 (v1.1) — 큰 건물도 처음엔 없고, 원하는 자리에 건설
- **S.lay[k] = {x, y}** = 큰 건물 부지의 왼쪽 위 칸(가장 크게 키웠을 때 크기 기준). 없으면 안 지은 것. `LAY(k)` (data.js), 안 지은 건물 위치 = `LAY_FAR`(-5000, 화면 밖)
- 위치 함수가 전부 부지를 따름: cafecore `cafeW()/cafeS()`(동쪽/남쪽 모서리, 가구는 여기 기준 상대좌표), hospcore `hospAnchor()`(북동 모서리),
  farmcore `FARM_LOT`(18x27: 씨앗 가게 L+.5 / 닭장 L+1,L+6 / 밭 L+1,L+9, `STALL_POS`), 밭 작물은 f.ox/f.oy로 농장과 같이 이동, furn.js `HOME_POS`(L+3, L+1, 문은 서쪽),
  park `PARK_POS`, salon `SALON_POS`, village `LAKE/MONU`. 가로수길은 큰길을 따라(자리 선택 없음)
- 씨앗 가게는 배경 그림에서 빠지고 농장과 함께 매 프레임 그림(`FURN.stallLive`). 옛 표지판·예약 부지·카페 가는 길 돌 없음
- town.js `TOWN_DEF`에 cat 'big' 9종(farm 3,000 / home 5,000 / cafe·hosp는 기존 비용+평판 등급 / salon / park / lake / monu / avenue), `TOWN_BIG`,
  액션 'tbig' {k,x,y,(text,looks)} → 부지 기록 후 원래 건설 액션 호출(실패하면 되돌림), 'tbigmove' {k,x,y} (카페·병원·미용실은 영업 중엔 못 옮김)
  원래 건설 액션(buildcafe 등)은 부지 없으면 err 'tUseBuildMenu'. 가게가 커져서 부지와 겹치면 tick에서 가까운 빈 자리로 이동
- 내 집 없으면 집 들어가기/동물 집으로 데려가기 불가(tNeedHome), 🌾☕🏥 빠른 이동 버튼은 안 지었으면 건설 메뉴 열기
- 건설 메뉴 첫 탭 🏛️ 큰 건물(짓기/🔁 옮기기), 배치 미리보기는 부지 칸 + 큰 아이콘·이름. 큰 건물은 회전 없음(내부 배치 때문)
- 테스트: tests/big.js(전부 짓고 영업), big2.js(농장 작물 이동, 영업 중 이동 금지, 가게 확장 시 밀림, 집 없음)

## PET TOWN 3단계 (v1.2) — 상점·공공 건물 17종 (건설 메뉴 🏫 탭)
- town.js TOWN_DEF cat 'civic': 입구 간판·편의점·빵집·꽃집·동네 의원·펫 운동장·사진관·학교·경찰서·소방서·도서관·벼룩시장·펫 훈련학교·펫 호텔·시계탑 광장·전망대·웨딩 채플
  (w,d,cost,hap,sup,max = 효과가 있는 개수, need = 해금 주민 수, 모양 wall/roofc/h/roof/sign, open = 건물 없는 부지형). 회전 가능(집처럼 MR 반전)
- 그림: `drawCivic`/`civic_`(공통 몸체+창문+문+지붕+간판 `signBoard` + 건물별 장식), 부지형은 `openLot`(간판 아치, 울타리 운동장+뛰는 개, 노점 3개, 실제 시간 가리키는 시계탑, 전망대)
- 행복: 시설 한도 40 → 상점·공공 건물이 있으면 60. 효과(fx): 편의점 소비력+2%, 빵집·벼룩시장 +3%(spendK), 꽃집 녹지 한도+4, 학교 하루 입주+2, 소방서 이탈 절반,
  경찰서 도둑 이벤트 70% 차단(game.js startEvent), 도서관 수집가 +4%p, 펫 호텔 부자 손님 +5%p (`TOWN.has(s,k)`)
- 해금표 TOWN_MS에 'b:' 항목으로 추가(12 편의점·빵집 / 20 꽃집·의원 / 30 운동장·사진관 / 45 학교·경찰·소방 / 60 도서관·시장 / 90 훈련·호텔 / 130 시계탑·전망대 / 180 채플)
- 테스트: tests/civic.js, civclose.js (그림), 성능: 109개 건물 줌 0.2에서 58fps(PC)

## PET TOWN v1.3 — 돌아다니는 주민 + 건물 레벨업
- **주민 나들이** (town.js `villagerStep`, world.js에서 followStep 다음 호출): 화면용(저장 안 함, 폰마다 따로). 낮(7~22시) 동안 주민/3명(최대 14)이
  사람이 사는 집 문에서 나와 상점·공공 건물·분수·놀이터·벤치(`VISIT` 이모지)로 걸어감 → 건물이면 안에 들어가 5~15초(hidden) → 나올 때 머리 위 이모지(🥐📚💐…) → 집으로.
  15%(운동장 가는 사람은 전부)는 자기 펫과 산책. 액터 타입 'vil' (world.js drawActor 목록에 추가)
- **레벨업** (Lv1→3, 상점·공공 + 집): o.lv. 상점·공공은 행복·돌봄·효과 ×1.5 / ×2 (`lvMul`, 효과 세기는 `pow(s,k)`), 집은 레벨마다 정원 +절반(`capOf`).
  조건: 최고 주민 수 ≥ 해금 주민 수 +20 (Lv2) / +60 (Lv3) (`upNeed`), 비용 = 건설비 × 현재 레벨 × 1.2 (집 ×0.8) (`upCost`). 액션 'tup' {id}. 철거 환불은 레벨업 비용 포함 절반
- 그림: 지붕 위 ⭐ Lv 배지, Lv2 꽃, Lv3 꽃 더 + 가로등 2개. 건물 패널에 레벨 카드와 레벨업 버튼
- 테스트: tests/lvvil.js

## PET TOWN v1.4 — 주택가, 특색 있는 건물, 큰 집, 막히는 물체 (사용자 폰 피드백)
- **주택가(zone)**: `S.town.zones=[{x,y,w:20,d:14}]`, 가운데 2줄 골목(lane, z.y+6~7), 위아래 5x5 집터 4개씩(`zoneLots`). 집은 주택가 안에서만(tNeedZone), 골목 위 불가(tOnLane),
  큰 건물·상점공공은 주택가 안 불가(tInZone). 첫 주택가는 가게 서쪽 약 20칸(`firstZone`), 시작 오두막 4채는 거기. 새 주택가 'tzone' {x,y} 8,000 ×1.8^(n-1). 그림: 연두 바닥+골목+생울타리+양끝 간판(탭→마을 패널). 마을 패널 🏘️ 주택가 보기
- **건물 디자인**(`civic_` 재작성, "실루엣 먼저" 원칙): 편의점(유리 전면·색띠·24h 박스·자판기), 빵집(가파른 지붕·벽돌 화덕 굴뚝·지붕 위 거대 크루아상·파라솔), 꽃집(유리 온실·꽃 양동이),
  의원(초록 십자 간판·구급차), 사진관(거대 카메라 모양), 학교(붉은 벽돌·시계탑·종·깃발·사방치기), 경찰서(체크무늬 띠·별·안테나·순찰차), 소방서(호스 건조탑·빨간 차고문),
  도서관(계단·기둥·박공·구리 돔), 훈련학교(맨사드 클럽하우스·A프레임·터널·위브폴·점프하는 개), 펫 호텔(3층 아치창·레드카펫·뼈다귀 네온), 채플(첨탑·종·장미창·꽃 아치)
- **집 크기**: 그림을 부지 모서리 기준 x/y 1.25배, 높이 1.6배(`HS` in Q), 부지 4x4→5x5, 벽 몸통 4x3 막힘, 문 (x+1,y+3)/(돌림 x+3,y+1). 집 위 `👤n/정원` 태그(`occTag`, `HOUSE_TOP`)
- **통과 불가**: 나무·꽃은 통과, 나머지(집·시설·상점공공 전체·부지형 운동장/시장/시계탑/전망대, 입구 간판은 기둥만) 막힘. 정렬 깊이는 건물 몸통 중심 기준(`depthOf`)
- 마을 게시판: (W, H+2) 인도 옆, 1.3배, 판이 동쪽(도로)을 봄, 가로 폭 1.9칸, 메모지 9장도 판 방향으로 기울임(v1.4 이후 수정, 아직 APK 미빌드). 단골 "다음에요" → 'storylater' 서운한 얼굴 😢으로 떠남. 시작 코인 1,000
## v1.5 (versionCode 6) — 4방향 회전, 가구 이름, 주택가 길, 돔 집 정리, 추천 화면 가격
- 추천(손님) 화면 동물마다 🪙 판매가(G.price, 가족 손님은 +🧺 용품세트), 안 맞는 아이는 회색
- **4방향 회전**(집·상점공공): r 0=문 남쪽, 1=동쪽(좌우 반전), 2=북쪽, 3=서쪽. town.js `ROT`(아트 좌표에서 180° 회전) → `MR`(반전) → `HS`(집 확대) 순으로 Q에서 변환.
  `blk`/지붕(`roofTurn`)은 회전된 사각형으로 다시 그리고(보이는 면만), 뒷벽엔 `backWins`로 창문 자동. 앞면 전용(winS/winE/door/fS/fE/awning)은 회전 시 생략, 간판은 뒷벽에.
  발자국·문·막힘 칸은 `rotPt(o,u,v,W,D)`, `normR`, 작은 시설은 2방향(`maxR`). 테스트 tests/rot4.js, rot4b.js
- 가구 놓기 바/토스트에 무엇인지 표시(app.js `itemLabel`, `selLabel`)
- 첫 주택가 → 펫샵 길(`pathRects`: 골목 끝 → 가게 서쪽 x=-4 → 가게 남쪽 y=H+3 → 인도). 길 위 건설 불가(tOnPath)
- 핑크 고양이 돔 집(furn.js cardbox)의 흰 고리·흰 줄 제거
## v1.27 (versionCode 7) — 사용자 요청으로 TEST판만 전달
- TEST판 = 레벨 30(최대), 평판 500(👑 최대 등급), 코인 99,999,999, 마을 해금 전부(best 999) — build_town.py가 game.js/town.js 패치
- 안고 있을 때 아래 알림줄 글자 진하게(.carrybar)
- **길 = 플레이어가 깔고 지우는 칸** (`S.town.roads` "x,y" 배열, `rv` 버전, `roadSet`). 새 게임은 `pathRects` 모양대로 깔린 채 시작(`initRoads`, 옛 세이브도 1회). 'troad' {tiles,on}: 한 칸 20코인, 지우기 무료, 가게·큰길·건물 위 불가.
  건물은 길 위 불가(tOnPath). 가게가 커지면 가게 밑 길만 삭제(tick fitKey). UI: 건설 → ⛲시설 탭 맨 위 🛤️ 길 깔기/지우기 → 두 칸 탭 = ㄱ자 길(`roadLine`), 계속 이어짐, 깔기/지우기 토글. 테스트 tests/road.js
- 마을 게시판 1.15배, 메모지 8장 아래로
- 사람 얼굴 네모(프로필·손님·단골 등 PIC.human): translate(40,111) scale 1.32 (예전 128/2.1) → 머리카락·모자까지 보임

## 다음 단계 (사용자와 합의한 순서)
- ~~2단계~~ ✅ v1.1
- ~~3단계~~ ✅ v1.2. 이후 아이디어: 웨딩 채플 결혼식 이벤트 (주민 나들이·건물 레벨업은 v1.3에서 완료)
- 밸런스는 TOWN_BAL / TOWN_DEF 숫자만 바꾸면 됨. 사용자 요청: **돈을 쉽게 벌지 못하게** (해금의 기쁨)

---
아래는 원래 펫샵 게임(v10.0까지)의 인계 내용입니다. 코드 구조는 그대로라 참고하세요.

# My little Lisa Pet shop — 인계 패키지 (v10.0 / versionCode 124)

여자친구에게 선물하는 WebView 기반 안드로이드 펫샵 게임(한국어/러시아어)의 전체 소스입니다.
Claude Code(PC)에서 v9.67까지 작업했고, v9.68부터는 **Claude Cowork**에서 이어서 작업합니다.

> **새 대화를 연 Claude에게:** 이 파일을 먼저 끝까지 읽고, 자세한 과거 이력은 `HISTORY.md`를 참고하세요.
> 사용자와는 **항상 한국어로** 대화하세요(작업 중 진행 상황 설명도 한국어로).
> 사용량 한도 때문에 작업이 끊겼다가 다시 시작되면, 허락을 묻지 말고 하던 작업을 그대로 이어서 하세요.

## ▶ 새 채팅에서 이어가기 (2026-09-25 저장)
1. 이 zip을 풀고 `PetShop/` 폴더에서 작업. `apk/`의 최신 APK(v10.0)가 다음 빌드의 바탕이니 지우지 말 것.
2. 빌드: `python3 build_nosdk.py <versionName> <versionCode>` → 일반판 + _TEST판 생성, `apksigtool verify`로 확인(인증서 SHA-256 6dc029d1…). **새 키를 만들지 말 것** (key.pem/cert.pem 그대로). 빌드 후 이전 버전 APK는 apk/에서 삭제.
3. 테스트: `node serve.js`(localhost:8934) 실행 후 `tests/*.js`(Playwright). 기본 점검 `node tests/smoke.js`.
4. **사용자 규칙**: 항상 한국어, 쉽고 친절하게. 개선 후엔 **일반판 APK 하나만** 전달(TEST판·소스는 요청 시에만). 사용량 한도로 끊겼다 재개되면 묻지 말고 이어서 진행.
5. 코옵: 여자친구(Лиза, 러시아어 사용)와 같이하기 모드로 플레이 — 호스트 기준 상태가 동기화되므로 월드(world.js) 전용 연출은 게스트 화면도 고려할 것.

### 아직 안 한 아이디어 (사용자에게 제안했던 것)
- 웨딩 채플(두 사람 결혼식 이벤트) · 펫 대회장(주간 미모/재주 대회) · 펫 호텔·유치원 · 펫 훈련학교 · 베이커리/펫 간식 공방 · 주말 벼룩시장 · 사진관(가족사진 액자) · 꽃집 온실 · 시계탑 광장 · 펫 운동장 · 전망대 · 마을 입구 간판
- 예전 과제 #3: 나머지 건물 다듬기(씨앗 가게 노점, 펫샵 벽 위/외벽, 카페·병원 외벽)

## v10.0 주민 집 다양화
- town.js drawHouse: 8종 KINDS = 오두막(cottage)·가족집(family, 현관 지붕·생울타리)·2층집(twostory, 모임지붕·발코니)·빌라(villa, 3~4층·물탱크·VILLA 간판)·마당집(yard, 울타리·개집·빨랫줄·텃밭)·농가(barn, 맞배 2단 지붕·둥근 창)·연립(row, 3채 각각 색)·탑집(tower, 원통 탑)
- 벽 8색 × 지붕 8색(h.cw/h.cr, 좌표 해시) → 같은 모양도 색이 다름. 크기 줄임(단단한 칸 3x2)

## v9.99 펫 미용실 + 낚시 + 따라다니는 펫 + 주민 집들
- assets/salon.js (village.js 다음): SALON_POS (-30, H/2-4) 10x8, 팻말 (x+w+1, y+d-1) → 40만 'buildsalon'. S.salon {built, q, staff, seq, spawnT, served, lost}
  - 손님(영업 중 26~50초마다, 대기석 4): in → wait(110초 넘으면 화나서 감) → groom(목욕4·드라이3·커트4·리본2초, 미용대 2개) → pay(6초 뒤 결제, 금액 말풍선) → out
  - 미용사 'groomer'(최대 2, 고용 900, 레벨업 700×lv, 일급 BAL.WAGE_K 적용)가 자동, 사장님은 기다리는 손님 터치로 직접 미용('salongroom')
  - '가게 펫 모두 미용'(마리당 80, p.groomed → 판매가 ×1.2). 패널 PANELS.salon(app2.js). 출퇴근 포함, 일급 game.js closeShop
  - world: SALON.ground/collect/solid/sync(손님 'sc'=patient 타입+a.salon, 미용사 'ss'=hstaff). sync는 cleanup 루프보다 먼저 호출해야 함!
- assets/town.js: 주민 집 TOWN.houses() (빈 땅 6칸 격자, 예약 구역 제외, 해시로 42% 생략) — 창문 밤에 불, 굴뚝 연기, 우체통. 화면 안의 집만 그림
  - 따라다니는 펫: S.follow[플레이어id] = 집 펫 id ('follow' 액션). 집 → 펫 탭 '🐾 데리고 다니기'. 물고기류 불가. 파트너 펫도 보임
  - 낚시: 호수 터치 → PANELS.fishing, 하루 12번, ❗ 뜬 뒤 0.9초 안에 당기기. 'fishcast' {hit}: 붕어·잉어·메기·장화·조개·보물상자(+뽑기권)·액솔로틀(집 수족관 있으면 집 펫, 없으면 1500)
- 테스트: tests/town.js, tests/salon2.js

## v9.98 펫샵 수익 조절 (판매가 기준값은 그대로)
- BAL.BUY_K 1.35: data.js 끝에서 SPECIES[k].cost ×1.35 (펫 주문 원가↑, 5단위 반올림)
- BAL.DECOR_CAP .25: 인테리어 판매가 보너스 최대 +40% → +25%
- BAL.TIP .06: 빨리 계산 팁 10% → 6%
- BAL.COMBO_STEP .06 / COMBO_CAP .3: 러시 콤보 보너스 +10%/단계·최대 50% → +6%·최대 30%
- 추정: 중간 펫 1마리 순이익 약 -30% (인테리어 만렙·콤보 기준)

## v9.97 마을 꾸미기 4종 (assets/village.js, park.js 다음 로드)
- S.village = { avenue, lake, monu(짓은 날), monuText, monuLooks, board }
- 🌸 가로수길 30만: 도로 동쪽(W+7.7)·서쪽(W+.8, 건물 앞 제외) 4칸마다 나무+가로등, 계절 season(day)=((day-1)%28)/7 → 봄 벚꽃/여름/가을 단풍/겨울 눈. 팻말 (W+8, 2)
- 🦢 호수 80만: LAKE (W+18, max(24,H+6)) 18x16, 두 연못+수로+빨간 다리(걸어서 건넘), 백조 보트, 백조, 정자, 낚시꾼, 나무·벤치·가로등. 물은 못 걸음
- 💑 기념 광장 50만: MONU (-13, H/2-3) 7x7 (펫샵 서쪽), 청동 커플 동상(두 사람 look, 오프스크린 스프라이트로 1회 렌더 — c.filter는 너무 느려서 금지), 새길 글(짓을 때 입력, 22자), 하트 벤치, 하트 장미 화단
- 📋 마을 게시판(무료, 항상): BOARD (W-2, H+1). 매일 날씨·소식 2개·주민 부탁 3개(농작물/달걀 n개 → 코인, 보상 = 판매가×n×1.5~2+100). 'vdeliver'. 패널 PANELS.vboard(app2.js)
- 액션 'vbuild' {k, text, looks}, 'vdeliver' {rid}. game.js tick에 VILLAGE.tick
- 테스트: tests/vill.js, tests/vtime.js(프레임 속도)

## v9.96 마을 공원 + 방석 같이 쓰기 + 병원 담당실
- 공원(park.js, index.html에서 hospcore 다음 로드): PARK_POS = (W+9, -32) 16x14, 짓기 전 공원 부지 점선 + 큰 팻말(가격 표시), 팻말 터치 → 100만 코인에 짓기(action 'buildpark', S.park.built)
  - 잔디·산책로·분수·연못(오리)·놀이터(그네·미끄럼틀)·벚꽃/소나무·벤치·가로등(밤에 켜짐)·꽃밭·피크닉·입구 아치, 산책하는 주민 4명(강아지 3)
  - world.js: PARK.ground / PARK.collect / walk()의 C.park(단단한 칸), app.js 'parksign'/'park' 터치
- 집 펫: 같은 층 방석 중 랜덤, 한 방석에 최대 3마리(자리 조금씩 어긋나게)
- 병원: 같은 직종 2명이면 담당실 분리(hospSpecOf): 수의사1 진료실 / 수의사2 엑스레이·CT·수술, 간호사1 치료실 / 간호사2 입원실. 방이 없으면 전부 담당. 자기 방 먼저, 7초 이상 기다린 다른 방 환자는 도와줌. 직원 패널에 🏷️ 담당 표시
- 테스트: tests/park.js, tests/petbeds1.js, tests/hospstaff.js

## v9.95 직원 출퇴근
- world.js commute(): 영업 종료(G.isOpen false) + 그 건물 손님/일 없음 → 직원이 길(마을 북쪽/남쪽 끝)로 걸어가 사라짐. 영업 시작 → 길에서 걸어와 자리로
- 실제 액터는 a.hidden(그리기·라벨·터치 제외), 대신 'gh'+키 액터가 걸어감. 상태 cmState: on/out/gone/in
- 대상: 펫샵 sf_*, 카페 cs*/hospIn 'c'+id(계산원·놀이), 병원 hs*, 농장 fs*
- 코어: game.js stepStaff는 영업 중에만 새 일(하던 일은 마무리), farmcore 일꾼도 영업 중에만 (why 'off')
- 테스트: tests/commute.js

## v9.94 집 펫 방석 나눠 쓰기
- home.js petBrain: 같은 층의 h_petbed / y_dogtent 중 다른 펫이 쓰거나 가는 중(a.bedId)이 아닌 것을 랜덤 선택. 빈 방석이 없으면 돌아다님
- Home._pets() 테스트용 노출. 테스트: tests/petbeds.js

## v9.93 병원 직원 2명째도 보이고 일함
- world.js: 병원 직원마다 자기 역할 스테이션(HOSP_TX.stn 기준) 중 k번째를 대기 위치로. 같은 역할 2명이 같은 칸에 겹쳐 5명 중 3명만 보이던 문제
- hospcore staffWork: 환자 치료 중(m.tt>0)인 직원은 새 환자 안 받음 → 다음 비어있는 동료가 받음 (2번째 의사/간호사 처리 수 0이던 문제)
- 테스트: tests/hospstaff.js

## v9.92 주방 장식 정리
- 가스레인지의 고정 🍳, 조리대의 고정 🍰 제거 (항상 떠 있어서 음식이 남아 있는 것처럼 보였음)
- 조리대(패스)에는 실제로 요리돼 대기 중인 음식(cf.dishes>0)만 최대 3개 표시

## v9.91 카페 7가지 수정 (사용자 테스트 피드백)
- 계산원: 계산대 북쪽(뒤)에서 남쪽(손님) 바라봄
- 서빙: 평소 홀 중앙(cafeHallSpot) 대기 → 음식 완성 시 주방 패스 → 테이블. 테이블 옆 칸은 카페 안쪽만(cafeTableSpot inside)
- 요리사: 요리 중 매 프레임 가스레인지 바라봄. 파트너 화면용 m.fd/m.ff(방향) 동기화
- 식사 14초(a.eatDur), 접시+음식이 점점 줄어듦, 포크, "냠냠", 😋/💕 / 결제 2.6초
- 파트너(게스트) 화면에서 식사·결제 안 하던 문제: cafecore serveOrder가 cf.done[{id,pay,t}] 기록(90초), world가 이걸로 served 판단
- 울타리 놀이 직원: penPlay/drawPenPlay — 울타리 안을 걸어다니다 멈춰서 공 던지기(🎾)/쓰다듬기(💕✋)
- 테스트: tests/cafeguestmode.js, tests/penplay.js

## v9.90 닭 그림 + 카페 남쪽 문
- 닭장: 다 자란 닭(COOP_GROW_DAYS=3일 이상)은 world.js drawHen()으로 진짜 닭 모양(흰/갈색, 볏, 꼬리). 병아리는 기존 병아리 그림. 알은 원래도 다 자란 닭만 낳음
- 카페 남쪽 벽 동쪽 끝 2칸(x = W-2, W-1)에 문: 펫샵 북쪽 뒷문과 일직선. cafecore door.sy/sxs + crossOk, world wallRects sdoor + wallStep, cwallS 생략 + 기둥

## v9.89 카페 요리사·서빙 직원이 실제로 움직임
- world.js cafeStaffStep(): 요리사/서빙은 actors('cs'+id, hstaff)로 실제 이동. 손님이 계산대 주문 완료 시 o.ord, 착석 시 o.sat 표시
- 요리사: o.ord 주문 → 가스레인지 앞에서 CAFE_COOK_T(lv)초 요리(팬·불·김 + 진행 링) → cafecook → o.rd
- 서빙: o.sat && o.rd → 패스(counter) 가서 집기 → 테이블 옆 칸(cafeTableSpot)으로 운반(접시 표시) → cafeserve → 손님 식사→계산대 결제→퇴장
- 서빙 직원 없으면 요리사가 직접 운반. 둘 다 없으면 사장님이 패널에서
- cafecore: cf.noW(월드 미작동 시간)>3초면(집 화면 등) 예전 타이머 방식 자동 처리
- 호스트가 m.px/m.py/m.jk/m.jd/m.jp를 S에 기록 → 게스트 화면은 따라 그림. 토스트 없는 cafeDo() 사용
- 테스트: tests/cafestaff.js [역할목록]

## v9.88 집 가구 대폭 추가
- 새 파일 assets/furn3.js (index.html에서 furn2.js 다음 로드): y_* 가구 39종 그리기 + FURN.DEF, FURN.item 체인에 'y_' 추가
- homecore HOME_FURN에 y_* 39종 + x_gacha, x_vending 추가 (카테고리 bed/living/kitchen/deco/light/pet)
- HOME_BED_Q(낮잠 보너스): h_bed1, y_bunk2, h_dbed2, h_canopy3
- homelife 활동 연결: 요리 y_kitchen / 식사 y_bar,y_coffee / TV y_game / 독서 y_desk2,y_shelf / 물주기 y_cactus,y_sunflower,y_bonsai,y_tulip / 휴식 y_lsofa,y_massage,y_hammock / 음악 y_record / 옷 y_mirror,y_closet,y_vanity2
- 이름: i18n15.js 끝 (ko/ru), 터치 반응 home.js fl 맵 + huse_*
- 테스트: tests/furngal.js (썸네일 갤러리), tests/homefurn.js (2층 배치)

## v9.87 카페 손님 동선 정리
- 흐름: 입장 → 계산대에서 주문 → 자리 → (서빙) 식사 5초 → 계산대에서 결제(+금액) → (슬롯 손님) 슬롯머신 → 퇴장
- 버그1: 서빙 후 슬롯머신 가는 손님이 의자(seatAt)에 계속 끌려와 주문 말풍선 없이 테이블에 붙어 있었음 → world.js cafeMeal/cafeDepart/cafeStand, players 루프가 식사·결제 후에만 슬롯으로 이동
- 버그2: 앉기 전에 서빙되면 그냥 나가던 문제 → 자리로 가서 afterSit 콜백으로 식사
- cafecore: 서버는 o.age >= CAFE_SEATED_AGE(24)부터 서빙, 슬롯 player.w=20초(식사+결제) 뒤부터 t 감소
- 테스트: tests/cafeflow.js, tests/cafelong.js

## v9.86 밸런스 미세조정
- EXPAND_K 3.5→2.5 (확장·레벨업 2.5배), 건설 BUILD_K 3 유지
- BAL.TOP_K .65: game.js price()에서 sell>1000 품종에 최대 +65% (1940 품종에서 최대) → 최고급+부자 ≈8,080
- RARE_SELL_MUL 3.5→3.4 → 희귀 최고급+VIP ≈25,350 / 중간 품종 보통 ≈1,920 유지

## v9.85 경제 밸런스 (data.js `BAL`)
- `BAL = { WAGE_K:3, FARM_WAGE_K:1.5, EXPAND_K:3.5, BUILD_K:3, SALE_K:.8 }`, `balCost()` = cost*EXPAND_K (100단위 반올림)
- 월급: 펫샵/카페/병원 ×3, 농장 ×1.5 / 확장·레벨업(방, 카페, 병원, 집, 농장, 닭장) ×3.5 / 카페·병원 건설 ×3
- 판매가 ×0.8, 셀럽 2→1.5, 부자 1.6→1.3, 희귀 RARE_SELL_MUL 6.25→3.5, VIP_MUL 1.3→1.2
- 조정은 BAL 값만 바꾸면 됨. 측정 스크립트 tests/econ2.js

## ⚠️ 가장 중요한 규칙
1. **서명은 반드시 이 폴더의 `key.pem` / `cert.pem`으로만 하세요.** 새 키를 만들면 폰에 깔린 앱 위에
   업데이트가 설치되지 않고, 저장 데이터가 사라집니다.
   서명 인증서는 `C=SK, O=Seungjin, CN=Seungjin Pet Shop` / SHA-256 `6dc029d1e6d0cb79...`이어야 합니다.
2. 빌드할 때마다 `versionCode`는 +1 하고 `versionName`도 올리세요 (다음 버전: **10.1 / 125**).
3. APK는 항상 **일반판 + `_TEST`판** 두 개를 함께 만드세요(빌드는 둘 다). **사용자에게는 일반판 APK 하나만 전달** — TEST판·소스(인계 zip)는 달라고 할 때만. TEST판은 패키지 이름이 `com.seungjin.petshop.test`이고,
   코인 999999, 레벨 30, 명성 240으로 시작합니다.
4. 빌드된 `assets/*.js`는 전부 `node --check`로 문법 검사를 하세요. 예전에 TEST판 `game.js` 인코딩이 깨져서
   빈 초록 화면만 나온 적이 있습니다. JS를 읽고 쓸 때는 항상 UTF-8로 하세요.
5. APK 안의 파일 경로에 `\`가 있으면 안 됩니다(assets 하위 폴더를 못 읽는 버그가 있었음). `build_linux.sh`가 자동으로 고칩니다.

## 폴더 구조
```
AndroidManifest.xml     패키지 com.seungjin.petshop (현재 124 / 10.0)
assets/                 게임 전체 (HTML/JS, canvas로 전부 그림)
  game.js               상태 S + G.apply(s, action, by) 핵심 로직
  app.js / app2.js      UI, 클릭 디스패처(act / actR)
  world.js              마을/가게 렌더링, 이동, 액터(손님·직원·환자 등)
  furn.js / furn2.js    아이소메트릭 가구, 건물 외관, 잔디·도로(groundTex / road)
  art.js                사람·동물 그림 (ART.human / ART.pet)
  farmcore.js cafecore.js hospcore.js homecore.js home.js ...  각 사업/집 시스템
  i18n*.js              한/러 문자열
res/  smali/            앱 아이콘/이름, WebView 래퍼(MainActivity)
prebuilt/classes.dex    미리 빌드된 dex (자바 쪽은 바뀌지 않으므로 그대로 재사용)
build_linux.sh          코워크(리눅스)용 빌드 스크립트 (Android SDK 필요)
build_nosdk.py          SDK 없이 빌드: 이전 APK를 바탕으로 assets만 교체 + 버전 패치 + v2 서명 (dl.google.com 차단 시)
build_windows.ps1       참고용: PC에서 쓰던 빌드 스크립트
serve.js                테스트용 로컬 서버 (node serve.js → http://localhost:8934)
apk/                    최신 APK (v10.0 일반판 + TEST판; 다음 build_nosdk.py의 바탕으로도 쓰임 -- 지우지 마세요)
HISTORY.md              전체 작업 이력 (Claude Code 메모리 파일 그대로)
```

## 빌드
```bash
VN=9.86 VC=109 ./build_linux.sh
```
**코워크 샌드박스에서는 dl.google.com이 막혀 있어 SDK를 받을 수 없었습니다(2026-09-24).** 그럴 땐
```bash
pip install --break-system-packages cryptography apksigtool   # PyPI는 열려 있음
python3 build_nosdk.py 9.86 109          # apk/ 안의 최신 APK를 바탕으로 일반판+TEST판 생성
apksigtool verify apk/MyLittleLisaPetShop_v9.86.apk   # "v2 verified" + 인증서 6dc029d1... 확인
```
`build_nosdk.py`는 res/·AndroidManifest(버전 제외)가 바뀌지 않았을 때만 쓸 수 있습니다(assets만 교체).
versionName 글자 수가 바뀌면(예: 9.99 → 10.00) 멈추도록 되어 있으니 그때는 SDK 빌드를 쓰세요.
서명은 v2만 넣습니다(minSdk 24라 유효, 같은 인증서라 기존 앱 위에 업데이트 설치됨).
필요한 도구는 Android build-tools 34(aapt2, zipalign, apksigner), `platforms/android-34/android.jar`,
Java 17 이상, python3, node입니다. 샌드박스에 없으면 Android command-line tools를 받아
`sdkmanager "build-tools;34.0.0" "platforms;android-34"`로 설치하세요. 라이선스 프롬프트는
`yes | sdkmanager --licenses`로 넘깁니다. 인터넷이 막혀 있다면 사용자에게 알려 주세요.
`apksigner`는 이 PEM 키를 그대로 못 읽으므로 스크립트가 DER로 변환해서 사용합니다.

## 테스트 방법
`node serve.js`를 실행한 뒤 브라우저로 `http://localhost:8934`에 접속합니다. 아니면 Playwright로
`assets/index.html`을 열어도 됩니다. 콘솔에서 전역 `S`, `G`, `World`, `FURN`, `ART`, `actR({t:'...'})`를
직접 조작해 테스트합니다. 예:
- `S.coins=999999; S.rep=240; S.level=30; actR({t:'buildcafe'}); actR({t:'buildhosp'})`
- 카메라 이동: `World.cam.follow=false; World.cam.x=ISO.wx(x,y); World.cam.y=ISO.wy(x,y); World.cam.z=0.8`

## 현재 상태 (v9.85, 2026-09-24)
v9.85: 결제 금액 말풍선 "+🪙N"(world.js): 카페 손님 계산대 결제(o.paid, serveOrder에서 기록), 슬롯머신 사용액(cf.slotPaid, 5초),
병원 환자 결제 직후(p.paid, leaving 첫 3.5초). 직원이 서빙한 카페 손님도 먹고→계산대 결제 흐름(a.served = order.paid).

### v9.83
v9.83: 카페 손님은 만들 수 있는 요리만 주문(cafecore `makeableDishes`: 만들어 둔 요리 − 이미 걸린 주문, 또는 열린 주문 재료를 뺀 냉장고로
만들 수 있는 요리). 없으면 워크인은 20초 뒤 재시도, 분양 손님은 줄에서 기다림(spawnT 15).

### v9.82
v9.82: 집의 물고기·아홀로틀: homecore `htake`는 집에 수족관(aquarium, 집 Lv4 가구) 없으면 err homeNeedAquarium.
home.js `placeSwimmer`: 수족관 있으면 그 안에서 좌우로 헤엄(수족관 여러 개면 나눔, 수족관 층 fl 따라 표시), 없으면(기존 세이브) 바닥의 작은 어항에 고정.

### v9.81
v9.81: 집에서 동물 탭(쓰다듬기) 오류 "act is not a function @home.js:239" — Home 클로저 안의 지역 변수 `act`(현재 생활 활동)가
전역 act() 함수를 가림 → `window.act(...)`. v9.77의 오류 위치 표시 덕분에 바로 찾음. (앞으로 home.js 안에서는 전역 act를 window.act로 부를 것)

### v9.80
v9.80: 게스트가 호스트에 못 닿으면(동기화 전 4회 실패 / 동기화 후 25초) `leaveHost()`로 내 가게 복귀 + 토스트 coopFallback,
CFG.coop 초기화(다음 실행 때 자동 재접속 안 함), 보내지 못한 행동 폐기. 증상: "분양 후 트럭이 안 와요"(행동이 없는 호스트로 전송, 시계 정지).

### v9.79
v9.79: 출석 보상 받기(app2.js `xattend`) 후 퀘스트 창 자동 닫힘(보상 토스트는 그대로).

### v9.78
v9.78 펫 꾸미기: data.js PET_WEAR 10→33종(목걸이 kind: tag/bell/heart/pearl/rainbow/bandana, 모자 kind: party/bow/crown/flower/
beret/santa/witch/cap, **새 슬롯 'cloth'**: stripe/hoodie/dress/rain/tux/sailor/heart/dots). art.js `collarAt`/`hatAt`/`clothOn`,
옷 가능 체형 `ART.canCloth`(dog/cat/rabbit/rat/guinea/ferret; 나머지는 game.js wear에서 err 'noCloth').
쥐(rat 그림 = hamster·rat): 목걸이를 머리 전에 목에 그리고 태그는 턱 아래(예전엔 가슴). **뱀 새 디자인**: 똬리+세운 목+넓은 머리+
갈라진 혀(원판 튜브 그리기). **썸네일 자동 맞춤** app.js `fitPet`: 360px 스크래치에 3.5배로 그려 알파 경계 측정 → 192px 칸 중앙(여백 6%).
액세서리 창 칸 = 그 동물이 아이템을 착용한 미리보기. 테스트 스크립트는 /home/claude/petshop/tests (gal.js, big.js, wearpanel.js, smoke.js).

### v9.77
v9.77: 사용자가 집 액세서리 창에서 "[오류] Script error. @:0" (게스트로 여자친구 가게 접속 중). 재현 실패(단독 전 종×전 액세서리,
실제 호스트+게스트 2페이지 연결 + 가구 196개 2층 집 + 층 이동/탭/뒤로/일시정지 반복 → 0건). 폰 WebView는 오류 상세를 가림 →
index.html 인라인 스크립트가 setTimeout/setInterval/requestAnimationFrame/addEventListener 콜백을 try/catch로 감싸
`[오류] 메시지 [어디서: click/interval/frame/timer/onNativeBack…] 함수 < 파일:줄` 표시(`window.__guard`, removeEventListener 호환 WeakMap).
Android 콜백 onNativeBack/Pause/Resume도 guard. **다음에 오류 스크린샷이 오면 위치가 찍혀 있음 → 그걸로 수정.**
테스트 도구: scratchpad의 coop2.js/coop3.js(호스트·게스트 2페이지를 node가 중계) 같은 방식이 같이하기 재현에 유용.

### v9.76
v9.76: 카페 손님 인내심 — 주문 후 `o.age`가 `CAFE_WAIT_NOFOOD`(60초, 재료 없어 못 만듦) / `CAFE_WAIT_OK`(150초, 음식 있는데 안 줌)를
넘으면 돈 안 내고 떠남(cafecore.js tick, `cf.angry`에 {id, line}, `cf.lost`++, joy −10). world.js: 화난 표정 + 말풍선
cafeAngry0 "음식이 없네…" / 1 "음식을 안 주네!" / 2 "음식을 언제 주는 거야!" + 토스트(8초에 1번).

### v9.75
v9.75: 업데이트 선물 = **모든** 동물(가게+집) 배고픔·청결 100, 스트레스·심심함 0 (새 버전 첫 실행마다 한 번).
게이지 변화 속도 50%: data.js `GAUGE_SPEED = 0.5`를 stepPets의 k에 곱함(배고픔·청결 감소, 스트레스·심심함 증가, 수줍음/굶주림 스트레스 포함).
놀이방·밤 회복 속도는 그대로. 10분 테스트: 예전 −31.5/−22/+7/+24 → 지금 −15.8/−11/+3.5/+12.

### v9.74
v9.74: 여자친구 폰에서 업데이트 후 동물이 배고픔/더러움 → 꺼짐→재실행 멈춤은 정상(E2E 확인). 원인은 **같이하기 호스트 예외**:
호스트는 앱을 내려놔도 tick을 계속 돌렸고, `CFG.coop==='host'`면 실행 때마다 자동 호스트 → 이제 파트너가 실제 접속 중일 때만 백그라운드 tick.
**업데이트 선물** `updateCare()`(app.js): 새 버전 첫 실행 때 한 번, 청결/배고픔<80인 아이를 90으로(`CFG.carev`, `APP_VER` in data.js —
build_nosdk.py가 자동 기입). **카페·병원 영업시간 = 펫샵**: cafecore/hospcore tick에서 `G.isOpen(s)` 아니면 새 손님/환자 없음(안에 있던 사람은 마저 처리).

### v9.73
v9.73 농장 일꾼: 고정 순서 → **급한 일 점수제**(farmcore.js `nextJob`): 물(0.6~1.0, 목마른 칸 수), 수확(0.45~0.85), 닭 모이(0.55~0.9),
달걀(0.3~0.6), 심기(갈아둔 빈 칸 0.35 / 새 땅 0.2 — **물·수확이 밀려 있으면 새 땅 안 감**). 다른 일꾼이 향하는 종류는 -0.45
(물이 3×waterN 넘게 밀리면 -0.15). 한 번에 여러 칸: 물 `waterN`=2+lv/2, 수확 `harvestN`=2+lv/3, 씨뿌리기도 waterN칸(갈아둔 칸만).
m.jk = 계획 중인 일 종류. 하루는 플레이어가 열고 닫아서 **실제 몇 분**일 수 있음 — 처리량 기준으로 설계할 것.
시뮬(64칸 다 심김, Lv1+Lv2, 하루 300초): 예전 물 못 준 칸 38~51/일·닭 0/2 → 지금 0~3/일·닭 2/2, 6일 수확 50→86.

### v9.72
v9.72: **희귀동물 = ✨레어 털색(rareOf: gold/rainbow/star/galaxy/pearl)** (사용자 선택, ★별 동물 아님).
판매가 배율 2.5→6.25(`RARE_SELL_MUL`, extra.js). `matches()`: VIP는 레어만, 그 외(일반/부자/유명인/브리더/온라인)는 레어 불가.
sell 액션 에러 `vipOnly`/`vipWantsRare`(평판 감소 없음). **VIP 방문**: game.js `stepVip` — 영업일마다 레어 보유 시 1명(+35% 2명),
없으면 40%; `spawnVip` type 'vip', mul 1.3(`VIP_MUL`), 인내 240초, 레어 없으면 45초 둘러보고 떠남. 이벤트 `vipIn`/custLeft.vip 토스트.
VIP 외형: 황금 정장+왕관+선글라스(world.js, 손님 패널 초상화). 입양 게시판 레어 카드에 실제 판매가 + "VIP 전용".

### v9.71
v9.71 (폰 테스트 전):
- **귀 하나(진짜 원인):** art.js `earsDog` flop/long 귀의 시작·끝점 x가 좌우(s)로 뒤집히지 않아 **오른쪽 늘어진 귀가 머리 뒤에 숨음**
  (달마티안, 래브라도, 비글, 닥스훈트 등). s로 미러링 + 바깥쪽으로 R*.1 이동.
- **직원 씻기기:** 🧹청소 직원은 오물이 없으면 가장 더러운 동물을 씻김, 🍖돌봄 직원은 배고픔/더러움 중 더 급한 쪽 먼저,
  기준 청결 50%(`STAFF_CLEAN_AT`). 동물 113마리 30분 시뮬레이션: 더러움·배고픔 0.
- **Wi-Fi 같이하기:** 게스트가 `{}`(호스트 미게시)·무응답·깨진 응답을 **조용히 무시**하던 것 → 실패로 세고 이유 표시,
  첫 동기화 전엔 🟡"연결하는 중", 동기화되면 패널 닫고 "OO님의 마을에 왔어요". fetch 타임아웃 3→8초.
  의심 원인: 한 폰에 일반판+TEST판이 둘 다 떠 있으면 같은 포트 47800을 먼저 잡은 앱이 응답(네이티브는 수정 불가 — dex 재빌드 도구 없음).
- **문구 키 충돌 정리:** `coopTitle/coopDesc`(같이하기) ← 닭장이 덮어씀 → 닭장은 `henTitle/henDesc`, 같이하기 미션은 `coopMission`.
  병원 가구 이름은 `hsf_`(집 가구 `hf_`와 분리, `hospFurnName`). 검사 스크립트 아이디어: i18n 파일을 순서대로 vm에서 실행하며 덮어쓰기 감지.

### v9.70
v9.70: "귀가 하나인 동물"(러시아어 입양 게시판의 프렌치불독) 신고 → 그림은 귀 2개가 정상, **2열 카드가 긴 러시아어
문구 때문에 화면 밖으로 밀려 오른쪽 귀가 잘린 것**. style.css `.grid2/.grid3` → `minmax(0,1fr)`, `.tile` 줄바꿈.
또 `PIC.pet` 썸네일 90x90 → 90x102(발 기준 y 90)로 큰 귀/토끼 귀 끝 잘림 해결. 새 UI는 러시아어 360px 폭으로 꼭 확인할 것.

### v9.69
v9.69 (사용자 요청 3건, 폰 테스트 전):
- **프리징 수정:** 원인은 길찾기(world.js `findPath`). 매 단계 open 목록 전체 정렬 + 선형 검색, 칸마다 `walk()`가
  집/배달상자/카페·병원 배치를 재계산 → 넓은 마을에서 한 번에 수백 ms. 이제 힙 A* + 숫자 키 + 탐색별 walk 메모,
  `walkCtx()`로 walk 준비물을 프레임당 1번(findPath 시작마다 새로). 옛 코드와 1500쌍 경로 비용/25,960칸 판정 **완전 일치**,
  총 26배, 최악 335ms→10ms(PC).
- **꺼진 동안 동물 상태 고정:** `stepPets(s, dt, offline)`에서 offline이면 배고픔/청결/스트레스/심심함/성장 변화 없음
  (쿨다운 타이머와 진행 중인 교배만 흐름). 앱이 백그라운드일 때(`onNativePause`/`document.hidden`)는 tick 자체를 건너뜀
  (MainActivity가 pauseTimers를 안 해서 JS가 계속 돌고 있었음). 선물(welcomeBack)은 그대로.
- **농장 일꾼 1종('hand'):** 수확→물주기→닭 모이→달걀→씨 심기 순서로 혼자 다 함. 최대 4명, 여러 명이면 서로 다른 칸.
  옛 sower/waterer/harvester는 `FARM.ensure`에서 'hand'로 자동 변환(레벨·이름 유지).
- 3번 "나머지 건물 다듬기"는 위 요청 때문에 **아직 시작 전**(현재 모습 스크린샷만 봄).

### v9.68
v9.68: **농작물 다듬기 완료** (아래 "다음 할 일" 2번). 작물 1.35배, 잎 외곽선, 다 자란 단계 직접 그림 + 반짝임.
성능을 위해 작물은 (작물, 단계)별로 오프스크린 스프라이트에 한 번만 그리고 drawImage로 찍습니다(`cropSpr`, `paintCropPlant`).

### v9.67 때 내용
v9.66 이후에는 **디자인 개선 1차**를 했습니다. 자세한 내용은 HISTORY.md 맨 아래에 있습니다.
- 마을 잔디: 톤 얼룩, 풀 포기, 작은 꽃(가게 주변과 도로는 일부러 비움). 도로: 연석, 보도블록 이음새.
- 가게, 카페, 병원 둘레에 은은한 바닥 그림자.
- 농장: 나무 울타리, 흙 테두리, 고랑 있는 밭, 물 준 밭은 진한 흙색.
- 집 외관: 판자벽, 기초석, 창틀·창살·꽃상자, 기와 지붕, 다락 창, 현관 디딤돌.
- 사람 머리카락 윤기(천사 고리). 동물 그림은 이미 좋아서 그대로 두었습니다.
- 사용자가 고른 분위기: **지금 톤은 유지하고 완성도만 높이기.** 예전에 가게 주변의 나무·울타리·가로등을
  "지저분하다"며 지운 적이 있으니, 가게 바로 주변에는 장식을 넣지 마세요.

## 다음 할 일 (사용자가 요청함)
2. ~~**농작물 다듬기**~~ ✅ v9.68에서 완료 (`world.js`의 `drawCropPlant` / `drawOneCrop`, 작물 10종: wheat, carrot, potato,
   tomato, corn, pumpkin, lettuce, strawberry, blueberry, grape)
   - 지금은 작물이 작고, 다 자라면 그림 대신 이모지(`cr.icon`)가 뜹니다.
   - 계획: 식물을 약 1.3~1.4배 키우고, 잎에 외곽선을 넣고, **다 자란 단계를 직접 그리기**(빨간 토마토,
     주황 호박, 노란 옥수수, 보라 포도송이 등)와 수확 가능 표시(반짝임)를 추가합니다.
     물이 필요한 밭의 💧 표시는 유지합니다.
3. **나머지 건물 다듬기**: 씨앗·농산물 가판대(`furn.js`의 `marketStall`), 펫샵 벽 윗부분과 외벽 마감,
   카페·병원 외벽.
- 그다음은 사용자와 상의하세요. 아직 정하지 않은 아이디어로 "모두 먹이를 줬을 때 '먹이 주기' 버튼 문구"가 있습니다.
