#!/usr/bin/env node
import { GoogleSearchScraper, type GoogleSearchResult } from "./google-search/scraper";
import { GeneralWebScraper, type ScrapedData } from "./web-scraper/general-scraper";

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
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function cleanInput(input: string): string {
  return input.trim().replace(/['"]/g, '');
}

function printScrapedDataSummary(data: ScrapedData) {
  console.log(`\n📄 ${data.title || 'Untitled Page'}`);
  console.log(`🌐 ${data.url}`);
  console.log(`🏷️  Domain: ${data.domain}`);
  console.log(`⏱️  Load Time: ${data.performance.loadTime}ms`);
  
  if (data.metadata.description) {
    console.log(`📝 Description: ${data.metadata.description.substring(0, 150)}${data.metadata.description.length > 150 ? '...' : ''}`);
  }
  
  // Headings summary
  const totalHeadings = data.content.headings.h1.length + data.content.headings.h2.length + data.content.headings.h3.length;
  if (totalHeadings > 0) {
    console.log(`📋 Content Structure:`);
    if (data.content.headings.h1.length > 0) {
      console.log(`   H1 (${data.content.headings.h1.length}): ${data.content.headings.h1.slice(0, 3).join(', ')}${data.content.headings.h1.length > 3 ? '...' : ''}`);
    }
    if (data.content.headings.h2.length > 0) {
      console.log(`   H2 (${data.content.headings.h2.length}): ${data.content.headings.h2.slice(0, 3).join(', ')}${data.content.headings.h2.length > 3 ? '...' : ''}`);
    }
  }
  
  // Content summary
  console.log(`📊 Content Stats:`);
  console.log(`   Paragraphs: ${data.content.paragraphs.length}`);
  console.log(`   Links: ${data.content.links.length} (${data.content.links.filter(l => l.isExternal).length} external)`);
  console.log(`   Images: ${data.content.images.length}`);
  
  // Contact information
  const { contactInfo } = data.content;
  if (contactInfo.emails.length > 0 || contactInfo.phones.length > 0 || contactInfo.socialLinks.length > 0) {
    console.log(`📞 Contact Information Found:`);
    if (contactInfo.emails.length > 0) {
      console.log(`   📧 Emails (${contactInfo.emails.length}): ${contactInfo.emails.slice(0, 3).join(', ')}${contactInfo.emails.length > 3 ? '...' : ''}`);
    }
    if (contactInfo.phones.length > 0) {
      console.log(`   📱 Phones (${contactInfo.phones.length}): ${contactInfo.phones.slice(0, 3).join(', ')}${contactInfo.phones.length > 3 ? '...' : ''}`);
    }
    if (contactInfo.socialLinks.length > 0) {
      console.log(`   🔗 Social Links (${contactInfo.socialLinks.length}):`);
      contactInfo.socialLinks.slice(0, 5).forEach(link => {
        console.log(`      ${link.platform}: ${link.url}`);
      });
      if (contactInfo.socialLinks.length > 5) {
        console.log(`      ... and ${contactInfo.socialLinks.length - 5} more`);
      }
    }
  }
  
  // Page structure
  console.log(`🏗️  Page Structure:`);
  console.log(`   Navigation: ${data.structure.hasNav ? '✅' : '❌'}`);
  console.log(`   Header: ${data.structure.hasHeader ? '✅' : '❌'}`);
  console.log(`   Footer: ${data.structure.hasFooter ? '✅' : '❌'}`);
  console.log(`   Articles: ${data.structure.articleCount}`);
  console.log(`   Forms: ${data.structure.formCount}`);
}

function printDetailedScrapedData(data: ScrapedData) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 DETAILED ANALYSIS: ${data.title || 'Untitled Page'}`);
  console.log(`${'='.repeat(80)}`);
  
  printScrapedDataSummary(data);
  
  // Sample content
  if (data.content.paragraphs.length > 0) {
    console.log(`\n📝 Content Preview:`);
    data.content.paragraphs.slice(0, 3).forEach((paragraph, index) => {
      console.log(`   ${index + 1}. ${paragraph.substring(0, 200)}${paragraph.length > 200 ? '...' : ''}`);
    });
  }
  
  // External links
  const externalLinks = data.content.links.filter(l => l.isExternal).slice(0, 10);
  if (externalLinks.length > 0) {
    console.log(`\n🔗 External Links (showing first ${Math.min(10, externalLinks.length)}):`);
    externalLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. ${link.text} → ${link.url}`);
    });
  }
  
  // Metadata
  console.log(`\n🏷️  Metadata:`);
  Object.entries(data.metadata).forEach(([key, value]) => {
    if (value) {
      console.log(`   ${key}: ${value}`);
    }
  });
}

async function searchAndScrape(person: PersonSearchInput, detailed: boolean = false): Promise<SearchAndScrapeResult> {
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
        maxResults: detailed ? 10 : 5,
        includeSnippets: true
      }
    );
    
    if (searchResults.length === 0) {
      console.log("❌ No search results found");
      return {
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
        }
      };
    }
    
    console.log(`✅ Found ${searchResults.length} search results`);
    console.log(`\n📊 Search Results:`);
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   🌐 ${result.url}`);
      console.log(`   🏷️  Domain: ${result.domain}`);
      if (result.snippet) {
        console.log(`   📝 ${result.snippet}`);
      }
      console.log();
    });
    
    // Extract URLs for scraping
    const urlsToScrape = searchResults.map(result => result.url);
    
    console.log(`\n🕷️  Starting web scraping of ${urlsToScrape.length} websites...`);
    console.log(`${'='.repeat(80)}`);
    
    // Scrape all websites
    const scrapedData = await webScraper.scrapeMultipleWebsites(urlsToScrape, {
      timeout: 15000,
      extractImages: false, // Skip images for faster scraping
      extractLinks: true,
      maxContentLength: 5000
    });
    
    console.log(`\n✅ Scraping completed!`);
    console.log(`${'='.repeat(80)}`);
    
    // Display scraped data
    if (detailed) {
      scrapedData.forEach(data => printDetailedScrapedData(data));
    } else {
      scrapedData.forEach(data => printScrapedDataSummary(data));
    }
    
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
    
    const summary = {
      totalSearchResults: searchResults.length,
      successfulScrapes: scrapedData.length,
      failedScrapes: searchResults.length - scrapedData.length,
      topDomains,
      contactsFound: {
        totalEmails,
        totalPhones,
        totalSocialLinks
      }
    };
    
    // Print final summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📈 FINAL SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`🔍 Search Results: ${summary.totalSearchResults}`);
    console.log(`✅ Successfully Scraped: ${summary.successfulScrapes}`);
    console.log(`❌ Failed to Scrape: ${summary.failedScrapes}`);
    console.log(`\n📊 Top Domains:`);
    summary.topDomains.forEach((domain, index) => {
      console.log(`   ${index + 1}. ${domain.domain}: ${domain.count} page(s)`);
    });
    console.log(`\n📞 Contact Information Found:`);
    console.log(`   📧 Total Emails: ${summary.contactsFound.totalEmails}`);
    console.log(`   📱 Total Phones: ${summary.contactsFound.totalPhones}`);
    console.log(`   🔗 Total Social Links: ${summary.contactsFound.totalSocialLinks}`);
    
    // Show unique emails and social platforms
    const allEmails = [...new Set(scrapedData.flatMap(data => data.content.contactInfo.emails))];
    const allSocialPlatforms = [...new Set(scrapedData.flatMap(data => data.content.contactInfo.socialLinks.map(link => link.platform)))];
    
    if (allEmails.length > 0) {
      console.log(`\n📧 Unique Emails Found: ${allEmails.join(', ')}`);
    }
    if (allSocialPlatforms.length > 0) {
      console.log(`🔗 Social Platforms Found: ${allSocialPlatforms.join(', ')}`);
    }
    
    return {
      searchResults,
      scrapedData,
      summary
    };
    
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
    console.error("\n📋 Usage: node dist/cli-search-and-scrape.js <firstName> <lastName> <email> [--detailed]");
    console.error("📋 Example: node dist/cli-search-and-scrape.js John Doe john.doe@example.com --detailed");
    console.error("\n📝 Description:");
    console.error("   This tool searches Google for a person and scrapes structured data from all found websites.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required, must be valid format)");
    console.error("   • --detailed: Show detailed analysis of each website (optional)");
    process.exit(1);
  }

  const firstName = cleanInput(args[0]);
  const lastName = cleanInput(args[1]);
  const email = cleanInput(args[2]);
  const detailed = args.includes('--detailed');

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

  console.log(`🎯 PERSON SEARCH & WEB SCRAPING`);
  console.log(`${'='.repeat(80)}`);
  console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
  console.log(`📧 Email: ${person.email}`);
  console.log(`🔍 Mode: ${detailed ? 'Detailed Analysis' : 'Summary View'}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();
    const result = await searchAndScrape(person, detailed);
    const totalTime = Date.now() - startTime;
    
    console.log(`\n⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`🔚 Search and scraping completed successfully!`);
    
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
