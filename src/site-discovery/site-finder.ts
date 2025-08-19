import { GoogleSearchScraper } from '../google-search/scraper';

export interface SiteDiscoveryResult {
  platform: string;
  domain: string;
  category: 'professional' | 'social' | 'business' | 'educational' | 'portfolio' | 'news' | 'directory';
  trustScore: number; // 1-100
  searchPriority: number; // 1-10 (10 = highest priority)
}

export class SiteDiscoveryEngine {
  private static KNOWN_PLATFORMS: SiteDiscoveryResult[] = [
    // Professional Networks
    { platform: 'LinkedIn', domain: 'linkedin.com', category: 'professional', trustScore: 95, searchPriority: 10 },
    { platform: 'AngelList', domain: 'angel.co', category: 'professional', trustScore: 85, searchPriority: 8 },
    { platform: 'Crunchbase', domain: 'crunchbase.com', category: 'business', trustScore: 90, searchPriority: 9 },
    { platform: 'ZoomInfo', domain: 'zoominfo.com', category: 'business', trustScore: 85, searchPriority: 7 },
    
    // Social Media
    { platform: 'Twitter/X', domain: 'twitter.com', category: 'social', trustScore: 80, searchPriority: 9 },
    { platform: 'Facebook', domain: 'facebook.com', category: 'social', trustScore: 85, searchPriority: 8 },
    { platform: 'Instagram', domain: 'instagram.com', category: 'social', trustScore: 75, searchPriority: 7 },
    { platform: 'YouTube', domain: 'youtube.com', category: 'social', trustScore: 80, searchPriority: 8 },
    { platform: 'TikTok', domain: 'tiktok.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Snapchat', domain: 'snapchat.com', category: 'social', trustScore: 65, searchPriority: 5 },
    
    // Professional Portfolios
    { platform: 'GitHub', domain: 'github.com', category: 'portfolio', trustScore: 90, searchPriority: 9 },
    { platform: 'GitLab', domain: 'gitlab.com', category: 'portfolio', trustScore: 85, searchPriority: 7 },
    { platform: 'Behance', domain: 'behance.net', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'Dribbble', domain: 'dribbble.com', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'DeviantArt', domain: 'deviantart.com', category: 'portfolio', trustScore: 70, searchPriority: 6 },
    { platform: 'Medium', domain: 'medium.com', category: 'portfolio', trustScore: 85, searchPriority: 8 },
    { platform: 'Personal Website', domain: 'personal', category: 'portfolio', trustScore: 95, searchPriority: 10 },
    
    // Business & Company Sites
    { platform: 'Company Website', domain: 'company', category: 'business', trustScore: 95, searchPriority: 10 },
    { platform: 'About.me', domain: 'about.me', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Linktree', domain: 'linktr.ee', category: 'portfolio', trustScore: 70, searchPriority: 6 },
    
    // Educational
    { platform: 'ResearchGate', domain: 'researchgate.net', category: 'educational', trustScore: 90, searchPriority: 8 },
    { platform: 'Academia.edu', domain: 'academia.edu', category: 'educational', trustScore: 85, searchPriority: 7 },
    { platform: 'ORCID', domain: 'orcid.org', category: 'educational', trustScore: 95, searchPriority: 9 },
    { platform: 'Google Scholar', domain: 'scholar.google.com', category: 'educational', trustScore: 95, searchPriority: 9 },
    
    // Professional Services
    { platform: 'Upwork', domain: 'upwork.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'Fiverr', domain: 'fiverr.com', category: 'professional', trustScore: 75, searchPriority: 6 },
    { platform: 'Freelancer', domain: 'freelancer.com', category: 'professional', trustScore: 70, searchPriority: 6 },
    
    // News & Media
    { platform: 'News Articles', domain: 'news', category: 'news', trustScore: 85, searchPriority: 8 },
    { platform: 'Press Releases', domain: 'press', category: 'news', trustScore: 80, searchPriority: 7 },
    
    // Directories
    { platform: 'Whitepages', domain: 'whitepages.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    { platform: 'Spokeo', domain: 'spokeo.com', category: 'directory', trustScore: 65, searchPriority: 5 },
    { platform: 'BeenVerified', domain: 'beenverified.com', category: 'directory', trustScore: 65, searchPriority: 5 },
    { platform: 'TruePeopleSearch', domain: 'truepeoplesearch.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    
    // Industry Specific
    { platform: 'Stack Overflow', domain: 'stackoverflow.com', category: 'professional', trustScore: 90, searchPriority: 8 },
    { platform: 'Kaggle', domain: 'kaggle.com', category: 'professional', trustScore: 85, searchPriority: 7 },
    { platform: 'HackerRank', domain: 'hackerrank.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'LeetCode', domain: 'leetcode.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    
    // Creative/Entertainment
    { platform: 'Vimeo', domain: 'vimeo.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'SoundCloud', domain: 'soundcloud.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'Spotify', domain: 'open.spotify.com', category: 'social', trustScore: 70, searchPriority: 6 },
    
    // Regional/International
    { platform: 'Xing', domain: 'xing.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'VKontakte', domain: 'vk.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Weibo', domain: 'weibo.com', category: 'social', trustScore: 70, searchPriority: 6 },
  ];

  public static getSearchSites(priority: 'high' | 'medium' | 'all' = 'high'): string[] {
    let sites = SiteDiscoveryEngine.KNOWN_PLATFORMS;
    
    switch (priority) {
      case 'high':
        sites = sites.filter(site => site.searchPriority >= 8);
        break;
      case 'medium':
        sites = sites.filter(site => site.searchPriority >= 6);
        break;
      // 'all' includes everything
    }
    
    return sites
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .map(site => site.domain)
      .filter(domain => !['personal', 'company', 'news', 'press'].includes(domain)); // Filter out generic categories
  }

  public static getSiteInfo(domain: string): SiteDiscoveryResult | undefined {
    return SiteDiscoveryEngine.KNOWN_PLATFORMS.find(platform => 
      domain.includes(platform.domain) || platform.domain.includes(domain)
    );
  }

  public static async discoverPersonalWebsites(
    firstName: string, 
    lastName: string, 
    email: string,
    googleScraper: GoogleSearchScraper
  ): Promise<string[]> {
    const personalWebsiteQueries = [
      `"${firstName} ${lastName}" site:*.com`,
      `"${firstName} ${lastName}" portfolio`,
      `"${firstName} ${lastName}" personal website`,
      `"${firstName} ${lastName}" blog`,
      `${email} site:*.com -site:linkedin.com -site:facebook.com`,
      `"${firstName} ${lastName}" resume CV`,
    ];

    const discoveredSites: string[] = [];

    for (const query of personalWebsiteQueries) {
      try {
        const results = await googleScraper.searchGoogle(query, { maxResults: 5 });
        
        for (const result of results) {
          // Check if this looks like a personal website
          if (SiteDiscoveryEngine.isLikelyPersonalWebsite(result.domain, result.title, result.snippet)) {
            if (!discoveredSites.includes(result.domain)) {
              discoveredSites.push(result.domain);
            }
          }
        }
      } catch (error) {
        console.log(`Failed to search for personal websites with query: ${query}`);
      }
    }

    return discoveredSites.slice(0, 10); // Limit to 10 personal sites
  }

  private static isLikelyPersonalWebsite(domain: string, title: string, snippet: string): boolean {
    // Skip known platforms
    if (SiteDiscoveryEngine.KNOWN_PLATFORMS.some(platform => domain.includes(platform.domain))) {
      return false;
    }

    // Check for personal website indicators
    const personalIndicators = [
      'portfolio', 'personal', 'resume', 'cv', 'about me', 'bio', 'homepage',
      'blog', 'journal', 'diary', 'writing', 'author', 'artist', 'designer',
      'developer', 'consultant', 'freelancer', 'professional'
    ];

    const text = `${title} ${snippet}`.toLowerCase();
    
    return personalIndicators.some(indicator => text.includes(indicator)) ||
           domain.split('.').length === 2; // Simple domain like johndoe.com
  }

  public static generateSearchQueries(firstName: string, lastName: string, email: string): string[] {
    const sites = SiteDiscoveryEngine.getSearchSites('all');
    const baseQueries = [
      `"${firstName} ${lastName}"`,
      `"${firstName} ${lastName}" "${email}"`,
      `"${firstName} ${lastName}" contact`,
      `"${firstName} ${lastName}" profile`,
      `"${firstName} ${lastName}" bio`,
      `"${firstName} ${lastName}" about`,
    ];

    const siteSpecificQueries: string[] = [];
    
    // Generate site-specific queries for high-priority sites
    const highPrioritySites = SiteDiscoveryEngine.getSearchSites('high');
    for (const site of highPrioritySites) {
      siteSpecificQueries.push(`"${firstName} ${lastName}" site:${site}`);
    }

    // Add email-specific queries
    const emailQueries = [
      `"${email}"`,
      `"${email}" -site:linkedin.com`,
      `"${email}" contact`,
      `"${email}" profile`,
    ];

    return [
      ...baseQueries,
      ...siteSpecificQueries,
      ...emailQueries
    ];
  }
}
