import { chromium, firefox, webkit, Browser as PlaywrightBrowser, Page as PlaywrightPage } from 'playwright';
import puppeteer, { Browser as PuppeteerBrowser, Page as PuppeteerPage } from 'puppeteer';
import * as dotenv from 'dotenv';

dotenv.config();

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  scrapeMethod?: 'playwright' | 'puppeteer';
  browserEngine?: 'chromium' | 'firefox' | 'webkit';
}

export interface UltimateSearchOptions {
  maxResults?: number;
  includeSnippets?: boolean;
  timeout?: number;
  queryLimit?: number;
  useMultipleBrowsers?: boolean;
  rotateUserAgents?: boolean;
  enableStealth?: boolean;
  parallelSessions?: number;
  fallbackEngine?: boolean;
}

export interface SessionPool {
  playwright: {
    chromium?: PlaywrightBrowser;
    firefox?: PlaywrightBrowser;
    webkit?: PlaywrightBrowser;
  };
  puppeteer?: PuppeteerBrowser;
}

export class UltimateCrawlerEngine {
  private sessionPool: SessionPool = { playwright: {} };
  private sessionIndex = 0;
  private userAgents: string[] = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];

  async initialize(options: UltimateSearchOptions = {}): Promise<void> {
    console.log('🚀 Initializing Ultimate Crawler Engine...');
    
    try {
      // Initialize Playwright browsers
      if (options.useMultipleBrowsers !== false) {
        console.log('🌐 Launching Playwright browsers...');
        
        // Launch Chromium (primary)
        this.sessionPool.playwright.chromium = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor'
          ]
        });
        
        // Launch Firefox (secondary)
        this.sessionPool.playwright.firefox = await firefox.launch({
          headless: true,
          args: ['--no-sandbox']
        });
        
        // Launch WebKit (tertiary)
        this.sessionPool.playwright.webkit = await webkit.launch({
          headless: true
        });
        
        console.log('✅ Playwright browsers launched: Chromium, Firefox, WebKit');
      }
      
      // Initialize Puppeteer (fallback and stealth)
      console.log('🕷️  Launching Puppeteer browser...');
      this.sessionPool.puppeteer = await puppeteer.launch({
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
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      console.log('✅ Ultimate Crawler Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Ultimate Crawler Engine:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    console.log('🔄 Closing Ultimate Crawler Engine...');
    
    try {
      // Close Playwright browsers
      if (this.sessionPool.playwright.chromium) {
        await this.sessionPool.playwright.chromium.close();
      }
      if (this.sessionPool.playwright.firefox) {
        await this.sessionPool.playwright.firefox.close();
      }
      if (this.sessionPool.playwright.webkit) {
        await this.sessionPool.playwright.webkit.close();
      }
      
      // Close Puppeteer browser
      if (this.sessionPool.puppeteer) {
        await this.sessionPool.puppeteer.close();
      }
      
      console.log('✅ Ultimate Crawler Engine closed successfully');
    } catch (error) {
      console.error('⚠️  Error closing browsers:', error);
    }
  }

  private getNextBrowserSession(): { browser: PlaywrightBrowser | PuppeteerBrowser; engine: string; type: 'playwright' | 'puppeteer' } {
    const availableSessions = [];
    
    if (this.sessionPool.playwright.chromium) {
      availableSessions.push({ browser: this.sessionPool.playwright.chromium, engine: 'chromium', type: 'playwright' as const });
    }
    if (this.sessionPool.playwright.firefox) {
      availableSessions.push({ browser: this.sessionPool.playwright.firefox, engine: 'firefox', type: 'playwright' as const });
    }
    if (this.sessionPool.playwright.webkit) {
      availableSessions.push({ browser: this.sessionPool.playwright.webkit, engine: 'webkit', type: 'playwright' as const });
    }
    if (this.sessionPool.puppeteer) {
      availableSessions.push({ browser: this.sessionPool.puppeteer, engine: 'puppeteer', type: 'puppeteer' as const });
    }
    
    // Round-robin selection
    const session = availableSessions[this.sessionIndex % availableSessions.length];
    this.sessionIndex++;
    
    return session;
  }

  private async createPlaywrightPage(browser: PlaywrightBrowser, options: UltimateSearchOptions): Promise<PlaywrightPage> {
    const page = await browser.newPage();
    
    // Set user agent
    if (options.rotateUserAgents !== false) {
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await page.setExtraHTTPHeaders({
        'User-Agent': userAgent
      });
    }
    
    // Set viewport
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Enhanced stealth for Playwright
    if (options.enableStealth !== false) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Mock permissions
        Object.defineProperty(navigator, 'permissions', {
          get: () => ({
            query: () => Promise.resolve({ state: 'granted' }),
          }),
        });
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
          ],
        });
      });
    }
    
    return page;
  }

  private async createPuppeteerPage(browser: PuppeteerBrowser, options: UltimateSearchOptions): Promise<PuppeteerPage> {
    const page = await browser.newPage();
    
    // Set user agent
    if (options.rotateUserAgents !== false) {
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await page.setUserAgent(userAgent);
    }
    
    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Enhanced stealth for Puppeteer
    if (options.enableStealth !== false) {
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
          ],
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });
    }
    
    return page;
  }

  async searchDuckDuckGo(query: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    const { maxResults = 10, includeSnippets = true, timeout = 30000 } = options;
    const session = this.getNextBrowserSession();
    
    console.log(`🔍 Searching DuckDuckGo for: "${query}" using ${session.engine} (${session.type})`);
    
    try {
      if (session.type === 'playwright') {
        return await this.searchWithPlaywright(session.browser as PlaywrightBrowser, session.engine, query, options);
      } else {
        return await this.searchWithPuppeteer(session.browser as PuppeteerBrowser, query, options);
      }
    } catch (error) {
      console.error(`❌ Search failed with ${session.engine}, attempting fallback...`);
      
      if (options.fallbackEngine !== false) {
        return await this.searchWithFallback(query, options);
      } else {
        throw error;
      }
    }
  }

  private async searchWithPlaywright(browser: PlaywrightBrowser, engine: string, query: string, options: UltimateSearchOptions): Promise<SearchResult[]> {
    const page = await this.createPlaywrightPage(browser, options);
    const results: SearchResult[] = [];
    
    try {
      // Navigate to DuckDuckGo
      await page.goto('https://duckduckgo.com', { waitUntil: 'networkidle', timeout: options.timeout });

      // Find search input and enter query
      await page.waitForSelector('input[name="q"]', { timeout: 10000 });
      await page.fill('input[name="q"]', query);
      
      // Submit the search
      await page.press('input[name="q"]', 'Enter');
      
      // Wait for search results to load
      await page.waitForSelector('[data-testid="result"]', { timeout: 15000 });
      
      // Extract search results using Playwright
      const searchResults = await page.evaluate(({ maxResults, includeSnippets }: { maxResults: number; includeSnippets: boolean }) => {
        const results: Array<{title: string; url: string; snippet: string; domain: string}> = [];
        const resultElements = Array.from(document.querySelectorAll('[data-testid="result"]'));
        
        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const resultContainer = resultElements[i];
          
          try {
            const titleElement = resultContainer.querySelector('[data-testid="result-title-a"]') || 
                                resultContainer.querySelector('h2 a') ||
                                resultContainer.querySelector('h3 a');
            const title = titleElement?.textContent?.trim() || '';
            
            const linkElement = titleElement as HTMLAnchorElement;
            let url = linkElement?.href || '';
            
            let snippet = '';
            if (includeSnippets) {
              const snippetSelectors = [
                '[data-testid="result-snippet"]',
                '.result__snippet',
                '.result-snippet',
                '[data-result="snippet"]'
              ];
              
              for (const selector of snippetSelectors) {
                const snippetElement = resultContainer.querySelector(selector);
                if (snippetElement?.textContent) {
                  snippet = snippetElement.textContent.trim();
                  break;
                }
              }
            }
            
            const domain = url ? new URL(url).hostname : '';
            
            if (title && url && url.startsWith('http')) {
              results.push({ title, url, snippet, domain });
            }
          } catch (error) {
            console.error('Error parsing search result:', error);
          }
        }
        
        return results;
      }, { maxResults: options.maxResults || 10, includeSnippets: options.includeSnippets !== false });

      // Add metadata about the scraping method
      const enhancedResults = searchResults.map((result: {title: string; url: string; snippet: string; domain: string}) => ({
        ...result,
        scrapeMethod: 'playwright' as const,
        browserEngine: engine as any
      }));

      results.push(...enhancedResults);
      
      console.log(`✅ Found ${results.length} results using Playwright (${engine})`);

    } catch (error) {
      console.error(`Error during Playwright search (${engine}):`, error);
      throw error;
    } finally {
      await page.close();
    }

    return results;
  }

  private async searchWithPuppeteer(browser: PuppeteerBrowser, query: string, options: UltimateSearchOptions): Promise<SearchResult[]> {
    const page = await this.createPuppeteerPage(browser, options);
    const results: SearchResult[] = [];

    try {
      // Navigate to DuckDuckGo
      await page.goto('https://duckduckgo.com', { waitUntil: 'networkidle2', timeout: options.timeout });

      // Find search input and enter query
      await page.waitForSelector('input[name="q"]', { timeout: 10000 });
      await page.type('input[name="q"]', query);
      
      // Submit the search
      await page.keyboard.press('Enter');
      
      // Wait for search results to load
      await page.waitForSelector('[data-testid="result"]', { timeout: 15000 });
      
      // Extract search results using Puppeteer
      const searchResults = await page.evaluate((maxRes: number, includeSnips: boolean) => {
        const results: Array<{title: string; url: string; snippet: string; domain: string}> = [];
        const resultElements = Array.from(document.querySelectorAll('[data-testid="result"]'));
        
        for (let i = 0; i < Math.min(resultElements.length, maxRes); i++) {
          const resultContainer = resultElements[i];
          
          try {
            const titleElement = resultContainer.querySelector('[data-testid="result-title-a"]') || 
                                resultContainer.querySelector('h2 a') ||
                                resultContainer.querySelector('h3 a');
            const title = titleElement?.textContent?.trim() || '';
            
            const linkElement = titleElement as HTMLAnchorElement;
            let url = linkElement?.href || '';
            
            let snippet = '';
            if (includeSnips) {
              const snippetSelectors = [
                '[data-testid="result-snippet"]',
                '.result__snippet',
                '.result-snippet',
                '[data-result="snippet"]'
              ];
              
              for (const selector of snippetSelectors) {
                const snippetElement = resultContainer.querySelector(selector);
                if (snippetElement?.textContent) {
                  snippet = snippetElement.textContent.trim();
                  break;
                }
              }
            }
            
            const domain = url ? new URL(url).hostname : '';
            
            if (title && url && url.startsWith('http')) {
              results.push({ title, url, snippet, domain });
            }
          } catch (error) {
            console.error('Error parsing search result:', error);
          }
        }
        
        return results;
      }, options.maxResults || 10, options.includeSnippets !== false);

      // Add metadata about the scraping method
      const enhancedResults = searchResults.map((result: {title: string; url: string; snippet: string; domain: string}) => ({
        ...result,
        scrapeMethod: 'puppeteer' as const,
        browserEngine: 'chromium' as any
      }));

      results.push(...enhancedResults);
      
      console.log(`✅ Found ${results.length} results using Puppeteer`);

    } catch (error) {
      console.error('Error during Puppeteer search:', error);
      throw error;
    } finally {
      await page.close();
    }

    return results;
  }

  private async searchWithFallback(query: string, options: UltimateSearchOptions): Promise<SearchResult[]> {
    console.log('🔄 Attempting fallback search...');
    
    // Try different browser engines in order of preference
    const fallbackOrder = ['puppeteer', 'chromium', 'firefox', 'webkit'];
    
    for (const engineType of fallbackOrder) {
      try {
        if (engineType === 'puppeteer' && this.sessionPool.puppeteer) {
          return await this.searchWithPuppeteer(this.sessionPool.puppeteer, query, options);
        } else if (engineType === 'chromium' && this.sessionPool.playwright.chromium) {
          return await this.searchWithPlaywright(this.sessionPool.playwright.chromium, 'chromium', query, options);
        } else if (engineType === 'firefox' && this.sessionPool.playwright.firefox) {
          return await this.searchWithPlaywright(this.sessionPool.playwright.firefox, 'firefox', query, options);
        } else if (engineType === 'webkit' && this.sessionPool.playwright.webkit) {
          return await this.searchWithPlaywright(this.sessionPool.playwright.webkit, 'webkit', query, options);
        }
      } catch (error) {
        console.error(`Fallback ${engineType} also failed:`, error);
        continue;
      }
    }
    
    throw new Error('All fallback engines failed');
  }

  async searchPersonWithVariations(firstName: string, lastName: string, email?: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const searches: string[] = [];

    // Basic search
    searches.push(`"${firstName} ${lastName}"`);
    
    if (email) {
      searches.push(`"${firstName} ${lastName}" "${email}"`);
      
      const domain = email.split('@')[1];
      if (domain) {
        searches.push(`"${firstName} ${lastName}" site:${domain}`);
      }
    }

    // Search for social profiles
    const socialSites = ['linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com'];
    for (const site of socialSites) {
      searches.push(`"${firstName} ${lastName}" site:${site}`);
    }

    console.log(`🔍 Running ${searches.length} search variations with Ultimate Crawler...`);

    // Limit queries if queryLimit is specified
    const queriesToExecute = options.queryLimit ? searches.slice(0, options.queryLimit) : searches;
    console.log(`📊 Executing ${queriesToExecute.length}/${searches.length} queries...`);

    // Process queries with intelligent load balancing
    const parallelSessions = options.parallelSessions || 3;
    const batchSize = Math.min(parallelSessions, queriesToExecute.length);
    
    for (let i = 0; i < queriesToExecute.length; i += batchSize) {
      const batch = queriesToExecute.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (query, batchIndex) => {
        const queryIndex = i + batchIndex + 1;
        console.log(`   ${queryIndex}/${queriesToExecute.length}: ${query}`);
        
        try {
          return await this.searchDuckDuckGo(query, { ...options, maxResults: 3 });
        } catch (error) {
          console.error(`Error in search ${queryIndex}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(results => allResults.push(...results));
      
      // Add delay between batches to avoid overwhelming the server
      if (i + batchSize < queriesToExecute.length) {
        const delay = Math.random() * 2000 + 3000; // 3-5 seconds
        console.log(`⏳ Batch completed, waiting ${Math.round(delay/1000)}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );

    console.log(`🎯 Ultimate Crawler completed: ${uniqueResults.length} unique results from ${queriesToExecute.length} queries`);
    
    // Add engine distribution statistics
    const engineStats = uniqueResults.reduce((stats, result) => {
      const engine = result.browserEngine || 'unknown';
      stats[engine] = (stats[engine] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    console.log(`📊 Engine distribution:`, engineStats);

    return uniqueResults;
  }

  // Alias methods for compatibility
  async searchGoogle(query: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    return this.searchDuckDuckGo(query, options);
  }

  async searchPerson(firstName: string, lastName: string, email?: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    let query = `"${firstName} ${lastName}"`;
    
    if (email) {
      query += ` "${email}"`;
    }

    return this.searchDuckDuckGo(query, options);
  }
}

// Export the SearchResult interface as GoogleSearchResult for compatibility
export type GoogleSearchResult = SearchResult;
