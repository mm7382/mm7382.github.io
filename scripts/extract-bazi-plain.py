"""Freeze approved native BaziPlain bilingual prose for the static web reader."""
from pathlib import Path
import json
import re

source = Path('/Users/michaelchuang/Documents/遊戲/FortuneWidget/ios/App/ChartPlainReading.swift').read_text()
target = Path(__file__).resolve().parents[1] / 'bazi-web/plain-copy.mjs'
groups = ('peer', 'output', 'wealth', 'officer', 'resource')


def section(start, end):
    return source.split(start, 1)[1].split(end, 1)[0]


def decode(value):
    return json.loads('"' + value + '"')


def paired_by_phase(block):
    values = {}
    pattern = r'"(wood|fire|earth|metal|water)"\s*:\s*info\.yang\s*\?\s*"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"'
    for phase, yang, yin in re.findall(pattern, block, re.S):
        values[phase] = {'yang': decode(yang), 'yin': decode(yin)}
    assert len(values) == 5, values.keys()
    return values


def nested(block, keys):
    result = {}
    for index, key in enumerate(groups):
        start = block.index('"' + key + '":')
        end = block.find('"' + groups[index + 1] + '":', start) if index < 4 else len(block)
        body = block[start:end]
        result[key] = {}
        for field in keys:
            match = re.search(r'\.' + field + r':\s*"((?:\\.|[^"\\])*)"', body, re.S)
            assert match, (key, field)
            result[key][field] = decode(match.group(1))
    return result


def flat(block, keys):
    result = {}
    for key, value in re.findall(r'"([A-Za-z]+)"\s*:\s*"((?:\\.|[^"\\])*)"', block, re.S):
        result[key] = decode(value)
    assert set(result) == set(keys), (set(result) - set(keys), set(keys) - set(result))
    return result


day = section('static func dayMasterSentence', '/// 這句話套在哪個場合。')
contexts = section('static func groupSentence', '/// 命盤的三個主題。每一段')
themes = section('static func themeParagraphs', '/// 命盤的三個主題。\n')
cycles = section('static func cycleSentence', '/// 大運裡某一個流年的一句話。')
years = section('static func yearSentence', 'static func homeworkSentence')
homework = source.split('static func homeworkSentence', 1)[1]
ten_gods = ('peer','rob','eatingGod','hurtingOfficer','indirectWealth','directWealth','sevenKillings','directOfficer','indirectResource','directResource')

data = {
    'dayMaster': {
        'zh': paired_by_phase(day.split('let zh = [',1)[1].split('let en = [',1)[0]),
        'en': paired_by_phase(day.split('let en = [',1)[1]),
    },
    'contexts': {
        'zh': nested(contexts.split('let zh:',1)[1].split('let en:',1)[0], ('intimacy','work','later')),
        'en': nested(contexts.split('let en:',1)[1], ('intimacy','work','later')),
    },
    'themeTails': {
        'zh': nested(themes.split('let zhTail:',1)[1].split('let enTail:',1)[0], ('personality','love','work')),
        'en': nested(themes.split('let enTail:',1)[1], ('personality','love','work')),
    },
    'cycles': {
        'zh': flat(cycles.split('let zh:',1)[1].split('let en:',1)[0], groups),
        'en': flat(cycles.split('let en:',1)[1], groups),
    },
    'years': {
        'zh': flat(years.split('let zh:',1)[1].split('let en:',1)[0], ten_gods),
        'en': flat(years.split('let en:',1)[1], ten_gods),
    },
    'homework': {
        'zh': flat(homework.split('let zh:',1)[1].split('let en:',1)[0], groups),
        'en': flat(homework.split('let en:',1)[1].split('let table =',1)[0], groups),
    },
}
target.write_text('// Generated from source snapshot ios/App/ChartPlainReading.swift; do not edit prose here.\nexport const PLAIN_COPY = Object.freeze(' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
print(target, 'all bilingual native reading copy frozen')
