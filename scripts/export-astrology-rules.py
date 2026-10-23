"""Export only already-approved original App rules for the free web reader."""
import json
import sys
from pathlib import Path

source = Path(sys.argv[1]) / 'App/Resources/Rules'
target = Path(__file__).resolve().parents[1] / 'astrology-web/assets/rules-v1.json'
names = ['rules-trial-v1', 'rules-batch-a-v1', 'rules-batch-b-v1', 'rules-batch-c-v1']
rules = []
seen = set()
blocked = 0
for name in names:
    data = json.loads((source / f'{name}.json').read_text())
    assert data['orbPolicy'] == 'orb-v1', name
    for rule in data['rules']:
        assert rule['id'] not in seen, rule['id']
        seen.add(rule['id'])
        if rule['status'] != 'approved':
            blocked += 1
            continue
        assert rule['source']['url'].startswith('https://archive.org/'), rule['id']
        assert rule['source']['rightsEvidence'], rule['id']
        assert all(rule['copy'][lang]['title'] and rule['copy'][lang]['body'] for lang in ('zh-Hant', 'en'))
        rules.append(rule)
fallbacks = json.loads((source / 'fallbacks-v1.json').read_text())
assert len(rules) == 103 and blocked == 5
assert {entry['domain'] for entry in fallbacks['entries']} == {'theme', 'work', 'love', 'money'}
target.write_text(json.dumps({'bundleVersion':'rules-v1.0', 'orbPolicy':'orb-v1',
                              'rules':rules, 'fallbacks':fallbacks}, ensure_ascii=False, separators=(',', ':'))+'\n')
print(f'Exported {len(rules)} approved rules; excluded {blocked} source-blocked rules.')
