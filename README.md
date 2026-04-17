# Entropy Test

## Description
Entropy Test is a lightweight frontend project built with plain HTML, CSS, and JavaScript.  
It provides a bilingual (Chinese/English) quiz experience and generates a visual result report on the client side.

## Features
- Multi-page quiz flow
- i18n support (Chinese and English)
- Client-side result rendering
- Radar chart and report image export/share actions

## Tech Stack
- HTML
- CSS
- JavaScript (Vanilla)
- JSON (language/content data)

## How to Run Locally
Because the app loads `data/*.json` using `fetch`, run it with a simple HTTP server instead of opening `index.html` directly via `file://`.

Example options:

```bash
# Python 3
python -m http.server 5500
```

Then open:

`http://localhost:5500`

## Project Structure
```text
.
├─ index.html
├─ style.css
├─ app.js
├─ data/
│  ├─ texts.zh.json
│  └─ texts.en.json
└─ screenshots/
```

## Screenshots
- `screenshots/desktop-home.png`
- `screenshots/desktop-result.png`
- `screenshots/mobile-result.png`

## Live Demo
GitHub Pages: `https://<your-username>.github.io/entropy-test/`
