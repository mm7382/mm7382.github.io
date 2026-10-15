import json, os, html

BASE = "https://mm7382.github.io"
DEV = "Wei Chun Chuang"
HERE = os.path.dirname(os.path.abspath(__file__))

APPS = [
    {
        "slug": "yijian", "name": "易見", "en": "YiJian", "icon": "/yijian/icon.png",
        "tag": "從零學易經，八堂課讀懂六十四卦",
        "tag_en": "Learn the I Ching from zero",
        "external": True,
    },
    {
        "slug": "bazi", "name": "時來－八字", "en": "Shilai – Bazi", "icon": "/bazi/icon.png",
        "tag": "20 堂課，學會讀自己的八字",
        "tag_en": "Learn to read your own Bazi chart",
        "status": "已送 App Store 審核，尚未上架",
        "os": "iOS 16 以上", "category": "EducationalApplication",
        "intro": "時來－八字是一套教你讀懂自己八字的課程 App。排盤交給 App 計算，你只要專心學怎麼解讀。20 堂白話課從四柱、五行、十神講到合沖與完整解讀流程，每堂課後有不計分的選擇題；另有每日一題，用當天的干支對你的日主出題練習。",
        "features": ["20 堂白話課程，前 3 堂免費", "課後測驗（不計分）", "每日一題練習", "命盤白話解讀", "筆記與複習", "支援全球出生時區，繁體中文／英文切換"],
        "free": "前 3 堂課程與命盤基本解讀。",
        "member": "其餘 17 堂進階課、性格／感情／工作三個主題、十年大運、個人月報、多張命盤。月方案 NT$120、年方案 NT$990，內容相同。",
        "privacy": "/legal/bazi/privacy", "terms": "/legal/bazi/terms",
        "shots": [],
        "faq": [("時來－八字適合完全不懂八字的人嗎？", "適合。排盤由 App 計算，課程用白話從四柱與五行講起，前 3 堂免費。"),
                ("時來－八字是算命 App 嗎？", "不是。它是學習怎麼讀八字的課程工具，不做擇日排序，也不構成醫療、法律或投資建議。")],
        "en_text": "Shilai – Bazi is an iPhone course that teaches you to read your own Bazi (Four Pillars) chart. The app computes the chart; 20 plain-language lessons explain the four pillars, five elements, ten gods and clashes, with an ungraded quiz after each lesson and a daily practice question. First three lessons free; Traditional Chinese and English.",
    },
    {
        "slug": "ziwei", "name": "時來－紫微", "en": "SHILAI Ziwei", "icon": "/ziwei/icon.png",
        "tag": "從命宮開始，讀懂自己的盤",
        "tag_en": "Read your own Zi Wei chart",
        "status": "即將上架",
        "os": "iOS 17 以上", "category": "EducationalApplication",
        "intro": "時來－紫微會依你的出生資料排出紫微斗數十二宮命盤，再用課程一步步帶你學會自己讀。每一句解釋都分成古籍原文、白話轉述與本專案自撰三層，來源清楚。",
        "features": ["紫微斗數十二宮命盤", "白話課程，前 3 堂免費", "當日資訊與命格基本資料", "古籍原文、白話、自撰三層對照", "筆記與錯題本", "繁體中文／英文"],
        "free": "前 3 堂課程、當日資訊、命格基本資料，可存 2 個命盤。",
        "member": "第 4–36 堂、六項完整導讀、未來七日、筆記與錯題本，最多 10 個命盤。",
        "privacy": "/legal/ziwei/privacy.html", "terms": "/legal/ziwei/terms.html",
        "shots": [("learn.png", "時來－紫微學習首頁"), ("chart.png", "時來－紫微十二宮命盤")],
        "faq": [("有沒有能學紫微斗數的 App？", "時來－紫微會排出十二宮命盤，並用課程教你自己讀盤，前 3 堂免費。"),
                ("時來－紫微是算命 App 嗎？", "不是，它不算吉凶。它是學習讀盤的工具，每句解釋都標明來源層次。")],
        "en_text": "SHILAI Ziwei builds your Zi Wei Dou Shu twelve-palace chart from your birth details and teaches you, lesson by lesson, how to read it yourself. Every explanation is labelled as classical source, plain-language paraphrase, or the project's own writing. First three lessons free; Traditional Chinese and English.",
    },
    {
        "slug": "astrology", "name": "時來－星座", "en": "Shilai Astrology", "icon": "/astrology/icon.png",
        "tag": "用白話學西洋占星，看懂自己的星盤",
        "tag_en": "Learn Western astrology in plain language",
        "status": "開發中，尚未上架",
        "os": "iOS", "category": "EducationalApplication",
        "intro": "時來－星座用白話課程教你看懂自己的西洋占星星盤。個人星盤採 Placidus 宮位制；不知道出生時間也能用，App 會標出不確定的部分，不畫假的上升或宮位。這是學習工具，不是算命。",
        "features": ["白話課程，前 3 堂免費", "個人星盤（Placidus 宮位制）", "不知道出生時間也能建盤，清楚標出不確定的部分", "今日星象", "筆記與複習", "繁體中文／英文"],
        "free": "免費下載，前 3 堂課程免費。",
        "member": "未來七日、最多五張星盤、中型 Widget、每日一次摘要提醒。價格未定。",
        "privacy": None, "terms": None,
        "shots": [],
        "faq": [("有沒有用白話學西洋占星的 App？", "時來－星座用白話課程教你讀自己的星盤，前 3 堂免費，不需要帳號。"),
                ("不知道出生時間可以用嗎？", "可以。App 會標出因此無法確定的部分，不會畫出假的上升或宮位。")],
        "en_text": "Shilai Astrology teaches you to read your own Western astrology birth chart through plain-language lessons. Charts use Placidus houses; if you don't know your birth time, the app marks what can't be confirmed instead of inventing an ascendant or houses. A learning tool, not fortune telling. First three lessons free; Traditional Chinese and English.",
    },
]

PRIVACY_LINE = "不需要帳號，資料只存在你的 iPhone，不上傳伺服器。"


def esc(s):
    return html.escape(s, quote=True)


def nav():
    links = ['<a href="/">全部 App</a>'] + [f'<a href="/{a["slug"]}/">{esc(a["name"])}</a>' for a in APPS]
    return "<nav>" + "".join(links) + "</nav>"


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
<p>這些 App 是學習與反思的工具。醫療、法律、投資與其他重大決定，請諮詢合格的專業人士。</p>
<p>開發者：Wei Chun Chuang</p>
</footer>
</main>
</body>
</html>
"""


def app_page(a):
    url = f"{BASE}/{a['slug']}/"
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "MobileApplication", "@id": url + "#app",
                "name": a["name"], "alternateName": a["en"],
                "description": a["en_text"], "operatingSystem": a["os"],
                "applicationCategory": a["category"], "inLanguage": ["zh-Hant", "en"],
                "url": url, "image": BASE + a["icon"],
                "author": {"@type": "Person", "name": DEV, "url": BASE + "/"},
                "isAccessibleForFree": True,
            },
            {
                "@type": "FAQPage",
                "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": t}} for q, t in a["faq"]],
            },
        ],
    }
    desc = f"{a['name']}（{a['en']}）：{a['tag']}。{a['intro'][:60]}"
    out = head(f"{a['name']} {a['en']}｜{a['tag']}", desc, url, ld, a["icon"])
    out += nav()
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
    out += "<h2>主要功能</h2>\n<ul>" + "".join(f"<li>{esc(x)}</li>" for x in a["features"]) + "</ul>\n"
    out += f"""<h2>免費與會員</h2>
<div class="card"><p><strong>免費：</strong>{esc(a['free'])}</p><p><strong>會員：</strong>{esc(a['member'])}</p></div>
<h2>隱私</h2>
<p>{PRIVACY_LINE}</p>
<h2>常見問題</h2>
<dl>""" + "".join(f"<dt><strong>{esc(q)}</strong></dt><dd>{esc(t)}</dd>" for q, t in a["faq"]) + "</dl>\n"
    out += f'<section lang="en"><h2>{esc(a["en"])} — {esc(a["tag_en"])}</h2><p>{esc(a["en_text"])}</p></section>\n'
    links = []
    if a["privacy"]:
        links.append(f'<a href="{a["privacy"]}">隱私權政策</a>')
    if a["terms"]:
        links.append(f'<a href="{a["terms"]}">使用條款</a>')
    if links:
        out += "<p>" + "・".join(links) + "</p>\n"
    out += FOOT
    os.makedirs(os.path.join(HERE, a["slug"]), exist_ok=True)
    with open(os.path.join(HERE, a["slug"], "index.html"), "w") as f:
        f.write(out)


def hub():
    url = BASE + "/"
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "Person", "@id": url + "#dev", "name": DEV, "url": url},
            {"@type": "ItemList", "name": "Wei Chun Chuang 的命理學習 App",
             "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{BASE}/{a['slug']}/", "name": a["name"]} for i, a in enumerate(APPS)]},
        ],
    }
    out = head("易經、八字、紫微、星座學習 App｜Wei Chun Chuang",
               "四個用白話教你讀懂命理的 iPhone 學習 App：易見（易經）、時來－八字、時來－紫微、時來－星座。都有免費入門課，不需要帳號，資料只存在手機。",
               url, ld, "/yijian/icon.png")
    out += nav()
    out += """<header><div>
<h1>用白話學命理的 iPhone App</h1>
<p class="sub">易經・八字・紫微斗數・西洋占星</p>
</div></header>
<p>這裡有四個學習型 App，共同點是：<strong>先教你怎麼讀，而不是直接告訴你答案。</strong>每個 App 都有免費的入門課程，繁體中文與英文，不需要帳號，資料只存在你的手機。</p>
<div class="apps">
"""
    for a in APPS:
        out += f'<a class="app" href="/{a["slug"]}/"><img src="{a["icon"]}" alt="{esc(a["name"])} 圖示"><div><strong>{esc(a["name"])}</strong><span>{esc(a["tag"])}</span></div></a>\n'
    out += "</div>\n"
    out += '<section lang="en"><h2>Plain-language learning apps for Chinese metaphysics and astrology</h2><p>Four iPhone apps that teach you how to read the I Ching (YiJian), Bazi (Shilai – Bazi), Zi Wei Dou Shu (SHILAI Ziwei) and Western astrology (Shilai Astrology). Each has free beginner lessons, Traditional Chinese and English, no account, and keeps your data on your phone.</p></section>\n'
    out += FOOT
    with open(os.path.join(HERE, "index.html"), "w") as f:
        f.write(out)


def llms():
    lines = ["# Wei Chun Chuang — learning apps for I Ching, Bazi, Zi Wei and astrology", "",
             "> Four iPhone apps that teach Chinese metaphysics and Western astrology in plain language. Free beginner lessons, Traditional Chinese and English, no account, data stays on device. Learning tools, not fortune telling.", "",
             "## Apps"]
    for a in APPS:
        lines.append(f"- [{a['name']} {a['en']}]({BASE}/{a['slug']}/): {a['tag_en']}")
    lines += ["", "## Notes", "- All four are learning and reflection tools, not fortune-telling services.", "- YiJian, Ziwei and Astrology are not yet on the App Store; Bazi is in App Store review."]
    with open(os.path.join(HERE, "llms.txt"), "w") as f:
        f.write("\n".join(lines) + "\n")


def sitemap():
    urls = [BASE + "/"] + [f"{BASE}/{a['slug']}/" for a in APPS] + [BASE + "/llms.txt", BASE + "/yijian/llms.txt"]
    body = "".join(f"  <url><loc>{u}</loc><lastmod>2026-10-15</lastmod></url>\n" for u in urls)
    with open(os.path.join(HERE, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "</urlset>\n")
    with open(os.path.join(HERE, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")


for a in APPS:
    if not a.get("external"):
        app_page(a)
hub()
llms()
sitemap()
print("built")
