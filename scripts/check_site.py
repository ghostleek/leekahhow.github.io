#!/usr/bin/env python3
"""Dependency-free checks for this static site. Run: python3 scripts/check_site.py

Fails (exit 1) on:
  - a local href/src in an HTML file that points to a missing file. Paths are
    case-sensitive on GitHub Pages even when they work on macOS
    (e.g. images/pic04.jpg vs images/pic04.JPG).
  - an in-page link (#name) with no element id="name" in the same page.
  - an <img> with no alt attribute (alt="" is fine for decorative images).
  - a url(...) in assets/css/*.css that points to a missing file.
  - a CNAME file that is missing, empty, or holds anything but bare hostnames.
HTML comments are ignored, so commented-out markup is not checked.
"""
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "scripts"}
errors = []


def is_external(url):
    s = urlsplit(url)
    return bool(s.scheme) or url.startswith("//")


def exists_exact(target):
    """os.path.exists, but case-sensitive even on macOS/Windows filesystems,
    to match GitHub Pages: every path component must match a real entry."""
    rel = os.path.relpath(target, ROOT)
    if rel.startswith(".."):
        return os.path.exists(target)
    cur = ROOT
    for part in rel.split(os.sep):
        if part == ".":
            continue
        try:
            if part not in os.listdir(cur):
                return False
        except (NotADirectoryError, FileNotFoundError):
            return False
        cur = os.path.join(cur, part)
    return True


def check_local(src_file, url, what):
    """Report url if it is local and the target file does not exist."""
    url = url.strip()
    if not url or is_external(url) or url.startswith("#"):
        return
    path = unquote(urlsplit(url).path)
    if not path:
        return
    base = ROOT if path.startswith("/") else os.path.dirname(src_file)
    target = os.path.normpath(os.path.join(base, path.lstrip("/")))
    if path.endswith("/"):
        target = os.path.join(target, "index.html")
    if not exists_exact(target):
        rel = os.path.relpath(src_file, ROOT)
        errors.append(
            f"{rel}: {what} '{url}' points to a missing file. Fix the path "
            "(paths are case-sensitive on GitHub Pages) or add the file."
        )


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.refs = []  # (attr, value, line)
        self.imgs_without_alt = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "a" and a.get("name"):
            self.ids.add(a["name"])
        for attr in ("href", "src"):
            if a.get(attr) is not None:
                self.refs.append((f"{tag} {attr}", a[attr], self.getpos()[0]))
        if tag == "img" and "alt" not in a:
            self.imgs_without_alt.append((a.get("src", "?"), self.getpos()[0]))

    handle_startendtag = handle_starttag


def check_html(path):
    p = Page()
    with open(path, encoding="utf-8") as f:
        p.feed(f.read())
    rel = os.path.relpath(path, ROOT)
    for what, url, line in p.refs:
        if url.startswith("#") and len(url) > 1 and unquote(url[1:]) not in p.ids:
            errors.append(
                f"{rel}:{line}: {what} '{url}' has no matching id=\"{url[1:]}\" "
                "on the page. Rename the link or the target id."
            )
        else:
            check_local(path, url, f"line {line} {what}")
    for src, line in p.imgs_without_alt:
        errors.append(
            f"{rel}:{line}: <img src=\"{src}\"> has no alt attribute. "
            "Describe the image, or use alt=\"\" if it is decorative."
        )


def check_css(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        css = f.read()
    for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", css):
        url = m.group(1)
        if not url.startswith("data:"):
            check_local(path, url, "url()")


def check_cname():
    path = os.path.join(ROOT, "CNAME")
    if not os.path.isfile(path):
        errors.append("CNAME is missing. Restore it: GitHub Pages uses it for the custom domain.")
        return
    lines = [l.strip() for l in open(path, encoding="utf-8").read().splitlines() if l.strip()]
    if len(lines) != 1 or not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", lines[0]):
        errors.append("CNAME must hold one bare hostname only (no scheme or path). Restore it from origin/master.")


def main():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            full = os.path.join(dirpath, name)
            if name.endswith(".html"):
                check_html(full)
            elif name.endswith(".css"):
                check_css(full)
    check_cname()
    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} problem(s) found.")
        return 1
    print("check_site: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
