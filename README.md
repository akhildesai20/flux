# Flux

Tilt-controlled fluid dynamics built with React + Vite and a pure JavaScript grid-based simulator.

## Development
- `npm install`
- `npm run dev`

## Production Build
- `npm run build`
- `npm run preview`

## Deployment
Deploy to Vercel or Netlify with:
- Build command: `npm run build`
- Output directory: `dist`
- HTTPS enabled (required for `DeviceOrientationEvent`)

Recommended security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy: <project specific policy>`

## Notes
- PWA manifest is at `public/manifest.json`.
- Add final `192x192` and `512x512` PNG icons at `public/icons/` for install prompts.
