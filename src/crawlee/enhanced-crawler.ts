import { PlaywrightCrawler, PuppeteerCrawler, CheerioCrawler, Dataset, RequestQueue, Configuration } from 'crawlee';
import { Page } from 'playwright';
import { Page as PuppeteerPage } from 'puppeteer';
import * as cheerio from 'cheerio';
import { TemporaryStorageManager } from '../utils/temporary-storage';

export interface CrawleeSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  crawlerType: 'playwright' | 'puppeteer' | 'cheerio';
  searchEngine: 'duckduckgo' | 'google' | 'bing';
  timestamp: string;
  metadata: {
    statusCode?: number;
    loadTime: number;
    contentLength: number;
    hasImages: boolean;
    hasSocialLinks: boolean;
    hasContactInfo: boolean;
  };
}

export interface CrawleeScrapedData {
  url: string;
  title: string;
  domain: string;
  content: {
    text: string;
    headings: {
      h1: string[];
      h2: string[];
      h3: string[];
    };
    paragraphs: string[];
    links: Array<{
      text: string;
      url: string;
      isExternal: boolean;
    }>;
    images: Array<{
      src: string;
      alt?: string;
      title?: string;
    }>;
    socialLinks: Array<{
      platform: string;
      url: string;
      username?: string;
    }>;
    contactInfo: {
      emails: string[];
      phones: string[];
      addresses: string[];
    };
  };
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    publishedDate?: string;
    modifiedDate?: string;
  };
  technical: {
    loadTime: number;
    responseTime: number;
    statusCode: number;
    contentLength: number;
    crawlerUsed: 'playwright' | 'puppeteer' | 'cheerio';
    javascriptEnabled: boolean;
  };
  quality: {
    hasPersonalInfo: boolean;
    hasProfessionalInfo: boolean;
    hasSocialMedia: boolean;
    contentQuality: 'high' | 'medium' | 'low';
    relevanceScore: number;
  };
}

export interface CrawleeOptions {
  maxConcurrency?: number;
  requestHandlerTimeoutSecs?: number;
  maxRequestRetries?: number;
  useSessionPool?: boolean;
  persistCookiesPerSession?: boolean;
  rotateUserAgents?: boolean;
  enableJavaScript?: boolean;
  waitForNetworkIdle?: boolean;
  blockResources?: string[];
  maxRequestsPerMinute?: number;
  enableProxy?: boolean;
  respectRobotsTxt?: boolean;
  useTemporaryStorage?: boolean;
  retainStorageOnError?: boolean;
  storageNamespace?: string;
}

export class EnhancedCrawleeEngine {
  private playwrightCrawler?: PlaywrightCrawler;
  private puppeteerCrawler?: PuppeteerCrawler;
  private cheerioCrawler?: CheerioCrawler;
  private requestQueue?: RequestQueue;
  private dataset?: Dataset;
  private options: CrawleeOptions;
  private storageManager?: TemporaryStorageManager;

  constructor(options: CrawleeOptions = {}) {
    this.options = {
      maxConcurrency: 5,
      requestHandlerTimeoutSecs: 60,
      maxRequestRetries: 3,
      useSessionPool: true,
      persistCookiesPerSession: true,
      rotateUserAgents: true,
      enableJavaScript: true,
      waitForNetworkIdle: true,
      blockResources: ['font', 'texttrack', 'object', 'beacon', 'csp_report'],
      maxRequestsPerMinute: 120,
      enableProxy: false,
      respectRobotsTxt: true,
      useTemporaryStorage: true,
      retainStorageOnError: false,
      ...options
    };

    // Initialize temporary storage if enabled
    if (this.options.useTemporaryStorage) {
      this.storageManager = new TemporaryStorageManager({
        cleanupOnExit: true,
        retainOnError: this.options.retainStorageOnError || false
      });
      
      if (this.options.storageNamespace) {
        this.storageManager = this.storageManager.createChild(this.options.storageNamespace);
      }
    }
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Enhanced Crawlee Engine...');
    
    // Initialize temporary storage if enabled
    if (this.storageManager) {
      this.storageManager.initialize();
      const runInfo = this.storageManager.getRunInfo();
      console.log(`🗂️  Using temporary storage: ${runInfo.runId}`);
      
      // Configure Crawlee to use temporary storage
      const crawleeConfig = this.storageManager.getCrawleeConfig();
      Configuration.getGlobalConfig().set('storageClientOptions', {
        storageDir: crawleeConfig.storageDir
      });
      Configuration.getGlobalConfig().set('persistStorage', crawleeConfig.persistStorage);
      Configuration.getGlobalConfig().set('purgeOnStart', crawleeConfig.purgeOnStart);
    }
    
    // Initialize request queue and dataset
    this.requestQueue = await RequestQueue.open();
    this.dataset = await Dataset.open();
    
    await this.initializePlaywrightCrawler();
    await this.initializePuppeteerCrawler();
    await this.initializeCheeriolCrawler();
    
    console.log('✅ Crawlee Engine initialized with multiple crawlers');
    
    if (this.storageManager) {
      const runInfo = this.storageManager.getRunInfo();
      console.log(`📁 Storage location: ${runInfo.storagePath}`);
      console.log(`🧹 Auto-cleanup: ${runInfo.cleanupOnExit ? 'Enabled' : 'Disabled'}`);
    }
  }

  private async initializePlaywrightCrawler(): Promise<void> {
    this.playwrightCrawler = new PlaywrightCrawler({
      requestQueue: this.requestQueue,
      maxConcurrency: this.options.maxConcurrency,
      requestHandlerTimeoutSecs: this.options.requestHandlerTimeoutSecs,
      maxRequestRetries: this.options.maxRequestRetries,
      useSessionPool: this.options.useSessionPool,
      persistCookiesPerSession: this.options.persistCookiesPerSession,
      
      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled'
          ]
        }
      },
      
      preNavigationHooks: [
        async (crawlingContext) => {
          const { page } = crawlingContext;
          
          // Block unnecessary resources for faster loading
          if (this.options.blockResources && this.options.blockResources.length > 0) {
            await page.route('**/*', (route) => {
              const resourceType = route.request().resourceType();
              if (this.options.blockResources!.includes(resourceType)) {
                route.abort();
              } else {
                route.continue();
              }
            });
          }
          
          // Set user agent rotation
          if (this.options.rotateUserAgents) {
            const userAgents = [
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ];
            const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setExtraHTTPHeaders({ 'User-Agent': randomUserAgent });
          }
        }
      ],
      
      requestHandler: async (crawlingContext) => {
        const { page, request } = crawlingContext;
        await this.handlePlaywrightRequest(page, request.loadedUrl!);
      },
      
      failedRequestHandler: async ({ request, error }) => {
        console.log(`❌ Playwright failed to process ${request.url}: ${error instanceof Error ? error.message : String(error)}`);
        // Try with Puppeteer as fallback
        if (this.puppeteerCrawler) {
          await this.requestQueue?.addRequest({ url: request.url, userData: { ...request.userData, fallback: 'puppeteer' } });
        }
      }
    });
  }

  private async initializePuppeteerCrawler(): Promise<void> {
    this.puppeteerCrawler = new PuppeteerCrawler({
      requestQueue: this.requestQueue,
      maxConcurrency: Math.max(1, Math.floor(this.options.maxConcurrency! / 2)),
      requestHandlerTimeoutSecs: this.options.requestHandlerTimeoutSecs,
      maxRequestRetries: this.options.maxRequestRetries,
      useSessionPool: this.options.useSessionPool,
      persistCookiesPerSession: this.options.persistCookiesPerSession,
      
      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled'
          ]
        }
      },
      
      preNavigationHooks: [
        async (crawlingContext) => {
          const { page } = crawlingContext;
          
          // Block unnecessary resources
          if (this.options.blockResources && this.options.blockResources.length > 0) {
            await page.setRequestInterception(true);
            page.on('request', (request) => {
              const resourceType = request.resourceType();
              if (this.options.blockResources!.includes(resourceType)) {
                request.abort();
              } else {
                request.continue();
              }
            });
          }
          
          // Set user agent
          if (this.options.rotateUserAgents) {
            const userAgents = [
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ];
            const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(randomUserAgent);
          }
        }
      ],
      
      requestHandler: async (crawlingContext) => {
        const { page, request } = crawlingContext;
        await this.handlePuppeteerRequest(page, request.loadedUrl!);
      },
      
      failedRequestHandler: async ({ request, error }) => {
        console.log(`❌ Puppeteer failed to process ${request.url}: ${error instanceof Error ? error.message : String(error)}`);
        // Try with Cheerio as final fallback
        if (this.cheerioCrawler) {
          await this.requestQueue?.addRequest({ url: request.url, userData: { ...request.userData, fallback: 'cheerio' } });
        }
      }
    });
  }

  private async initializeCheeriolCrawler(): Promise<void> {
    this.cheerioCrawler = new CheerioCrawler({
      requestQueue: this.requestQueue,
      maxConcurrency: this.options.maxConcurrency,
      requestHandlerTimeoutSecs: this.options.requestHandlerTimeoutSecs,
      maxRequestRetries: this.options.maxRequestRetries,
      useSessionPool: this.options.useSessionPool,
      
      requestHandler: async (crawlingContext) => {
        const { $, request } = crawlingContext;
        await this.handleCheerioRequest($, request.loadedUrl!);
      },
      
      failedRequestHandler: async ({ request, error }) => {
        console.log(`❌ Cheerio failed to process ${request.url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  async searchMultipleEngines(queries: string[], searchEngines: string[] = ['duckduckgo']): Promise<CrawleeSearchResult[]> {
    console.log(`🔍 Starting Crawlee-powered search for ${queries.length} queries across ${searchEngines.length} engines...`);
    
    const searchResults: CrawleeSearchResult[] = [];
    
    for (const engine of searchEngines) {
      for (const query of queries) {
        try {
          const results = await this.searchSingleEngine(query, engine as 'duckduckgo' | 'google' | 'bing');
          searchResults.push(...results);
        } catch (error) {
          console.log(`❌ Failed to search ${engine} for "${query}": ${error}`);
        }
      }
    }
    
    // Remove duplicates based on URL
    const uniqueResults = searchResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );
    
    console.log(`✅ Found ${uniqueResults.length} unique search results`);
    return uniqueResults;
  }

  private async searchSingleEngine(query: string, engine: 'duckduckgo' | 'google' | 'bing'): Promise<CrawleeSearchResult[]> {
    const startTime = Date.now();
    let searchUrl: string;
    
    switch (engine) {
      case 'duckduckgo':
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        break;
      case 'google':
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'bing':
        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        break;
      default:
        throw new Error(`Unsupported search engine: ${engine}`);
    }
    
    // Add search request to queue
    await this.requestQueue?.addRequest({
      url: searchUrl,
      userData: { 
        isSearchPage: true, 
        query, 
        engine, 
        startTime 
      }
    });
    
    // Use Playwright for search pages (better JavaScript support)
    const searchResults: CrawleeSearchResult[] = [];
    
    if (this.playwrightCrawler) {
      await this.playwrightCrawler.run();
    }
    
    return searchResults;
  }

  private async handlePlaywrightRequest(page: Page, url: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Wait for network to be idle if enabled
      if (this.options.waitForNetworkIdle) {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      }
      
      const title = await page.title();
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const scrapedData = await this.extractDataWithCheerio($, url, {
        loadTime: Date.now() - startTime,
        crawlerUsed: 'playwright',
        javascriptEnabled: true
      });
      
      await this.dataset?.pushData(scrapedData);
      
    } catch (error) {
      console.log(`❌ Error processing ${url} with Playwright: ${error}`);
      throw error;
    }
  }

  private async handlePuppeteerRequest(page: PuppeteerPage, url: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Wait for network idle if enabled
      if (this.options.waitForNetworkIdle) {
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 });
      }
      
      const title = await page.title();
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const scrapedData = await this.extractDataWithCheerio($, url, {
        loadTime: Date.now() - startTime,
        crawlerUsed: 'puppeteer',
        javascriptEnabled: true
      });
      
      await this.dataset?.pushData(scrapedData);
      
    } catch (error) {
      console.log(`❌ Error processing ${url} with Puppeteer: ${error}`);
      throw error;
    }
  }

  private async handleCheerioRequest($: cheerio.CheerioAPI, url: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const scrapedData = await this.extractDataWithCheerio($, url, {
        loadTime: Date.now() - startTime,
        crawlerUsed: 'cheerio',
        javascriptEnabled: false
      });
      
      await this.dataset?.pushData(scrapedData);
      
    } catch (error) {
      console.log(`❌ Error processing ${url} with Cheerio: ${error}`);
      throw error;
    }
  }

  private async extractDataWithCheerio($: cheerio.CheerioAPI, url: string, technical: Partial<CrawleeScrapedData['technical']>): Promise<CrawleeScrapedData> {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Extract basic content
    const title = $('title').text().trim() || $('h1').first().text().trim() || '';
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    
    // Extract headings
    const h1 = $('h1').map((_, el) => $(el).text().trim()).get();
    const h2 = $('h2').map((_, el) => $(el).text().trim()).get();
    const h3 = $('h3').map((_, el) => $(el).text().trim()).get();
    
    // Extract paragraphs
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 20);
    
    // Extract links
    const links = $('a[href]').map((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (!href || !text) return null;
      
      try {
        const linkUrl = new URL(href, url);
        return {
          text,
          url: linkUrl.href,
          isExternal: linkUrl.hostname !== domain
        };
      } catch {
        return null;
      }
    }).get().filter(Boolean);
    
    // Extract images
    const images = $('img[src]').map((_, el) => ({
      src: $(el).attr('src') || '',
      alt: $(el).attr('alt') || '',
      title: $(el).attr('title') || ''
    })).get();
    
    // Extract social links
    const socialPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'github', 'youtube'];
    const socialLinks = links.filter(link => 
      socialPlatforms.some(platform => link.url.toLowerCase().includes(platform))
    ).map(link => {
      const platform = socialPlatforms.find(p => link.url.toLowerCase().includes(p)) || 'unknown';
      const usernameMatch = link.url.match(/(?:\.com\/|\.com\/in\/|\.com\/company\/)([^\/\?#]+)/);
      return {
        platform,
        url: link.url,
        username: usernameMatch ? usernameMatch[1] : undefined
      };
    });
    
    // Extract contact information
    const emails = this.extractEmails($('body').text());
    const phones = this.extractPhones($('body').text());
    const addresses = this.extractAddresses($('body').text());
    
    // Extract metadata
    const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];
    const author = $('meta[name="author"]').attr('content') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
    const twitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
    const twitterImage = $('meta[name="twitter:image"]').attr('content') || '';
    
    // Calculate quality metrics
    const hasPersonalInfo = emails.length > 0 || phones.length > 0 || addresses.length > 0;
    const hasProfessionalInfo = title.toLowerCase().includes('ceo') || title.toLowerCase().includes('founder') || 
                               paragraphs.some(p => p.toLowerCase().includes('experience') || p.toLowerCase().includes('company'));
    const hasSocialMedia = socialLinks.length > 0;
    
    let contentQuality: 'high' | 'medium' | 'low' = 'low';
    if (paragraphs.length > 5 && (hasPersonalInfo || hasProfessionalInfo)) {
      contentQuality = 'high';
    } else if (paragraphs.length > 2) {
      contentQuality = 'medium';
    }
    
    const relevanceScore = this.calculateRelevanceScore({
      hasPersonalInfo,
      hasProfessionalInfo,
      hasSocialMedia,
      contentLength: paragraphs.join(' ').length,
      socialLinkCount: socialLinks.length
    });
    
    return {
      url,
      title,
      domain,
      content: {
        text: paragraphs.join(' '),
        headings: { h1, h2, h3 },
        paragraphs,
        links,
        images,
        socialLinks,
        contactInfo: { emails, phones, addresses }
      },
      metadata: {
        description,
        keywords,
        author,
        ogTitle,
        ogDescription,
        ogImage,
        twitterTitle,
        twitterDescription,
        twitterImage
      },
      technical: {
        loadTime: technical.loadTime || 0,
        responseTime: technical.loadTime || 0,
        statusCode: 200,
        contentLength: $('body').text().length,
        crawlerUsed: technical.crawlerUsed || 'cheerio',
        javascriptEnabled: technical.javascriptEnabled || false
      },
      quality: {
        hasPersonalInfo,
        hasProfessionalInfo,
        hasSocialMedia,
        contentQuality,
        relevanceScore
      }
    };
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  private extractPhones(text: string): string[] {
    const phoneRegex = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
    return text.match(phoneRegex) || [];
  }

  private extractAddresses(text: string): string[] {
    // Simple address extraction - could be enhanced
    const addressRegex = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b.*?(?:\d{5}|\w{2}\s+\d{5})/gi;
    return text.match(addressRegex) || [];
  }

  private calculateRelevanceScore(factors: {
    hasPersonalInfo: boolean;
    hasProfessionalInfo: boolean;
    hasSocialMedia: boolean;
    contentLength: number;
    socialLinkCount: number;
  }): number {
    let score = 0;
    
    if (factors.hasPersonalInfo) score += 30;
    if (factors.hasProfessionalInfo) score += 25;
    if (factors.hasSocialMedia) score += 20;
    if (factors.contentLength > 500) score += 15;
    if (factors.socialLinkCount > 1) score += 10;
    
    return Math.min(100, score);
  }

  async scrapeUrls(urls: string[]): Promise<CrawleeScrapedData[]> {
    console.log(`🕷️ Starting Crawlee-powered scraping of ${urls.length} URLs...`);
    
    // Clear previous data
    await this.dataset?.drop();
    this.dataset = await Dataset.open();
    
    // Add URLs to request queue
    for (const url of urls) {
      await this.requestQueue?.addRequest({ 
        url, 
        userData: { isScrapeRequest: true } 
      });
    }
    
    // Run all crawlers in parallel
    const crawlerPromises = [];
    
    if (this.playwrightCrawler) {
      crawlerPromises.push(this.playwrightCrawler.run());
    }
    if (this.puppeteerCrawler) {
      crawlerPromises.push(this.puppeteerCrawler.run());
    }
    if (this.cheerioCrawler) {
      crawlerPromises.push(this.cheerioCrawler.run());
    }
    
    await Promise.all(crawlerPromises);
    
    // Get results from dataset
    const results = await this.dataset?.getData();
    const scrapedData = results?.items as CrawleeScrapedData[] || [];
    
    console.log(`✅ Crawlee scraping completed! Successfully scraped ${scrapedData.length}/${urls.length} URLs`);
    
    return scrapedData;
  }

  async close(): Promise<void> {
    console.log('🔄 Closing Enhanced Crawlee Engine...');
    
    try {
      if (this.playwrightCrawler) {
        await this.playwrightCrawler.teardown();
      }
      if (this.puppeteerCrawler) {
        await this.puppeteerCrawler.teardown();
      }
      if (this.cheerioCrawler) {
        await this.cheerioCrawler.teardown();
      }
      
      console.log('✅ Crawlee Engine closed successfully');
      
      // Clean up temporary storage if enabled
      if (this.storageManager) {
        this.storageManager.cleanup();
      }
    } catch (error) {
      console.log(`❌ Error closing Crawlee Engine: ${error instanceof Error ? error.message : String(error)}`);
      
      // Still try to clean up storage even if crawler teardown failed
      if (this.storageManager) {
        this.storageManager.cleanup();
      }
    }
  }

  /**
   * Get storage manager for advanced control
   */
  getStorageManager(): TemporaryStorageManager | undefined {
    return this.storageManager;
  }

  /**
   * Get storage information
   */
  getStorageInfo() {
    return this.storageManager ? this.storageManager.getRunInfo() : null;
  }
}
