---
name: create-quiz-video
description: 用 HyperFrames 製作 1080×1920 直式 quiz 卡片影片（IG Reels / TikTok / Shorts 格式）。版型固定：頂部引導句 → 主標題 → 分隔線 → 粉色 pill 子題 → 2×2 客製 sticker 選項（Gemini 3 Pro Image 即時生成）→ 底部 CTA。10 秒，元素逐項 stagger 入場。觸發時機：使用者說「做一支 quiz 影片」「做一支 quiz 主題是 X」「用 create-quiz-video 做 X」「我想做測驗影片」「IG quiz / reels quiz / shorts quiz」之類。需要 GEMINI_API_KEY。
---

# create-quiz-video

用 HyperFrames 製作直式 quiz 卡片影片的固定流程。版型已經設計好，agent 的工作是：問清楚使用者要做什麼主題，幫他想內容（標題 / pill / 4 個選項說明 + sticker subject），複製 template，**呼叫 Gemini 3 Pro Image 生 4 個客製 sticker**，填入內容，跑 preview 或 render。

## 必要條件

- **`GEMINI_API_KEY`** 必須存在於環境變數中（`export GEMINI_API_KEY=...`）。沒有 key 就跑不了 sticker 生成步驟。
  - **檢查方式**：第一步靜默檢查 `printenv GEMINI_API_KEY`（或等同方式）。
  - **已設好 → 不要提**，直接往下做，**不要對使用者宣告「key 已 ready」之類**，那是雜訊。
  - **沒設 → 才中止流程**，告訴使用者：「找不到 `GEMINI_API_KEY`，請到 https://aistudio.google.com/apikey 拿一個，`export GEMINI_API_KEY=...`（建議寫進 `~/.zshenv`）後再試。」這時不要繼續往下做。
- 第一次用要 `npm install`（template 有 `sharp` 依賴做圖片後處理）。

## 觸發

使用者說：
- 「做一支 quiz 影片 主題是 X」
- 「用 create-quiz-video 做 X」
- 「我想做個 IG 測驗 reels」
- 「做支 quiz 問人喜歡哪一款 X」
- 任何想做「4 選 1 的測驗短影片」需求

## 固定版型

- **解析度**：1080×1920（直式，IG Reels / TikTok / Shorts）
- **長度**：10 秒
- **背景**：咖啡店實拍影片（template 內附）+ 黑色 radial vignette
- **配色**：白字 + 粉色 pill（`rgba(232, 122, 156, 0.85)`）
- **字型**：jf-openhuninn（手寫圓潤繁中字型，template 內附）
- **結構**（由上往下）：
  1. 引導句（leadIn，70px）
  2. 主標題（title，86px，**單行**不換行）
  3. 白色分隔線
  4. 粉色 pill（子題，58px）
  5. 2×2 選項網格（每格：A/B/C/D 字母 + 大客製 sticker 280×280 + 小文字標籤 42px）
  6. 底部 CTA 引言（quote，48px）
- **動畫**：所有元素 stagger 入場，總入場約 4.5 秒，其餘時間定格
- **Sticker 風格**：扁平、柔粉色、手繪、無外框無陰影、透明背景（白底會被自動剝除）

## 內容欄位（variables）

| 欄位                    | 型別   | 用途              | 範例                                       |
| ----------------------- | ------ | ----------------- | ------------------------------------------ |
| `leadIn`                | string | 引導句            | `下午三點`、`週五晚上`、`身為一個老饕`     |
| `title`                 | string | 主標題（不換行）  | `你最想配什麼？`、`你會選哪一道？`         |
| `pill`                  | string | 粉色 pill 子題    | `來測你的小確幸偏好`、`選一個最戳心的`     |
| `quote`                 | string | 底部 CTA          | `「留言你的選擇，看看你是哪型咖啡控」`     |
| `optA` / `B` / `C` / `D` | string | 4 個 sticker 路徑 | `assets/sticker-a.png` … `sticker-d.png` |
| `labelA` / `B` / `C` / `D` | string | 4 個選項中文標籤 | `蛋糕`、`咖啡`、`餅乾`、`三明治`       |

`optA-D` 雖然技術上也能放 emoji（render 邏輯有 sniffer），但**這個 skill 預設一定是生 sticker**，不要走 emoji 旁路。

## Agent 工作流程

當使用者觸發這個 skill：

### Step 1 — 確認主題

如果使用者已經給了主題（例如「做一支 quiz 主題是早餐人格」），直接進 Step 2。

如果沒給或太模糊（「做一支 quiz」），用 `AskUserQuestion` 問一個問題：「主題是什麼？」加 3 個範例選項：
- 早餐人格測驗
- 旅遊風格測驗
- 工作壓力型別測驗

### Step 2 — 生成內容（文字 + sticker subjects）

根據主題，自己想出：
- `leadIn`：1 句鋪陳（4-8 字），通常是時間 / 情境 / 引子
- `title`：1 個提問（8-12 字，**必須單行不換行**，太長會被截掉）
- `pill`：呼籲動作（8-14 字），帶口語感
- 4 個選項文字（labelA-D）：1-3 個中文字補充說明
- 4 個 **sticker subject 英文描述**（給 Gemini 生圖用，下方詳述）
- `quote`：底部 CTA，引號包起來，鼓勵留言/分享

**Sticker subject 寫法**（重要，會直接餵給 Gemini）：

每個 subject 要是一段英文描述，**只描述主體物**，不需講風格（風格由 script 統一加 prompt prefix）。範例：

```
a single croissant on a small white plate, top-down view, single object centered
a sunny-side-up egg in a small black pan, top-down, single object centered
a small bowl of oatmeal with a few blueberries on top, top-down, single object centered
a single sesame bagel split in half, top-down, single object centered
```

**Sticker subject 規則**：
- **單一主體**：每張只有一個物件，不要組合或場景。
- **背景描述**：保持白底（已在 script 的 STYLE prompt 寫死「Pure white background」）。
- **視角一致**：4 張都用同樣視角（top-down 或 three-quarter），避免一張俯視一張平視，視覺會打架。
- **4 張之間要明顯不同**：顏色 / 形狀 / 物件類別至少一項要差異大。例如 4 種早餐就避免「全部都是麵包類」。
- **避免人物與品牌**：Gemini 對品牌商標、明星臉、寫實人臉有審查，會 fail 或產出怪圖。

**內容語氣參考**：輕鬆、口語、有畫面感。不要太正式或行銷腔。

### Step 3 — 建立 project

從這個 skill 的 base directory 複製 template，然後 `npm install`（template 有 sharp 依賴）：

```bash
# Skill base dir 由 runtime 提供，通常是 ~/.agents/skills/create-quiz-video/
SKILL_DIR="$(dirname "$(realpath ~/.agents/skills/create-quiz-video/SKILL.md 2>/dev/null || echo ~/.claude/skills/create-quiz-video/SKILL.md)")"

# 在使用者的 cwd 下開新資料夾（用主題的 slug）
TARGET="quiz-<topic-slug>"
cp -r "$SKILL_DIR/template" "$TARGET"
cd "$TARGET" && npm install --silent
```

**注意**：實際呼叫時請用 Read 看 SKILL.md 的真實路徑，因為 skills 可能裝在 `~/.claude/skills/` 或 `~/.agents/skills/`、global 或 project 範圍，路徑會不同。最穩的做法是用環境變數或讀取當前 SKILL.md 的位置反推。

### Step 4 — 生成 sticker（**必跑**）

把 Step 2 想出的 4 個 subject 餵給 script。script 會自動：呼叫 Gemini 3 Pro Image → 白底剝透明 → trim → 補白置中 → 存到 `assets/sticker-{slug}.png`。

（`GEMINI_API_KEY` 在「必要條件」那段就已經靜默檢查過了，這裡不用再說一次。）

```bash
cd <target>
node scripts/gen-stickers.mjs '[
  {"slug":"a","subject":"<subject A>"},
  {"slug":"b","subject":"<subject B>"},
  {"slug":"c","subject":"<subject C>"},
  {"slug":"d","subject":"<subject D>"}
]'
```

**失敗處理**：
- HTTP 400 / safety reject：通常是 subject 撞到 Gemini 安全策略（含人臉、商標、暴力等），換個 subject 描述再試。
- HTTP 429 / 5xx：頻率限制 / 暫時錯誤，等 10 秒重試該張。
- `GEMINI_API_KEY missing`：直接中止整個流程，請使用者設好 key。
- 任何一張失敗：可以單獨重跑該張（script 接受任意數量的 subjects），其他三張不用重做。

完成後 `assets/sticker-{a,b,c,d}.png` 都會是新生成的（覆蓋掉 template 內附的禮物預設）。

### Step 5 — 填入文字內容

把 Step 2 想出的文字（leadIn / title / pill / quote / labelA-D）寫進 `<target>/index.html` 的 `data-composition-variables` 預設值，改 `default` 欄位。`optA-D` 保持 `assets/sticker-a.png` … `assets/sticker-d.png` 不用動（檔名就是固定的 sticker-a/b/c/d）。

也要同步更新 script 區塊的 fallback object（給沒有 hyperframes runtime 時用）。

### Step 6 — 驗證

```bash
cd <target>
npm run check    # lint + validate + inspect
```

### Step 7 — 預覽（**預設：手機預覽**）

**這個 skill 預設給手機看**，因為這個版型本來就是 1080×1920 直式 IG/TikTok/Reels 格式，手機是真正的目標媒體。HyperFrames studio 桌面 UI 在手機上會把 composition 擠成縮圖看不清楚，所以走「render MP4 → cloudflared tunnel → 給 URL + QR」這條。

**例外**：如果使用者明說要「桌面 / 電腦預覽」、「用 studio」、「live preview」、「邊改邊看」、「HMR」之類，跳到 Step 8。

**手機預覽流程**：

```bash
# 1. Render MP4（10s 影片約 25-90 秒，跟硬體有關）
cd <target>
npm run render
LATEST=$(ls -t renders/*.mp4 | head -1)

# 2. 在 renders/ 開靜態 server（背景執行）
cd renders && python3 -m http.server 8765 &

# 3. cloudflared quick tunnel（背景執行）
cloudflared tunnel --url http://localhost:8765 &
# 等它印出 https://<random>.trycloudflare.com URL（從 stderr/log 抓）

# 4. 組出 MP4 直接連結：
#    https://<random>.trycloudflare.com/<filename>.mp4

# 5. 印 QR Code（方便手機掃）
python3 -c "import qrcode; qr=qrcode.QRCode(border=1); qr.add_data('<URL>'); qr.make(); qr.print_ascii(invert=True)"
```

**給使用者的訊息要包含**：
- MP4 純文字 URL（**不要包 markdown**，會在某些終端機被截掉）
- ASCII QR Code
- 一句說明 tunnel 是臨時的，session 關掉就斷

**Fallback（沒裝 cloudflared / python qrcode 時）**：
- 沒 `cloudflared`：建議用 macOS AirDrop / iCloud Drive / Google Drive 把 MP4 傳手機，或安裝 `brew install cloudflared`
- 沒 `python3 qrcode` 套件：URL 還是給，QR 跳過或建議 `pip install qrcode`

**不要用 `hyperframes publish`**：產生的 URL 要登入 hyperframes.dev 才能看，對「快速給手機看」是反效果。

### Step 8 — 桌面 studio 預覽（使用者明說才用）

當使用者要 live preview / HMR / 邊改邊看：

```bash
cd <target>
npm run dev    # 背景執行，studio 在 http://localhost:3002
```

把 URL 給使用者，他在電腦瀏覽器打開就能看，改檔案會 hot reload。

**注意**：手機別開這個 URL（即使 tunnel 出去），UI 是給桌面用的。

### Step 9 — 只要 MP4 不要 tunnel（使用者明說才用）

```bash
cd <target>
npm run render
```

輸出在 `renders/<project>_<timestamp>.mp4`。給使用者檔案路徑，他自己處理（AirDrop / 上傳 / 拖進剪輯軟體）。

## 內容範例（給 agent 參考語氣）

**主題：早餐人格**

```json
{
  "text": {
    "leadIn": "週末早晨",
    "title": "你會挑哪一種早餐？",
    "pill": "測你的早晨儀式感等級",
    "labelA": "可頌", "labelB": "蛋餅", "labelC": "燕麥", "labelD": "貝果",
    "quote": "「留言你選哪個，看你是哪型晨間人」"
  },
  "stickers": [
    {"slug":"a","subject":"a single golden croissant on a small white plate, top-down view, single object centered"},
    {"slug":"b","subject":"a sunny-side-up egg in a small black pan, top-down, single object centered"},
    {"slug":"c","subject":"a small ceramic bowl of oatmeal with a few blueberries on top, top-down, single object centered"},
    {"slug":"d","subject":"a single sesame bagel split in half, top-down, single object centered"}
  ]
}
```

**主題：旅遊風格**

```json
{
  "text": {
    "leadIn": "如果這週要出發",
    "title": "你會挑哪一種旅程？",
    "pill": "看你骨子裡是哪型旅人",
    "labelA": "海島", "labelB": "山林", "labelC": "城市", "labelD": "古蹟",
    "quote": "「留言你的選擇，幫你抽一份私房景點」"
  },
  "stickers": [
    {"slug":"a","subject":"a single palm tree on a tiny tropical island with turquoise water around it, top-down view, single object centered"},
    {"slug":"b","subject":"a single pine tree on a small grassy hill, top-down view, single object centered"},
    {"slug":"c","subject":"a small modern skyscraper building, three-quarter view, single object centered"},
    {"slug":"d","subject":"a small ancient stone temple with classical columns, three-quarter view, single object centered"}
  ]
}
```

**主題：工作壓力型**

```json
{
  "text": {
    "leadIn": "下班那一刻",
    "title": "你最想做什麼？",
    "pill": "測你的紓壓型態",
    "labelA": "睡飽", "labelB": "聚餐", "labelC": "打電動", "labelD": "獨處",
    "quote": "「留言你的解法，可能會有人跟你一樣」"
  },
  "stickers": [
    {"slug":"a","subject":"a fluffy white pillow with a small sleep mask on top, top-down view, single object centered"},
    {"slug":"b","subject":"two clinking beer mugs with foam on top, three-quarter view, single object centered"},
    {"slug":"c","subject":"a single black video game controller, top-down view, single object centered"},
    {"slug":"d","subject":"a single open book with a small cup of tea beside it, top-down view, single object centered"}
  ]
}
```

## 常見錯誤 / 避免

1. **title 太長換行** — title 用了 `white-space: nowrap`，超過 1020px 寬度會被截斷。中文約 11-12 字內安全。
2. **跳過 sticker 生成** — 這個 skill 就是要生 sticker。不要為了快用 emoji 走旁路（emoji 雖然技術上會 render，但會跟版型風格不協調）。
3. **Sticker subject 4 張視角不一致** — 一張 top-down 一張平視，視覺會打架。挑同一視角寫 4 張。
4. **labelA-D 太長** — 1-3 個字，多了會擠到其他選項。
5. **改背景影片** — 如果要換背景，記得新影片要至少 10 秒，存到 `assets/`，再改 index.html 的 `<video src="...">`。
6. **改配色** — pill 顏色寫死在 CSS `.pill { background: rgba(232, 122, 156, 0.85); }`，不是變數。要改顏色就直接改 CSS。

## 不要做的事

- ❌ **不要**新增場景、轉場、shader 等複雜元素 — 這個 template 就是固定 10 秒單場景設計。
- ❌ **不要**改動畫節奏 — 入場時序是調過的，動了就是新版型。
- ❌ **不要**改文字 vars 以外的 HTML 結構 — 改了驗證就會壞。

如果使用者想要更複雜的版型（多場景、加音樂、加字幕、加 TTS），離開這個 skill，改用 `/hyperframes` 直接客製。
