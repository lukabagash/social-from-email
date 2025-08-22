#!/usr/bin/env node
import { UltimateCrawlerEngine, type GoogleSearchResult } from "./hybrid-search/ultimate-scraper";
import { EnhancedCrawleeEngine, type CrawleeScrapedData } from "./crawlee/enhanced-crawler";
import { PersonAnalyzer, type PersonAnalysisResult, type PersonCluster } from "./person-analysis/enhanced-analyzer";
import { SiteDiscoveryEngine } from "./site-discovery/site-finder";
import { type ScrapedData } from "./web-scraper/general-scraper";

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
  
  // Sources with Crawlee enhancements
  console.log(`\n📊 Supporting Sources (${cluster.sources.length}):`);
  cluster.sources.forEach((source, idx) => {
    const relevanceIndicator = source.relevanceScore > 70 ? '🔥' : source.relevanceScore > 40 ? '⭐' : '📄';
    console.log(`   ${idx + 1}. ${relevanceIndicator} ${source.title}`);
    console.log(`      🌐 ${source.url}`);
    console.log(`      🏷️  Domain: ${source.domain} (Relevance: ${source.relevanceScore}%)`);
    console.log(`      🤖 Enhanced with: Hybrid Ultimate Crawler + Crawlee Scraping`);
    
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
  console.log(`🔍 HYBRID ULTIMATE CRAWLER + CRAWLEE ANALYSIS RESULTS`);
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

function printCrawleeScrapingStats(scrapedData: CrawleeScrapedData[]) {
  console.log(`\n🕷️ CRAWLEE SCRAPING ENHANCEMENT STATISTICS:`);
  console.log(`${'─'.repeat(60)}`);
  
  // Group by crawler type
  const byCrawler = scrapedData.reduce((acc, data) => {
    if (!acc[data.technical.crawlerUsed]) acc[data.technical.crawlerUsed] = [];
    acc[data.technical.crawlerUsed].push(data);
    return acc;
  }, {} as Record<string, CrawleeScrapedData[]>);
  
  Object.entries(byCrawler).forEach(([crawler, crawlerData]) => {
    console.log(`   🤖 ${crawler.toUpperCase()}: ${crawlerData.length} websites`);
  });
  
  // Summary statistics
  const totalSocialLinks = scrapedData.reduce((sum, data) => sum + data.content.socialLinks.length, 0);
  const totalEmails = scrapedData.reduce((sum, data) => sum + data.content.contactInfo.emails.length, 0);
  const avgRelevance = scrapedData.reduce((sum, data) => sum + data.quality.relevanceScore, 0) / scrapedData.length;
  const avgLoadTime = scrapedData.reduce((sum, data) => sum + data.technical.loadTime, 0) / scrapedData.length;
  
  console.log(`   🔗 Social Links Discovered: ${totalSocialLinks}`);
  console.log(`   📧 Email Addresses Found: ${totalEmails}`);
  console.log(`   🎯 Average Relevance: ${avgRelevance.toFixed(1)}%`);
  console.log(`   ⚡ Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
  console.log(`   ✨ Crawlee Advantages: Retry logic, session management, resource blocking`);
}

async function searchAndAnalyzePersonHybrid(
  person: PersonSearchInput, 
  queryCount?: number, 
  detailed: boolean = false, 
  priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first',
  useAdvancedClustering: boolean = false
): Promise<PersonAnalysisResult> {  // Use the proven Ultimate Crawler for search
  const ultimateScraper = new UltimateCrawlerEngine();
  
  // Use Crawlee for enhanced scraping
  const crawleeEngine = new EnhancedCrawleeEngine({
    maxConcurrency: 3,
    requestHandlerTimeoutSecs: 20,
    maxRequestRetries: 2,
    useSessionPool: true,
    persistCookiesPerSession: true,
    rotateUserAgents: true,
    enableJavaScript: true,
    waitForNetworkIdle: true,
    blockResources: ['font', 'texttrack', 'object', 'beacon'],
    enableProxy: false,
    respectRobotsTxt: true
  });
  
  try {
    // Initialize both engines
    await ultimateScraper.initialize({
      useMultipleBrowsers: true,
      rotateUserAgents: true,
      enableStealth: true,
      parallelSessions: Math.min(3, queryCount || 3),
      fallbackEngine: true
    });
    await crawleeEngine.initialize();
    
    console.log("🚀 Hybrid Ultimate Crawler + Crawlee Engine initialized...\n");
    
    // Generate search queries (using the proven approach)
    let allQueries: string[];
    
    if (priority === 'social-first' && queryCount && queryCount <= 15) {
      allQueries = SiteDiscoveryEngine.generatePrioritizedQueries(person.firstName, person.lastName, person.email, 'social-first');
      console.log(`🎯 Using SOCIAL-FIRST optimization (${queryCount} queries)`);
    } else if (priority === 'professional' && queryCount && queryCount <= 20) {
      allQueries = SiteDiscoveryEngine.generatePrioritizedQueries(person.firstName, person.lastName, person.email, 'professional');
      console.log(`💼 Using PROFESSIONAL optimization (${queryCount} queries)`);
    } else {
      allQueries = SiteDiscoveryEngine.generateSearchQueries(person.firstName, person.lastName, person.email);
      console.log(`🌐 Using COMPREHENSIVE search (all ${allQueries.length} queries)`);
    }
    
    // Limit queries if queryCount is specified
    const queriesToExecute = queryCount ? allQueries.slice(0, queryCount) : allQueries;
    
    console.log(`🎯 Generated ${allQueries.length} total queries, executing ${queriesToExecute.length}...`);
    console.log(`📋 Search Priority: ${priority.toUpperCase()}`);
    console.log(`🤖 Using HYBRID: Ultimate Crawler (Search) + Crawlee (Scraping)`);
    
    // Use Ultimate Crawler for search (proven to work)
    console.log(`\n🔍 Searching with Ultimate Crawler for: ${person.firstName} ${person.lastName} (${person.email})`);
    
    const allSearchResults = await ultimateScraper.searchWithCustomQueries(
      queriesToExecute,
      { 
        maxResults: detailed ? 5 : 3,
        includeSnippets: true,
        multiEngineMode: true,
        parallelSessions: Math.min(2, Math.ceil(queriesToExecute.length / 4)),
        useMultipleBrowsers: true,
        rotateUserAgents: true,
        enableStealth: true,
        fallbackEngine: true
      }
    );

    // Remove duplicates based on URL
    const uniqueSearchResults = allSearchResults.filter((result: GoogleSearchResult, index: number, self: GoogleSearchResult[]) => 
      index === self.findIndex((r: GoogleSearchResult) => r.url === result.url)
    );
    
    if (uniqueSearchResults.length === 0) {
      console.log("❌ No search results found");
      throw new Error("No search results found");
    }
    
    console.log(`✅ Found ${uniqueSearchResults.length} unique search results`);
    
    // Show search results
    console.log(`\n📊 Search Results from Ultimate Crawler:`);
    uniqueSearchResults.forEach((result, index) => {
      const engineInfo = result.scrapeMethod && result.browserEngine 
        ? ` [${result.scrapeMethod}/${result.browserEngine}]` 
        : '';
      console.log(`${index + 1}. ${result.title}${engineInfo}`);
      console.log(`   🌐 ${result.url}`);
      console.log(`   🏷️  Domain: ${result.domain}`);
      if (result.snippet && result.snippet.trim().length > 0) {
        console.log(`   📝 "${result.snippet}"`);
      }
      console.log();
    });
    
    // Use all URLs for Crawlee-enhanced scraping (including LinkedIn)
    const urlsToScrape = uniqueSearchResults
      .map(result => result.url);
    
    console.log(`\n🕷️  Starting Crawlee-enhanced scraping of ${urlsToScrape.length} websites...`);
    console.log(`${'='.repeat(80)}`);
    
    // Use Crawlee for enhanced scraping
    const crawleeScrapedData = await crawleeEngine.scrapeUrls(urlsToScrape);
    
    console.log(`✅ Crawlee scraping completed! Successfully scraped ${crawleeScrapedData.length}/${urlsToScrape.length} websites.`);
    
    // Print Crawlee scraping statistics
    if (crawleeScrapedData.length > 0) {
      printCrawleeScrapingStats(crawleeScrapedData);
    }
    
    // Convert Crawlee data to standard format for compatibility with PersonAnalyzer
    const scrapedData: ScrapedData[] = crawleeScrapedData.map(crawlee => ({
      url: crawlee.url,
      title: crawlee.title,
      domain: crawlee.domain,
      metadata: {
        description: crawlee.metadata.description,
        keywords: crawlee.metadata.keywords?.join(', '),
        author: crawlee.metadata.author,
        ogTitle: crawlee.metadata.ogTitle,
        ogDescription: crawlee.metadata.ogDescription,
        ogImage: crawlee.metadata.ogImage,
        twitterTitle: crawlee.metadata.twitterTitle,
        twitterDescription: crawlee.metadata.twitterDescription,
        twitterImage: crawlee.metadata.twitterImage,
      },
      content: {
        headings: {
          h1: crawlee.content.headings.h1,
          h2: crawlee.content.headings.h2,
          h3: crawlee.content.headings.h3,
        },
        paragraphs: crawlee.content.paragraphs,
        links: crawlee.content.links.map(link => ({
          text: link.text,
          url: link.url,
          isExternal: link.isExternal
        })),
        images: crawlee.content.images.map(img => ({
          src: img.src,
          alt: img.alt || '',
          title: img.title
        })),
        contactInfo: {
          emails: crawlee.content.contactInfo.emails,
          phones: crawlee.content.contactInfo.phones,
          socialLinks: crawlee.content.socialLinks.map(s => ({
            platform: s.platform,
            url: s.url
          }))
        }
      },
      structure: {
        hasNav: false,
        hasHeader: false,
        hasFooter: false,
        hasSidebar: false,
        articleCount: 0,
        formCount: 0
      },
      performance: {
        loadTime: crawlee.technical.loadTime,
        responseTime: crawlee.technical.responseTime
      }
    }));
    
    console.log(`✅ Hybrid data conversion completed! Processed ${scrapedData.length} websites.`);
    
    // Create person analyzer and perform analysis
    const analyzer = new PersonAnalyzer(person.firstName, person.lastName, person.email);
    const analysisResult = await analyzer.analyzePersons(uniqueSearchResults, scrapedData, useAdvancedClustering);
    
    return analysisResult;
    
  } finally {
    await ultimateScraper.close();
    await crawleeEngine.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Require all three parameters
  if (args.length < 3) {
    console.error("❌ Error: All three fields are required!");
    console.error("\n📋 Usage: node dist/cli-hybrid-person-analysis.js <firstName> <lastName> <email> [queryCount] [--detailed] [--priority=MODE] [--advanced-clustering]");
    console.error("📋 Example: node dist/cli-hybrid-person-analysis.js Jed Burdick jed@votaryfilms.com 15 --detailed --priority=social-first --advanced-clustering");
    console.error("\n📝 Description:");
    console.error("   HYBRID tool combining the proven Ultimate Crawler Engine for search with");
    console.error("   Crawlee's advanced scraping capabilities for the best of both worlds.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required, must be valid format)");
    console.error("   • queryCount: Number of search queries to execute (optional, default: all generated queries)");
    console.error("   • --detailed: Enhanced search with more comprehensive analysis (optional)");
    console.error("   • --advanced-clustering: Use ML-based clustering algorithms (HDBSCAN, Spectral, etc.) (optional)");
    console.error("   • --priority=MODE: Search optimization mode (optional)");
    console.error("     - social-first: Prioritize social media platforms (LinkedIn, Twitter, etc.) - DEFAULT");
    console.error("     - professional: Focus on professional/business platforms");
    console.error("     - comprehensive: Use all available search patterns");
    console.error("\n🚀 Hybrid Advantages:");
    console.error("   ✅ Ultimate Crawler: Proven search with multi-engine support");
    console.error("   ✅ Crawlee Scraping: Retry logic, session management, resource blocking");
    console.error("   ✅ Best Performance: Combines stability with advanced features");
    process.exit(1);
  }

  const firstName = cleanInput(args[0]);
  const lastName = cleanInput(args[1]);
  const email = cleanInput(args[2]);
  
  // Parse optional parameters
  let queryCount: number | undefined;
  let detailed = false;
  let priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first';
  
  // Check for queryCount, --detailed flag, --priority flag, and --advanced-clustering flag
  let useAdvancedClustering = false;
  
  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--detailed') {
      detailed = true;
    } else if (arg === '--advanced-clustering') {
      useAdvancedClustering = true;
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

  console.log(`🎯 HYBRID ULTIMATE CRAWLER + CRAWLEE ANALYSIS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
  console.log(`📧 Email: ${person.email}`);
  console.log(`🔍 Mode: ${detailed ? 'Detailed Analysis' : 'Standard Analysis'}`);
  console.log(`🤖 Clustering: ${useAdvancedClustering ? 'ADVANCED ML (HDBSCAN, Spectral)' : 'Basic Rule-Based'}`);
  console.log(`🎲 Search Priority: ${priority.toUpperCase()}`);
  if (queryCount) {
    console.log(`🔢 Query Count: ${queryCount} (custom limit)`);
  } else {
    console.log(`🔢 Query Count: All generated queries (no limit)`);
  }
  console.log(`🚀 Hybrid Enhancement: Ultimate Crawler (Search) + Crawlee (Scraping) 🌟`);
  console.log(`✅ Note: All websites including LinkedIn will be scraped with Crawlee`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();
    const result = await searchAndAnalyzePersonHybrid(person, queryCount, detailed, priority, useAdvancedClustering);
    const totalTime = Date.now() - startTime;
    
    // Print comprehensive analysis
    printAnalysisResult(result);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏆 HYBRID PERFORMANCE SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`🔍 Search Engine: Ultimate Crawler (Multi-Engine)`);
    console.log(`🕷️  Scraping Engine: Crawlee (Multi-Crawler)`);
    console.log(`🌟 Hybrid advantages utilized:`);
    console.log(`   ✅ Proven search stability from Ultimate Crawler`);
    console.log(`   ✅ Advanced scraping capabilities from Crawlee`);
    console.log(`   ✅ Automatic retry logic and error recovery`);
    console.log(`   ✅ Session persistence and resource optimization`);
    console.log(`   ✅ Multi-crawler fallback system`);
    console.log(`🔚 Hybrid analysis completed successfully!`);
    
  } catch (error) {
    console.error("\n❌ Error during hybrid analysis:", error);
    process.exit(1);
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
