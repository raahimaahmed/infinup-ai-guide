

# SEO Optimization for Infinup.ai

## What We'll Do

Improve your site's visibility in search engines and social media shares by adding proper metadata, structured data, a sitemap, and an OG image.

## Changes

### 1. Complete Meta Tags in `index.html`
- Add missing `og:url`, `og:image`, `og:site_name` tags
- Add `twitter:title`, `twitter:description`, `twitter:image` tags
- Add canonical URL link
- Add `theme-color` meta tag
- Add apple-touch-icon link

### 2. Create `public/sitemap.xml`
- Static sitemap listing the main routes (`/`, `/auth`, `/credits`)
- Reference the published URL (`https://infinup-ai-guide.lovable.app`)

### 3. Update `public/robots.txt`
- Add `Sitemap:` directive pointing to the sitemap
- Simplify to a single `User-agent: *` rule

### 4. Add JSON-LD Structured Data
- Add `WebApplication` schema markup in `index.html` so search engines understand this is an AI learning tool
- Includes name, description, application category, and offers info

### 5. Create a Simple OG Image
- Add a branded `public/og-image.svg` (SVG with gradient background, app name, and tagline) for social sharing previews

## Technical Details

**`index.html`** -- Add ~20 lines of meta tags + a JSON-LD script block:
- `<link rel="canonical" href="https://infinup-ai-guide.lovable.app/" />`
- `<meta property="og:url" content="https://infinup-ai-guide.lovable.app/" />`
- `<meta property="og:image" content="https://infinup-ai-guide.lovable.app/og-image.svg" />`
- `<meta property="og:site_name" content="Infinup.ai" />`
- Twitter meta tags mirroring OG tags
- JSON-LD `WebApplication` schema in a `<script type="application/ld+json">` block

**`public/sitemap.xml`** -- New file with standard XML sitemap format

**`public/robots.txt`** -- Simplified with sitemap reference

**`public/og-image.svg`** -- New branded SVG for social sharing

No backend changes or new dependencies required.

