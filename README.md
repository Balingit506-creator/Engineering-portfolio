# Juaren A. Balingit — Portfolio

Static site: `index.html`, `css/styles.css`, `js/main.js`. No build step.

## Run locally
Open `index.html` directly, or serve the folder (recommended so the video and PDF download behave like production):

    npx serve .        # or: python -m http.server

## Files to add
| Path | What |
|---|---|
| `assets/engineering-background.mp4` | Hero video (1920×1080, H.264, muted, ~10–20 s loop, ideally < 8 MB). Until it exists, the blueprint image `assets/hero-fallback.svg` is shown. |
| `assets/Juaren_A_Balingit_Resume.pdf` | Resume used by every "Download resume" button. |
| `assets/portrait.jpg` (optional) | Replace `assets/portrait-placeholder.svg` in the About section (4:5 ratio). |

## Replacing project images and text
- Images: `assets/projects/*.svg` are illustrative drawing sheets. Export your real drawings (PNG/JPG/SVG, ~1600×1120, 10:7 ratio) and update the `src` in `index.html` **and** `image` in `js/main.js`.
- Modal content (overview, objective, process, tools, specs, result): edit the `PROJECTS` object at the top of `js/main.js`.

## Contact form
Without a backend, "Send message" opens the visitor's email app pre-filled to 506balingit@gmail.com.
To receive messages directly, create a free form endpoint (e.g. Formspree) and set it on the form:

    <form id="contact-form" ... data-endpoint="https://formspree.io/f/XXXXXXX">
