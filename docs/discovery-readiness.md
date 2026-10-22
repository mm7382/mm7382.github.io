# Search discovery readiness (2026-10-22)

Scope: Google Search/Google AI search, ChatGPT search, Perplexity. Local readiness only; no submissions or live indexing claim.

- Google: crawl access + indexable visible text + meaningful internal links + accurate metadata; AI features need ordinary search eligibility, not a special AI schema. https://developers.google.com/search/docs/appearance/ai-features
- ChatGPT search: allow OAI-SearchBot for search discovery; distinguish search crawling from GPTBot training control. Existing root robots already allows OAI-SearchBot. https://developers.openai.com/api/docs/bots
- Perplexity: existing root robots allows PerplexityBot (search discovery crawler). https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- Existing root robots is preserved rather than widening permissions. llms.txt is supplemental site navigation, not a Google indexing requirement or ranking promise.
- Generated public routes should return HTML with core content even without JS, have canonical URLs, accurate social metadata and visible author/free claims, and be reachable from root portfolio and sitemap.
- Browser-local cast history/progress must not appear in public URLs, generated pages or sitemaps. No analytics payload may include readings or personal inputs.

## Publication gate
Ticket 7 is pending Michael preview approval. After approval verify public routes, sitemap and robots as served. Then use existing owner Search Console/Bing access if authorized to submit/inspect. Distinguish submitted, indexed, impressions, clicks and referrals; no guaranteed ranking or AI recommendations. No automated recurrent monitoring added.

## UI audit reference
https://vercel.com/design/guidelines — semantic controls/labels, visible focus, keyboard interaction, touch targets, restrained motion, no horizontal overflow, meaningful error/empty states. Applied to browser checks, not a native-app design prescription.
