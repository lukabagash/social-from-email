#!/usr/bin/env node
import { EnhancedCrawleeEngine, type CrawleeScrapedData } from "./crawlee/enhanced-crawler";
import { CrawleeSearchEngine, type SearchEngineResult } from "./crawlee-search/search-engine";
import { PersonAnalyzer, type PersonAnalysisResult, type PersonCluster } from "./person-analysis/enhanced-analyzer";
import { SiteDiscoveryEngine } from "./site-discovery/site-finder";
import { AdvancedPersonClusterer, type ClusteringResult } from "./advanced-clustering/advanced-clusterer";
import { EnhancedPersonAnalyzer, type EnhancedPersonResult } from "./analysis/enhanced-person-analyzer";
import { type ScrapedData } from "./web-scraper/general-scraper";

interface PersonSearchInput {
  firstName: string;
  lastName: string;
  email: string;
}

interface CrawleeEnhancedOptions {
  queryCount?: number;
  detailed?: boolean;
  priority?: 'social-first' | 'professional' | 'comprehensive';
  maxConcurrency?: number;
  enableJavaScript?: boolean;
  timeout?: number;
  retries?: number;
  searchEngines?: ('duckduckgo' | 'google' | 'bing')[];
  blockResources?: string[];
  enableProxy?: boolean;
  respectRobotsTxt?: boolean;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function cleanInput(input: string): string {
  return input.trim().replace(/['"]/g, '');
}

function printCrawleeSearchResults(results: SearchEngineResult[]) {
  console.log(`\n📊 CRAWLEE SEARCH RESULTS (${results.length} found)`);
  console.log(`${'─'.repeat(80)}`);
  
  // Group by search engine
  const byEngine = results.reduce((acc, result) => {
    if (!acc[result.searchEngine]) acc[result.searchEngine] = [];
    acc[result.searchEngine].push(result);
    return acc;
  }, {} as Record<string, SearchEngineResult[]>);
  
  Object.entries(byEngine).forEach(([engine, engineResults]) => {
    console.log(`\n🔍 ${engine.toUpperCase()} Results: ${engineResults.length}`);
    engineResults.slice(0, 5).forEach((result, idx) => {
      const qualityIndicator = result.metadata.hasRichSnippet ? '🌟' : 
                              result.metadata.hasImage ? '🖼️' : 
                              result.metadata.isAd ? '📢' : '📄';
      
      console.log(`   ${idx + 1}. ${qualityIndicator} ${result.title}`);
      console.log(`      🌐 ${result.url}`);
      console.log(`      🏷️  Domain: ${result.domain} (Rank: ${result.rank})`);
      
      if (result.snippet && result.snippet.length > 0) {
        const snippet = result.snippet.length > 120 ? result.snippet.substring(0, 120) + '...' : result.snippet;
        console.log(`      📝 "${snippet}"`);
      }
      console.log();
    });
    
    if (engineResults.length > 5) {
      console.log(`   ... and ${engineResults.length - 5} more results from ${engine}`);
    }
  });
}

function printCrawleeScrapingResults(scrapedData: CrawleeScrapedData[]) {
  console.log(`\n🕷️ CRAWLEE SCRAPING RESULTS (${scrapedData.length} websites)`);
  console.log(`${'─'.repeat(80)}`);
  
  // Group by crawler type
  const byCrawler = scrapedData.reduce((acc, data) => {
    if (!acc[data.technical.crawlerUsed]) acc[data.technical.crawlerUsed] = [];
    acc[data.technical.crawlerUsed].push(data);
    return acc;
  }, {} as Record<string, CrawleeScrapedData[]>);
  
  Object.entries(byCrawler).forEach(([crawler, crawlerData]) => {
    console.log(`\n🤖 ${crawler.toUpperCase()} Crawler: ${crawlerData.length} websites`);
    
    crawlerData.slice(0, 3).forEach((data, idx) => {
      const qualityIcon = data.quality.contentQuality === 'high' ? '🔥' : 
                         data.quality.contentQuality === 'medium' ? '⭐' : '📄';
      const socialIcon = data.quality.hasSocialMedia ? '🔗' : '';
      const contactIcon = data.quality.hasPersonalInfo ? '📞' : '';
      
      console.log(`   ${idx + 1}. ${qualityIcon}${socialIcon}${contactIcon} ${data.title}`);
      console.log(`      🌐 ${data.url}`);
      console.log(`      🏷️  Domain: ${data.domain}`);
      console.log(`      ⚡ Load Time: ${data.technical.loadTime}ms | Content: ${(data.technical.contentLength / 1000).toFixed(1)}KB`);
      console.log(`      📊 Quality: ${data.quality.contentQuality} | Relevance: ${data.quality.relevanceScore}%`);
      
      if (data.content.socialLinks.length > 0) {
        const socialPlatforms = data.content.socialLinks.map(s => s.platform).join(', ');
        console.log(`      🔗 Social: ${socialPlatforms}`);
      }
      
      if (data.content.contactInfo.emails.length > 0) {
        console.log(`      📧 Emails: ${data.content.contactInfo.emails.slice(0, 2).join(', ')}`);
      }
      
      console.log();
    });
    
    if (crawlerData.length > 3) {
      console.log(`   ... and ${crawlerData.length - 3} more websites scraped with ${crawler}`);
    }
  });
  
  // Summary statistics
  const totalSocialLinks = scrapedData.reduce((sum, data) => sum + data.content.socialLinks.length, 0);
  const totalEmails = scrapedData.reduce((sum, data) => sum + data.content.contactInfo.emails.length, 0);
  const avgRelevance = scrapedData.reduce((sum, data) => sum + data.quality.relevanceScore, 0) / scrapedData.length;
  const avgLoadTime = scrapedData.reduce((sum, data) => sum + data.technical.loadTime, 0) / scrapedData.length;
  
  console.log(`\n📈 CRAWLEE SCRAPING STATISTICS:`);
  console.log(`   🔗 Total Social Links Found: ${totalSocialLinks}`);
  console.log(`   📧 Total Email Addresses: ${totalEmails}`);
  console.log(`   🎯 Average Relevance Score: ${avgRelevance.toFixed(1)}%`);
  console.log(`   ⚡ Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
  console.log(`   🤖 Crawlers Used: ${Object.keys(byCrawler).join(', ')}`);
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
    console.log(`      🤖 Discovered via: Crawlee Multi-Engine Search`);
    
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
  console.log(`🔍 CRAWLEE-ENHANCED PERSON ANALYSIS RESULTS`);
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

async function searchAndAnalyzePersonWithCrawlee(
  person: PersonSearchInput, 
  options: CrawleeEnhancedOptions = {}
): Promise<PersonAnalysisResult> {
  
  const {
    queryCount,
    detailed = false,
    priority = 'social-first',
    maxConcurrency = 5,
    enableJavaScript = true,
    timeout = 30,
    retries = 2,
    searchEngines = ['duckduckgo', 'google'],
    blockResources = ['font', 'texttrack', 'object', 'beacon'],
    enableProxy = false,
    respectRobotsTxt = true
  } = options;
  
  // Initialize Crawlee engines
  const searchEngine = new CrawleeSearchEngine({
    maxResultsPerEngine: detailed ? 8 : 5,
    searchEngines,
    maxConcurrency,
    requestTimeout: timeout,
    retries,
    enableJavaScript,
    blockResources,
    waitForNetworkIdle: true
  });
  
  const crawleeEngine = new EnhancedCrawleeEngine({
    maxConcurrency,
    requestHandlerTimeoutSecs: timeout,
    maxRequestRetries: retries,
    useSessionPool: true,
    persistCookiesPerSession: true,
    rotateUserAgents: true,
    enableJavaScript,
    waitForNetworkIdle: true,
    blockResources,
    enableProxy,
    respectRobotsTxt
  });
  
  try {
    // Initialize both engines
    await searchEngine.initialize();
    await crawleeEngine.initialize();
    
    console.log("🚀 Crawlee-Enhanced Analysis Engine initialized...\n");
    
    // Generate optimized search queries based on priority
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
    console.log(`🤖 Using Crawlee Multi-Engine Search with ${searchEngines.join(', ').toUpperCase()}`);
    console.log(`⚡ Concurrency: ${maxConcurrency} | JavaScript: ${enableJavaScript ? 'Enabled' : 'Disabled'}`);
    
    // Perform Crawlee-powered search
    console.log(`\n🔍 Searching with Crawlee for: ${person.firstName} ${person.lastName} (${person.email})`);
    const searchResults = await searchEngine.searchMultipleQueries(queriesToExecute);
    
    if (searchResults.length === 0) {
      console.log("❌ No search results found");
      throw new Error("No search results found");
    }
    
    // Print detailed search results
    printCrawleeSearchResults(searchResults);
    
    // Use all URLs for Crawlee-powered scraping (including LinkedIn)
    const urlsToScrape = searchResults
      .map(result => result.url);
    
    console.log(`\n🕷️  Starting Crawlee-powered scraping of ${urlsToScrape.length} websites...`);
    console.log(`${'='.repeat(80)}`);
    
    // Use Crawlee for comprehensive data extraction
    const crawleeScrapedData = await crawleeEngine.scrapeUrls(urlsToScrape);
    
    console.log(`✅ Crawlee scraping completed! Successfully scraped ${crawleeScrapedData.length}/${urlsToScrape.length} websites.`);
    
    // Print detailed scraping results
    printCrawleeScrapingResults(crawleeScrapedData);
    
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
        hasNav: false, // Not tracked by Crawlee version
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
    
    console.log(`✅ Data conversion completed! Processed ${scrapedData.length} websites with Crawlee analysis.`);
    
    // Convert SearchEngineResult to GoogleSearchResult format for analyzer
    const googleSearchResults = searchResults.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      domain: result.domain,
      scrapeMethod: 'playwright' as const,
      browserEngine: 'chromium' as const,
      searchEngine: result.searchEngine as 'duckduckgo' | 'google' | 'bing'
    }));
    
    // Create person analyzer
    const analyzer = new PersonAnalyzer(person.firstName, person.lastName, person.email);
    
    // Perform comprehensive analysis
    const analysisResult = await analyzer.analyzePersons(googleSearchResults, scrapedData);
    
    return analysisResult;
    
  } finally {
    await searchEngine.close();
    await crawleeEngine.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Require all three parameters
  if (args.length < 3) {
    console.error("❌ Error: All three fields are required!");
    console.error("\n📋 Usage: node dist/cli-crawlee-person-analysis.js <firstName> <lastName> <email> [queryCount] [options]");
    console.error("📋 Example: node dist/cli-crawlee-person-analysis.js Jed Burdick jed@votaryfilms.com 15 --detailed --priority=social-first --engines=duckduckgo,google");
    console.error("\n📝 Description:");
    console.error("   Enhanced tool powered by Crawlee that provides robust, scalable web crawling");
    console.error("   with automatic retries, session management, and multi-engine support.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required, must be valid format)");
    console.error("   • queryCount: Number of search queries to execute (optional)");
    console.error("\n🔧 Options:");
    console.error("   --detailed: Enhanced analysis with more comprehensive data extraction");
    console.error("   --priority=MODE: Search optimization mode");
    console.error("     - social-first: Prioritize social media platforms - DEFAULT");
    console.error("     - professional: Focus on professional/business platforms");
    console.error("     - comprehensive: Use all available search patterns");
    console.error("   --engines=LIST: Comma-separated list of search engines (duckduckgo,google,bing)");
    console.error("   --concurrency=N: Maximum concurrent requests (default: 5)");
    console.error("   --timeout=N: Request timeout in seconds (default: 30)");
    console.error("   --retries=N: Maximum retries per request (default: 2)");
    console.error("   --no-js: Disable JavaScript execution for faster crawling");
    console.error("   --proxy: Enable proxy rotation (experimental)");
    console.error("\n🚀 Crawlee Advantages:");
    console.error("   • Automatic retry logic and error recovery");
    console.error("   • Session persistence and cookie management");
    console.error("   • Resource blocking for faster loading");
    console.error("   • Multi-crawler fallback (Playwright → Puppeteer → Cheerio)");
    console.error("   • Built-in rate limiting and request queuing");
    console.error("   • Robust user agent rotation");
    process.exit(1);
  }

  const firstName = cleanInput(args[0]);
  const lastName = cleanInput(args[1]);
  const email = cleanInput(args[2]);
  
  // Parse optional parameters
  let queryCount: number | undefined;
  let detailed = false;
  let priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first';
  let searchEngines: ('duckduckgo' | 'google' | 'bing')[] = ['duckduckgo', 'google'];
  let maxConcurrency = 5;
  let timeout = 30;
  let retries = 2;
  let enableJavaScript = true;
  let enableProxy = false;
  
  // Check for queryCount and flags
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
        process.exit(1);
      }
    } else if (arg.startsWith('--engines=')) {
      const engineList = arg.split('=')[1].split(',') as ('duckduckgo' | 'google' | 'bing')[];
      const validEngines = ['duckduckgo', 'google', 'bing'];
      if (engineList.every(engine => validEngines.includes(engine))) {
        searchEngines = engineList;
      } else {
        console.error(`❌ Invalid search engines. Valid options: ${validEngines.join(', ')}`);
        process.exit(1);
      }
    } else if (arg.startsWith('--concurrency=')) {
      maxConcurrency = parseInt(arg.split('=')[1], 10);
      if (isNaN(maxConcurrency) || maxConcurrency < 1) {
        console.error('❌ Concurrency must be a positive number');
        process.exit(1);
      }
    } else if (arg.startsWith('--timeout=')) {
      timeout = parseInt(arg.split('=')[1], 10);
      if (isNaN(timeout) || timeout < 5) {
        console.error('❌ Timeout must be at least 5 seconds');
        process.exit(1);
      }
    } else if (arg.startsWith('--retries=')) {
      retries = parseInt(arg.split('=')[1], 10);
      if (isNaN(retries) || retries < 0) {
        console.error('❌ Retries must be a non-negative number');
        process.exit(1);
      }
    } else if (arg === '--no-js') {
      enableJavaScript = false;
    } else if (arg === '--proxy') {
      enableProxy = true;
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

  console.log(`🎯 CRAWLEE-ENHANCED PERSON IDENTITY ANALYSIS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
  console.log(`📧 Email: ${person.email}`);
  console.log(`🔍 Mode: ${detailed ? 'Detailed Analysis' : 'Standard Analysis'}`);
  console.log(`🎲 Search Priority: ${priority.toUpperCase()}`);
  console.log(`🔍 Search Engines: ${searchEngines.map(e => e.toUpperCase()).join(', ')}`);
  console.log(`⚡ Concurrency: ${maxConcurrency} | Timeout: ${timeout}s | Retries: ${retries}`);
  console.log(`🤖 JavaScript: ${enableJavaScript ? 'Enabled' : 'Disabled'} | Proxy: ${enableProxy ? 'Enabled' : 'Disabled'}`);
  if (queryCount) {
    console.log(`🔢 Query Count: ${queryCount} (custom limit)`);
  } else {
    console.log(`🔢 Query Count: All generated queries (no limit)`);
  }
  console.log(`🚀 Enhancement: Crawlee Multi-Crawler Engine 🕷️`);
  console.log(`✅ Note: All websites including LinkedIn will be scraped with Crawlee`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();
    const result = await searchAndAnalyzePersonWithCrawlee(person, {
      queryCount,
      detailed,
      priority,
      maxConcurrency,
      enableJavaScript,
      timeout,
      retries,
      searchEngines,
      enableProxy
    });
    const totalTime = Date.now() - startTime;
    
    // Print comprehensive analysis
    printAnalysisResult(result);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏆 CRAWLEE PERFORMANCE SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`🔍 Search engines used: ${searchEngines.join(', ')}`);
    console.log(`🤖 Crawlee advantages utilized:`);
    console.log(`   ✅ Automatic retry logic and error recovery`);
    console.log(`   ✅ Session persistence and cookie management`);
    console.log(`   ✅ Resource blocking for faster loading`);
    console.log(`   ✅ Multi-crawler fallback system`);
    console.log(`   ✅ Built-in rate limiting and request queuing`);
    console.log(`   ✅ Robust user agent rotation`);
    console.log(`🔚 Crawlee-enhanced person analysis completed successfully!`);
    
  } catch (error) {
    console.error("\n❌ Error during Crawlee-enhanced person analysis:", error);
    process.exit(1);
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
