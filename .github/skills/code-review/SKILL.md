---
name: code-review
description: Review pull requests for leekahhow.github.io, a single-page static portfolio (HTML5 UP Dimension template) served by GitHub Pages at leekahhow.com. Use when reviewing any PR in this repo.
---

# Reviewing leekahhow.github.io PRs

There is no build: what is merged to `master` is what the public sees.
Rank findings by whether they break the live site, leak something private,
or make it slow.

Repo rules live in `AGENTS.md` (read it first). Don't repeat what CI
already enforces (`python3 scripts/check_site.py`: missing local files and
case-mismatched paths, `#anchor` links with no matching `id`, `<img>`
without `alt`, broken CSS `url()`, malformed `CNAME`).

## Bug classes this repo has actually shipped - check each one

1. **Case-sensitive asset paths.** `images/pic04.jpg` vs the real
   `pic04.JPG` worked locally on macOS and broke on Pages (750ee87). Also
   check paths in `assets/css/main.css` and files renamed in the diff.
2. **Font Awesome icons that render blank.** `icon fa-laptop-code` showed
   nothing on Chrome (23b6cc6); FA5 needs a style prefix (`fas`, `far`,
   `icon brands`, `icon solid`) and an icon that exists in the vendored
   version (5.x, not 6).
3. **Files that should never be public.** A signed financial statement PDF
   was committed and later deleted (23b6cc6, b91dd95); it is still in git
   history. Flag any document, spreadsheet, export or `.DS_Store` that the
   page doesn't link to, and say that deleting it doesn't remove it from history.
4. **Oversized images.** Diving photos were 6.5-7.6 MB before being re-exported
   (9f79a24); `images/bg.jpg` is still ~2.9 MB. Flag any new or changed
   image over ~500 KB, and full-resolution camera exports.
5. **Dangling references to removed content.** `gapminder.html` was deleted
   (3749680) but is still referenced in commented-out markup; embeds (Facebook
   video iframes, embedly) were added then removed. When a file or embed is
   removed, check nothing live still points at it. When one is added, check
   it is HTTPS and sized for mobile (fixed `width="1280"` iframes overflowed, f69a02f).
6. **Nav label vs panel drift.** Nav links (`#intro`, `#work`, `#about`,
   `#contact`) open `<article id>` panels; label edits have flip-flopped
   (62f009c, 7edb46f). Check the label still matches the panel heading.

## Also flag

- Any change to `CNAME` (custom domain), or a new `_config.yml` / theme
  setting (the Jekyll theme was removed on purpose, 1840cd3).
- Icon-only links with an empty `<span class="label">` (no accessible name).
- External links to dead or moved profiles (the Medium URL changed once, af91288).
- Edits to `assets/sass/` without the matching `assets/css/main.css` change;
  nothing compiles Sass here.

## Using context

The GitHub MCP server is available read-only. Use it to read the full
`index.html` around a change and earlier PRs that touched the same lines.

## Style of comments

One finding per comment, with the exact path or URL that breaks. Skip
whitespace, indentation and naming nits; the template's markup is
inconsistent and there is no formatter.
