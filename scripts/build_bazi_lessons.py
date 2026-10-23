"""Render the frozen native BaziCourses catalog as crawlable bilingual HTML.

The source text is copied unchanged; only navigation and learning controls are new.
"""
import html
import json
from pathlib import Path
from urllib.parse import urlparse

from bazi_figures import FIGURES

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'bazi-web' / 'learn'
CATALOG = json.loads((OUT / 'course-source.json').read_text())
LESSONS = CATALOG['lessons']


def e(value):
    return html.escape(str(value), quote=True)


def lang_url(lesson_id, lang):
    return f'/bazi-web/learn/{lesson_id}/' + ('en/' if lang == 'en' else '')


def shell(lang, title, body, *, lesson_id=None, page='index'):
    english = lang == 'en'
    alternate = 'zh' if english else 'en'
    translated = lang_url(lesson_id, alternate) if lesson_id else '/bazi-web/learn/' + ('review/' if page == 'review' else '') + ('en/' if alternate == 'en' else '')
    id_attr = f' data-lesson-id="{e(lesson_id)}"' if lesson_id else ''
    lead = 'All 20 existing lessons, free to read.' if english else '原 App 的 20 堂課，全部免費閱讀。'
    return f'''<!doctype html>
<html lang="{'en' if english else 'zh-Hant'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>{e(title)}｜{'Shilai Bazi' if english else '時來八字'}</title>
<meta name="description" content="{e(lead)}"><link rel="icon" href="/bazi/icon.png">
<link rel="stylesheet" href="/bazi-web/learn/style.css"><script type="module" src="/bazi-web/learn/learn.mjs"></script>
</head><body data-page="{e(page)}"{id_attr} data-language="{lang}">
<a class="skip" href="#main">{'Skip to content' if english else '跳到主要內容'}</a>
<div class="topline"><span>MICHAEL · SHILAI BAZI</span><span>LEARNING GALLERY / 20 LESSONS</span></div>
<header class="masthead wrap"><a class="brand" href="/bazi-web/learn/{'en/' if english else ''}">{'時來 · Bazi' if english else '時來 · 八字'}<small>THE FOUR PILLARS</small></a>
<nav aria-label="{'Main navigation' if english else '主要導覽'}"><a href="/bazi-web/">{'My chart' if english else '我的命盤'}</a><a href="/bazi-web/learn/{'en/' if english else ''}">{'All lessons' if english else '全部課程'}</a><a href="/bazi-web/learn/review/{'en/' if english else ''}">{'Review' if english else '複習'}</a><a href="{translated}" hreflang="{'zh-Hant' if english else 'en'}">{'繁體中文' if english else 'English'}</a></nav></header>
<main id="main">{body}</main><footer><div class="wrap">MICHAEL · {'Free to learn · Your notes stay in this browser' if english else '免費學習 · 筆記只留在這個瀏覽器'}<a href="/">{'Back to the gallery' if english else '回作品總覽'} ↗</a></div></footer>
<p id="storage-warning" class="storage-warning" role="alert" hidden></p>
</body></html>'''


def figure_html(kind, lang):
    data = FIGURES[kind]
    index = 1 if lang == 'en' else 0
    title = data['title'][index]
    result = [f'<figure class="course-figure" data-figure="{e(kind)}"><figcaption>{e(title)}</figcaption>']
    if 'pillars' in data:
        names = ['Year','Month','Day','Hour'] if lang == 'en' else ['年柱','月柱','日柱','時柱']
        result.append('<div class="figure-pillars">')
        for name, value in zip(names, data['pillars']):
            shown = '—' if value == '—' else f'<span>{e(value[0])}</span><span>{e(value[1])}</span>'
            result.append(f'<div><small>{e(name)}</small><strong aria-label="{e(name + " " + value)}">{shown}</strong></div>')
        result.append('</div>')
    if 'rows' in data:
        result.append('<div class="figure-rows">')
        for zh_label, en_label, zh_value, en_value in data['rows']:
            label, value = (en_label, en_value) if lang == 'en' else (zh_label, zh_value)
            result.append(f'<div class="figure-row"><strong>{e(label)}</strong>' + (f'<span>{e(value)}</span>' if value else '') + '</div>')
        result.append('</div>')
    if 'note' in data:
        result.append(f'<p class="figure-note">{e(data["note"][index])}</p>')
    result.append('</figure>')
    return ''.join(result)


def source_html(source_id, lang):
    source = CATALOG['sources'][source_id]
    title, note = source['title'][lang], source['note'][lang]
    url = source.get('url')
    valid = url and urlparse(url).scheme in ('http','https')
    label = f'<a href="{e(url)}" rel="noopener noreferrer">{e(title)}</a>' if valid else e(title)
    return f'<li data-source-id="{e(source_id)}"><strong>{label}</strong><span>{e(note)}</span></li>'


def quiz_html(question, lang):
    options = ''.join(f'<button type="button" data-option="{index}">{e(value[lang])}</button>' for index, value in enumerate(question['options']))
    return f'''<div class="quiz-question" data-question-id="{e(question['id'])}" data-answer="{question['answer']}">
<h4>{e(question['question'][lang])}</h4><div class="quiz-options">{options}</div>
<p class="quiz-answer" hidden>{e(question['explain'][lang])}</p></div>'''


def lesson_page(lesson, lang, index):
    english = lang == 'en'
    lesson_id = lesson['id']
    sections = []
    for number, section in enumerate(lesson['sections'], 1):
        paragraphs = ''.join(f'<p>{e(paragraph)}</p>' for paragraph in section['body'][lang])
        sections.append(f'<section class="lesson-section"><div class="section-number">{number:02d}</div><div><h2>{e(section["title"][lang])}</h2>{paragraphs}</div></section>')
    quiz = ''.join(quiz_html(q, lang) for q in lesson.get('quiz', []))
    sources = ''.join(source_html(source_id, lang) for source_id in lesson['sources'])
    previous = LESSONS[index-1]['id'] if index else None
    following = LESSONS[index+1]['id'] if index+1 < len(LESSONS) else None
    adjacent = '<nav class="adjacent">' + (f'<a href="{lang_url(previous,lang)}">← {"Previous lesson" if english else "上一堂"}</a>' if previous else '<span></span>') + (f'<a href="{lang_url(following,lang)}">{"Next lesson" if english else "下一堂"} →</a>' if following else '<span></span>') + '</nav>'
    study = f'''<section class="study-panel" aria-labelledby="study-heading"><p class="eyebrow">YOUR STUDY / {e(lesson_id)}</p><h2 id="study-heading">{'Make this lesson yours' if english else '把這堂課，寫成自己的話。'}</h2>
<p>{'You can learn without a birth chart. If you want to compare, open your chart in another tab; this gallery does not save birth details yet.' if english else '沒有自己的命盤，也可以先讀完這堂。想對照時，另開排盤頁；目前課程不會儲存出生資料。'}</p>
<a href="/bazi-web/#birth-form" target="_blank" rel="noopener">{'Open my chart' if english else '開啟我的命盤'} ↗</a>
<label for="my-note">{'My research note' if english else '我的研究筆記'}</label><textarea id="my-note" rows="7" placeholder="{'A character, a connection, or a question…' if english else '看到哪個字、哪個關係，或有什麼疑問……'}"></textarea>
<p id="note-status" class="micro" aria-live="polite"></p>
<div class="study-actions"><button type="button" id="mark-read">{'Mark as read' if english else '標記為已讀'}</button>
<label>{'Revisit in' if english else '安排複習'}<select id="review-days"><option value="">{'Choose a day' if english else '選擇天數'}</option><option value="3">{'3 days' if english else '3 天後'}</option><option value="7">{'7 days' if english else '7 天後'}</option><option value="30">{'30 days' if english else '30 天後'}</option><option value="clear">{'Remove review date' if english else '取消複習安排'}</option></select></label></div>
<p id="review-status" class="micro" aria-live="polite"></p></section>'''
    body = f'''<article class="lesson wrap"><div class="lesson-hero"><p class="eyebrow">LESSON {e(lesson_id)} / {index+1:02d} OF {len(LESSONS)}</p><h1>{e(lesson['title'][lang])}</h1><p class="lead">{e(lesson['lead'][lang])}</p><p class="micro">{'Original app lesson · freely available here' if english else '原 App 教材 · 網頁版免費開放'}</p></div>
<div class="reader"><div class="content">{figure_html(lesson['figure'],lang)}{''.join(sections)}<blockquote>{e(lesson['close'][lang])}</blockquote>
<section class="quiz" aria-labelledby="quiz-heading"><p class="eyebrow">CHECK YOURSELF</p><h2 id="quiz-heading">{'Try the lesson questions' if english else '讀完，練習看看。'}</h2><p class="micro">{'No score. An incorrect first answer enters your review book.' if english else '不計分；第一次答錯的題目會進複習本。'}</p>{quiz}</section>
<section class="sources"><h2>{'Sources and further reading' if english else '本堂來源與閱讀線索'}</h2><ul>{sources}</ul></section>{study}{adjacent}</div>
<aside class="reader-aside"><span>STUDY THE DETAILS</span><p>{'This is a teaching diagram, not your personal result.' if english else '圖解是教學示意，不是你的個人結果。'}</p><a href="/bazi-web/learn/{'en/' if english else ''}">{'All lessons' if english else '課程總覽'} ↗</a></aside></div></article>'''
    return shell(lang, lesson['title'][lang], body, lesson_id=lesson_id, page='lesson')


def index_page(lang):
    english = lang == 'en'
    rows = []
    for number, lesson in enumerate(LESSONS, 1):
        rows.append(f'<li data-lesson-id="{e(lesson["id"])}"><a href="{lang_url(lesson["id"],lang)}"><small>{number:02d} · {e(lesson["id"])}</small><strong>{e(lesson["title"][lang])}</strong><span>{e(lesson["lead"][lang])}</span></a><b aria-label="{e("Read" if english else "已讀")}" hidden>✓</b></li>')
    body = f'''<section class="index-hero wrap"><p class="eyebrow">THE BAZI LEARNING GALLERY</p><h1>{'Twenty lessons.<br>One chart at a time.' if english else '二十堂課，<br>一柱一柱讀懂。'}</h1><p>{'All original lessons are open. Start anywhere; you do not need a birth chart to read.' if english else '原 App 的二十堂教材都在這裡，免費閱讀。從哪一堂開始都可以，不用先排自己的命盤。'}</p><p id="progress-summary" class="progress-summary" aria-live="polite"></p></section>
<section class="index-body wrap"><div class="index-intro"><span class="eyebrow">01—20 / CONTENTS</span><p>{'Read, make a note, and return when you are ready. Your progress stays in this browser.' if english else '讀完、記下疑問，有空再回來。進度與筆記只留在這個瀏覽器。'}</p><a href="/bazi-web/learn/review/{'en/' if english else ''}">{'My notes and review' if english else '我的筆記與複習'} ↗</a></div><ol class="lesson-list">{''.join(rows)}</ol></section>'''
    return shell(lang, 'All 20 lessons' if english else '全部二十堂課', body, page='index')


def review_page(lang):
    english = lang == 'en'
    body = f'''<section class="review-page wrap"><p class="eyebrow">THE REVIEW ROOM</p><h1>{'Make room to revisit.' if english else '留一點時間，再讀一次。'}</h1><p class="lead">{'Your notes, reading record, and questions due today. Wrong answers return after 1, 3, and 7 days.' if english else '這裡整理已讀、筆記和到期題目。答錯的題目會在 1、3、7 天後依序回來。'}</p>
<div class="review-grid"><section><h2>{'Questions due today' if english else '今天可以複習的題目'}</h2><div id="due-questions" aria-live="polite"></div></section><section><h2>{'My lessons and notes' if english else '我的課程與筆記'}</h2><div id="saved-lessons"></div><button type="button" id="export-notes">{'Export my notes' if english else '匯出我的筆記'}</button><p id="export-status" class="micro" aria-live="polite"></p></section></div></section>'''
    return shell(lang, 'Review book' if english else '複習本', body, page='review')


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


if __name__ == '__main__':
    if len(LESSONS) != 20 or len(FIGURES) != 20 or len(CATALOG['sources']) != 9:
        raise SystemExit('Source catalog or figure count changed; inspect the native source before rebuilding.')
    for index, lesson in enumerate(LESSONS):
        if lesson['figure'] not in FIGURES:
            raise SystemExit(f'Missing teaching figure: {lesson["figure"]}')
        for lang in ('zh','en'):
            write(OUT / lesson['id'] / ('en' if lang == 'en' else '') / 'index.html', lesson_page(lesson,lang,index))
    for lang in ('zh','en'):
        write(OUT / ('en' if lang == 'en' else '') / 'index.html', index_page(lang))
        write(OUT / 'review' / ('en' if lang == 'en' else '') / 'index.html', review_page(lang))
    print('Rendered 20 bilingual lessons plus indexes and review rooms.')
