# Natural State Tourism Project maintenance pass — 2026-09-20

Drop-in overlay for `altifygenerator-ai/natural-state-tourism-project` (`master`).

## Current Git / live-site findings
- The live non-www domain redirects to `https://www.naturalstatetourismproject.org/`.
- Git still used the non-www host for `metadataBase`, canonical URLs, sitemap, robots, structured data, and network links.
- The sitemap used `new Date()` for every route, making unchanged pages appear freshly modified on every request.
- Expansion copy still described an older speculative rollout path instead of the current five-guide network priorities.
- Current advertising pricing already matches the intended Basic / Featured / Spotlight structure, so it was left unchanged.

## Changes in this overlay
- Standardize the Natural State canonical host to `www.naturalstatetourismproject.org`.
- Update metadata base, canonical, Open Graph URL, robots host, and sitemap host to the live www domain.
- Replace sitemap `new Date()` values with a stable September 20, 2026 review date.
- Standardize all five town-guide links to their www hosts.
- Standardize the Hometown Web Services footer URL to `www.hometownwebservicesar.com`.
- Replace speculative expansion-roadmap language with current priorities centered on maintaining and deepening the five active guides.
- Refresh network descriptions to better match the current content of each guide.
- Tighten Organization structured data so it describes the network without incorrectly treating the town sites as `sameAs` identities.
