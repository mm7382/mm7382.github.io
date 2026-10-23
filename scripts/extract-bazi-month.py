"""Freeze approved bilingual monthly prose from the native Swift source."""
import hashlib
import json
import re
from pathlib import Path

source = Path('/Users/michaelchuang/Documents/遊戲/FortuneWidget/ios/App/MonthlyReport.swift')
text = source.read_text()
quoted = re.compile(r'"((?:\\.|[^"\\])*)"')

def strings(value):
    return [json.loads('"' + match.group(1) + '"') for match in quoted.finditer(value)]

def tables(part):
    region = text[text.index('static func ' + part):]
    first = region.index('let zh:')
    second = region.index('let en:')
    end = region.index('return (language ==', second)
    return region[first:second], region[second:end]

def parse_meaning(block):
    return {key: value for key, value in re.findall(r'"(\w+)":\s*"((?:\\.|[^"\\])*)"', block)}

def parse_practices(block):
    result = {}
    for key, body in re.findall(r'"(\w+)":\s*\[(.*?)\]', block, re.S):
        result[key] = strings(body)
    return result

meaning_zh, meaning_en = tables('meaning(')
practices_zh, practices_en = tables('practices(')
copy = {
    'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'meaning': {'zh': parse_meaning(meaning_zh), 'en': parse_meaning(meaning_en)},
    'practices': {'zh': parse_practices(practices_zh), 'en': parse_practices(practices_en)},
}
assert len(copy['meaning']['zh']) == len(copy['meaning']['en']) == 10
assert len(copy['practices']['zh']) == len(copy['practices']['en']) == 5
assert all(len(v) == 3 for table in copy['practices'].values() for v in table.values())
target = Path(__file__).resolve().parents[1] / 'bazi-web' / 'month-copy.mjs'
target.write_text('// Generated from the native MonthlyReport.swift; edit the source extractor.\n'
                  'export const MONTH_COPY = ' + json.dumps(copy, ensure_ascii=False, indent=2) + ';\n')
