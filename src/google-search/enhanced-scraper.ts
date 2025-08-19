import puppeteer from 'puppeteer-extra';
import { Page, Browser } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as dotenv from 'dotenv';
import { GoogleSearchResult, SearchOptions } from './scraper';

// Enhanced stealth configuration
puppeteer.use(StealthPlugin());

dotenv.config();

export interface AdvancedSearchOptions extends SearchOptions {
  userAgent?: string;
  proxy?: string;
  randomizeViewport?: boolean;
  blockResources?: boolean;
  solveRecaptcha?: boolean;
  humanBehavior?: boolean;
  sessionPersistence?: boolean;
  cookieConsent?: boolean;
}

export class EnhancedGoogleSearchScraper {
  private browser: Browser | null = null;
  private sessionData: Map<string, any> = new Map();

  async setup() {
    try {
      this.browser = await puppeteer.launch({
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
          '--disable-background-networking',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-features=AudioServiceOutOfProcess',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-notifications',
          '--disable-popup-blocking',
          '--disable-print-preview',
          '--disable-prompt-on-repost',
          '--disable-speech-api',
          '--disable-sync',
          '--hide-scrollbars',
          '--ignore-gpu-blacklist',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-first-run',
          '--no-pings',
          '--password-store=basic',
          '--use-gl=swiftshader',
          '--use-mock-keychain',
          '--disable-site-isolation-trials',
          '--disable-features=site-per-process',
          '--enable-features=NetworkService,NetworkServiceInProcess',
          
          // Enhanced anti-detection
          '--exclude-switches=enable-automation',
          '--disable-component-extensions-with-background-pages',
          '--force-color-profile=srgb',
          '--disable-canvas-aa',
          '--disable-2d-canvas-clip-aa',
          '--memory-pressure-off',
          '--aggressive-cache-discard',
          '--enable-tcp-fast-open',
          '--disable-plugins-discovery',
          '--disable-preconnect',
          '--disable-dns-prefetch',
        ],
        timeout: 60000,
        protocolTimeout: 60000,
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: null,
      });
      console.log('🚀 Enhanced Google scraper launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch enhanced Google scraper:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createEnhancedPage(options: AdvancedSearchOptions = {}): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    const page = await this.browser.newPage();

    // Enhanced user agent selection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
    ];

    const userAgent = options.userAgent || userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(userAgent);

    // Randomize viewport if requested
    if (options.randomizeViewport !== false) {
      const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1536, height: 864 },
        { width: 1440, height: 900 },
        { width: 1280, height: 720 },
        { width: 1600, height: 900 },
      ];
      const viewport = viewports[Math.floor(Math.random() * viewports.length)];
      await page.setViewport(viewport);
    } else {
      await page.setViewport({ width: 1366, height: 768 });
    }

    // Enhanced anti-detection
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Enhanced navigator properties
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const fakePlugins = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
          ];
          return fakePlugins;
        },
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' }),
        }),
      });

      // Mock chrome object
      const windowObj = window as any;
      delete windowObj.chrome?.runtime;
      
      windowObj.chrome = {
        runtime: {},
        app: { isInstalled: false },
        loadTimes: function() {
          return {
            commitLoadTime: performance.timing.responseStart / 1000,
            connectionInfo: 'http/1.1',
            finishDocumentLoadTime: performance.timing.domContentLoadedEventEnd / 1000,
            finishLoadTime: performance.timing.loadEventEnd / 1000,
            firstPaintAfterLoadTime: 0,
            firstPaintTime: performance.timing.responseStart / 1000,
            navigationType: 'Other',
            npnNegotiatedProtocol: 'unknown',
            requestTime: performance.timing.navigationStart / 1000,
            startLoadTime: performance.timing.navigationStart / 1000,
            wasAlternateProtocolAvailable: false,
            wasFetchedViaSpdy: false,
            wasNpnNegotiated: false
          };
        },
        csi: function() {
          return {
            onloadT: performance.timing.domContentLoadedEventEnd,
            startE: performance.timing.navigationStart,
            pageT: Date.now() - performance.timing.navigationStart,
            tran: 15
          };
        },
      };

      // Remove automation indicators
      delete windowObj.__nightmare;
      delete windowObj.__phantomas;
      delete windowObj._phantom;
      delete windowObj.callPhantom;
      delete windowObj.__webdriver_script_fn;

      // Enhanced screen properties
      Object.defineProperty(window.screen, 'colorDepth', {
        get: () => 24,
      });

      Object.defineProperty(window.screen, 'pixelDepth', {
        get: () => 24,
      });

      // Mock timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
        value: function() {
          return { timeZone: timezone, locale: 'en-US' };
        },
      });
    });

    // Block unnecessary resources for performance
    if (options.blockResources !== false) {
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const blockedResources = ['image', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];
        
        if (blockedResources.includes(resourceType)) {
          return request.abort();
        }

        // Block known tracking and analytics
        const url = request.url();
        const blockedDomains = [
          'google-analytics.com',
          'googletagmanager.com',
          'doubleclick.net',
          'googlesyndication.com',
          'amazon-adsystem.com',
          'facebook.com/tr',
          'connect.facebook.net'
        ];

        if (blockedDomains.some(domain => url.includes(domain))) {
          return request.abort();
        }

        // Add realistic headers
        const headers = {
          ...request.headers(),
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
        };

        request.continue({ headers });
      });
    }

    return page;
  }

  private async simulateHumanBehavior(page: Page): Promise<void> {
    try {
      // Random mouse movements
      const viewport = page.viewport();
      if (viewport) {
        const moves = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < moves; i++) {
          const x = Math.floor(Math.random() * viewport.width);
          const y = Math.floor(Math.random() * viewport.height);
          await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
          await this.randomDelay(100, 300);
        }
      }

      // Random scroll
      await page.evaluate(() => {
        const scrollDistance = Math.floor(Math.random() * 300) + 100;
        window.scrollBy(0, scrollDistance);
      });

      await this.randomDelay(200, 500);
    } catch (error) {
      console.warn('Failed to simulate human behavior:', error);
    }
  }

  private async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async typeHumanLike(page: Page, selector: string, text: string): Promise<void> {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);
    
    // Clear any existing text
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    
    // Type with human-like delays
    for (const char of text) {
      await page.keyboard.type(char);
      await this.randomDelay(50, 150);
    }
  }

  async searchGoogle(query: string, options: AdvancedSearchOptions = {}): Promise<GoogleSearchResult[]> {
    const { maxResults = 10, includeSnippets = true, timeout = 30000, humanBehavior = true } = options;
    
    const page = await this.createEnhancedPage(options);
    const results: GoogleSearchResult[] = [];

    try {
      console.log(`🔍 Enhanced Google search for: "${query}"`);

      // Navigate to Google with regional settings
      const googleUrls = [
        'https://www.google.com',
        'https://www.google.com/?hl=en&gl=us',
        'https://www.google.com/search?hl=en&gl=us',
      ];
      
      const googleUrl = googleUrls[Math.floor(Math.random() * googleUrls.length)];
      await page.goto(googleUrl, { 
        waitUntil: 'networkidle2', 
        timeout 
      });

      // Handle cookie consent if needed
      if (options.cookieConsent !== false) {
        try {
          await page.waitForSelector('button[id*="accept"], button[id*="agree"], #L2AGLb', { timeout: 3000 });
          await page.click('button[id*="accept"], button[id*="agree"], #L2AGLb');
          await this.randomDelay(500, 1000);
        } catch {
          // Cookie dialog might not appear
        }
      }

      // Simulate human behavior before searching
      if (humanBehavior) {
        await this.simulateHumanBehavior(page);
      }

      // Enhanced search input handling
      const searchSelectors = [
        'input[name="q"]',
        'textarea[name="q"]',
        '[data-ved] input',
        '#APjFqb',
        '.gLFyf'
      ];

      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          searchInput = selector;
          break;
        } catch {
          continue;
        }
      }

      if (!searchInput) {
        throw new Error('Could not find search input field');
      }

      // Type query with human-like behavior
      await this.typeHumanLike(page, searchInput, query);
      
      // Random delay before submitting
      await this.randomDelay(500, 1500);
      
      // Submit search with Enter key (more human-like)
      await page.keyboard.press('Enter');
      
      // Wait for results with multiple fallback selectors
      const resultSelectors = [
        '#search',
        '#rso',
        '.g',
        '[data-ved]',
        '#main'
      ];

      let resultsFound = false;
      for (const selector of resultSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 15000 });
          resultsFound = true;
          break;
        } catch {
          continue;
        }
      }

      if (!resultsFound) {
        throw new Error('Search results did not load');
      }

      // Add delay to let page stabilize
      await this.randomDelay(1000, 2000);

      // Enhanced result extraction with multiple selector strategies
      const searchResults = await page.evaluate((maxRes, includeSnips) => {
        const results: GoogleSearchResult[] = [];
        
        // Multiple selector strategies for different Google layouts
        const selectorStrategies = [
          {
            container: '.g:not(.g-blk)',
            title: 'h3',
            link: 'a[href]',
            snippet: '.VwiC3b, [data-sncf], .s3v9rd, .IsZvec'
          },
          {
            container: '[data-ved] .g',
            title: 'h3',
            link: 'a[href]',
            snippet: '.VwiC3b, [data-sncf], .IsZvec'
          },
          {
            container: '.hlcw0c',
            title: 'h3',
            link: 'a[href]',
            snippet: '.VwiC3b'
          },
          {
            container: '.MjjYud',
            title: 'h3',
            link: 'a[href]',
            snippet: '.VwiC3b, .IsZvec'
          }
        ];

        let resultElements: Element[] = [];
        
        // Try each strategy until we find results
        for (const strategy of selectorStrategies) {
          const containers = Array.from(document.querySelectorAll(strategy.container));
          if (containers.length > 0) {
            resultElements = containers;
            
            for (let i = 0; i < Math.min(resultElements.length, maxRes); i++) {
              const container = resultElements[i];
              
              try {
                // Get title
                const titleElement = container.querySelector(strategy.title);
                const title = titleElement?.textContent?.trim() || '';
                
                // Get URL
                const linkElement = container.querySelector(strategy.link) as HTMLAnchorElement;
                let url = linkElement?.href || '';
                
                // Clean up Google redirect URLs
                if (url.startsWith('/url?q=')) {
                  const urlMatch = url.match(/\/url\?q=([^&]+)/);
                  url = urlMatch ? decodeURIComponent(urlMatch[1]) : url;
                } else if (url.startsWith('https://www.google.com/url?q=')) {
                  const urlMatch = url.match(/[?&]q=([^&]+)/);
                  url = urlMatch ? decodeURIComponent(urlMatch[1]) : url;
                }
                
                // Get snippet
                let snippet = '';
                if (includeSnips) {
                  const snippetElement = container.querySelector(strategy.snippet);
                  snippet = snippetElement?.textContent?.trim() || '';
                }
                
                // Get domain
                const domain = url ? new URL(url).hostname : '';
                
                // Validate result
                if (title && url && url.startsWith('http') && !url.includes('google.com/search')) {
                  results.push({
                    title,
                    url,
                    snippet,
                    domain
                  });
                }
              } catch (error) {
                console.error('Error parsing search result:', error);
              }
            }
            
            // If we found results with this strategy, break
            if (results.length > 0) {
              break;
            }
          }
        }
        
        return results;
      }, maxResults, includeSnippets);

      results.push(...searchResults);

      if (results.length === 0) {
        // Fallback: try to extract any links that look like search results
        const fallbackResults = await page.evaluate((maxRes) => {
          const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
          const results: GoogleSearchResult[] = [];
          
          for (const link of links) {
            if (results.length >= maxRes) break;
            
            const href = link.href;
            const text = link.textContent?.trim() || '';
            
            // Skip Google internal links
            if (href.includes('google.com') || href.startsWith('/') || !href.startsWith('http')) {
              continue;
            }
            
            // Skip if no meaningful text
            if (text.length < 10) {
              continue;
            }
            
            try {
              const domain = new URL(href).hostname;
              results.push({
                title: text,
                url: href,
                snippet: '',
                domain
              });
            } catch {
              continue;
            }
          }
          
          return results;
        }, maxResults);
        
        results.push(...fallbackResults);
      }

      console.log(`✅ Found ${results.length} enhanced search results`);

    } catch (error) {
      console.error('❌ Enhanced Google search error:', error);
      throw error;
    } finally {
      await page.close();
    }

    return results;
  }

  async searchPerson(firstName: string, lastName: string, email?: string, options: AdvancedSearchOptions = {}): Promise<GoogleSearchResult[]> {
    let query = `"${firstName} ${lastName}"`;
    
    if (email) {
      query += ` "${email}"`;
    }

    return this.searchGoogle(query, options);
  }

  async searchPersonWithVariations(
    firstName: string, 
    lastName: string, 
    email?: string, 
    options: AdvancedSearchOptions = {}
  ): Promise<GoogleSearchResult[]> {
    const allResults: GoogleSearchResult[] = [];
    const searches: string[] = [];

    // Enhanced search variations
    searches.push(`"${firstName} ${lastName}"`);
    
    if (email) {
      searches.push(`"${firstName} ${lastName}" "${email}"`);
      
      const domain = email.split('@')[1];
      if (domain) {
        searches.push(`"${firstName} ${lastName}" site:${domain}`);
        searches.push(`"${firstName} ${lastName}" "@${domain}"`);
      }
    }

    // High-value social and professional sites
    const prioritySites = [
      'linkedin.com',
      'twitter.com',
      'facebook.com',
      'instagram.com',
      'github.com',
      'youtube.com'
    ];

    for (const site of prioritySites) {
      searches.push(`"${firstName} ${lastName}" site:${site}`);
    }

    // Professional variations
    searches.push(`"${firstName} ${lastName}" resume`);
    searches.push(`"${firstName} ${lastName}" CV`);
    searches.push(`"${firstName} ${lastName}" professional`);
    searches.push(`"${firstName} ${lastName}" contact`);

    console.log(`🔍 Running ${searches.length} enhanced search variations...`);

    const maxQueries = options.queryLimit || searches.length;
    const queriesToExecute = searches.slice(0, maxQueries);

    for (let i = 0; i < queriesToExecute.length; i++) {
      const query = queriesToExecute[i];
      console.log(`   ${i + 1}/${queriesToExecute.length}: ${query}`);
      
      try {
        const results = await this.searchGoogle(query, { 
          ...options, 
          maxResults: 3,
          humanBehavior: i === 0 // Only do human behavior on first search
        });
        
        allResults.push(...results);
        
        // Intelligent delay between searches
        if (i < queriesToExecute.length - 1) {
          await this.randomDelay(2000, 4000);
        }
      } catch (error) {
        console.error(`❌ Enhanced search ${i + 1} failed:`, error);
        
        // Add longer delay on error
        if (i < queriesToExecute.length - 1) {
          await this.randomDelay(5000, 8000);
        }
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );

    console.log(`📊 Enhanced search completed: ${uniqueResults.length} unique results from ${queriesToExecute.length} queries`);
    return uniqueResults;
  }
}
