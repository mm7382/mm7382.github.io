import unittest, json, html
from pathlib import Path
class Pages(unittest.TestCase):
 def test_first_reading_has_source_and_independent_route(self):
  page=Path('yijian-web/hexagrams/1/index.html').read_text()
  self.assertIn('潛龍勿用',page)
  self.assertIn('canonical',page)
  self.assertIn('六爻全陽',page)
  self.assertIn('/yijian-web/hexagrams/1/',Path('yijian-web/index.html').read_text())
 def test_every_hexagram_preserves_chinese_source(self):
  data=Path('yijian-web/assets/data')
  hs=json.loads((data/'hexagrams.json').read_text())['hexagrams']
  rs=json.loads((data/'hexagram-readings.json').read_text())['readings']
  for h,r in zip(hs,rs):
   text=html.unescape(Path(f"yijian-web/hexagrams/{h['number']}/index.html").read_text())
   for value in [h['originalJudgment'],h['plainLanguage'],r['structure']['zh-Hant'],r['plain']['zh-Hant'],r['example']['zh-Hant']]+[l['original'] for l in h['lines']]:
    for paragraph in value.split('\n\n'): self.assertIn(paragraph,text)
if __name__=='__main__': unittest.main()
