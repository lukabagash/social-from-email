import { getCssSelector } from 'css-selector-generator';
import { OrganicSearchSelector, GeneralSelector } from 'google-sr-selectors';
import { Page as PuppeteerPage } from 'puppeteer';
import { Page as PlaywrightPage } from 'playwright';

// Union type to support both Playwright and Puppeteer pages
type BrowserPage = PuppeteerPage | PlaywrightPage;

// Helper to determine if page is Playwright or Puppeteer
const isPlaywrightPage = (page: BrowserPage): page is PlaywrightPage => {
  return 'locator' in page;
};

interface SelectorCache {
  selector: string;
  timestamp: number;
  successCount: number;
  failureCount: number;
  lastValidated: number;
}

interface SelectorPurpose {
  'search-results': string;
  'result-title': string;
  'result-link': string;
  'result-description': string;
  'result-snippet': string;
}

type SearchEngine = 'google' | 'duckduckgo' | 'bing';
type PurposeKey = keyof SelectorPurpose;

/**
 * Intelligent Selector Manager that automatically generates, validates, and maintains
 * CSS selectors for web scraping with fallback strategies and caching.
 */
export class IntelligentSelectorManager {
  private selectorCache = new Map<string, SelectorCache>();
  private readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_FAILURE_COUNT = 3;
  private readonly VALIDATION_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    console.log('🤖 Intelligent Selector Manager initialized');
  }

  /**
   * Main method to get a selector for a specific engine and purpose.
   * Implements intelligent fallback strategy with caching and validation.
   */
  private async evaluateOnPage<T>(page: BrowserPage, pageFunction: string | Function, ...args: any[]): Promise<T> {
    if (isPlaywrightPage(page)) {
      return await page.evaluate(pageFunction as any, ...args);
    } else {
      return await page.evaluate(pageFunction as any, ...args);
    }
  }

  private async querySelectorAll(page: BrowserPage, selector: string): Promise<any[]> {
    if (isPlaywrightPage(page)) {
      return await page.locator(selector).all();
    } else {
      return await page.$$(selector);
    }
  }

  private async waitForSelector(page: BrowserPage, selector: string, timeout = 5000): Promise<boolean> {
    try {
      if (isPlaywrightPage(page)) {
        await page.waitForSelector(selector, { timeout });
      } else {
        await page.waitForSelector(selector, { timeout });
      }
      return true;
    } catch {
      return false;
    }
  }

  async getSelector(page: BrowserPage, engine: SearchEngine, purpose: PurposeKey): Promise<string> {
    const cacheKey = `${engine}:${purpose}`;
    
    try {
      // Step 1: Try cached selector first
      const cached = this.getCachedSelector(cacheKey);
      if (cached && await this.validateSelector(page, cached.selector)) {
        this.updateSelectorSuccess(cacheKey);
        return cached.selector;
      }

      // Step 2: Generate intelligent selector
      const intelligentSelector = await this.generateIntelligentSelector(page, engine, purpose);
      if (intelligentSelector && await this.validateSelector(page, intelligentSelector)) {
        this.cacheSelector(cacheKey, intelligentSelector);
        console.log(`✨ Generated intelligent selector for ${engine}:${purpose}: ${intelligentSelector}`);
        return intelligentSelector;
      }

      // Step 3: Fallback to pre-maintained selectors
      const fallbackSelector = this.getFallbackSelector(engine, purpose);
      if (fallbackSelector && await this.validateSelector(page, fallbackSelector)) {
        this.cacheSelector(cacheKey, fallbackSelector);
        console.log(`🔄 Using fallback selector for ${engine}:${purpose}: ${fallbackSelector}`);
        return fallbackSelector;
      }

      // Step 4: Last resort - try legacy selectors
      const legacySelector = this.getLegacySelector(engine, purpose);
      if (legacySelector) {
        console.warn(`⚠️ Using legacy selector for ${engine}:${purpose}: ${legacySelector}`);
        return legacySelector;
      }

      throw new Error(`No valid selector found for ${engine}:${purpose}`);
    } catch (error) {
      this.updateSelectorFailure(cacheKey);
      console.error(`❌ Selector generation failed for ${engine}:${purpose}:`, error);
      
      // Return a basic fallback
      return this.getBasicFallback(purpose);
    }
  }

  /**
   * Generate an intelligent selector using css-selector-generator
   */
  private async generateIntelligentSelector(
    page: BrowserPage, 
    engine: SearchEngine, 
    purpose: PurposeKey
  ): Promise<string | null> {
    try {
      // Find elements based on purpose and engine
      const elements = await this.findTargetElements(page, engine, purpose);
      
      if (elements.length === 0) {
        console.log(`🔍 No target elements found for ${engine}:${purpose}`);
        return null;
      }

      // Generate selector using the first element
      const selector = await this.evaluateOnPage<string | null>(page, (elementIndex: number, selectorOptions: any) => {
        const targetElements = document.querySelectorAll('*');
        const element = targetElements[elementIndex];
        
        if (!element) return null;

        // Create a basic intelligent selector based on element properties
        if (!element) return null;
        
        // Prioritize by ID, then class, then tag
        if (element.id && !element.id.match(/random|dynamic|temp/)) {
          return `#${element.id}`;
        }
        
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ')
            .filter(cls => cls && !cls.match(/dynamic|temp|random/))
            .slice(0, 2); // Use max 2 classes
          if (classes.length > 0) {
            return `.${classes.join('.')}`;
          }
        }
        
        return element.tagName.toLowerCase();
      }, 0, this.getSelectorOptions(engine));

      return selector;
    } catch (error) {
      console.error('Error generating intelligent selector:', error);
      return null;
    }
  }

  /**
   * Find target elements based on engine and purpose
   */
  private async findTargetElements(page: BrowserPage, engine: SearchEngine, purpose: PurposeKey): Promise<any[]> {
    return await this.evaluateOnPage<any[]>(page, (engine: SearchEngine, purpose: PurposeKey) => {
      const elements: Element[] = [];
      
      // Engine-specific element detection logic
      switch (engine) {
        case 'google':
          if (purpose === 'search-results') {
            // Look for Google result containers
            const googleSelectors = ['.g', '.tF2Cxc', '.rc', '#search .g', '.MjjYud'];
            for (const selector of googleSelectors) {
              const found = document.querySelectorAll(selector);
              if (found.length > 0) {
                elements.push(...Array.from(found));
                break;
              }
            }
          }
          break;
          
        case 'duckduckgo':
          if (purpose === 'search-results') {
            const ddgSelectors = ['.results .result', '.result', '.web-result', '[data-testid="result"]'];
            for (const selector of ddgSelectors) {
              const found = document.querySelectorAll(selector);
              if (found.length > 0) {
                elements.push(...Array.from(found));
                break;
              }
            }
          }
          break;
          
        case 'bing':
          if (purpose === 'search-results') {
            const bingSelectors = ['.b_algo', '.b_searchResult', '.b_ans'];
            for (const selector of bingSelectors) {
              const found = document.querySelectorAll(selector);
              if (found.length > 0) {
                elements.push(...Array.from(found));
                break;
              }
            }
          }
          break;
      }
      
      return elements.map((el, index) => ({ index, tagName: el.tagName, className: el.className }));
    }, engine, purpose);
  }

  /**
   * Get selector generation options based on engine
   */
  private getSelectorOptions(engine: SearchEngine) {
    const baseOptions = {
      selectors: ['class', 'id', 'tag', 'attribute'],
      combineWithinSelector: true,
      combineBetweenSelectors: true,
      maxCombinations: 50,
      maxCandidates: 25,
    };

    // Engine-specific blacklists
    const engineBlacklists = {
      google: [
        '.dynamic-*',
        '[data-ved]',
        '[data-hveid]',
        '*[id*="random"]',
        '.g-*',
        '*[style*="display:none"]'
      ],
      duckduckgo: [
        '.dynamic-*',
        '[data-*]',
        '*[id*="random"]'
      ],
      bing: [
        '.dynamic-*',
        '[data-*]',
        '*[id*="random"]',
        '.b-*'
      ]
    };

    return {
      ...baseOptions,
      blacklist: engineBlacklists[engine] || engineBlacklists.google
    };
  }

  /**
   * Get fallback selector from maintained libraries
   */
  private getFallbackSelector(engine: SearchEngine, purpose: PurposeKey): string | null {
    if (engine === 'google') {
      switch (purpose) {
        case 'search-results':
          return GeneralSelector.block;
        case 'result-title':
          return OrganicSearchSelector.title;
        case 'result-link':
          return OrganicSearchSelector.link;
        case 'result-description':
          return OrganicSearchSelector.description;
        default:
          return null;
      }
    }
    return null;
  }

  /**
   * Get legacy hardcoded selectors as last resort
   */
  private getLegacySelector(engine: SearchEngine, purpose: PurposeKey): string | null {
    const legacySelectors = {
      google: {
        'search-results': '.g, .tF2Cxc, .rc, #search .g',
        'result-title': 'h3, .r a h3, .LC20lb',
        'result-link': '.r a, .yuRUbf a',
        'result-description': '.st, .VwiC3b',
        'result-snippet': '.st, .VwiC3b'
      },
      duckduckgo: {
        'search-results': '.results .result, .result, .web-result',
        'result-title': '.result__title a, .result__a',
        'result-link': '.result__title a, .result__a',
        'result-description': '.result__snippet',
        'result-snippet': '.result__snippet'
      },
      bing: {
        'search-results': '.b_algo, .b_searchResult, .b_ans',
        'result-title': '.b_title a, h2 a',
        'result-link': '.b_title a, h2 a',
        'result-description': '.b_caption, .b_snippet',
        'result-snippet': '.b_caption, .b_snippet'
      }
    } as const;

    return legacySelectors[engine]?.[purpose] || null;
  }

  /**
   * Basic fallback for when everything else fails
   */
  private getBasicFallback(purpose: PurposeKey): string {
    const basicFallbacks = {
      'search-results': 'div, article, section',
      'result-title': 'h1, h2, h3, a',
      'result-link': 'a[href]',
      'result-description': 'p, span, div',
      'result-snippet': 'p, span, div'
    };

    return basicFallbacks[purpose];
  }

  /**
   * Validate if a selector works on the current page
   */
  async validateSelector(page: BrowserPage, selector: string): Promise<boolean> {
    try {
      const elements = await this.querySelectorAll(page, selector);
      const isValid = elements.length > 0;
      
      if (isValid) {
        // Additional validation: check if elements have meaningful content
        const hasContent = await this.evaluateOnPage<boolean>(page, (sel: string) => {
          const elements = document.querySelectorAll(sel);
          return Array.from(elements).some(el => 
            el.textContent && el.textContent.trim().length > 0
          );
        }, selector);
        
        return hasContent;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Cache management methods
   */
  private getCachedSelector(cacheKey: string): SelectorCache | null {
    const cached = this.selectorCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY_MS) {
      this.selectorCache.delete(cacheKey);
      return null;
    }
    
    // Check if selector has too many failures
    if (cached.failureCount >= this.MAX_FAILURE_COUNT) {
      this.selectorCache.delete(cacheKey);
      return null;
    }
    
    return cached;
  }

  private cacheSelector(cacheKey: string, selector: string): void {
    this.selectorCache.set(cacheKey, {
      selector,
      timestamp: Date.now(),
      successCount: 1,
      failureCount: 0,
      lastValidated: Date.now()
    });
  }

  private updateSelectorSuccess(cacheKey: string): void {
    const cached = this.selectorCache.get(cacheKey);
    if (cached) {
      cached.successCount++;
      cached.lastValidated = Date.now();
      cached.failureCount = Math.max(0, cached.failureCount - 1); // Reduce failure count on success
    }
  }

  private updateSelectorFailure(cacheKey: string): void {
    const cached = this.selectorCache.get(cacheKey);
    if (cached) {
      cached.failureCount++;
    }
  }

  /**
   * Regenerate selector when current one fails
   */
  async regenerateSelector(page: BrowserPage, engine: SearchEngine, purpose: PurposeKey): Promise<void> {
    const cacheKey = `${engine}:${purpose}`;
    this.selectorCache.delete(cacheKey);
    console.log(`🔄 Regenerating selector for ${cacheKey}`);
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { total: number; successful: number; failed: number } {
    let successful = 0;
    let failed = 0;
    
    for (const [, cache] of this.selectorCache) {
      if (cache.successCount > cache.failureCount) {
        successful++;
      } else {
        failed++;
      }
    }
    
    return {
      total: this.selectorCache.size,
      successful,
      failed
    };
  }
}
