/**
 * Universal Content Embedding System
 *
 * Safely embeds YouTube videos, articles, PDFs, and interactive content
 * All rendering happens client-side to avoid bot detection
 */

import { extractYouTubeVideoId, isYouTubeUrl } from './youtube';

export type ResourceType = 'video' | 'reading' | 'interactive' | 'project';

export interface EmbedInfo {
  canEmbed: boolean;
  embedType: 'youtube' | 'pdf' | 'iframe' | 'link';
  embedUrl?: string;
  safeUrl: string;
  isTrusted: boolean;
}

// Whitelist of domains safe for iframe embedding
const TRUSTED_EMBED_DOMAINS = [
  // Video platforms
  'youtube.com', 'youtu.be', 'vimeo.com',

  // Educational platforms
  'freecodecamp.org', 'khanacademy.org', 'coursera.org', 'edx.org',
  'codecademy.com', 'replit.com', 'codesandbox.io', 'stackblitz.com',

  // Documentation sites
  'developer.mozilla.org', 'docs.python.org', 'reactjs.org', 'react.dev',
  'nodejs.org', 'vuejs.org', 'angular.io', 'svelte.dev',

  // Articles & blogs
  'medium.com', 'dev.to', 'css-tricks.com', 'smashingmagazine.com',
  'freecodecamp.org/news', 'realpython.com',

  // Code repositories
  'github.com', 'gitlab.com', 'gist.github.com',

  // PDF/Document viewers
  'drive.google.com', 'docs.google.com',
];

// Domains that explicitly block iframe embedding
const BLOCKED_EMBED_DOMAINS = [
  'facebook.com', 'twitter.com', 'instagram.com',
  'linkedin.com', 'reddit.com', 'pinterest.com',
  'amazon.com', 'ebay.com',
];

/**
 * Check if a URL is safe and can be embedded
 */
export function canEmbedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');

    // Check if explicitly blocked
    if (BLOCKED_EMBED_DOMAINS.some(domain => hostname.includes(domain))) {
      return false;
    }

    // Check if in trusted list
    return TRUSTED_EMBED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Check if URL is a PDF
 */
export function isPdfUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for safe embedding
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove potentially dangerous query params
    const dangerousParams = ['javascript', 'data', 'vbscript', 'onclick', 'onerror'];
    dangerousParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * Get embedding information for any URL
 */
export function getEmbedInfo(url: string, resourceType: ResourceType): EmbedInfo {
  const safeUrl = sanitizeUrl(url);

  if (!safeUrl) {
    return {
      canEmbed: false,
      embedType: 'link',
      safeUrl: url,
      isTrusted: false,
    };
  }

  // YouTube videos - special handling
  if (isYouTubeUrl(safeUrl)) {
    const videoId = extractYouTubeVideoId(safeUrl);
    return {
      canEmbed: true,
      embedType: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      safeUrl,
      isTrusted: true,
    };
  }

  // PDF files
  if (isPdfUrl(safeUrl)) {
    return {
      canEmbed: true,
      embedType: 'pdf',
      embedUrl: `${safeUrl}#view=fitH`,
      safeUrl,
      isTrusted: canEmbedUrl(safeUrl),
    };
  }

  // Interactive/iframe embeds
  if (canEmbedUrl(safeUrl)) {
    return {
      canEmbed: true,
      embedType: 'iframe',
      embedUrl: safeUrl,
      safeUrl,
      isTrusted: true,
    };
  }

  // Default: external link only
  return {
    canEmbed: false,
    embedType: 'link',
    safeUrl,
    isTrusted: false,
  };
}

/**
 * Generate iframe properties for embedding
 */
export function getIframeProps(embedInfo: EmbedInfo) {
  const baseProps = {
    width: '100%',
    className: 'rounded-lg border',
    frameBorder: '0',
    loading: 'lazy' as const,
  };

  switch (embedInfo.embedType) {
    case 'youtube':
      return {
        ...baseProps,
        height: '315',
        src: embedInfo.embedUrl,
        title: 'YouTube video player',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowFullScreen: true,
      };

    case 'pdf':
      return {
        ...baseProps,
        height: '800',
        src: embedInfo.embedUrl,
        title: 'PDF document viewer',
        allow: '',
      };

    case 'iframe':
      return {
        ...baseProps,
        height: '600',
        src: embedInfo.embedUrl,
        title: 'Embedded content',
        allow: '',
        sandbox: 'allow-scripts allow-same-origin allow-popups allow-forms' as any,
      };

    default:
      return null;
  }
}

/**
 * Check if resource should have embed option
 */
export function shouldShowEmbed(url: string, resourceType: ResourceType): boolean {
  const embedInfo = getEmbedInfo(url, resourceType);

  // Always show embed for videos
  if (resourceType === 'video' && embedInfo.canEmbed) {
    return true;
  }

  // Show embed for interactive content if trusted
  if (resourceType === 'interactive' && embedInfo.canEmbed && embedInfo.isTrusted) {
    return true;
  }

  // Show embed for PDFs
  if (isPdfUrl(url)) {
    return true;
  }

  // Don't show embed for regular reading/articles by default
  // (Most blogs block iframe embedding or look bad in iframes)
  return false;
}

/**
 * Get embed container height based on type
 */
export function getEmbedHeight(embedType: string): string {
  switch (embedType) {
    case 'youtube':
      return 'aspect-video'; // 16:9 ratio
    case 'pdf':
      return 'h-[800px]';
    case 'iframe':
      return 'h-[600px]';
    default:
      return 'h-auto';
  }
}

/**
 * Get user-friendly embed type label
 */
export function getEmbedLabel(embedType: string): string {
  switch (embedType) {
    case 'youtube':
      return '🎥 Video Player';
    case 'pdf':
      return '📄 PDF Viewer';
    case 'iframe':
      return '💻 Interactive Content';
    default:
      return '🔗 Resource';
  }
}
