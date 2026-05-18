# create-quiz-video

Claude / Cursor / Codex 的 **agent skill**，用 [HyperFrames](https://hyperframes.heygen.com) 一鍵製作 1080×1920 直式 quiz 卡片影片（IG Reels / TikTok / Shorts 格式）。

跟你的 AI agent 說「**做一支 quiz 主題是 X**」，它就會：

1. 想出引導句、主標題、粉色 pill 子題、4 個選項 emoji + 文字、底部 CTA
2. 複製內附 template 到當前目錄
3. 填入內容、跑驗證、開啟瀏覽器預覽
4. 你按 OK 就 render 成 MP4

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
  - 引導句（如「下午三點」）
  - 主標題（如「你最想配什麼？」，**單行不換行**）
  - 白色分隔線
  - 粉色 pill 子題（如「來測你的小確幸偏好」）
  - 2×2 emoji 選項（A/B/C/D 字母 + emoji + 可選小文字）
  - 底部 CTA 引言（鼓勵留言）
- **動畫**：所有元素 stagger 入場

## 不用 agent，手動產

```bash
# 1. clone template
git clone https://github.com/bobwei/create-quiz-video.git
cd create-quiz-video/template

# 2. preview 預設內容
npm run dev    # 開 http://localhost:3002

# 3. 改 index.html 裡 data-composition-variables 的 default 值
#    或用 CLI override：
npx hyperframes render --variables '{
  "leadIn": "週末早晨",
  "title": "你會挑哪一種早餐？",
  "pill": "測你的早晨儀式感等級",
  "optA": "🥐", "labelA": "可頌",
  "optB": "🍳", "labelB": "蛋餅",
  "optC": "🥣", "labelC": "燕麥",
  "optD": "🥯", "labelD": "貝果",
  "quote": "「留言你選哪個，看你是哪型晨間人」"
}' --output 早餐版.mp4
```

## 換背景 / 字型

- 背景影片在 `template/assets/bg-coffee.mp4`，換掉就好（至少 10 秒）
- 字型在 `template/fonts/jf-openhuninn.woff2`，換成你的 .woff2 後改 index.html 的 `@font-face`
- 粉色 pill 顏色寫死在 CSS（`.pill` 的 `background`），直接改

## 想做更複雜的版型？

這個 template 是固定 10 秒、單場景、4 選項 quiz。如果要多場景、轉場、TTS、字幕、音樂等，請改用 HyperFrames 原生 skill `/hyperframes`，那邊有完整的 composition authoring 工具。

## 授權與素材

- Skill 本身：MIT
- 內附背景影片 `bg-coffee.mp4`：請自行確認用途與來源授權；正式商用建議換成你自有素材
- 字型 `jf-openhuninn`：粉圓體，[justfont 開源中文字型](https://justfont.com/huninn/)，CC BY 4.0
