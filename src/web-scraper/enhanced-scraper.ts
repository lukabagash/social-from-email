import puppeteer from 'puppeteer-extra';
import { Page, Browser, HTTPRequest } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as dotenv from 'dotenv';
import { randomBytes, createHash } from 'crypto';
import { ScrapedData, ScrapingOptions } from './general-scraper';

// Enhanced stealth configuration
puppeteer.use(StealthPlugin());

dotenv.config();

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: 'http' | 'https' | 'socks4' | 'socks5';
}

export interface FingerPrintProfile {
  userAgent: string;
  viewport: { width: number; height: number };
  locale: string;
  timezone: string;
  webglVendor: string;
  webglRenderer: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  colorDepth: number;
  pixelRatio: number;
}

export interface EnhancedScrapingOptions extends ScrapingOptions {
  useProxy?: boolean;
  proxyRotation?: boolean;
  proxyList?: ProxyConfig[];
  antiDetection?: boolean;
  customFingerprint?: FingerPrintProfile | null;
  requestDelay?: { min: number; max: number };
  retryAttempts?: number;
  captchaSolver?: 'manual' | '2captcha' | 'anticaptcha';
  sessionPersistence?: boolean;
  cookieJar?: string; // Path to cookie file
  userDataDir?: string; // Path to persistent browser data
  headlessMode?: boolean | 'shell';
  blockAds?: boolean;
  blockTrackers?: boolean;
  randomizeFingerprint?: boolean;
  humanLikeDelays?: boolean;
  mouseMovements?: boolean;
  typing?: { humanLike: boolean; delay: number };
}

export class EnhancedWebScraper {
  private browser: Browser | null = null;
  private proxyIndex: number = 0;
  private fingerprints: FingerPrintProfile[] = [];
  private sessionData: Map<string, any> = new Map();
  
  private readonly defaultOptions: Required<EnhancedScrapingOptions> = {
    timeout: 30000,
    waitForSelector: 'body',
    extractImages: true,
    extractLinks: true,
    maxContentLength: 10000,
    followRedirects: true,
    useProxy: false,
    proxyRotation: false,
    proxyList: [],
    antiDetection: true,
    customFingerprint: null,
    requestDelay: { min: 1000, max: 3000 },
    retryAttempts: 3,
    captchaSolver: 'manual',
    sessionPersistence: false,
    cookieJar: '',
    userDataDir: '',
    headlessMode: true,
    blockAds: true,
    blockTrackers: true,
    randomizeFingerprint: true,
    humanLikeDelays: true,
    mouseMovements: false,
    typing: { humanLike: true, delay: 100 }
  };

  constructor() {
    this.generateFingerprints();
  }

  async setup(options: Partial<EnhancedScrapingOptions> = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      const browserArgs = this.getBrowserArgs(opts);
      
      this.browser = await puppeteer.launch({
        headless: opts.headlessMode,
        args: browserArgs,
        timeout: 60000,
        protocolTimeout: 60000,
        userDataDir: opts.userDataDir || undefined,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
        devtools: false,
      });
      
      console.log('🚀 Enhanced browser launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch enhanced browser:', error);
      throw error;
    }
  }

  private getBrowserArgs(options: Required<EnhancedScrapingOptions>): string[] {
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor,TranslateUI',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-extensions',
      '--disable-plugins',
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
      '--disable-offer-store-unmasked-wallet-cards',
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
      '--no-zygote',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
      '--single-process',
      '--disable-site-isolation-trials',
      '--disable-features=site-per-process',
      
      // Enhanced anti-detection
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-extensions-http-throttling',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--force-color-profile=srgb',
      '--disable-canvas-aa',
      '--disable-2d-canvas-clip-aa',
      '--disable-gl-drawing-for-tests',
      '--enable-webgl-draft-extensions',
      '--disable-webgl-image-chromium',
      
      // Memory and performance optimizations
      '--memory-pressure-off',
      '--max_old_space_size=4096',
      '--aggressive-cache-discard',
      '--enable-tcp-fast-open',
      '--enable-experimental-web-platform-features',
      
      // Privacy and security
      '--disable-default-apps',
      '--disable-sync',
      '--incognito',
      '--disable-plugins-discovery',
      '--disable-preconnect',
      '--disable-dns-prefetch',
    ];

    // Add custom viewport
    if (options.randomizeFingerprint) {
      const randomViewport = this.getRandomViewport();
      baseArgs.push(`--window-size=${randomViewport.width},${randomViewport.height}`);
    }

    return baseArgs;
  }

  private generateFingerprints(): void {
    const commonUserAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
      'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    ];

    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 1600, height: 900 },
      { width: 2560, height: 1440 },
      { width: 1024, height: 768 },
      { width: 1680, height: 1050 },
      { width: 1920, height: 1200 },
    ];

    const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR'];
    const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'];
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];

    // Generate 50 diverse fingerprints
    for (let i = 0; i < 50; i++) {
      const viewport = viewports[Math.floor(Math.random() * viewports.length)];
      
      this.fingerprints.push({
        userAgent: commonUserAgents[Math.floor(Math.random() * commonUserAgents.length)],
        viewport,
        locale: locales[Math.floor(Math.random() * locales.length)],
        timezone: timezones[Math.floor(Math.random() * timezones.length)],
        webglVendor: 'Google Inc. (Intel)',
        webglRenderer: 'ANGLE (Intel, Intel(R) Iris(TM) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        hardwareConcurrency: [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)],
        deviceMemory: [4, 8, 16, 32][Math.floor(Math.random() * 4)],
        colorDepth: 24,
        pixelRatio: [1, 1.25, 1.5, 2][Math.floor(Math.random() * 4)],
      });
    }
  }

  private getRandomViewport() {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 1600, height: 900 },
    ];
    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  private getRandomProxy(proxyList: ProxyConfig[]): ProxyConfig | null {
    if (!proxyList || proxyList.length === 0) return null;
    
    if (this.proxyIndex >= proxyList.length) {
      this.proxyIndex = 0;
    }
    
    return proxyList[this.proxyIndex++];
  }

  private async createEnhancedPage(options: Required<EnhancedScrapingOptions>): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    const page = await this.browser.newPage();

    // Apply fingerprint
    let fingerprint: FingerPrintProfile;
    if (options.customFingerprint) {
      fingerprint = options.customFingerprint;
    } else if (options.randomizeFingerprint) {
      fingerprint = this.fingerprints[Math.floor(Math.random() * this.fingerprints.length)];
    } else {
      fingerprint = this.fingerprints[0]; // Default fingerprint
    }

    // Set user agent
    await page.setUserAgent(fingerprint.userAgent);

    // Set viewport
    await page.setViewport({
      width: fingerprint.viewport.width,
      height: fingerprint.viewport.height,
      deviceScaleFactor: fingerprint.pixelRatio,
    });

    // Enhanced anti-detection scripts
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Hide automation indicators
      const windowObj = window as any;
      delete windowObj.chrome?.runtime;
      delete windowObj.__nightmare;
      delete windowObj.__phantomas;
      delete windowObj._phantom;
      delete windowObj.callPhantom;
      delete windowObj.__webdriver_script_fn;

      // Chrome object spoofing
      windowObj.chrome = {
        runtime: {},
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

      // WebGL fingerprint spoofing
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Google Inc. (Intel)';
        if (parameter === 37446) return 'ANGLE (Intel, Intel(R) Iris(TM) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return getParameter(parameter);
      };

      // Canvas fingerprint randomization
      const toBlob = HTMLCanvasElement.prototype.toBlob;
      const toDataURL = HTMLCanvasElement.prototype.toDataURL;
      const getImageData = CanvasRenderingContext2D.prototype.getImageData;

      const noisify = function(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        const shift = {
          'r': Math.floor(Math.random() * 10) - 5,
          'g': Math.floor(Math.random() * 10) - 5,
          'b': Math.floor(Math.random() * 10) - 5,
          'a': Math.floor(Math.random() * 10) - 5
        };

        const width = canvas.width;
        const height = canvas.height;
        const imageData = getImageData.apply(context, [0, 0, width, height]);

        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            const n = ((i * (width * 4)) + (j * 4));
            imageData.data[n + 0] = imageData.data[n + 0] + shift.r;
            imageData.data[n + 1] = imageData.data[n + 1] + shift.g;
            imageData.data[n + 2] = imageData.data[n + 2] + shift.b;
            imageData.data[n + 3] = imageData.data[n + 3] + shift.a;
          }
        }

        context.putImageData(imageData, 0, 0);
      };

      Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function(callback: BlobCallback, type?: string, quality?: number) {
          noisify(this, this.getContext('2d')!);
          return toBlob.apply(this, [callback, type, quality]);
        }
      });

      Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
        value: function(type?: string, quality?: number) {
          noisify(this, this.getContext('2d')!);
          return toDataURL.apply(this, [type, quality]);
        }
      });
    });

    // Set locale and timezone
    await page.emulateTimezone(fingerprint.timezone);
    await page.setExtraHTTPHeaders({
      'Accept-Language': fingerprint.locale,
    });

    // Advanced request interception
    await page.setRequestInterception(true);
    
    page.on('request', async (request: HTTPRequest) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Block unnecessary resources for performance
      const blockedResources = options.blockAds ? 
        ['image', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset', 'stylesheet'] :
        ['beacon', 'csp_report'];

      if (blockedResources.includes(resourceType)) {
        return request.abort();
      }

      // Block ads and trackers
      if (options.blockTrackers && this.isTrackerUrl(url)) {
        return request.abort();
      }

      // Apply proxy if configured
      if (options.useProxy && options.proxyList && options.proxyList.length > 0) {
        const proxy = this.getRandomProxy(options.proxyList);
        if (proxy) {
          // Note: Proxy implementation would require additional setup
          console.log(`Using proxy: ${proxy.host}:${proxy.port}`);
        }
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
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
      };

      request.continue({ headers });
    });

    // Handle console logs and errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    return page;
  }

  private isTrackerUrl(url: string): boolean {
    const trackerDomains = [
      'google-analytics.com', 'googletagmanager.com', 'facebook.com/tr',
      'connect.facebook.net', 'doubleclick.net', 'googlesyndication.com',
      'amazon-adsystem.com', 'googleadservices.com', 'adsystem.amazon.com',
      'quantserve.com', 'scorecardresearch.com', 'outbrain.com',
      'taboola.com', 'bing.com/th', 'hotjar.com', 'crazyegg.com',
      'fullstory.com', 'mixpanel.com', 'segment.com', 'heap.io'
    ];

    return trackerDomains.some(domain => url.includes(domain));
  }

  private async humanLikeDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async simulateHumanBehavior(page: Page, options: Required<EnhancedScrapingOptions>): Promise<void> {
    if (!options.humanLikeDelays && !options.mouseMovements) return;

    try {
      // Random mouse movements
      if (options.mouseMovements) {
        const viewport = page.viewport();
        if (viewport) {
          const moves = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < moves; i++) {
            const x = Math.floor(Math.random() * viewport.width);
            const y = Math.floor(Math.random() * viewport.height);
            await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
            await this.humanLikeDelay(100, 500);
          }
        }
      }

      // Random scrolling
      if (options.humanLikeDelays) {
        const scrolls = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < scrolls; i++) {
          await page.evaluate(() => {
            window.scrollBy(0, Math.floor(Math.random() * 500) + 100);
          });
          await this.humanLikeDelay(200, 800);
        }
      }
    } catch (error) {
      console.warn('Failed to simulate human behavior:', error);
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('✅ Enhanced browser closed successfully');
      } catch (error) {
        console.warn('⚠️  Error closing enhanced browser:', error);
      } finally {
        this.browser = null;
      }
    }
  }

  async scrapeWebsite(url: string, options: Partial<EnhancedScrapingOptions> = {}): Promise<ScrapedData> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    let page: Page | null = null;
    let attempts = 0;

    while (attempts < opts.retryAttempts) {
      try {
        console.log(`🌐 [Attempt ${attempts + 1}] Enhanced scraping: ${url}`);
        
        page = await this.createEnhancedPage(opts);
        
        // Apply request delay
        if (attempts > 0) {
          await this.humanLikeDelay(opts.requestDelay.min, opts.requestDelay.max);
        }

        const navigationStart = Date.now();
        
        // Navigate with enhanced options
        await page.goto(url, {
          waitUntil: opts.followRedirects ? 'networkidle2' : 'domcontentloaded',
          timeout: opts.timeout
        });
        
        const responseTime = Date.now() - navigationStart;

        // Wait for specific selector if provided
        if (opts.waitForSelector && opts.waitForSelector !== 'body') {
          try {
            await page.waitForSelector(opts.waitForSelector, { timeout: 10000 });
          } catch (e) {
            console.warn(`⚠️  Selector ${opts.waitForSelector} not found, continuing anyway`);
          }
        }

        // Simulate human behavior
        await this.simulateHumanBehavior(page, opts);

        // Extract all the structured data (reusing your existing extraction logic)
        const scrapedData = await page.evaluate((options) => {
          // Your existing extraction logic from general-scraper.ts
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

          const extractEmails = (text: string): string[] => {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            return [...new Set(text.match(emailRegex) || [])];
          };

          const extractPhones = (text: string): string[] => {
            const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
            return [...new Set(text.match(phoneRegex) || [])];
          };

          const extractSocialLinks = (links: NodeListOf<HTMLAnchorElement>): Array<{platform: string, url: string}> => {
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
              'whatsapp.com': 'WhatsApp',
              'telegram.org': 'Telegram',
              'discord.com': 'Discord',
              'reddit.com': 'Reddit',
              'medium.com': 'Medium'
            };

            const socialLinks: Array<{platform: string, url: string}> = [];
            
            for (const link of links) {
              const href = link.href;
              for (const [domain, platform] of Object.entries(socialPlatforms)) {
                if (href.includes(domain)) {
                  socialLinks.push({ platform, url: href });
                  break;
                }
              }
            }
            
            return socialLinks;
          };

          // Get basic page info
          const title = document.title || '';
          const url = window.location.href;
          const domain = getDomain(url);

          // Extract metadata
          const getMetaContent = (name: string): string => {
            const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
            return meta?.content || '';
          };

          const metadata = {
            description: getMetaContent('description'),
            keywords: getMetaContent('keywords'),
            author: getMetaContent('author'),
            ogTitle: getMetaContent('og:title'),
            ogDescription: getMetaContent('og:description'),
            ogImage: getMetaContent('og:image'),
            twitterTitle: getMetaContent('twitter:title'),
            twitterDescription: getMetaContent('twitter:description'),
            twitterImage: getMetaContent('twitter:image')
          };

          // Extract headings
          const headings = {
            h1: Array.from(document.querySelectorAll('h1')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0),
            h2: Array.from(document.querySelectorAll('h2')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0),
            h3: Array.from(document.querySelectorAll('h3')).map(el => getCleanText(el.textContent)).filter(text => text.length > 0)
          };

          // Extract paragraphs
          const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(el => getCleanText(el.textContent))
            .filter(text => text.length > 20)
            .slice(0, 50);

          // Extract links
          const linkElements = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
          const links = options.extractLinks ? Array.from(linkElements)
            .map(el => ({
              text: getCleanText(el.textContent),
              url: el.href,
              isExternal: isExternalLink(el.href, domain)
            }))
            .filter(link => link.text.length > 0 && link.url.length > 0)
            .slice(0, 100) : [];

          // Extract images
          const images = options.extractImages ? Array.from(document.querySelectorAll('img'))
            .map(el => ({
              src: el.src,
              alt: el.alt || '',
              title: el.title || ''
            }))
            .filter(img => img.src.length > 0)
            .slice(0, 50) : [];

          // Extract contact information
          const pageText = document.body.textContent || '';
          const emails = extractEmails(pageText);
          const phones = extractPhones(pageText);
          const socialLinks = extractSocialLinks(linkElements);

          // Analyze page structure
          const structure = {
            hasNav: document.querySelector('nav') !== null,
            hasHeader: document.querySelector('header') !== null,
            hasFooter: document.querySelector('footer') !== null,
            hasSidebar: document.querySelector('aside, .sidebar, .side-bar') !== null,
            articleCount: document.querySelectorAll('article').length,
            formCount: document.querySelectorAll('form').length
          };

          return {
            url,
            title: getCleanText(title),
            domain,
            metadata,
            content: {
              headings,
              paragraphs: paragraphs.slice(0, options.maxContentLength ? Math.floor(options.maxContentLength / 100) : 100),
              links,
              images,
              contactInfo: {
                emails: emails.slice(0, 10),
                phones: phones.slice(0, 10),
                socialLinks: socialLinks.slice(0, 20)
              }
            },
            structure
          };
        }, opts);

        const loadTime = Date.now() - startTime;

        const result = {
          ...scrapedData,
          performance: {
            loadTime,
            responseTime
          }
        } as ScrapedData;

        console.log(`✅ Enhanced scraping successful: ${url}`);
        return result;

      } catch (error) {
        attempts++;
        console.error(`❌ Enhanced scraping attempt ${attempts} failed for ${url}:`, error);
        
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.warn(`⚠️  Error closing page after failure:`, closeError);
          }
          page = null;
        }

        if (attempts >= opts.retryAttempts) {
          throw error;
        }

        // Exponential backoff
        await this.humanLikeDelay(1000 * attempts, 3000 * attempts);
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.warn(`⚠️  Error closing page:`, closeError);
          }
        }
      }
    }

    throw new Error(`Failed to scrape ${url} after ${opts.retryAttempts} attempts`);
  }

  async scrapeMultipleWebsites(urls: string[], options: Partial<EnhancedScrapingOptions> = {}): Promise<ScrapedData[]> {
    const results: ScrapedData[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n📊 Enhanced scraping ${i + 1}/${urls.length}: ${url}`);
      
      try {
        const data = await this.scrapeWebsite(url, options);
        results.push(data);
        successCount++;
        console.log(`✅ Successfully scraped: ${url}`);
        
        // Add intelligent delay between requests
        if (i < urls.length - 1) {
          await this.humanLikeDelay(
            options.requestDelay?.min || 2000,
            options.requestDelay?.max || 5000
          );
        }
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to scrape ${url}:`, error);
        
        // If browser connection is lost, try to reinitialize
        if (error && error.toString().includes('Protocol error: Connection closed')) {
          console.log(`🔄 Attempting to reinitialize enhanced browser...`);
          try {
            await this.close();
            await this.setup(options);
            console.log(`✅ Enhanced browser reinitialized successfully`);
          } catch (reinitError) {
            console.error(`❌ Failed to reinitialize enhanced browser:`, reinitError);
          }
        }
      }
    }
    
    console.log(`\n📊 Enhanced Scraping Summary: ${successCount} successful, ${failureCount} failed out of ${urls.length} total`);
    return results;
  }
}
