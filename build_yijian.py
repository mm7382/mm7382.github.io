"""Source-driven YiJian static site. Optional --source imports reviewed native resources."""
import json, html, argparse, shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'yijian-web'
DATA = OUT / 'assets/data'
BASE = 'https://mm7382.github.io'
PREFIX = '/yijian-web/'

def e(s):
    return html.escape(str(s), quote=True)

def zh(s):
    return s.get('zh-Hant', '') if isinstance(s, dict) else str(s)

def p(s):
    return ''.join(('<p>' + e(x) + '</p>' for x in zh(s).split('\n\n') if x))

def heading(title, body):
    return '<section><h2>' + e(title) + '</h2>' + body + '</section>'

def diagram(bits):
    return '<div class="hexagram" role="img" aria-label="由下往上：' + ''.join(('陽' if b == '1' else '陰' for b in bits)) + '">' + ''.join(('<span class="line ' + ('yang' if b == '1' else 'yin') + '"><i></i><i></i></span>' for b in bits[::-1])) + '</div>'

def page(path, title, description, body, kind='WebPage'):
    url = BASE + PREFIX + path
    schema = {'@context': 'https://schema.org', '@type': kind, 'name': title, 'description': description, 'url': url, 'inLanguage': 'zh-Hant', 'isAccessibleForFree': True, 'author': {'@type': 'Person', 'name': 'Michael', 'url': BASE + '/'}}
    if path == '':
        schema.update({'@type': 'WebApplication', 'applicationCategory': 'EducationalApplication', 'operatingSystem': 'Any', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'TWD'}})
    out = f'<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}｜易見</title><meta name="description" content="{e(description)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{e(title)}｜易見"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{url}"><meta property="og:type" content="website"><meta property="og:image" content="{BASE}/assets/natural/yijian.png"><link rel="icon" href="/assets/natural/yijian.png"><link rel="stylesheet" href="{PREFIX}assets/site.css?v=7"><link rel="stylesheet" href="{PREFIX}assets/museum.css?v=1"><script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script><script type="module" src="{PREFIX}assets/app.mjs?v=4"></script></head><body class="{'museum-home' if path == '' else 'museum-interior'}"><a class="skip" href="#main">跳到內容</a><div class="topline"><div class="frame"><span>易見・用自己的步調看懂易經</span><span>免費學習・免登入</span></div></div><header class="masthead frame"><a class="wordmark" href="{PREFIX}" aria-label="易見首頁"><span class="seal" aria-hidden="true"><i></i><i></i><i></i></span><strong>易見</strong></a><nav aria-label="主要導覽"><a href="{PREFIX}hexagrams/">六十四卦</a><a href="{PREFIX}lessons/">八堂課</a><a href="{PREFIX}records/">我的紀錄</a><a class="back-link" href="{PREFIX}cast/">免費起卦 ↗</a></nav></header><main id="main">{body}</main><footer class="site-footer frame"><p>易見，由 <a href="https://mm7382.github.io/pec-ai-agent-training/">Michael</a> 製作。全部免費，免登入。</p><p><a href="https://mm7382.github.io/pec-ai-agent-training/">Michael 的教學網站</a> · <a href="/">其他作品</a> · <a href="https://mm7382.github.io/yijian/">原 App 介紹</a></p><p>易經是學習與反思的工具，不保證未來結果。起卦與學習資料只存在目前瀏覽器，不會同步到其他裝置；清除瀏覽器資料也會清除紀錄。</p></footer></body></html>'
    if path == 'records/':
        out = out.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="robots" content="noindex,follow">')
    target = OUT / path / 'index.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(out)

def source(h):
    s = h['sourceVersion']
    return '<p class="source">來源：<a href="' + e(s['pageURL']) + '">' + e(s['primarySource']) + '</a>。' + e(s['revision']) + '；取得日期 ' + e(s['retrievedDate']) + '。<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>。本頁沿用原 App 的原典整理與白話教學，改為網頁排版。</p>'

def line_content(l):
    return '<h3>' + e(l['original']) + '</h3>' + ''.join((p(l.get(k, '')) for k in ['ancientContext', 'plainLanguage', 'lifeTranslation', 'reflectionPrompt']))

def interactive(data, kind):
    payload = json.dumps({'kind': kind, 'data': data}, ensure_ascii=False).replace('<', '\\u003c')
    return '<div class="interactive" data-kind="' + kind + '"><script type="application/json" class="activity-data">' + payload + '</script><div class="activity-root"></div></div>'

def still_life(lazy=True):
    loading = 'lazy' if lazy else 'eager'
    return '<figure class="editorial-photo"><img src="' + PREFIX + 'assets/coin-still-life.jpg" alt="三枚古銅錢置於手工紙上，旁邊是布面書冊與枝葉的光影" loading="' + loading + '" width="1122" height="1402"><figcaption><span>易見・起卦與閱讀</span><span>一爻一念，留一點時間給自己</span></figcaption></figure>'

def quiz(questions, prefix):
    out = ''
    for q in questions:
        out += '<fieldset class="question" data-question="' + prefix + '-' + e(q['id']) + '"><legend>' + e(zh(q['prompt'])) + '</legend>'
        for c in q['choices']:
            out += '<button type="button" aria-pressed="false" data-correct="' + str(c['correct']).lower() + '" data-explanation="' + e(zh(c['explanation'])) + '">' + e(zh(c['text'])) + '</button>'
        out += '<p class="feedback" role="status"></p><details><summary>查看答案與各選項說明</summary>' + ''.join(('<p><strong>' + e(zh(c['text'])) + ('（正確）' if c['correct'] else '') + '</strong>：' + e(zh(c['explanation'])) + '</p>' for c in q['choices'])) + '</details></fieldset>'
    return out

def reading(h, r):
    b = '<p class="eyebrow">六十四卦 / ' + str(h['number']).zfill(2) + '</p><h1>' + e(h['name']) + '卦</h1>' + diagram(h['linesBinary']) + p(h['coreMessage'])
    b += heading('卦辭與白話', p(h['originalJudgment']) + p(h['ancientContext']) + p(h['plainLanguage']) + p(h['trendReason']) + p(h['judgmentGuidance']))
    b += heading('從結構讀懂這一卦', p(r['summary']) + '<ul>' + ''.join(('<li>' + e(zh(x)) + '</li>' for x in r['objectives'])) + '</ul>' + p(r['structure']) + p(r['plain']) + p(r['example']))
    b += heading('六爻原文與反思', ''.join((line_content(l) for l in h['lines'])))
    for key in ['useNine', 'useSix']:
        if h.get(key):
            b += heading('用九' if key == 'useNine' else '用六', ''.join((p(v) for v in h[key].values())))
    b += heading('動手觀察', p(r['interaction']['instruction']) + interactive({'number': h['number'], 'interaction': r['interaction']}, 'reading')) + heading('小測驗', quiz(r['quiz'], 'hex-' + str(h['number'])))
    b += source(h) + '<p><a href="' + PREFIX + 'hexagrams/">返回六十四卦</a></p>'
    page('hexagrams/' + str(h['number']) + '/', h['name'] + '卦：原文、白話與六爻解釋', h['coreMessage'], b)

def lesson(l):
    b = '<p class="eyebrow">八堂入門課 / ' + str(l['order']).zfill(2) + '</p><h1>' + e(zh(l['title'])) + '</h1>' + p(l['summary']) + '<ul>' + ''.join(('<li>' + e(zh(o)) + '</li>' for o in l['objectives'])) + '</ul>'
    for section in l['sections']:
        b += heading(zh(section.get('heading', '')), p(section.get('body', '')))
    a = l['activity']
    b += heading(zh(a['heading']), p(a['instruction']) + interactive(a, 'lesson') + quiz(a.get('questions', []), l['id'] + '-activity'))
    b += heading('小測驗', quiz(l['quiz'], l['id']))
    b += '<section data-lesson="' + e(l['id']) + '"><button id="complete-lesson" type="button">標記本課已完成</button><p id="lesson-status" role="status"></p><p class="status">讀完課程，完成練習與測驗後，可記下你的學習進度。</p></section><div class="actions"><a href="' + PREFIX + 'lessons/">返回課程目錄</a>'
    if l['order'] < 8:
        b += '<a class="next-lesson" href="' + PREFIX + 'lessons/' + str(l['order'] + 1) + '/">下一堂 →</a>'
    b += '</div>'
    page('lessons/' + str(l['order']) + '/', zh(l['title']), zh(l['summary']), b, 'LearningResource')

def build():
    hs = json.loads((DATA / 'hexagrams.json').read_text())['hexagrams']
    rs = json.loads((DATA / 'hexagram-readings.json').read_text())['readings']
    for h, r in zip(hs, rs):
        reading(h, r)
    lessons = json.loads((DATA / 'lessons.json').read_text())['lessons']
    for l in lessons:
        lesson(l)
    page('lessons/', '易經入門八堂課', '免費易經課程：陰陽、八卦、六十四卦、動爻與解讀，附互動練習及測驗。', '<p class="eyebrow">不用急著懂全部</p><h1>八堂課，從零開始。</h1><p>每堂都有可操作的練習。讀、試、再回頭看，一步步建立自己的理解。</p><ol class="entry-list">' + ''.join(('<li><a href="' + PREFIX + 'lessons/' + str(l['order']) + '/">' + str(l['order']).zfill(2) + '\u3000' + e(zh(l['title'])) + '</a><span class="lesson-progress" data-progress="' + e(l['id']) + '"></span><p>' + e(zh(l['summary'])) + '</p></li>' for l in lessons)) + '</ol>')
    page('cast/', '免費線上易經起卦與解讀', '免費、免登入，使用三枚銅錢法起卦，依朱熹變占法閱讀本卦、動爻與之卦。', '<div class="cast-heading"><div class="cast-heading-copy"><p class="eyebrow">留一點時間給自己</p><h1>起一卦，慢慢讀。</h1><p>在心中整理一個想反思的問題，不必輸入個人資料。每次擲三枚銅錢，由下往上完成六爻。</p><div class="notice">使用三枚銅錢法：正面算 3，反面算 2。6、9 為動爻。完成後依朱熹變占法選擇主讀文字；解讀提供思考角度，不保證結果。</div><a class="cast-jump" href="#cast-form">現在開始擲銅錢 ↓</a></div>' + still_life(False) + '</div><form id="cast-form"><label class="field"><span>想反思的主題</span><select id="topic" aria-label="想反思的主題">' + ''.join(('<option value="' + k + '">' + v + '</option>' for k, v in [('general', '綜合'), ('career', '事業'), ('study', '學業'), ('romance', '感情'), ('family', '家庭'), ('relations', '人際'), ('finance', '財務'), ('wellness', '身心')])) + '</select></label><div class="actions"><button type="button" id="throw-coins">擲第一爻</button><button type="button" id="reset-cast" class="quiet">重新起卦</button></div><p id="throw-status" role="status">尚未起卦</p><div id="cast-lines"></div><details><summary>使用自己擲出的六爻數字</summary><p>由初爻至上爻填入 6、7、8、9，以空格分隔。</p><label class="field"><span>六爻數字</span><input id="manual-values" inputmode="numeric" placeholder="例如：9 8 8 7 7 8"></label><button type="submit">查看解讀</button></details></form><p id="cast-error" role="alert"></p><div id="result" tabindex="-1"></div>')
    page('records/', '我的學習與起卦紀錄', '查看與清除保存在目前瀏覽器的學習進度、起卦紀錄。', '<p class="eyebrow">留給自己的筆記</p><h1>我的紀錄</h1><p class="notice">紀錄只存在目前瀏覽器，不上傳、不跨裝置同步。無痕模式或清除瀏覽器資料後可能消失。</p><p id="storage-status" role="status"></p><section><h2>學習進度</h2><div id="saved-progress"></div></section><section><h2>起卦紀錄</h2><div id="saved-history"></div></section><section><button type="button" class="quiet" id="clear-records">清除全部紀錄與進度</button><div id="clear-confirm" hidden><p>確定清除？刪除後無法復原。</p><button id="confirm-clear" type="button">確定清除</button> <button id="cancel-clear" type="button" class="quiet">取消</button></div></section><div id="result" tabindex="-1"></div>')
    page('hexagrams/', '六十四卦查閱：卦辭、爻辭與白話解釋', '免費查閱完整六十四卦，每卦含原文、六爻、白話與結構教學。', '<p class="eyebrow">從一卦開始</p><h1>六十四卦</h1><p>由下往上讀六爻，從原文走向理解。</p><label class="field"><span>搜尋卦名或卦序</span><input id="hex-search" type="search" placeholder="例如：乾、泰、11"></label><p id="search-status" role="status"></p><ul class="hex-list">' + ''.join(('<li data-search="' + str(h['number']) + ' ' + h['name'] + '"><a href="' + PREFIX + 'hexagrams/' + str(h['number']) + '/"><small>' + str(h['number']).zfill(2) + '</small>\u3000' + e(h['name']) + '</a></li>' for h in hs)) + '</ul>')
    page('', '免費線上易經起卦與六十四卦學習', '易見：免費、免登入的易經工具。查閱六十四卦原文與白話，學習八堂課，線上起卦與解讀。', (ROOT / 'templates/museum-home.html').read_text())
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path)
    args = parser.parse_args()
    if args.source:
        DATA.mkdir(parents=True, exist_ok=True)
        for name in ['hexagrams', 'hexagram-readings', 'lessons', 'topic-guidance']:
            shutil.copyfile(args.source / (name + '.json'), DATA / (name + '.json'))
    build()
