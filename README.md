# Juaren A. Balingit — Portfolio

Site: `index.html`, `css/styles.css`, `js/main.js`, built with Vite. React components go in `src/` (entry: `src/main.jsx`).

## Run locally
    npm install
    npm run dev        # dev server with hot reload
    npm run build      # production build in dist/ — deploy this folder
    npm run preview    # serve the production build locally

## Hosting (Render)
The site is a Render **Static Site** that rebuilds on every push to `main`:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Environment | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (same as `.env`) |

`.node-version` pins Node 24, which the Vite build needs.

## Assets
| Path | What |
|---|---|
| `assets/floor-plan-bg.mp4` | Hero background video (muted loop, from Pexels: https://www.pexels.com/video/7646791/). If it fails to load, `assets/hero-fallback.svg` is shown. |
| `assets/JAB506.webp` | Portrait in the About section (4:5 ratio, 900px wide). `assets/JAB506.png` is the full-size original; re-export the WebP if you replace it. |
| `assets/Juaren_A_Balingit_Resume.pdf` | Resume used by every "Download resume" button — **add this file**. |
| `assets/projects/*.svg` | Project images. |

## Editing projects
Projects are managed from the **Portfolio Admin** mobile app in `mobile/`. Each project has a
preview (a PDF plotted from AutoCAD, or a PNG/JPG) shown on its card, and an optional `.dwg`
that visitors can download from the project popup. The site loads them from Supabase every time
the page opens, so changes made in the app appear on the next page load. You don't need to rebuild.

The cards written into `index.html` (with details in the `PROJECTS` object in `js/main.js`) are
the fallback. They show when Supabase isn't configured, can't be reached, or has no published projects.

The app also edits the site text (availability badge, intro facts, About, Experience,
Education) through **Site content** at the top of the project list. It's stored as one JSON
document in the `site_content` table (`supabase/site-content.sql`).

### One-time setup
1. **Create the backend.** Sign up at [supabase.com](https://supabase.com) and create a free project.
   Open *SQL Editor → New query*, paste all of `supabase/schema.sql` and click *Run*. This creates
   the `projects` table, the `projects` file bucket, the security rules, and copies in the 8
   existing projects. Then run `supabase/site-content.sql` the same way.
2. **Create your login.** *Authentication → Users → Add user → Create new user* with
   **506balingit@gmail.com** and a password, ticking *Auto confirm user*. Only this email can change
   anything (to use another, edit `is_portfolio_owner()` at the top of `schema.sql` and run it again).
   Then turn off *Authentication → Sign In / Providers → Allow new users to sign up*.
3. **Connect the website.** Copy `.env.example` to `.env` and paste the *Project URL* and
   *Publishable key* from *Project Settings → API Keys*. Restart `npm run dev`. Set the same two
   variables wherever the site is built for production.
4. **Connect the app.** Copy `mobile/.env.example` to `mobile/.env.local` with the same two values.

The publishable key is designed to be public: the database rules decide what it can do. Never
put the **secret** (service_role) key in either `.env` file.

### Running the app on your phone
    cd mobile
    npm install
    npx expo start

Install **Expo Go** from the App Store or Play Store and scan the QR code (phone and computer on
the same Wi-Fi). Sign in, then tap **+ New** to add a project, or tap an existing one to edit it.

### Building the Android APK (installs without the computer)
Needs Java 17 and the Android SDK (with **CMake 3.31.6**: `sdkmanager "cmake;3.31.6"`).

    cd mobile
    npx expo prebuild --platform android      # only after changing app.json or adding native packages
    cd android
    gradlew.bat assembleRelease
    copy app\build\outputs\apk\release\app-release.apk ..\PortfolioAdmin.apk

- `mobile/android/local.properties` must contain `cmake.dir=C\:\\Android\\Sdk\\cmake\\3.31.6`.
  The default CMake's build tool can't handle this project's long Windows paths, and the C++
  step fails with `ninja: error: mkdir(...): No such file or directory`.
- Builds are 64-bit only (`reactNativeArchitectures` in `android/gradle.properties`) to keep
  rebuilds fast. Add `armeabi-v7a` back for old 32-bit phones.
- `.env.local` is baked into the APK at build time, so rebuild after changing it.
- The APK is signed with the standard debug key: fine for your own phone, not for the Play Store.
  Running `prebuild --clean` regenerates `android/` and resets these two settings.

### Limits
- 50 MB per file (the Supabase free plan's limit).
- Browsers can't draw `.dwg` files, which is why each project needs a PDF or image preview.
  In AutoCAD, *Plot → DWG To PDF.pc3* gives a PDF the site can display.

## Contact form
Messages are sent through Formspree (form `xdekblok`) and forwarded to 506balingit@gmail.com.
The endpoint is set on the form in `index.html` (`data-endpoint`, plus `action` as a no-JavaScript fallback).
A hidden `_gotcha` field filters out spam bots. If `data-endpoint` is left empty, "Send message" opens the
visitor's email app instead.
