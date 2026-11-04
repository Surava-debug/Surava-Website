#!/usr/bin/env python3
"""
Builds the German site under /de/ from the English pages.

The English pages stay the only place layout is edited. This script copies
each page to /de/, swaps the text using _i18n/de.json and fixes the links,
so a layout change only ever has to be made once.

  python3 scripts/build-de.py                 build everything, report gaps
  python3 scripts/build-de.py --extract FILE  write untranslated text to FILE
  python3 scripts/build-de.py --merge FILE    add translations from FILE
  python3 scripts/build-de.py --prune         drop translations no longer used
  python3 scripts/build-de.py --check         list text that still needs German

_i18n/de.json       page text, one entry per block of text
_i18n/de-code.json  text inside JavaScript, as [find, replace] pairs

Nothing in /de/ should be edited by hand: it is overwritten on every build.
Needs only Python 3, no packages.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "_i18n"
OUT = ROOT / "de"
SITE = "https://suravacapital.ch"
STORE = I18N / "de.json"
CODE = I18N / "de-code.json"

# Pages with no German version yet. The toggle sends these to the German Insights page.
ENGLISH_ONLY = {
    "parked/pricing.html",
    "parked/services.html",
    "insights/insight-01-iran-oil-markets.html",
    "insights/insight-02-hormuz-vs-opec.html",
    "insights/insight-03-gold-real-yields.html",
    "insights/insight-04-strait-fed-dilemma.html",
}
NOT_INDEXED = {"404.html"}
SECTIONS = ["about", "contact", "education", "insights", "legal", "markets", "parked", "trades"]
JS_FILES = ["script.js", "articles.js", "catalysts.js", "focus-archive.js", "trades.js", "economy-glance.js"]

# Data fields in the js/ files that hold reader-facing text
JS_FIELDS = "title|category|readTime|excerpt|why|homeTitle|homeText|outcome|type|event|text|date|label|tag|exitWhy|lesson"

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
INLINE = {"a", "abbr", "b", "br", "cite", "code", "em", "i", "img", "kbd", "mark", "q", "s", "small", "span",
          "strong", "sub", "sup", "time", "u", "wbr"}
SKIP = {"textarea", "noscript"}

TOKEN = re.compile(
    r"<!--.*?-->|<!doctype[^>]*>|<script\b.*?</script\s*>|<style\b.*?</style\s*>|<svg\b.*?</svg\s*>"
    r"""|</?[a-zA-Z][^\s/>]*(?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*/?>""",
    re.S | re.I,
)
BLOCK_RE = re.compile(r"<!-- i18n:(head|toggle|remember) -->.*?<!-- /i18n:\1 -->\s*", re.S)
REMEMBER = ("<!-- i18n:remember --><script>try{if(localStorage.getItem('surava-lang')==='de')"
            "location.replace('/de/'+location.search+location.hash)}catch(e){}</script><!-- /i18n:remember -->\n  ")
LETTER = re.compile(r"[A-Za-zÀ-ÿ]")


class Text:
    def __init__(self, raw): self.raw = raw

class Raw:
    def __init__(self, raw, kind): self.raw, self.kind = raw, kind

class El:
    def __init__(self, tag, open_, children=None):
        self.tag, self.open, self.children, self.close = tag, open_, children if children is not None else [], ""


def ser(n):
    if isinstance(n, El):
        return n.open + "".join(ser(c) for c in n.children) + n.close
    return n.raw


def parse(src):
    root = El("#root", "")
    stack, pos = [root], 0
    for m in TOKEN.finditer(src):
        if m.start() > pos:
            stack[-1].children.append(Text(src[pos:m.start()]))
        pos = m.end()
        t = m.group(0)
        low = t[:8].lower()
        if t.startswith("<!--") or low.startswith("<!doctyp"):
            stack[-1].children.append(Raw(t, "comment"))
        elif low.startswith("<script"):
            stack[-1].children.append(Raw(t, "script"))
        elif low.startswith("<style"):
            stack[-1].children.append(Raw(t, "style"))
        elif low.startswith("<svg"):
            stack[-1].children.append(Raw(t, "svg"))
        elif t.startswith("</"):
            tag = t[2:].strip(" >\r\n\t").lower()
            for i in range(len(stack) - 1, 0, -1):
                if stack[i].tag == tag:
                    stack[i].close = t
                    del stack[i:]
                    break
            else:
                stack[-1].children.append(Raw(t, "stray"))
        else:
            tag = re.match(r"<([a-zA-Z][^\s/>]*)", t).group(1).lower()
            el = El(tag, t)
            stack[-1].children.append(el)
            if tag not in VOID and not t.endswith("/>"):
                stack.append(el)
    if pos < len(src):
        stack[-1].children.append(Text(src[pos:]))
    return root


def inline(n):
    if isinstance(n, Text):
        return True
    if isinstance(n, Raw):
        return n.kind == "svg"
    return n.tag in INLINE and all(inline(c) for c in n.children)


def walk(el, fn):
    """Replaces each block of text with fn(block). Inline markup stays inside the block."""
    if el.tag in SKIP:
        return
    out, run = [], []

    def flush():
        nonlocal run
        lead, tail = [], []
        while run and isinstance(run[0], Text) and not run[0].raw.strip():
            lead.append(run.pop(0))
        while run and isinstance(run[-1], Text) and not run[-1].raw.strip():
            tail.insert(0, run.pop())
        out.extend(lead)
        if run:
            text = "".join(n.raw for n in flat(run))
            if not LETTER.search(re.sub(r"&[a-zA-Z#0-9]+;", "", text)):
                out.extend(run)
            elif len(run) == 1 and isinstance(run[0], El):
                walk(run[0], fn)
                out.append(run[0])
            else:
                key = re.sub(r"\s+", " ", "".join(ser(n) for n in run)).strip()
                out.append(Raw(fn(key), "unit"))
        out.extend(tail)
        run = []

    for c in el.children:
        if inline(c):
            run.append(c)
        else:
            flush()
            out.append(c)
            if isinstance(c, El):
                walk(c, fn)
    flush()
    el.children = out


def flat(nodes):
    """Text nodes only, so words in tags and SVG icons do not count as text."""
    for n in nodes:
        if isinstance(n, Text):
            yield n
        elif isinstance(n, El):
            yield from flat(n.children)


ATTR = re.compile(r'(\s(?:alt|title|placeholder|aria-label)=")([^"]*)(")')
META = re.compile(r'(<meta\b[^>]*\b(?:name="(?:description|twitter:title|twitter:description)"|property="og:(?:title|description|image:alt)")[^>]*\bcontent=")([^"]*)(")', re.I)


def attrs(html, fn):
    """Translates alt, title, placeholder, aria-label and meta descriptions."""
    def tag(m):
        t = m.group(0)
        if t.startswith("<!--") or t[:7].lower() in ("<script", "<style>", "<style "):
            return t
        sub = lambda a: a.group(1) + (fn(a.group(2)) if LETTER.search(a.group(2)) else a.group(2)) + a.group(3)
        return META.sub(sub, ATTR.sub(sub, t))
    return TOKEN.sub(tag, html)


def h(key):
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:8]


def read(p):
    with open(p, encoding="utf-8", newline="") as f:
        return f.read()


def write(p, s):
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists() and read(p) == s:
        return False
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    return True


def rel(p):
    return p.relative_to(ROOT).as_posix()


def url_of(path):
    return "/" + re.sub(r"(^|/)index\.html$", r"\1", path)


def pages():
    """The site's pages: HTML in the top folder and in the SECTIONS folders, nothing else."""
    found = list(ROOT.glob("*.html"))
    for section in SECTIONS:
        found += (ROOT / section).rglob("*.html")
    return sorted(rel(p) for p in found)


class Site:
    def __init__(self):
        self.store = json.loads(read(STORE)) if STORE.exists() else {}
        self.code = json.loads(read(CODE)) if CODE.exists() else []
        self.all = pages()
        self.de = [p for p in self.all if p not in ENGLISH_ONLY]
        self.de_urls = {url_of(p) for p in self.de if p not in NOT_INDEXED}
        self.seen, self.missing, self.used_code, self.js_ver = {}, {}, set(), {}

    def tr(self, key, page):
        k = h(key)
        self.seen[k] = key
        e = self.store.get(k)
        if e is None:
            self.missing.setdefault(k, (page, key))
            return key
        return key if e["de"] == "=" else e["de"]

    def link(self, path):
        """German address for an internal link, or the same address if there is no German page."""
        base = re.split(r"[#?]", path, maxsplit=1)[0]
        return "/de" + path if base in self.de_urls else path

    def apply_code(self, s):
        for find, rep in self.code:
            if find in s:
                self.used_code.add(find)
                s = s.replace(find, rep)
        return s

    def js_links(self, s):
        return re.sub(r"""(["'])(/[a-z][^"'\s]*)\1""", lambda m: m.group(1) + self.link(m.group(2)) + m.group(1), s)

    def js_data(self, s, page):
        """Translates the reader-facing text in the data arrays at the top of a js/ file."""
        start = re.search(r"^const \w+ = ", s, re.M)
        if not start:
            return s
        end = re.search(r"^/\* -{5}|^\(function", s[start.start():], re.M)
        stop = start.start() + end.start() if end else len(s)
        data = s[start.start():stop]

        def lit(v):
            if re.fullmatch(r"\d{4}-\d{2}(-\d{2})?|res|sup", v) or v.startswith(("/", "http")) or not LETTER.search(v):
                return None
            return self.tr(v, page).replace('"', '\\"')

        data = re.sub(r'\b(' + JS_FIELDS + r'):\s*"((?:[^"\\]|\\.)*)"',
                      lambda m: f'{m.group(1)}: "{lit(m.group(2)) or m.group(2)}"', data)
        data = re.sub(r"points:\s*\[(.*?)\]",
                      lambda m: "points: [" + re.sub(r'"((?:[^"\\]|\\.)*)"', lambda q: f'"{lit(q.group(1)) or q.group(1)}"', m.group(1)) + "]",
                      data, flags=re.S)
        return s[:start.start()] + data + s[stop:]

    def js_file(self, name):
        s = read(ROOT / "js" / name)
        s = self.js_data(s, "js/" + name)
        return self.charts(self.js_links(self.apply_code(s)))

    def charts(self, s):
        """Uses the German version of a chart image when one exists in assets/charts/de/."""
        def swap(m):
            return m.group(1) + "de/" + m.group(2) if (ROOT / "assets/charts/de" / m.group(2)).exists() else m.group(0)
        return re.sub(r'(/assets/charts/)([\w.-]+\.(?:png|jpg|jpeg|webp))', swap, s)

    def head_block(self, path):
        url = url_of(path)
        if path in ENGLISH_ONLY or path in NOT_INDEXED:
            return ""
        return ('<!-- i18n:head -->'
                f'<link rel="alternate" hreflang="en" href="{SITE}{url}" />'
                f'<link rel="alternate" hreflang="de" href="{SITE}/de{url}" />'
                f'<link rel="alternate" hreflang="x-default" href="{SITE}{url}" />'
                '<!-- /i18n:head -->\n')

    def toggle(self, path, lang):
        en = "/" if path in NOT_INDEXED else url_of(path)
        de = "/de/insights/" if path in ENGLISH_ONLY else "/de" + en
        save = "try{localStorage.setItem('surava-lang','%s')}catch(e){}"
        on = ' class="is-active" aria-current="true"'
        return ('<!-- i18n:toggle --><div class="lang-switch" data-lang="%s" role="group" aria-label="%s">'
                f'<a href="{en}" hreflang="en" lang="en"{on if lang == "en" else ""} onclick="{save % "en"}">EN</a>'
                f'<a href="{de}" hreflang="de" lang="de"{on if lang == "de" else ""} onclick="{save % "de"}">DE</a>'
                '</div><!-- /i18n:toggle -->') % (lang, "Sprache" if lang == "de" else "Language")

    def inject(self, s, path, lang):
        s = BLOCK_RE.sub("", s)
        head = self.head_block(path)
        if head:
            s = s.replace("</head>", head + "</head>", 1)
        if path == "index.html" and lang == "en":
            s = re.sub(r"(<head>\s*)", lambda m: m.group(1) + REMEMBER, s, count=1)
        return re.sub(r'(<div class="nav-actions">\s*)', lambda m: m.group(1) + self.toggle(path, lang) + "\n        ", s, count=1)

    def german(self, path):
        src = BLOCK_RE.sub("", read(ROOT / path))
        root = parse(src)
        walk(root, lambda k: self.tr(k, path))
        s = ser(root)
        s = attrs(s, lambda k: self.tr(k, path))

        def script(m):
            t = m.group(0)
            if not t[:7].lower() == "<script":
                return t
            t = re.sub(r'(src=")/js/(' + "|".join(map(re.escape, JS_FILES)) + r')(?:\?v=[^"]*)?"',
                       lambda j: f'{j.group(1)}/de/js/{j.group(2)}?v={self.js_ver[j.group(2)]}"', t)
            return self.js_links(self.apply_code(t))

        s = TOKEN.sub(script, s)
        s = re.sub(r'(<a\b[^>]*?\shref=")(/[^"]*)(")', lambda m: m.group(1) + self.link(m.group(2)) + m.group(3), s)
        s = self.charts(s)
        s = re.sub(r'<html lang="en"', '<!-- Generated by scripts/build-de.py. Do not edit: change the English page or _i18n/de.json. -->\n<html lang="de"', s, count=1)
        if path in NOT_INDEXED:
            s = s.replace("</title>", '</title>\n  <meta name="robots" content="noindex" />', 1)
        return self.inject(s, path, "de")

    def sitemap(self):
        p = ROOT / "sitemap.xml"
        s = re.sub(r"\s*<!-- de:start -->.*?<!-- de:end -->", "", read(p), flags=re.S)
        locs = re.findall(r"<loc>" + re.escape(SITE) + r"(/[^<]*)</loc>", s)
        rows = []
        for u in locs:
            if u in self.de_urls:
                rows.append(f"  <url>\n    <loc>{SITE}/de{u}</loc>\n  </url>")
        nl = "\r\n" if "\r\n" in s else "\n"
        block = "<!-- de:start -->\n" + "\n".join(rows) + "\n  <!-- de:end -->"
        s = s.replace("</urlset>", "  " + block.replace("\n", nl) + nl + "</urlset>")
        write(p, s)


def main():
    a = sys.argv[1:]
    site = Site()
    out = {}
    for name in JS_FILES:
        out["de/js/" + name] = site.js_file(name)
        site.js_ver[name] = h(out["de/js/" + name])
    for p in site.de:
        out["de/" + p] = site.german(p)

    if a[:1] == ["--extract"]:
        order = {p: i for i, p in enumerate(site.all)}
        rows = sorted(site.missing.items(), key=lambda kv: order.get(kv[1][0], 999))
        with open(a[1], "w", encoding="utf-8") as f:
            for k, (page, key) in rows:
                f.write(f"{k}\t{page}\t{key}\n")
        print(f"{len(rows)} untranslated blocks, {sum(len(v[1].split()) for _, v in rows)} words -> {a[1]}")
        return

    if a[:1] == ["--merge"]:
        added = 0
        for line in read(Path(a[1])).split("\n"):
            line = line.rstrip("\r")
            if not line.strip() or line.startswith("#"):
                continue
            k, de = line.split(None, 1)
            if k not in site.seen:
                sys.exit(f"Unknown id {k}: {de[:60]}")
            site.store[k] = {"en": site.seen[k], "de": de}
            added += 1
        write(STORE, json.dumps(site.store, ensure_ascii=False, indent=0, sort_keys=True) + "\n")
        print(f"Merged {added}, store has {len(site.store)}")
        return

    if a[:1] == ["--prune"]:
        for k in [k for k in site.store if k not in site.seen]:
            del site.store[k]
        write(STORE, json.dumps(site.store, ensure_ascii=False, indent=0, sort_keys=True) + "\n")
        print(f"Store has {len(site.store)}")
        return

    if a[:1] == ["--check"]:
        unused = [f for f, _ in site.code if f not in site.used_code]
        for page, key in site.missing.values():
            print(f"Needs German: {page}: {key[:100]}")
        for f in unused:
            print(f"JavaScript text changed: {f[:100]}")
        if site.missing or unused:
            sys.exit(f"{len(site.missing) + len(unused)} items still need German.")
        print("All text has German.")
        return

    changed = 0
    if OUT.exists():
        keep = set(out)
        for f in OUT.rglob("*"):
            if f.is_file() and rel(f) not in keep:
                f.unlink()
    for p, s in out.items():
        changed += write(ROOT / p, s)
    for p in site.all:
        s = site.inject(read(ROOT / p), p, "en")
        changed += write(ROOT / p, s)
    site.sitemap()

    unused = [f for f, _ in site.code if f not in site.used_code]
    print(f"{len(site.de)} German pages, {changed} files changed")
    if unused:
        print(f"{len(unused)} code strings no longer found:")
        for f in unused:
            print("  ", f[:90])
    if site.missing:
        print(f"{len(site.missing)} blocks still in English:")
        for k, (page, key) in list(site.missing.items())[:30]:
            print(f"  {page}: {key[:90]}")


if __name__ == "__main__":
    main()
