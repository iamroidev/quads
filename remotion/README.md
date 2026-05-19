# QUADS Teaser Video — Remotion

45-second programmatic teaser video in both 9:16 (vertical) and 16:9 (horizontal).

## Setup

```bash
cd remotion
npm install
```

## Preview in browser

```bash
npm start
# Opens Remotion Studio at http://localhost:3000
```

## Render

```bash
# 9:16 vertical (Reels / TikTok / Shorts)
npm run render:9x16

# 16:9 horizontal (YouTube / LinkedIn)
npm run render:16x9

# Both at once
npm run render:both
```

Output files are saved to `out/`.

## Scenes

| Time    | Scene       | Description |
|---------|-------------|-------------|
| 0–5s    | Hook        | Q logo entrance on cork-board background |
| 5–12s   | Problem     | Sketchy unverified listings — the pain point |
| 12–20s  | Trust       | Student ID verification with animated checkmark |
| 20–30s  | Discovery   | Product grid scrolling with category filters |
| 30–40s  | Chat        | Live negotiation + push notification drop |
| 40–45s  | CTA         | Logo, URL, QR code, download button |
