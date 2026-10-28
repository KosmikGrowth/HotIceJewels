# Hot Ice Jewels

Website for **hoticejewels.com** — hip-hop-first solid gold and sterling jewellery.
*Made hot. Worn cold.*

## Layout

| Path | What it is | Deployed? |
|---|---|---|
| `index.html` | The live site — the "Quench" direction (prototype 33) | Yes |
| `vercel.json` | Clean URLs + a temporary `noindex` header | — |
| `design/` | All design exploration: 49 prototypes, the comparison gallery, tokens, design log | No (`.vercelignore`) |

The site is a single self-contained HTML file: inline CSS and JS, hand-drawn SVG, Google Fonts as the
only external request. No build step.

## Deploying

Vercel project `hoticejewels`, connected to this repo — every push to `main` deploys to production.

## Before launch

- **`noindex` is on** (`vercel.json`). The copy is still placeholder — prices, product specs and the
  buying options need real values. Remove the header when the content is real.
- **Domain**: `hoticejewels.com` → this Vercel project, DNS set at the registrar (BigRock).

## Design archive

Open `design/index.html` for the Hot Ice gallery (33–49) and `design/archive/index.html` for every
direction including the early ones (01–32). `design/README.md` documents how each was built and verified.
