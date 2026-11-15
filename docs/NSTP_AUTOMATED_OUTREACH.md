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
## Monthly real business and city traffic reporting

The shared directory now records privacy-conscious, deduplicated business profile views, website clicks, phone-link clicks, and city-guide pageviews after the tracking code goes live. City-site outbound clicks count only when the external destination exactly and uniquely matches a recorded business website. Raw IPs and user-agent strings are not stored in reports.

The owner dashboard displays the last 30 days and completed months. Reports separate clicks to a business from overall city-guide pageviews, which are NOT necessarily exposures for the individual business. Historical Vercel pageviews are not imported as direct referrals. Counters do not establish unique visitors, leads, reservations or sales.

Monthly database snapshots are created by the existing daily cron on the first three days of each UTC month. Verified business owners may opt into emailed reports. Only months with recorded interactions are queued. No monthly owner emails send unless NSTP_MONTHLY_REPORTS_ENABLED=true and the verified Resend sender works. Email batches are limited to five daily.

Admins may download CSV files for monthly business referrals and site pageviews in /manage-businesses. The public advertising page only displays completed-month measured reach when actual recorded data exists.

## How to start automatic business invitations

1. Confirm the correct existing Vercel project owning www.naturalstatetourismproject.org is visible through the connected Vercel account. Do not create a replacement project.
2. In Vercel Production configure NSTP_SUPABASE_URL, NSTP_SUPABASE_SECRET_KEY, NSTP_TOKEN_SECRET, NSTP_ADMIN_KEY, CRON_SECRET, RESEND_API_KEY, RESEND_WEBHOOK_SECRET, NSTP_MAIL_FROM, NSTP_POSTAL_ADDRESS, and NSTP_TEST_EMAIL. Set NSTP_RESEARCH_ENABLED=false, NSTP_OUTREACH_ENABLED=false and NSTP_MONTHLY_REPORTS_ENABLED=false initially. Never paste keys into chat or public source files.
3. Verify Resend domain SPF/DKIM/DMARC and signed webhooks to /api/directory/webhooks/resend.
4. From /manage-businesses send a controlled test to NSTP_TEST_EMAIL. Verify real arrival and the signed delivered webhook event.
5. Use Research next 5 businesses, inspect source evidence, and confirm correct city, contact, unsubscribe and claim verification behavior.
6. Activate NSTP_RESEARCH_ENABLED=true after testing; this checks up to five due official business websites each day. The research step never sends promotional email.
7. After testing the production sender, claim flow, bounce suppression and opt-outs, activate NSTP_OUTREACH_ENABLED=true and redeploy. The 14:00 UTC daily cron attempts up to five queued claim invitations, with a 15-per-UTC-day global database limit that includes manual batches.
8. Set NSTP_MONTHLY_REPORTS_ENABLED=true separately to deliver monthly measured reports only to verified owners who opted in; it never turns promotional outreach on.
9. Set NSTP_OUTREACH_ENABLED=false to suspend all promotional invitations. Monitor bounces, complaints and unsubscribes.

## Paid visibility vs free claiming

The business claim and updating basic information are free, regardless of advertising. The owner portal and claim invitation offer discreet links to the existing $20/month Featured Placement and $100 one-time Spotlight Page. Owners are never required to buy placement to update their listing.

## Known limitation

Some city guide pages still render older hardcoded business data. Approved central directory edits are not automatically reflected in those city pages until their data adapters are connected. City tracking measures only activity after its deployment and cannot backfill historic Vercel data.


## Verified Natural State sending domain (2026-11-15)

All business claim invitations, verification messages, owner monthly reports and public contact-form notifications use the new verified domain `naturalstatetourismproject.org`, not a Hometown Web Services address.

Recommended Production sender environment value:
`NSTP_MAIL_FROM=Natural State Tourism Project <listings@naturalstatetourismproject.org>`

Optional replies (defaults to the existing public project contact mailbox):
`NSTP_MAIL_REPLY_TO=naturalstatetourismproject@gmail.com`

If `NSTP_MAIL_FROM` is absent, the application defaults to the branded listings@ identity. If it is set to a different domain, sending is rejected until fixed. Production sender verification in the Resend dashboard is still required—an application's domain check is not proof that DNS authentication has passed. Configure SPF/DKIM/DMARC and ensure the chosen sender address is authorized in Resend.

The admin dashboard now includes **Preview branded emails** which renders the exact current HTML for a sample business without sending. The **Send controlled test email** action sends the same branded invitation with an explicit TEST banner only to `NSTP_TEST_EMAIL`, using a valid physical mailing address. The example claim and unsubscribe links inside that test are not functional—use separate real claim/opt-out tests for end-to-end verification. Never enable outreach based only on a rendered preview.
