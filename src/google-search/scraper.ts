import puppeteer, { Page, Browser } from 'puppeteer';
import * as dotenv from 'dotenv';

dotenv.config();

export interface GoogleSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface SearchOptions {
  maxResults?: number;
  includeSnippets?: boolean;
  timeout?: number;
}

export class GoogleSearchScraper {
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

  async searchGoogle(query: string, options: SearchOptions = {}): Promise<GoogleSearchResult[]> {
    const { maxResults = 10, includeSnippets = true, timeout = 30000 } = options;
    const page = await this.createPage();
    const results: GoogleSearchResult[] = [];

    try {
      console.log(`🔍 Searching Google for: "${query}"`);
      
      // Navigate to Google
      await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout });

      // Accept cookies if the dialog appears
      try {
        await page.waitForSelector('button[id*="accept"], button[id*="agree"]', { timeout: 3000 });
        await page.click('button[id*="accept"], button[id*="agree"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch {
        // Cookie dialog might not appear
      }

      // Find search input and enter query
      await page.waitForSelector('input[name="q"], textarea[name="q"]', { timeout: 10000 });
      await page.type('input[name="q"], textarea[name="q"]', query);
      
      // Submit the search
      await page.keyboard.press('Enter');
      
      // Wait for search results to load
      await page.waitForSelector('#search', { timeout: 15000 });
      
      // Extract search results
      const searchResults = await page.evaluate((maxRes, includeSnips) => {
        const results: GoogleSearchResult[] = [];
        
        // Try different selectors for search results
        const resultSelectors = [
          'div[data-ved] h3',
          '.g h3',
          '[data-header-feature="0"] h3',
          'div.g div[data-ved] h3'
        ];
        
        let resultElements: Element[] = [];
        
        for (const selector of resultSelectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          if (elements.length > 0) {
            resultElements = elements;
            break;
          }
        }

        for (let i = 0; i < Math.min(resultElements.length, maxRes); i++) {
          const titleElement = resultElements[i];
          const resultContainer = titleElement.closest('.g, [data-ved]');
          
          if (!resultContainer) continue;

          try {
            // Get title
            const title = titleElement.textContent?.trim() || '';
            
            // Get URL
            const linkElement = titleElement.closest('a') || resultContainer.querySelector('a');
            let url = linkElement?.getAttribute('href') || '';
            
            // Clean up Google redirect URLs
            if (url.startsWith('/url?q=')) {
              const urlMatch = url.match(/\/url\?q=([^&]+)/);
              url = urlMatch ? decodeURIComponent(urlMatch[1]) : url;
            }
            
            // Get snippet
            let snippet = '';
            if (includeSnips) {
              const snippetSelectors = [
                '.VwiC3b',
                '[data-sncf]',
                '.s3v9rd',
                '.st'
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

    } catch (error) {
      console.error('Error during Google search:', error);
    } finally {
      await page.close();
    }

    return results;
  }

  async searchPerson(firstName: string, lastName: string, email?: string, options: SearchOptions = {}): Promise<GoogleSearchResult[]> {
    // Construct search query
    let query = `"${firstName} ${lastName}"`;
    
    if (email) {
      // Add email to search query
      query += ` "${email}"`;
    }

    return this.searchGoogle(query, options);
  }

  async searchPersonWithVariations(firstName: string, lastName: string, email?: string, options: SearchOptions = {}): Promise<GoogleSearchResult[]> {
    const allResults: GoogleSearchResult[] = [];
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

    for (let i = 0; i < searches.length; i++) {
      const query = searches[i];
      console.log(`   ${i + 1}/${searches.length}: ${query}`);
      
      try {
        const results = await this.searchGoogle(query, { ...options, maxResults: 3 });
        allResults.push(...results);
        
        // Add delay between searches to avoid rate limiting
        if (i < searches.length - 1) {
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
}
