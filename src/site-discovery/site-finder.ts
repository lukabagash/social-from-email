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
    // Professional Networks (High Priority)
    { platform: 'LinkedIn', domain: 'linkedin.com', category: 'professional', trustScore: 95, searchPriority: 10 },
    { platform: 'AngelList', domain: 'angel.co', category: 'professional', trustScore: 85, searchPriority: 8 },
    { platform: 'Crunchbase', domain: 'crunchbase.com', category: 'business', trustScore: 90, searchPriority: 9 },
    { platform: 'ZoomInfo', domain: 'zoominfo.com', category: 'business', trustScore: 85, searchPriority: 7 },
    { platform: 'Xing', domain: 'xing.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'Apollo.io', domain: 'apollo.io', category: 'business', trustScore: 85, searchPriority: 8 },
    { platform: 'ContactOut', domain: 'contactout.com', category: 'business', trustScore: 80, searchPriority: 7 },
    
    // Social Media (High Priority)
    { platform: 'Twitter/X', domain: 'twitter.com', category: 'social', trustScore: 80, searchPriority: 9 },
    { platform: 'Facebook', domain: 'facebook.com', category: 'social', trustScore: 85, searchPriority: 8 },
    { platform: 'Instagram', domain: 'instagram.com', category: 'social', trustScore: 75, searchPriority: 7 },
    { platform: 'YouTube', domain: 'youtube.com', category: 'social', trustScore: 80, searchPriority: 8 },
    { platform: 'TikTok', domain: 'tiktok.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Snapchat', domain: 'snapchat.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'Reddit', domain: 'reddit.com', category: 'social', trustScore: 80, searchPriority: 7 },
    { platform: 'Pinterest', domain: 'pinterest.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'Tumblr', domain: 'tumblr.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Discord', domain: 'discord.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Telegram', domain: 't.me', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'WhatsApp', domain: 'wa.me', category: 'social', trustScore: 70, searchPriority: 5 },
    { platform: 'Signal', domain: 'signal.org', category: 'social', trustScore: 70, searchPriority: 5 },
    
    // Professional Portfolios (High Priority)
    { platform: 'GitHub', domain: 'github.com', category: 'portfolio', trustScore: 90, searchPriority: 9 },
    { platform: 'GitLab', domain: 'gitlab.com', category: 'portfolio', trustScore: 85, searchPriority: 7 },
    { platform: 'Behance', domain: 'behance.net', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'Dribbble', domain: 'dribbble.com', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'DeviantArt', domain: 'deviantart.com', category: 'portfolio', trustScore: 70, searchPriority: 6 },
    { platform: 'Medium', domain: 'medium.com', category: 'portfolio', trustScore: 85, searchPriority: 8 },
    { platform: 'Substack', domain: 'substack.com', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'Personal Website', domain: 'personal', category: 'portfolio', trustScore: 95, searchPriority: 10 },
    { platform: 'About.me', domain: 'about.me', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Linktree', domain: 'linktr.ee', category: 'portfolio', trustScore: 70, searchPriority: 6 },
    { platform: 'Carrd', domain: 'carrd.co', category: 'portfolio', trustScore: 70, searchPriority: 6 },
    { platform: 'Notion', domain: 'notion.so', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    
    // Business & Company Sites
    { platform: 'Company Website', domain: 'company', category: 'business', trustScore: 95, searchPriority: 10 },
    { platform: 'OpenCorporates', domain: 'opencorporates.com', category: 'business', trustScore: 90, searchPriority: 8 },
    { platform: 'CorporationWiki', domain: 'corporationwiki.com', category: 'business', trustScore: 80, searchPriority: 7 },
    { platform: 'Companies House', domain: 'find-and-update.company-information.service.gov.uk', category: 'business', trustScore: 95, searchPriority: 8 },
    
    // Educational & Academic (High Priority)
    { platform: 'ResearchGate', domain: 'researchgate.net', category: 'educational', trustScore: 90, searchPriority: 8 },
    { platform: 'Academia.edu', domain: 'academia.edu', category: 'educational', trustScore: 85, searchPriority: 7 },
    { platform: 'ORCID', domain: 'orcid.org', category: 'educational', trustScore: 95, searchPriority: 9 },
    { platform: 'Google Scholar', domain: 'scholar.google.com', category: 'educational', trustScore: 95, searchPriority: 9 },
    { platform: 'Semantic Scholar', domain: 'semanticscholar.org', category: 'educational', trustScore: 85, searchPriority: 7 },
    { platform: 'JSTOR', domain: 'jstor.org', category: 'educational', trustScore: 90, searchPriority: 7 },
    { platform: 'PubMed', domain: 'pubmed.ncbi.nlm.nih.gov', category: 'educational', trustScore: 95, searchPriority: 8 },
    { platform: 'arXiv', domain: 'arxiv.org', category: 'educational', trustScore: 90, searchPriority: 7 },
    
    // Professional Services
    { platform: 'Upwork', domain: 'upwork.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'Fiverr', domain: 'fiverr.com', category: 'professional', trustScore: 75, searchPriority: 6 },
    { platform: 'Freelancer', domain: 'freelancer.com', category: 'professional', trustScore: 70, searchPriority: 6 },
    { platform: 'Toptal', domain: 'toptal.com', category: 'professional', trustScore: 85, searchPriority: 7 },
    { platform: 'Guru', domain: 'guru.com', category: 'professional', trustScore: 70, searchPriority: 6 },
    { platform: '99designs', domain: '99designs.com', category: 'professional', trustScore: 75, searchPriority: 6 },
    
    // People Search & Directories
    { platform: 'Whitepages', domain: 'whitepages.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    { platform: 'Spokeo', domain: 'spokeo.com', category: 'directory', trustScore: 65, searchPriority: 5 },
    { platform: 'BeenVerified', domain: 'beenverified.com', category: 'directory', trustScore: 65, searchPriority: 5 },
    { platform: 'TruePeopleSearch', domain: 'truepeoplesearch.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    { platform: 'PeekYou', domain: 'peekyou.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    { platform: 'Pipl', domain: 'pipl.com', category: 'directory', trustScore: 80, searchPriority: 7 },
    { platform: 'SearchBug', domain: 'searchbug.com', category: 'directory', trustScore: 65, searchPriority: 5 },
    { platform: 'FamilyTreeNow', domain: 'familytreenow.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    { platform: 'IDCrawl', domain: 'idcrawl.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    { platform: 'ZabaSearch', domain: 'zabasearch.com', category: 'directory', trustScore: 65, searchPriority: 5 },
    { platform: 'Classmates', domain: 'classmates.com', category: 'directory', trustScore: 70, searchPriority: 6 },
    
    // Technical/Developer Platforms
    { platform: 'Stack Overflow', domain: 'stackoverflow.com', category: 'professional', trustScore: 90, searchPriority: 8 },
    { platform: 'Kaggle', domain: 'kaggle.com', category: 'professional', trustScore: 85, searchPriority: 7 },
    { platform: 'HackerRank', domain: 'hackerrank.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'LeetCode', domain: 'leetcode.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'CodePen', domain: 'codepen.io', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'Replit', domain: 'replit.com', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Observable', domain: 'observablehq.com', category: 'portfolio', trustScore: 80, searchPriority: 6 },
    { platform: 'Glitch', domain: 'glitch.com', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Bitbucket', domain: 'bitbucket.org', category: 'portfolio', trustScore: 80, searchPriority: 6 },
    { platform: 'SourceForge', domain: 'sourceforge.net', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    
    // Creative/Entertainment Platforms
    { platform: 'Vimeo', domain: 'vimeo.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'SoundCloud', domain: 'soundcloud.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'Spotify', domain: 'open.spotify.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Bandcamp', domain: 'bandcamp.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Twitch', domain: 'twitch.tv', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'Patreon', domain: 'patreon.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'Ko-fi', domain: 'ko-fi.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Etsy', domain: 'etsy.com', category: 'business', trustScore: 75, searchPriority: 6 },
    { platform: 'ArtStation', domain: 'artstation.com', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'Flickr', domain: 'flickr.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: '500px', domain: '500px.com', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Unsplash', domain: 'unsplash.com', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Pexels', domain: 'pexels.com', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    
    // Regional/International Social Networks
    { platform: 'VKontakte', domain: 'vk.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Weibo', domain: 'weibo.com', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'QQ', domain: 'qq.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'WeChat', domain: 'wechat.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'Odnoklassniki', domain: 'ok.ru', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'MeWe', domain: 'mewe.com', category: 'social', trustScore: 60, searchPriority: 5 },
    { platform: 'Mastodon', domain: 'mastodon.social', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Gab', domain: 'gab.com', category: 'social', trustScore: 60, searchPriority: 5 },
    { platform: 'Parler', domain: 'parler.com', category: 'social', trustScore: 60, searchPriority: 5 },
    { platform: 'Truth Social', domain: 'truthsocial.com', category: 'social', trustScore: 60, searchPriority: 5 },
    { platform: 'Gettr', domain: 'gettr.com', category: 'social', trustScore: 60, searchPriority: 5 },
    { platform: 'Rumble', domain: 'rumble.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'BitChute', domain: 'bitchute.com', category: 'social', trustScore: 60, searchPriority: 5 },
    
    // Dating & Social Discovery
    { platform: 'Tinder', domain: 'tinder.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'Bumble', domain: 'bumble.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'Match', domain: 'match.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'eHarmony', domain: 'eharmony.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'OkCupid', domain: 'okcupid.com', category: 'social', trustScore: 65, searchPriority: 5 },
    { platform: 'Plenty of Fish', domain: 'pof.com', category: 'social', trustScore: 60, searchPriority: 5 },
    { platform: 'Zoosk', domain: 'zoosk.com', category: 'social', trustScore: 60, searchPriority: 5 },
    
    // Professional/Industry Specific
    { platform: 'AngelList (Wellfound)', domain: 'wellfound.com', category: 'professional', trustScore: 85, searchPriority: 8 },
    { platform: 'ProductHunt', domain: 'producthunt.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'Hacker News', domain: 'news.ycombinator.com', category: 'professional', trustScore: 85, searchPriority: 7 },
    { platform: 'IndieHackers', domain: 'indiehackers.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'Glassdoor', domain: 'glassdoor.com', category: 'professional', trustScore: 85, searchPriority: 7 },
    { platform: 'Indeed', domain: 'indeed.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    { platform: 'Monster', domain: 'monster.com', category: 'professional', trustScore: 75, searchPriority: 6 },
    { platform: 'CareerBuilder', domain: 'careerbuilder.com', category: 'professional', trustScore: 75, searchPriority: 6 },
    { platform: 'ZipRecruiter', domain: 'ziprecruiter.com', category: 'professional', trustScore: 75, searchPriority: 6 },
    { platform: 'SimplyHired', domain: 'simplyhired.com', category: 'professional', trustScore: 70, searchPriority: 6 },
    { platform: 'Dice', domain: 'dice.com', category: 'professional', trustScore: 80, searchPriority: 7 },
    
    // Forums & Communities
    { platform: 'Reddit Communities', domain: 'reddit.com/r/', category: 'social', trustScore: 80, searchPriority: 7 },
    { platform: 'Quora', domain: 'quora.com', category: 'social', trustScore: 80, searchPriority: 7 },
    { platform: 'Stack Exchange', domain: 'stackexchange.com', category: 'professional', trustScore: 85, searchPriority: 7 },
    { platform: 'Discord Servers', domain: 'discord.gg', category: 'social', trustScore: 70, searchPriority: 6 },
    { platform: 'Slack Communities', domain: 'slack.com', category: 'professional', trustScore: 75, searchPriority: 6 },
    
    // News & Media
    { platform: 'News Articles', domain: 'news', category: 'news', trustScore: 85, searchPriority: 8 },
    { platform: 'Press Releases', domain: 'press', category: 'news', trustScore: 80, searchPriority: 7 },
    { platform: 'PR Newswire', domain: 'prnewswire.com', category: 'news', trustScore: 85, searchPriority: 7 },
    { platform: 'Business Wire', domain: 'businesswire.com', category: 'news', trustScore: 85, searchPriority: 7 },
    { platform: 'EIN Presswire', domain: 'einpresswire.com', category: 'news', trustScore: 75, searchPriority: 6 },
    
    // Specialized Professional Networks
    { platform: 'Meetup', domain: 'meetup.com', category: 'social', trustScore: 80, searchPriority: 7 },
    { platform: 'Eventbrite', domain: 'eventbrite.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'Shapr', domain: 'shapr.co', category: 'professional', trustScore: 70, searchPriority: 6 },
    { platform: 'Bumble Bizz', domain: 'bumble.com/bizz', category: 'professional', trustScore: 70, searchPriority: 6 },
    { platform: 'Opportunity', domain: 'opportunity.com', category: 'professional', trustScore: 70, searchPriority: 6 },
    
    // Gaming & Streaming
    { platform: 'Steam', domain: 'steamcommunity.com', category: 'social', trustScore: 75, searchPriority: 6 },
    { platform: 'Xbox Live', domain: 'xbox.com', category: 'social', trustScore: 70, searchPriority: 5 },
    { platform: 'PlayStation Network', domain: 'playstation.com', category: 'social', trustScore: 70, searchPriority: 5 },
    { platform: 'Epic Games', domain: 'epicgames.com', category: 'social', trustScore: 70, searchPriority: 5 },
    { platform: 'Discord Gaming', domain: 'discord.com', category: 'social', trustScore: 70, searchPriority: 6 },
    
    // Blogging & Writing Platforms
    { platform: 'WordPress', domain: 'wordpress.com', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    { platform: 'Blogger', domain: 'blogger.com', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Ghost', domain: 'ghost.org', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Wix', domain: 'wix.com', category: 'portfolio', trustScore: 70, searchPriority: 6 },
    { platform: 'Squarespace', domain: 'squarespace.com', category: 'portfolio', trustScore: 75, searchPriority: 6 },
    { platform: 'Webflow', domain: 'webflow.com', category: 'portfolio', trustScore: 80, searchPriority: 7 },
    
    // E-commerce & Marketplaces
    { platform: 'eBay', domain: 'ebay.com', category: 'business', trustScore: 80, searchPriority: 6 },
    { platform: 'Amazon Seller', domain: 'amazon.com/sp', category: 'business', trustScore: 85, searchPriority: 7 },
    { platform: 'Shopify', domain: 'myshopify.com', category: 'business', trustScore: 80, searchPriority: 6 },
    { platform: 'Mercari', domain: 'mercari.com', category: 'business', trustScore: 70, searchPriority: 5 },
    { platform: 'Poshmark', domain: 'poshmark.com', category: 'business', trustScore: 70, searchPriority: 5 },
    { platform: 'Depop', domain: 'depop.com', category: 'business', trustScore: 70, searchPriority: 5 },
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
    const emailDomain = email.split('@')[1];
    const emailLocalPart = email.split('@')[0];
    
    const personalWebsiteQueries = [
      `"${firstName} ${lastName}" site:*.com`,
      `"${firstName} ${lastName}" site:*.org`,
      `"${firstName} ${lastName}" site:*.net`,
      `"${firstName} ${lastName}" site:*.io`,
      `"${firstName} ${lastName}" site:*.me`,
      `"${firstName} ${lastName}" portfolio`,
      `"${firstName} ${lastName}" personal website`,
      `"${firstName} ${lastName}" blog`,
      `"${firstName} ${lastName}" homepage`,
      `"${firstName} ${lastName}" www.`,
      `${email} site:*.com -site:linkedin.com -site:facebook.com -site:twitter.com`,
      `"${firstName} ${lastName}" resume CV`,
      `"${firstName} ${lastName}" about me`,
      `"${firstName}.${lastName.toLowerCase()}.com"`,
      `"${firstName.toLowerCase()}${lastName.toLowerCase()}.com"`,
      `"${emailLocalPart}.com"`,
      `"${emailLocalPart}.org"`,
      `"${emailLocalPart}.net"`,
      `"${emailLocalPart}.io"`,
      `"${firstName} ${lastName}" "personal site"`,
      `"${firstName} ${lastName}" "my website"`,
      `"${firstName} ${lastName}" "my site"`,
      `"${firstName} ${lastName}" "my blog"`,
      `"${firstName} ${lastName}" "my portfolio"`,
      // Domain pattern searches
      `site:${firstName.toLowerCase()}${lastName.toLowerCase()}.com`,
      `site:${firstName.toLowerCase()}.${lastName.toLowerCase()}.com`,
      `site:${firstName.toLowerCase()}-${lastName.toLowerCase()}.com`,
      `site:${emailLocalPart}.com`,
      `site:${emailLocalPart}.org`,
      `site:${emailLocalPart}.net`,
      `site:${emailLocalPart}.io`,
      `site:${emailLocalPart}.me`,
      // Professional portfolio queries
      `"${firstName} ${lastName}" "web developer"`,
      `"${firstName} ${lastName}" "software engineer"`,
      `"${firstName} ${lastName}" "designer"`,
      `"${firstName} ${lastName}" "consultant"`,
      `"${firstName} ${lastName}" "freelancer"`,
      `"${firstName} ${lastName}" "photographer"`,
      `"${firstName} ${lastName}" "artist"`,
      `"${firstName} ${lastName}" "writer"`,
      `"${firstName} ${lastName}" "author"`,
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
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return discoveredSites.slice(0, 15); // Limit to 15 personal sites
  }

  private static isLikelyPersonalWebsite(domain: string, title: string, snippet: string): boolean {
    // Skip known platforms
    if (SiteDiscoveryEngine.KNOWN_PLATFORMS.some(platform => domain.includes(platform.domain))) {
      return false;
    }

    // Skip common non-personal domains
    const excludeDomains = [
      'google.', 'microsoft.', 'apple.', 'amazon.', 'facebook.', 'twitter.', 'instagram.',
      'youtube.', 'wikipedia.', 'reddit.', 'stackoverflow.', 'github.', 'linkedin.',
      'craigslist.', 'indeed.', 'glassdoor.', 'monster.', 'careerbuilder.',
      'whitepages.', 'spokeo.', 'beenverified.', 'truthfinder.', 'intelius.',
      'yellowpages.', 'superpages.', 'yelp.', 'foursquare.', 'zomato.',
      'bloomberg.', 'reuters.', 'cnn.', 'bbc.', 'forbes.', 'techcrunch.',
      'news.', 'press.', 'media.', 'blog.', 'wordpress.', 'blogspot.',
      'tumblr.', 'medium.', 'substack.', 'ghost.', 'squarespace.', 'wix.',
      'godaddy.', 'namecheap.', 'hostgator.', 'bluehost.', 'siteground.',
      'cloudflare.', 'aws.', 'azure.', 'gcp.', 'heroku.', 'netlify.',
      'vercel.', 'firebase.', 'github.io', 'gitlab.io', 'bitbucket.io'
    ];

    if (excludeDomains.some(excludeDomain => domain.includes(excludeDomain))) {
      return false;
    }

    // Check for personal website indicators
    const personalIndicators = [
      'portfolio', 'personal', 'resume', 'cv', 'about me', 'bio', 'homepage',
      'blog', 'journal', 'diary', 'writing', 'author', 'artist', 'designer',
      'developer', 'consultant', 'freelancer', 'professional', 'photographer',
      'writer', 'musician', 'filmmaker', 'director', 'producer', 'actor',
      'coach', 'trainer', 'speaker', 'expert', 'specialist', 'founder',
      'entrepreneur', 'ceo', 'cto', 'cfo', 'vp', 'director', 'manager',
      'engineer', 'architect', 'scientist', 'researcher', 'professor',
      'dr.', 'phd', 'md', 'lawyer', 'attorney', 'realtor', 'agent'
    ];

    const text = `${title} ${snippet}`.toLowerCase();
    
    // Strong indicators for personal websites
    const strongPersonalIndicators = [
      'my portfolio', 'my website', 'my site', 'my blog', 'my work',
      'personal site', 'personal website', 'personal blog', 'personal page',
      'about me', 'my resume', 'my cv', 'my profile', 'my story',
      'welcome to my', 'this is my', 'my name is', 'i am a', 'i am an'
    ];

    const hasStrongIndicator = strongPersonalIndicators.some(indicator => 
      text.includes(indicator)
    );

    const hasPersonalIndicator = personalIndicators.some(indicator => 
      text.includes(indicator)
    );

    // Check domain structure - simple personal domains
    const isSimpleDomain = domain.split('.').length === 2 && 
                          !domain.includes('www.') &&
                          (domain.endsWith('.com') || domain.endsWith('.org') || 
                           domain.endsWith('.net') || domain.endsWith('.io') || 
                           domain.endsWith('.me') || domain.endsWith('.dev'));

    // Return true if we have strong indicators or combination of factors
    return hasStrongIndicator || (hasPersonalIndicator && isSimpleDomain) || 
           (isSimpleDomain && text.length > 50); // Longer descriptions often indicate personal sites
  }

  // New method for advanced OSINT search queries
  public static generateAdvancedOSINTQueries(firstName: string, lastName: string, email: string): string[] {
    const emailDomain = email.split('@')[1];
    const emailLocalPart = email.split('@')[0];
    
    return [
      // Advanced Google Dorks
      `intitle:"${firstName} ${lastName}"`,
      `inurl:"${firstName.toLowerCase()}-${lastName.toLowerCase()}"`,
      `inurl:"${firstName.toLowerCase()}.${lastName.toLowerCase()}"`,
      `inurl:"${firstName.toLowerCase()}${lastName.toLowerCase()}"`,
      `inurl:"${emailLocalPart}"`,
      `"${firstName} ${lastName}" -site:linkedin.com -site:facebook.com -site:twitter.com`,
      
      // Professional directory searches
      `"${firstName} ${lastName}" "professional profile"`,
      `"${firstName} ${lastName}" "team member"`,
      `"${firstName} ${lastName}" "staff"`,
      `"${firstName} ${lastName}" "employee"`,
      `"${firstName} ${lastName}" "biography"`,
      `"${firstName} ${lastName}" "credentials"`,
      
      // Contact information searches
      `"${firstName} ${lastName}" phone`,
      `"${firstName} ${lastName}" contact`,
      `"${firstName} ${lastName}" email`,
      `"${firstName} ${lastName}" address`,
      `"${firstName} ${lastName}" location`,
      
      // Social presence indicators
      `"${firstName} ${lastName}" "@${emailLocalPart}"`,
      `"${firstName} ${lastName}" "follow me"`,
      `"${firstName} ${lastName}" "connect with me"`,
      `"${firstName} ${lastName}" "social media"`,
      `"${firstName} ${lastName}" "find me on"`,
      
      // Professional achievements
      `"${firstName} ${lastName}" award`,
      `"${firstName} ${lastName}" recognition`,
      `"${firstName} ${lastName}" achievement`,
      `"${firstName} ${lastName}" certification`,
      `"${firstName} ${lastName}" license`,
      
      // Event and speaking engagements
      `"${firstName} ${lastName}" speaker`,
      `"${firstName} ${lastName}" presentation`,
      `"${firstName} ${lastName}" conference`,
      `"${firstName} ${lastName}" workshop`,
      `"${firstName} ${lastName}" seminar`,
      `"${firstName} ${lastName}" webinar`,
      
      // Media appearances
      `"${firstName} ${lastName}" interview`,
      `"${firstName} ${lastName}" podcast`,
      `"${firstName} ${lastName}" video`,
      `"${firstName} ${lastName}" youtube`,
      `"${firstName} ${lastName}" featured`,
      
      // Educational background
      `"${firstName} ${lastName}" graduated`,
      `"${firstName} ${lastName}" alumni`,
      `"${firstName} ${lastName}" university`,
      `"${firstName} ${lastName}" college`,
      `"${firstName} ${lastName}" degree`,
      `"${firstName} ${lastName}" education`,
      
      // Professional associations
      `"${firstName} ${lastName}" member`,
      `"${firstName} ${lastName}" association`,
      `"${firstName} ${lastName}" organization`,
      `"${firstName} ${lastName}" society`,
      `"${firstName} ${lastName}" board`,
      
      // Creative and artistic work
      `"${firstName} ${lastName}" artwork`,
      `"${firstName} ${lastName}" exhibition`,
      `"${firstName} ${lastName}" gallery`,
      `"${firstName} ${lastName}" photography`,
      `"${firstName} ${lastName}" creative`,
      
      // Publications and writing
      `"${firstName} ${lastName}" article`,
      `"${firstName} ${lastName}" blog post`,
      `"${firstName} ${lastName}" published`,
      `"${firstName} ${lastName}" author`,
      `"${firstName} ${lastName}" writer`,
      
      // Patents and intellectual property
      `"${firstName} ${lastName}" patent`,
      `"${firstName} ${lastName}" invention`,
      `"${firstName} ${lastName}" trademark`,
      `"${firstName} ${lastName}" copyright`,
      
      // Business and entrepreneurship
      `"${firstName} ${lastName}" startup`,
      `"${firstName} ${lastName}" founder`,
      `"${firstName} ${lastName}" entrepreneur`,
      `"${firstName} ${lastName}" business owner`,
      `"${firstName} ${lastName}" company`,
      
      // Legal and court records
      `"${firstName} ${lastName}" court`,
      `"${firstName} ${lastName}" legal`,
      `"${firstName} ${lastName}" lawsuit`,
      `"${firstName} ${lastName}" plaintiff`,
      `"${firstName} ${lastName}" defendant`,
      
      // Real estate and property
      `"${firstName} ${lastName}" property`,
      `"${firstName} ${lastName}" real estate`,
      `"${firstName} ${lastName}" home`,
      `"${firstName} ${lastName}" address`,
      `"${firstName} ${lastName}" residence`,
      
      // Financial and investment
      `"${firstName} ${lastName}" investor`,
      `"${firstName} ${lastName}" investment`,
      `"${firstName} ${lastName}" funding`,
      `"${firstName} ${lastName}" financial`,
      
      // Government and public records
      `"${firstName} ${lastName}" government`,
      `"${firstName} ${lastName}" public record`,
      `"${firstName} ${lastName}" official`,
      `"${firstName} ${lastName}" elected`,
      `"${firstName} ${lastName}" appointed`,
    ];
  }

  // Method to get category-specific search queries
  public static getCategoryQueries(firstName: string, lastName: string, email: string, category: string): string[] {
    switch (category) {
      case 'professional':
        return [
          `"${firstName} ${lastName}" site:linkedin.com`,
          `"${firstName} ${lastName}" site:crunchbase.com`,
          `"${firstName} ${lastName}" site:angel.co`,
          `"${firstName} ${lastName}" site:apollo.io`,
          `"${firstName} ${lastName}" site:zoominfo.com`,
          `"${firstName} ${lastName}" resume`,
          `"${firstName} ${lastName}" CV`,
          `"${firstName} ${lastName}" professional`,
          `"${firstName} ${lastName}" experience`,
          `"${firstName} ${lastName}" career`,
        ];
      
      case 'social':
        return [
          `"${firstName} ${lastName}" site:twitter.com`,
          `"${firstName} ${lastName}" site:facebook.com`,
          `"${firstName} ${lastName}" site:instagram.com`,
          `"${firstName} ${lastName}" site:youtube.com`,
          `"${firstName} ${lastName}" site:tiktok.com`,
          `"${firstName} ${lastName}" site:reddit.com`,
          `"${firstName} ${lastName}" social media`,
          `"${firstName} ${lastName}" follow`,
          `"${firstName} ${lastName}" @`,
        ];
      
      case 'educational':
        return [
          `"${firstName} ${lastName}" site:researchgate.net`,
          `"${firstName} ${lastName}" site:academia.edu`,
          `"${firstName} ${lastName}" site:orcid.org`,
          `"${firstName} ${lastName}" site:scholar.google.com`,
          `"${firstName} ${lastName}" university`,
          `"${firstName} ${lastName}" research`,
          `"${firstName} ${lastName}" publication`,
          `"${firstName} ${lastName}" paper`,
          `"${firstName} ${lastName}" academic`,
        ];
      
      case 'business':
        return [
          `"${firstName} ${lastName}" company`,
          `"${firstName} ${lastName}" business`,
          `"${firstName} ${lastName}" founder`,
          `"${firstName} ${lastName}" CEO`,
          `"${firstName} ${lastName}" startup`,
          `"${firstName} ${lastName}" entrepreneur`,
          `"${firstName} ${lastName}" corporate`,
          `"${firstName} ${lastName}" executive`,
        ];
      
      default:
        return SiteDiscoveryEngine.generateSearchQueries(firstName, lastName, email);
    }
  }

  /**
   * Generate prioritized search queries with different priority levels
   * @param firstName - Person's first name
   * @param lastName - Person's last name  
   * @param email - Person's email address
   * @param priority - Priority level: 'social-first' (default), 'professional', 'comprehensive'
   * @returns Array of search queries optimized for the specified priority
   */
  public static generatePrioritizedQueries(
    firstName: string, 
    lastName: string, 
    email: string, 
    priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first'
  ): string[] {
    const emailDomain = email.split('@')[1];
    const emailLocalPart = email.split('@')[0];
    
    switch (priority) {
      case 'social-first':
        return [
          // Immediate social media wins
          `"${firstName} ${lastName}"`,
          `"${firstName} ${lastName}" site:linkedin.com`,
          `"${firstName} ${lastName}" site:twitter.com`,
          `"${firstName} ${lastName}" site:facebook.com`,
          `"${firstName} ${lastName}" site:instagram.com`,
          `"${firstName} ${lastName}" site:github.com`,
          `"${firstName} ${lastName}" profile`,
          `"${firstName} ${lastName}" contact`,
          // Username patterns (high success)
          `"${firstName.toLowerCase()}.${lastName.toLowerCase()}"`,
          `"${firstName.toLowerCase()}_${lastName.toLowerCase()}"`,
          `"${emailLocalPart}"`,
          // Professional basics
          `"${firstName} ${lastName}" work`,
          `"${firstName} ${lastName}" company`,
          `"${firstName} ${lastName}" developer`,
          `"${firstName} ${lastName}" CEO`,
        ];
        
      case 'professional':
        return [
          // Professional focus
          `"${firstName} ${lastName}"`,
          `"${firstName} ${lastName}" site:linkedin.com`,
          `"${firstName} ${lastName}" site:crunchbase.com`,
          `"${firstName} ${lastName}" site:github.com`,
          `"${firstName} ${lastName}" resume`,
          `"${firstName} ${lastName}" CV`,
          `"${firstName} ${lastName}" portfolio`,
          `"${firstName} ${lastName}" company`,
          `"${firstName} ${lastName}" founder`,
          `"${firstName} ${lastName}" CEO`,
          `"${firstName} ${lastName}" director`,
          `"${firstName} ${lastName}" experience`,
          `"${firstName} ${lastName}" "${emailDomain.replace('.com', '').replace('.org', '')}"`,
          `"${email}"`,
        ];
        
      case 'comprehensive':
      default:
        return SiteDiscoveryEngine.generateSearchQueries(firstName, lastName, email);
    }
  }

  public static generateSearchQueries(firstName: string, lastName: string, email: string): string[] {
    const sites = SiteDiscoveryEngine.getSearchSites('all');
    
    // Base queries with name + keywords (original 15 searches)
    const baseQueries = [
      `"${firstName} ${lastName}"`,
      `"${firstName} ${lastName}" contact`,
      `"${firstName} ${lastName}" profile`,
      `"${firstName} ${lastName}" bio`,
      `"${firstName} ${lastName}" about`,
      `"${firstName} ${lastName}" resume`,
      `"${firstName} ${lastName}" CV`,
      `"${firstName} ${lastName}" portfolio`,
      `"${firstName} ${lastName}" work`,
      `"${firstName} ${lastName}" experience`,
      `"${firstName} ${lastName}" background`,
      `"${firstName} ${lastName}" founder`,
      `"${firstName} ${lastName}" CEO`,
      `"${firstName} ${lastName}" director`,
      `"${firstName} ${lastName}" developer`,
    ];

    // Enhanced email-based queries
    const emailBasedQueries = [
      `"${firstName} ${lastName}" "${email}"`,
      `"${email}"`,
      `"${email}" profile`,
      `"${email}" contact`,
      `"${email}" about`,
      `"${email}" bio`,
      `"${email}" resume`,
      `"${email}" CV`,
      `"${email}" portfolio`,
      `"${email}" work`,
      `"${email}" experience`,
      `"${email}" founder`,
      `"${email}" CEO`,
      `"${email}" director`,
      `"${email}" developer`,
    ];

    // Site-specific queries for firstName + lastName
    const siteSpecificNameQueries: string[] = [];
    for (const site of sites) {
      siteSpecificNameQueries.push(`"${firstName} ${lastName}" site:${site}`);
    }

    // Site-specific queries for email
    const siteSpecificEmailQueries: string[] = [];
    for (const site of sites) {
      siteSpecificEmailQueries.push(`"${email}" site:${site}`);
    }

    // Additional domain-specific queries
    const emailDomain = email.split('@')[1];
    const emailLocalPart = email.split('@')[0];
    
    const domainQueries = [
      `"${firstName} ${lastName}" "${emailDomain.replace('.com', '').replace('.org', '').replace('.net', '')}"`,
      `"${firstName} ${lastName}" "@${emailDomain}"`,
      `"${firstName} ${lastName}" company "${emailDomain}"`,
      `"${emailLocalPart}" "${emailDomain}"`,
      `"${firstName}.${lastName}" "${emailDomain}"`,
      `"${firstName}_${lastName}" "${emailDomain}"`,
      `"${firstName}${lastName}" "${emailDomain}"`,
    ];

    // Username pattern queries
    const usernameQueries = [
      `"${firstName.toLowerCase()}${lastName.toLowerCase()}"`,
      `"${firstName.toLowerCase()}.${lastName.toLowerCase()}"`,
      `"${firstName.toLowerCase()}_${lastName.toLowerCase()}"`,
      `"${firstName.toLowerCase()}-${lastName.toLowerCase()}"`,
      `"${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}"`,
      `"${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}"`,
      `"${emailLocalPart}"`,
    ];

    // Professional qualification queries
    const professionalQueries = [
      `"${firstName} ${lastName}" PhD`,
      `"${firstName} ${lastName}" Dr.`,
      `"${firstName} ${lastName}" MBA`,
      `"${firstName} ${lastName}" Professor`,
      `"${firstName} ${lastName}" researcher`,
      `"${firstName} ${lastName}" scientist`,
      `"${firstName} ${lastName}" author`,
      `"${firstName} ${lastName}" speaker`,
      `"${firstName} ${lastName}" expert`,
    ];

    // News and media mentions
    const newsQueries = [
      `"${firstName} ${lastName}" interview`,
      `"${firstName} ${lastName}" article`,
      `"${firstName} ${lastName}" press`,
      `"${firstName} ${lastName}" media`,
      `"${firstName} ${lastName}" news`,
      `"${firstName} ${lastName}" podcast`,
      `"${firstName} ${lastName}" conference`,
      `"${firstName} ${lastName}" speaking`,
      `"${firstName} ${lastName}" award`,
      `"${firstName} ${lastName}" recognition`,
    ];

    // Academic and research queries
    const academicQueries = [
      `"${firstName} ${lastName}" publication`,
      `"${firstName} ${lastName}" research`,
      `"${firstName} ${lastName}" paper`,
      `"${firstName} ${lastName}" study`,
      `"${firstName} ${lastName}" journal`,
      `"${firstName} ${lastName}" citation`,
      `"${firstName} ${lastName}" university`,
      `"${firstName} ${lastName}" college`,
      `"${firstName} ${lastName}" education`,
    ];

    // Business and startup queries
    const businessQueries = [
      `"${firstName} ${lastName}" startup`,
      `"${firstName} ${lastName}" entrepreneur`,
      `"${firstName} ${lastName}" business`,
      `"${firstName} ${lastName}" company`,
      `"${firstName} ${lastName}" investor`,
      `"${firstName} ${lastName}" funding`,
      `"${firstName} ${lastName}" venture`,
      `"${firstName} ${lastName}" board`,
      `"${firstName} ${lastName}" advisory`,
    ];

    // File type specific searches
    const fileTypeQueries = [
      `"${firstName} ${lastName}" filetype:pdf`,
      `"${firstName} ${lastName}" filetype:doc`,
      `"${firstName} ${lastName}" filetype:docx`,
      `"${firstName} ${lastName}" filetype:ppt`,
      `"${firstName} ${lastName}" filetype:pptx`,
      `"${email}" filetype:pdf`,
      `"${email}" filetype:doc`,
    ];

    // Location-based queries
    const locationQueries = [
      `"${firstName} ${lastName}" location`,
      `"${firstName} ${lastName}" city`,
      `"${firstName} ${lastName}" address`,
      `"${firstName} ${lastName}" based`,
      `"${firstName} ${lastName}" lives`,
      `"${firstName} ${lastName}" works`,
    ];

    // OPTIMIZED QUERY ORDER FOR SOCIAL MEDIA DISCOVERY
    
    // Get high-priority social media sites for prioritized searches
    const socialMediaSites = ['linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com', 'youtube.com', 'github.com', 'medium.com'];
    const professionalSites = ['linkedin.com', 'github.com', 'crunchbase.com', 'angel.co', 'apollo.io'];
    
    // 1. HIGH PRIORITY: Direct social media searches (most likely to find profiles)
    const priorityQueries = [
      // Basic name search
      `"${firstName} ${lastName}"`,
      // Direct social media site searches  
      ...socialMediaSites.map(site => `"${firstName} ${lastName}" site:${site}`),
      // Name + contact/profile keywords
      `"${firstName} ${lastName}" profile`,
      `"${firstName} ${lastName}" contact`,
      `"${firstName} ${lastName}" bio`,
    ];

    // 2. MEDIUM PRIORITY: Name + targeted keywords for quick wins
    const targetedQueries = [
      // Professional terms
      `"${firstName} ${lastName}" work`,
      `"${firstName} ${lastName}" company`,
      `"${firstName} ${lastName}" CEO`,
      `"${firstName} ${lastName}" founder`,
      `"${firstName} ${lastName}" developer`,
      `"${firstName} ${lastName}" director`,
      // Portfolio/professional presence
      `"${firstName} ${lastName}" portfolio`,
      `"${firstName} ${lastName}" resume`,
      `"${firstName} ${lastName}" CV`,
      // Username patterns (high success rate)
      `"${firstName.toLowerCase()}.${lastName.toLowerCase()}"`,
      `"${firstName.toLowerCase()}_${lastName.toLowerCase()}"`,
      `"${firstName.toLowerCase()}-${lastName.toLowerCase()}"`,
      `"${emailLocalPart}"`,
    ];

    // 3. EMAIL-BASED searches (good for finding contact pages and profiles)
    const emailTargetedQueries = [
      `"${firstName} ${lastName}" "${email}"`,
      `"${email}"`,
      `"${email}" profile`,
      `"${email}" contact`,
      // Professional sites with email
      ...professionalSites.map(site => `"${email}" site:${site}`),
    ];

    // 4. DOMAIN-SPECIFIC searches (organization context)
    const domainContextQueries = [
      `"${firstName} ${lastName}" "${emailDomain.replace('.com', '').replace('.org', '').replace('.net', '')}"`,
      `"${firstName} ${lastName}" "@${emailDomain}"`,
      `"${firstName} ${lastName}" company "${emailDomain}"`,
    ];

    // 5. COMPREHENSIVE SITE searches (broader coverage)
    const comprehensiveSiteQueries = [
      // Remove already searched social media sites from this list
      ...sites.filter(site => !socialMediaSites.includes(site) && !professionalSites.includes(site))
              .map(site => `"${firstName} ${lastName}" site:${site}`),
    ];

    // 6. SPECIALIZED searches (lower priority but comprehensive)
    const specializedQueries = [
      // Professional qualifications
      ...professionalQueries,
      // Media and news mentions  
      ...newsQueries.slice(0, 5), // Limit to top 5 most important
      // Academic (if relevant)
      ...academicQueries.slice(0, 4), // Limit to top 4
      // Business context
      ...businessQueries.slice(0, 5), // Limit to top 5
    ];

    // 7. DEEP SEARCH queries (lowest priority)
    const deepSearchQueries = [
      // Remaining base queries
      ...baseQueries.filter(q => !priorityQueries.includes(q) && !targetedQueries.includes(q)),
      // Remaining email queries  
      ...emailBasedQueries.filter(q => !emailTargetedQueries.includes(q)),
      // File type searches
      ...fileTypeQueries.slice(0, 3), // Limit to most important file types
      // Location queries
      ...locationQueries.slice(0, 3), // Limit to most relevant
    ];

    // OPTIMIZED RETURN ORDER: Social Media First → Professional → Comprehensive
    return [
      ...priorityQueries,           // 🎯 TIER 1: Direct social media + basic name (highest success rate)
      ...targetedQueries,           // 💼 TIER 2: Professional keywords + usernames (good success rate)  
      ...emailTargetedQueries,      // 📧 TIER 3: Email-based searches (targeted contact finding)
      ...domainContextQueries,      // 🏢 TIER 4: Organization context (company affiliation)
      ...comprehensiveSiteQueries,  // 🌐 TIER 5: Broader site coverage (comprehensive but slower)
      ...specializedQueries,        // 🔬 TIER 6: Specialized searches (academic, news, business)
      ...deepSearchQueries          // 🕳️ TIER 7: Deep search (catch-all, lowest priority)
    ];
  }
}
