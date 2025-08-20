import puppeteer, { Page, Browser } from 'puppeteer';
import * as dotenv from 'dotenv';

dotenv.config();

// Use the same interface as Google Search for compatibility
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface SearchOptions {
  maxResults?: number;
  includeSnippets?: boolean;
  timeout?: number;
  queryLimit?: number;  // Limit number of queries to execute
}

export class DuckDuckGoSearchScraper {
  private browser: Browser | null = null;

  async setup() {
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
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    const page = await this.browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });

    // Remove automation detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    return page;
  }

  async searchDuckDuckGo(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { maxResults = 10, includeSnippets = true, timeout = 30000 } = options;
    const page = await this.createPage();
    const results: SearchResult[] = [];

    try {
      console.log(`🔍 Searching DuckDuckGo for: "${query}"`);
      
      // Navigate to DuckDuckGo
      await page.goto('https://duckduckgo.com', { waitUntil: 'networkidle2', timeout });

      // Find search input and enter query
      await page.waitForSelector('input[name="q"]', { timeout: 10000 });
      await page.type('input[name="q"]', query);
      
      // Submit the search
      await page.keyboard.press('Enter');
      
      // Wait for search results to load
      await page.waitForSelector('[data-testid="result"]', { timeout: 15000 });
      
      // Extract search results
      const searchResults = await page.evaluate((maxRes, includeSnips) => {
        const results: SearchResult[] = [];
        
        // DuckDuckGo uses data-testid="result" for search results
        const resultElements = Array.from(document.querySelectorAll('[data-testid="result"]'));
        
        for (let i = 0; i < Math.min(resultElements.length, maxRes); i++) {
          const resultContainer = resultElements[i];
          
          try {
            // Get title - DuckDuckGo uses h2 with data-testid="result-title-a"
            const titleElement = resultContainer.querySelector('[data-testid="result-title-a"]') || 
                                resultContainer.querySelector('h2 a') ||
                                resultContainer.querySelector('h3 a');
            const title = titleElement?.textContent?.trim() || '';
            
            // Get URL
            const linkElement = titleElement as HTMLAnchorElement;
            let url = linkElement?.href || '';
            
            // Get snippet
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
            
            // Get domain
            const domain = url ? new URL(url).hostname : '';
            
            if (title && url && url.startsWith('http')) {
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
        
        return results;
      }, maxResults, includeSnippets);

      results.push(...searchResults);

      console.log(`✅ Found ${results.length} DuckDuckGo results`);

    } catch (error) {
      console.error('Error during DuckDuckGo search:', error);
    } finally {
      await page.close();
    }

    return results;
  }

  async searchPerson(firstName: string, lastName: string, email?: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Construct search query
    let query = `"${firstName} ${lastName}"`;
    
    if (email) {
      // Add email to search query
      query += ` "${email}"`;
    }

    return this.searchDuckDuckGo(query, options);
  }

  async searchPersonWithVariations(firstName: string, lastName: string, email?: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const searches: string[] = [];

    // Basic search
    searches.push(`"${firstName} ${lastName}"`);
    
    if (email) {
      // Search with email
      searches.push(`"${firstName} ${lastName}" "${email}"`);
      
      // Search with email domain
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

    console.log(`🔍 Running ${searches.length} search variations...`);

    // Limit queries if queryLimit is specified
    const queriesToExecute = options.queryLimit ? searches.slice(0, options.queryLimit) : searches;
    console.log(`📊 Executing ${queriesToExecute.length}/${searches.length} queries...`);

    for (let i = 0; i < queriesToExecute.length; i++) {
      const query = queriesToExecute[i];
      console.log(`   ${i + 1}/${queriesToExecute.length}: ${query}`);
      
      try {
        const results = await this.searchDuckDuckGo(query, { ...options, maxResults: 3 });
        allResults.push(...results);
        
        // Add delay between searches to avoid rate limiting
        if (i < queriesToExecute.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error in search ${i + 1}:`, error);
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    );

    return uniqueResults;
  }

  // Alias methods to maintain compatibility with Google Search interface
  async searchGoogle(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    return this.searchDuckDuckGo(query, options);
  }
}

// Export the SearchResult interface as GoogleSearchResult for compatibility
export type GoogleSearchResult = SearchResult;
