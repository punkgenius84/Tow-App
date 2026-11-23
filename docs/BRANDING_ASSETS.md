# Big Jay's Tow Guide — branding asset specifications

Use the existing Big Jay's Towing Auto Centre artwork as the source of truth. Do not replace it with generic tow-truck clip art or redraw the brand without approval.

## Recommended source files

| Asset | Working dimensions | Format | Notes |
|---|---:|---|---|
| Master square logo artwork | 1024 × 1024 px | PNG | High-resolution source; transparent background where appropriate |
| Wide in-app logo lockup | 1200 × 600 px (2:1) | PNG | Use the complete original logo; keep lettering readable |
| Android legacy launcher icon | 512 × 512 px | PNG | Simplified mark; no small tagline or fine text |
| Android adaptive foreground | 432 × 432 px | PNG | Transparent foreground layer |
| Android adaptive background | 432 × 432 px | PNG or solid color | Separate layer from the foreground |
| In-app logo display | 56–64 CSS px high | PNG source | Keep the full wordmark visible; do not stretch |
| Optional small app/navigation mark | 192 × 192 px | PNG | Symbol-only variant for small UI surfaces |

## Android adaptive-icon safe area

The adaptive icon canvas is 432 × 432 px. Keep the important symbol and any essential lettering inside a centered 288 × 288 px safe area. The outer area may be clipped or covered by the launcher mask and effects. Avoid putting the full business name or tagline in the launcher icon; it will be too small to read.

## In-app display

The header should use the wide logo, not the tiny launcher icon. The current header presentation has been enlarged to 56 CSS px high, with a responsive width limit. Keep the original image proportions and use `object-fit: contain`.

## Export checklist

- Keep a layered editable master outside the app bundle.
- Export PNGs at the exact sizes above; do not enlarge a small icon to make the master.
- Use transparency only where intended; preview the logo on both the app's dark and light backgrounds.
- Keep important shapes, text and borders away from the edges.
- Verify the launcher icon under circular, squircle and rounded-square masks.
- Verify the in-app header on a narrow phone screen.
- Keep the full business logo and launcher symbol as separate assets; one image should not be forced to serve both purposes.

The current app keeps the existing Big Jay's branding. Replace or refine the artwork only after the approved updated logo files are supplied.
