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
               "四個用白話教你讀懂命理的 iPhone 學習 App：易見（易經）、時來－八字、時來－紫微、時來－星座。都有免費入門課，不需要帳號，資料只存在手機。",
               url, ld, "/yijian/icon.png")
    out += nav()
    out += """<header><div>
<h1>Wei Chun Chuang 的 iPhone App</h1>
<p class="sub">所有 App 的介紹都在這裡・目前：易經、八字、紫微斗數、西洋占星學習 App</p>
</div></header>
<p>這裡有四個學習型 App，共同點是：<strong>先教你怎麼讀，而不是直接告訴你答案。</strong>每個 App 都有免費的入門課程，繁體中文與英文，不需要帳號，資料只存在你的手機。</p>
<div class="apps">
"""
    for a in APPS:
        out += f'<a class="app" href="/{a["slug"]}/"><img src="{a["icon"]}" alt="{esc(a["name"])} 圖示"><div><strong>{esc(a["name"])}</strong><span>{esc(a["tag"])}</span></div></a>\n'
    out += """</div>
<h2>所有連結</h2>
<p class="muted">每個 App 的介紹頁、入門文章與法律文件都在這裡。</p>
<div class="links">
<div class="card"><h3><a href="/yijian/">易見 介紹頁</a></h3><ul><li><a href="/learn/yijian-beginner.html">易經初學者怎麼開始：從陰陽、八卦到六十四卦</a></li><li><a href="/learn/changing-lines.html">動爻、本卦與之卦是什麼？</a></li><li class="muted"><a href="/legal/yijian/privacy">隱私權政策</a>・<a href="/legal/yijian/terms">使用條款</a></li></ul></div>
<div class="card"><h3><a href="/bazi/">時來－八字 介紹頁</a></h3><ul><li><a href="/learn/bazi-four-pillars.html">八字入門：四柱、天干地支與五行怎麼看</a></li><li><a href="/learn/ten-gods.html">十神是什麼？從日主讀懂八字裡的關係</a></li><li class="muted"><a href="/legal/bazi/privacy">隱私權政策</a>・<a href="/legal/bazi/terms">使用條款</a></li></ul></div>
<div class="card"><h3><a href="/ziwei/">時來－紫微 介紹頁</a></h3><ul><li><a href="/learn/ziwei-twelve-palaces.html">紫微斗數入門：十二宮與命宮</a></li><li><a href="/learn/life-body-palace.html">命宮與身宮有什麼不同？</a></li><li class="muted"><a href="/legal/ziwei/privacy.html">隱私權政策</a>・<a href="/legal/ziwei/terms.html">使用條款</a></li></ul></div>
<div class="card"><h3><a href="/astrology/">時來－星座 介紹頁</a></h3><ul><li><a href="/learn/sun-moon-rising.html">星盤怎麼看：太陽、月亮、上升</a></li><li><a href="/learn/unknown-birth-time.html">不知道出生時間，還能看星盤嗎？</a></li></ul></div>
</div>
<p><a href="/learn/">全部入門文章</a>・<a href="/llms.txt">給 AI 看的簡介（llms.txt）</a>・<a href="/sitemap.xml">網站地圖</a></p>
<h2>個人網站：Michael Agent Lab</h2>
<p><a href="/pec-ai-agent-training/">Michael Agent Lab</a>：Michael 整理的 AI Agent 學習入口、熱門工具、教學教材與實作資源，包含工作日誌與 AI Agent 培訓教材。</p>
<h2>四個 App 的共同原則</h2>
<ul>
<li>以課程為主：先學會讀，再看自己的盤或卦。</li>
<li>標明來源：古籍原文、白話解釋和自撰內容分開標示。</li>
<li>前 3 堂免費：不用付費就能上完入門課。</li>
<li>不收集資料：不需要帳號，資料只存在手機。</li>
<li>中英雙語：所有內容都有繁體中文與英文版本。</li>
</ul>
<h2>該選哪一個？</h2>
<dl>
<dt>想讀懂《易經》和六十四卦</dt><dd><a href="/yijian/">易見</a>：八堂課從陰陽講到動爻與之卦，再逐卦讀完六十四卦。</dd>
<dt>想看懂自己的八字（四柱）</dt><dd><a href="/bazi/">時來－八字</a>：App 排盤，20 堂課教你讀日主、五行與十神。</dd>
<dt>想學紫微斗數</dt><dd><a href="/ziwei/">時來－紫微</a>：排出十二宮命盤，從命宮開始一步步學讀盤。</dd>
<dt>想學西洋占星</dt><dd><a href="/astrology/">時來－星座</a>：白話認識星盤、太陽月亮上升與十二星座。</dd>
</dl>
<section lang="en" class="lang"><h2>Plain-language learning apps for the I Ching, Bazi, Zi Wei Dou Shu and astrology</h2>
<p>Four iPhone apps that teach you how to read, rather than handing you answers. Each has free beginner lessons, Traditional Chinese and English, no account, and keeps your data on your phone.</p>
<ul>
<li><a href="/yijian/">YiJian</a> — learn the I Ching and all 64 hexagrams from zero.</li>
<li><a href="/bazi/">Shilai – Bazi</a> — learn to read your own Four Pillars chart in 20 lessons.</li>
<li><a href="/ziwei/">SHILAI Ziwei</a> — read your own Zi Wei Dou Shu twelve-palace chart, starting from the Life Palace.</li>
<li><a href="/astrology/">Shilai Astrology</a> — learn Western astrology and your birth chart in plain language.</li>
</ul></section>
"""
    out += FOOT
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
