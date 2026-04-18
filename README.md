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

For local work, a normal refresh is enough. After you change `style.css` or `app.js` and push to GitHub Pages, follow the cache-busting checklist below so repeat visitors do not keep old CSS or JS.

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

## GitHub Pages deployment and cache busting

**Live site:** `https://mic-ha-cp.github.io/entropy-test/` — the homepage URL has no query string. Only the asset URLs in `index.html` use `?v=N` (`style.css` and `app.js`), so bumping `N` forces browsers to request fresh files without changing the page link you share.

### Release checklist (hand-maintained `?v=`)

- Keep **exactly one** `<link rel="stylesheet" href="style.css?v=N">` and **one** `<script src="app.js?v=N"></script>` for this app’s CSS and JS (CDN scripts are separate).
- Use the **same integer `N`** in both `href` and `src` so CSS and JS stay in sync.
- When `style.css` or `app.js` changes in a way visitors should see (not typo-only edits you can skip), **increment `N`** in `index.html` and, when practical, **commit that bump together with the asset changes** in the same commit.
- Push to the branch GitHub Pages uses (often `main`).
