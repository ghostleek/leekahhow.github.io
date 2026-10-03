# AGENTS.md

Map for coding agents. Static personal site served by GitHub Pages from
`master` at leekahhow.com. No build step, no dependencies.

## Verify every change

```bash
python3 scripts/check_site.py   # local links, #anchors, img alt, CSS url(), CNAME
python3 -m http.server 8000     # preview at http://localhost:8000
```

CI runs the check on every PR (`.github/workflows/ci.yml`).

## Where things live

| Path | What |
|---|---|
| `index.html` | The whole site (HTML5 UP "Dimension" template); each `<article id="…">` is a panel opened by `#…` links |
| `assets/css/main.css` | Compiled styles; `assets/sass/` is its source but nothing compiles it here, so edit `main.css` |
| `assets/css/fontawesome-all.min.css`, `assets/webfonts/` | Font Awesome 5 (vendored) |
| `assets/js/` | Template JS (jQuery, vendored) |
| `images/` | Photos; `bg.jpg` and `overlay.png` are used by `main.css` |
| `CNAME` | Custom domain for GitHub Pages |
| `scripts/check_site.py` | The stdlib-only check above |

## Rules

- Never edit, move or delete `CNAME`; it takes the site off its domain.
- Paths are case-sensitive on GitHub Pages (`pic04.JPG` is not `pic04.jpg`),
  even though they work on macOS. The check catches this.
- Every `<img>` has an `alt`; use `alt=""` only for decorative images.
- Compress images before committing; aim for under ~500 KB per photo.
- Font Awesome 5 icons need a style prefix: `fas`/`far`, or the template's
  `icon brands fa-…` / `icon solid fa-…`. A bare `fa-…` renders nothing.
- Don't commit `.DS_Store`, personal documents or other files not used by the site:
  everything in the repo is public on the web.
- Don't add a build tool, framework or package manager.
