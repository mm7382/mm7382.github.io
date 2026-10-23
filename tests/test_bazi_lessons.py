import hashlib
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from bazi_figures import FIGURES
LEARN = ROOT / 'bazi-web' / 'learn'
SOURCE = LEARN / 'course-source.json'
SOURCE_HASH = '946329454ccf166480995970a7a85da2a3ae8ab1ddd85aebcc4d26bf7baa4e52'


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.in_script = True

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False

    def handle_data(self, data):
        if not self.in_script:
            self.text.append(data)


class BaziLessons(unittest.TestCase):
    def test_all_source_content_has_independent_crawlable_bilingual_pages(self):
        self.assertEqual(hashlib.sha256(SOURCE.read_bytes()).hexdigest(), SOURCE_HASH)
        catalog = json.loads(SOURCE.read_text())
        self.assertEqual(len(catalog['lessons']), 20)
        self.assertEqual(len(catalog['sources']), 9)
        self.assertEqual([x['id'] for x in catalog['lessons'][:3]], ['F01', 'F02', 'F03'])
        for lesson in catalog['lessons']:
            for lang, suffix in [('zh', ''), ('en', 'en/')]:
                page = LEARN / lesson['id'] / suffix / 'index.html'
                self.assertTrue(page.exists(), str(page))
                html = page.read_text()
                parser = VisibleText()
                parser.feed(html)
                text = ' '.join(parser.text)
                self.assertIn(f'lang="{"zh-Hant" if lang == "zh" else "en"}"', html)
                self.assertIn('noindex', html)  # B5 removes preview gate
                for value in [lesson['title'][lang], lesson['lead'][lang], lesson['close'][lang]]:
                    self.assertIn(value, text, (lesson['id'], lang, value))
                for section in lesson['sections']:
                    self.assertIn(section['title'][lang], text)
                    for paragraph in section['body'][lang]:
                        self.assertIn(paragraph, text, (lesson['id'], lang, paragraph))
                for question in lesson.get('quiz', []):
                    self.assertIn(question['question'][lang], text)
                    self.assertIn(question['explain'][lang], text)
                    for option in question['options']:
                        self.assertIn(option[lang], text)
                for source_id in lesson['sources']:
                    source = catalog['sources'][source_id]
                    self.assertIn(source['title'][lang], text)
                    self.assertIn(source['note'][lang], text)
                self.assertIn('data-figure="' + lesson['figure'] + '"', html)
                figure = FIGURES[lesson['figure']]
                self.assertIn(figure['title'][0 if lang == 'zh' else 1], text)
                for row in figure.get('rows', []):
                    self.assertIn(row[0 if lang == 'zh' else 1], text)
                    if row[2 if lang == 'zh' else 3]:
                        self.assertIn(row[2 if lang == 'zh' else 3], text)
                self.assertNotIn('Subscribe to read', html)
                self.assertNotIn('訂閱進階課', html)

    def test_index_and_review_entry_exist_in_both_languages(self):
        for suffix in ['', 'en/']:
            index = (LEARN / suffix / 'index.html').read_text()
            review = (LEARN / 'review' / suffix / 'index.html').read_text()
            for lesson_id in ['F01', 'P01', 'P17']:
                self.assertIn(lesson_id, index)
            self.assertIn('review', index)
            self.assertIn('learn.mjs', review)
            other = '/bazi-web/learn/review/' + ('' if suffix else 'en/')
            self.assertIn(f'href="{other}" hreflang=', review)


if __name__ == '__main__':
    unittest.main()
