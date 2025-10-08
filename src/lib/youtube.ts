/**
 * YouTube Embedding Utilities
 *
 * Extracts video IDs from YouTube URLs and generates safe embed URLs
 * for client-side rendering (bypasses bot detection)
 */

export interface YouTubeVideoInfo {
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
  isValid: boolean;
}

/**
 * Extracts YouTube video ID from various URL formats
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Standard youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      // /watch?v=VIDEO_ID format
      const vParam = urlObj.searchParams.get('v');
      if (vParam) return vParam;

      // /embed/VIDEO_ID or /v/VIDEO_ID format
      const pathMatch = urlObj.pathname.match(/\/(embed|v)\/([^/?]+)/);
      if (pathMatch) return pathMatch[2];
    }

    // Short youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1).split('/')[0];
      if (videoId) return videoId;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse YouTube URL:', error);
    return null;
  }
}

/**
 * Checks if a URL is a YouTube video URL
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname === 'youtu.be';
  } catch {
    return false;
  }
}

/**
 * Gets YouTube video information for embedding
 */
export function getYouTubeVideoInfo(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    isValid: true,
  };
}

/**
 * Validates YouTube video ID format
 * YouTube video IDs are typically 11 characters (alphanumeric, -, _)
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * Creates a YouTube embed iframe element attributes
 */
export function getYouTubeEmbedProps(videoId: string) {
  return {
    width: '100%',
    height: '315',
    src: `https://www.youtube.com/embed/${videoId}`,
    title: 'YouTube video player',
    frameBorder: '0',
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullScreen: true,
  };
}
