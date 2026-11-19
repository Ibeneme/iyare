# Yare Height refactor

**Install:** delete your old `src/` completely, then copy this `src/` in. (Extracting over the old folder on macOS merges `Pages/pages`, `Components/components` etc. and leaves stale files.) Replace `index.html` and add `public/site.webmanifest`. No new npm packages. Tailwind v4 config lives in `src/index.css`, so `tailwind.config.js` is not needed.

## Landing pages (`src/Landing/`, capitalised folders, files named for what they hold)
- `Home/` HomePage, HeroSection, StatsSection, PlatformOverviewSection, FeaturesSection, AudienceSection, TestimonialsSection, FaqSection, ContactUsSection
- `About/` `Careers/` `Subjects/` `Pricing/` `Legal/` `NotFound/` — each page file composes its own *Section files
- `Layout/` PublicNavbar, PublicFooter, LandingShell, WhatsAppButton · `Shared/` building blocks · `Landing.css` army-green + yellow tokens (`--lp-*`, scoped to `.landing`)

## Signed-in app
`src/pages/app/*`, `src/components`, `src/store`, `src/config` (roles + sidebar), `src/routes` (all URLs in `paths.ts`). Logout goes to /admin-sign-in?type=<role> (admin, teacher) or /sign-in?type=<role>.
