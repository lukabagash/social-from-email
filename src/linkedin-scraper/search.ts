import puppeteer, { Page, Browser } from 'puppeteer';
import * as dotenv from 'dotenv';

dotenv.config();

export interface LinkedInProfile {
  fullName: string | null;
  title: string | null;
  location: {
    city: string | null;
    province: string | null;
    country: string | null;
  } | null;
  photo: string | null;
  description: string | null;
  url: string;
}

export interface LinkedInSearchResult {
  profiles: LinkedInProfile[];
}

export class LinkedInSearchScraper {
  private browser: Browser | null = null;
  private sessionCookieValue: string;

  constructor(sessionCookieValue?: string) {
    this.sessionCookieValue = sessionCookieValue || process.env.LINKEDIN_SESSION_COOKIE_VALUE || '';
    if (!this.sessionCookieValue) {
      throw new Error('LinkedIn session cookie value is required. Set LINKEDIN_SESSION_COOKIE_VALUE in environment variables.');
    }
  }

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
        '--allow-running-insecure-content'
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
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set LinkedIn session cookie
    await page.setCookie({
      name: 'li_at',
      value: this.sessionCookieValue,
      domain: '.linkedin.com'
    });

    return page;
  }

  async searchProfiles(firstName: string, lastName: string, email?: string): Promise<LinkedInProfile[]> {
    const page = await this.createPage();
    const profiles: LinkedInProfile[] = [];

    try {
      // Construct search query
      const searchQuery = `${firstName} ${lastName}`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Navigate to LinkedIn people search
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}&origin=SUGGESTION`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for search results to load
      await page.waitForSelector('.search-result__wrapper', { timeout: 10000 }).catch(() => {
        console.log('No search results found or page structure changed');
      });

      // Extract profile information from search results
      const searchResults = await page.$$eval('.search-result__wrapper', (elements) => {
        return elements.slice(0, 10).map((element) => {
          try {
            const nameElement = element.querySelector('.entity-result__title-text a span[aria-hidden="true"]');
            const fullName = nameElement?.textContent?.trim() || null;

            const titleElement = element.querySelector('.entity-result__primary-subtitle');
            const title = titleElement?.textContent?.trim() || null;

            const locationElement = element.querySelector('.entity-result__secondary-subtitle');
            const locationText = locationElement?.textContent?.trim() || null;

            const linkElement = element.querySelector('.entity-result__title-text a');
            const profileUrl = linkElement?.getAttribute('href') || null;

            const photoElement = element.querySelector('.entity-result__image img');
            const photo = photoElement?.getAttribute('src') || null;

            return {
              fullName,
              title,
              location: locationText ? {
                city: locationText.split(',')[0]?.trim() || null,
                province: locationText.split(',')[1]?.trim() || null,
                country: locationText.split(',')[2]?.trim() || null
              } : null,
              photo,
              description: null as string | null,
              url: profileUrl ? `https://www.linkedin.com${profileUrl}` : ''
            };
          } catch (error) {
            console.error('Error parsing search result:', error);
            return null;
          }
        }).filter(Boolean);
      });

      profiles.push(...searchResults.filter((profile): profile is LinkedInProfile => profile !== null));

    } catch (error) {
      console.error('Error during LinkedIn search:', error);
    } finally {
      await page.close();
    }

    return profiles;
  }

  async searchByEmail(email: string, firstName?: string, lastName?: string): Promise<LinkedInProfile[]> {
    if (!firstName || !lastName) {
      // Try to extract name from email if not provided
      const emailPrefix = email.split('@')[0];
      const nameParts = emailPrefix.split(/[._-]/);
      firstName = firstName || nameParts[0] || '';
      lastName = lastName || nameParts[1] || '';
    }

    return this.searchProfiles(firstName, lastName, email);
  }
}
