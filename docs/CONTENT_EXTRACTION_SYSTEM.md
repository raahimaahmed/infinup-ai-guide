# Content Extraction & Inline Rendering System

## Vision: Complete Learning Sanctuary

**InfinUp is not just a link aggregator — it's a complete learning sanctuary where ALL content (videos, articles, PDFs, code) is extracted and rendered inline. Users never need to leave the platform.**

---

## Problem Solved

### Before: Link-Based Learning
```
[Resource Card]
  📚 "How to Learn Python"
  [View Resource ↗]  → Opens new tab
```

**Issues**:
- Context switching
- Lost in browser tabs
- Fragmented learning experience
- Can't track what you've read
- Distracting external sites

### After: Inline Content Extraction
```
[Resource Card]
  📚 "How to Learn Python"
  [Read Full Article Inline ↓]

  → Fetches article via backend
  → Extracts readable content with Readability.js
  → Displays clean, formatted text inline
  → Reading time estimate
  → Progress tracking
  → No external navigation
```

**Benefits**:
- ✅ Seamless reading flow
- ✅ No context switching
- ✅ Clean, distraction-free content
- ✅ Accurate progress tracking
- ✅ Beautiful, unified interface

---

## Architecture

### 1. Backend Content Fetching API

**File**: [`supabase/functions/fetch-content/index.ts`](../supabase/functions/fetch-content/index.ts)

**Purpose**: Safely fetch external content and extract readable text

**Flow**:
```
Client Request
  ↓
Backend Fetches URL (bypasses CORS)
  ↓
Readability.js Parses HTML
  ↓
Extracts Clean Article Content
  ↓
Returns JSON with title, content, metadata
```

**API Endpoint**:
```typescript
POST /functions/v1/fetch-content

Request:
{
  "url": "https://realpython.com/python-basics",
  "extractContent": true
}

Response:
{
  "title": "Python Basics: A Practical Introduction",
  "byline": "By Real Python Team",
  "content": "<p>Clean HTML content...</p>",
  "textContent": "Plain text version...",
  "length": 15000, // Character count
  "excerpt": "This tutorial covers...",
  "siteName": "Real Python",
  "url": "https://realpython.com/python-basics",
  "success": true
}
```

**Security Features**:
- ✅ URL validation (must start with http/https)
- ✅ Blocked domains (localhost, file://, data:)
- ✅ 15-second timeout
- ✅ User-Agent header (identifies as InfinUp)
- ✅ Error handling with fallback

### 2. Mozilla Readability.js Integration

**Library**: `@mozilla/readability@0.5.0`

**Purpose**: Extract main article content from any webpage

**What it does**:
- Removes ads, navigation, sidebars
- Extracts title, author, main content
- Preserves important formatting
- Calculates reading time
- Handles complex HTML structures

**Supported Sites**:
- News sites (Medium, Dev.to, CSS-Tricks)
- Documentation (MDN, Real Python, blogs)
- Technical articles
- Blog posts
- Educational content

**Example**:
```typescript
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(html, { url });
const reader = new Readability(dom.window.document);
const article = reader.parse();

// Returns:
{
  title: "Article Title",
  byline: "Author Name",
  content: "<div>Clean HTML...</div>",
  textContent: "Plain text...",
  length: 10000,
  excerpt: "Short summary..."
}
```

### 3. ArticleContent Component

**File**: [`src/components/ArticleContent.tsx`](../src/components/ArticleContent.tsx)

**Features**:
- Preview/expand functionality
- Lazy loading (only fetch when clicked)
- Reading time calculation
- Author/metadata display
- Error handling with fallback
- External link option
- Responsive prose styling

**User Experience**:
```
Initial State:
[Preview text - first 500 chars...]
[Read Full Article Inline ↓] [Open Original ↗]

After Click:
Loading...

Expanded State:
By Author Name • 12 min read • Site Name
[Full article content with formatting]
[Collapse ↑] [Open Original ↗]
```

**State Management**:
- `isExpanded`: Controls show/hide
- `isLoading`: Shows loading spinner
- `article`: Cached extracted content
- `error`: Error message if fetch fails

### 4. ResourceCard Integration

**File**: [`src/components/ResourceCard.tsx:109-111`](../src/components/ResourceCard.tsx#L109-L111)

**Logic**:
```typescript
{/* Article Content Extraction (for reading type) */}
{resource.type === 'reading' && !canShowEmbed && (
  <ArticleContent
    url={resource.url}
    initialSummary={resource.description}
  />
)}
```

**Decision Flow**:
1. Is resource type "reading"? → Yes
2. Can we embed it as iframe? → No (most articles can't)
3. → Show ArticleContent component
4. User clicks "Read Full Article Inline"
5. Fetch & extract content
6. Display inline with formatting

---

## Content Types Supported

| Type | Rendering Method | User Experience |
|------|------------------|-----------------|
| **YouTube Videos** | iframe embed | "Play Video Here" → Embeds in-page |
| **PDFs** | iframe embed | "View PDF Here" → PDF viewer in-page |
| **Interactive Code** | iframe embed | "Open Interactive" → CodePen/Replit in-page |
| **Articles** | Readability extraction | "Read Full Article" → Extracted text inline |
| **Documentation** | Either embed or extract | Auto-detected best method |

---

## Technical Implementation

### CORS Bypass Strategy

**Problem**: Browsers block direct fetch of external HTML (CORS)

**Solution**: Backend proxy
```
Client
  ↓ (Request to our backend)
Supabase Edge Function
  ↓ (Fetch from external site)
External Website
  ↓ (HTML response)
Supabase Edge Function
  ↓ (Process with Readability)
Client (Receives clean JSON)
```

**Benefits**:
- No CORS issues
- Can add User-Agent header
- Server-side processing
- Security filtering
- Timeout control

### Reading Time Calculation

```typescript
const getReadingTime = () => {
  if (!article?.length) return null;
  const minutes = Math.ceil(article.length / 1000);
  // Assumes ~1000 characters per minute
  return `${minutes} min read`;
};
```

### Preview Generation

```typescript
const getPreviewText = () => {
  if (article?.textContent) {
    const preview = article.textContent.slice(0, 500);
    return preview + (article.textContent.length > 500 ? '...' : '');
  }
  return initialSummary || 'Click to load article preview...';
};
```

### Content Sanitization

Readability.js already sanitizes content, but we also:
- Use `dangerouslySetInnerHTML` carefully
- Apply Tailwind's `prose` classes for safe formatting
- Limit content length for performance
- Handle malformed HTML gracefully

---

## Updated Gemini Prompt

**New Instructions**:
```
- INLINE CONTENT PRIORITY (NEW!):
  * Prioritize resources with extractable, readable content
  * Articles will be fetched and displayed inline using Readability.js
  * Users can read full articles without leaving InfinUp
  * Prefer major publications (Dev.to, CSS-Tricks, Real Python, Medium)
  * This creates a complete learning sanctuary
```

**Result**: Gemini now recommends content-rich articles that work well with extraction.

---

## User Flow Examples

### Example 1: Reading an Article

```
1. User generates Python learning plan
2. Sees resource: "Understanding Python Lists"
3. Clicks "Read Full Article Inline"
4. Backend fetches https://realpython.com/python-lists-tuples/
5. Readability extracts clean content
6. Article displays inline with:
   - Title
   - Author: Real Python Team
   - Reading time: 18 min read
   - Full formatted content
7. User reads without leaving InfinUp
8. Marks as complete when done
```

### Example 2: Mixed Content Learning

```
Week 1: Python Basics
├─ Video: "Python Crash Course" → Embeds YouTube player
├─ Article: "Python Data Types" → Extracts & displays inline
├─ Interactive: "Python Exercises" → Embeds freeCodeCamp
└─ PDF: "Python Cheat Sheet" → Embeds PDF viewer

All content viewable without leaving the page!
```

---

## Error Handling

### Scenario 1: Fetch Fails
```
[Error Alert]
⚠️ Failed to fetch article content
[Read on original site ↗]
```

### Scenario 2: Extraction Fails
```
[Error Alert]
⚠️ Could not extract readable content
[Read on original site ↗]
```

### Scenario 3: Timeout
```
[Error Alert]
⚠️ Request timed out
[Read on original site ↗]
```

**Fallback**: Always provide external link as backup

---

## Performance Optimizations

### 1. Lazy Loading
- Content only fetched when user clicks "Read Full Article"
- Not fetched during initial page load
- Saves bandwidth and improves speed

### 2. Caching
- Extracted content cached in component state
- Subsequent expand/collapse doesn't re-fetch
- Reduces API calls

### 3. Preview First
- Show 500-char preview before full article
- User can decide if they want to read more
- Reduces unnecessary fetches

### 4. Timeouts
- 15-second timeout prevents hanging requests
- Graceful error handling
- User can still access original link

---

## Security Considerations

### Backend Validation
```typescript
// Block dangerous URLs
const blockedDomains = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'file://',
  'data:'
];

// Validate URL format
if (!url || !url.startsWith('http')) {
  return error('Invalid URL');
}
```

### Content Sanitization
- Readability.js removes scripts, iframes, dangerous tags
- Use Tailwind `prose` classes (pre-sanitized styles)
- Limit content length to prevent DoS
- Handle malformed HTML safely with try/catch

### Rate Limiting
- Consider adding rate limits to `/fetch-content` endpoint
- Prevent abuse of proxy functionality
- Monitor usage patterns

---

## Deployment Steps

### 1. Deploy Backend Function

```bash
# Deploy the fetch-content function
supabase functions deploy fetch-content
```

### 2. Install Dependencies

The Edge Function automatically installs:
- `@mozilla/readability@0.5.0`
- `jsdom@24.0.0`

### 3. Test Article Extraction

```bash
# Test the endpoint
curl -X POST \
  https://[YOUR_PROJECT].supabase.co/functions/v1/fetch-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_KEY]" \
  -d '{"url": "https://realpython.com/python-basics", "extractContent": true}'
```

### 4. Verify Frontend

1. Generate learning plan with Python topic
2. Find "reading" type resource
3. Click "Read Full Article Inline"
4. Verify content displays correctly
5. Test collapse/expand
6. Check error handling with invalid URL

---

## Comparison: Before & After

### Before: Link-Based

**Limitations**:
- Users leave platform → context loss
- Can't track article reading
- Distracting ads/popups on external sites
- Inconsistent formatting
- Browser tab overload

### After: Inline Extraction

**Benefits**:
- ✅ Content displayed inline
- ✅ Clean, distraction-free reading
- ✅ Consistent beautiful formatting
- ✅ Reading time estimates
- ✅ Progress tracking
- ✅ No external navigation
- ✅ Complete learning sanctuary

---

## Future Enhancements

### Phase 1: Enhanced Extraction ✅ DONE
- Readability.js integration
- Backend CORS proxy
- Preview/expand UI
- Error handling

### Phase 2: Advanced Features
- [ ] Highlight and save annotations
- [ ] Text-to-speech for articles
- [ ] Multi-language translation
- [ ] Summarization with Gemini
- [ ] Key points extraction

### Phase 3: Offline Support
- [ ] Cache articles in IndexedDB
- [ ] Offline reading mode
- [ ] Download as PDF
- [ ] Sync across devices

### Phase 4: Social Features
- [ ] Share annotations
- [ ] Discuss specific paragraphs
- [ ] Community highlights
- [ ] Collaborative reading

---

## Code References

| File | Purpose | Key Functions |
|------|---------|---------------|
| [`supabase/functions/fetch-content/index.ts`](../supabase/functions/fetch-content/index.ts) | Content fetching API | CORS proxy, Readability extraction |
| [`src/components/ArticleContent.tsx`](../src/components/ArticleContent.tsx) | Article UI component | Preview/expand, reading time, caching |
| [`src/components/ResourceCard.tsx:109-111`](../src/components/ResourceCard.tsx#L109-L111) | Integration | Conditional rendering logic |
| [`supabase/functions/generate-learning-plan/index.ts:447-452`](../supabase/functions/generate-learning-plan/index.ts#L447-L452) | Gemini prompt | Inline content priority |

---

## Summary

InfinUp now provides a **complete inline learning experience**:

- 🎥 **YouTube videos** → Embedded player
- 📄 **PDF documents** → Embedded viewer
- 💻 **Interactive code** → Embedded sandbox
- 📖 **Articles** → Extracted & displayed inline with Readability.js

**Result**: A true learning sanctuary where users never need to leave the platform. Everything they need to learn is beautifully rendered, distraction-free, and progress-tracked — all in one sacred space for growth.

---

## Related Documentation

- [Universal Embedding System](./UNIVERSAL_EMBEDDING_SYSTEM.md)
- [YouTube Embedding Fix](./YOUTUBE_EMBEDDING_FIX.md)
- [ML Optimization Principles](./ML_OPTIMIZATION_PRINCIPLES.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
