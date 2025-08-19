import type { Network, SocialProfile, Provider } from "../types";
import { LinkedInSearchScraper } from "../linkedin-scraper/search";

export class LinkedInProvider implements Provider {
  name = "linkedin";
  private scraper: LinkedInSearchScraper | null = null;

  private async initScraper() {
    if (!this.scraper) {
      this.scraper = new LinkedInSearchScraper();
      await this.scraper.setup();
    }
    return this.scraper;
  }

  async findByEmail(
    email: string, 
    options?: { firstName?: string; lastName?: string }
  ): Promise<Partial<Record<Network, SocialProfile>>> {
    try {
      const scraper = await this.initScraper();
      const profiles = await scraper.searchByEmail(email, options?.firstName, options?.lastName);

      if (profiles.length === 0) {
        return {
          linkedin: {
            network: "linkedin",
            username: null,
            url: null,
            exists: false,
            confidence: "low",
            method: "search"
          }
        };
      }

      // For now, we'll take the first result
      // You could add more sophisticated matching logic here
      const profile = profiles[0];
      
      // Extract username from URL
      const username = this.extractUsernameFromUrl(profile.url);

      return {
        linkedin: {
          network: "linkedin",
          username,
          url: profile.url,
          exists: true,
          confidence: this.calculateConfidence(profile, email, options),
          method: "search"
        }
      };

    } catch (error) {
      console.error('LinkedIn provider error:', error);
      return {
        linkedin: {
          network: "linkedin",
          username: null,
          url: null,
          exists: false,
          confidence: "low",
          method: "search"
        }
      };
    }
  }

  private extractUsernameFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/in\/([^\/\?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  private calculateConfidence(
    profile: any, 
    email: string, 
    options?: { firstName?: string; lastName?: string }
  ): "high" | "medium" | "low" {
    let score = 0;

    // Check name match
    if (options?.firstName && options?.lastName && profile.fullName) {
      const fullName = profile.fullName.toLowerCase();
      const firstName = options.firstName.toLowerCase();
      const lastName = options.lastName.toLowerCase();
      
      if (fullName.includes(firstName) && fullName.includes(lastName)) {
        score += 3;
      } else if (fullName.includes(firstName) || fullName.includes(lastName)) {
        score += 1;
      }
    }

    // Check email domain for company matching (simple heuristic)
    const emailDomain = email.split('@')[1];
    if (profile.title && emailDomain && emailDomain !== 'gmail.com' && emailDomain !== 'yahoo.com' && emailDomain !== 'hotmail.com') {
      // Very basic company matching - could be improved
      if (profile.title.toLowerCase().includes(emailDomain.split('.')[0])) {
        score += 2;
      }
    }

    if (score >= 3) return "high";
    if (score >= 1) return "medium";
    return "low";
  }

  async close() {
    if (this.scraper) {
      await this.scraper.close();
    }
  }
}
