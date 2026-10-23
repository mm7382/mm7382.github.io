"""Audit static public pages, source text parity and discovery boundaries."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, re, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'yijian-web'
class Doc(HTMLParser):
 def __init__(self,s):
  super().__init__();self.text=[];self.links=[];self.canonical=[];self.description=[];self.h1=0;self.ld=[];self.inld=False;self.ignore=False;self.feed(s)
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='a' and 'href' in d:self.links.append(d['href'])
  if t=='link' and d.get('rel')=='canonical':self.canonical.append(d['href'])
  if t=='meta' and d.get('name')=='description':self.description.append(d.get('content',''))
  if t=='h1':self.h1+=1
  if t in ['script','style']:self.ignore=True
  if t=='script' and d.get('type')=='application/ld+json':self.inld=True
 def handle_endtag(self,t):
  if t in ['script','style']:self.ignore=False;self.inld=False
 def handle_data(self,s):
  if self.inld:self.ld.append(json.loads(s))
  if not self.ignore:self.text.append(s)
def norm(s):return re.sub(r'\s+','',s)
def assert_text(doc,text,path):
 if text:assert norm(text) in norm(''.join(doc.text)),f'{path}: missing source text {text[:35]}'
def zh_strings(x):
 if isinstance(x,dict):
  if 'zh-Hant' in x:yield x['zh-Hant']
  else:
   for v in x.values():yield from zh_strings(v)
 elif isinstance(x,list):
  for v in x:yield from zh_strings(v)
files=list(SITE.rglob('index.html'));assert len(files)>=77,len(files)
for f in files:
 markup=f.read_text();d=Doc(markup);rel='/'+str(f.parent.relative_to(ROOT))+'/'
 assert 'Wei Chun Chuang' not in markup,(rel,'private author name')
 assert all(item.get('author',{}).get('name')=='Michael' for item in d.ld),(rel,'public author name')
 assert d.h1==1,(rel,'h1')
 assert d.canonical==['https://mm7382.github.io'+rel],(rel,'canonical')
 assert len(d.description)==1 and d.description[0],(rel,'description')
 assert d.ld,(rel,'structured data')
 for l in d.links:
  u=urlsplit(l)
  if u.scheme or u.netloc or not u.path:continue
  target=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else f.parent/unquote(u.path)
  if u.path.startswith(('/pec-ai-agent-training/','/yijian/')):continue # separate project sites
  assert target.exists(),(rel,l)
corpus=json.loads((SITE/'assets/data/hexagrams.json').read_text())['hexagrams']
for h in corpus:
 f=SITE/'hexagrams'/str(h['number'])/'index.html';d=Doc(f.read_text())
 for k in ['originalJudgment','ancientContext','plainLanguage','coreMessage','judgmentGuidance']:assert_text(d,h[k],f)
 for line in h['lines']:
  for k in ['original','ancientContext','plainLanguage','lifeTranslation','reflectionPrompt']:assert_text(d,line[k],f)
readings=json.loads((SITE/'assets/data/hexagram-readings.json').read_text())['readings']
for r in readings:
 f=SITE/'hexagrams'/str(r['number'])/'index.html';d=Doc(f.read_text())
 for k in ['summary','objectives','structure','plain','example']:
  for s in zh_strings(r[k]):assert_text(d,s,f)
lessons=json.loads((SITE/'assets/data/lessons.json').read_text())['lessons']
for lesson in lessons:
 candidates=[SITE/'lessons'/str(lesson['order'])/'index.html',SITE/'lessons'/lesson['id']/'index.html']
 f=next((p for p in candidates if p.exists()),None);assert f,lesson['id'];d=Doc(f.read_text())
 for k in ['title','summary','objectives','sections','quiz','activity']:
  for s in zh_strings(lesson[k]):assert_text(d,s,f)
# Root sitemap may include other project sites; public tools and readings must be included.
urls={e.text for e in ET.parse(ROOT/'sitemap.xml').iter() if e.tag.endswith('loc')}
for f in files:
 url='https://mm7382.github.io/'+str(f.parent.relative_to(ROOT))+'/'
 if '/records/' not in url:assert url in urls,('missing sitemap',url)
assert not any('/records/' in u for u in urls),'private history UI should not be advertised for indexing'
print(f'PASS: {len(files)} pages; 64 complete hexagrams + essays; 8 source-parity lessons; internal links, metadata and public sitemap')
