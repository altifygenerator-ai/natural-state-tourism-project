# Network rollout and verification — 2026-10-05

Implemented on existing pages with each guide's own visual system: 34 selected search titles/descriptions; native quick paths and contextual next steps; Glenwood/Mount Ida meal anchors based on listing data; Glenwood planner accessibility/routing; bounded Hot Springs keyboard dropdown; Mount Ida and hub mobile navigation; mobile hero/contact overflow fixes. Murfreesboro strengthens its Crater → after digging → food/supplies/lake/stays/family cluster and names those topics in priority H1s. Amity remains a smaller local chooser and river-day guide.

No new public routes, dependencies, framework upgrades, global CSS changes, fake business facts, maps, AI or backend. Existing content depth, images, typography, containers and card/button treatments remain native. Canonicals, robots, sitemaps, structured data, tracking, bookings and submission/data flows are retained. Only Glenwood/Mount Ida have River View Spotlight routes; the other guides retain smaller direct website ads.

| Site | Production build / TypeScript | Browser checks at five widths | Internal destinations | Full lint baseline |
| --- | --- | ---: | ---: | --- |
| Glenwood | Pass / Pass | 60 | 32 | No script configured |
| Hot Springs | Pass / Pass | 70 | 45 | 2 existing errors, 68 warnings |
| Mount Ida | Pass / Pass | 40 | 34 | 2 existing errors, 31 warnings |
| Murfreesboro | Pass / Pass | 55 | 21 | No script configured |
| Amity | Pass / Pass | 40 | 22 | No script configured |
| Network hub | Pass / Pass | 20 | 5 | 2 existing warnings; no errors |

285 viewport checks cover 1440 desktop, 1280 laptop, 768 tablet, 360 Android and 390 iPhone. All checked routes return 200; no horizontal overflow, missing jump targets or uncaught runtime errors. All 159 discovered internal destinations return successfully (counts are per site, not unique network URLs). All 34 selected titles/descriptions match rendered production output. Keyboard/tap-target checks cover native choosers and mobile menus; new menus support Escape/focus return and close after route selection. The Hot Springs Articles dropdown stays within the laptop viewport when opened by keyboard. Meal anchors clear sticky headers. Glenwood planner weekend, solo and short-visit paths are exercised.

Full lint was compared with untouched source checkouts; file-location-normalized findings are identical. Existing form Date.now purity errors, source image warnings and Glenwood middleware naming deprecation are not introduced by this work. These unrelated areas were left intact.

## Release sequence

Use separate review branches/requests. Release Glenwood as the pilot, then Hot Springs, Mount Ida, Murfreesboro and Amity; coordinate the hub chooser with the city releases. No default branch was changed and no production deployment was performed by this task. Verify the environment-backed preview before merging, especially populated events, remote partner images, submissions/email and unchanged tracking/booking links. Local checks use ignored preview-only credentials and empty event fixtures; no live submissions, emails or database writes were made. Remote image hosts and local analytics endpoints can fail in this execution environment.

## Measure after release

Keep the October 2 exports (September 2–29) as the baseline: 853 clicks / 67,044 impressions across the four exported city properties. No comparable Amity metrics are asserted. Compare each selected page and matching queries over a comparable 28-day window after indexing, with position and device context; do not attribute every change to titles alone or sum overlapping page impression rows as property totals. Prioritize Glenwood's under-clicked page-one pages, Hot Springs shopping/lake dining and Mount Ida food visibility. For Murfreesboro, check indexing, Crater-cluster impressions/position and navigation before diagnosing CTR alone.

Review next-page paths and pages/session with the existing analytics provider where session/funnel data is available. Do not invent engagement baselines. Keep paid placement clicks separate from editorial navigation. Search engines may rewrite snippets; no CTR, traffic or engagement uplift is claimed before post-release evidence.

## Advanced interaction decision

Defer maps, a new network planner and richer filters. Simple links/anchors and the existing Glenwood planner provide the immediate value without additional loading/backend risk. Revisit advanced features only when real visitor behavior and supported listing data demonstrate a useful need.
