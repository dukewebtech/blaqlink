# Blaqora design rules

The design system lives in /design-system. It is the source of truth for all UI.

- Reference: design-system/blaqora-design-system.html (components, rules, copy guidelines)
- Tokens: design-system/blaqora-tokens.css and blaqora-tokens.json
- Components: design-system/blaqora-components.css (bq- classes)
- Approved homepage: design-system/blaqora-home.html

Rules:
- Never hard-code colours, font sizes, spacing, radii or shadows. Use the tokens.
- Fonts: Bricolage Grotesque (headings) and Plus Jakarta Sans (everything else). No other fonts.
- Category colours: tickets = coral, bookings = violet, products = amber, digital = green.
- Money: ₦18,500 format, tabular numbers, true minus sign (−) for deductions.
- Every screen must work at 390px (mobile) and 1440px (desktop).
- Empty states need a title, one sentence and one action button.
- Keep existing functionality, routes, API calls and data logic exactly as they are. Only change the UI layer.
- Investigate first, report, and wait for approval before large changes.


# Blaqora storefront rules

Reference templates live in /storefront-templates. Each is a complete, working
storefront in one HTML file. They share the same item sheet, bag and checkout.

- Template 1 (blaqora-storefront.html)   "Daylight"  light, friendly, general purpose
- Template 2 (blaqora-storefront-2.html) "Editorial" dark, app-like, fashion and creators
- Template 3 (blaqora-storefront-3.html) "Studio"    light, illustrated tiles, service-led
- Template 4 (blaqora-storefront-4.html) "Boutique"  warm, gradient hero, saved items

Rules:
- Every vendor store renders at blaqora.store/{slug}. The slug comes from the vendor's account.
- The vendor picks one template and one brand colour. Both are stored on the store record
  and drive the whole storefront through the --accent CSS variable.
- All four templates must support the same four item types: product, ticket, booking, digital.
- Never hard-code prices, stock, names or images. Everything comes from the vendor's items.
- Checkout logic is identical across templates. Build it once and share it.
- Payment goes through Paystack. Never handle card details in our own code.
- Storefronts must be server-rendered or pre-rendered for SEO and link previews
  (WhatsApp and Instagram must show the store name, bio and image).
- Every screen must work at 390px and 1440px.
- Empty states need a title, one sentence and one action. 