/**
 * URL Validation and Normalization for Person Identification
 * 
 * This module provides comprehensive URL validation to filter out generic pages
 * and normalize social media URLs for consistent person identification.
 */

interface ProfilePatterns {
  pattern: RegExp;
  platform: string;
  extractHandle: (url: string) => string | null;
}

interface URLValidationResult {
  isValid: boolean;
  isPersonProfile: boolean;
  platform?: string;
  handle?: string;
  normalizedUrl?: string;
  reason?: string;
}

export class URLValidator {
  // Whitelist patterns for genuine profile URLs
  private static readonly PROFILE_PATTERNS: ProfilePatterns[] = [
    {
      pattern: /^https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?$/,
      platform: 'Instagram',
      extractHandle: (url) => {
        const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/?$/,
      platform: 'GitHub',
      extractHandle: (url) => {
        const match = url.match(/github\.com\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9_.]+)\/?$/,
      platform: 'Facebook',
      extractHandle: (url) => {
        const match = url.match(/facebook\.com\/([a-zA-Z0-9_.]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)\/?$/,
      platform: 'LinkedIn',
      extractHandle: (url) => {
        const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/?$/,
      platform: 'Twitter',
      extractHandle: (url) => {
        const match = url.match(/twitter\.com\/([a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?x\.com\/([a-zA-Z0-9_]+)\/?$/,
      platform: 'X',
      extractHandle: (url) => {
        const match = url.match(/x\.com\/([a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)\/?$/,
      platform: 'TikTok',
      extractHandle: (url) => {
        const match = url.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)\/?$/,
      platform: 'YouTube',
      extractHandle: (url) => {
        const match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
      }
    },
    {
      pattern: /^https?:\/\/(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)\/?$/,
      platform: 'YouTube',
      extractHandle: (url) => {
        const match = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
      }
    }
  ];

  // Blacklist patterns for non-person pages
  private static readonly BLACKLIST_PATTERNS = [
    // Generic platform pages
    /\/login\/?$/i,
    /\/register\/?$/i,
    /\/signup\/?$/i,
    /\/features\/?$/i,
    /\/enterprise\/?$/i,
    /\/business\/?$/i,
    /\/help\/?$/i,
    /\/support\/?$/i,
    /\/contact\/?$/i,
    /\/about\/?$/i,
    /\/privacy\/?$/i,
    /\/terms\/?$/i,
    /\/policy\/?$/i,
    /\/legal\/?$/i,
    /\/careers\/?$/i,
    /\/jobs\/?$/i,
    /\/press\/?$/i,
    /\/news\/?$/i,
    /\/blog\/?$/i,
    /\/explore\/?$/i,
    /\/discover\/?$/i,
    /\/trending\/?$/i,
    /\/popular\/?$/i,
    /\/search\/?$/i,
    /\/accounts\/?$/i,
    /\/settings\/?$/i,
    /\/preferences\/?$/i,
    /\/team\/?$/i,
    /\/company\/?$/i,
    /\/organization\/?$/i,
    /\/public\/?$/i,
    /\/directory\/?$/i,
    /\/people\/?$/i,
    /\/profiles\/?$/i,

    // Platform-specific non-person pages
    // Facebook
    /\/pages\//i,
    /\/groups\//i,
    /\/events\//i,
    /\/marketplace\//i,
    /\/gaming\//i,
    /\/watch\//i,
    /\/fundraisers\//i,

    // Instagram
    /\/explore\//i,
    /\/reels\//i,
    /\/stories\//i,
    /\/igtv\//i,
    /\/shopping\//i,

    // GitHub
    /\/features\//i,
    /\/topics\//i,
    /\/trending\//i,
    /\/marketplace\//i,
    /\/sponsors\//i,
    /\/collections\//i,
    /\/organizations\//i,
    /\/enterprises\//i,

    // LinkedIn
    /\/company\//i,
    /\/school\//i,
    /\/showcase\//i,
    /\/jobs\//i,
    /\/groups\//i,
    /\/events\//i,
    /\/learning\//i,
    /\/pub\/dir\//i,

    // YouTube
    /\/watch\?/i,
    /\/playlist\?/i,
    /\/results\?/i,
    /\/feed\//i,
    /\/gaming\//i,
    /\/music\//i,
    /\/shorts\//i,

    // Root domains without specific paths
    /^https?:\/\/(?:www\.)?(instagram|facebook|twitter|linkedin|github|youtube)\.com\/?$/i,

    // Generic query parameters and fragments
    /[?&]utm_/i,
    /[?&]fbclid=/i,
    /[?&]gclid=/i,
    /[?&]ref=/i,
    /[?&]source=/i,
    /[?&]campaign=/i,
    /#.*$/,
  ];

  /**
   * Validates and normalizes a URL for person identification
   */
  static validateURL(url: string): URLValidationResult {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      
      // Check if URL is blacklisted
      const isBlacklisted = this.BLACKLIST_PATTERNS.some(pattern => pattern.test(url));
      if (isBlacklisted) {
        return {
          isValid: false,
          isPersonProfile: false,
          reason: 'URL matches blacklist pattern (generic/non-person page)'
        };
      }

      // Check if URL matches a profile pattern
      for (const profilePattern of this.PROFILE_PATTERNS) {
        if (profilePattern.pattern.test(url)) {
          const handle = profilePattern.extractHandle(url);
          const normalizedUrl = this.normalizeURL(url, profilePattern.platform);
          
          return {
            isValid: true,
            isPersonProfile: true,
            platform: profilePattern.platform,
            handle: handle || undefined,
            normalizedUrl,
            reason: `Valid ${profilePattern.platform} profile`
          };
        }
      }

      // Check for other potentially valid profile URLs
      const domain = urlObj.hostname.toLowerCase();
      if (this.isKnownSocialPlatform(domain)) {
        // It's a social platform but doesn't match our strict patterns
        return {
          isValid: false,
          isPersonProfile: false,
          reason: 'URL is from social platform but doesn\'t match profile pattern'
        };
      }

      // Allow other domains (personal websites, academic, etc.)
      return {
        isValid: true,
        isPersonProfile: false,
        normalizedUrl: this.normalizeURL(url),
        reason: 'Valid non-social platform URL'
      };

    } catch (error) {
      return {
        isValid: false,
        isPersonProfile: false,
        reason: 'Invalid URL format'
      };
    }
  }

  /**
   * Normalizes a URL by removing tracking parameters and canonicalizing format
   */
  static normalizeURL(url: string, platform?: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove common tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                             'fbclid', 'gclid', 'ref', 'source', 'campaign', '_gl', 'mc_cid', 'mc_eid'];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      // Platform-specific normalization
      if (platform) {
        switch (platform.toLowerCase()) {
          case 'instagram':
            // Remove fragment and trailing slash
            urlObj.hash = '';
            break;
          case 'facebook':
            // Remove specific Facebook parameters
            urlObj.searchParams.delete('fref');
            urlObj.searchParams.delete('pnref');
            urlObj.searchParams.delete('_rdc');
            urlObj.searchParams.delete('_rdr');
            break;
          case 'linkedin':
            // Remove LinkedIn-specific parameters
            urlObj.searchParams.delete('trk');
            urlObj.searchParams.delete('trkInfo');
            break;
          case 'github':
            // Remove GitHub-specific parameters
            urlObj.searchParams.delete('tab');
            break;
        }
      }

      // Ensure HTTPS
      urlObj.protocol = 'https:';
      
      // Remove www. prefix for consistency
      if (urlObj.hostname.startsWith('www.')) {
        urlObj.hostname = urlObj.hostname.substring(4);
      }

      // Remove trailing slash if no specific path
      let normalizedUrl = urlObj.toString();
      if (normalizedUrl.endsWith('/') && urlObj.pathname === '/') {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }

      return normalizedUrl;
    } catch (error) {
      return url; // Return original if normalization fails
    }
  }

  /**
   * Checks if domain belongs to a known social platform
   */
  private static isKnownSocialPlatform(domain: string): boolean {
    const socialDomains = [
      'instagram.com', 'facebook.com', 'twitter.com', 'linkedin.com',
      'github.com', 'youtube.com', 'tiktok.com', 'snapchat.com',
      'pinterest.com', 'reddit.com', 'medium.com', 'x.com'
    ];
    
    return socialDomains.some(socialDomain => 
      domain === socialDomain || domain.endsWith('.' + socialDomain)
    );
  }

  /**
   * Extracts and validates social media handles from text
   */
  static extractSocialHandles(text: string): Array<{platform: string, handle: string, confidence: number}> {
    const handles: Array<{platform: string, handle: string, confidence: number}> = [];
    
    // Instagram handle patterns
    const instagramHandles = text.match(/@([a-zA-Z0-9_.]{1,30})/g);
    if (instagramHandles) {
      instagramHandles.forEach(match => {
        const handle = match.substring(1); // Remove @
        if (handle.length >= 3 && handle.length <= 30) {
          handles.push({
            platform: 'Instagram',
            handle: handle,
            confidence: 0.8
          });
        }
      });
    }

    // GitHub username patterns
    const githubURLs = text.match(/github\.com\/([a-zA-Z0-9_-]+)/gi);
    if (githubURLs) {
      githubURLs.forEach(match => {
        const handle = match.split('/').pop();
        if (handle && handle.length >= 1 && handle.length <= 39) {
          handles.push({
            platform: 'GitHub',
            handle: handle,
            confidence: 0.9
          });
        }
      });
    }

    return handles;
  }

  /**
   * Validates if a social handle is genuine (not generic/spam)
   */
  static validateSocialHandle(handle: string, platform: string): boolean {
    // Generic/spam patterns
    const genericPatterns = [
      /^(test|admin|user|temp|demo|sample)$/i,
      /^\d+$/,  // Only numbers
      /^[a-z]\d+$/i,  // Single letter + numbers
      /^(abc|xyz|qwe|asd|zxc)/i,  // Keyboard patterns
      /^(follow|like|subscribe|click)/i,  // Spam-like
    ];

    if (genericPatterns.some(pattern => pattern.test(handle))) {
      return false;
    }

    // Platform-specific validation
    switch (platform.toLowerCase()) {
      case 'instagram':
        return handle.length >= 3 && handle.length <= 30 && !/^[._]/.test(handle);
      case 'github':
        return handle.length >= 1 && handle.length <= 39 && !/^-/.test(handle);
      case 'twitter':
        return handle.length >= 1 && handle.length <= 15;
      default:
        return handle.length >= 3 && handle.length <= 30;
    }
  }
}
