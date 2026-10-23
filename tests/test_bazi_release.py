from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]

class Links(HTMLParser):
    def __init__(self):
        super().__init__();self.urls=[]
    def handle_starttag(self,tag,attrs):
        if tag not in ('a','script','link'):return
        data=dict(attrs);value=data.get('href') or data.get('src')
        if value:self.urls.append(value)

class BaziRelease(unittest.TestCase):
    def test_public_entry_and_intro_are_discoverable(self):
        entry=(ROOT/'bazi-web/index.html').read_text()
        self.assertIn('https://mm7382.github.io/bazi-web/',entry)
        self.assertIn('FAQPage',entry)
        self.assertNotIn('noindex',entry)
        self.assertIn('/bazi-web/',(ROOT/'index.html').read_text())
        self.assertIn('/bazi-web/',(ROOT/'bazi/index.html').read_text())
        self.assertIn('https://mm7382.github.io/bazi-web/',(ROOT/'llms.txt').read_text())

    def test_internal_bazi_links_and_local_assets_resolve(self):
        for page in (ROOT/'bazi-web').rglob('index.html'):
            links=Links();links.feed(page.read_text())
            for value in links.urls:
                path=value.split('#',1)[0].split('?',1)[0]
                if not path or path.startswith(('http://','https://','mailto:')):continue
                target=(ROOT/path.lstrip('/')) if path.startswith('/') else page.parent/path
                self.assertTrue(target.exists(),(str(page.relative_to(ROOT)),value))

if __name__=='__main__':unittest.main()
