# Asha Dental — Cinematic Website

A premium, scroll-driven website for Asha Super Speciality Dental Clinic in Akola. The experience connects 15 full-screen dental films into one continuous story, with viewport-controlled playback, responsive layouts, and a focused appointment journey.

## Run locally

Serve the `dist` directory with any static web server, then open the local URL in a browser.

For example:

```powershell
python -m http.server 4173 --directory dist
```

Then visit `http://127.0.0.1:4173`.

## Key behavior

- One video plays at a time as its scene becomes active
- Scrolling works in both directions across all 15 scenes
- The next scene is lightly preloaded for a smoother handoff
- Portrait videos fill desktop and mobile viewports without stretching
- Reduced-motion and video-failure fallbacks keep the content usable

