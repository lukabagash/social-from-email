import { PlaywrightCrawler, Dataset, RequestQueue, Configuration } from 'crawlee';
import { Page } from 'playwright';
import * as cheerio from 'cheerio';
import { TemporaryStorageManager } from '../utils/temporary-storage';
import { IntelligentSelectorManager } from '../selector-automation/intelligent-selector-manager';

export interface CrawleeSearchOptions {
  maxResultsPerEngine?: number;
  searchEngines?: ('duckduckgo' | 'google' | 'bing')[];
  maxConcurrency?: number;
  requestTimeout?: number;
  retries?: number;
  enableJavaScript?: boolean;
  blockResources?: string[];
  waitForNetworkIdle?: boolean;
  useTemporaryStorage?: boolean;
  retainStorageOnError?: boolean;
  storageNamespace?: string;
  useIntelligentSelectors?: boolean;
  selectorCacheEnabled?: boolean;
}

export interface SearchEngineResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  searchEngine: string;
  query: string;
  rank: number;
  timestamp: string;
  metadata: {
    hasRichSnippet: boolean;
    hasImage: boolean;
    isAd: boolean;
    estimatedLoadTime: number;
    selectorUsed?: string;
    selectorType?: 'intelligent' | 'fallback' | 'legacy';
  };
}

export class CrawleeSearchEngine {
  private crawler?: PlaywrightCrawler;
  private requestQueue?: RequestQueue;
  private dataset?: Dataset;
  private options: CrawleeSearchOptions;
  private searchResults: SearchEngineResult[] = [];
  private storageManager?: TemporaryStorageManager;
  private selectorManager: IntelligentSelectorManager;

  constructor(options: CrawleeSearchOptions = {}) {
    this.options = {
      maxResultsPerEngine: 10,
      searchEngines: ['duckduckgo', 'google', 'bing'],
      maxConcurrency: 3,
      requestTimeout: 30,
      retries: 2,
      enableJavaScript: true,
      blockResources: ['font', 'texttrack', 'object', 'beacon', 'csp_report'],
      waitForNetworkIdle: true,
      useTemporaryStorage: true,
      retainStorageOnError: false,
      useIntelligentSelectors: true,
      selectorCacheEnabled: true,
      ...options
    };

    // Initialize intelligent selector manager
    this.selectorManager = new IntelligentSelectorManager();

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
    console.log('🔍 Initializing Crawlee Search Engine...');
    
    // Initialize temporary storage if enabled
    if (this.storageManager) {
      this.storageManager.initialize();
      const runInfo = this.storageManager.getRunInfo();
      console.log(`🗂️  Using temporary search storage: ${runInfo.runId}`);
      
      // Configure Crawlee to use temporary storage
      const crawleeConfig = this.storageManager.getCrawleeConfig();
      Configuration.getGlobalConfig().set('storageClientOptions', {
        storageDir: crawleeConfig.storageDir
      });
      Configuration.getGlobalConfig().set('persistStorage', crawleeConfig.persistStorage);
      Configuration.getGlobalConfig().set('purgeOnStart', crawleeConfig.purgeOnStart);
    }
    
    this.requestQueue = await RequestQueue.open();
    this.dataset = await Dataset.open();
    
    this.crawler = new PlaywrightCrawler({
      requestQueue: this.requestQueue,
      maxConcurrency: this.options.maxConcurrency,
      requestHandlerTimeoutSecs: this.options.requestTimeout,
      maxRequestRetries: this.options.retries,
      useSessionPool: true,
      persistCookiesPerSession: false,
      
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
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor'
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
          
          // Rotate user agents
          const userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
          ];
          const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
          await page.setExtraHTTPHeaders({ 'User-Agent': randomUserAgent });
          
          // Set viewport to common size
          await page.setViewportSize({ width: 1920, height: 1080 });
        }
      ],
      
      requestHandler: async (crawlingContext) => {
        const { page, request } = crawlingContext;
        await this.handleSearchRequest(page, request);
      },
      
      failedRequestHandler: async ({ request, error }) => {
        console.log(`❌ Failed to process search for ${request.url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    
    console.log('✅ Crawlee Search Engine initialized');
    
    if (this.storageManager) {
      const runInfo = this.storageManager.getRunInfo();
      console.log(`📁 Search storage location: ${runInfo.storagePath}`);
      console.log(`🧹 Auto-cleanup: ${runInfo.cleanupOnExit ? 'Enabled' : 'Disabled'}`);
    }
  }

  async searchMultipleQueries(queries: string[]): Promise<SearchEngineResult[]> {
    console.log(`🔍 Starting multi-engine search for ${queries.length} queries...`);
    
    this.searchResults = [];
    
    // Clear previous data
    await this.dataset?.drop();
    this.dataset = await Dataset.open();
    
    // Add search requests for each query and engine
    for (const query of queries) {
      for (const engine of this.options.searchEngines || ['duckduckgo']) {
        const searchUrl = this.buildSearchUrl(query, engine);
        await this.requestQueue?.addRequest({
          url: searchUrl,
          userData: {
            query,
            engine,
            isSearchPage: true,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
    
    // Run the crawler
    if (this.crawler) {
      await this.crawler.run();
    }
    
    // Get results and remove duplicates
    const uniqueResults = this.removeDuplicateUrls(this.searchResults);
    
    console.log(`✅ Search completed! Found ${uniqueResults.length} unique results from ${this.searchResults.length} total results`);
    return uniqueResults;
  }

  private buildSearchUrl(query: string, engine: string): string {
    const encodedQuery = encodeURIComponent(query);
    
    switch (engine) {
      case 'duckduckgo':
        return `https://duckduckgo.com/?q=${encodedQuery}&t=h_&ia=web`;
      case 'google':
        return `https://www.google.com/search?q=${encodedQuery}&num=${this.options.maxResultsPerEngine}`;
      case 'bing':
        return `https://www.bing.com/search?q=${encodedQuery}&count=${this.options.maxResultsPerEngine}`;
      default:
        throw new Error(`Unsupported search engine: ${engine}`);
    }
  }

  private async handleSearchRequest(page: Page, request: any): Promise<void> {
    const { query, engine, timestamp } = request.userData;
    const startTime = Date.now();
    
    try {
      // Wait for page to load
      if (this.options.waitForNetworkIdle) {
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      }
      
      // Wait for search results to appear
      await this.waitForSearchResults(page, engine);
      
      // Extract search results
      const results = await this.extractSearchResults(page, engine, query, timestamp);
      
      // Store results
      this.searchResults.push(...results);
      
      // Save to dataset
      for (const result of results) {
        await this.dataset?.pushData(result);
      }
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Extracted ${results.length} results from ${engine} for "${query}" (${loadTime}ms)`);
      
    } catch (error) {
      console.log(`❌ Error processing search ${engine} for "${query}": ${error}`);
    }
  }

  private async waitForSearchResults(page: Page, engine: string): Promise<void> {
    const searchEngine = engine as 'google' | 'duckduckgo' | 'bing';
    
    try {
      // Get intelligent selector for search results - this already has the full fallback strategy
      const selector = await this.selectorManager.getSelector(page, searchEngine, 'search-results');
      
      // Try the intelligent selector
      await page.waitForSelector(selector, { timeout: 5000 });
      console.log(`✅ Found ${engine} results with intelligent selector: ${selector}`);
      return;
    } catch (error) {
      console.log(`⚠️ Intelligent selector failed for ${engine}, checking page content...`);
      
      // If selector fails, log page content for debugging
      const pageText = await page.textContent('body') || '';
      if (pageText.length > 100) {
        console.log(`✅ Page loaded for ${engine} (${pageText.length} characters), will try extraction anyway`);
      } else {
        console.log(`❌ Page appears empty for ${engine}`);
      }
    }
  }

  private async extractSearchResults(page: Page, engine: string, query: string, timestamp: string): Promise<SearchEngineResult[]> {
    if (!this.options.useIntelligentSelectors) {
      // Fallback to original extraction method
      return this.extractSearchResultsLegacy(page, engine, query, timestamp);
    }

    const results: SearchEngineResult[] = [];

    try {
      const searchEngine = engine as 'google' | 'duckduckgo' | 'bing';
      
      // Get intelligent selectors
      const resultSelector = await this.selectorManager.getSelector(page, searchEngine, 'search-results');
      const titleSelector = await this.selectorManager.getSelector(page, searchEngine, 'result-title');
      const linkSelector = await this.selectorManager.getSelector(page, searchEngine, 'result-link');
      const descriptionSelector = await this.selectorManager.getSelector(page, searchEngine, 'result-description');

      console.log(`🎯 Using intelligent selectors for ${engine}: ${resultSelector}`);

      // Extract results using intelligent selectors
      const extractedData = await page.evaluate(
        ({ resultSel, titleSel, linkSel, descSel, query, engine, timestamp }) => {
          const results: any[] = [];
          const resultElements = document.querySelectorAll(resultSel);
          
          resultElements.forEach((element, index) => {
            try {
              // Extract title
              let title = '';
              const titleEl = element.querySelector(titleSel);
              if (titleEl) {
                title = titleEl.textContent?.trim() || '';
              }

              // Extract link
              let url = '';
              const linkEl = element.querySelector(linkSel) || element.querySelector('a[href]');
              if (linkEl) {
                url = linkEl.getAttribute('href') || '';
              }

              // Extract description
              let snippet = '';
              const descEl = element.querySelector(descSel);
              if (descEl) {
                snippet = descEl.textContent?.trim() || '';
              }

              // Validate and clean data
              if (title && url && !url.startsWith('/') && !url.includes(`${engine}.com`)) {
                try {
                  const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                  
                  results.push({
                    title,
                    url: urlObj.href,
                    snippet,
                    domain: urlObj.hostname,
                    searchEngine: engine,
                    query,
                    rank: index + 1,
                    timestamp,
                    metadata: {
                      hasRichSnippet: element.querySelector('.rich-snippet, .enhanced-snippet') !== null,
                      hasImage: element.querySelector('img') !== null,
                      isAd: element.classList.contains('ad') || element.querySelector('.ad-indicator') !== null,
                      estimatedLoadTime: 0,
                      selectorUsed: resultSel,
                      selectorType: 'intelligent' as const
                    }
                  });
                } catch (urlError) {
                  console.warn('Invalid URL found:', url);
                }
              }
            } catch (error) {
              console.warn('Error extracting result:', error);
            }
          });
          
          return results;
        },
        {
          resultSel: resultSelector,
          titleSel: titleSelector,
          linkSel: linkSelector,
          descSel: descriptionSelector,
          query,
          engine,
          timestamp
        }
      );

      results.push(...extractedData.slice(0, this.options.maxResultsPerEngine));
      
      if (results.length === 0) {
        console.warn(`⚠️ No results found with intelligent selectors for ${engine}, trying fallback...`);
        return this.extractSearchResultsLegacy(page, engine, query, timestamp);
      }

      console.log(`✨ Successfully extracted ${results.length} results using intelligent selectors`);
      
    } catch (error) {
      console.error(`❌ Error with intelligent selectors for ${engine}:`, error);
      console.log(`🔄 Falling back to legacy extraction...`);
      return this.extractSearchResultsLegacy(page, engine, query, timestamp);
    }

    return results;
  }

  private async extractSearchResultsLegacy(page: Page, engine: string, query: string, timestamp: string): Promise<SearchEngineResult[]> {
    const content = await page.content();
    const $ = cheerio.load(content);
    const results: SearchEngineResult[] = [];
    
    switch (engine) {
      case 'duckduckgo':
        results.push(...this.extractDuckDuckGoResults($, query, timestamp));
        break;
      case 'google':
        results.push(...this.extractGoogleResults($, query, timestamp));
        break;
      case 'bing':
        results.push(...this.extractBingResults($, query, timestamp));
        break;
    }
    
    // Mark as legacy extraction
    results.forEach(result => {
      result.metadata.selectorType = 'legacy';
    });
    
    return results.slice(0, this.options.maxResultsPerEngine);
  }

  private extractDuckDuckGoResults($: cheerio.CheerioAPI, query: string, timestamp: string): SearchEngineResult[] {
    const results: SearchEngineResult[] = [];
    
    // Use semantic selectors instead of hardcoded ones - intelligent approach
    const semanticSelectors = [
      '[data-testid*="result"]',    // Data attribute approach
      '[class*="result"]',          // Class contains result
      'article',                    // Semantic HTML
      'div[class*="search"]',       // Search-related divs
      'section'                     // Semantic sections
    ];
    
    for (const selector of semanticSelectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Use semantic title selectors - intelligent approach
        let titleEl = $el.find('h1 a, h2 a, h3 a').first();
        if (!titleEl.length) titleEl = $el.find('[class*="title"] a').first();
        if (!titleEl.length) titleEl = $el.find('a[href]').first();
        
        // Use semantic snippet selectors - intelligent approach  
        let snippetEl = $el.find('p').first();
        if (!snippetEl.length) snippetEl = $el.find('[class*="snippet"], [class*="description"], [class*="summary"]').first();
        if (!snippetEl.length) snippetEl = $el.find('div').filter((i, div) => $(div).text().length > 20).first();
        
        const title = titleEl.text().trim();
        const url = titleEl.attr('href');
        const snippet = snippetEl.text().trim();
        
        if (title && url && !url.startsWith('/') && !url.includes('duckduckgo.com')) {
          try {
            const urlObj = new URL(url);
            results.push({
              title,
              url,
              snippet,
              domain: urlObj.hostname,
              searchEngine: 'duckduckgo',
              query,
              rank: index + 1,
              timestamp,
              metadata: {
                hasRichSnippet: snippetEl.find('.result__meta').length > 0,
                hasImage: $el.find('.result__image').length > 0,
                isAd: $el.hasClass('result--ad'),
                estimatedLoadTime: 0
              }
            });
          } catch (error) {
            console.log(`⚠️ Invalid URL from DuckDuckGo: ${url}`);
          }
        }
      });
      
      if (results.length > 0) {
        console.log(`✅ Extracted ${results.length} DuckDuckGo results using selector: ${selector}`);
        break; // Success, no need to try other selectors
      }
    }
    
    return results;
  }

  private extractGoogleResults($: cheerio.CheerioAPI, query: string, timestamp: string): SearchEngineResult[] {
    const results: SearchEngineResult[] = [];
    
    // Try multiple selectors for Google results
    const selectors = [
      '#search .g',
      '.g',
      '.MjjYud',
      '.hlcw0c',
      '.tF2Cxc'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Try different title and link selectors
        let titleEl = $el.find('h3').first();
        let linkEl = $el.find('a[href]').first();
        
        // Alternative selectors
        if (!titleEl.length || !linkEl.length) {
          titleEl = $el.find('.LC20lb, .DKV0Md');
          linkEl = $el.find('a[href]').first();
        }
        
        // Try different snippet selectors
        let snippetEl = $el.find('.VwiC3b, .yXK7lf, .hgKElc, .s3v9rd, .st');
        
        const title = titleEl.text().trim();
        const url = linkEl.attr('href');
        const snippet = snippetEl.text().trim();
        
        if (title && url && !url.startsWith('/') && !url.includes('google.com') && !url.startsWith('#')) {
          try {
            const urlObj = new URL(url);
            results.push({
              title,
              url,
              snippet,
              domain: urlObj.hostname,
              searchEngine: 'google',
              query,
              rank: index + 1,
              timestamp,
              metadata: {
                hasRichSnippet: $el.find('.kp-blk').length > 0,
                hasImage: $el.find('img').length > 0,
                isAd: $el.find('.ads-ad').length > 0,
                estimatedLoadTime: 0
              }
            });
          } catch (error) {
            console.log(`⚠️ Invalid URL from Google: ${url}`);
          }
        }
      });
      
      if (results.length > 0) {
        console.log(`✅ Extracted ${results.length} Google results using selector: ${selector}`);
        break; // Success, no need to try other selectors
      }
    }
    
    return results;
  }

  private extractBingResults($: cheerio.CheerioAPI, query: string, timestamp: string): SearchEngineResult[] {
    const results: SearchEngineResult[] = [];
    
    $('.b_algo').each((index, element) => {
      const $el = $(element);
      const titleEl = $el.find('h2 a');
      const snippetEl = $el.find('.b_caption p');
      
      const title = titleEl.text().trim();
      const url = titleEl.attr('href');
      const snippet = snippetEl.text().trim();
      
      if (title && url && !url.startsWith('/')) {
        try {
          const urlObj = new URL(url);
          results.push({
            title,
            url,
            snippet,
            domain: urlObj.hostname,
            searchEngine: 'bing',
            query,
            rank: index + 1,
            timestamp,
            metadata: {
              hasRichSnippet: $el.find('.b_rich').length > 0,
              hasImage: $el.find('.cico').length > 0,
              isAd: $el.find('.b_ad').length > 0,
              estimatedLoadTime: 0
            }
          });
        } catch (error) {
          console.log(`⚠️ Invalid URL from Bing: ${url}`);
        }
      }
    });
    
    return results;
  }

  private removeDuplicateUrls(results: SearchEngineResult[]): SearchEngineResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.url)) {
        return false;
      }
      seen.add(result.url);
      return true;
    });
  }

  async close(): Promise<void> {
    console.log('🔄 Closing Crawlee Search Engine...');
    try {
      if (this.crawler) {
        await this.crawler.teardown();
      }
      console.log('✅ Crawlee Search Engine closed successfully');
      
      // Clean up temporary storage if enabled
      if (this.storageManager) {
        this.storageManager.cleanup();
      }
    } catch (error) {
      console.log(`❌ Error closing Crawlee Search Engine: ${error instanceof Error ? error.message : String(error)}`);
      
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
   * Get intelligent selector performance statistics
   */
  getSelectorStats() {
    return this.selectorManager.getCacheStats();
  }

  /**
   * Clear selector cache (useful for testing)
   */
  clearSelectorCache(): void {
    // Clear the cache by creating a new instance
    this.selectorManager = new IntelligentSelectorManager();
  }
}
