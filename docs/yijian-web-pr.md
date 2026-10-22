## Summary
Visitors can use YiJian without downloading or paying: 64 readings, eight interactive lessons and coin casting. Public content is rendered as static HTML for browsing and discovery; personal progress/history stays in the browser.

Portfolio → YiJian web → Read / Learn / Cast → Browser-local history

## Evidence
- Before: portfolio linked only to native App introduction; parity test failed because web engine was absent.
- After: 77 pages audited; all 4096 original Swift casts match; eight lessons and29 question groups exercised in Chromium; persistence, clearing, corruption, unavailable storage and no-JS content verified.
- Reproducible build, six Node tests, two page tests and static source-parity audit pass. See yijian-web-verification.md.

## Merge Danger
**Door:** two-way
Local-only preview; publication requires Michael approval.

**Blast Radius:** website
Adds /yijian-web, one portfolio entry and sitemap/navigation metadata. Native App and separate /yijian project are preserved. Search inclusion is not guaranteed. No remote PR was created.
