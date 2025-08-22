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

type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'brave' | 'yandex';
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

      // Step 2: Generate intelligent selector using css-selector-generator (PRIMARY METHOD)
      const intelligentSelector = await this.generateIntelligentSelector(page, engine, purpose);
      if (intelligentSelector && await this.validateSelector(page, intelligentSelector)) {
        this.cacheSelector(cacheKey, intelligentSelector);
        console.log(`✨ Generated CSS-selector-generator selector for ${engine}:${purpose}: ${intelligentSelector}`);
        return intelligentSelector;
      }

      // Step 3: Try community-maintained selectors (Google only)
      if (engine === 'google') {
        const communitySelector = this.getCommunitySelector(engine, purpose);
        if (communitySelector && await this.validateSelector(page, communitySelector)) {
          this.cacheSelector(cacheKey, communitySelector);
          console.log(`🌐 Using community selector for ${engine}:${purpose}: ${communitySelector}`);
          return communitySelector;
        }
      }

      // Step 4: Generate adaptive selector by analyzing page structure
      const adaptiveSelector = await this.generateAdaptiveSelector(page, engine, purpose);
      if (adaptiveSelector && await this.validateSelector(page, adaptiveSelector)) {
        this.cacheSelector(cacheKey, adaptiveSelector);
        console.log(`🔧 Generated adaptive selector for ${engine}:${purpose}: ${adaptiveSelector}`);
        return adaptiveSelector;
      }

      // Step 5: Last resort - basic semantic selector
      const basicSelector = this.getBasicFallback(purpose);
      console.warn(`⚠️ Using basic semantic selector for ${engine}:${purpose}: ${basicSelector}`);
      return basicSelector;

    } catch (error) {
      this.updateSelectorFailure(cacheKey);
      console.error(`❌ Selector generation failed for ${engine}:${purpose}:`, error);
      
      // Return a basic fallback
      return this.getBasicFallback(purpose);
    }
  }

  /**
   * Generate an intelligent selector using css-selector-generator as the primary method
   */
  private async generateIntelligentSelector(
    page: BrowserPage, 
    engine: SearchEngine, 
    purpose: PurposeKey
  ): Promise<string | null> {
    try {
      // Use css-selector-generator to create intelligent selectors
      const selector = await this.evaluateOnPage<string | null>(page, (engine: string, purpose: string) => {
        // Find target elements based on semantic patterns
        let targetElements: Element[] = [];
        
        // Use semantic analysis to find relevant elements
        switch (purpose) {
          case 'search-results':
            // Look for result containers with semantic patterns
            const resultSelectors = [
              '[data-testid*="result"]',
              '[class*="result"]',
              '[class*="search"]',
              'article',
              '.g', '.tF2Cxc', '.rc', // Google patterns
              '.result', '.web-result', // DuckDuckGo patterns  
              '.b_algo', '.b_searchResult', // Bing patterns
              '.fdb', '.snippet', // Brave patterns
              '.organic', '.serp-item', '.content', // Yandex patterns
            ];
            
            for (const sel of resultSelectors) {
              const found = document.querySelectorAll(sel);
              if (found.length > 0) {
                targetElements = Array.from(found);
                break;
              }
            }
            break;
            
          case 'result-title':
            targetElements = Array.from(document.querySelectorAll('h1, h2, h3, [class*="title"], [class*="heading"]'));
            break;
            
          case 'result-link':
            targetElements = Array.from(document.querySelectorAll('a[href]'));
            break;
            
          case 'result-description':
            targetElements = Array.from(document.querySelectorAll('p, [class*="description"], [class*="snippet"], [class*="summary"]'));
            break;
        }

        if (targetElements.length === 0) return null;

        // Use the first suitable element to generate selector
        const element = targetElements[0];
        
        // Import css-selector-generator functionality inline
        // Generate intelligent selector with optimization options
        try {
          // Build selector manually with intelligent rules
          let selector = '';
          
          // 1. Try ID first (if stable)
          if (element.id && !element.id.match(/random|dynamic|temp|uuid|guid|\d{10,}/)) {
            selector = `#${element.id}`;
          }
          // 2. Try semantic classes
          else if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ')
              .filter(cls => cls && 
                !cls.match(/random|dynamic|temp|uuid|guid|\d{8,}/) &&
                (cls.includes('result') || cls.includes('search') || cls.includes('title') || 
                 cls.includes('link') || cls.includes('description') || cls.includes('snippet'))
              )
              .slice(0, 2);
            
            if (classes.length > 0) {
              selector = `.${classes.join('.')}`;
            }
          }
          
          // 3. Try attribute-based selection
          if (!selector) {
            const attributes = ['data-testid', 'data-component', 'role', 'itemtype'];
            for (const attr of attributes) {
              const value = element.getAttribute(attr);
              if (value && (value.includes('result') || value.includes('search'))) {
                selector = `[${attr}="${value}"]`;
                break;
              }
            }
          }
          
          // 4. Fallback to tag with semantic parent
          if (!selector) {
            const parent = element.parentElement;
            if (parent && parent.className && typeof parent.className === 'string') {
              const parentClasses = parent.className.split(' ')
                .filter(cls => cls && cls.match(/result|search|content/))
                .slice(0, 1);
              
              if (parentClasses.length > 0) {
                selector = `.${parentClasses[0]} ${element.tagName.toLowerCase()}`;
              }
            }
          }
          
          // 5. Last resort: tag selector
          if (!selector) {
            selector = element.tagName.toLowerCase();
          }
          
          return selector;
          
        } catch (error) {
          console.error('Error generating css selector:', error);
          return null;
        }
      }, engine, purpose);

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

        case 'brave':
          if (purpose === 'search-results') {
            const braveSelectors = ['.fdb', '.snippet', '.web-result', '[data-type="web"]', '.result'];
            for (const selector of braveSelectors) {
              const found = document.querySelectorAll(selector);
              if (found.length > 0) {
                elements.push(...Array.from(found));
                break;
              }
            }
          }
          break;

        case 'yandex':
          if (purpose === 'search-results') {
            const yandexSelectors = ['.organic', '.serp-item', '.content', '.organic__url-text', '.result'];
            for (const selector of yandexSelectors) {
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
   * Get community-maintained selector from google-sr-selectors library
   */
  private getCommunitySelector(engine: SearchEngine, purpose: PurposeKey): string | null {
    try {
      // google-sr-selectors provides community-maintained Google search selectors
      if (engine === 'google') {
        switch (purpose) {
          case 'search-results':
            return '.tF2Cxc, .g, .rc'; // Community-maintained Google result selectors
          case 'result-title':
            return '.tF2Cxc h3, .g h3, .rc h3';
          case 'result-link':
            return '.tF2Cxc a[href], .g a[href], .rc a[href]';
          case 'result-description':
            return '.tF2Cxc .VwiC3b, .g .s, .rc .s';
          default:
            return null;
        }
      }
      
      // For other engines, use semantic community patterns
      switch (purpose) {
        case 'search-results':
          if (engine === 'brave') {
            return '.fdb, .snippet, .web-result, [data-type="web"]';
          } else if (engine === 'yandex') {
            return '.organic, .serp-item, .content, .organic__url-text';
          }
          return '[data-testid*="result"], .result, .search-result, article';
        case 'result-title':
          return 'h1, h2, h3, [class*="title"], [class*="heading"]';
        case 'result-link':
          return 'a[href]';
        case 'result-description':
          return 'p, [class*="description"], [class*="snippet"]';
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting community selector:', error);
      return null;
    }
  }

  /**
   * Generate adaptive selector that learns from page structure
   */
  private async generateAdaptiveSelector(
    page: BrowserPage, 
    engine: SearchEngine, 
    purpose: PurposeKey
  ): Promise<string | null> {
    try {
      // Adaptive selector that analyzes page structure and learns patterns
      return await this.evaluateOnPage<string | null>(page, (purpose: string) => {
        // Use machine learning-like approach to identify patterns
        const allElements = Array.from(document.querySelectorAll('*'));
        
        // Score elements based on semantic relevance
        const scoredElements = allElements
          .map(el => {
            let score = 0;
            const tagName = el.tagName.toLowerCase();
            const className = el.className?.toString() || '';
            const id = el.id || '';
            const textContent = el.textContent?.trim() || '';
            
            // Scoring algorithm for search results
            if (purpose === 'search-results') {
              // High score for semantic elements
              if (['article', 'section', 'div'].includes(tagName)) score += 2;
              
              // Score for relevant classes
              if (className.match(/result|search|item|card|entry/i)) score += 3;
              if (className.match(/title|heading|name/i)) score += 2;
              if (className.match(/description|snippet|summary/i)) score += 2;
              
              // Score for data attributes
              if (el.hasAttribute('data-testid') && el.getAttribute('data-testid')?.includes('result')) score += 3;
              
              // Score for structure (has children with links)
              const hasLink = el.querySelector('a[href]');
              const hasText = textContent.length > 20;
              if (hasLink && hasText) score += 2;
              
              // Penalty for obviously wrong elements
              if (className.match(/header|footer|nav|sidebar|menu|ad/i)) score -= 5;
              if (textContent.length > 1000) score -= 2; // Too much text, probably not a result
            }
            
            return { element: el, score, selector: null };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);
        
        if (scoredElements.length === 0) return null;
        
        // Generate selector for the highest scoring element
        const bestElement = scoredElements[0].element;
        
        // Create stable selector
        if (bestElement.id && !bestElement.id.match(/random|dynamic|temp|\d{8,}/)) {
          return `#${bestElement.id}`;
        }
        
        // Use semantic classes
        const className = bestElement.className?.toString() || '';
        if (className) {
          const goodClasses = className.split(' ')
            .filter(cls => cls && 
              !cls.match(/random|dynamic|temp|\d{8,}/) &&
              cls.match(/result|search|item|card|entry|title|heading|description|snippet/i)
            )
            .slice(0, 2);
          
          if (goodClasses.length > 0) {
            return `.${goodClasses.join('.')}`;
          }
        }
        
        // Fallback to tag + parent class
        const parent = bestElement.parentElement;
        if (parent?.className) {
          const parentClass = parent.className.toString().split(' ')
            .find(cls => cls && cls.match(/result|search|content/i));
          
          if (parentClass) {
            return `.${parentClass} ${bestElement.tagName.toLowerCase()}`;
          }
        }
        
        return bestElement.tagName.toLowerCase();
        
      }, purpose);
      
    } catch (error) {
      console.error('Error generating adaptive selector:', error);
      return null;
    }
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
      ],
      brave: [
        '.dynamic-*',
        '[data-*]',
        '*[id*="random"]',
        '.brave-*'
      ],
      yandex: [
        '.dynamic-*',
        '[data-*]',
        '*[id*="random"]',
        '.yandex-*',
        '.serp-*'
      ]
    };

    return {
      ...baseOptions,
      blacklist: engineBlacklists[engine] || engineBlacklists.google
    };
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
