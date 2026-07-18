export type Guide = {
  slug: string;
  title: string;
  description: string;
  updated: string; // ISO date
  sections: { heading: string; body: string[] }[];
  faq?: { q: string; a: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-report-scam-number-ntc",
    title: "How to report a scam number to the NTC",
    description:
      "Step-by-step guide to filing a complaint about scam calls and texts with the National Telecommunications Commission, plus telco reporting hotlines.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "Report to your telco first",
        body: [
          "Both Globe and Smart accept scam reports by forwarding the message to 7726 (spells SPAM) — it's free and works from any prepaid or postpaid SIM. Include the sender's number and the full text of the message.",
          "Globe users can also report through the Globe One app under Help, and Smart users through the Smart app's Report a Spam feature. Telcos can block numbers on their own network faster than any other channel.",
        ],
      },
      {
        heading: "File a complaint with the NTC",
        body: [
          "The National Telecommunications Commission accepts complaints by email at consumer@ntc.gov.ph or through the NTC Consumer Complaint form on ntc.gov.ph. Include the scam number, screenshots of the message or call log, the date and time, and your own contact details.",
          "The NTC can direct telcos to block numbers and SIMs used in scams. Complaints with screenshots are acted on faster than bare descriptions.",
        ],
      },
      {
        heading: "If you lost money",
        body: [
          "Report to the PNP Anti-Cybercrime Group (acg.pnp.gov.ph) or the NBI Cybercrime Division. Bring or attach screenshots, receipts, reference numbers of any transfers, and the scammer's number and account details.",
          "If money moved through GCash or Maya, report it in the app immediately as well — e-wallets can freeze a receiving account while the case is investigated, but only if you report quickly.",
        ],
      },
      {
        heading: "Report it here too",
        body: [
          "Adding the number to TrackScam PH warns everyone who searches it after you. Your report also builds the public record that authorities and journalists use to spot campaigns.",
        ],
      },
    ],
    faq: [
      {
        q: "Is reporting to 7726 free?",
        a: "Yes. Forwarding scam texts to 7726 is free on Globe, TM, Smart, and TNT.",
      },
      {
        q: "Can the NTC get my money back?",
        a: "No. The NTC can block numbers and SIMs, but recovering money requires a case with the PNP-ACG or NBI, and a report to the e-wallet or bank involved.",
      },
    ],
  },
  {
    slug: "paano-malalaman-kung-scam-ang-text",
    title: "Paano malalaman kung scam ang text message",
    description:
      "Mga senyales ng scam text sa Pilipinas — maling pangalan, pekeng link, gipit na deadline — at ano ang gagawin kapag nakatanggap ka.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "Mga klasikong senyales",
        body: [
          "May pangalan mo ang text pero hindi mo kilala ang sender — galing iyan sa nakalap na data, hindi sa lehitimong kumpanya. Ang tunay na bangko o courier ay hindi nagtetext mula sa personal na 09xx na numero.",
          "May link na kakaiba ang spelling (hal. gcash-verify.xyz) o pinaikling link. May deadline na nakakagipit: 'within 24 hours', 'aabutin ang account mo'. Lahat ng ito ay pressure tactics.",
        ],
      },
      {
        heading: "Mga sikat na modus ngayon",
        body: [
          "Pekeng delivery fee: 'May hold ang package mo, magbayad ng ₱50 sa link.' Ang totoong LBC o J&T ay hindi naniningil sa text link.",
          "Pekeng GCash security: 'Na-lock ang account mo, i-verify dito.' Ang GCash ay hindi kailanman hihingi ng MPIN o OTP.",
          "Pekeng trabaho: 'Earn ₱500-₱3000 daily, part time lang.' Kapag hiningan ka ng 'registration fee', scam iyan.",
        ],
      },
      {
        heading: "Ano ang gagawin",
        body: [
          "Huwag sagutin, huwag i-click ang link. I-block ang number sa phone mo. I-forward ang text sa 7726 para ma-report sa telco nang libre.",
          "I-search ang number dito sa TrackScam PH para makita kung may ibang nag-report, at mag-iwan ng sarili mong report para maprotektahan ang susunod na makakatanggap.",
        ],
      },
    ],
    faq: [
      {
        q: "Ligtas bang i-open ang scam text?",
        a: "Oo, ang pagbasa ng text ay hindi delikado. Ang pag-click sa link o pag-reply ang dapat iwasan.",
      },
      {
        q: "Bakit alam ng scammer ang pangalan ko?",
        a: "Galing ito sa mga nag-leak na database o mga raffle entry, online order, at forms na pinagbigyan mo ng detalye. Hindi ibig sabihin na na-hack ang phone mo.",
      },
    ],
  },
  {
    slug: "gcash-scams-how-they-work",
    title: "GCash scams: the common schemes and how to avoid them",
    description:
      "The most common GCash scams in the Philippines — fake customer service, OTP phishing, mistaken-transfer refunds — and the rules that keep your wallet safe.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "Fake customer service calls",
        body: [
          "A caller claims to be from GCash: your account is locked, flagged, or about to be suspended, and they'll fix it if you verify your MPIN or read back the OTP that was just texted to you. That OTP is the scammer logging into your account in real time.",
          "GCash support never calls to ask for an MPIN or OTP. No legitimate company does. Hang up, then check your account directly in the app.",
        ],
      },
      {
        heading: "The mistaken-transfer refund",
        body: [
          "You receive money you weren't expecting, then a tearful call: 'I sent it to the wrong number, please send it back.' The original transfer is later reversed or was made with a stolen account, and you're out the amount you 'refunded'.",
          "If you receive an unexpected transfer, don't send anything back directly. Report it in the GCash app and let GCash handle the reversal.",
        ],
      },
      {
        heading: "Phishing links",
        body: [
          "Texts about rewards, cashback, or account verification lead to convincing copies of the GCash login page. Anything typed there goes straight to the scammer.",
          "Only log in through the app itself. GCash promos are visible inside the app's GLife and promo sections — a promo that exists only in a text message is not a promo.",
        ],
      },
      {
        heading: "If you were scammed",
        body: [
          "Report in-app immediately: Help → Chat with us → report unauthorized transaction, and note the reference number. Speed matters — a receiving account can be frozen only before the money is cashed out.",
          "File with the PNP Anti-Cybercrime Group with screenshots and reference numbers, and report the scammer's number here so the next target sees the warning.",
        ],
      },
    ],
    faq: [
      {
        q: "Can GCash recover money I sent to a scammer?",
        a: "Sometimes, if the receiving wallet is frozen before cash-out. Report in-app immediately and follow up with a PNP-ACG case; recovery is never guaranteed.",
      },
      {
        q: "Does GCash call users about locked accounts?",
        a: "No. Account notices appear in the app and via official SMS sender IDs, and support never asks for your MPIN or OTP.",
      },
    ],
  },
  {
    slug: "fake-delivery-text-scams",
    title: "Fake delivery texts: the LBC and J&T fee scam",
    description:
      "How the fake courier text scam works — the ₱50 delivery fee, the card-skimming payment page — and how to check a real package without risking your card.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "How the scam works",
        body: [
          "You get a text: your package is on hold and a small fee — usually ₱25 to ₱120, small enough not to think twice — must be paid through a link. The link opens a payment page that captures your card or e-wallet details.",
          "The fee was never the point. The card details are. Victims typically see real losses days later, after the details are sold or used for larger charges.",
        ],
      },
      {
        heading: "Why it feels real",
        body: [
          "The texts borrow courier branding and sometimes arrive while you genuinely are waiting for a package — the scam is sent in bulk, and online shopping is common enough that it often lands at a believable moment.",
        ],
      },
      {
        heading: "How to check a real package",
        body: [
          "Track only on the courier's own site or app, typing the address yourself: lbcexpress.com, jtexpress.ph, or your shopping app's order page. Real couriers collect COD fees at your door, not through text links.",
          "If a text names a fee for a package you're expecting, contact the seller through the shopping platform instead of touching the link.",
        ],
      },
    ],
    faq: [
      {
        q: "I paid the fee. What now?",
        a: "Treat your card as compromised: lock or replace it through your bank immediately, watch for unfamiliar charges, and file a dispute for anything you didn't authorize. Report the number to 7726 and here.",
      },
    ],
  },
  {
    slug: "loan-app-harassment",
    title: "Loan app harassment: your rights and what to do",
    description:
      "Online lending apps that spam your contacts, threaten, and shame borrowers are breaking the law. What the SEC and NPC say, and how to fight back.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "What counts as harassment",
        body: [
          "Debt shaming — messaging your contacts about your loan, posting your photo, threatening arrest or 'blacklisting' — is prohibited. The SEC's rules on unfair collection (SEC MC 18-2019) and the Data Privacy Act both apply, and apps have been shut down for exactly this behavior.",
          "Receiving these calls about someone else's loan is also a violation: the app scraped that borrower's contact list, which the NPC has repeatedly ruled unlawful.",
        ],
      },
      {
        heading: "What to do",
        body: [
          "Document everything: screenshots of threats, call logs, the app's name. Don't argue with collectors and never pay 'penalties' invented mid-call.",
          "Complain to the SEC (for the lending company) via epd@sec.gov.ph and to the National Privacy Commission (for the contact-scraping and shaming) via complaints@privacy.gov.ph. Both accept email complaints with screenshots.",
          "Report the collector's numbers here — harassment campaigns use pools of SIMs, and mapping them helps other people recognize the calls for what they are.",
        ],
      },
      {
        heading: "If the debt is real",
        body: [
          "A legitimate debt doesn't make the harassment legal. Negotiate directly in writing through the app's official channel, and keep the SEC/NPC complaints moving in parallel — many apps drop the harassment once a complaint is docketed.",
        ],
      },
    ],
    faq: [
      {
        q: "Can a loan app have me arrested?",
        a: "No. Unpaid consumer debt is a civil matter in the Philippines, not a crime. Arrest threats from collectors are empty and are themselves evidence of unfair collection.",
      },
    ],
  },
  {
    slug: "sim-registration-and-scams",
    title: "Why scam texts still arrive after SIM registration",
    description:
      "The SIM Registration Act was supposed to end scam texts. Here's what it actually changed, how scammers adapted, and what still works to protect you.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "What the law changed",
        body: [
          "Since the SIM Registration Act (RA 11934) took effect in 2022, every active SIM must be registered to an ID. Unregistered SIMs were deactivated, and bulk anonymous SIM use became harder and more expensive.",
        ],
      },
      {
        heading: "How scammers adapted",
        body: [
          "Campaigns now run on SIMs registered with fake or stolen identities, on foreign numbers, and through messaging apps like Viber and WhatsApp that the law doesn't cover. Registration raised the cost of scamming; it didn't remove the supply of numbers.",
          "This is why reporting still matters: a registered scam SIM that gets reported can be traced and blocked faster than the old anonymous ones.",
        ],
      },
      {
        heading: "What actually protects you",
        body: [
          "Treat every unexpected number as unverified regardless of registration. Check numbers before engaging, forward scam texts to 7726, and use your phone's spam filtering. The law is one layer; your habits are the stronger one.",
        ],
      },
    ],
  },
  {
    slug: "job-offer-text-scams",
    title: "Job offer text scams: the part-time task trap",
    description:
      "The 'earn ₱500 to ₱3,000 daily' texts explained — how task scams escalate from small payouts to large deposits, and how to verify a real recruiter.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "How the trap is built",
        body: [
          "The first tasks are real and you get paid — liking videos, rating products, small amounts arriving in your GCash. That early payout is the hook; it makes everything after feel legitimate.",
          "Then comes a 'VIP task' requiring you to deposit your own money to unlock a bigger commission. The deposits grow, a 'processing error' appears, and recovering your balance always requires one more payment. There is no balance.",
        ],
      },
      {
        heading: "Red flags in the first message",
        body: [
          "Recruiters who text from personal 09xx numbers or foreign WhatsApp numbers; vague company names; salaries far above market for trivial work; interviews conducted entirely in a chat group; any mention of a fee, deposit, or 'activation'.",
          "Legitimate recruiters can be verified: a company domain email, a LinkedIn or JobStreet posting that matches, and a landline or office you can find independently.",
        ],
      },
      {
        heading: "If you're already in",
        body: [
          "Stop depositing immediately — the 'stuck balance' is bait, and every recovery payment is gone too. Save the chat, report the numbers and accounts to the PNP-ACG, report receiving wallets to GCash or Maya, and post the recruiter's number here.",
        ],
      },
    ],
  },
  {
    slug: "text-lottery-you-won-scams",
    title: "'Congratulations, you won!' — how text raffle scams work",
    description:
      "Prize and raffle texts claiming you won money from a promo you never joined: the tax-and-fee mechanics of the scam and how real promos actually notify winners.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "The mechanics",
        body: [
          "You've 'won' ₱150,000 from a promo run by a mall, a network, or a government program. To claim it, you pay a release fee, a tax, a notarization — each small compared to the prize, each followed by another. The prize never existed.",
          "Variants name-drop DTI permit numbers to sound official. A real DTI permit is verifiable on the DTI website, and real promos never collect fees from winners — that practice is itself illegal under DTI rules.",
        ],
      },
      {
        heading: "How real promos notify winners",
        body: [
          "Registered promos contact winners through official channels, publish winner lists, and release prizes without charging anything. If you didn't enter a promo, you didn't win one — there is no drawing that selects random phone numbers out of goodwill.",
        ],
      },
    ],
    faq: [
      {
        q: "The text has a DTI permit number. Is it legit?",
        a: "Check it on the DTI's list of approved sales promotions. Scammers paste real-looking permit numbers precisely because few people verify them. Any 'winning' that asks for a fee is a scam regardless of the permit.",
      },
    ],
  },
  {
    slug: "government-impersonation-calls",
    title: "Fake SSS, PhilHealth, and NBI calls: the authority scam",
    description:
      "Callers posing as government agencies threaten cases, suspended benefits, or warrants — then offer to fix it for a fee. How to recognize and shut down the script.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "The script",
        body: [
          "The caller has your name and sounds procedural: your SSS number was used in fraud, your PhilHealth records are flagged, a case is being filed at the NBI. You're transferred to an 'officer' who can settle it today — via payment, or by collecting your ID numbers and OTPs for 'verification'.",
          "The pressure is the tell. Real agencies communicate by written notice, resolve issues at their offices, and never collect payment through GCash, gift cards, or bank transfer over a phone call.",
        ],
      },
      {
        heading: "How to respond",
        body: [
          "Hang up without confirming any personal details — even 'yes, that's me' feeds the next call's script. If you're worried the issue might be real, call the agency yourself using the hotline on its official website, not any number the caller gives you.",
          "Report the number here and to the NTC. If you shared an ID number, monitor your SSS and PhilHealth records through their official portals.",
        ],
      },
    ],
  },
  {
    slug: "what-to-do-if-scammed",
    title: "Scammed? Do these five things in the first hour",
    description:
      "A rapid checklist for the first hour after losing money to a phone scam in the Philippines — freeze, document, report — ordered by what actually improves recovery odds.",
    updated: "2026-07-01",
    sections: [
      {
        heading: "1. Freeze the money paths",
        body: [
          "Report the transaction inside GCash or Maya immediately (Help → Chat) or call your bank's hotline to dispute and lock your card. Receiving accounts can only be frozen before cash-out, so this one step matters more than everything else combined.",
        ],
      },
      {
        heading: "2. Document while it's fresh",
        body: [
          "Screenshot the conversation, the number, receipts, and reference numbers before the scammer deletes accounts. Note dates, times, and amounts in one place.",
        ],
      },
      {
        heading: "3. File the official reports",
        body: [
          "PNP Anti-Cybercrime Group (acg.pnp.gov.ph or the nearest ACG office) or NBI Cybercrime Division. A docketed complaint is what banks and e-wallets act on for reversals — 'I called the hotline' is not a case; a report with a reference number is.",
        ],
      },
      {
        heading: "4. Cut the scammer's access",
        body: [
          "Change passwords and MPINs that were phished, enable app-level locks, and block the number. If your SIM was swapped or your account taken over, visit your telco with an ID the same day.",
        ],
      },
      {
        heading: "5. Warn the next person",
        body: [
          "Post the number and what happened on TrackScam PH. Scam campaigns reuse numbers for days — a report posted in the first hour is often live while the campaign is still texting other people.",
        ],
      },
    ],
    faq: [
      {
        q: "Will I get my money back?",
        a: "Honestly: often no, especially after cash-out. Odds improve sharply with speed — an in-app report within minutes, followed by a PNP-ACG or NBI complaint, is the path that recoveries actually take.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
