#!/usr/bin/env node
import { GoogleSearchScraper, type GoogleSearchResult } from "./google-search/scraper";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("❌ Error: All three fields are required!");
    console.error("\n📋 Usage: node dist/cli-search.js <firstName> <lastName> <email> [--detailed]");
    console.error("📋 Example: node dist/cli-search.js John Doe john.doe@example.com --detailed");
    console.error("\n📝 Description:");
    console.error("   This tool performs Google searches for a person using their name and email.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required)");
    console.error("   • --detailed: Use multiple search variations for more comprehensive results");
    process.exit(1);
  }

  const firstName = args[0].trim();
  const lastName = args[1].trim();
  const email = args[2].trim();
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

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error("❌ Error: Please provide a valid email address");
    console.error("   Example: john.doe@example.com");
    process.exit(1);
  }

  console.log(`🔍 Google Search for: ${firstName} ${lastName} (${email})`);
  console.log("=".repeat(80));

  const scraper = new GoogleSearchScraper();
  
  try {
    await scraper.setup();
    console.log("🚀 Google scraper initialized...\n");
    
    let results: GoogleSearchResult[];
    
    if (detailed) {
      results = await scraper.searchPersonWithVariations(firstName, lastName, email, {
        maxResults: 5,
        includeSnippets: true
      });
    } else {
      results = await scraper.searchPerson(firstName, lastName, email, {
        maxResults: 10,
        includeSnippets: true
      });
    }
    
    if (results.length === 0) {
      console.log("❌ No search results found");
    } else {
      console.log(`✅ Found ${results.length} search result(s):\n`);
      
      results.forEach((result: GoogleSearchResult, index: number) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   🌐 ${result.url}`);
        console.log(`   🏷️  Domain: ${result.domain}`);
        if (result.snippet) {
          console.log(`   📝 ${result.snippet}`);
        }
        console.log();
      });

      // Group by domain for summary
      const domainGroups = results.reduce((groups: Record<string, number>, result) => {
        groups[result.domain] = (groups[result.domain] || 0) + 1;
        return groups;
      }, {});

      console.log("📊 Results by domain:");
      Object.entries(domainGroups)
        .sort(([,a], [,b]) => b - a)
        .forEach(([domain, count]) => {
          console.log(`   ${domain}: ${count} result(s)`);
        });
    }
    
  } catch (error) {
    console.error("❌ Error during search:", error);
    process.exit(1);
  } finally {
    await scraper.close();
    console.log("\n🔚 Search completed and browser closed");
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
