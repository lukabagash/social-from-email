#!/usr/bin/env node
import { GoogleSearchScraper, type GoogleSearchResult } from "./google-search/scraper";
import { GeneralWebScraper, type ScrapedData } from "./web-scraper/general-scraper";
import { PersonAnalyzer, type PersonAnalysisResult, type PersonCluster } from "./person-analysis/enhanced-analyzer";
import { SiteDiscoveryEngine } from "./site-discovery/site-finder";
import { AdvancedPersonClusterer, type ClusteringResult } from "./advanced-clustering/advanced-clusterer";

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

  // Enhanced Biographical Insights (if available)
  if (result.summary && result.summary.biographicalInsights) {
    console.log(`\n🧬 BIOGRAPHICAL INSIGHTS`);
    console.log(`${'─'.repeat(80)}`);
    const bio = result.summary.biographicalInsights;
    
    if (bio.careerStage && bio.careerStage !== 'unknown') {
      console.log(`🎯 Career Stage: ${bio.careerStage}`);
    }
    if (bio.professionalSeniority && bio.professionalSeniority !== 'unknown') {
      console.log(`📊 Professional Level: ${bio.professionalSeniority}`);
    }
    if (bio.industryExpertise && bio.industryExpertise.length > 0) {
      console.log(`🏭 Industry Expertise: ${bio.industryExpertise.join(', ')}`);
    }
    if (bio.thoughtLeadership && bio.thoughtLeadership !== 'none') {
      console.log(`💭 Thought Leadership: ${bio.thoughtLeadership}`);
    }
    if (bio.keySkills && bio.keySkills.length > 0) {
      console.log(`🛠️  Key Skills: ${bio.keySkills.join(', ')}`);
    }
    if (bio.educationLevel && bio.educationLevel !== 'unknown') {
      console.log(`🎓 Education Level: ${bio.educationLevel}`);
    }
    if (bio.digitalSavviness && bio.digitalSavviness !== 'unknown') {
      console.log(`💻 Digital Savviness: ${bio.digitalSavviness}`);
    }
    if (bio.socialPresence && bio.socialPresence > 0) {
      console.log(`🌐 Social Profiles Found: ${bio.socialPresence}`);
    }
    if (bio.biographicalConfidence) {
      console.log(`📈 Biographical Confidence: ${(bio.biographicalConfidence * 100).toFixed(1)}%`);
    }
  }

  // Advanced Clustering Insights (if available)
  if (result.advancedClustering) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🤖 ADVANCED CLUSTERING INSIGHTS`);
    console.log(`${'='.repeat(80)}`);
    
    const clustering = result.advancedClustering;
    console.log(`📊 Clusters Found: ${clustering.clusterCount}`);
    console.log(`🔬 Algorithm Used: ${clustering.algorithm}`);
    console.log(`🎯 Average Confidence: ${Math.round(clustering.confidenceScores.reduce((a, b) => a + b, 0) / clustering.confidenceScores.length * 100)}%`);
    
    if (clustering.silhouetteScore !== undefined) {
      console.log(`� Silhouette Score: ${clustering.silhouetteScore.toFixed(3)}`);
    }
    
    if (clustering.outliers.length > 0) {
      console.log(`⚠️ Outliers Detected: ${clustering.outliers.length} data points`);
    }
    
    console.log(`📋 Cluster Labels: [${clustering.clusterLabels.slice(0, 10).join(', ')}${clustering.clusterLabels.length > 10 ? '...' : ''}]`);
  }
}

async function searchAndAnalyzePerson(person: PersonSearchInput, queryCount: number | undefined = undefined, detailed: boolean = false, priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first'): Promise<PersonAnalysisResult> {
  const googleScraper = new GoogleSearchScraper();
  const webScraper = new GeneralWebScraper();
  
  try {
    // Setup both scrapers
    await googleScraper.setup();
    await webScraper.setup();
    
    console.log("🚀 Scrapers initialized...\n");
    
    // Perform Google search with queryCount limit
    console.log(`🔍 Searching Google for: ${person.firstName} ${person.lastName} (${person.email})`);
    
    // Generate optimized search queries based on priority
    let allQueries: string[];
    
    if (priority === 'social-first' && queryCount && queryCount <= 15) {
      // Use prioritized queries for fast social media discovery
      allQueries = SiteDiscoveryEngine.generatePrioritizedQueries(person.firstName, person.lastName, person.email, 'social-first');
      console.log(`🎯 Using SOCIAL-FIRST optimization (${queryCount} queries)`);
    } else if (priority === 'professional' && queryCount && queryCount <= 20) {
      // Use professional-focused queries
      allQueries = SiteDiscoveryEngine.generatePrioritizedQueries(person.firstName, person.lastName, person.email, 'professional');
      console.log(`💼 Using PROFESSIONAL optimization (${queryCount} queries)`);
    } else {
      // Use comprehensive search (default for high query counts)
      allQueries = SiteDiscoveryEngine.generateSearchQueries(person.firstName, person.lastName, person.email);
      console.log(`🌐 Using COMPREHENSIVE search (all ${allQueries.length} queries)`);
    }
    
    // Limit queries if queryCount is specified
    const queriesToExecute = queryCount ? allQueries.slice(0, queryCount) : allQueries;
    
    console.log(`🎯 Generated ${allQueries.length} total queries, executing ${queriesToExecute.length}...`);
    console.log(`📋 Search Priority: ${priority.toUpperCase()}`);
    
    const allSearchResults: GoogleSearchResult[] = [];
    
    for (let i = 0; i < queriesToExecute.length; i++) {
      const query = queriesToExecute[i];
      console.log(`   ${i + 1}/${queriesToExecute.length}: ${query}`);
      
      try {
        const results = await googleScraper.searchGoogle(query, { 
          maxResults: detailed ? 5 : 3,
          includeSnippets: true 
        });
        allSearchResults.push(...results);
        
        // Add delay between searches to avoid rate limiting
        if (i < queriesToExecute.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`   ❌ Error in query ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Remove duplicates based on URL
    const searchResults = allSearchResults.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
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
    
    // Create person analyzer with enhanced clustering capabilities
    const analyzer = new PersonAnalyzer(person.firstName, person.lastName, person.email);
    
    // Perform enhanced analysis
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
    console.error("\n📋 Usage: node dist/cli-enhanced-person-analysis.js <firstName> <lastName> <email> [queryCount] [--detailed] [--priority=MODE]");
    console.error("📋 Example: node dist/cli-enhanced-person-analysis.js Jed Burdick jed@votaryfilms.com 15 --detailed --priority=social-first");
    console.error("\n📝 Description:");
    console.error("   Enhanced tool with optimized query ordering that searches Google for a person, scrapes found websites,");
    console.error("   analyzes the data using advanced clustering to identify distinct persons, and provides detailed insights.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required, must be valid format)");
    console.error("   • queryCount: Number of search queries to execute (optional, default: all generated queries)");
    console.error("   • --detailed: Enhanced search with more comprehensive analysis (optional)");
    console.error("   • --priority=MODE: Search optimization mode (optional)");
    console.error("     - social-first: Prioritize social media platforms (LinkedIn, Twitter, etc.) - DEFAULT");
    console.error("     - professional: Focus on professional/business platforms");
    console.error("     - comprehensive: Use all available search patterns");
    process.exit(1);
  }

  const firstName = cleanInput(args[0]);
  const lastName = cleanInput(args[1]);
  const email = cleanInput(args[2]);
  
  // Parse optional parameters
  let queryCount: number | undefined;
  let detailed = false;
  let priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first';
  
  // Check for queryCount, --detailed flag, and --priority flag
  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--detailed') {
      detailed = true;
    } else if (arg.startsWith('--priority=')) {
      const priorityValue = arg.split('=')[1] as 'social-first' | 'professional' | 'comprehensive';
      if (['social-first', 'professional', 'comprehensive'].includes(priorityValue)) {
        priority = priorityValue;
      } else {
        console.error(`❌ Invalid priority mode: ${priorityValue}`);
        console.error("   Valid options: social-first, professional, comprehensive");
        process.exit(1);
      }
    } else if (!isNaN(Number(arg)) && !queryCount) {
      queryCount = parseInt(arg, 10);
    }
  }

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

  console.log(`🎯 OPTIMIZED PERSON IDENTITY ANALYSIS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
  console.log(`📧 Email: ${person.email}`);
  console.log(`🔍 Mode: ${detailed ? 'Detailed Analysis' : 'Standard Analysis'}`);
  console.log(`🎲 Search Priority: ${priority.toUpperCase()}`);
  if (queryCount) {
    console.log(`🔢 Query Count: ${queryCount} (custom limit)`);
  } else {
    console.log(`🔢 Query Count: All generated queries (no limit)`);
  }
  console.log(`🚀 Optimization: ${priority === 'social-first' ? 'Social Media First 🔗' : priority === 'professional' ? 'Professional Focus 💼' : 'Comprehensive Search 🌐'}`);
  console.log(`⚠️  Note: LinkedIn pages will be excluded from scraping as requested`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();
    const result = await searchAndAnalyzePerson(person, queryCount, detailed, priority);
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
