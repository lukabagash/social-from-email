import puppeteer from 'puppeteer-extra';
import { Page, Browser } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as dotenv from 'dotenv';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

dotenv.config();

export interface ScrapedData {
  url: string;
  title: string;
  domain: string;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  };
  content: {
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
      alt: string;
      title?: string;
    }>;
    contactInfo: {
      emails: string[];
      phones: string[];
      socialLinks: Array<{
        platform: string;
        url: string;
      }>;
    };
  };
  structure: {
    hasNav: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    hasSidebar: boolean;
    articleCount: number;
    formCount: number;
  };
  performance: {
    loadTime: number;
    responseTime: number;
  };
}

export interface ScrapingOptions {
  timeout?: number;
  waitForSelector?: string;
  extractImages?: boolean;
  extractLinks?: boolean;
  maxContentLength?: number;
  followRedirects?: boolean;
}

export class GeneralWebScraper {
  private browser: Browser | null = null;
  private readonly defaultOptions: Required<ScrapingOptions> = {
    timeout: 15000,
    waitForSelector: 'body',
    extractImages: true,
    extractLinks: true,
    maxContentLength: 10000,
    followRedirects: true
  };

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
          '--disable-features=VizDisplayCompositor',
          '--enable-features=NetworkService',
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
          '--disable-dev-shm-usage',
          '--single-process',
          '--no-first-run'
        ],
        timeout: 30000,
        protocolTimeout: 30000
      });
      console.log('🚀 Browser launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch browser:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('✅ Browser closed successfully');
      } catch (error) {
        console.warn('⚠️  Error closing browser:', error);
      } finally {
        this.browser = null;
      }
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    let page: Page;
    try {
      page = await this.browser.newPage();
    } catch (error) {
      console.error('❌ Failed to create new page:', error);
      throw error;
    }

    try {
      // Block unnecessary resources to speed up scraping
      const blockedResources = ['image', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];
      
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (blockedResources.includes(req.resourceType())) {
          return req.abort();
        }
        return req.continue();
      });

      // Set realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

      // Remove webdriver detection
      await page.evaluateOnNewDocument(() => {
        delete (navigator as any).__proto__.webdriver;
      });

      await page.setViewport({
        width: 1200,
        height: 720
      });

      return page;
    } catch (error) {
      console.error('❌ Failed to configure page:', error);
      try {
        await page.close();
      } catch (closeError) {
        console.warn('⚠️  Error closing page after configuration failure:', closeError);
      }
      throw error;
    }
  }

  async scrapeWebsite(url: string, options: ScrapingOptions = {}): Promise<ScrapedData> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    let page: Page | null = null;

    try {
      console.log(`🌐 Scraping: ${url}`);
      
      page = await this.createPage();
      
      const navigationStart = Date.now();
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: opts.timeout
      });
      const responseTime = Date.now() - navigationStart;

      // Wait for specific selector if provided
      if (opts.waitForSelector && opts.waitForSelector !== 'body') {
        try {
          await page.waitForSelector(opts.waitForSelector, { timeout: 5000 });
        } catch (e) {
          console.warn(`⚠️  Selector ${opts.waitForSelector} not found, continuing anyway`);
        }
      }

      // Extract all the structured data
      const scrapedData = await page.evaluate((options) => {
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
          .slice(0, 50); // Limit to first 50 meaningful paragraphs

        // Extract links
        const linkElements = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
        const links = options.extractLinks ? Array.from(linkElements)
          .map(el => ({
            text: getCleanText(el.textContent),
            url: el.href,
            isExternal: isExternalLink(el.href, domain)
          }))
          .filter(link => link.text.length > 0 && link.url.length > 0)
          .slice(0, 100) : []; // Limit to first 100 links

        // Extract images
        const images = options.extractImages ? Array.from(document.querySelectorAll('img'))
          .map(el => ({
            src: el.src,
            alt: el.alt || '',
            title: el.title || ''
          }))
          .filter(img => img.src.length > 0)
          .slice(0, 50) : []; // Limit to first 50 images

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

      return {
        ...scrapedData,
        performance: {
          loadTime,
          responseTime
        }
      } as ScrapedData;

    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error);
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

  async scrapeMultipleWebsites(urls: string[], options: ScrapingOptions = {}): Promise<ScrapedData[]> {
    const results: ScrapedData[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n📊 Scraping ${i + 1}/${urls.length}: ${url}`);
      
      try {
        const data = await this.scrapeWebsite(url, options);
        results.push(data);
        successCount++;
        console.log(`✅ Successfully scraped: ${url}`);
        
        // Add delay between requests to be respectful
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        }
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to scrape ${url}:`, error);
        
        // If browser connection is lost, try to reinitialize
        if (error && error.toString().includes('Protocol error: Connection closed')) {
          console.log(`🔄 Attempting to reinitialize browser...`);
          try {
            await this.close();
            await this.setup();
            console.log(`✅ Browser reinitialized successfully`);
          } catch (reinitError) {
            console.error(`❌ Failed to reinitialize browser:`, reinitError);
          }
        }
        
        // Continue with next URL instead of failing completely
      }
    }
    
    console.log(`\n📊 Scraping Summary: ${successCount} successful, ${failureCount} failed out of ${urls.length} total`);
    return results;
  }
}
