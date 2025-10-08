# Universal Content Embedding System

## Vision

**"Learn Anything Beautifully" — InfinUp embeds your entire learning journey on one page, so you can stay in flow.**

InfinUp is a **sacred space for curiosity and self-growth** where all learning content (videos, articles, PDFs, interactive code) is embedded directly in the interface — no external navigation required.

---

## What's New

### Universal Embedding Support

We've evolved from YouTube-only embedding to a **comprehensive content embedding system** that supports:

- ✅ **YouTube Videos** (bypasses bot detection)
- ✅ **PDF Documents** (official docs, guides)
- ✅ **Interactive Code** (CodePen, CodeSandbox, StackBlitz, Replit)
- ✅ **Educational Platforms** (freeCodeCamp, Khan Academy)
- ✅ **Safe iframes** with security controls

---

## Architecture

### 1. Embedding Library

**File**: [`src/lib/embeddings.ts`](../src/lib/embeddings.ts)

**Core Functions**:
```typescript
// Check if URL can be safely embedded
canEmbedUrl(url: string) → boolean

// Get comprehensive embedding information
getEmbedInfo(url: string, type: ResourceType) → EmbedInfo {
  canEmbed: boolean,
  embedType: 'youtube' | 'pdf' | 'iframe' | 'link',
  embedUrl?: string,
  safeUrl: string,
  isTrusted: boolean
}

// Determine if embed should be shown for this resource
shouldShowEmbed(url: string, type: ResourceType) → boolean

// Get iframe props with security settings
getIframeProps(embedInfo: EmbedInfo) → iframeAttributes
```

**Security Features**:
- ✅ URL sanitization (removes dangerous query params)
- ✅ Domain whitelist (30+ trusted domains)
- ✅ Blocked domain list (social media, shopping sites)
- ✅ Safe iframe sandbox attributes
- ✅ Restricted permissions

### 2. Enhanced ResourceCard

**File**: [`src/components/ResourceCard.tsx`](../src/components/ResourceCard.tsx)

**New Features**:
- Automatic embed type detection
- "Embeddable" badge for supported content
- Context-aware button labels:
  - "Play Video Here" (YouTube)
  - "View PDF Here" (PDFs)
  - "Open Interactive Content" (CodePen, etc.)
- Responsive embed containers (16:9 for video, custom heights for PDFs)
- Elegant collapse/expand UX

**User Experience**:
```
[Resource Card]
  📚 Python Tutorial for Beginners
  YouTube - freeCodeCamp.org • 3 hours • 🎥 Embeddable

  [▶️ Play Video Here]
  [Open in YouTube ↗]

  When clicked:
  [🎥 Video Player] [X]
  [16:9 responsive YouTube embed]
  💡 Stay in your learning flow — everything embedded for you
```

### 3. Updated Gemini Prompt

**File**: [`supabase/functions/generate-learning-plan/index.ts`](../supabase/functions/generate-learning-plan/index.ts)

**New Instructions**:
```
- EMBEDDABLE CONTENT PRIORITY:
  * Prioritize resources that can be embedded directly
  * YouTube videos, freeCodeCamp exercises, CodePen demos, PDFs
  * Creates seamless learning without leaving platform

- Interactive: Prefer CodePen, CodeSandbox, StackBlitz, Replit
- PDFs: Use official documentation PDFs or Google Drive
- AVOID: Sites that block iframe embedding (Facebook, Twitter)
```

---

## Supported Embed Types

### 1. YouTube Videos

**Domains**: `youtube.com`, `youtu.be`

**Features**:
- Extracts video ID from any YouTube URL format
- Uses official YouTube embed API
- 16:9 responsive aspect ratio
- Fullscreen support
- Client-side rendering (bypasses bot detection)

**Permissions**:
```
allow="accelerometer; autoplay; clipboard-write;
       encrypted-media; gyroscope; picture-in-picture;
       web-share"
```

### 2. PDF Documents

**Supported**:
- `.pdf` file extensions
- Google Drive PDFs
- Official documentation PDFs

**Features**:
- 800px height iframe
- `#view=fitH` parameter for proper sizing
- Download option available

### 3. Interactive Code Platforms

**Supported Domains**:
- `codepen.io`
- `codesandbox.io`
- `stackblitz.com`
- `replit.com`
- `freecodecamp.org` (interactive exercises)

**Features**:
- 600px height iframe
- Sandbox security: `allow-scripts allow-same-origin allow-popups allow-forms`
- Safe execution environment

### 4. Educational Platforms

**Supported**:
- Khan Academy
- freeCodeCamp
- Coursera (where embeddable)
- edX (where embeddable)

### 5. Documentation Sites

**Supported**:
- MDN Web Docs
- Official language docs (Python, React, Vue, etc.)
- GitHub repos
- Technical blogs (CSS-Tricks, Smashing Magazine)

---

## Security Model

### Domain Whitelist (30+ domains)

**Video**: `youtube.com`, `vimeo.com`
**Code**: `codepen.io`, `codesandbox.io`, `stackblitz.com`, `replit.com`
**Education**: `freecodecamp.org`, `khanacademy.org`, `coursera.org`, `edx.org`
**Docs**: `developer.mozilla.org`, `docs.python.org`, `reactjs.org`, etc.
**Articles**: `medium.com`, `dev.to`, `css-tricks.com`, etc.

### Blocked Domains

**Social Media**: `facebook.com`, `twitter.com`, `instagram.com`, `linkedin.com`
**Shopping**: `amazon.com`, `ebay.com`
**Other**: `reddit.com`, `pinterest.com`

### URL Sanitization

```typescript
// Remove dangerous query parameters
const dangerousParams = [
  'javascript', 'data', 'vbscript',
  'onclick', 'onerror'
];

// Strip from URL before embedding
```

### Iframe Sandbox

For non-YouTube, non-trusted iframes:
```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
  ...
/>
```

**What's allowed**:
- ✅ JavaScript execution
- ✅ Same-origin requests
- ✅ Opening popups (for OAuth, etc.)
- ✅ Form submission

**What's blocked**:
- ❌ Top-level navigation
- ❌ Camera/microphone access
- ❌ Geolocation
- ❌ Payment requests

---

## User Experience Flow

### Step 1: Browse Learning Plan
User sees resource cards with "Embeddable" badges

### Step 2: Click to Embed
```
[▶️ Play Video Here]  ← Click
```

### Step 3: Content Renders
```
[🎥 Video Player] [X]
[Embedded content - responsive, safe]
💡 Stay in your learning flow
```

### Step 4: Stay Focused
- No context switching
- No external tabs
- Seamless learning experience
- Progress tracked in same interface

---

## Brand Voice Implementation

### UI Copy

**Heading**: "Learn Anything Beautifully"
**Subtext**: "InfinUp embeds your entire learning journey on one page — so you can stay in flow."

**Button Labels**:
- "▶️ Play Video Here" (inviting, clear)
- "View PDF Here" (direct)
- "Open Interactive Content" (descriptive)

**Helper Text**:
"💡 Stay in your learning flow — everything embedded for you"

**Tone**:
- Elegant, calm, inspiring
- Learning as self-care
- Sacred space for curiosity

### Visual Design

**Colors**: Soft blue & cream palette
**Spacing**: Generous whitespace
**Typography**: Clean, readable fonts
**Animations**: Gentle, smooth transitions

---

## Implementation Details

### Embed Decision Logic

```typescript
function shouldShowEmbed(url: string, type: ResourceType): boolean {
  const embedInfo = getEmbedInfo(url, type);

  // Always show for videos
  if (type === 'video' && embedInfo.canEmbed) return true;

  // Show for interactive if trusted
  if (type === 'interactive' && embedInfo.isTrusted) return true;

  // Show for PDFs
  if (isPdfUrl(url)) return true;

  // Don't show for regular articles (most block iframes)
  return false;
}
```

### Responsive Heights

```typescript
'youtube': 'aspect-video',    // 16:9 ratio
'pdf': 'h-[800px]',          // Fixed height
'iframe': 'h-[600px]',       // Standard height
```

### Lazy Loading

```html
<iframe loading="lazy" ... />
```

- Only loads when user clicks "Play"
- Saves bandwidth
- Improves initial page load

---

## Testing

### Manual Test Checklist

```
□ YouTube video embeds and plays
□ PDF opens in viewer
□ CodePen/CodeSandbox loads correctly
□ freeCodeCamp exercises work
□ External links still functional
□ "Embeddable" badge shows correctly
□ Security: no dangerous URLs embedded
□ Responsive: works on mobile
□ Accessibility: keyboard navigation works
```

### Expected Behavior

| Resource Type | URL Example | Should Embed? | Button Label |
|--------------|-------------|---------------|--------------|
| YouTube video | `youtube.com/watch?v=abc` | ✅ Yes | "Play Video Here" |
| PDF | `example.com/guide.pdf` | ✅ Yes | "View PDF Here" |
| CodePen | `codepen.io/pen/xyz` | ✅ Yes | "Open Interactive Content" |
| Medium article | `medium.com/@user/post` | ❌ No | "View Resource" |
| Facebook | `facebook.com/...` | ❌ No | "View Resource" |

---

## Stretch Goals (Future)

### Phase 1: Enhanced Embeds ✅ DONE
- YouTube, PDF, interactive code
- Security & sanitization
- Responsive design

### Phase 2: Content Intelligence
- [ ] Auto-generate summaries under each embed
- [ ] Extract key timestamps from videos
- [ ] Generate quizzes after each section
- [ ] Highlight important sections in PDFs

### Phase 3: Progress Tracking
- [ ] Track video watch time
- [ ] Mark chapters as completed
- [ ] Resume playback from last position
- [ ] Save notes per resource

### Phase 4: Social Learning
- [ ] Discussion threads per resource
- [ ] Highlight community notes
- [ ] Share progress with friends
- [ ] Study groups

### Phase 5: AI Features
- [ ] Gemini summaries for each resource
- [ ] Auto-generated quizzes
- [ ] Multilingual captions (Whisper + Gemini)
- [ ] Voice commands for navigation

---

## Code References

| File | Purpose | Key Functions |
|------|---------|---------------|
| [`src/lib/embeddings.ts`](../src/lib/embeddings.ts) | Embedding utilities | `getEmbedInfo()`, `canEmbedUrl()`, `sanitizeUrl()` |
| [`src/lib/youtube.ts`](../src/lib/youtube.ts) | YouTube-specific | `extractYouTubeVideoId()`, `getYouTubeEmbedProps()` |
| [`src/components/ResourceCard.tsx`](../src/components/ResourceCard.tsx) | UI component | Embed rendering, button logic |
| [`supabase/functions/generate-learning-plan/index.ts`](../supabase/functions/generate-learning-plan/index.ts) | Gemini prompt | Embeddable content instructions |

---

## Comparison

### Before: External Links Only

```
[Resource Card]
  📚 Python Tutorial
  [View Resource ↗]  ← Opens new tab, loses context
```

**Problems**:
- Context switching
- Multiple tabs
- Fragmented experience
- Hard to track progress

### After: Universal Embedding

```
[Resource Card]
  📚 Python Tutorial • 🎥 Embeddable
  [▶️ Play Video Here]  ← Embeds in-page
  [Open in YouTube ↗]   ← Still available
```

**Benefits**:
- ✅ Seamless learning flow
- ✅ No tab switching
- ✅ Better focus
- ✅ Unified progress tracking
- ✅ Beautiful, calm interface

---

## Summary

InfinUp now provides a **comprehensive, secure, and beautiful embedding system** that supports:

- 🎥 YouTube videos (bot-detection bypass)
- 📄 PDF documents
- 💻 Interactive code platforms
- 🎓 Educational sites
- 📖 Documentation

All content is **embedded client-side** with strict security controls, creating a **seamless learning sanctuary** where users can stay focused and in flow.

**Brand Promise Delivered**: "A sacred space for curiosity and self-growth."

---

## Related Documentation

- [YouTube Embedding Fix](./YOUTUBE_EMBEDDING_FIX.md)
- [ML Optimization Principles](./ML_OPTIMIZATION_PRINCIPLES.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
- [Implementation Complete](../IMPLEMENTATION_COMPLETE.md)
