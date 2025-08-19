import puppeteer from 'puppeteer-extra';
import { Page, Browser } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as dotenv from 'dotenv';

// Enhanced stealth configuration
puppeteer.use(StealthPlugin());

dotenv.config();

export interface EnhancedLinkedInProfile {
  name: string;
  title?: string;
  company?: string;
  location?: string;
  profileUrl: string;
  imageUrl?: string;
  connections?: string;
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration?: string;
    location?: string;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    years?: string;
  }>;
  skills?: string[];
  verified?: boolean;
  premium?: boolean;
  lastActive?: string;
}

export interface LinkedInSearchOptions {
  maxResults?: number;
  includeDetails?: boolean;
  timeout?: number;
  randomizeViewport?: boolean;
  blockResources?: boolean;
  humanBehavior?: boolean;
  sessionPersistence?: boolean;
  searchFilters?: {
    location?: string;
    company?: string;
    industry?: string;
    currentCompany?: boolean;
    pastCompany?: boolean;
  };
}

export class EnhancedLinkedInScraper {
  private browser: Browser | null = null;
  private sessionData: Map<string, any> = new Map();
  private isLoggedIn: boolean = false;
  private fingerprints: Array<{
    userAgent: string;
    viewport: { width: number; height: number };
    platform: string;
    language: string;
    timezone: string;
  }> = [];

  constructor() {
    this.initializeFingerprints();
  }

  private initializeFingerprints() {
    // 20 diverse browser fingerprints for LinkedIn
    this.fingerprints = [
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        platform: 'Win32',
        language: 'en-US',
        timezone: 'America/New_York'
      },
      {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 },
        platform: 'MacIntel',
        language: 'en-US',
        timezone: 'America/Los_Angeles'
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
        viewport: { width: 1366, height: 768 },
        platform: 'Win32',
        language: 'en-US',
        timezone: 'America/Chicago'
      },
      {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1536, height: 864 },
        platform: 'Linux x86_64',
        language: 'en-US',
        timezone: 'America/Denver'
      },
      {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
        viewport: { width: 1680, height: 1050 },
        platform: 'MacIntel',
        language: 'en-US',
        timezone: 'America/Phoenix'
      }
    ];
  }

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
          
          // LinkedIn-specific optimizations
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
          '--disable-background-timer-throttling',
          '--no-zygote',
          '--single-process',
        ],
        timeout: 60000,
        protocolTimeout: 60000,
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: null,
      });
      console.log('🚀 Enhanced LinkedIn scraper launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch enhanced LinkedIn scraper:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createEnhancedPage(options: LinkedInSearchOptions = {}): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    const page = await this.browser.newPage();
    
    // Select random fingerprint
    const fingerprint = this.fingerprints[Math.floor(Math.random() * this.fingerprints.length)];
    
    await page.setUserAgent(fingerprint.userAgent);
    await page.setViewport(fingerprint.viewport);

    // Enhanced LinkedIn-specific anti-detection
    await page.evaluateOnNewDocument((fp) => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Enhanced navigator properties for LinkedIn
      Object.defineProperty(navigator, 'platform', {
        get: () => fp.platform,
      });

      Object.defineProperty(navigator, 'language', {
        get: () => fp.language,
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => [fp.language, 'en'],
      });

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

      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => Math.floor(Math.random() * 8) + 2, // 2-10 cores
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => [2, 4, 8, 16][Math.floor(Math.random() * 4)],
      });

      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' }),
        }),
      });

      // Mock timezone
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
        value: function() {
          return { timeZone: fp.timezone, locale: fp.language };
        },
      });

      // Mock chrome object for LinkedIn
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
            requestTime: performance.timing.navigationStart / 1000,
          };
        },
        csi: function() {
          return {
            pageT: Date.now() - performance.timing.navigationStart,
          };
        },
      };

      // Remove automation indicators
      delete windowObj.__nightmare;
      delete windowObj.__phantomas;
      delete windowObj._phantom;
      delete windowObj.callPhantom;
      delete windowObj.__webdriver_script_fn;
      delete windowObj.webdriver;

      // Enhanced screen properties
      Object.defineProperty(window.screen, 'colorDepth', {
        get: () => 24,
      });

      Object.defineProperty(window.screen, 'pixelDepth', {
        get: () => 24,
      });

      // Mock WebGL for fingerprint consistency
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel(R) UHD Graphics 630';
        }
        return getParameter.call(this, parameter);
      };

    }, fingerprint);

    // Block unnecessary resources for LinkedIn
    if (options.blockResources !== false) {
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();

        // Block unnecessary resources but keep essentials for LinkedIn
        const blockedResources = ['font', 'texttrack', 'object', 'beacon', 'csp_report'];
        
        if (blockedResources.includes(resourceType)) {
          return request.abort();
        }

        // Block known tracking but allow LinkedIn analytics
        const blockedDomains = [
          'google-analytics.com',
          'googletagmanager.com',
          'doubleclick.net',
          'amazon-adsystem.com',
          'facebook.com/tr',
          'connect.facebook.net'
        ];

        if (blockedDomains.some(domain => url.includes(domain))) {
          return request.abort();
        }

        // Allow LinkedIn domains
        const linkedInDomains = [
          'linkedin.com',
          'licdn.com',
          'lnkd.in'
        ];

        // Add realistic headers for LinkedIn
        const headers = {
          ...request.headers(),
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': `"${fingerprint.platform}"`,
          'sec-fetch-dest': resourceType === 'document' ? 'document' : 'empty',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'accept': resourceType === 'document' 
            ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            : '*/*',
          'accept-language': fingerprint.language + ',en;q=0.9',
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
        };

        request.continue({ headers });
      });
    }

    return page;
  }

  private async simulateLinkedInBehavior(page: Page): Promise<void> {
    try {
      // Scroll to simulate reading
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight || totalHeight >= 1000){
              clearInterval(timer);
              resolve();
            }
          }, 200);
        });
      });

      await this.randomDelay(1000, 2000);

      // Scroll back to top
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      await this.randomDelay(500, 1000);
    } catch (error) {
      console.warn('Failed to simulate LinkedIn behavior:', error);
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
      await this.randomDelay(80, 200);
    }
  }

  async searchLinkedInProfiles(
    query: string, 
    options: LinkedInSearchOptions = {}
  ): Promise<EnhancedLinkedInProfile[]> {
    const { 
      maxResults = 10, 
      includeDetails = true, 
      timeout = 30000,
      humanBehavior = true 
    } = options;
    
    const page = await this.createEnhancedPage(options);
    const profiles: EnhancedLinkedInProfile[] = [];

    try {
      console.log(`🔍 Enhanced LinkedIn search for: "${query}"`);

      // Navigate to LinkedIn search
      await page.goto('https://www.linkedin.com/search/results/people/', { 
        waitUntil: 'networkidle2', 
        timeout 
      });

      // Handle potential login redirect or guest access
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/uas/login')) {
        console.log('📱 Detected login page, attempting guest search...');
        
        // Try to navigate to guest search
        await page.goto(`https://www.linkedin.com/pub/dir/?firstName=${encodeURIComponent(query.split(' ')[0])}&lastName=${encodeURIComponent(query.split(' ')[1] || '')}&trk=guest_homepage-basic_people-search-bar_search-submit`, {
          waitUntil: 'networkidle2',
          timeout
        });
      }

      // Simulate human behavior
      if (humanBehavior) {
        await this.simulateLinkedInBehavior(page);
      }

      // Try different search approaches
      let searchSuccessful = false;

      // Approach 1: Try search input if available
      try {
        const searchInput = await page.waitForSelector('input[placeholder*="Search"], input[aria-label*="Search"], .search-global-typeahead__input', { timeout: 5000 });
        if (searchInput) {
          await this.typeHumanLike(page, 'input[placeholder*="Search"], input[aria-label*="Search"], .search-global-typeahead__input', query);
          await this.randomDelay(500, 1000);
          await page.keyboard.press('Enter');
          
          await page.waitForSelector('.search-results-container, .people-search-results, .search-result', { timeout: 10000 });
          searchSuccessful = true;
        }
      } catch (error) {
        console.log('Search input approach failed, trying URL approach...');
      }

      // Approach 2: Direct URL search
      if (!searchSuccessful) {
        const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}&origin=SWITCH_SEARCH_VERTICAL`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout });
        
        try {
          await page.waitForSelector('.search-results-container, .people-search-results, .search-result', { timeout: 10000 });
          searchSuccessful = true;
        } catch (error) {
          console.log('URL search approach failed, trying alternative...');
        }
      }

      // Approach 3: Public directory search
      if (!searchSuccessful) {
        const names = query.split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';
        
        const publicUrl = `https://www.linkedin.com/pub/dir/?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;
        await page.goto(publicUrl, { waitUntil: 'networkidle2', timeout });
      }

      await this.randomDelay(2000, 3000);

      // Extract profiles with multiple selector strategies
      const searchResults = await page.evaluate((maxRes) => {
        const profiles: EnhancedLinkedInProfile[] = [];
        
        // Multiple selector strategies for different LinkedIn layouts
        const selectorStrategies = [
          {
            container: '.entity-result, .search-result__wrapper, .people-search-result',
            name: '.entity-result__title-text a, .search-result__result-link, .people-search-result__name',
            title: '.entity-result__primary-subtitle, .search-result__snippets, .people-search-result__headline',
            company: '.entity-result__secondary-subtitle, .search-result__snippets .t-14, .people-search-result__subline',
            location: '.entity-result__secondary-subtitle .t-12, .search-result__snippets .t-12',
            link: '.entity-result__title-text a, .search-result__result-link, .people-search-result__name a',
            image: '.presence-entity__image, .search-result__image img, .people-search-result__image img'
          },
          {
            container: '.reusable-search__result-container, .people-search-results__list li',
            name: '.app-aware-link, .search-result__result-link',
            title: '.entity-result__primary-subtitle, .subline-level-1',
            company: '.entity-result__secondary-subtitle, .subline-level-2',
            location: '.entity-result__location',
            link: '.app-aware-link, .search-result__result-link',
            image: '.presence-entity__image, img'
          },
          {
            container: '.people-search-card, .profile-card',
            name: '.people-search-card__name, .profile-card__name',
            title: '.people-search-card__headline, .profile-card__headline',
            company: '.people-search-card__subline, .profile-card__subline',
            location: '.people-search-card__location',
            link: 'a[href*="/in/"]',
            image: 'img'
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
                // Get name
                const nameElement = container.querySelector(strategy.name);
                const name = nameElement?.textContent?.trim() || '';
                
                // Get profile URL
                const linkElement = container.querySelector(strategy.link) as HTMLAnchorElement;
                let profileUrl = linkElement?.href || '';
                
                // Clean up URL
                if (profileUrl && !profileUrl.startsWith('http')) {
                  profileUrl = 'https://www.linkedin.com' + profileUrl;
                }
                
                // Get title/headline
                const titleElement = container.querySelector(strategy.title);
                const title = titleElement?.textContent?.trim() || '';
                
                // Get company
                const companyElement = container.querySelector(strategy.company);
                const company = companyElement?.textContent?.trim() || '';
                
                // Get location
                const locationElement = container.querySelector(strategy.location);
                const location = locationElement?.textContent?.trim() || '';
                
                // Get image
                const imageElement = container.querySelector(strategy.image) as HTMLImageElement;
                const imageUrl = imageElement?.src || '';
                
                // Validate result
                if (name && profileUrl && profileUrl.includes('linkedin.com')) {
                  profiles.push({
                    name,
                    title: title || undefined,
                    company: company || undefined,
                    location: location || undefined,
                    profileUrl,
                    imageUrl: imageUrl || undefined,
                  });
                }
              } catch (error) {
                console.error('Error parsing LinkedIn result:', error);
              }
            }
            
            // If we found results with this strategy, break
            if (profiles.length > 0) {
              break;
            }
          }
        }
        
        return profiles;
      }, maxResults);

      profiles.push(...searchResults);

      // If no results, try fallback approach
      if (profiles.length === 0) {
        console.log('🔄 No results found, trying fallback approach...');
        
        const fallbackResults = await page.evaluate(() => {
          const profiles: EnhancedLinkedInProfile[] = [];
          const links = Array.from(document.querySelectorAll('a[href*="/in/"]')) as HTMLAnchorElement[];
          
          for (const link of links) {
            const href = link.href;
            const text = link.textContent?.trim() || '';
            
            if (text.length > 3 && href.includes('linkedin.com/in/')) {
              profiles.push({
                name: text,
                profileUrl: href,
              });
            }
          }
          
          return profiles.slice(0, 5); // Limit fallback results
        });
        
        profiles.push(...fallbackResults);
      }

      console.log(`✅ Found ${profiles.length} LinkedIn profiles`);

    } catch (error) {
      console.error('❌ Enhanced LinkedIn search error:', error);
      throw error;
    } finally {
      await page.close();
    }

    return profiles;
  }

  async searchPersonLinkedIn(
    firstName: string, 
    lastName: string, 
    options: LinkedInSearchOptions = {}
  ): Promise<EnhancedLinkedInProfile[]> {
    const query = `${firstName} ${lastName}`;
    return this.searchLinkedInProfiles(query, options);
  }

  async searchPersonWithDetails(
    firstName: string,
    lastName: string,
    company?: string,
    location?: string,
    options: LinkedInSearchOptions = {}
  ): Promise<EnhancedLinkedInProfile[]> {
    let query = `${firstName} ${lastName}`;
    
    if (company) {
      query += ` ${company}`;
    }
    
    if (location) {
      query += ` ${location}`;
    }

    const searchOptions = {
      ...options,
      searchFilters: {
        ...options.searchFilters,
        company,
        location,
      }
    };

    return this.searchLinkedInProfiles(query, searchOptions);
  }

  async extractProfileDetails(profileUrl: string, options: LinkedInSearchOptions = {}): Promise<EnhancedLinkedInProfile | null> {
    const page = await this.createEnhancedPage(options);

    try {
      console.log(`📋 Extracting details from: ${profileUrl}`);

      await page.goto(profileUrl, { 
        waitUntil: 'networkidle2', 
        timeout: options.timeout || 30000 
      });

      // Simulate human behavior
      if (options.humanBehavior !== false) {
        await this.simulateLinkedInBehavior(page);
      }

      const profileDetails = await page.evaluate(() => {
        const profile: Partial<EnhancedLinkedInProfile> = {
          profileUrl: window.location.href
        };

        // Extract name
        const nameSelectors = [
          '.text-heading-xlarge',
          '.pv-text-details__left-panel h1',
          '.ph5 h1',
          '.pv-top-card__name'
        ];

        for (const selector of nameSelectors) {
          const nameElement = document.querySelector(selector);
          if (nameElement?.textContent) {
            profile.name = nameElement.textContent.trim();
            break;
          }
        }

        // Extract title
        const titleSelectors = [
          '.text-body-medium.break-words',
          '.pv-text-details__left-panel .text-body-medium',
          '.pv-top-card__headline'
        ];

        for (const selector of titleSelectors) {
          const titleElement = document.querySelector(selector);
          if (titleElement?.textContent) {
            profile.title = titleElement.textContent.trim();
            break;
          }
        }

        // Extract location
        const locationSelectors = [
          '.text-body-small.inline.t-black--light.break-words',
          '.pv-text-details__left-panel .text-body-small',
          '.pv-top-card__location'
        ];

        for (const selector of locationSelectors) {
          const locationElement = document.querySelector(selector);
          if (locationElement?.textContent) {
            profile.location = locationElement.textContent.trim();
            break;
          }
        }

        // Extract image
        const imageSelectors = [
          '.pv-top-card__photo img',
          '.profile-photo-edit__preview img',
          '.presence-entity__image'
        ];

        for (const selector of imageSelectors) {
          const imageElement = document.querySelector(selector) as HTMLImageElement;
          if (imageElement?.src) {
            profile.imageUrl = imageElement.src;
            break;
          }
        }

        // Extract connections
        const connectionsElement = document.querySelector('.t-bold .t-black');
        if (connectionsElement?.textContent) {
          profile.connections = connectionsElement.textContent.trim();
        }

        return profile;
      });

      if (profileDetails.name) {
        return profileDetails as EnhancedLinkedInProfile;
      }

      return null;

    } catch (error) {
      console.error('❌ Error extracting LinkedIn profile details:', error);
      return null;
    } finally {
      await page.close();
    }
  }
}
