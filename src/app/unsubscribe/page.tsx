import type { Metadata } from "next";
import UnsubscribeForm from "@/components/directory/UnsubscribeForm";
export const metadata: Metadata = { title: "Unsubscribe from business outreach", robots: { index: false, follow: false } };
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ c?: string; s?: string }> }) {
  const { c, s } = await searchParams;
  return <main className="min-h-screen bg-[#faf8f2] pb-24 pt-36"><div className="mx-auto max-w-xl px-5">
    <h1 className="font-heading text-4xl font-bold text-[#183527]">Email preferences</h1>
    <p className="mt-5 text-[#526052]">Stop future promotional business directory messages from the Natural State Tourism Project. You may still receive verification messages if you request them.</p>
    {c && s ? <UnsubscribeForm contactId={c} signature={s} /> : <p className="mt-7 rounded-lg border bg-white p-6">This unsubscribe link is incomplete. Please contact us if you need help.</p>}
  </div></main>;
}
