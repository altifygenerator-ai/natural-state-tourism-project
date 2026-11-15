# Natural State automated business outreach — deployment and tests

## Database and queue
Already applied Supabase migration: nstp_safe_outreach_reservations_and_suppression, in the Natural State account GlenwoodEvents database qsoivlvczeellqbygptg.
New tables nstp_suppression (persistent opt-out/bounce/complaint) and nstp_campaign_receipts (one invite per email per campaign), both RLS enabled and with no anon/authenticated grants.
Database RPC nstp_reserve_outreach performs atomic row selection with locking and a cap of 5 per execution and 15 total reserved per UTC day. It is executable only by service_role.

## Environment variables on the EXISTING Vercel project for naturalstatetourismproject.org
- NSTP_SUPABASE_URL=https://qsoivlvczeellqbygptg.supabase.co
- NSTP_SUPABASE_SECRET_KEY: server-only Supabase service-role or secret key
- NSTP_TOKEN_SECRET: persistent random high-entropy signing key
- NSTP_ADMIN_KEY: private random administrator key, at least 24 characters
- RESEND_API_KEY: valid Resend credential
- NSTP_MAIL_FROM: branded sender address on a VERIFIED domain
- RESEND_WEBHOOK_SECRET: signed webhook secret beginning whsec_
- NSTP_POSTAL_ADDRESS: real, legally valid physical mailing address/registered PO Box or PMB
- CRON_SECRET: Vercel Cron authentication secret
- NSTP_TEST_EMAIL: address you control for test sends
- NSTP_AUTO_APPROVE_ROLE_CONTACTS=true: optional; defaults to true for same-domain role inboxes with valid MX; personal and third-party addresses need review
- NSTP_RESEARCH_ENABLED=false: turn on only after testing website research
- NSTP_OUTREACH_ENABLED=false: production kill switch, leave off until sender and unsubscribe are tested

## Automated pipeline
At 14:00 UTC Vercel Cron researches up to five due business websites. Fetches are limited in duration/size, with DNS IP pinning, same-domain redirects and basic robots.txt checks.
Only publicly listed emails on the website are candidates. Same-domain role inboxes (info, bookings, etc.) with MX validation can be queued automatically; others remain in human review.
Once sending is explicitly enabled, the sender uses service-role-only atomic database reservations, provider idempotency keys, HTML branded invites with optional paid offers and a permanent opt-out footer.
One-click List-Unsubscribe headers are supported. Webhook receives signed Resend delivery, delay, bounce, complaint, suppression and failure events. Bounced/complaining addresses are blocked network-wide.
An unknown provider outcome is marked failed/uncertain, without automatic retry.

## Administrator interface
- /manage-businesses: authenticate using the secret admin key
- Research next five businesses now; research never sends emails
- Review questionable addresses, suppress contacts, inspect queued and delivered counts
- Send controlled test ONLY to NSTP_TEST_EMAIL
- Send up to five approved invitations manually only when NSTP_OUTREACH_ENABLED=true

## Launch gates
1. Confirm the existing production Vercel team/project is connected, configured, and serving the intended domain.
2. Set secrets on Vercel server side; never use NEXT_PUBLIC for private values.
3. Verify mail domain SPF/DKIM/DMARC and real postal address; test rendering with the controlled inbox.
4. Register a verified Resend webhook to /api/directory/webhooks/resend for sent/delivered/delayed/bounced/complained/suppressed/failed; reject unsigned tests.
5. Test claim/verification/owner edit and admin moderation end to end.
6. Confirm both form and RFC 8058 one-click unsubscribe prevent future sends across all five cities.
7. Research a small sample; review source evidence and deliverability. Enable research only after tests; enable outreach last.
8. Watch bounce and complaint rates, pause immediately on degradation.

## Known separate task
Static business-listing data in the five city sites is not yet switched to the new shared public feed; owner edits are visible in the central directory but do not automatically rewrite old static city pages.
Deployment was not performed while the connected Vercel account returned no project access.