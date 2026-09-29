# Juaren A. Balingit — Portfolio

Static site: `index.html`, `css/styles.css`, `js/main.js`. No build step.

## Run locally
Open `index.html` directly, or serve the folder (recommended so the video and PDF download behave like production):

    npx serve .        # or: python -m http.server

## Assets
| Path | What |
|---|---|
| `assets/floor-plan-bg.mp4` | Hero background video (muted loop, from Pexels: https://www.pexels.com/video/7646791/). If it fails to load, `assets/hero-fallback.svg` is shown. |
| `assets/JAB506.png` | Portrait in the About section (4:5 ratio). |
| `assets/Juaren_A_Balingit_Resume.pdf` | Resume used by every "Download resume" button — **add this file**. |
| `assets/projects/*.svg` | Project images. |

## Editing projects
- Card number, category, title, image and short description: edit the card in `index.html`. The project popup reuses these.
- Popup details (overview, objective, process, tools, specs, result): edit the `PROJECTS` object at the top of `js/main.js`, keyed by the card's `data-project`.

## Contact form
Messages are sent through Formspree (form `xdekblok`) and forwarded to 506balingit@gmail.com.
The endpoint is set on the form in `index.html` (`data-endpoint`, plus `action` as a no-JavaScript fallback).
A hidden `_gotcha` field filters out spam bots. If `data-endpoint` is left empty, "Send message" opens the
visitor's email app instead.
