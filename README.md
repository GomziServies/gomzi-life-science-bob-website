# Gomzi Life Science: Label Web

One React + Vite app with two parts, served together:

- **Shop** (`/shop`): the banner website. Pick a product, a flavour and a label, see it in 3D, order, or open the label in the editor.
- **Editor** (`/`, `/editor/...`): the design editor (canvas, templates, fonts, elements, export to PNG / PDF / video).

There is no backend in this repo. Everything goes to **fg-api** (the Node server): `/api/v1` (editor), `/media` (files read from the S3 bucket),
`/ws` (live editing) and `/crm` (the shop's orders and enquiries).

## Run it

```bash
npm install
npm run dev          # http://localhost:5173  (the shop is at /shop)
```

The dev server forwards `/api`, `/media`, `/ws` and `/crm` to `http://localhost:80` (fg-api). To use another server, copy `.env.example` to
`.env.local` and set `VITE_API_PROXY`.

## Build

```bash
npm run lint
npm run build        # writes dist/
```

`dist/` is plain static files. Serve it from any web server with these rules:

| Path | Goes to |
| --- | --- |
| `/api/`, `/media/`, `/ws/`, `/crm/` | fg-api (`/crm/x` is forwarded as `/x`; `/ws/` needs WebSocket upgrade) |
| every other path | `dist/index.html` (client-side routes) |

Or build with the full addresses instead of a proxy (see `.env.example`).

## Layout

```
src/
  app/            routes and providers
  editor/         the design editor
  features/ lib/ pages/ ...   editor pages and shared code
  site/           the shop (mounted at /shop)
public/           static files
scripts/          build helpers
```

## Licence

The editor is based on Doory, released under the Attribution Assurance License. Keep `LICENSE` and `NOTICE` with the code and show the credit they
describe. See also `THIRD_PARTY.md`.
