import json, os, html, sys
from content import BAZI, ZIWEI, ASTRO, YIJIAN_LINK, BANNED

BASE = "https://mm7382.github.io"
DEV = "Wei Chun Chuang"
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
</head>
<body>
<main class="wrap">
"""


FOOT = """<footer>
<p>這些 App 是學習與反思的工具。醫療、法律、投資與其他重大決定，請諮詢合格的專業人士。<br>These apps are tools for learning and reflection. For medical, legal, financial or other major decisions, consult a qualified professional.</p>
<p>開發者 Developer：Wei Chun Chuang・<a href="/">全部 App</a></p>
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
    url = BASE + "/"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Person", "@id": url + "#dev", "name": DEV, "url": url},
        {"@type": "ItemList", "name": "Wei Chun Chuang 的命理學習 App",
         "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{BASE}/{a['slug']}/", "name": a["name"]} for i, a in enumerate(APPS)]},
    ]}
    out = head("Wei Chun Chuang 的 iPhone App｜易經、八字、紫微、星座學習",
               "四款從基礎教起的 iPhone 學習 App：易見、時來－八字、時來－紫微、時來－星座。免費入門課，資料保留在手機。",
               url, ld, "/yijian/icon.png").replace('<main class="wrap">', '<main class="hub">')
    out += '''<a class="hub-skip" href="#works">跳到 App 作品</a>
<div class="hub-shell">
<header class="hub-nav">
  <a class="hub-brand" href="/" aria-label="Wei Chun Chuang 首頁">WCC<span> / </span>作品</a>
  <nav aria-label="主要導覽"><a href="#works">App</a><a href="#notes">入門文章</a><a href="https://mm7382.github.io/pec-ai-agent-training/">Michael Agent Lab ↗</a></nav>
</header>
<section class="hub-intro" aria-labelledby="hub-title">
  <div class="hub-intro-main"><p class="hub-overline">WEI CHUN CHUANG · INDEPENDENT APPS</p>
  <h1 id="hub-title">我把想弄懂的事，<br>做成可以慢慢學的 App。</h1></div>
  <div class="hub-intro-side"><p>易經、八字、紫微與星盤，常被一串術語擋在門外。我把起點放在課程：先看懂它怎麼組成，再讀自己的卦與盤。</p><a href="#works">看四款 App <span aria-hidden="true">↓</span></a></div>
</section>
<section class="hub-work" id="works" aria-labelledby="works-title">
  <div class="hub-section-head"><h2 id="works-title">iPhone App</h2><p>目前四款。新的作品也會在這裡接著列下去。</p></div>
  <div class="hub-work-list">
'''
    categories = ["易經 / I CHING", "四柱 / BAZI", "紫微 / ZI WEI", "西洋占星 / ASTROLOGY"]
    descriptions = ["從陰陽與八卦開始，慢慢讀六十四卦。", "20 堂課，把四柱、五行與十神拆開來學。", "從命宮出發，認識十二宮與自己的盤。", "白話理解太陽、月亮、上升和星盤。"]
    for i, (a, category, description) in enumerate(zip(APPS, categories, descriptions), 1):
        out += f'''<a class="hub-work-item" href="/{a['slug']}/"><span class="hub-work-no">{i:02d}</span><img src="{BASE}{a['icon']}" alt="{esc(a['name'])} App 圖示" loading="lazy"><span class="hub-work-name"><span class="hub-work-category">{category}</span><strong>{esc(a['name'])}</strong></span><span class="hub-work-desc">{esc(description)}</span><span class="hub-work-arrow" aria-hidden="true">↗</span></a>\n'''
    out += '''</div>
</section>
<section class="hub-method" aria-labelledby="method-title"><h2 id="method-title">先學方法，<br>再看自己的答案。</h2><div><p>四款 App 都有免費入門課，提供繁體中文與英文；不需要帳號，資料留在你的手機。</p><p>古籍原文、白話解釋與自撰內容各自標明。它們是學習與反思工具，不替你預測結果，也不代替重大決定。</p></div></section>
<section class="hub-notes" id="notes" aria-labelledby="notes-title"><div class="hub-section-head"><h2 id="notes-title">先讀一篇</h2><a href="/learn/">所有入門文章 ↗</a></div><div class="hub-note-list">
  <a href="/learn/yijian-beginner.html"><span>01 / 易經</span>從陰陽、八卦到六十四卦 <b aria-hidden="true">↗</b></a>
  <a href="/learn/bazi-four-pillars.html"><span>02 / 八字</span>四柱、天干地支與五行怎麼看 <b aria-hidden="true">↗</b></a>
  <a href="/learn/ziwei-twelve-palaces.html"><span>03 / 紫微</span>十二宮與命宮 <b aria-hidden="true">↗</b></a>
  <a href="/learn/sun-moon-rising.html"><span>04 / 星座</span>太陽、月亮與上升 <b aria-hidden="true">↗</b></a>
</div></section>
<aside class="hub-lab" aria-labelledby="lab-title"><div><p>另一個學習入口</p><h2 id="lab-title">Michael Agent Lab</h2><p>除了這些 App，我也把 AI Agent 的工具、筆記與教材整理在個人網站。</p></div><a href="https://mm7382.github.io/pec-ai-agent-training/">前往個人網站 ↗</a></aside>
<section class="hub-english" lang="en" aria-labelledby="english-title"><h2 id="english-title">A place to start learning.</h2><p>Four iPhone apps for the I Ching, Bazi, Zi Wei Dou Shu and Western astrology. Learn the foundations first, then read your own chart or hexagram. Beginner lessons are free. No account is required; your data stays on your phone.</p></section>
<footer class="hub-footer"><div><p>Wei Chun Chuang</p><p>這些 App 是學習與反思工具。醫療、法律、投資或其他重大決定，請諮詢合格專業人士。</p><p lang="en">For medical, legal, financial or other major decisions, consult a qualified professional.</p></div><div class="hub-footer-links"><a href="/learn/">入門文章</a><a href="/llms.txt">llms.txt</a><a href="/sitemap.xml">網站地圖</a></div><div class="hub-footer-legal"><span>各款 App 的法律文件</span><a href="/legal/yijian/privacy">易見隱私</a><a href="/legal/yijian/terms">易見條款</a><a href="/legal/bazi/privacy">八字隱私</a><a href="/legal/bazi/terms">八字條款</a><a href="/legal/ziwei/privacy.html">紫微隱私</a><a href="/legal/ziwei/terms.html">紫微條款</a></div></footer>
</div>
</main>
</body>
</html>
'''
    with open(os.path.join(HERE, "index.html"), "w") as f:
        f.write(out)


def llms():
    lines = ["# Wei Chun Chuang — learning apps for the I Ching, Bazi, Zi Wei Dou Shu and astrology", "",
             "> Four iPhone apps that teach Chinese metaphysics and Western astrology in plain language. Free beginner lessons, Traditional Chinese and English, no account, data stays on device. Learning tools, not fortune-telling services.", "",
             "## Apps"]
    for a in APPS:
        lines.append(f"- [{a['name']} {a['en']}]({BASE}/{a['slug']}/): {a['llms']}")
    import re, glob
    lines += ["", "## Personal site", "- [Michael Agent Lab](https://mm7382.github.io/pec-ai-agent-training/): Michael's AI agent learning hub — tools, tutorials, training materials, engineering journal (zh-Hant)."]
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
    body = "".join(f"  <url><loc>{u}</loc><lastmod>2026-10-15</lastmod></url>\n" for u in urls)
    with open(os.path.join(HERE, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "</urlset>\n")


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
