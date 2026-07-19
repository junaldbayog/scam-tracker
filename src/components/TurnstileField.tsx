"use client";

import Script from "next/script";
import { useRef } from "react";

/**
 * Cloudflare Turnstile widget for progressive-enhancement <form action={...}>
 * server-action forms: it renders the challenge and writes the resulting token
 * into a hidden `turnstileToken` input that submits with the form. When no site
 * key is configured (local dev) it renders nothing, and the server skips
 * verification — matching verifyTurnstile()'s dev behavior.
 *
 * (The Window.turnstile type is declared globally in CommentForm.tsx.)
 */
export function TurnstileField() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  if (!siteKey) return null;
  return (
    <>
      <input ref={inputRef} type="hidden" name="turnstileToken" />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={() => {
          if (widgetRef.current && window.turnstile) {
            window.turnstile.render(widgetRef.current, {
              sitekey: siteKey,
              callback: (t: string) => {
                if (inputRef.current) inputRef.current.value = t;
              },
            });
          }
        }}
      />
      <div ref={widgetRef} />
    </>
  );
}
