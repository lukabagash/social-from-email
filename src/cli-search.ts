#!/usr/bin/env node
import { GoogleSearchScraper, type GoogleSearchResult } from "./google-search/scraper";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("Usage: node dist/cli-search.js <firstName> <lastName> [email] [--detailed]");
    console.error("Example: node dist/cli-search.js Luka Bagashvili bagash_l2@denison.edu --detailed");
    process.exit(1);
  }

  const firstName = args[0];
  const lastName = args[1];
  const email = args[2] && !args[2].startsWith('--') ? args[2] : undefined;
  const detailed = args.includes('--detailed');

  console.log(`🔍 Google Search for: ${firstName} ${lastName}${email ? ` (${email})` : ''}`);
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
