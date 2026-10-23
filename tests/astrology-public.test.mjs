import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read=p=>readFileSync(fileURLToPath(new URL(`../${p}`,import.meta.url)),'utf8');
const lessons=JSON.parse(read('astrology-web/lessons-data.json')).lessons;
const sitemap=read('sitemap.xml');

test('all public astrology routes are indexable and listed once; private notes stay out',()=>{
  const urls=['/astrology-web/','/astrology-web/llms.txt','/astrology-web/learn/','/astrology-web/learn/en/',
    ...lessons.flatMap(x=>[`/astrology-web/learn/${x.id}/`,`/astrology-web/learn/${x.id}/en/`])];
  assert.equal(urls.length,76);
  for(const path of urls){
    const url=`https://mm7382.github.io${path}`;
    assert.equal(sitemap.split(`<loc>${url}</loc>`).length-1,1,path);
    if(path.endsWith('.txt'))continue;
    const html=read(path.slice(1)+'index.html');
    assert.match(html,/name="robots" content="index, follow"/);
    assert.ok(html.includes(`<link rel="canonical" href="${url}"`),path);
    assert.ok(!html.includes('Wei Chun Chuang'),path);
  }
  assert.ok(!sitemap.includes('/astrology-web/learn/review/'));
  assert.match(read('astrology-web/learn/review/index.html'),/name="robots" content="noindex, nofollow"/);
});

test('the main gallery, app introduction, FAQ and AI guide lead to the free web tool',()=>{
  const root=read('index.html'),intro=read('astrology/index.html'),home=read('astrology-web/index.html');
  for(const path of ['/yijian-web/','/bazi-web/','/ziwei-web/','/astrology-web/'])assert.ok(root.includes(`href="${path}"`),path);
  assert.ok(intro.includes('href="/astrology-web/"'));
  assert.ok(home.includes('FAQPage'));
  assert.ok(home.includes('需要登入或付費嗎？'));
  assert.ok(home.includes('https://mm7382.github.io/astrology-web/'));
  assert.ok(read('llms.txt').includes('astrology-web/llms.txt'));
  assert.ok(read('astrology-web/llms.txt').includes('36 approved bilingual lessons'));
});
