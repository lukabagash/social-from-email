#!/usr/bin/env node
import { GoogleSearchScraper, type GoogleSearchResult } from "./google-search/scraper";
import { GeneralWebScraper, type ScrapedData } from "./web-scraper/general-scraper";
import * as fs from 'fs';
import * as path from 'path';

interface PersonSearchInput {
  firstName: string;
  lastName: string;
  email: string;
}

interface SearchAndScrapeResult {
  searchResults: GoogleSearchResult[];
  scrapedData: ScrapedData[];
  summary: {
    totalSearchResults: number;
    successfulScrapes: number;
    failedScrapes: number;
    topDomains: Array<{ domain: string; count: number }>;
    contactsFound: {
      totalEmails: number;
      totalPhones: number;
      totalSocialLinks: number;
    };
  };
  exportedAt: string;
  person: PersonSearchInput;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function cleanInput(input: string): string {
  return input.trim().replace(/['"]/g, '');
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function searchAndScrapeToJson(person: PersonSearchInput, outputDir: string = './exports'): Promise<SearchAndScrapeResult> {
  const googleScraper = new GoogleSearchScraper();
  const webScraper = new GeneralWebScraper();
  
  try {
    // Setup both scrapers
    await googleScraper.setup();
    await webScraper.setup();
    
    console.log("🚀 Scrapers initialized...\n");
    
    // Perform Google search
    console.log(`🔍 Searching Google for: ${person.firstName} ${person.lastName} (${person.email})`);
    
    const searchResults = await googleScraper.searchPersonWithVariations(
      person.firstName, 
      person.lastName, 
      person.email, 
      {
        maxResults: 10,
        includeSnippets: true
      }
    );
    
    if (searchResults.length === 0) {
      console.log("❌ No search results found");
      const result: SearchAndScrapeResult = {
        searchResults: [],
        scrapedData: [],
        summary: {
          totalSearchResults: 0,
          successfulScrapes: 0,
          failedScrapes: 0,
          topDomains: [],
          contactsFound: {
            totalEmails: 0,
            totalPhones: 0,
            totalSocialLinks: 0
          }
        },
        exportedAt: new Date().toISOString(),
        person
      };
      return result;
    }
    
    console.log(`✅ Found ${searchResults.length} search results`);
    
    // Extract URLs for scraping
    const urlsToScrape = searchResults.map(result => result.url);
    
    console.log(`\n🕷️  Starting web scraping of ${urlsToScrape.length} websites...`);
    
    // Scrape all websites
    const scrapedData = await webScraper.scrapeMultipleWebsites(urlsToScrape, {
      timeout: 15000,
      extractImages: false,
      extractLinks: true,
      maxContentLength: 5000
    });
    
    console.log(`✅ Scraping completed!`);
    
    // Generate summary
    const domainCounts = scrapedData.reduce((acc, data) => {
      acc[data.domain] = (acc[data.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));
    
    const totalEmails = scrapedData.reduce((sum, data) => sum + data.content.contactInfo.emails.length, 0);
    const totalPhones = scrapedData.reduce((sum, data) => sum + data.content.contactInfo.phones.length, 0);
    const totalSocialLinks = scrapedData.reduce((sum, data) => sum + data.content.contactInfo.socialLinks.length, 0);
    
    const result: SearchAndScrapeResult = {
      searchResults,
      scrapedData,
      summary: {
        totalSearchResults: searchResults.length,
        successfulScrapes: scrapedData.length,
        failedScrapes: searchResults.length - scrapedData.length,
        topDomains,
        contactsFound: {
          totalEmails,
          totalPhones,
          totalSocialLinks
        }
      },
      exportedAt: new Date().toISOString(),
      person
    };
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${sanitizeFileName(person.firstName)}_${sanitizeFileName(person.lastName)}_${timestamp}.json`;
    const filePath = path.join(outputDir, fileName);
    
    // Save to JSON file
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    
    console.log(`\n💾 Data exported to: ${filePath}`);
    
    // Print summary
    console.log(`\n📈 SUMMARY:`);
    console.log(`🔍 Search Results: ${result.summary.totalSearchResults}`);
    console.log(`✅ Successfully Scraped: ${result.summary.successfulScrapes}`);
    console.log(`❌ Failed to Scrape: ${result.summary.failedScrapes}`);
    console.log(`📧 Total Emails: ${result.summary.contactsFound.totalEmails}`);
    console.log(`📱 Total Phones: ${result.summary.contactsFound.totalPhones}`);
    console.log(`🔗 Total Social Links: ${result.summary.contactsFound.totalSocialLinks}`);
    
    return result;
    
  } finally {
    await googleScraper.close();
    await webScraper.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Require all three parameters
  if (args.length < 3) {
    console.error("❌ Error: All three fields are required!");
    console.error("\n📋 Usage: node dist/cli-export-json.js <firstName> <lastName> <email> [outputDir]");
    console.error("📋 Example: node dist/cli-export-json.js John Doe john.doe@example.com ./exports");
    console.error("\n📝 Description:");
    console.error("   This tool searches Google for a person, scrapes all found websites, and exports");
    console.error("   the complete structured data as a JSON file for further analysis.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required, must be valid format)");
    console.error("   • outputDir: Directory to save JSON files (optional, defaults to ./exports)");
    process.exit(1);
  }

  const firstName = cleanInput(args[0]);
  const lastName = cleanInput(args[1]);
  const email = cleanInput(args[2]);
  const outputDir = args[3] || './exports';

  // Validate inputs
  if (!firstName || firstName.length < 2) {
    console.error("❌ Error: First name must be at least 2 characters long");
    process.exit(1);
  }

  if (!lastName || lastName.length < 2) {
    console.error("❌ Error: Last name must be at least 2 characters long");
    process.exit(1);
  }

  if (!validateEmail(email)) {
    console.error("❌ Error: Please provide a valid email address");
    console.error("   Example: john.doe@example.com");
    process.exit(1);
  }

  const person: PersonSearchInput = {
    firstName,
    lastName,
    email
  };

  console.log(`🎯 PERSON SEARCH & DATA EXPORT`);
  console.log(`${'='.repeat(80)}`);
  console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
  console.log(`📧 Email: ${person.email}`);
  console.log(`📁 Output Directory: ${outputDir}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();
    const result = await searchAndScrapeToJson(person, outputDir);
    const totalTime = Date.now() - startTime;
    
    console.log(`\n⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`🔚 Search, scraping, and export completed successfully!`);
    
  } catch (error) {
    console.error("\n❌ Error during search and scraping:", error);
    process.exit(1);
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
