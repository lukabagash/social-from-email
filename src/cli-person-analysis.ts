#!/usr/bin/env node
import { GoogleSearchScraper, type GoogleSearchResult } from "./google-search/scraper";
import { GeneralWebScraper, type ScrapedData } from "./web-scraper/general-scraper";
import { PersonAnalyzer, type PersonAnalysisResult, type PersonCluster } from "./person-analysis/enhanced-analyzer";

interface PersonSearchInput {
  firstName: string;
  lastName: string;
  email: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function cleanInput(input: string): string {
  return input.trim().replace(/['"]/g, '');
}

function printPersonCluster(cluster: PersonCluster, index: number) {
  const confidenceColor = cluster.confidence > 70 ? '🟢' : cluster.confidence > 40 ? '🟡' : '🔴';
  
  console.log(`\n${confidenceColor} PERSON ${index + 1} - Confidence: ${cluster.confidence}%`);
  console.log(`${'─'.repeat(60)}`);
  
  // Basic Information
  console.log(`👤 Identity Information:`);
  if (cluster.personEvidence.name) {
    console.log(`   Name: ${cluster.personEvidence.name}`);
  }
  if (cluster.personEvidence.email) {
    console.log(`   Email: ${cluster.personEvidence.email}`);
  }
  if (cluster.personEvidence.title) {
    console.log(`   Title: ${cluster.personEvidence.title}`);
  }
  if (cluster.personEvidence.company) {
    console.log(`   Company: ${cluster.personEvidence.company}`);
  }
  if (cluster.personEvidence.location) {
    console.log(`   Location: ${cluster.personEvidence.location}`);
  }
  if (cluster.personEvidence.phone) {
    console.log(`   Phone: ${cluster.personEvidence.phone}`);
  }
  
  // Social Profiles
  if (cluster.personEvidence.socialProfiles && cluster.personEvidence.socialProfiles.length > 0) {
    console.log(`\n🔗 Social Profiles:`);
    cluster.personEvidence.socialProfiles.forEach(social => {
      console.log(`   ${social.platform}: ${social.url}${social.username ? ` (@${social.username})` : ''}`);
    });
  }
  
  // Additional Information
  if (cluster.personEvidence.skills && cluster.personEvidence.skills.length > 0) {
    console.log(`\n💼 Skills/Expertise: ${cluster.personEvidence.skills.slice(0, 5).join(', ')}${cluster.personEvidence.skills.length > 5 ? '...' : ''}`);
  }
  
  if (cluster.personEvidence.education && cluster.personEvidence.education.length > 0) {
    console.log(`🎓 Education Keywords: ${cluster.personEvidence.education.join(', ')}`);
  }
  
  // Name Variations
  if (cluster.potentialVariations.length > 1) {
    console.log(`\n📝 Name Variations Found: ${cluster.potentialVariations.join(', ')}`);
  }
  
  // Sources
  console.log(`\n📊 Supporting Sources (${cluster.sources.length}):`);
  cluster.sources.forEach((source, idx) => {
    const relevanceIndicator = source.relevanceScore > 70 ? '🔥' : source.relevanceScore > 40 ? '⭐' : '📄';
    console.log(`   ${idx + 1}. ${relevanceIndicator} ${source.title}`);
    console.log(`      🌐 ${source.url}`);
    console.log(`      🏷️  Domain: ${source.domain} (Relevance: ${source.relevanceScore}%)`);
    
    if (source.snippet && source.snippet.length > 0) {
      const snippet = source.snippet.length > 150 ? source.snippet.substring(0, 150) + '...' : source.snippet;
      console.log(`      📝 "${snippet}"`);
    }
    
    if (source.evidenceContributed.length > 0) {
      console.log(`      📋 Evidence: ${source.evidenceContributed.join(', ')}`);
    }
    console.log();
  });
}

function printAnalysisResult(result: PersonAnalysisResult) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 PERSON ANALYSIS RESULTS`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`📊 Summary:`);
  console.log(`   Total Sources Analyzed: ${result.summary.totalSources}`);
  console.log(`   Persons Identified: ${result.identifiedPersons.length}`);
  console.log(`   🟢 High Confidence (>70%): ${result.summary.highConfidencePersons}`);
  console.log(`   🟡 Medium Confidence (40-70%): ${result.summary.mediumConfidencePersons}`);
  console.log(`   🔴 Low Confidence (<40%): ${result.summary.lowConfidencePersons}`);
  
  if (result.summary.topDomains.length > 0) {
    console.log(`\n🌐 Top Source Domains:`);
    result.summary.topDomains.forEach((domain, idx) => {
      console.log(`   ${idx + 1}. ${domain.domain}: ${domain.count} sources`);
    });
  }
  
  // Print each identified person
  result.identifiedPersons.forEach((person, index) => {
    printPersonCluster(person, index);
  });
  
  // Analysis insights
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧠 ANALYSIS INSIGHTS`);
  console.log(`${'='.repeat(80)}`);
  
  const analysis = result.analysis;
  
  console.log(`🎯 Likely Same Person: ${analysis.likelyIsSamePerson ? 'YES' : 'NO'}`);
  console.log(`📈 Main Identity Confidence: ${analysis.mainPersonConfidence}%`);
  
  if (analysis.reasonsForMultiplePeople.length > 0) {
    console.log(`\n⚠️  Reasons for Multiple People Detected:`);
    analysis.reasonsForMultiplePeople.forEach((reason, idx) => {
      console.log(`   ${idx + 1}. ${reason}`);
    });
  }
  
  if (analysis.recommendedActions.length > 0) {
    console.log(`\n💡 Recommendations:`);
    analysis.recommendedActions.forEach((action, idx) => {
      console.log(`   ${idx + 1}. ${action}`);
    });
  }
}

async function searchAndAnalyzePerson(person: PersonSearchInput, detailed: boolean = false): Promise<PersonAnalysisResult> {
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
        maxResults: detailed ? 10 : 7,
        includeSnippets: true
      }
    );
    
    if (searchResults.length === 0) {
      console.log("❌ No search results found");
      throw new Error("No search results found");
    }
    
    console.log(`✅ Found ${searchResults.length} search results`);
    
    // Show search results with snippets
    console.log(`\n📊 Search Results with Descriptions:`);
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   🌐 ${result.url}`);
      console.log(`   🏷️  Domain: ${result.domain}`);
      if (result.snippet && result.snippet.trim().length > 0) {
        console.log(`   📝 "${result.snippet}"`);
      }
      console.log();
    });
    
    // Filter out LinkedIn URLs for scraping (as requested)
    const urlsToScrape = searchResults
      .filter(result => !result.domain.includes('linkedin.com'))
      .map(result => result.url);
    
    console.log(`\n🕷️  Starting web scraping of ${urlsToScrape.length} websites (excluding LinkedIn)...`);
    console.log(`${'='.repeat(80)}`);
    
    // Scrape all websites (excluding LinkedIn)
    const scrapedData = await webScraper.scrapeMultipleWebsites(urlsToScrape, {
      timeout: 15000,
      extractImages: false, // Skip images for faster scraping
      extractLinks: true,
      maxContentLength: 5000
    });
    
    console.log(`✅ Scraping completed! Successfully scraped ${scrapedData.length}/${urlsToScrape.length} websites.`);
    
    // Create person analyzer and analyze
    const analyzer = new PersonAnalyzer(person.firstName, person.lastName, person.email);
    const analysisResult = analyzer.analyzePersons(searchResults, scrapedData);
    
    return analysisResult;
    
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
    console.error("\n📋 Usage: node dist/cli-person-analysis.js <firstName> <lastName> <email> [--detailed]");
    console.error("📋 Example: node dist/cli-person-analysis.js Jed Burdick jed@votaryfilms.com --detailed");
    console.error("\n📝 Description:");
    console.error("   This tool searches Google for a person, scrapes all found websites (excluding LinkedIn),");
    console.error("   analyzes the data to identify distinct persons, and provides confidence scores.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required, must be valid format)");
    console.error("   • --detailed: Search more results and show detailed analysis (optional)");
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
    console.error("   Example: jed@votaryfilms.com");
    process.exit(1);
  }

  const person: PersonSearchInput = {
    firstName,
    lastName,
    email
  };

  console.log(`🎯 PERSON IDENTITY ANALYSIS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
  console.log(`📧 Email: ${person.email}`);
  console.log(`🔍 Mode: ${detailed ? 'Detailed Analysis' : 'Standard Analysis'}`);
  console.log(`⚠️  Note: LinkedIn pages will be excluded from scraping as requested`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();
    const result = await searchAndAnalyzePerson(person, detailed);
    const totalTime = Date.now() - startTime;
    
    // Print comprehensive analysis
    printAnalysisResult(result);
    
    console.log(`\n⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`🔚 Person analysis completed successfully!`);
    
  } catch (error) {
    console.error("\n❌ Error during person analysis:", error);
    process.exit(1);
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
