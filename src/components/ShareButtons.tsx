"use client";

import { useEffect, useState } from "react";

/**
 * Share bar for a number page — the top of the growth flywheel. On mobile it
 * uses the native Web Share sheet (covers Messenger, Viber, etc.); everywhere
 * it shows explicit fallbacks. The shared link renders with the page's dynamic
 * OG image, so it looks like a real warning card in feeds and chats.
 */
export function ShareButtons({ message, slug }: { message: string; slug: string }) {
  const [url, setUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedMsg = encodeURIComponent(message);
  const cardUrl = `/number/${slug}/card`;

  async function nativeShare() {
    try {
      await navigator.share({ title: "TrackScam PH", text: message, url });
    } catch {
      // User dismissed the sheet — nothing to do.
    }
  }

  /** Share the warning card as an actual image file when the device supports it
   * (best for forwarding into Messenger/Viber), else fall back to link share. */
  async function shareImage() {
    if (sharingImage) return;
    setSharingImage(true);
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], `trackscam-${slug}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${message} ${url}` });
      } else {
        await nativeShare();
      }
    } catch {
      // Fetch failed or user dismissed — fall back silently to the link buttons.
    } finally {
      setSharingImage(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const links = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    viber: `viber://forward?text=${encodedMsg}%20${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedMsg}%20${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedMsg}&url=${encodedUrl}`,
  };

  return (
    <section aria-label="Share this number" className="rounded-lg border border-line bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold text-ink">Warn other people about this number</p>
      <p className="mt-1 text-xs text-ink-faint">
        Forward the warning card to your family group chat — it helps the people
        who can&apos;t always spot a scam.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {canNativeShare ? (
          <button
            onClick={shareImage}
            disabled={sharingImage}
            className="inline-flex items-center gap-1.5 rounded-md bg-harbor px-3 py-2 text-sm font-semibold text-white hover:bg-harbor-deep disabled:opacity-50"
          >
            <ShareIcon /> {sharingImage ? "Preparing…" : "Share warning"}
          </button>
        ) : null}

        <a
          href={cardUrl}
          download={`trackscam-${slug}.png`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:border-harbor hover:text-harbor"
        >
          <ImageIcon /> Save image
        </a>

        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:border-harbor hover:text-harbor"
        >
          <FacebookIcon /> Facebook
        </a>

        <a
          href={links.viber}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:border-harbor hover:text-harbor"
        >
          <ViberIcon /> Viber
        </a>

        <a
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:border-harbor hover:text-harbor"
        >
          <WhatsAppIcon /> WhatsApp
        </a>

        <a
          href={links.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          title="Share on X"
          className="inline-flex items-center rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:border-harbor hover:text-harbor"
        >
          <XIcon />
        </a>

        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:border-harbor hover:text-harbor"
        >
          <LinkIcon /> {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </section>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.3 7.3 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.3-.5v-.4l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.6z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function ViberIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C7 2 3 5.5 3 10c0 2.3 1.1 4.4 2.9 5.8v3.7l3.2-1.9c.9.2 1.9.4 2.9.4 5 0 9-3.5 9-8s-4-8-9-8zm4.6 11.3c-.2.5-1 1-1.5 1.1-.4.1-.9.1-1.4-.1-.3-.1-.8-.3-1.3-.5-2.3-1-3.8-3.3-3.9-3.5-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.9c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.7 1.6c.1.1.1.3 0 .4l-.3.4-.3.3c-.1.1-.2.2-.1.4.1.2.6.9 1.2 1.5.8.7 1.5.9 1.7 1 .2.1.3.1.4-.1l.6-.7c.1-.2.3-.2.4-.1l1.5.7c.2.1.3.2.4.3 0 .2 0 .6-.2 1z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.3 8.3L23 22h-6.7l-5.2-6.8L5.1 22H2l7.8-8.9L1.5 2h6.9l4.7 6.2L18.9 2zm-2.3 18h1.9L7.5 4H5.5l11.1 16z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
