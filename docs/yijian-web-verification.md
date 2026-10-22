# YiJian web preview verification — 2026-10-22

Integration branch: codex/yijian-free-web
Review base: f42fc0798f317816e3905c4b32fd402258656655
Spec: docs/yijian-web-batch.md
Native source baseline: YiJianApp 52fe551aca1bf7e42d2f25f8a0873bbc34a1a5af (read only).

## Ticket ledger
1 DONE — entry + static complete reading, desktop/mobile checked.
2 DONE — 64 hexagrams + 64 reading essays; all source text parity and independent URLs checked.
3 DONE — casting engine all 4096 cases identical to compiled unmodified native Swift; live coin/manual/invalid/Qian special cases verified in Chromium.
4 DONE — 8 lessons; 29 quiz/activity question groups each wrong+right choices checked against source explanations; six interaction families tested; keyboard toggle, progress save/reload verified.
5 DONE — browser persistence, history reopen, cancel/confirm clear, reload, unrelated-storage isolation, malformed-record recovery verified. Blocked-storage fresh browser still renders Kun special reading and failure notice. Transient failure recovery regression passes. Latest100 cap disclosed.
6 DONE — 77 generated HTML pages; metadata/canonical/schema/internal links/sitemap audit passes. Root portfolio offers web tool and retains App intro. Records route noindex and omitted from sitemap. Google/ChatGPT/Perplexity readiness documented; no live indexing claim.
7 PENDING Michael preview approval. No push/deploy, no external submissions or analytics installation.

## Executed checks
- python3 build.py — clean reproducible build; no diff afterwards.
- node --test tests/*.test.mjs — 6 tests pass, including exhaustive native oracle.
- python3 tests/public-audit.py — 77 pages, 64 full hexagrams + essays, eight lessons including quiz/answer text; all pass.
- python3 tests/web-pages.py — two source-page tests pass.
- All four resource JSON copies byte-identical to native source.
- Chromium through Playwright CLI session yijian-preview, viewport 390x844 and 1440x1000. No horizontal overflow in all lessons/casting/home; no application page errors. Initial favicon404 fixed and subsequent navigation clean.
- JavaScript disabled: hexagram64 readable, lesson8 answers expandable without scripts.
- Desktop and mobile screenshots visually inspected (two total).
- No iOS code edited; native oracle compiled as small macOS CLI without simulator, not xcodebuild test.

## Two-axis review
### Standards
Reviewed handwritten generator/engine/storage/browser UI and root build delta; generated pages checked through source parity audit. Fixed stale storage errors persisting after successful reads, explicit accessible names on select controls, and preview links to separate project sites. Escaping is used for content and record values; activity JSON escapes `<`; personal readings are absent from URLs and requests. Remaining long HTML expressions are a maintainability tradeoff, not a blocking defect.
### Spec
First six tickets meet approved behavior. Original native project and other App implementations untouched. Root web tool uses /yijian-web/ to avoid shadowing existing separately hosted /yijian/. Publish gate remains intact. Search visibility readiness is complete but actual collection/ranking/referrals can only be checked after publication. Saved readings currently recompute from stored six values/topic and bundled content; no cross-device promise.

## Known limits
Initial web UI is Traditional Chinese; original multilingual source is preserved. Local browser storage can be removed by browser/user. Preview URL works on this Mac only. Other project links use live absolute URLs. No authentication, payments, backend, tracking or live AI inference was introduced.
