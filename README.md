# MissedCallStack

Static niche site for home-service contractors (HVAC / plumbing / electrical) who run **Jobber / Housecall Pro / ServiceTitan** and need **HighLevel** as the marketing / SMS / missed-call recovery layer.

**$0 stack:** plain HTML/CSS/JS. No build step. No paid APIs.

## Pages

| Path | Purpose |
|------|---------|
| `/` | Missed-call revenue & stack cost calculator (primary) |
| `/calculator/` | Redirects to `/` |
| `/ghl-jobber-stack/` | What syncs / doesn’t (cited HighLevel docs) |
| `/missed-call-text-back/` | HVAC text-back setup steps |
| `/ghl-vs-answering-service/` | Cost & recovery comparison |
| `/methodology/` | Calculator assumptions |

## Affiliate link

All HighLevel CTAs use `js/config.js`:

```js
AFFILIATE_LINK: 'https://www.gohighlevel.com/?fp_ref=dakota-428143',
```

## Local

```bash
python3 -m http.server 8080
```

## Deploy — GitHub Pages ($0)

1. Push to public repo `MissedCallStack`
2. Settings → Pages → Deploy from branch `main` / `/ (root)`
3. Site: `https://<user>.github.io/MissedCallStack/`

## Compliance

- FTC affiliate disclosure above the fold on every page
- Calculator outputs are estimates only; see methodology
- No fake testimonials or income guarantees

## Trademarks

Independent educational affiliate resource. Jobber, Housecall Pro, ServiceTitan, and HighLevel are trademarks of their owners.
