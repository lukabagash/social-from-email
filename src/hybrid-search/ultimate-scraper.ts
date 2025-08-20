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
  searchEngine?: 'duckduckgo' | 'google' | 'bing';
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
  searchEngines?: ('duckduckgo' | 'google' | 'bing')[];
  multiEngineMode?: boolean;
  useHttpSearch?: boolean; // NEW: Enable HTTP-based search for speed
  autoRestartBrowser?: boolean; // NEW: Auto-restart browser on failures
  restartThreshold?: number; // NEW: Number of failures before restart
}

export interface DedicatedPuppeteerPool {
  [engine: string]: PuppeteerBrowser | undefined;
  duckduckgo?: PuppeteerBrowser;
  google?: PuppeteerBrowser;
  bing?: PuppeteerBrowser;
}

export interface EngineFailureTracker {
  [engine: string]: {
    failureCount: number;
    lastRestartTime: number;
    isRestarting: boolean;
  };
}

export class UltimateCrawlerEngine {
  private dedicatedPuppeteers: DedicatedPuppeteerPool = {};
  private failureTrackers: EngineFailureTracker = {};
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
    console.log('🚀 Initializing Ultimate Crawler Engine with Dedicated Puppeteers...');
    
    // Initialize failure trackers for each engine
    const engines = options.searchEngines || ['duckduckgo', 'google', 'bing'];
    
    for (const engine of engines) {
      this.failureTrackers[engine] = {
        failureCount: 0,
        lastRestartTime: Date.now(),
        isRestarting: false
      };
    }
    
    try {
      // Launch dedicated Puppeteer instances for each search engine
      const launchPromises = engines.map(async (engine) => {
        console.log(`🕷️ Launching dedicated Puppeteer for ${engine.toUpperCase()}...`);
        
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
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        });
        
        this.dedicatedPuppeteers[engine] = browser;
        console.log(`✅ ${engine.toUpperCase()} Puppeteer ready`);
      });
      
      await Promise.all(launchPromises);
      
      console.log(`✅ All ${engines.length} dedicated Puppeteer instances initialized successfully`);
      console.log(`🎯 Engines ready: ${engines.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize dedicated Puppeteer instances:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    console.log('🔄 Closing dedicated Puppeteer instances...');
    
    try {
      const closePromises = Object.entries(this.dedicatedPuppeteers).map(async ([engine, browser]) => {
        if (browser) {
          console.log(`🔒 Closing ${engine.toUpperCase()} Puppeteer...`);
          await browser.close();
        }
      });
      
      await Promise.all(closePromises);
      
      this.dedicatedPuppeteers = {};
      this.failureTrackers = {};
      
      console.log('✅ All dedicated Puppeteer instances closed successfully');
    } catch (error) {
      console.error('⚠️  Error closing dedicated Puppeteers:', error);
    }
  }

  // NEW: Restart specific engine's Puppeteer instance
  private async restartEnginesPuppeteer(engine: string, options: UltimateSearchOptions = {}): Promise<void> {
    const tracker = this.failureTrackers[engine];
    if (!tracker || tracker.isRestarting) return;
    
    tracker.isRestarting = true;
    console.log(`🔄 Restarting ${engine.toUpperCase()} Puppeteer due to failures...`);
    
    try {
      // Close the specific engine's browser
      if (this.dedicatedPuppeteers[engine]) {
        await this.dedicatedPuppeteers[engine]!.close();
        delete this.dedicatedPuppeteers[engine];
      }
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Launch new Puppeteer instance for this engine
      console.log(`🕷️ Relaunching ${engine.toUpperCase()} Puppeteer...`);
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
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      
      this.dedicatedPuppeteers[engine] = browser;
      
      // Reset failure tracking
      tracker.failureCount = 0;
      tracker.lastRestartTime = Date.now();
      tracker.isRestarting = false;
      
      console.log(`✅ ${engine.toUpperCase()} Puppeteer restart completed successfully`);
    } catch (error) {
      tracker.isRestarting = false;
      console.error(`❌ Failed to restart ${engine.toUpperCase()} Puppeteer:`, error);
      throw error;
    }
  }

  // NEW: Check if specific engine needs restart
  private shouldRestartEngine(engine: string, options: UltimateSearchOptions): boolean {
    if (!options.autoRestartBrowser) return false;
    
    const tracker = this.failureTrackers[engine];
    if (!tracker || tracker.isRestarting) return false;
    
    const threshold = options.restartThreshold || 3;
    const minRestartInterval = 30000; // 30 seconds minimum between restarts
    
    const timeSinceLastRestart = Date.now() - tracker.lastRestartTime;
    
    return tracker.failureCount >= threshold && timeSinceLastRestart > minRestartInterval;
  }

  // NEW: Handle engine-specific browser failures
  private async handleEngineFailure(engine: string, error: Error, options: UltimateSearchOptions): Promise<void> {
    const tracker = this.failureTrackers[engine];
    if (!tracker) return;
    
    tracker.failureCount++;
    
    const isConnectionError = error.message.includes('Protocol error: Connection closed') ||
                             error.message.includes('Navigating frame was detached') ||
                             error.message.includes('Execution context was destroyed') ||
                             error.message.includes('Target closed') ||
                             error.message.includes('Session closed');
    
    console.error(`❌ ${engine.toUpperCase()} failure #${tracker.failureCount}: ${error.message}`);
    
    if (isConnectionError && this.shouldRestartEngine(engine, options)) {
      console.log(`🔄 ${engine.toUpperCase()} connection error detected, triggering restart...`);
      await this.restartEnginesPuppeteer(engine, options);
    }
  }

  private constructSearchUrl(query: string, engine: 'duckduckgo' | 'google' | 'bing'): string {
    const encodedQuery = encodeURIComponent(query);
    
    switch (engine) {
      case 'duckduckgo':
        return `https://duckduckgo.com/?q=${encodedQuery}&ia=web`;
      case 'google':
        return `https://www.google.com/search?q=${encodedQuery}&hl=en`;
      case 'bing':
        return `https://www.bing.com/search?q=${encodedQuery}&ensearch=1`;
      default:
        return `https://duckduckgo.com/?q=${encodedQuery}&ia=web`;
    }
  }

  private getResultSelector(engine: 'duckduckgo' | 'google' | 'bing'): string {
    switch (engine) {
      case 'duckduckgo':
        // Multiple fallback selectors for DuckDuckGo's various page layouts
        return '[data-testid="result"], .react-results--main .result, .results .result, .web-result, .result--url-above-snippet, h2.result__title, [data-domain]';
      case 'google':
        // Updated Google selectors for 2025
        return '.g, .tF2Cxc, .hlcw0c, .kvH3mc, .LC20lb, .yuRUbf, [data-sokoban-container], .MjjYud';
      case 'bing':
        return '.b_algo, .b_ans';
      default:
        return '[data-testid="result"], .result';
    }
  }

  private getDedicatedBrowser(engine: 'duckduckgo' | 'google' | 'bing'): PuppeteerBrowser | null {
    return this.dedicatedPuppeteers[engine] || null;
  }

  async searchDuckDuckGo(query: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    console.log(`🔍 Searching DuckDuckGo for: "${query}" using dedicated Puppeteer`);
    
    const browser = this.getDedicatedBrowser('duckduckgo');
    if (!browser) {
      throw new Error('DuckDuckGo Puppeteer instance not available');
    }
    
    try {
      return await this.searchWithDedicatedPuppeteer(browser, 'duckduckgo', query, options);
    } catch (error) {
      console.error(`❌ DuckDuckGo search failed, handling failure...`);
      await this.handleEngineFailure('duckduckgo', error as Error, options);
      
      // Try again with potentially restarted browser
      const retryBrowser = this.getDedicatedBrowser('duckduckgo');
      if (retryBrowser && retryBrowser !== browser) {
        console.log('🔄 Retrying with restarted DuckDuckGo browser...');
        return await this.searchWithDedicatedPuppeteer(retryBrowser, 'duckduckgo', query, options);
      }
      
      throw error;
    }
  }

  async searchGoogle(query: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    console.log(`🔍 Searching Google for: "${query}" using dedicated Puppeteer`);
    
    const browser = this.getDedicatedBrowser('google');
    if (!browser) {
      throw new Error('Google Puppeteer instance not available');
    }
    
    try {
      return await this.searchWithDedicatedPuppeteer(browser, 'google', query, options);
    } catch (error) {
      console.error(`❌ Google search failed, handling failure...`);
      await this.handleEngineFailure('google', error as Error, options);
      
      // Try again with potentially restarted browser
      const retryBrowser = this.getDedicatedBrowser('google');
      if (retryBrowser && retryBrowser !== browser) {
        console.log('🔄 Retrying with restarted Google browser...');
        return await this.searchWithDedicatedPuppeteer(retryBrowser, 'google', query, options);
      }
      
      throw error;
    }
  }

  async searchBing(query: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    console.log(`🔍 Searching Bing for: "${query}" using dedicated Puppeteer`);
    
    const browser = this.getDedicatedBrowser('bing');
    if (!browser) {
      throw new Error('Bing Puppeteer instance not available');
    }
    
    try {
      return await this.searchWithDedicatedPuppeteer(browser, 'bing', query, options);
    } catch (error) {
      console.error(`❌ Bing search failed, handling failure...`);
      await this.handleEngineFailure('bing', error as Error, options);
      
      // Try again with potentially restarted browser
      const retryBrowser = this.getDedicatedBrowser('bing');
      if (retryBrowser && retryBrowser !== browser) {
        console.log('🔄 Retrying with restarted Bing browser...');
        return await this.searchWithDedicatedPuppeteer(retryBrowser, 'bing', query, options);
      }
      
      throw error;
    }
  }

  private async createDedicatedPuppeteerPage(browser: PuppeteerBrowser, options: UltimateSearchOptions): Promise<PuppeteerPage> {
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
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
          ],
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => {
          if (parameters.name === 'notifications') {
            return Promise.resolve({ state: 'granted', name: 'notifications', onchange: null } as any);
          }
          return originalQuery(parameters);
        };
        
        // Override getContext to hide fingerprinting
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type: any, attributes?: any) {
          if (type === '2d') {
            const context = getContext.call(this, type, attributes) as any;
            if (context) {
              const originalGetImageData = context.getImageData;
              context.getImageData = function(...args: any[]) {
                const imageData = originalGetImageData.apply(this, args);
                // Add subtle noise to prevent canvas fingerprinting
                for (let i = 0; i < imageData.data.length; i += 4) {
                  imageData.data[i] += Math.floor(Math.random() * 2);
                  imageData.data[i + 1] += Math.floor(Math.random() * 2);
                  imageData.data[i + 2] += Math.floor(Math.random() * 2);
                }
                return imageData;
              };
            }
            return context;
          }
          return getContext.call(this, type, attributes);
        };
      });
    }
    
    // Set additional headers to appear more human
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });
    
    return page;
  }

  private async searchWithDedicatedPuppeteer(browser: PuppeteerBrowser, searchEngine: 'duckduckgo' | 'google' | 'bing', query: string, options: UltimateSearchOptions): Promise<SearchResult[]> {
    const page = await this.createDedicatedPuppeteerPage(browser, options);
    const results: SearchResult[] = [];

    try {
      // Construct direct search URL - much faster than navigating + form submission
      const searchUrl = this.constructSearchUrl(query, searchEngine);
      
      // Navigate directly to search results
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: options.timeout });
      
      // Wait for search results to load with multiple selector fallbacks
      const resultSelector = this.getResultSelector(searchEngine);
      const selectors = resultSelector.split(', ');
      
      let foundSelector = null;
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector.trim(), { timeout: 5000 });
          foundSelector = selector.trim();
          console.log(`✅ Found results using selector: ${foundSelector}`);
          break;
        } catch (error) {
          console.log(`⚠️ Selector failed: ${selector.trim()}`);
          continue;
        }
      }
      
      if (!foundSelector) {
        // Final fallback - wait for any search result-like element
        try {
          await page.waitForSelector('a[href*="http"]', { timeout: 10000 });
          foundSelector = 'a[href*="http"]';
          console.log(`✅ Using fallback selector: ${foundSelector}`);
        } catch (error) {
          throw new Error(`No search results found with any selector for ${searchEngine}`);
        }
      }
      
      // Extract search results using Puppeteer
      const searchResults = await page.evaluate((maxRes: number, includeSnips: boolean, engine: string, foundSelector: string) => {
        const results: Array<{title: string; url: string; snippet: string; domain: string}> = [];
        
        // Get result containers based on the successful selector
        let resultElements: Element[] = [];
        
        if (engine === 'duckduckgo') {
          // Try multiple strategies for DuckDuckGo
          if (foundSelector.includes('data-testid="result"')) {
            resultElements = Array.from(document.querySelectorAll('[data-testid="result"]'));
          } else if (foundSelector.includes('result--url-above-snippet')) {
            resultElements = Array.from(document.querySelectorAll('.result--url-above-snippet'));
          } else if (foundSelector.includes('web-result')) {
            resultElements = Array.from(document.querySelectorAll('.web-result'));
          } else {
            // Generic fallback - find containers with links
            const links = Array.from(document.querySelectorAll('a[href*="http"]'))
              .filter(link => {
                const href = (link as HTMLAnchorElement).href;
                return href && !href.includes('duckduckgo.com') && !href.includes('javascript:');
              });
            
            // Group links by their parent containers
            const containers = new Set<Element>();
            links.forEach(link => {
              let parent = link.parentElement;
              let depth = 0;
              while (parent && depth < 5) {
                if (parent.querySelector('a[href*="http"]') && parent.textContent && parent.textContent.length > 50) {
                  containers.add(parent);
                  break;
                }
                parent = parent.parentElement;
                depth++;
              }
            });
            resultElements = Array.from(containers);
          }
        } else {
          // For Google and Bing, use the found selector directly
          resultElements = Array.from(document.querySelectorAll(foundSelector));
        }
        
        for (let i = 0; i < Math.min(resultElements.length, maxRes); i++) {
          const resultContainer = resultElements[i];
          
          try {
            let titleElement: Element | null = null;
            let snippetSelectors: string[] = [];
            
            // Engine-specific selectors
            if (engine === 'duckduckgo') {
              titleElement = resultContainer.querySelector('[data-testid="result-title-a"]') || 
                           resultContainer.querySelector('h2 a') ||
                           resultContainer.querySelector('h3 a') ||
                           resultContainer.querySelector('a[href*="http"]:not([href*="duckduckgo"])');
              snippetSelectors = ['[data-testid="result-snippet"]', '.result__snippet', '.result-snippet', 'p', 'span'];
            } else if (engine === 'google') {
              titleElement = resultContainer.querySelector('h3 a') || 
                           resultContainer.querySelector('a h3') ||
                           resultContainer.querySelector('.LC20lb') ||
                           resultContainer.querySelector('[data-ved] h3') ||
                           resultContainer.querySelector('.yuRUbf h3') ||
                           resultContainer.querySelector('.kvH3mc a');
              snippetSelectors = ['.VwiC3b', '.s3v9rd', '.st', '.IsZvec', '.aCOpRe', '.kCrYT'];
            } else if (engine === 'bing') {
              titleElement = resultContainer.querySelector('h2 a') ||
                           resultContainer.querySelector('.b_title a');
              snippetSelectors = ['.b_caption p', '.b_snippet', '.b_descript'];
            }
            
            const title = titleElement?.textContent?.trim() || '';
            const linkElement = titleElement as HTMLAnchorElement;
            let url = linkElement?.href || '';
            
            let snippet = '';
            if (includeSnips) {
              for (const selector of snippetSelectors) {
                const snippetElement = resultContainer.querySelector(selector);
                if (snippetElement?.textContent) {
                  snippet = snippetElement.textContent.trim();
                  break;
                }
              }
            }
            
            const domain = url ? new URL(url).hostname : '';
            
            if (title && url && url.startsWith('http') && !url.includes('duckduckgo.com')) {
              results.push({ title, url, snippet, domain });
            }
          } catch (error) {
            console.error('Error parsing search result:', error);
          }
        }
        
        return results;
      }, options.maxResults || 10, options.includeSnippets !== false, searchEngine, foundSelector);

      // Add metadata about the scraping method
      const enhancedResults = searchResults.map((result: {title: string; url: string; snippet: string; domain: string}) => ({
        ...result,
        scrapeMethod: 'puppeteer' as const,
        browserEngine: 'dedicated-puppeteer' as any,
        searchEngine: searchEngine
      }));

      results.push(...enhancedResults);
      
      console.log(`✅ Found ${results.length} results using dedicated Puppeteer on ${searchEngine.toUpperCase()}`);

    } catch (error) {
      console.error(`Error during dedicated Puppeteer search on ${searchEngine}:`, error);
      throw error;
    } finally {
      await page.close();
    }

    return results;
  }

  // NEW: Multi-engine search with dedicated Puppeteers running in parallel
  async searchMultipleEngines(query: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    const engines = options.searchEngines || ['duckduckgo', 'google', 'bing'];
    const allResults: SearchResult[] = [];
    
    console.log(`🌐 Multi-engine search across ${engines.length} dedicated Puppeteers: ${engines.join(', ')}`);
    
    // Search across all engines in parallel for maximum speed and success-first logic
    const searchPromises = engines.map(async (engine) => {
      try {
        switch (engine) {
          case 'duckduckgo':
            return await this.searchDuckDuckGo(query, { ...options, maxResults: 5 });
          case 'google':
            return await this.searchGoogle(query, { ...options, maxResults: 5 });
          case 'bing':
            return await this.searchBing(query, { ...options, maxResults: 5 });
          default:
            return [];
        }
      } catch (error) {
        console.error(`❌ ${engine} search failed:`, error);
        return [];
      }
    });
    
    const engineResults = await Promise.all(searchPromises);
    engineResults.forEach(results => allResults.push(...results));
    
    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );
    
    // Add diversity score and engine distribution stats
    const engineStats = uniqueResults.reduce((stats, result) => {
      const engine = result.searchEngine || 'unknown';
      stats[engine] = (stats[engine] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    console.log(`🎯 Multi-engine search completed: ${uniqueResults.length} unique results`);
    console.log(`📊 Engine distribution:`, engineStats);
    
    return uniqueResults;
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
          // Use multi-engine search if enabled
          if (options.multiEngineMode) {
            return await this.searchMultipleEngines(query, { ...options, maxResults: 3 });
          } else {
            return await this.searchDuckDuckGo(query, { ...options, maxResults: 3 });
          }
        } catch (error) {
          console.error(`Error in search ${queryIndex}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(results => allResults.push(...results));
      
      // Add delay between batches to avoid overwhelming the server
      if (i + batchSize < queriesToExecute.length) {
        const delay = Math.random() * 1000 + 2000; // 2-3 seconds (reduced from 3-5)
        console.log(`⏳ Batch completed, waiting ${Math.round(delay/1000)}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );

    const modeText = options.multiEngineMode ? 'Multi-Engine' : 'DuckDuckGo';
    console.log(`🎯 ${modeText} Crawler completed: ${uniqueResults.length} unique results from ${queriesToExecute.length} queries`);
    
    // Add engine distribution statistics
    const engineStats = uniqueResults.reduce((stats, result) => {
      const engine = result.searchEngine || result.browserEngine || 'unknown';
      stats[engine] = (stats[engine] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    console.log(`📊 Engine distribution:`, engineStats);

    return uniqueResults;
  }

  // HTTP-based search for maximum speed (NEW)
  async searchWithHttp(query: string, searchEngine: 'duckduckgo' | 'google' | 'bing' = 'duckduckgo', options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    console.log(`🚀 HTTP Search for: "${query}" on ${searchEngine.toUpperCase()} (Ultra Fast)`);
    
    try {
      const searchUrl = this.constructSearchUrl(query, searchEngine);
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const results = this.parseHtmlResults(html, searchEngine, options);
      
      console.log(`⚡ HTTP Search completed: ${results.length} results in milliseconds`);
      return results;
      
    } catch (error) {
      console.error(`❌ HTTP search failed for ${searchEngine}:`, error);
      throw error;
    }
  }

  private parseHtmlResults(html: string, searchEngine: 'duckduckgo' | 'google' | 'bing', options: UltimateSearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      // Simple regex-based parsing for speed (not as robust as browser parsing but much faster)
      if (searchEngine === 'duckduckgo') {
        // DuckDuckGo result pattern
        const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        const snippetPattern = /<span class="result__snippet[^>]*>([^<]+)<\/span>/gi;
        
        let match;
        let resultCount = 0;
        
        while ((match = linkPattern.exec(html)) !== null && resultCount < (options.maxResults || 10)) {
          const url = match[1];
          const title = match[2];
          
          // Filter out DuckDuckGo internal links
          if (url && !url.includes('duckduckgo.com') && url.startsWith('http') && title) {
            try {
              const domain = new URL(url).hostname;
              results.push({
                title: title.trim(),
                url: url,
                snippet: '', // We'll skip snippets for speed in HTTP mode
                domain: domain,
                scrapeMethod: 'http' as any,
                browserEngine: 'http' as any,
                searchEngine: searchEngine
              });
              resultCount++;
            } catch (urlError) {
              // Skip invalid URLs
              continue;
            }
          }
        }
      }
      
      return results;
      
    } catch (error) {
      console.error(`Error parsing HTML results:`, error);
      return [];
    }
  }

  // Legacy alias methods for compatibility
  async searchPerson(firstName: string, lastName: string, email?: string, options: UltimateSearchOptions = {}): Promise<SearchResult[]> {
    let query = `"${firstName} ${lastName}"`;
    
    if (email) {
      query += ` "${email}"`;
    }

    // Use HTTP search if enabled for speed
    if (options.useHttpSearch) {
      try {
        return await this.searchWithHttp(query, 'duckduckgo', options);
      } catch (error) {
        console.log('🔄 HTTP search failed, falling back to browser automation...');
        // Fall back to browser automation
      }
    }

    return this.searchDuckDuckGo(query, options);
  }
}

// Export the SearchResult interface as GoogleSearchResult for compatibility
export type GoogleSearchResult = SearchResult;
