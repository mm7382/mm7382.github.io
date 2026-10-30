import json, os, html, sys
from content import BAZI, ZIWEI, ASTRO, YIJIAN_LINK, BANNED

BASE = "https://mm7382.github.io"
DEV = "Michael"
HERE = os.path.dirname(os.path.abspath(__file__))
APPS = [YIJIAN_LINK, BAZI, ZIWEI, ASTRO]
PAGES = [BAZI, ZIWEI, ASTRO]
PRIVACY = "不需要帳號，資料只存在你的 iPhone，不上傳伺服器。"
PRIVACY_EN = "No account. Your data stays on your iPhone and is not uploaded to a server."


def esc(s):
    return html.escape(s, quote=True)


def nav(extra=""):
    links = ['<a href="/">全部 App</a>', '<a href="/learn/">入門文章</a>', '<a href="/pec-ai-agent-training/">Agent Lab</a>'] + [f'<a href="/{a["slug"]}/">{esc(a["name"])}</a>' for a in APPS]
    return "<nav>" + "".join(links) + extra + "</nav>\n"


def head(title, desc, url, jsonld, image):
    return f"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<link rel="icon" href="{image}">
<link rel="stylesheet" href="/style.css">
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}{image}">
<script type="application/ld+json">
{json.dumps(jsonld, ensure_ascii=False, indent=1)}
</script>
<script defer src="/assets/site-analytics.js?v=20261030"></script>
</head>
<body>
<main class="wrap">
"""


FOOT = """<footer>
<p>這些 App 是學習與反思的工具。醫療、法律、投資與其他重大決定，請諮詢合格的專業人士。<br>These apps are tools for learning and reflection. For medical, legal, financial or other major decisions, consult a qualified professional.</p>
<p>開發者 Developer：Michael・<a href="/">全部 App</a></p>
</footer>
</main>
</body>
</html>
"""


def ul(items):
    return "<ul>" + "".join(f"<li>{esc(x)}</li>" for x in items) + "</ul>\n"


def curriculum(groups, tag="h3"):
    out = ""
    for title, items in groups:
        out += f"<{tag}>{esc(title)}</{tag}><ol>" + "".join(f"<li>{esc(x)}</li>" for x in items) + "</ol>\n"
    return out


def deflist(items):
    return "<dl>" + "".join(f"<dt>{esc(t)}</dt><dd>{esc(d)}</dd>" for t, d in items) + "</dl>\n"


def app_page(a):
    url = f"{BASE}/{a['slug']}/"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "MobileApplication", "@id": url + "#app", "name": a["name"], "alternateName": a["en"],
         "description": a["intro_en"], "operatingSystem": a["os"], "applicationCategory": "EducationalApplication",
         "inLanguage": ["zh-Hant", "en"], "url": url, "image": BASE + a["icon"],
         "author": {"@type": "Person", "name": DEV, "url": BASE + "/"}, "isAccessibleForFree": True},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": t}} for q, t in a["faq"] + a["faq_en"]]},
    ]}
    desc = f"{a['name']}（{a['en']}）：{a['tag']}。{a['intro'][:70]}"
    out = head(f"{a['name']} {a['en']}｜{a['tag']}", desc, url, ld, a["icon"])
    out += nav('<a href="#en">English</a>')
    out += f"""<header>
  <img src="icon.png" alt="{esc(a['name'])} App 圖示">
  <div>
    <h1>{esc(a['name'])}</h1>
    <p class="sub">{esc(a['tag'])}・iPhone・繁體中文／English</p>
    <span class="badge">{esc(a['status'])}</span>
  </div>
</header>
<p>{esc(a['intro'])}</p>
"""
    if a["shots"]:
        out += '<div class="shots">' + "".join(f'<img src="{f}" alt="{esc(alt)}" loading="lazy">' for f, alt in a["shots"]) + "</div>\n"
    out += "<h2>適合誰</h2>\n" + ul(a["audience"])
    out += "<h2>課程內容</h2>\n" + curriculum(a["curriculum"])
    out += "<h2>主要功能</h2>\n" + deflist(a["features"])
    out += "<h2>和一般命理 App 的差別</h2>\n" + ul(a["different"])
    out += "<h2>名詞小辭典</h2>\n" + deflist(a["glossary"])
    out += f'<h2>免費與會員</h2>\n<div class="card"><p><strong>免費：</strong>{esc(a["free"])}</p><p><strong>會員：</strong>{esc(a["member"])}</p></div>\n'
    out += f"<h2>隱私</h2>\n<p>{PRIVACY}</p>\n"
    if a['slug'] == 'bazi':
        out += '<section class="card"><h2>免費使用八字網頁版</h2><p>四柱排盤、白話解讀、每日練習、月報、二十堂課、人物比較，瀏覽器裡都能免費使用。</p><p><a href="/bazi-web/">開始排盤與學習 →</a>・<a href="/bazi-web/learn/">閱讀全部課程 →</a></p><p>網頁版的出生資料與筆記留在目前瀏覽器，不會傳到伺服器；清除瀏覽器資料也會清除紀錄。</p></section>'
    if a['slug'] == 'ziwei':
        out += '<section class="card"><h2>免費使用紫微網頁版</h2><p>十二宮排盤、六項導讀、人物對照與三十六堂課都免費開放。</p><p><a href="/ziwei-web/">開始排盤與學習 →</a>・<a href="/ziwei-web/learn/">閱讀全部課程 →</a></p><p>你主動儲存的人物與筆記只留在目前瀏覽器。</p></section>'
    if a['slug'] == 'astrology':
        out += '<section class="card"><h2>免費使用星座網頁版</h2><p>出生星盤、今日與未來七天導讀、朋友對照，以及原 App 三十六堂課都免費開放。</p><p><a href="/astrology-web/">開始排星盤與學習 →</a>・<a href="/astrology-web/learn/">閱讀全部課程 →</a></p><p>不知道出生時間也能看部分星盤；上升和宮位不會亂猜。你主動儲存的資料只留在目前瀏覽器。</p></section>'
    out += "<h2>常見問題</h2>\n" + deflist(a["faq"])
    out += f'<section id="en" class="lang" lang="en">\n<h2>{esc(a["en"])} — {esc(a["tag_en"])}</h2>\n<p><em>{esc(a["status_en"])}.</em> {esc(a["intro_en"])}</p>\n'
    out += "<h3>Who it is for</h3>\n" + ul(a["audience_en"])
    out += "<h3>What you learn</h3>\n" + curriculum(a["curriculum_en"], "h4")
    out += "<h3>Features</h3>\n" + deflist(a["features_en"])
    out += "<h3>How it differs from typical fortune apps</h3>\n" + ul(a["different_en"])
    out += "<h3>Glossary</h3>\n" + deflist(a["glossary_en"])
    out += f'<h3>Free and membership</h3>\n<p><strong>Free:</strong> {esc(a["free_en"])}</p><p><strong>Membership:</strong> {esc(a["member_en"])}</p>\n'
    out += f"<h3>Privacy</h3>\n<p>{PRIVACY_EN}</p>\n"
    out += "<h3>FAQ</h3>\n" + deflist(a["faq_en"]) + "</section>\n"
    links = []
    if a["privacy"]:
        links.append(f'<a href="{a["privacy"]}">隱私權政策 Privacy</a>')
    if a["terms"]:
        links.append(f'<a href="{a["terms"]}">使用條款 Terms</a>')
    if links:
        out += "<p>" + "・".join(links) + "</p>\n"
    out += FOOT
    os.makedirs(os.path.join(HERE, a["slug"]), exist_ok=True)
    with open(os.path.join(HERE, a["slug"], "index.html"), "w") as f:
        f.write(out)
    return out


def hub():
    screenshots = {"yijian": "yijian", "bazi": "bazi", "ziwei": "ziwei", "astrology": "astrology"}
    summaries = {
        "yijian": "從陰陽與爻序開始，慢慢讀懂六十四卦。",
        "bazi": "從四柱、五行到十神，學會讀自己的八字。",
        "ziwei": "從命宮出發，一步步認識十二宮與星曜。",
        "astrology": "從太陽、月亮與上升，開始理解自己的星盤。",
    }
    cards = []
    for a in APPS:
        slug = esc(a["slug"])
        name = esc(a["name"])
        image = "/assets/natural/" + screenshots[a["slug"]] + ".png" if a["slug"] in screenshots else a["icon"]
        description = esc(summaries.get(a["slug"], a.get("tag", "")))
        web_links = {'yijian':'<p><a href="/yijian-web/">免費使用易見網頁版 →</a></p>',
                     'bazi':'<p><a href="/bazi-web/">免費排八字、讀 20 堂課 →</a></p>',
                     'ziwei':'<p><a href="/ziwei-web/">免費排紫微、讀 36 堂課 →</a></p>',
                     'astrology':'<p><a href="/astrology-web/">免費排星座命盤、讀 36 堂課 →</a></p>'}
        web_link = web_links.get(a['slug'],'')
        cards.append(f'<article class="work"><a href="/{slug}/" aria-label="了解{name}"><div class="work-photo {slug}"><div class="phone"><img src="{image}" alt="{name}實際 App 畫面" loading="lazy"></div></div><div class="work-caption"><h3>{name}</h3><span aria-hidden="true">↗</span></div></a><p>{description}</p>{web_link}</article>')
    with open(os.path.join(HERE, "hub-template.html")) as f:
        template = f.read()
    with open(os.path.join(HERE, "index.html"), "w") as f:
        f.write(template.replace("{{APP_CARDS}}", "".join(cards)))


def llms():
    lines = ["# Michael — learning apps for the I Ching, Bazi, Zi Wei Dou Shu and astrology", "",
             "> Four free browser apps for the I Ching, Bazi, Zi Wei Dou Shu and Western astrology. Complete lessons in Traditional Chinese and English, no account, data stays in the browser. Learning tools, not guarantees about the future.", "",
             "## Free web tools", "- [易見：免費線上易經起卦與六十四卦學習](https://mm7382.github.io/yijian-web/): Free, no login; I Ching coin casting, Zhu Xi reading rules, 64 complete hexagrams and eight interactive lessons. Browser-local history. Not live AI-generated predictions.",
             "- [時來八字：免費排盤與二十堂課](https://mm7382.github.io/bazi-web/): Four Pillars chart, native-source readings, daily practice, monthly report, 20 complete bilingual lessons, browser-local profiles and notes. Free, no login.",
             "- [時來紫微：免費十二宮排盤與三十六堂課](https://mm7382.github.io/ziwei-web/): Zi Wei Dou Shu chart, original-app reading notes, time layers, two-way palace comparison, and 36 complete bilingual lessons. Free, no login. Details: https://mm7382.github.io/ziwei-web/llms.txt",
             "- [時來星座：免費出生星盤與三十六堂課](https://mm7382.github.io/astrology-web/): Western astrology chart, daily and seven-day readings, friend comparison, and 36 complete bilingual lessons. Unknown birth time yields an honestly partial chart. Free, no login. Details: https://mm7382.github.io/astrology-web/llms.txt", "", "## Apps"]
    for a in APPS:
        lines.append(f"- [{a['name']} {a['en']}]({BASE}/{a['slug']}/): {a['llms']}")
    import re, glob
    lines += [
        "", "## Personal site",
        "- [Michael Agent Lab](https://mm7382.github.io/pec-ai-agent-training/): AI agent learning hub with public methods, tutorials and engineering notes (zh-Hant).",
        "- [AI Agent adoption and workflow design](https://mm7382.github.io/pec-ai-agent-training/services.html): Scope one real task, check data access and human review, then agree on a small pilot and handover. Contact through the service page.",
        "- [How to choose an AI Agent consultant](https://mm7382.github.io/pec-ai-agent-training/choose-ai-agent-consultant.html): Questions about data, verification, human review and handover before starting a project.",
        "- [Engineering team workflow examples](https://mm7382.github.io/pec-ai-agent-training/engineering-agent-workflows.html): Three possible pilot tasks and ways to verify their results; illustrative scenarios, not client outcomes.",
        "- [Project portfolio](https://mm7382.github.io/): App, work tools, games, website demos and document projects with real screenshots and explicit development status.",
    ]
    lines += ["", "## Portfolio case pages"]
    for p in sorted(glob.glob(os.path.join(HERE, "work", "*.html"))):
        title = re.search(r"<title>([^<]*)</title>", open(p).read()).group(1)
        lines.append(f"- [{title}]({BASE}/work/{os.path.basename(p)}): Actual work, images and current availability.")
    lines += ["", "## Learning articles (zh-Hant + en)"]
    for p in sorted(glob.glob(os.path.join(HERE, "learn", "*.html"))):
        if p.endswith("index.html"):
            continue
        t = re.search(r"<title>([^<]*)</title>", open(p).read()).group(1)
        lines.append(f"- [{t}]({BASE}/learn/{os.path.basename(p)})")
    with open(os.path.join(HERE, "llms.txt"), "w") as f:
        f.write("\n".join(lines) + "\n")


def sitemap():
    import glob
    learn = [BASE + "/learn/"] + [f"{BASE}/learn/{os.path.basename(p)}" for p in sorted(glob.glob(os.path.join(HERE, "learn", "*.html"))) if not p.endswith("index.html")]
    urls = [BASE + "/"] + [f"{BASE}/{a['slug']}/" for a in APPS] + learn + [BASE + "/llms.txt", BASE + "/yijian/llms.txt"]
    urls += [BASE + '/' + str(p.parent.relative_to(__import__('pathlib').Path(HERE))) + '/' for p in sorted(__import__('pathlib').Path(HERE).glob('yijian-web/**/index.html')) if '/records/' not in str(p)]
    urls += [BASE + '/bazi-web/']
    urls += [BASE + '/' + str(p.parent.relative_to(__import__('pathlib').Path(HERE))) + '/' for p in sorted(__import__('pathlib').Path(HERE).glob('bazi-web/learn/**/index.html')) if '/review/' not in str(p)]
    for slug in ['ziwei-web', 'astrology-web']:
        urls += [BASE + f'/{slug}/', BASE + f'/{slug}/llms.txt']
        urls += [BASE + '/' + str(p.parent.relative_to(__import__('pathlib').Path(HERE))) + '/' for p in sorted(__import__('pathlib').Path(HERE).glob(f'{slug}/learn/**/index.html')) if '/review/' not in str(p)]
    urls += [f"{BASE}/work/{os.path.basename(p)}" for p in sorted(glob.glob(os.path.join(HERE, "work", "*.html")))]
    body = "".join(f"  <url><loc>{u}</loc><lastmod>{"2026-10-25" if u == BASE + "/" or "/work/" in u else ("2026-10-23" if "-web/" in u else "2026-10-15")}</lastmod></url>\n" for u in urls)
    with open(os.path.join(HERE, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "</urlset>\n")


from build_yijian import build as build_yijian
build_yijian()

bad = []
for a in PAGES:
    page = app_page(a)
    # 導覽列與頁尾列的是其他 App 的名稱，不算這一頁的內容
    body = page.split("</nav>", 1)[1].split("<footer>", 1)[0]
    lowered = body.lower()
    for w in BANNED[a["slug"]]:
        if w.lower() in lowered:
            bad.append((a["slug"], w))
hub()
llms()
sitemap()
if bad:
    print("BANNED:", bad)
    sys.exit(1)
print("built, no banned words")
