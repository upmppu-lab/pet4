# My little Lisa PET TOWN — 소스 (v1.30 / versionCode 31)

## 한국어 안내 (나승진님용)

이 폴더가 게임의 **전체 소스**예요. 순수 HTML + JavaScript라서 따로 설치할 것 없이 브라우저에서 바로 돌아가요.

**구글 AI Studio에서 이어서 작업하는 방법**
1. AI Studio → **Build** 메뉴에서 새 앱을 만들고, 이 zip 파일을 업로드(또는 폴더 안 파일 전부 업로드)해요.
2. 첫 메시지로 아래 "Gemini에게 보낼 첫 메시지"를 복사해서 보내 주세요. 게임 구조를 먼저 이해하고 작업하게 돼요.
3. 미리보기 화면에서 게임이 바로 실행돼요. 한국어 버튼을 누르고 시작하면 돼요.

**주의할 점**
- AI Studio에서는 **APK를 만들 수 없어요.** 휴대폰 앱(APK)으로 만들려면 같이 드린 "APK 빌드 도구" zip이 필요해요.
  고친 파일들을 그 zip의 `assets/` 폴더에 덮어쓴 뒤 `python3 build_town.py 1.31 32` 로 빌드해요.
- APK 빌드 도구 zip 안의 `key.pem`(서명 키)은 **절대 AI Studio나 인터넷에 올리지 마세요.** 이 키가 있어야 폰에 깔린 게임을 지우지 않고 업데이트할 수 있어요.
- 세이브 데이터는 브라우저(localStorage)에 저장돼요. 미리보기에서 한 게임은 폰 게임과 따로예요.

---

## Gemini에게 보낼 첫 메시지 (복사해서 사용)

```
This is my WebView game "My little Lisa PET TOWN" (plain HTML5 canvas + vanilla JS, no build step, no framework).
Please read AI_STUDIO_GUIDE.md (English part), docs/README_HANDOFF.md and the end of docs/HISTORY.md first.
Rules: talk to me in Korean, simply and kindly. Keep the existing file structure and coding style
(global objects, no modules, no React). Add new UI text to i18n15.js in BOTH ko and ru.
When you change something, tell me which files changed so I can copy them into my APK build folder.
```

---

## English — technical overview for the AI assistant

**What it is:** a cozy isometric pet-shop + town-building game (Korean / Russian UI), shipped as an Android
WebView APK (`com.seungjin.pettown`). Everything is in this folder; `index.html` loads ~50 classic `<script>`
files in order (no modules, no bundler). Globals are shared across files. Open `index.html` in any static
server to run it.

**Load order matters** (see index.html): data → i18n*.js → art/human/furn → core logic (farmcore, cafecore,
hospcore, park, village, salon, town, ranch, game.js) → core/net/sfx/minigames → world.js (renderer) →
app.js / app2.js (UI panels) → townui.js / onlineui.js.

**Architecture**
- `S` = the whole game state (saved to localStorage). All changes go through `G.apply(S, action, by)` in
  game.js, which dispatches `action.t`; modules hook in (e.g. `FARM.apply`, `RANCH.apply`). The UI calls
  `actR({t:'...'})`, which applies the action and shows result toasts (`{ok}` / `{err:'i18nKey'}`).
- `G.tick(S, dt)` advances the simulation (clock, customers, staff, farm, ranch …).
- **world.js**: canvas isometric renderer. `ISO.wx/wy` converts grid → screen. Each frame builds a depth-sorted
  draw list; modules return entries `{depth, fn}` from `X.collect(c, T, hits)`. Tap targets are pushed into
  `hits` (`{kind, x0,x1,y0,y1}`) and handled in `onWorldTap(h)` in app.js.
  NOTE: `hits` is reassigned every frame — pass a wrapper `{push: h => hits.push(h)}`, not the array itself.
- **UI panels**: `PANELS.name = () => frameHTML(title, html)`; open with `openPanel({type:'name'})`. Buttons use
  `data-a="action" data-v="value"`; handlers are in `XACT` (app2.js) or the `handle` switch in app.js.
- **i18n**: `t('key', {vars})`. Keys live in i18n*.js; newest keys go in i18n15.js (ko + ru blocks).
- **Town**: town.js (`TOWN_DEF`, `TOWN_BIG`, `LAY(k)` for big-lot positions). Big lots (farm, café, hospital,
  park, ranch …) are placed by the player.
- **Farm storage** `S.farm.produce` is shared by the farm box, café fridge and ranch box.
- **Ranch** (ranch.js, newest feature): cows/pigs, open-top hay trough & pig trough in the middle of each pen,
  animals walk to the trough to eat, milk/meat drop on the ground (tap to collect), breeding (fed adult pair,
  50%/day, guaranteed after 2 misses), ranch hands automate everything. Panels at the end of app2.js
  (`PANELS.ranch`, `rhay`, `rpig`, `ranchbox`).

**Other systems:** pet shop (pets, cages, shelves, customers, staff roles), café (cafecore.js, dishes),
hospital (hospcore.js), groomer (salon.js), village/park, notice-board quests, Instagram-style feed
(instapic.js), minigames (minigame.js / minigame2.js), multiplayer over LAN (net.js / onlineui.js, only works
inside the Android app).

**Full change history:** docs/HISTORY.md (newest at the bottom). Detailed Korean handoff: docs/README_HANDOFF.md.
