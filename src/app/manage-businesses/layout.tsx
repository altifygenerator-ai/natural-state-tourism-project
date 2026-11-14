import type { Metadata } from "next";
export const metadata: Metadata = { title: "Business Manager | Natural State Tourism", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
