# Sazaan Studios — Design System & Brand Prompt
> Give this entire file to Claude at the start of any design session.

---

## WHO WE ARE

**Brand:** Sazaan Studios
**Tagline:** "Architects of Digital Prestige"
**Owner:** Muhammad Abdullah (Baloch)
**What we do:** Web development, Local SEO, Google Business Profile optimization, Business Automation, Custom CRM — for small businesses in the US and UK.
**Brand voice:** Confident, precise, results-first. Not a vendor. A builder. No fluff, no hype, no generic agency talk.

---

## COLOR PALETTE

| Role | Name | Hex |
|---|---|---|
| Primary text / headers | Ink Black | `#111111` |
| Primary accent / CTA | Electric Lime | `#E8FF3A` |
| Page background | Off White | `#F7F7F5` |
| Cards / surfaces | Pure White | `#FFFFFF` |
| Body text / muted | Ash Gray | `#555555` |
| Dividers / borders | Border Gray | `#E2E2DE` |

**Rules:**
- Lime is only used for CTAs, key highlights, and the S-mark icon stroke
- Never use lime as body text on white — it fails contrast
- No purple (retired from old brand)
- No dark backgrounds
- No gradients
- Grid paper texture (`#E2E2DE` on `#F7F7F5`) is an optional background texture for cards and section backgrounds

---

## TYPOGRAPHY

| Role | Font | Weights | Source |
|---|---|---|---|
| Headlines / Display | Barlow Condensed | 700, 800, 900 | Google Fonts |
| Body / UI / Email copy | DM Sans | 400, 500, 600 | Google Fonts |

**Typography rules:**
- All section headings: Barlow Condensed 900, UPPERCASE, tight letter-spacing (-0.01em to -0.02em)
- Body copy: DM Sans 400, 15–16px, line-height 1.6–1.7
- Labels / tags: DM Sans 600, 11px, uppercase, 0.1em letter-spacing
- Never use Inter, Space Grotesk, Roboto, or Arial

---

## LOGO & WORDMARK

- **Wordmark:** `SAZAAN STUDIOS` — Barlow Condensed 900, UPPERCASE
- **Icon / S-mark:** Angular lightning bolt / Z-path shape. Always: black square background (`#111`) + Electric Lime stroke (`#E8FF3A`). Border-radius: 6px on the container square.
- **Primary version:** Black wordmark on Off-White or White background
- **Inverted version:** Black wordmark on Electric Lime background
- **Do not:** Round the icon, use gradients on it, or change the lime stroke color

---

## DESIGN PRINCIPLES

1. **Light-first** — Off-white base, white cards, black text. Feels like a premium agency, not a SaaS tool.
2. **Bold type does the work** — Barlow Condensed headlines at large sizes replace decorative illustrations.
3. **Lime is earned** — Only appears at key moments: CTA button, highlight text, icon mark. One lime element per visual section maximum.
4. **Grid paper texture is optional atmosphere** — Can be used as a section background to add structure without adding visual noise.
5. **Cards float** — White cards with 1px `#E2E2DE` border and 14–16px border-radius on Off-White background. This is the primary layout unit.
6. **No gradients. No shadows. No glow.** — Flat, clean, intentional.

---

## DOCUMENTS TO GENERATE

When I say "generate a [document type]", use this brand system and the rules below.

### 1. COLD OUTREACH EMAIL

**Goal:** Visually impress. Get a reply. Not a reply to unsubscribe — a reply that says "tell me more."
**Format:** HTML email (inline CSS only — no external stylesheets)
**Structure:**
```
HEADER
- Sazaan Studios wordmark (text-based, Barlow Condensed or closest web-safe equivalent)
- Thin border-bottom in #E2E2DE

HOOK BLOCK (big bold card)
- Barlow Condensed 900, 36–48px
- 1–2 line statement specific to their business/niche
- Background: #111 with Electric Lime accent OR pure white with black type
- Rounded card: border-radius 16px

BODY COPY
- DM Sans 15px / #555555
- 3–4 short paragraphs max
- Reference their specific business name and pain point
- No generic "I help businesses grow" copy

PROOF BLOCK
- 2–3 social proof lines (client results or niche stats)
- Small, muted, DM Sans 13px

CTA
- One button only
- Background: #111, Text: #E8FF3A, font: DM Sans 600
- Text: "Book a 15-min call →" or "See what we built →"

FOOTER
- Name, role, Sazaan Studios
- Website + email
- Minimal, muted, 12px
```

**Tone:** Specific, direct, no "hope this finds you well." Start with their problem, not your intro.

---

### 2. POST-CALL PROPOSAL EMAIL

**Goal:** Recap the call, present the scope, make it easy to say yes.
**Format:** HTML email (inline CSS only)
**Structure:**
```
HEADER
- Wordmark + "Proposal for [Client Name]" in Barlow Condensed

RECAP BLOCK
- "Here's what we discussed:" header
- 3–5 bullet points of their pain points from the call
- Shows you listened

SCOPE BLOCK (card-based)
- Each deliverable as its own card row: service name | timeline | what's included
- Clean table or card list

INVESTMENT BLOCK
- Single price or tiered options
- Payment terms: 50% upfront, 50% on delivery
- "No hidden fees" line

NEXT STEP
- CTA: "Confirm & Pay 50% Deposit →"
- Link to Payoneer / Calendly to confirm

FOOTER
- Validity: "This proposal is valid for 7 days"
- Contact info
```

**Tone:** Professional but not stiff. Feels like a smart, organized agency, not a freelancer on Fiverr.

---

### 3. CLIENT CONTRACT

**Parties:** Sazaan Studios ("Agency") + [Client Name] ("Client")
**Include:**
- Scope of work (from proposal)
- Payment terms: 50/50 split, payment via Payoneer
- Revision policy: 2 rounds included, additional revisions billed at $[X]/hr
- Timeline: project start within 3 business days of deposit
- IP transfer: full ownership transfers to client on final payment
- Cancellation: 50% deposit is non-refundable if client cancels mid-project
- Confidentiality: standard NDA clause
- Governing law: [leave blank — fill in per client location]

**Format:** Clean plain text or PDF-ready formatting. Not HTML.

---

### 4. INVOICE / PRICING SHEET

**Format:** Clean, minimal HTML or markdown table
**Include:**
- Sazaan Studios header with S-mark reference (text-based)
- Invoice number, date, due date
- Line items: service | description | price
- Subtotal, any discount, total
- Payment method: Payoneer
- "Due within [X] days of receipt"

---

### 5. DISCOVERY CALL SCRIPT

**Goal:** Qualify the prospect, understand their pain, set up the proposal
**Structure:**
1. Opener (30 sec): confirm you're talking to the right person
2. Context question: "Tell me about your current online presence"
3. Pain questions: "How are you currently getting new customers?" / "What's not working?"
4. Goal questions: "What does success look like in 6 months?"
5. Budget signal: "Projects like this typically run $800–$2,000 depending on scope — does that work for you?"
6. Close: "I'll send you a proposal within 24 hours — is there anything else I should factor in?"

---

## EMAIL HTML RULES (IMPORTANT)

When generating HTML emails, follow these rules so they actually render correctly in Gmail, Outlook, and Apple Mail:

- **Inline CSS only** — no `<style>` blocks, no external CSS
- **Max width: 600px**, centered with `margin: 0 auto`
- **Background:** `#F7F7F5` for email body, `#FFFFFF` for content area
- **Fonts:** Use web-safe stacks — `'Barlow Condensed', Arial Black, sans-serif` for headlines, `'DM Sans', Arial, sans-serif` for body (Gmail strips Google Fonts, use fallbacks)
- **No flexbox or grid** — use HTML table layout for email structure (it's the only reliable cross-client layout)
- **Buttons:** Use `<a>` tags styled as buttons, not `<button>` elements
- **Images:** If using images, always include `width` and `height` attributes and `alt` text
- **Test rendering:** Mentally check it works in dark mode Gmail (add `color: #111111` explicitly to all text — don't rely on inherited color)

---

## REFERENCE PAGES (structure to replicate, not copy)

These are the pages I want you to generate (when asked), using the Sazaan Studios brand above:

1. **Cover / Hero slide** — Brand name, tagline, large bold Barlow Condensed headline, Electric Lime CTA block
2. **Agenda / Table of Contents** — Numbered list, Barlow Condensed labels, blue dot badges replaced with lime
3. **About Sazaan Studios** — Founder info (Abdullah Baloch), brand story, services offered
4. **Work Overview / Portfolio** — Grid of demo clients (Brûlée & Co, Daniel Reeves), brief descriptions
5. **Process / Stages** — 5 stages: Discovery → Strategy → Build → QA → Launch & Support
6. **Pricing** — 3 tiers or single project scope with line items
7. **Next Steps** — CTA card, Calendly link or QR placeholder, "Book a call" CTA
8. **Contact** — Email, LinkedIn, website — bold CONTACT typographic treatment in Barlow Condensed

---

## WHAT NOT TO DO

- Do not use purple anywhere (old brand — retired)
- Do not use dark backgrounds
- Do not use Inter, Roboto, or Space Grotesk
- Do not write generic agency copy ("we help businesses grow digitally")
- Do not add gradients, shadows, glows, or mesh backgrounds
- Do not copy Kanza Fazal's designs — use her structure as reference only
- Do not add unnecessary decorative elements — bold type is the decoration

---

*File version: April 2026 | Sazaan Studios | hello@sazaanstudios.com*
