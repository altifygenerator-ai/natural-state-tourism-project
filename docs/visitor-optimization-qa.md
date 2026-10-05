# Network hub visitor optimization — 2026-10-05

Source: 9a8fb44. Homepage/network snippets now describe the five active local guides. A forest/gold/cream chooser connects visitor interests directly to existing Caddo, Bathhouse Row, crystal, diamond and quiet Amity guides. Original network cards, mission, advertising and expansion content remain in place. No guide is reskinned.

Responsive QA found long contact addresses overflowing narrow/tablet cards and no mobile navigation control. Scoped contact styles allow wrapping, a small mobile disclosure exposes existing routes, and the header uses the existing intended scrolled background class. Menu keyboard activation, Escape/focus return and route closing pass. Pricing/contact submission logic is unchanged.

Verification:
- Production build and `tsc --noEmit`: pass.
- Full lint: 2 existing image warnings, matching untouched source; no errors or new findings.
- 4 routes × 1440, 1280, 768, 360 and 390px = 20 production browser checks: HTTP 200, no overflow, missing jump targets or uncaught runtime errors.
- All 5 discovered internal destinations return successfully. Destination chooser links point to routes verified in the local guide checkouts. Home/network, advertising, contact, footer and mobile menu inspected.
- Native links have visible keyboard focus and at least 44px targets. No maps, dependencies, AI/backend, URL/canonical changes or new SEO pages.
- Local preview-only email credentials were used; no live messages/submissions were sent. Local analytics/remote resources can fail in this environment. Verify production-backed delivery and remote assets before release.

Audit, rollout, measurement guidance and city verification summaries are in the other documents in this directory and in each guide's matching docs.
