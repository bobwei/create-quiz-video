# create-quiz-video

Claude / Cursor / Codex 的 **agent skill**，用 [HyperFrames](https://hyperframes.heygen.com) 一鍵製作 1080×1920 直式 quiz 卡片影片（IG Reels / TikTok / Shorts 格式），**4 個選項用 Google Gemini 3 Pro Image 即時生成客製 sticker**。

跟你的 AI agent 說「**做一支 quiz 主題是 X**」，它就會：

1. 想出引導句、主標題、粉色 pill 子題、4 個選項的中文標籤、底部 CTA
2. 想出 4 個對應的 sticker 英文 subject 描述
3. 複製內附 template 到當前目錄、`npm install`
4. 呼叫 Gemini 3 Pro Image 生成 4 個 sticker（手繪扁平風，自動剝白底、trim、置中）
5. 填入文字內容、跑驗證
6. 預設**手機預覽**：render MP4 → cloudflared tunnel → 給你純文字 URL + ASCII QR

## 必要條件

- **`GEMINI_API_KEY`**：到 https://aistudio.google.com/apikey 拿一個，`export GEMINI_API_KEY=...`（建議寫進 `.zshenv`）
- **Node.js 20+ 與 npm**：跑 `sharp`（圖片後處理）
- **cloudflared**（手機預覽用）：`brew install cloudflared`
- **python3 qrcode**（QR Code 印出）：`pip install qrcode`

## 安裝

```bash
# Global（所有專案都能用）
npx skills add bobwei/create-quiz-video -g

# 或 Project-only
npx skills add bobwei/create-quiz-video
```

裝完重啟 agent session。

## 使用

在 agent 對話裡說：

```
用 create-quiz-video 做一支 quiz 主題是早餐人格
```

或更開放：

```
做一支 IG quiz reels
```

Agent 會接手剩下的工作。

## 預設成果

10 秒、1080×1920 直式：

- **背景**：咖啡店實拍影片 + 暗色 vignette
- **配色**：白字 + 粉色 pill
- **字型**：jf-openhuninn（圓潤手寫繁中）
- **結構**（由上往下）：
  - 引導句（如「身邊那個 TA」）
  - 主標題（**單行不換行**）
  - 白色分隔線
  - 粉色 pill 子題
  - 2×2 sticker 選項（A/B/C/D 字母 + 客製 sticker 280×280 + 小文字標籤）
  - 底部 CTA 引言（鼓勵留言）
- **動畫**：所有元素 stagger 入場

## 不用 agent，手動產

```bash
# 1. clone
git clone https://github.com/bobwei/create-quiz-video.git
cd create-quiz-video/template
npm install

# 2. 生 4 個客製 sticker（需要 GEMINI_API_KEY）
export GEMINI_API_KEY=AIzaSy...
node scripts/gen-stickers.mjs '[
  {"slug":"a","subject":"a single golden croissant on a small white plate, top-down view, single object centered"},
  {"slug":"b","subject":"a sunny-side-up egg in a small black pan, top-down, single object centered"},
  {"slug":"c","subject":"a small bowl of oatmeal with berries on top, top-down, single object centered"},
  {"slug":"d","subject":"a single sesame bagel split in half, top-down, single object centered"}
]'

# 3. 改 index.html 的 data-composition-variables 預設值（文字內容）
# 4. preview
npm run dev    # 開 http://localhost:3002（桌面用）
# 或
npm run render   # render MP4
```

## 換背景 / 字型

- 背景影片在 `template/assets/bg-coffee.mp4`，換掉就好（至少 10 秒）
- 字型在 `template/fonts/jf-openhuninn.woff2`，換成你的 .woff2 後改 index.html 的 `@font-face`
- 粉色 pill 顏色寫死在 CSS（`.pill` 的 `background`），直接改

## 想做更複雜的版型？

這個 template 是固定 10 秒、單場景、4 選項 quiz。如果要多場景、轉場、TTS、字幕、音樂等，請改用 HyperFrames 原生 skill `/hyperframes`，那邊有完整的 composition authoring 工具。

## 授權與素材

- Skill 本身：MIT
- 內附預設 sticker（`template/assets/sticker-{a-d}.png`）：Gemini 3 Pro Image 生成，可自由替換
- 內附背景影片 `bg-coffee.mp4`：請自行確認用途與來源授權；正式商用建議換成你自有素材
- 字型 `jf-openhuninn`：粉圓體，[justfont 開源中文字型](https://justfont.com/huninn/)，CC BY 4.0
- Gemini API 是付費服務，每張圖目前約 $0.04，4 張一支影片約 $0.16
