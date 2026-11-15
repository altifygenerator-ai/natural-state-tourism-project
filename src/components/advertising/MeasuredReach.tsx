import Link from "next/link";
import { db, configured } from "@/lib/nstp-directory";
import { lastCompletedMonth } from "@/lib/nstp-monthly";
export default async function MeasuredReach() {
  if (!configured()) return null;
  const month = lastCompletedMonth();
  try {
    const [sites, business] = await Promise.all([
      db<{ site: string; tracked_pageviews: number }[]>("nstp_monthly_site_stats","GET",
        { month: "eq." + month, select: "site,tracked_pageviews", limit: "12" }),
      db<{ website_clicks: number }[]>("nstp_monthly_business_stats","GET",
        { month: "eq." + month, select: "website_clicks", limit: "2000" })
    ]);
    const pageviews = sites.reduce((sum,x)=>sum+x.tracked_pageviews,0);
    const clicks = business.reduce((sum,x)=>sum+x.website_clicks,0);
    if (!pageviews && !clicks) return null;
    const monthName = new Date(month + "T12:00:00Z").toLocaleString("en-US",{
      month:"long",year:"numeric",timeZone:"UTC"
    });
    return <section className="bg-[#f7f5ee] py-14">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-[#98743a]">Measured network activity</p>
        <h2 className="mt-2 font-heading text-3xl font-bold text-[#183527]">Real numbers, clearly labeled</h2>
        <p className="mt-3 text-sm leading-6 text-[#566459]">Recorded across participating Natural State guides in {monthName}.
          Not estimates or historic Vercel data.</p>
        <div className="mt-6 flex flex-wrap gap-10">
          {pageviews>0&&<div><p className="font-heading text-4xl font-bold text-[#183527]">{pageviews.toLocaleString()}</p>
            <p className="text-sm text-[#5e6b61]">Tracked guide pageviews</p></div>}
          {clicks>0&&<div><p className="font-heading text-4xl font-bold text-[#183527]">{clicks.toLocaleString()}</p>
            <p className="text-sm text-[#5e6b61]">Recorded outbound business clicks</p></div>}
        </div>
        <p className="mt-5 text-xs leading-5 text-[#6b756b]">
          These deduplicated observations are not guaranteed unique visitors, customer leads or sales.
          Individual businesses can review their own measured listing activity after claiming.
        </p>
        <Link href="/businesses" className="mt-3 inline-block text-sm font-semibold text-[#183527] underline">View the business directory</Link>
      </div>
    </section>;
  } catch { return null; }
}
