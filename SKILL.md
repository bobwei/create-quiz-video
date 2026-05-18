---
name: create-quiz-video
description: 用 HyperFrames 製作 1080×1920 直式 quiz 卡片影片（IG Reels / TikTok / Shorts 格式）。版型固定：頂部引導句 → 主標題 → 分隔線 → 粉色 pill 子題 → 2×2 emoji 選項 → 底部 CTA。10 秒，元素逐項 stagger 入場。觸發時機：使用者說「做一支 quiz 影片」「做一支 quiz 主題是 X」「用 create-quiz-video 做 X」「我想做測驗影片」「IG quiz / reels quiz / shorts quiz」之類。
---

# create-quiz-video

用 HyperFrames 製作直式 quiz 卡片影片的固定流程。版型已經設計好，agent 的工作是：問清楚使用者要做什麼主題，幫他想內容（標題 / pill / 4 個選項 emoji + 文字），複製 template，填入內容，跑 preview 或 render。

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
  5. 2×2 選項網格（每格：A/B/C/D 字母 + 大 emoji 220px + 可選小文字標籤 42px）
  6. 底部 CTA 引言（quote，48px）
- **動畫**：所有元素 stagger 入場，總入場約 4.5 秒，其餘時間定格

## 內容欄位（variables）

| 欄位                    | 型別   | 用途              | 範例                                       |
| ----------------------- | ------ | ----------------- | ------------------------------------------ |
| `leadIn`                | string | 引導句            | `下午三點`、`週五晚上`、`身為一個老饕`     |
| `title`                 | string | 主標題（不換行）  | `你最想配什麼？`、`你會選哪一道？`         |
| `pill`                  | string | 粉色 pill 子題    | `來測你的小確幸偏好`、`選一個最戳心的`     |
| `quote`                 | string | 底部 CTA          | `「留言你的選擇，看看你是哪型咖啡控」`     |
| `optA` / `B` / `C` / `D` | string | 4 個選項 emoji   | `🍰` `☕` `🍪` `🥪`                         |
| `labelA` / `B` / `C` / `D` | string | 4 個選項文字（可留空） | `蛋糕`、`咖啡`、`餅乾`、`三明治` |

## Agent 工作流程

當使用者觸發這個 skill：

### Step 1 — 確認主題

如果使用者已經給了主題（例如「做一支 quiz 主題是早餐人格」），直接進 Step 2。

如果沒給或太模糊（「做一支 quiz」），用 `AskUserQuestion` 問一個問題：「主題是什麼？」加 3 個範例選項：
- 早餐人格測驗
- 旅遊風格測驗
- 工作壓力型別測驗

### Step 2 — 生成內容

根據主題，自己想出：
- `leadIn`：1 句鋪陳（4-8 字），通常是時間 / 情境 / 引子
- `title`：1 個提問（8-12 字，**必須單行不換行**，太長會被截掉）
- `pill`：呼籲動作（8-14 字），帶口語感
- 4 個選項 emoji：**每個都要明顯不同、易辨識**，避免兩個太像（兩個 🍰 跟 🎂 視覺上幾乎一樣，要避免）
- 4 個選項文字（labelA-D）：1-3 個中文字補充說明
- `quote`：底部 CTA，引號包起來，鼓勵留言/分享

**內容語氣參考**：輕鬆、口語、有畫面感。不要太正式或行銷腔。

### Step 3 — 建立 project

從這個 skill 的 base directory 複製 template：

```bash
# Skill base dir 由 runtime 提供，通常是 ~/.agents/skills/create-quiz-video/
SKILL_DIR="$(dirname "$(realpath ~/.agents/skills/create-quiz-video/SKILL.md 2>/dev/null || echo ~/.claude/skills/create-quiz-video/SKILL.md)")"

# 在使用者的 cwd 下開新資料夾（用主題的 slug）
TARGET="quiz-<topic-slug>"
cp -r "$SKILL_DIR/template" "$TARGET"
```

**注意**：實際呼叫時請用 Read 看 SKILL.md 的真實路徑，因為 skills 可能裝在 `~/.claude/skills/` 或 `~/.agents/skills/`、global 或 project 範圍，路徑會不同。最穩的做法是用環境變數或讀取當前 SKILL.md 的位置反推。

### Step 4 — 填入內容

把上面生出的內容寫進 `<target>/index.html` 的 `data-composition-variables` 預設值。改 `default` 欄位即可，不要動結構。

也要同步更新 script 區塊的 fallback object（給沒有 hyperframes runtime 時用）。

### Step 5 — 驗證

```bash
cd <target>
npm run check    # lint + validate + inspect
```

### Step 6 — 預覽（**預設：手機預覽**）

**這個 skill 預設給手機看**，因為這個版型本來就是 1080×1920 直式 IG/TikTok/Reels 格式，手機是真正的目標媒體。HyperFrames studio 桌面 UI 在手機上會把 composition 擠成縮圖看不清楚，所以走「render MP4 → cloudflared tunnel → 給 URL + QR」這條。

**例外**：如果使用者明說要「桌面 / 電腦預覽」、「用 studio」、「live preview」、「邊改邊看」、「HMR」之類，跳到 Step 7。

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

### Step 7 — 桌面 studio 預覽（使用者明說才用）

當使用者要 live preview / HMR / 邊改邊看：

```bash
cd <target>
npm run dev    # 背景執行，studio 在 http://localhost:3002
```

把 URL 給使用者，他在電腦瀏覽器打開就能看，改檔案會 hot reload。

**注意**：手機別開這個 URL（即使 tunnel 出去），UI 是給桌面用的。

### Step 8 — 只要 MP4 不要 tunnel（使用者明說才用）

```bash
cd <target>
npm run render
```

輸出在 `renders/<project>_<timestamp>.mp4`。給使用者檔案路徑，他自己處理（AirDrop / 上傳 / 拖進剪輯軟體）。

## 內容範例（給 agent 參考語氣）

**主題：早餐人格**

```json
{
  "leadIn": "週末早晨",
  "title": "你會挑哪一種早餐？",
  "pill": "測你的早晨儀式感等級",
  "optA": "🥐", "labelA": "可頌",
  "optB": "🍳", "labelB": "蛋餅",
  "optC": "🥣", "labelC": "燕麥",
  "optD": "🥯", "labelD": "貝果",
  "quote": "「留言你選哪個，看你是哪型晨間人」"
}
```

**主題：旅遊風格**

```json
{
  "leadIn": "如果這週要出發",
  "title": "你會挑哪一種旅程？",
  "pill": "看你骨子裡是哪型旅人",
  "optA": "🏝️", "labelA": "海島",
  "optB": "🏔️", "labelB": "山林",
  "optC": "🏙️", "labelC": "城市",
  "optD": "🏛️", "labelD": "古蹟",
  "quote": "「留言你的選擇，幫你抽一份私房景點」"
}
```

**主題：工作壓力型**

```json
{
  "leadIn": "下班那一刻",
  "title": "你最想做什麼？",
  "pill": "測你的紓壓型態",
  "optA": "😴", "labelA": "睡飽",
  "optB": "🍻", "labelB": "聚餐",
  "optC": "🎮", "labelC": "打電動",
  "optD": "📚", "labelD": "獨處",
  "quote": "「留言你的解法，可能會有人跟你一樣」"
}
```

## 常見錯誤 / 避免

1. **title 太長換行** — title 用了 `white-space: nowrap`，超過 1020px 寬度會被截斷。中文約 11-12 字內安全。
2. **兩個選項 emoji 太像** — 例如 🍰 和 🎂 視覺上幾乎一樣，會讓 viewer 困惑。生內容時要刻意拉開差異。
3. **labelA-D 太長** — 1-3 個字，多了會擠到其他選項。
4. **改背景影片** — 如果要換背景，記得新影片要至少 10 秒，存到 `assets/`，再改 index.html 的 `<video src="...">`。
5. **改配色** — pill 顏色寫死在 CSS `.pill { background: rgba(232, 122, 156, 0.85); }`，不是變數。要改顏色就直接改 CSS。

## 不要做的事

- ❌ **不要**新增場景、轉場、shader 等複雜元素 — 這個 template 就是固定 10 秒單場景設計。
- ❌ **不要**改動畫節奏 — 入場時序是調過的，動了就是新版型。
- ❌ **不要**改文字 vars 以外的 HTML 結構 — 改了驗證就會壞。

如果使用者想要更複雜的版型（多場景、加音樂、加字幕、加 TTS），離開這個 skill，改用 `/hyperframes` 直接客製。
