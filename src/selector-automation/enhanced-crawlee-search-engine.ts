import { PlaywrightCrawler, Dataset, RequestQueue, Configuration } from 'crawlee';
import { Page } from 'playwright';
import * as cheerio from 'cheerio';
import { TemporaryStorageManager } from '../utils/temporary-storage';
import { IntelligentSelectorManager } from '../selector-automation/intelligent-selector-manager';

export interface EnhancedCrawleeSearchOptions {
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

export class EnhancedCrawleeSearchEngine {
  private crawler?: PlaywrightCrawler;
  private requestQueue?: RequestQueue;
  private dataset?: Dataset;
  private options: EnhancedCrawleeSearchOptions;
  private searchResults: SearchEngineResult[] = [];
  private storageManager?: TemporaryStorageManager;
  private selectorManager: IntelligentSelectorManager;

  constructor(options: EnhancedCrawleeSearchOptions = {}) {
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
    console.log('🚀 Initializing Enhanced Crawlee Search Engine with Intelligent Selectors...');
    
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
        
        try {
          const startTime = Date.now();
          const url = new URL(request.url);
          const searchParams = url.searchParams;
          const query = searchParams.get('q') || '';
          const engine = this.detectEngine(request.url);
          
          console.log(`🔍 Processing ${engine} search for: "${query}"`);
          
          // Wait for network idle if enabled
          if (this.options.waitForNetworkIdle) {
            await page.waitForLoadState('networkidle', { timeout: 10000 });
          }
          
          // Extract results using intelligent selectors
          const extractedResults = await this.extractSearchResultsIntelligently(
            page, 
            engine, 
            query, 
            new Date().toISOString()
          );
          
          const loadTime = Date.now() - startTime;
          console.log(`✅ Extracted ${extractedResults.length} results from ${engine} in ${loadTime}ms`);
          
          // Add results to our collection
          this.searchResults.push(...extractedResults);
          
          // Store in dataset if available
          if (this.dataset) {
            await this.dataset.pushData(extractedResults);
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${request.url}:`, error);
          throw error;
        }
      },
      
      failedRequestHandler: async ({ request }) => {
        console.error(`💥 Request failed after retries: ${request.url}`);
      }
    });
  }

  /**
   * Enhanced search results extraction using intelligent selectors
   */
  private async extractSearchResultsIntelligently(
    page: Page, 
    engine: string, 
    query: string, 
    timestamp: string
  ): Promise<SearchEngineResult[]> {
    const results: SearchEngineResult[] = [];

    if (!this.options.useIntelligentSelectors) {
      // Fallback to original extraction method
      return this.extractSearchResultsLegacy(page, engine, query, timestamp);
    }

    try {
      const searchEngine = engine as 'google' | 'duckduckgo' | 'bing';
      
      // Get intelligent selectors
      const resultSelector = await this.selectorManager.getSelector(page, searchEngine, 'search-results');
      const titleSelector = await this.selectorManager.getSelector(page, searchEngine, 'result-title');
      const linkSelector = await this.selectorManager.getSelector(page, searchEngine, 'result-link');
      const descriptionSelector = await this.selectorManager.getSelector(page, searchEngine, 'result-description');

      console.log(`🎯 Using intelligent selectors for ${engine}:`);
      console.log(`   Results: ${resultSelector}`);
      console.log(`   Titles: ${titleSelector}`);

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

  /**
   * Legacy search results extraction (fallback)
   */
  private async extractSearchResultsLegacy(
    page: Page, 
    engine: string, 
    query: string, 
    timestamp: string
  ): Promise<SearchEngineResult[]> {
    const content = await page.content();
    const $ = cheerio.load(content);
    const results: SearchEngineResult[] = [];
    
    switch (engine) {
      case 'duckduckgo':
        results.push(...this.extractDuckDuckGoResultsLegacy($, query, timestamp));
        break;
      case 'google':
        results.push(...this.extractGoogleResultsLegacy($, query, timestamp));
        break;
      case 'bing':
        results.push(...this.extractBingResultsLegacy($, query, timestamp));
        break;
    }
    
    // Mark as legacy extraction
    results.forEach(result => {
      result.metadata.selectorType = 'legacy';
    });
    
    return results.slice(0, this.options.maxResultsPerEngine);
  }

  /**
   * Legacy DuckDuckGo extraction with hardcoded selectors
   */
  private extractDuckDuckGoResultsLegacy($: cheerio.CheerioAPI, query: string, timestamp: string): SearchEngineResult[] {
    const results: SearchEngineResult[] = [];
    
    // Try multiple selectors for DuckDuckGo results
    const selectors = [
      '.results .result',
      '.result',
      '.web-result',
      '[data-testid="result"]',
      '.links_main'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Try different title selectors
        let titleEl = $el.find('.result__title a');
        if (!titleEl.length) titleEl = $el.find('h2 a');
        if (!titleEl.length) titleEl = $el.find('h3 a');
        if (!titleEl.length) titleEl = $el.find('a[href]').first();
        
        // Try different snippet selectors
        let snippetEl = $el.find('.result__snippet');
        if (!snippetEl.length) snippetEl = $el.find('.result__meta');
        if (!snippetEl.length) snippetEl = $el.find('.snippet');
        
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
                estimatedLoadTime: 0,
                selectorUsed: selector,
                selectorType: 'legacy'
              }
            });
          } catch (error) {
            console.warn('Invalid URL in DuckDuckGo result:', url);
          }
        }
      });
      
      if (results.length > 0) break; // Stop if we found results with this selector
    }
    
    return results;
  }

  private extractGoogleResultsLegacy($: cheerio.CheerioAPI, query: string, timestamp: string): SearchEngineResult[] {
    const results: SearchEngineResult[] = [];
    
    // Try multiple selectors for Google results
    const selectors = [
      '.g',
      '.tF2Cxc',
      '.rc',
      '#search .g',
      '.MjjYud'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Try different title selectors
        let titleEl = $el.find('h3');
        if (!titleEl.length) titleEl = $el.find('.r a h3');
        if (!titleEl.length) titleEl = $el.find('.LC20lb');
        
        // Try different link selectors
        let linkEl = $el.find('a[href]').first();
        if (!linkEl.length) linkEl = $el.find('.r a');
        if (!linkEl.length) linkEl = $el.find('.yuRUbf a');
        
        // Try different snippet selectors
        let snippetEl = $el.find('.st');
        if (!snippetEl.length) snippetEl = $el.find('.VwiC3b');
        if (!snippetEl.length) snippetEl = $el.find('.s p');
        
        const title = titleEl.text().trim();
        const url = linkEl.attr('href');
        const snippet = snippetEl.text().trim();
        
        if (title && url && !url.startsWith('/') && !url.includes('google.com/search')) {
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
                hasRichSnippet: $el.find('.kno-rdesc').length > 0,
                hasImage: $el.find('img').length > 0,
                isAd: $el.find('.ads-ad').length > 0,
                estimatedLoadTime: 0,
                selectorUsed: selector,
                selectorType: 'legacy'
              }
            });
          } catch (error) {
            console.warn('Invalid URL in Google result:', url);
          }
        }
      });
      
      if (results.length > 0) break;
    }
    
    return results;
  }

  private extractBingResultsLegacy($: cheerio.CheerioAPI, query: string, timestamp: string): SearchEngineResult[] {
    const results: SearchEngineResult[] = [];
    
    // Try multiple selectors for Bing results
    const selectors = [
      '.b_algo',
      '.b_searchResult',
      '.b_ans'
    ];
    
    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        
        // Try different title selectors
        let titleEl = $el.find('.b_title a');
        if (!titleEl.length) titleEl = $el.find('h2 a');
        if (!titleEl.length) titleEl = $el.find('h3 a');
        
        // Try different snippet selectors
        let snippetEl = $el.find('.b_caption');
        if (!snippetEl.length) snippetEl = $el.find('.b_snippet');
        if (!snippetEl.length) snippetEl = $el.find('p');
        
        const title = titleEl.text().trim();
        const url = titleEl.attr('href');
        const snippet = snippetEl.text().trim();
        
        if (title && url && !url.startsWith('/') && !url.includes('bing.com/search')) {
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
                hasImage: $el.find('img').length > 0,
                isAd: $el.hasClass('b_adTop') || $el.hasClass('b_adBottom'),
                estimatedLoadTime: 0,
                selectorUsed: selector,
                selectorType: 'legacy'
              }
            });
          } catch (error) {
            console.warn('Invalid URL in Bing result:', url);
          }
        }
      });
      
      if (results.length > 0) break;
    }
    
    return results;
  }

  async search(queries: string[]): Promise<SearchEngineResult[]> {
    console.log(`🔍 Starting intelligent search for ${queries.length} queries across ${this.options.searchEngines?.length} engines`);
    
    if (!this.crawler || !this.requestQueue) {
      throw new Error('Search engine not initialized. Call initialize() first.');
    }
    
    this.searchResults = [];
    
    // Build search URLs
    for (const query of queries) {
      for (const engine of this.options.searchEngines || []) {
        const searchUrl = this.buildSearchUrl(engine, query);
        await this.requestQueue.addRequest({ 
          url: searchUrl,
          userData: { query, engine }
        });
      }
    }
    
    console.log(`📋 Added ${(queries.length * (this.options.searchEngines?.length || 0))} search requests to queue`);
    
    // Process all requests
    await this.crawler.run();
    
    // Log intelligent selector statistics
    const selectorStats = this.selectorManager.getCacheStats();
    console.log(`📊 Selector Performance:`, selectorStats);
    
    console.log(`✅ Search completed. Total results: ${this.searchResults.length}`);
    
    return this.searchResults;
  }

  private buildSearchUrl(engine: string, query: string): string {
    const encodedQuery = encodeURIComponent(query);
    
    switch (engine) {
      case 'google':
        return `https://www.google.com/search?q=${encodedQuery}&num=${this.options.maxResultsPerEngine}`;
      case 'duckduckgo':
        return `https://duckduckgo.com/?q=${encodedQuery}`;
      case 'bing':
        return `https://www.bing.com/search?q=${encodedQuery}&count=${this.options.maxResultsPerEngine}`;
      default:
        throw new Error(`Unsupported search engine: ${engine}`);
    }
  }

  private detectEngine(url: string): string {
    if (url.includes('google.com')) return 'google';
    if (url.includes('duckduckgo.com')) return 'duckduckgo';
    if (url.includes('bing.com')) return 'bing';
    return 'unknown';
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Enhanced Crawlee Search Engine...');
    
    if (this.crawler) {
      await this.crawler.teardown();
    }
    
    if (this.storageManager) {
      await this.storageManager.cleanup();
    }
    
    console.log('✅ Enhanced Crawlee Search Engine cleanup completed');
  }

  getResults(): SearchEngineResult[] {
    return this.searchResults;
  }

  getSelectorStats() {
    return this.selectorManager.getCacheStats();
  }
}
