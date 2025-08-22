#!/usr/bin/env node

import { UltimateCrawlerEngine, type GoogleSearchResult } from "./hybrid-search/ultimate-scraper";
import { EnhancedCrawleeEngine, type CrawleeScrapedData } from "./crawlee/enhanced-crawler";
import { PersonAnalyzer, type PersonAnalysisResult, type PersonCluster } from "./person-analysis/enhanced-analyzer";
import { SiteDiscoveryEngine } from "./site-discovery/site-finder";
import { type ScrapedData } from "./web-scraper/general-scraper";
import { SocialLinkExtractor, type SocialLink } from "./utils/social-link-extractor";

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

/**
 * Quick social media links finder - optimized for speed and relevance
 */
async function findSocialLinks(
  person: PersonSearchInput, 
  queryCount: number = 8
): Promise<SocialLink[]> {
  
  const ultimateScraper = new UltimateCrawlerEngine();
  const crawleeEngine = new EnhancedCrawleeEngine({
    maxConcurrency: 3,
    requestHandlerTimeoutSecs: 15,
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
    // Initialize engines
    await ultimateScraper.initialize({
      useMultipleBrowsers: true,
      rotateUserAgents: true,
      enableStealth: true,
      parallelSessions: Math.min(3, queryCount || 3),
      fallbackEngine: true
    });
    await crawleeEngine.initialize();
    
    // Generate social-first queries
    const allQueries = SiteDiscoveryEngine.generatePrioritizedQueries(
      person.firstName, 
      person.lastName, 
      person.email, 
      'social-first'
    );
    
    const queriesToExecute = allQueries.slice(0, queryCount);
    
    // Search with Ultimate Crawler
    const allSearchResults = await ultimateScraper.searchWithCustomQueries(
      queriesToExecute,
      { 
        maxResults: 3,
        includeSnippets: true,
        multiEngineMode: true,
        parallelSessions: Math.min(2, Math.ceil(queriesToExecute.length / 4)),
        useMultipleBrowsers: true,
        rotateUserAgents: true,
        enableStealth: true,
        fallbackEngine: true
      }
    );

    // Remove duplicates
    const uniqueSearchResults = allSearchResults.filter((result: GoogleSearchResult, index: number, self: GoogleSearchResult[]) => 
      index === self.findIndex((r: GoogleSearchResult) => r.url === result.url)
    );
    
    if (uniqueSearchResults.length === 0) {
      return [];
    }
    
    // Scrape with Crawlee
    const urlsToScrape = uniqueSearchResults.map(result => result.url);
    const crawleeScrapedData = await crawleeEngine.scrapeUrls(urlsToScrape);
    
    // Convert to standard format
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
    
    // Analyze and extract social links
    const analyzer = new PersonAnalyzer(person.firstName, person.lastName, person.email);
    const analysisResult = await analyzer.analyzePersons(uniqueSearchResults, scrapedData, false);
    
    // Extract social links and filter for most relevant
    const socialSummary = SocialLinkExtractor.extractSocialLinks(analysisResult);
    
    // Return only the most relevant social links (filter out generic/irrelevant ones)
    const relevantLinks = socialSummary.consolidatedLinks.filter(link => {
      // Filter out generic social media links and focus on personal profiles
      const url = link.url.toLowerCase();
      const username = link.username?.toLowerCase() || '';
      
      // Keep if it contains the person's name or email domain
      const personName = `${person.firstName} ${person.lastName}`.toLowerCase();
      const emailDomain = person.email.split('@')[1].toLowerCase();
      
      return (
        url.includes(person.firstName.toLowerCase()) ||
        url.includes(person.lastName.toLowerCase()) ||
        url.includes(emailDomain) ||
        username.includes(person.firstName.toLowerCase()) ||
        username.includes(person.lastName.toLowerCase()) ||
        (link.platform.toLowerCase() === 'linkedin' && link.confidence > 70) ||
        (link.platform.toLowerCase() === 'twitter' && link.confidence > 70) ||
        (link.platform.toLowerCase() === 'facebook' && link.confidence > 70) ||
        (link.platform.toLowerCase() === 'instagram' && link.confidence > 70) ||
        (link.platform.toLowerCase() === 'youtube' && link.confidence > 70)
      );
    });
    
    return relevantLinks.slice(0, 10); // Return top 10 most relevant
    
  } finally {
    await ultimateScraper.close();
    await crawleeEngine.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("❌ Error: All three fields are required!");
    console.error("\n📋 Usage: node dist/quick-social-finder.js <firstName> <lastName> <email> [queryCount]");
    console.error("📋 Example: node dist/quick-social-finder.js Jed Burdick jed@votaryfilms.com 8");
    console.error("\n📝 Description:");
    console.error("   Quick tool to find the most relevant social media links for a person.");
    console.error("   Optimized for speed and relevance - returns only the best social profiles.");
    process.exit(1);
  }

  const firstName = cleanInput(args[0]);
  const lastName = cleanInput(args[1]);
  const email = cleanInput(args[2]);
  const queryCount = args[3] ? parseInt(args[3], 10) : 8;
  
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
    process.exit(1);
  }

  const person: PersonSearchInput = {
    firstName,
    lastName,
    email
  };

  console.log(`🔍 QUICK SOCIAL MEDIA FINDER`);
  console.log(`${'='.repeat(60)}`);
  console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
  console.log(`📧 Email: ${person.email}`);
  console.log(`🔢 Queries: ${queryCount}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const startTime = Date.now();
    const socialLinks = await findSocialLinks(person, queryCount);
    const totalTime = Date.now() - startTime;
    
    if (socialLinks.length === 0) {
      console.log("❌ No relevant social media links found.");
      process.exit(0);
    }
    
    console.log(`🔗 FOUND ${socialLinks.length} RELEVANT SOCIAL LINKS:`);
    console.log(`${'─'.repeat(60)}`);
    
    socialLinks.forEach((link, index) => {
      const confidenceIcon = link.confidence > 70 ? '🟢' : link.confidence > 40 ? '🟡' : '🔴';
      const verifiedIcon = link.verified ? ' ✅' : '';
      
      console.log(`${index + 1}. ${confidenceIcon} ${link.platform.toUpperCase()}${verifiedIcon}`);
      console.log(`   🌐 ${link.url}`);
      console.log(`   📊 Confidence: ${link.confidence}% | Relevance: ${link.relevanceScore}%`);
      if (link.username) {
        console.log(`   🏷️  @${link.username}`);
      }
      if (link.followers !== undefined) {
        console.log(`   👥 ${link.followers.toLocaleString()} followers`);
      }
      console.log();
    });
    
    console.log(`${'='.repeat(60)}`);
    console.log(`⏱️  Completed in ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`✅ Found ${socialLinks.length} high-quality social media profiles`);
    
  } catch (error) {
    console.error("\n❌ Error during social link search:", error);
    process.exit(1);
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

main().catch(console.error);
