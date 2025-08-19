#!/usr/bin/env node
import { LinkedInSearchScraper, type LinkedInProfile } from "./linkedin-scraper/search";
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("Usage: node dist/cli-linkedin.js <email> <firstName> <lastName>");
    console.error("Example: node dist/cli-linkedin.js bagash_l2@denison.edu Luka Bagashvili");
    process.exit(1);
  }

  const [email, firstName, lastName] = args;

  console.log(`🔍 Searching LinkedIn for: ${firstName} ${lastName} (${email})`);
  console.log("=".repeat(60));

  const scraper = new LinkedInSearchScraper();
  
  try {
    await scraper.setup();
    console.log("📡 LinkedIn scraper initialized...");
    
    const profiles = await scraper.searchByEmail(email, firstName, lastName);
    
    if (profiles.length === 0) {
      console.log("❌ No LinkedIn profiles found matching the criteria");
    } else {
      console.log(`✅ Found ${profiles.length} potential LinkedIn profile(s):\n`);
      
      profiles.forEach((profile: LinkedInProfile, index: number) => {
        console.log(`${index + 1}. ${profile.fullName || 'Unknown Name'}`);
        console.log(`   Title: ${profile.title || 'No title available'}`);
        console.log(`   Location: ${profile.location ? 
          [profile.location.city, profile.location.province, profile.location.country]
            .filter(Boolean).join(', ') : 'No location available'}`);
        console.log(`   LinkedIn URL: ${profile.url}`);
        console.log(`   Photo: ${profile.photo || 'No photo available'}`);
        console.log();
      });
    }
    
  } catch (error) {
    console.error("❌ Error during LinkedIn search:", error);
    process.exit(1);
  } finally {
    await scraper.close();
    console.log("🔚 Search completed and browser closed");
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
