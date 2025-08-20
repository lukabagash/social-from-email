import puppeteer from 'puppeteer-extra';
import { Page, Browser, ElementHandle, HTTPRequest, ConsoleMessage } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as dotenv from 'dotenv';

// Enhanced stealth plugin configuration
puppeteer.use(StealthPlugin());

dotenv.config();

export interface EnhancedScrapedData {
  url: string;
  title: string;
  domain: string;
  
  // Enhanced metadata extraction
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publisher?: string;
    publishedDate?: string;
    modifiedDate?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    twitterCard?: string;
    schemaOrg?: any[];
  };

  // Deep content analysis
  content: {
    // Text content with semantic analysis
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
      h4: string[];
      h5: string[];
      h6: string[];
    };
    paragraphs: string[];
    lists: string[];
    tables: Array<{
      headers: string[];
      rows: string[][];
    }>;
    
    // Enhanced link analysis
    links: Array<{
      text: string;
      url: string;
      isExternal: boolean;
      rel?: string;
      target?: string;
      context?: string;
      linkType: 'navigation' | 'social' | 'email' | 'download' | 'external' | 'internal';
    }>;
    
    // Rich media extraction
    images: Array<{
      src: string;
      alt: string;
      title?: string;
      width?: number;
      height?: number;
      context?: string;
      isProfileImage?: boolean;
      isLogo?: boolean;
    }>;
    
    videos: Array<{
      src: string;
      poster?: string;
      duration?: string;
      type?: string;
    }>;
    
    // Enhanced contact information
    contactInfo: {
      emails: Array<{
        email: string;
        context?: string;
        type?: 'primary' | 'support' | 'contact' | 'personal';
      }>;
      phones: Array<{
        phone: string;
        context?: string;
        type?: 'mobile' | 'office' | 'fax' | 'toll-free';
      }>;
      addresses: Array<{
        address: string;
        context?: string;
        coordinates?: { lat: number; lng: number };
      }>;
      socialLinks: Array<{
        platform: string;
        url: string;
        username?: string;
        followers?: string;
        verified?: boolean;
      }>;
    };
    
    // Professional information extraction
    professional: {
      jobTitles: string[];
      companies: string[];
      skills: string[];
      education: string[];
      certifications: string[];
      experience: Array<{
        title?: string;
        company?: string;
        duration?: string;
        description?: string;
      }>;
    };
    
    // Personal information extraction
    personal: {
      names: string[];
      nicknames: string[];
      locations: string[];
      interests: string[];
      achievements: string[];
      languages: string[];
    };
  };

  // Page structure and technical analysis
  structure: {
    hasNav: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    hasSidebar: boolean;
    hasSearch: boolean;
    hasLoginForm: boolean;
    hasContactForm: boolean;
    articleCount: number;
    formCount: number;
    buttonCount: number;
    inputCount: number;
    isSinglePageApp: boolean;
    usesFrameworks: string[];
    pageType: 'profile' | 'company' | 'blog' | 'portfolio' | 'social' | 'news' | 'ecommerce' | 'landing' | 'other';
  };

  // Advanced technical data
  technical: {
    loadTime: number;
    responseTime: number;
    responseStatus?: number;
    contentLanguage?: string;
    encoding?: string;
    cookies: any[];
    localStorage?: any;
    sessionStorage?: any;
    scripts: string[];
    stylesheets: string[];
    technologies: string[];
    analytics: string[];
  };

  // Social media specific extraction
  socialMediaData?: {
    platform?: string;
    profileData?: {
      handle?: string;
      displayName?: string;
      bio?: string;
      followerCount?: string;
      followingCount?: string;
      postCount?: string;
      verificationStatus?: boolean;
      profileImage?: string;
      bannerImage?: string;
      joinDate?: string;
      location?: string;
      website?: string;
    };
    posts?: Array<{
      content: string;
      timestamp?: string;
      likes?: string;
      shares?: string;
      comments?: string;
    }>;
  };

  // AI-enhanced content analysis
  aiAnalysis?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    entities: Array<{
      name: string;
      type: 'person' | 'organization' | 'location' | 'event' | 'product';
      confidence: number;
    }>;
    relevanceScore: number;
    contentCategory: string;
  };
}

export interface EnhancedScrapingOptions {
  timeout?: number;
  waitForSelector?: string;
  extractImages?: boolean;
  extractLinks?: boolean;
  extractSocialMedia?: boolean;
  extractProfessionalInfo?: boolean;
  extractPersonalInfo?: boolean;
  extractTechnicalInfo?: boolean;
  enableAIAnalysis?: boolean;
  maxContentLength?: number;
  followRedirects?: boolean;
  bypassCors?: boolean;
  executeJavaScript?: boolean;
  waitForNetworkIdle?: boolean;
  captureConsoleErrors?: boolean;
  blockResources?: string[];
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export class EnhancedWebScraper {
  private browsers: Map<string, Browser> = new Map();
  private crawlerPool: string[] = ['crawler1', 'crawler2', 'crawler3'];
  private sessionData: Map<string, any> = new Map();
  private currentCrawlerIndex: number = 0;
  
  private readonly defaultOptions: Required<EnhancedScrapingOptions> = {
    timeout: 30000,
    waitForSelector: 'body',
    extractImages: true,
    extractLinks: true,
    extractSocialMedia: true,
    extractProfessionalInfo: true,
    extractPersonalInfo: true,
    extractTechnicalInfo: true,
    enableAIAnalysis: false, // Disabled by default for performance
    maxContentLength: 50000,
    followRedirects: true,
    bypassCors: true,
    executeJavaScript: true,
    waitForNetworkIdle: true,
    captureConsoleErrors: true,
    blockResources: ['font', 'texttrack', 'object', 'beacon', 'csp_report'],
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  };

  async setup() {
    console.log('🚀 Launching Enhanced Web Scraper with multiple dedicated crawlers...');
    
    // Initialize multiple browsers for parallel scraping
    for (const crawlerId of this.crawlerPool) {
      console.log(`🕷️ Launching dedicated crawler: ${crawlerId.toUpperCase()}...`);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor,TranslateUI,BlinkGenPropertyTrees',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--mute-audio',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-notifications',
          '--disable-popup-blocking',
          '--disable-print-preview',
          '--disable-prompt-on-repost',
          '--disable-sync',
          '--ignore-gpu-blacklist',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-first-run',
          '--no-pings',
          '--password-store=basic',
          '--use-gl=swiftshader',
          '--use-mock-keychain',
          '--enable-features=NetworkService,NetworkServiceInProcess',
          '--exclude-switches=enable-automation'
        ],
        timeout: 60000,
        protocolTimeout: 60000,
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: null
      });

      this.browsers.set(crawlerId, browser);
      console.log(`✅ ${crawlerId.toUpperCase()} crawler ready`);
    }

    console.log(`✅ All ${this.crawlerPool.length} dedicated crawlers initialized successfully`);
    console.log(`🎯 Crawlers ready: ${this.crawlerPool.join(', ')}`);
  }

  async close() {
    console.log('🔄 Closing all dedicated crawlers...');
    
    for (const [crawlerId, browser] of this.browsers.entries()) {
      try {
        console.log(`🔒 Closing ${crawlerId.toUpperCase()} crawler...`);
        await browser.close();
      } catch (error) {
        console.warn(`⚠️  Error closing ${crawlerId} crawler:`, error);
      }
    }
    
    this.browsers.clear();
    console.log('✅ All dedicated crawlers closed successfully');
  }

  private getNextCrawler(): Browser {
    const crawlerId = this.crawlerPool[this.currentCrawlerIndex];
    this.currentCrawlerIndex = (this.currentCrawlerIndex + 1) % this.crawlerPool.length;
    const browser = this.browsers.get(crawlerId);
    
    if (!browser) {
      throw new Error(`Crawler ${crawlerId} not found. Call setup() first.`);
    }
    
    return browser;
  }

  private async getCrawlerForUrl(url: string): Promise<{ browser: Browser; crawlerId: string }> {
    // Simple load balancing - you could implement more sophisticated logic here
    // For example, based on domain, current load, response times, etc.
    const crawlerId = this.crawlerPool[this.currentCrawlerIndex];
    this.currentCrawlerIndex = (this.currentCrawlerIndex + 1) % this.crawlerPool.length;
    
    const browser = this.browsers.get(crawlerId);
    if (!browser) {
      throw new Error(`Crawler ${crawlerId} not found. Call setup() first.`);
    }
    
    return { browser, crawlerId };
  }

  private async createEnhancedPage(options: EnhancedScrapingOptions, browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    
    // Set enhanced user agent and viewport
    await page.setUserAgent(options.userAgent || this.defaultOptions.userAgent);
    await page.setViewport(options.viewport || this.defaultOptions.viewport);

    // Advanced stealth techniques
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver indicators
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      delete (window as any).chrome.runtime;
      
      // Mock plugins array
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' },
          { name: 'Widevine Content Decryption Module', filename: 'widevinecdmadapter.dll' }
        ]
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Enhanced permissions handling
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => {
        return Promise.resolve({ 
          state: parameters.name === 'notifications' ? 'denied' : 'granted',
          name: parameters.name,
          onchange: null 
        } as any);
      };

      // Enhanced canvas fingerprinting protection
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      (HTMLCanvasElement.prototype as any).getContext = function(type: any, attributes?: any) {
        if (type === '2d' || type === 'webgl' || type === 'webgl2') {
          const context = originalGetContext.call(this, type, attributes);
          if (context && type === '2d') {
            const originalGetImageData = (context as any).getImageData;
            (context as any).getImageData = function(...args: any[]) {
              const imageData = originalGetImageData.apply(this, args);
              // Add minimal noise to prevent fingerprinting
              for (let i = 0; i < imageData.data.length; i += 4) {
                const noise = Math.floor(Math.random() * 3) - 1;
                imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise));
              }
              return imageData;
            };
          }
          return context;
        }
        return originalGetContext.call(this, type, attributes);
      };

      // Mock WebGL renderer info
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter: any) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel(R) UHD Graphics 630';
        return getParameter.call(this, parameter);
      };
    });

    // Enhanced request interception for better control
    if (options.blockResources && options.blockResources.length > 0) {
      await page.setRequestInterception(true);
      
      page.on('request', (request: HTTPRequest) => {
        const resourceType = request.resourceType();
        const url = request.url();

        // Block unnecessary resources
        if (options.blockResources!.includes(resourceType)) {
          return request.abort();
        }

        // Block tracking and analytics scripts (optional)
        if (url.includes('google-analytics') || 
            url.includes('googletagmanager') ||
            url.includes('facebook.com/tr') ||
            url.includes('doubleclick.net')) {
          return request.abort();
        }

        request.continue();
      });
    }

    // Enhanced error capturing
    if (options.captureConsoleErrors) {
      page.on('console', (msg: ConsoleMessage) => {
        if (msg.type() === 'error') {
          console.log(`🔍 Console Error: ${msg.text()}`);
        }
      });

      page.on('pageerror', (error: Error) => {
        console.log(`🔍 Page Error: ${error.message}`);
      });
    }

    // Set extra HTTP headers for enhanced stealth
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });

    return page;
  }

  async scrapeWebsite(url: string, options: EnhancedScrapingOptions = {}): Promise<EnhancedScrapedData> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    if (this.browsers.size === 0) {
      throw new Error('No crawlers initialized. Call setup() first.');
    }

    let page: Page | null = null;

    try {
      console.log(`🌐 Enhanced scraping: ${url}`);
      
      // Get dedicated crawler for this URL
      const { browser, crawlerId } = await this.getCrawlerForUrl(url);
      console.log(`🕷️ Using dedicated crawler: ${crawlerId.toUpperCase()}`);
      
      page = await this.createEnhancedPage(opts, browser);
      
      const navigationStart = Date.now();
      const response = await page.goto(url, {
        waitUntil: opts.waitForNetworkIdle ? 'networkidle2' : 'domcontentloaded',
        timeout: opts.timeout
      });
      const responseTime = Date.now() - navigationStart;
      const responseStatus = response?.status();

      // Wait for specific selector if provided
      if (opts.waitForSelector && opts.waitForSelector !== 'body') {
        try {
          await page.waitForSelector(opts.waitForSelector, { timeout: 10000 });
        } catch (e) {
          console.warn(`⚠️  Selector ${opts.waitForSelector} not found, continuing anyway`);
        }
      }

      // Additional wait for dynamic content
      if (opts.executeJavaScript) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Allow time for JavaScript to execute
      }

      // Extract comprehensive data using advanced techniques
      const scrapedData = await this.extractComprehensiveData(page, opts);

      const loadTime = Date.now() - startTime;

      return {
        ...scrapedData,
        technical: {
          ...scrapedData.technical,
          loadTime,
          responseTime,
          responseStatus
        }
      } as EnhancedScrapedData;

    } catch (error) {
      console.error(`❌ Enhanced scraping error for ${url}:`, error);
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.warn(`⚠️  Error closing page for ${url}:`, closeError);
        }
      }
    }
  }

  private async extractComprehensiveData(page: Page, options: EnhancedScrapingOptions): Promise<Partial<EnhancedScrapedData>> {
    // Execute comprehensive data extraction in the browser context
    const result = await page.evaluate((opts) => {
      const getCleanText = (text: string | null): string => {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').trim();
      };

      const getDomain = (url: string): string => {
        try {
          return new URL(url).hostname;
        } catch {
          return '';
        }
      };

      const isExternalLink = (url: string, currentDomain: string): boolean => {
        try {
          const linkDomain = new URL(url, window.location.href).hostname;
          return linkDomain !== currentDomain;
        } catch {
          return false;
        }
      };

      // Enhanced email extraction with context
      const extractEmails = (text: string, context: string = ''): Array<{email: string; context?: string; type?: 'primary' | 'support' | 'contact' | 'personal'}> => {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = [...new Set(text.match(emailRegex) || [])];
        return emails.map(email => ({
          email,
          context: context || '',
          type: email.includes('support') ? 'support' as const : 
                email.includes('contact') ? 'contact' as const : 
                email.includes('info') ? 'contact' as const : 'personal' as const
        }));
      };

      // Enhanced phone extraction with context
      const extractPhones = (text: string, context: string = ''): Array<{phone: string; context?: string; type?: 'mobile' | 'office' | 'fax' | 'toll-free'}> => {
        const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
        const phones = [...new Set(text.match(phoneRegex) || [])];
        return phones.map(phone => ({
          phone,
          context: context || '',
          type: phone.includes('800') || phone.includes('888') || phone.includes('877') ? 'toll-free' as const : 
                context.toLowerCase().includes('mobile') ? 'mobile' as const : 
                context.toLowerCase().includes('fax') ? 'fax' as const : 'office' as const
        }));
      };

      // Enhanced social media extraction with detailed analysis
      const extractSocialLinks = (links: NodeListOf<HTMLAnchorElement>): Array<{platform: string; url: string; username?: string; verified?: boolean}> => {
        const socialPlatforms = {
          'facebook.com': 'Facebook',
          'twitter.com': 'Twitter',
          'x.com': 'X (Twitter)',
          'linkedin.com': 'LinkedIn',
          'instagram.com': 'Instagram',
          'youtube.com': 'YouTube',
          'github.com': 'GitHub',
          'tiktok.com': 'TikTok',
          'pinterest.com': 'Pinterest',
          'snapchat.com': 'Snapchat',
          'discord.com': 'Discord',
          'reddit.com': 'Reddit',
          'medium.com': 'Medium',
          'behance.net': 'Behance',
          'dribbble.com': 'Dribbble',
          'tumblr.com': 'Tumblr',
          'twitch.tv': 'Twitch'
        };

        const socialLinks: Array<{platform: string; url: string; username?: string; verified?: boolean}> = [];
        
        for (const link of links) {
          const href = link.href;
          const linkText = link.textContent?.toLowerCase() || '';
          
          for (const [domain, platform] of Object.entries(socialPlatforms)) {
            if (href.includes(domain)) {
              // Extract username from URL
              let username: string | undefined;
              if (platform === 'Twitter' || platform === 'X (Twitter)') {
                const match = href.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
                username = match?.[1];
              } else if (platform === 'LinkedIn') {
                const match = href.match(/linkedin\.com\/in\/([a-zA-Z0-9\-]+)/);
                username = match?.[1];
              } else if (platform === 'GitHub') {
                const match = href.match(/github\.com\/([a-zA-Z0-9\-]+)/);
                username = match?.[1];
              } else if (platform === 'Instagram') {
                const match = href.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
                username = match?.[1];
              }

              // Check for verification indicators
              const verified = linkText.includes('verified') || 
                             link.querySelector('.verified') !== null ||
                             link.querySelector('[data-verified]') !== null;

              socialLinks.push({ platform, url: href, username, verified });
              break;
            }
          }
        }
        
        return socialLinks;
      };

      // Extract professional information
      const extractProfessionalInfo = (): any => {
        const pageText = document.body.textContent?.toLowerCase() || '';
        
        // Job titles patterns
        const jobTitlePatterns = [
          /(?:^|\s)(ceo|cto|cfo|coo|president|director|manager|senior|lead|principal|architect|engineer|developer|designer|analyst|consultant|coordinator|specialist|executive|founder|owner|partner)(?:\s|$)/gi
        ];
        
        const jobTitles: string[] = [];
        jobTitlePatterns.forEach(pattern => {
          const matches = pageText.match(pattern) || [];
          jobTitles.push(...matches.map(m => m.trim()));
        });

        // Company extraction
        const companies: string[] = [];
        const companySelectors = [
          '[itemtype*="Organization"]',
          '.company',
          '.employer',
          '.organization'
        ];
        
        companySelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = getCleanText(el.textContent);
            if (text && text.length > 2 && text.length < 100) {
              companies.push(text);
            }
          });
        });

        // Skills extraction
        const skillKeywords = [
          'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
          'typescript', 'html', 'css', 'sql', 'mongodb', 'postgresql',
          'aws', 'azure', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
          'machine learning', 'ai', 'data science', 'blockchain', 'cloud'
        ];
        
        const skills = skillKeywords.filter(skill => 
          pageText.includes(skill.toLowerCase())
        );

        return { jobTitles: [...new Set(jobTitles)], companies: [...new Set(companies)], skills };
      };

      // Extract personal information
      const extractPersonalInfo = (): any => {
        const pageText = document.body.textContent || '';
        
        // Extract potential names
        const namePatterns = [
          /(?:my name is|i am|i'm|call me)\s+([a-zA-Z\s]{2,30})/gi,
          /(?:^|\s)([A-Z][a-z]+ [A-Z][a-z]+)(?:\s|$)/g
        ];
        
        const names: string[] = [];
        namePatterns.forEach(pattern => {
          const matches = pageText.match(pattern) || [];
          names.push(...matches.map(m => m.trim()));
        });

        // Extract locations
        const locationPatterns = [
          /(?:based in|located in|from|living in)\s+([a-zA-Z\s,]{3,50})/gi,
          /([A-Z][a-z]+,\s+[A-Z]{2}(?:\s+\d{5})?)/g
        ];
        
        const locations: string[] = [];
        locationPatterns.forEach(pattern => {
          const matches = pageText.match(pattern) || [];
          locations.push(...matches.map(m => m.trim()));
        });

        return { 
          names: [...new Set(names)].slice(0, 10), 
          locations: [...new Set(locations)].slice(0, 10),
          interests: [],
          achievements: [],
          languages: []
        };
      };

      // Determine page type
      const determinePageType = (): string => {
        const url = window.location.href.toLowerCase();
        const pageText = document.body.textContent?.toLowerCase() || '';
        
        if (url.includes('linkedin.com/in/') || url.includes('profile')) return 'profile';
        if (url.includes('company') || url.includes('about') || pageText.includes('founded')) return 'company';
        if (url.includes('blog') || document.querySelector('article')) return 'blog';
        if (url.includes('portfolio') || pageText.includes('portfolio')) return 'portfolio';
        if (url.includes('facebook.com') || url.includes('twitter.com') || url.includes('instagram.com')) return 'social';
        if (document.querySelector('.news') || pageText.includes('breaking news')) return 'news';
        if (document.querySelector('.product') || pageText.includes('buy now')) return 'ecommerce';
        
        return 'other';
      };

      // Extract structured data (Schema.org)
      const extractSchemaOrg = (): any[] => {
        const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
        const schemas: any[] = [];
        
        schemaScripts.forEach(script => {
          try {
            const data = JSON.parse(script.textContent || '');
            schemas.push(data);
          } catch (e) {
            // Ignore malformed JSON
          }
        });
        
        return schemas;
      };

      // Get basic page info
      const title = document.title || '';
      const url = window.location.href;
      const domain = getDomain(url);

      // Enhanced metadata extraction
      const getMetaContent = (name: string): string => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"], meta[itemprop="${name}"]`) as HTMLMetaElement;
        return meta?.content || '';
      };

      const metadata = {
        description: getMetaContent('description'),
        keywords: getMetaContent('keywords')?.split(',').map(k => k.trim()).filter(k => k) || [],
        author: getMetaContent('author'),
        publisher: getMetaContent('publisher'),
        publishedDate: getMetaContent('article:published_time') || getMetaContent('datePublished'),
        modifiedDate: getMetaContent('article:modified_time') || getMetaContent('dateModified'),
        canonicalUrl: (document.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href,
        ogTitle: getMetaContent('og:title'),
        ogDescription: getMetaContent('og:description'),
        ogImage: getMetaContent('og:image'),
        ogType: getMetaContent('og:type'),
        twitterTitle: getMetaContent('twitter:title'),
        twitterDescription: getMetaContent('twitter:description'),
        twitterImage: getMetaContent('twitter:image'),
        twitterCard: getMetaContent('twitter:card'),
        schemaOrg: extractSchemaOrg()
      };

      // Enhanced heading extraction
      const headings = {
        h1: Array.from(document.querySelectorAll('h1')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0),
        h2: Array.from(document.querySelectorAll('h2')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0),
        h3: Array.from(document.querySelectorAll('h3')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0),
        h4: Array.from(document.querySelectorAll('h4')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0),
        h5: Array.from(document.querySelectorAll('h5')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0),
        h6: Array.from(document.querySelectorAll('h6')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0)
      };

      // Enhanced content extraction
      const paragraphs = Array.from(document.querySelectorAll('p, .content p, article p, .description'))
        .map(el => getCleanText(el.textContent))
        .filter(text => text.length > 20)
        .slice(0, 100);

      const lists = Array.from(document.querySelectorAll('ul, ol'))
        .map(el => getCleanText(el.textContent))
        .filter(text => text.length > 10)
        .slice(0, 20);

      // Enhanced link extraction with context
      const linkElements = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
      const links = opts.extractLinks ? Array.from(linkElements)
        .map(el => {
          const text = getCleanText(el.textContent);
          const url = el.href;
          const rel = el.rel;
          const target = el.target;
          const context = el.closest('nav, header, footer, aside')?.tagName.toLowerCase() || '';
          
          let linkType: 'navigation' | 'social' | 'email' | 'download' | 'external' | 'internal' = 'internal';
          
          if (url.startsWith('mailto:')) linkType = 'email';
          else if (url.includes('facebook.com') || url.includes('twitter.com') || url.includes('linkedin.com') || url.includes('instagram.com')) linkType = 'social';
          else if (url.includes('.pdf') || url.includes('.doc') || url.includes('.zip') || url.includes('download')) linkType = 'download';
          else if (isExternalLink(url, domain)) linkType = 'external';
          else if (context === 'nav' || context === 'header') linkType = 'navigation';
          
          return {
            text,
            url,
            isExternal: isExternalLink(url, domain),
            rel,
            target,
            context,
            linkType
          };
        })
        .filter(link => link.text.length > 0 && link.url.length > 0)
        .slice(0, 200) : [];

      // Enhanced image extraction
      const images = opts.extractImages ? Array.from(document.querySelectorAll('img'))
        .map(el => {
          const context = el.closest('.profile, .avatar, .logo, header')?.className || '';
          return {
            src: el.src,
            alt: el.alt || '',
            title: el.title || '',
            width: el.naturalWidth || undefined,
            height: el.naturalHeight || undefined,
            context,
            isProfileImage: context.includes('profile') || context.includes('avatar'),
            isLogo: context.includes('logo') || el.alt.toLowerCase().includes('logo')
          };
        })
        .filter(img => img.src.length > 0)
        .slice(0, 50) : [];

      // Video extraction
      const videos = Array.from(document.querySelectorAll('video'))
        .map(el => ({
          src: el.src || el.querySelector('source')?.src || '',
          poster: el.poster || '',
          duration: el.duration ? el.duration.toString() : '',
          type: el.querySelector('source')?.type || ''
        }))
        .filter(video => video.src.length > 0)
        .slice(0, 10);

      // Enhanced contact information extraction
      const pageText = document.body.textContent || '';
      const emails = extractEmails(pageText);
      const phones = extractPhones(pageText);
      const socialLinks = extractSocialLinks(linkElements);

      // Address extraction
      const addressPatterns = [
        /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Place|Pl)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}/gi
      ];
      
      const addresses = addressPatterns.flatMap(pattern => 
        [...(pageText.match(pattern) || [])].map(addr => ({
          address: addr.trim(),
          context: '',
          coordinates: undefined
        }))
      ).slice(0, 5);

      // Professional and personal info extraction
      const professional = opts.extractProfessionalInfo ? {
        ...extractProfessionalInfo(),
        education: [],
        certifications: [],
        experience: []
      } : {
        jobTitles: [],
        companies: [],
        skills: [],
        education: [],
        certifications: [],
        experience: []
      };

      const personal = opts.extractPersonalInfo ? extractPersonalInfo() : {
        names: [],
        nicknames: [],
        locations: [],
        interests: [],
        achievements: [],
        languages: []
      };

      // Enhanced page structure analysis
      const structure = {
        hasNav: document.querySelector('nav') !== null,
        hasHeader: document.querySelector('header') !== null,
        hasFooter: document.querySelector('footer') !== null,
        hasSidebar: document.querySelector('aside, .sidebar, .side-bar') !== null,
        hasSearch: document.querySelector('input[type="search"], .search') !== null,
        hasLoginForm: document.querySelector('form[action*="login"], .login-form') !== null,
        hasContactForm: document.querySelector('form[action*="contact"], .contact-form') !== null,
        articleCount: document.querySelectorAll('article').length,
        formCount: document.querySelectorAll('form').length,
        buttonCount: document.querySelectorAll('button').length,
        inputCount: document.querySelectorAll('input').length,
        isSinglePageApp: document.querySelectorAll('[ng-app], [data-reactroot], #root').length > 0,
        usesFrameworks: [],
        pageType: determinePageType() as any
      };

      // Technical information extraction
      const scripts = Array.from(document.querySelectorAll('script[src]'))
        .map(el => (el as HTMLScriptElement).src)
        .slice(0, 20);

      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(el => (el as HTMLLinkElement).href)
        .slice(0, 20);

      const technologies: string[] = [];
      if (scripts.some(s => s.includes('react'))) technologies.push('React');
      if (scripts.some(s => s.includes('angular'))) technologies.push('Angular');
      if (scripts.some(s => s.includes('vue'))) technologies.push('Vue.js');
      if (scripts.some(s => s.includes('jquery'))) technologies.push('jQuery');
      if (document.querySelector('[ng-app]')) technologies.push('AngularJS');

      const analytics: string[] = [];
      if (scripts.some(s => s.includes('google-analytics'))) analytics.push('Google Analytics');
      if (scripts.some(s => s.includes('gtag'))) analytics.push('Google Tag Manager');
      if (scripts.some(s => s.includes('facebook.com/tr'))) analytics.push('Facebook Pixel');

      return {
        url,
        title: getCleanText(title),
        domain,
        metadata,
        content: {
          headings,
          paragraphs,
          lists,
          tables: [], // TODO: Implement table extraction
          links,
          images,
          videos,
          contactInfo: {
            emails,
            phones,
            addresses,
            socialLinks
          },
          professional,
          personal
        },
        structure,
        technical: {
          loadTime: 0, // Will be set later
          responseTime: 0, // Will be set later
          contentLanguage: document.documentElement.lang || undefined,
          encoding: document.characterSet || undefined,
          cookies: [], // TODO: Extract cookies
          scripts,
          stylesheets,
          technologies,
          analytics
        }
      };
    }, options);

    return result;
  }

  async scrapeMultipleWebsites(urls: string[], options: EnhancedScrapingOptions = {}): Promise<EnhancedScrapedData[]> {
    console.log(`🚀 Starting parallel enhanced scraping with ${this.crawlerPool.length} dedicated crawlers...`);
    console.log(`🎯 Target URLs: ${urls.length}`);
    
    const results: EnhancedScrapedData[] = [];
    const batchSize = this.crawlerPool.length; // Process as many URLs in parallel as we have crawlers
    let successCount = 0;
    let failureCount = 0;
    
    // Process URLs in batches to maximize parallelization
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`\n📊 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} URLs in parallel`);
      
      // Execute batch in parallel using dedicated crawlers
      const batchPromises = batch.map(async (url, index) => {
        const crawlerIndex = index % this.crawlerPool.length;
        const crawlerId = this.crawlerPool[crawlerIndex];
        
        try {
          console.log(`🕷️ ${crawlerId.toUpperCase()} scraping: ${url}`);
          
          // Get specific crawler for this URL
          const browser = this.browsers.get(crawlerId);
          if (!browser) {
            throw new Error(`Crawler ${crawlerId} not available`);
          }
          
          const data = await this.scrapeWebsiteWithCrawler(url, options, browser, crawlerId);
          console.log(`✅ ${crawlerId.toUpperCase()} completed: ${url}`);
          return { success: true, data, url };
        } catch (error) {
          console.error(`❌ ${crawlerId.toUpperCase()} failed for ${url}:`, error);
          return { success: false, error, url };
        }
      });
      
      // Wait for all parallel scraping operations in this batch
      const batchResults = await Promise.all(batchPromises);
      
      // Process batch results
      for (const result of batchResults) {
        if (result.success && result.data) {
          results.push(result.data);
          successCount++;
        } else {
          failureCount++;
          
          // Handle crawler recovery if needed
          if (result.error && result.error.toString().includes('Protocol error: Connection closed')) {
            console.log(`🔄 Attempting to recover crawler for next batch...`);
            try {
              await this.recoverCrawler();
            } catch (recoveryError) {
              console.error(`❌ Failed to recover crawler:`, recoveryError);
            }
          }
        }
      }
      
      // Add intelligent delay between batches
      if (i + batchSize < urls.length) {
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        console.log(`⏳ Batch completed, waiting ${Math.round(delay)}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`\n📊 Parallel enhanced scraping summary: ${successCount} successful, ${failureCount} failed out of ${urls.length} total`);
    console.log(`🎯 Crawler distribution: Used ${this.crawlerPool.length} dedicated crawlers`);
    console.log(`🎯 Enhanced data extraction completed with comprehensive parallel analysis`);
    
    return results;
  }

  private async scrapeWebsiteWithCrawler(
    url: string, 
    options: EnhancedScrapingOptions, 
    browser: Browser, 
    crawlerId: string
  ): Promise<EnhancedScrapedData> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let page: Page | null = null;

    try {
      page = await this.createEnhancedPage(opts, browser);
      
      const navigationStart = Date.now();
      const response = await page.goto(url, {
        waitUntil: opts.waitForNetworkIdle ? 'networkidle2' : 'domcontentloaded',
        timeout: opts.timeout
      });
      const responseTime = Date.now() - navigationStart;
      const responseStatus = response?.status();

      // Wait for specific selector if provided
      if (opts.waitForSelector && opts.waitForSelector !== 'body') {
        try {
          await page.waitForSelector(opts.waitForSelector, { timeout: 10000 });
        } catch (e) {
          console.warn(`⚠️  ${crawlerId.toUpperCase()}: Selector ${opts.waitForSelector} not found, continuing anyway`);
        }
      }

      // Additional wait for dynamic content
      if (opts.executeJavaScript) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced wait time for parallel processing
      }

      // Extract comprehensive data using advanced techniques
      const scrapedData = await this.extractComprehensiveData(page, opts);

      const loadTime = Date.now() - startTime;

      return {
        ...scrapedData,
        technical: {
          ...scrapedData.technical,
          loadTime,
          responseTime,
          responseStatus
        }
      } as EnhancedScrapedData;

    } catch (error) {
      console.error(`❌ ${crawlerId.toUpperCase()}: Enhanced scraping error for ${url}:`, error);
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.warn(`⚠️  ${crawlerId.toUpperCase()}: Error closing page for ${url}:`, closeError);
        }
      }
    }
  }

  private async recoverCrawler(): Promise<void> {
    // Implementation for crawler recovery - restart one or more browsers
    console.log(`🔄 Implementing crawler recovery...`);
    
    // For now, we'll just log this. In production, you might want to:
    // 1. Close and restart specific problematic browsers
    // 2. Redistribute load to healthy crawlers
    // 3. Implement circuit breaker patterns
    // 4. Add exponential backoff for retries
  }

  // Legacy method for backward compatibility - now uses parallel processing
  async scrapeMultipleWebsitesLegacy(urls: string[], options: EnhancedScrapingOptions = {}): Promise<EnhancedScrapedData[]> {
    const results: EnhancedScrapedData[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    console.log(`🚀 Starting sequential enhanced scraping of ${urls.length} websites...`);
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n📊 Enhanced scraping ${i + 1}/${urls.length}: ${url}`);
      
      try {
        const data = await this.scrapeWebsite(url, options);
        results.push(data);
        successCount++;
        console.log(`✅ Successfully scraped with enhanced data: ${url}`);
        
        // Add intelligent delay between requests
        if (i < urls.length - 1) {
          const delay = Math.random() * 2000 + 1000; // 1-3 seconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        failureCount++;
        console.error(`❌ Enhanced scraping failed for ${url}:`, error);
        
        // Browser recovery logic
        if (error && error.toString().includes('Protocol error: Connection closed')) {
          console.log(`🔄 Attempting to reinitialize enhanced scraper...`);
          try {
            await this.close();
            await this.setup();
            console.log(`✅ Enhanced scraper reinitialized successfully`);
          } catch (reinitError) {
            console.error(`❌ Failed to reinitialize enhanced scraper:`, reinitError);
          }
        }
      }
    }
    
    console.log(`\n📊 Enhanced scraping summary: ${successCount} successful, ${failureCount} failed out of ${urls.length} total`);
    console.log(`🎯 Enhanced data extraction completed with comprehensive analysis`);
    
    return results;
  }
}
