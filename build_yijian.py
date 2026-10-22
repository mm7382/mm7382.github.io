"""Source-driven YiJian static site. Optional --source imports reviewed native resources."""
import json, html, argparse, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'yijian-web'
DATA=OUT/'assets/data'
BASE='https://mm7382.github.io'
PREFIX='/yijian-web/'
def e(s): return html.escape(str(s),quote=True)
def zh(s): return s.get('zh-Hant','') if isinstance(s,dict) else str(s)
def p(s): return ''.join('<p>'+e(x)+'</p>' for x in zh(s).split('\n\n') if x)
def heading(title,body): return '<section><h2>'+e(title)+'</h2>'+body+'</section>'
def diagram(bits):
 return '<div class="hexagram" role="img" aria-label="由下往上：'+''.join('陽' if b=='1' else '陰' for b in bits)+'">'+''.join('<span class="line '+('yang' if b=='1' else 'yin')+'"><i></i><i></i></span>' for b in bits[::-1])+'</div>'
def page(path,title,description,body,kind='WebPage'):
 url=BASE+PREFIX+path
 schema={'@context':'https://schema.org','@type':kind,'name':title,'description':description,'url':url,'inLanguage':'zh-Hant','isAccessibleForFree':True,'author':{'@type':'Person','name':'Wei Chun Chuang / Michael','url':BASE+'/'}}
 out=f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}｜易見</title><meta name="description" content="{e(description)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{e(title)}｜易見"><meta property="og:description" content="{e(description)}"><meta property="og:url" content="{url}"><meta property="og:type" content="website"><meta property="og:image" content="{BASE}/assets/natural/yijian.png"><link rel="stylesheet" href="{PREFIX}assets/site.css"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script><script type="module" src="{PREFIX}assets/app.mjs"></script></head><body><a class="skip" href="#main">跳到內容</a><header class="site-header"><a class="brand" href="{PREFIX}">易見 <small>易經・學習與反思</small></a><nav aria-label="主要導覽"><a href="{PREFIX}hexagrams/">六十四卦</a><a href="{PREFIX}cast/">免費起卦</a><a href="{PREFIX}lessons/">八堂課</a><a href="{PREFIX}records/">我的紀錄</a></nav></header><main id="main">{body}</main><footer><p>易見，由 <a href="/">Wei Chun Chuang / Michael</a> 製作。全部免費，免登入。</p><p><a href="/pec-ai-agent-training/">Michael 的教學網站</a> · <a href="/">其他作品</a> · <a href="/yijian/">原 App 介紹</a></p><p>易經是學習與反思的工具，不保證未來結果。起卦與學習資料只存在目前瀏覽器，不會同步到其他裝置；清除瀏覽器資料也會清除紀錄。</p></footer></body></html>'''
 target=OUT/path/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(out)
def source(h):
 s=h['sourceVersion'];return '<p class="source">來源：<a href="'+e(s['pageURL'])+'">'+e(s['primarySource'])+'</a>。'+e(s['revision'])+'；取得日期 '+e(s['retrievedDate'])+'。<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>。本頁沿用原 App 的原典整理與白話教學，改為網頁排版。</p>'
def line_content(l):
 return '<h3>'+e(l['original'])+'</h3>'+''.join(p(l.get(k,'')) for k in ['ancientContext','plainLanguage','lifeTranslation','reflectionPrompt'])
def reading(h,r):
 b='<p class="eyebrow">六十四卦 / '+str(h['number']).zfill(2)+'</p><h1>'+e(h['name'])+'卦</h1>'+diagram(h['linesBinary'])+p(h['coreMessage'])
 b+=heading('卦辭與白話',p(h['originalJudgment'])+p(h['ancientContext'])+p(h['plainLanguage'])+p(h['judgmentGuidance']))
 b+=heading('從結構讀懂這一卦',p(r['summary'])+'<ul>'+''.join('<li>'+e(zh(x))+'</li>' for x in r['objectives'])+'</ul>'+p(r['structure'])+p(r['plain'])+p(r['example']))
 b+=heading('六爻原文與反思',''.join(line_content(l) for l in h['lines']))
 for key in ['useNine','useSix']:
  if h.get(key): b+=heading('用九' if key=='useNine' else '用六',''.join(p(v) for v in h[key].values()))
 b+=source(h)+'<p><a href="'+PREFIX+'hexagrams/">返回六十四卦</a></p>'
 page('hexagrams/'+str(h['number'])+'/',h['name']+'卦：原文、白話與六爻解釋',h['coreMessage'],b)
def build():
 hs=json.loads((DATA/'hexagrams.json').read_text())['hexagrams'];rs=json.loads((DATA/'hexagram-readings.json').read_text())['readings']
 for h,r in zip(hs,rs): reading(h,r)
 page('hexagrams/','六十四卦查閱：卦辭、爻辭與白話解釋','免費查閱完整六十四卦，每卦含原文、六爻、白話與結構教學。','<p class="eyebrow">從一卦開始</p><h1>六十四卦</h1><p>由下往上讀六爻，從原文走向理解。</p><label class="field"><span>搜尋卦名或卦序</span><input id="hex-search" type="search" placeholder="例如：乾、泰、11"></label><p id="search-status" role="status"></p><ul class="hex-list">'+''.join('<li data-search="'+str(h['number'])+' '+h['name']+'"><a href="'+PREFIX+'hexagrams/'+str(h['number'])+'/"><small>'+str(h['number']).zfill(2)+'</small>　'+e(h['name'])+'</a></li>' for h in hs)+'</ul>')
 page('', '免費線上易經起卦與六十四卦學習','易見：免費、免登入的易經工具。查閱六十四卦原文與白話，學習八堂課，線上起卦與解讀。','''<div class="hero"><p class="eyebrow">易經，從看懂開始</p><h1>讀懂一卦，<br>多一個思考的角度。</h1><p class="lead">從陰陽與六爻開始，讀原文、學結構，再回到自己的生活。易見的內容與工具，全部免費開放。</p><div class="actions"><a class="button" href="/yijian-web/cast/">開始免費起卦</a><a href="/yijian-web/lessons/">先從第一堂學起 →</a></div></div><section><h2>把一卦讀完整</h2><p>原文、白話與生活反思放在一起，慢慢理解每一爻。</p><a href="/yijian-web/hexagrams/1/">讀第一卦：乾 →</a></section>''')
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path);args=parser.parse_args()
 if args.source:
  DATA.mkdir(parents=True,exist_ok=True)
  for name in ['hexagrams','hexagram-readings','lessons','topic-guidance']:shutil.copyfile(args.source/(name+'.json'),DATA/(name+'.json'))
 build()
