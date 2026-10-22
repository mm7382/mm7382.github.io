# Approved YiJian free web batch (2026-10-22)
Baseline: f42fc0798f317816e3905c4b32fd402258656655
Integration: codex/yijian-free-web. PREVIEW ONLY, no publishing/push.
User approved all 6 implementation tickets; ticket 7 publication needs preview approval.
Canonical deployment target: root mm7382.github.io repo, /yijian-web/ (do not shadow separate /yijian/ project site). Existing portfolio links should visibly offer web tool, preserving App intro link. Do not modify native App or existing untracked site drafts. Current chat supersedes earlier three-free-lessons draft.
## Tickets (sequential shared UI/files)
1 AFK: landing + first full reading, responsive independent URL.
2 AFK depends 1: all 64 hexagrams, all 64 reading essays, six lines, accurate source content, searchable/static HTML crawlable URLs.
3 AFK depends 2: free casting, base/moving/changed, Zhu Xi rule selection and full source explanations/topic guidance. Validate against original Swift engine all 4096 input cases.
4 AFK depends 2,3: all 8 lessons, all original sections/diagrams, activity families and quizzes with accurate feedback; no paywalls.
5 AFK depends 3,4: browser-only progress/history, reload persistence, clear with confirmation, explicit no sync warning, graceful disabled/corrupt storage behavior. No personal data in URLs or public pages.
6 AFK depends 2,3,4: semantic crawlable content, author (Wei Chun Chuang / Michael), free/no login FAQ, canonical/meta/social/structured data, sitemap + hub navigation, Google and AI discovery readiness, no guarantee rankings. No new bulk articles.
7 HITL: preview approval then publish and account-related submission/tracking. NOT AUTHORIZED NOW.
## Design
Preserve existing warm paper + muted cinnabar + ink editorial character, Chinese readable typography, restrained navigation; no giant decorative symbols, stock images, invented testimonials or equal marketing card walls. Mobile and desktop accessible, keyboard/focus/labels/live feedback/reduced motion.
## Sources
/Users/michaelchuang/Documents/遊戲/YiJianApp/Sources/YiJianApp/Resources/{hexagrams.json,hexagram-readings.json,lessons.json}
Native engine under same app Engine/*.swift, full result guidance in Content/TopicGuidance.swift and Views/Result/FullResultAssembler.swift.
## Agreed test seams
Static generated public routes/source parity; public casting results vs Swift oracle; browser end-to-end lessons/casting/history/clear/failure/reload; keyboard + 390px and desktop layouts; link/meta/sitemap/schema validity. Meaningful red-green slices, no native code edits = no iOS build needed.
## Ownership/resources
Single implementer owns generator, /yijian-web assets/generated pages, hub integration, JS unit tests. Coordinator owns tests/native-oracle*, docs ledger/review/evidence, final browser E2E. One local preview server port 8797. No iOS simulator. Serialized lightweight checks.
