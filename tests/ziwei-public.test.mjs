import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
const origin='https://mm7382.github.io';
const ids=[...Array.from({length:24},(_,i)=>`L${String(i+1).padStart(2,'0')}`),...Array.from({length:12},(_,i)=>`W${String(i+1).padStart(2,'0')}`)];
const publicPaths=['/ziwei-web/','/ziwei-web/learn/','/ziwei-web/learn/en/',...ids.flatMap(id=>[`/ziwei-web/learn/${id}/`,`/ziwei-web/learn/${id}/en/`])];

test('Ziwei public pages are crawlable, canonical and named without the private Chinese name',()=>{
  assert.equal(publicPaths.length,75);
  const sitemap=read('sitemap.xml');
  for(const path of publicPaths){
    const html=read(`${path.slice(1)}index.html`);
    assert.doesNotMatch(html,/noindex/i,path);
    assert.match(html,new RegExp(`<link rel="canonical" href="${origin}${path}"`),path);
    assert.match(sitemap,new RegExp(`<loc>${origin}${path}</loc>`),path);
    assert.doesNotMatch(html,/Wei Chun Chuang|莊惟鈞/u,path);
  }
});

test('private learning records are not advertised and remain unindexed',()=>{
  const review=read('ziwei-web/learn/review/index.html');
  assert.match(review,/noindex, nofollow/);
  assert.doesNotMatch(read('sitemap.xml'),/ziwei-web\/learn\/review\//);
});

test('public Ziwei pages have no broken same-site links or assets',()=>{
  for(const path of publicPaths){
    const html=read(`${path.slice(1)}index.html`);
    for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      if(href.startsWith('https:')||href.startsWith('mailto:')||href.startsWith('#'))continue;
      const target=new URL(href,`${origin}${path}`).pathname;
      const file=join(root,decodeURIComponent(target).slice(1),target.endsWith('/')?'index.html':'');
      assert.ok(existsSync(file),`${path} → ${href}`);
    }
  }
});

test('landing page explains free access, uncertain time, browser privacy and licensing',()=>{
  const html=read('ziwei-web/index.html');
  for(const text of ['application/ld+json','FAQPage','免費','午時暫定','這個瀏覽器','THIRD_PARTY_NOTICES.txt'])assert.ok(html.includes(text),text);
});
