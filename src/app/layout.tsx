import type { Metadata } from "next";
import { Public_Sans, Libre_Franklin, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const franklin = Libre_Franklin({
  variable: "--font-franklin",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrackScam PH — Check if a phone number is a scam",
    template: "%s | TrackScam PH",
  },
  description:
    "Community-reported scam phone numbers in the Philippines. Look up any number, read reports, and vote scam or safe — no sign-up needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${franklin.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="flex h-5 w-[30px] overflow-hidden rounded-[3px] shadow-sm ring-1 ring-black/10">
                <svg viewBox="0 0 24 16" className="h-full w-full" aria-hidden="true">
                  <rect width="24" height="8" fill="#0038a8" />
                  <rect y="8" width="24" height="8" fill="#ce1126" />
                  <polygon points="0,0 0,16 12,8" fill="#ffffff" />
                  <circle cx="4.2" cy="8" r="1.7" fill="#fcd116" />
                  <circle cx="1.8" cy="2.2" r="0.7" fill="#fcd116" />
                  <circle cx="1.8" cy="13.8" r="0.7" fill="#fcd116" />
                  <circle cx="9.4" cy="8" r="0.7" fill="#fcd116" />
                </svg>
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-harbor-deep">
                TrackScam
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-royal">
                PH
              </span>
            </Link>
            <div className="hidden flex-1 sm:block">
              <SearchBox compact />
            </div>
            <nav className="ml-auto flex shrink-0 items-center gap-4 text-sm text-ink-soft">
              <Link href="/guides" className="hidden hover:text-ink md:block">
                Guides
              </Link>
              <Link
                href="/report"
                className="rounded-md bg-harbor px-3.5 py-2 font-semibold text-white shadow-sm hover:bg-harbor-deep"
              >
                Report a number
              </Link>
            </nav>
          </div>
          <div className="border-t border-line bg-card px-4 py-2 sm:hidden">
            <SearchBox compact />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-line bg-card">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-sm text-ink-soft sm:grid-cols-3">
            <div>
              <p className="font-display font-bold text-ink">TrackScam PH</p>
              <p className="mt-2 max-w-xs">
                Community reports on scam calls and texts in the Philippines.
                Reports reflect user experiences, not verified facts.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-ink">Browse</p>
              <ul className="space-y-1">
                <li><Link className="hover:text-harbor" href="/category/gcash-scam">GCash scams</Link></li>
                <li><Link className="hover:text-harbor" href="/category/fake-delivery">Fake delivery texts</Link></li>
                <li><Link className="hover:text-harbor" href="/telco/globe-tm">Globe/TM numbers</Link></li>
                <li><Link className="hover:text-harbor" href="/guides">Anti-scam guides</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-ink">Site</p>
              <ul className="space-y-1">
                <li><Link className="hover:text-harbor" href="/legal/terms">Terms of use</Link></li>
                <li><Link className="hover:text-harbor" href="/legal/privacy">Privacy policy</Link></li>
                <li><Link className="hover:text-harbor" href="/legal/content-policy">Content policy</Link></li>
                <li><Link className="hover:text-harbor" href="/legal/disputes">Is this your number?</Link></li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
