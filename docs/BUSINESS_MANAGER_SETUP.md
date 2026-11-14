# Natural State Business Manager

This module adds a shared directory, researched public business contact discovery, reviewed claim links, owner-submitted corrections, an admin dashboard, and an optional daily background process.

## Deployment requirements

The database migration is applied to the Natural State account's GlenwoodEvents Supabase instance and uses separate nstp_* tables. The current city event tables are untouched.

Set the following on the Vercel project that serves naturalstatetourismproject.org:

- NSTP_SUPABASE_URL=https://qsoivlvczeellqbygptg.supabase.co
- NSTP_SUPABASE_SECRET_KEY=(a server-only Supabase secret key, NOT a publishable key)
- NSTP_TOKEN_SECRET=(unique 32-byte random secret, retain it across deployments)
- NSTP_ADMIN_KEY=(unique random password/key at least 24 characters)
- RESEND_API_KEY=(existing verified-domain Resend credential)
- RESEND_WEBHOOK_SECRET=(Resend signing secret, beginning whsec_)
- NSTP_MAIL_FROM=(verified From identity, such as Natural State Tourism <businesses@your-verified-domain>)
- NSTP_POSTAL_ADDRESS=(real physical mailing address or registered PO Box/PMB, required for promotional outreach)
- CRON_SECRET=(Vercel's cron authorization secret)
- NSTP_RESEARCH_ENABLED=false (set true only after review)
- NSTP_OUTREACH_ENABLED=false (set true only after testing send and unsubscribe; default is OFF)

Never expose admin, token, or database secret keys with NEXT_PUBLIC_.

## Routes

- /businesses: public directory of imported businesses.
- /claim/[business-id]: free claim request. Already approved business contacts receive an emailed, single-use 24-hour link. Unknown addresses become manual-review requests instead; they do not automatically gain access.
- /owner: 7-day, signed, HttpOnly owner session, submits edits for review.
- /manage-businesses: private dashboard; requires the NSTP_ADMIN_KEY.
- /unsubscribe?c=...&s=...: opt-out page, suppresses matching email across all businesses.
- /api/directory/public?city=Glenwood: read-only public business record feed for city guides.
- /api/cron/nstp-directory: authenticated daily cron; researches up to 5 websites and sends up to 5 invitations if explicitly enabled and configured.

## Safe launch checklist

1. Configure the production Supabase secret, token secret, and admin key.
2. Confirm directory page lists the imported businesses and public APIs expose NO contacts/emails.
3. Configure a real verified Resend sender and business mailing address. Never invent a mailing address.
4. Use a test business / controlled address to run claim -> verify -> owner submit -> admin approval -> public listing refresh.
5. Confirm malformed token and unauthorized admin or owner requests are rejected.
6. Confirm unsubscribe suppresses every matching contact and cancels queued sends.
7. Check discovered email addresses manually before approving.
8. Turn on research only when ready; leave outreach disabled until the sender, verification workflow, and suppression test pass.
9. Register a signed Resend webhook at /api/directory/webhooks/resend for email.bounced, email.complained, and email.suppressed; confirm a test event is accepted and invalid signatures are rejected before sending.
10. Integrate the public feed into the city-site renderers so approved owner changes appear on city guide cards; until then, the central directory has the updated record but older city pages continue to render their local hardcoded data.

**Important:** This module does not yet auto-publish changes to the individual static city repositories. The central feed is supplied for that integration.
