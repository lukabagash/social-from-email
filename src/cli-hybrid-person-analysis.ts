#!/usr/bin/env node
import { UltimateCrawlerEngine, type GoogleSearchResult } from "./hybrid-search/ultimate-scraper";
import { EnhancedCrawleeEngine, type CrawleeScrapedData } from "./crawlee/enhanced-crawler";
import { PersonAnalyzer, type PersonAnalysisResult, type PersonCluster } from "./person-analysis/enhanced-analyzer";
import { SiteDiscoveryEngine } from "./site-discovery/site-finder";
import { type ScrapedData } from "./web-scraper/general-scraper";
import { SocialLinkExtractor } from "./utils/social-link-extractor";

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

function printPersonCluster(cluster: PersonCluster, index: number, showExtended: boolean = false, showTechnical: boolean = false) {
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
  
  // Extended Information (only show if --extended flag is used)
  if (showExtended) {
    if (cluster.personEvidence.websites && cluster.personEvidence.websites.length > 0) {
      console.log(`   🌐 Personal Websites: ${cluster.personEvidence.websites.join(', ')}`);
    }
    if (cluster.personEvidence.affiliations && cluster.personEvidence.affiliations.length > 0) {
      console.log(`   🏢 Affiliations: ${cluster.personEvidence.affiliations.join(', ')}`);
    }
    if (cluster.personEvidence.achievements && cluster.personEvidence.achievements.length > 0) {
      console.log(`   🏆 Achievements: ${cluster.personEvidence.achievements.join(', ')}`);
    }
    if (cluster.personEvidence.languages && cluster.personEvidence.languages.length > 0) {
      console.log(`   🗣️  Languages: ${cluster.personEvidence.languages.join(', ')}`);
    }
    if (cluster.personEvidence.coordinates) {
      console.log(`   📍 Coordinates: ${cluster.personEvidence.coordinates}`);
    }
    if (cluster.personEvidence.employmentPeriod) {
      console.log(`   📅 Employment Period: ${cluster.personEvidence.employmentPeriod}`);
    }
  }
  
  // Social Profiles (Enhanced with extended info)
  if (cluster.personEvidence.socialProfiles && cluster.personEvidence.socialProfiles.length > 0) {
    console.log(`\n🔗 Social Profiles:`);
    cluster.personEvidence.socialProfiles.forEach(social => {
      let profileInfo = `   ${social.platform}: ${social.url}`;
      if (social.username) {
        profileInfo += ` (@${social.username})`;
      }
      if (showExtended && social.verified) {
        profileInfo += ` ✅`;
      }
      console.log(profileInfo);
      
      if (showExtended) {
        if (social.followers !== undefined) {
          console.log(`      👥 Followers: ${social.followers?.toLocaleString()}`);
        }
        if (social.following !== undefined) {
          console.log(`      🔄 Following: ${social.following?.toLocaleString()}`);
        }
        if (social.posts !== undefined) {
          console.log(`      📝 Posts: ${social.posts?.toLocaleString()}`);
        }
        if (social.engagement !== undefined) {
          console.log(`      📊 Engagement: ${social.engagement}%`);
        }
        if (social.lastActivity) {
          console.log(`      🕒 Last Activity: ${social.lastActivity}`);
        }
      }
    });
  }
  
  // Additional Information
  if (cluster.personEvidence.skills && cluster.personEvidence.skills.length > 0) {
    const skillsToShow = showExtended ? cluster.personEvidence.skills : cluster.personEvidence.skills.slice(0, 5);
    const skillsText = skillsToShow.join(', ');
    const truncated = !showExtended && cluster.personEvidence.skills.length > 5 ? '...' : '';
    console.log(`\n💼 Skills/Expertise: ${skillsText}${truncated}`);
  }
  
  if (cluster.personEvidence.education && cluster.personEvidence.education.length > 0) {
    console.log(`🎓 Education Keywords: ${cluster.personEvidence.education.join(', ')}`);
  }
  
  // Extended professional information
  if (showExtended) {
    if (cluster.personEvidence.careerProgression && cluster.personEvidence.careerProgression.length > 0) {
      console.log(`\n📈 Career Progression:`);
      cluster.personEvidence.careerProgression.forEach((step, idx) => {
        console.log(`   ${idx + 1}. ${step}`);
      });
    }
    
    if (cluster.personEvidence.industryExpertise && cluster.personEvidence.industryExpertise.length > 0) {
      console.log(`🏭 Industry Expertise: ${cluster.personEvidence.industryExpertise.join(', ')}`);
    }
    
    if (cluster.personEvidence.publications && cluster.personEvidence.publications.length > 0) {
      console.log(`📚 Publications: ${cluster.personEvidence.publications.join(', ')}`);
    }
    
    if (cluster.personEvidence.responsibilities && cluster.personEvidence.responsibilities.length > 0) {
      console.log(`📋 Key Responsibilities:`);
      cluster.personEvidence.responsibilities.forEach((resp, idx) => {
        console.log(`   • ${resp}`);
      });
    }
  }
  
  // Biographical insights from metadata
  if (showExtended && cluster.metadata?.biographicalInsights) {
    const bio = cluster.metadata.biographicalInsights;
    console.log(`\n🧠 Biographical Analysis:`);
    if (bio.careerStage) console.log(`   Career Stage: ${bio.careerStage}`);
    if (bio.professionalSeniority) console.log(`   Seniority Level: ${bio.professionalSeniority}`);
    if (bio.industryExpertise && bio.industryExpertise.length > 0) {
      console.log(`   Industry Focus: ${bio.industryExpertise.join(', ')}`);
    }
    if (bio.educationLevel) console.log(`   Education Level: ${bio.educationLevel}`);
    if (bio.thoughtLeadership) console.log(`   Thought Leadership: ${bio.thoughtLeadership}`);
    if (bio.digitalSavviness) console.log(`   Digital Presence: ${bio.digitalSavviness}`);
    if (bio.geographicMobility) console.log(`   Geographic Mobility: ${bio.geographicMobility}`);
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

function printAnalysisResult(result: PersonAnalysisResult, showExtended: boolean = false, showTechnical: boolean = false, showKeywords: boolean = false) {
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
  
  // Enhanced biographical insights (with --extended)
  if (showExtended && result.summary.biographicalInsights) {
    const bio = result.summary.biographicalInsights;
    console.log(`\n🧠 Biographical Intelligence Summary:`);
    if (bio.careerStage) console.log(`   Career Stage: ${bio.careerStage}`);
    if (bio.professionalSeniority) console.log(`   Professional Level: ${bio.professionalSeniority}`);
    if (bio.industryExpertise && bio.industryExpertise.length > 0) {
      console.log(`   Industry Expertise: ${bio.industryExpertise.join(', ')}`);
    }
    if (bio.educationLevel) console.log(`   Education Level: ${bio.educationLevel}`);
    if (bio.thoughtLeadership) console.log(`   Thought Leadership: ${bio.thoughtLeadership}`);
    if (bio.digitalSavviness) console.log(`   Digital Savviness: ${bio.digitalSavviness}`);
    if (bio.geographicMobility) console.log(`   Geographic Mobility: ${bio.geographicMobility}`);
    if (bio.keySkills && bio.keySkills.length > 0) {
      console.log(`   Key Skills: ${bio.keySkills.join(', ')}`);
    }
    if (bio.achievementsCount !== undefined) {
      console.log(`   Achievements Found: ${bio.achievementsCount}`);
    }
    if (bio.educationInstitutions !== undefined) {
      console.log(`   Education Institutions: ${bio.educationInstitutions}`);
    }
    if (bio.socialPresence !== undefined) {
      console.log(`   Social Presence Score: ${bio.socialPresence}/10`);
    }
    if (bio.biographicalConfidence !== undefined) {
      console.log(`   Biographical Confidence: ${bio.biographicalConfidence}%`);
    }
  }
  
  // Keyword Analysis (with --keywords)
  if (showKeywords && result.keywordAnalysis) {
    console.log(`\n🔑 Keyword Analysis:`);
    if (result.keywordAnalysis.topKeywords.length > 0) {
      console.log(`   Top Keywords: ${result.keywordAnalysis.topKeywords.join(', ')}`);
    }
    if (result.keywordAnalysis.identifiedTopics.length > 0) {
      console.log(`   Identified Topics: ${result.keywordAnalysis.identifiedTopics.join(', ')}`);
    }
    if (result.keywordAnalysis.extractedKeywords.length > 0) {
      console.log(`   Detailed Keywords Analysis:`);
      const firstKeywordSet = result.keywordAnalysis.extractedKeywords[0];
      if (firstKeywordSet.keyPhrases && firstKeywordSet.keyPhrases.length > 0) {
        console.log(`      Key Phrases: ${firstKeywordSet.keyPhrases.slice(0, 5).join(', ')}`);
      }
      if (firstKeywordSet.namedEntities && firstKeywordSet.namedEntities.length > 0) {
        console.log(`      Named Entities: ${firstKeywordSet.namedEntities.slice(0, 5).join(', ')}`);
      }
      if (firstKeywordSet.topics && firstKeywordSet.topics.length > 0) {
        console.log(`      Topic Categories: ${firstKeywordSet.topics.join(', ')}`);
      }
      if (firstKeywordSet.relationships && firstKeywordSet.relationships.length > 0) {
        console.log(`      Relationships Found: ${firstKeywordSet.relationships.length}`);
      }
    }
  }
  
  // Site Discovery (with --extended)
  if (showExtended && result.siteDiscovery) {
    console.log(`\n🌐 Site Discovery Results:`);
    if (result.siteDiscovery.discoveredSites.length > 0) {
      console.log(`   Discovered Sites: ${result.siteDiscovery.discoveredSites.join(', ')}`);
    }
    if (result.siteDiscovery.searchedPlatforms.length > 0) {
      console.log(`   Searched Platforms: ${result.siteDiscovery.searchedPlatforms.join(', ')}`);
    }
    if (result.siteDiscovery.linkedinSnippet) {
      console.log(`   LinkedIn Preview: "${result.siteDiscovery.linkedinSnippet}"`);
    }
  }
  
  // Print each identified person
  result.identifiedPersons.forEach((person, index) => {
    printPersonCluster(person, index, showExtended, showTechnical);
  });
  
  // Analysis insights
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧠 ANALYSIS INSIGHTS`);
  console.log(`${'='.repeat(80)}`);
  
  const analysis = result.analysis;
  
  console.log(`🎯 Likely Same Person: ${analysis.likelyIsSamePerson ? 'YES' : 'NO'}`);
  console.log(`📈 Main Identity Confidence: ${analysis.mainPersonConfidence}%`);
  console.log(`🔬 Clustering Method: ${analysis.clusteringMethod.replace('_', ' ').toUpperCase()}`);
  
  // Advanced insights (with --extended)
  if (showExtended && analysis.advancedInsights) {
    const insights = analysis.advancedInsights;
    console.log(`\n🔬 Advanced Analysis Metrics:`);
    if (insights.strongestEvidenceTypes && insights.strongestEvidenceTypes.length > 0) {
      console.log(`   🎯 Strongest Evidence Types: ${insights.strongestEvidenceTypes.join(', ')}`);
    }
    if (insights.crossPlatformConsistency !== undefined) {
      const consistency = (insights.crossPlatformConsistency * 100).toFixed(1);
      console.log(`   🔗 Cross-Platform Consistency: ${consistency}%`);
    }
    if (insights.temporalConsistency !== undefined) {
      const temporal = (insights.temporalConsistency * 100).toFixed(1);
      console.log(`   ⏰ Temporal Consistency: ${temporal}%`);
    }
    if (insights.professionalCoherence !== undefined) {
      const coherence = (insights.professionalCoherence * 100).toFixed(1);
      console.log(`   💼 Professional Coherence: ${coherence}%`);
    }
  }
  
  // Advanced clustering results (when ML is used)
  if (showExtended && result.advancedClustering) {
    console.log(`\n🤖 Advanced Clustering Results:`);
    console.log(`   Algorithm Used: ${result.advancedClustering.algorithm || 'Multiple ML Algorithms'}`);
    console.log(`   Clusters Found: ${result.advancedClustering.clusterCount}`);
    if (result.advancedClustering.silhouetteScore !== undefined) {
      console.log(`   Silhouette Score: ${result.advancedClustering.silhouetteScore.toFixed(3)}`);
    }
    if (result.advancedClustering.adjustedRandIndex !== undefined) {
      console.log(`   Adjusted Rand Index: ${result.advancedClustering.adjustedRandIndex.toFixed(3)}`);
    }
    if (result.advancedClustering.outliers && result.advancedClustering.outliers.length > 0) {
      console.log(`   Outliers Detected: ${result.advancedClustering.outliers.length} data points`);
    }
    if (result.advancedClustering.confidenceScores && result.advancedClustering.confidenceScores.length > 0) {
      const avgConfidence = result.advancedClustering.confidenceScores.reduce((sum, score) => sum + score, 0) / result.advancedClustering.confidenceScores.length;
      console.log(`   Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    }
  }
  
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

function printCrawleeScrapingStats(scrapedData: CrawleeScrapedData[], showTechnical: boolean = false) {
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
    if (showTechnical) {
      const avgLoad = crawlerData.reduce((sum, d) => sum + d.technical.loadTime, 0) / crawlerData.length;
      const avgResponse = crawlerData.reduce((sum, d) => sum + d.technical.responseTime, 0) / crawlerData.length;
      console.log(`      ⚡ Avg Load Time: ${avgLoad.toFixed(0)}ms`);
      console.log(`      🔄 Avg Response Time: ${avgResponse.toFixed(0)}ms`);
    }
  });
  
  // Summary statistics
  const totalSocialLinks = scrapedData.reduce((sum, data) => sum + data.content.socialLinks.length, 0);
  const totalEmails = scrapedData.reduce((sum, data) => sum + data.content.contactInfo.emails.length, 0);
  const totalAddresses = scrapedData.reduce((sum, data) => sum + data.content.contactInfo.addresses.length, 0);
  const avgRelevance = scrapedData.reduce((sum, data) => sum + data.quality.relevanceScore, 0) / scrapedData.length;
  const avgLoadTime = scrapedData.reduce((sum, data) => sum + data.technical.loadTime, 0) / scrapedData.length;
  
  console.log(`   🔗 Social Links Discovered: ${totalSocialLinks}`);
  console.log(`   📧 Email Addresses Found: ${totalEmails}`);
  if (showTechnical && totalAddresses > 0) {
    console.log(`   📍 Physical Addresses Found: ${totalAddresses}`);
  }
  console.log(`   🎯 Average Relevance: ${avgRelevance.toFixed(1)}%`);
  console.log(`   ⚡ Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
  
  if (showTechnical) {
    // Quality breakdown
    const qualityBreakdown = scrapedData.reduce((acc, data) => {
      acc[data.quality.contentQuality] = (acc[data.quality.contentQuality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`   📊 Content Quality Breakdown:`);
    Object.entries(qualityBreakdown).forEach(([quality, count]) => {
      const emoji = quality === 'high' ? '🟢' : quality === 'medium' ? '🟡' : '🔴';
      console.log(`      ${emoji} ${quality.toUpperCase()}: ${count} sites`);
    });
    
    // Status codes
    const statusCodes = scrapedData.reduce((acc, data) => {
      acc[data.technical.statusCode] = (acc[data.technical.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log(`   🌐 HTTP Status Codes:`);
    Object.entries(statusCodes).forEach(([code, count]) => {
      const emoji = code.startsWith('2') ? '✅' : code.startsWith('3') ? '🔄' : '❌';
      console.log(`      ${emoji} ${code}: ${count} sites`);
    });
    
    // JavaScript usage
    const jsEnabled = scrapedData.filter(d => d.technical.javascriptEnabled).length;
    console.log(`   🟨 JavaScript Enabled: ${jsEnabled}/${scrapedData.length} sites`);
    
    // Content analysis
    const withPersonalInfo = scrapedData.filter(d => d.quality.hasPersonalInfo).length;
    const withProfessionalInfo = scrapedData.filter(d => d.quality.hasProfessionalInfo).length;
    const withSocialMedia = scrapedData.filter(d => d.quality.hasSocialMedia).length;
    
    console.log(`   👤 Sites with Personal Info: ${withPersonalInfo}/${scrapedData.length}`);
    console.log(`   💼 Sites with Professional Info: ${withProfessionalInfo}/${scrapedData.length}`);
    console.log(`   📱 Sites with Social Media: ${withSocialMedia}/${scrapedData.length}`);
  }
  
  console.log(`   ✨ Crawlee Advantages: Retry logic, session management, resource blocking`);
}

async function searchAndAnalyzePersonHybrid(
  person: PersonSearchInput, 
  queryCount?: number, 
  detailed: boolean = false, 
  priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first',
  useAdvancedClustering: boolean = false,
  showTechnical: boolean = false
): Promise<{ result: PersonAnalysisResult, crawleeData: CrawleeScrapedData[] }> {  // Use the proven Ultimate Crawler for search
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
      printCrawleeScrapingStats(crawleeScrapedData, showTechnical);
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
    
    return { result: analysisResult, crawleeData: crawleeScrapedData };
    
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
    console.error("\n📋 Usage: node dist/cli-hybrid-person-analysis.js <firstName> <lastName> <email> [queryCount] [options]");
    console.error("📋 Example: node dist/cli-hybrid-person-analysis.js Jed Burdick jed@votaryfilms.com 15 --detailed --priority=social-first --advanced-clustering --extended --technical --keywords --social-links");
    console.error("\n📝 Description:");
    console.error("   HYBRID tool combining the proven Ultimate Crawler Engine for search with");
    console.error("   Crawlee's advanced scraping capabilities for the best of both worlds.");
    console.error("   • firstName: Person's first name (required)");
    console.error("   • lastName: Person's last name (required)");
    console.error("   • email: Person's email address (required, must be valid format)");
    console.error("   • queryCount: Number of search queries to execute (optional, default: all generated queries)");
    console.error("\n🚩 Available Flags:");
    console.error("   • --detailed: Enhanced search with more comprehensive analysis");
    console.error("   • --extended: Show all biographical insights, career progression, social metrics");
    console.error("   • --technical: Show detailed technical metrics, quality scores, status codes");
    console.error("   • --keywords: Show detailed keyword analysis and topic extraction");
    console.error("   • --social-links: Extract and display comprehensive social media links summary");
    console.error("   • --export-social=FILE: Export social links to JSON file (requires --social-links)");
    console.error("   • --advanced-clustering: Use ML-based clustering algorithms (HDBSCAN, Spectral, etc.)");
    console.error("   • --priority=MODE: Search optimization mode");
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
  let showExtended = false;
  let showTechnical = false;
  let showKeywords = false;
  let showSocialLinks = false;
  let exportSocialFile: string | undefined;
  let priority: 'social-first' | 'professional' | 'comprehensive' = 'social-first';
  
  // Check for queryCount and flags
  let useAdvancedClustering = false;
  
  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--detailed') {
      detailed = true;
    } else if (arg === '--extended') {
      showExtended = true;
    } else if (arg === '--technical') {
      showTechnical = true;
    } else if (arg === '--keywords') {
      showKeywords = true;
    } else if (arg === '--social-links') {
      showSocialLinks = true;
    } else if (arg.startsWith('--export-social=')) {
      exportSocialFile = arg.split('=')[1];
      showSocialLinks = true; // Auto-enable social links when export is requested
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
  if (showExtended) console.log(`🔍 Extended Info: Biographical insights, social metrics, career progression`);
  if (showTechnical) console.log(`🔍 Technical Details: Quality scores, status codes, performance metrics`);
  if (showKeywords) console.log(`🔍 Keyword Analysis: Topic extraction, named entities, relationships`);
  if (showSocialLinks) console.log(`🔍 Social Links: Comprehensive social media links extraction and analysis`);
  if (exportSocialFile) console.log(`🔍 Export Social: ${exportSocialFile}`);
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
    const analysisData = await searchAndAnalyzePersonHybrid(person, queryCount, detailed, priority, useAdvancedClustering, showTechnical);
    const totalTime = Date.now() - startTime;
    
    // Print comprehensive analysis
    printAnalysisResult(analysisData.result, showExtended, showTechnical, showKeywords);
    
    // Extract and display social links if requested
    if (showSocialLinks) {
      const socialSummary = SocialLinkExtractor.extractSocialLinks(analysisData.result);
      SocialLinkExtractor.printSocialLinkSummary(socialSummary, showExtended);
      
      // Export to JSON if file path provided
      if (exportSocialFile) {
        SocialLinkExtractor.exportToJSON(socialSummary, exportSocialFile);
      }
      
      // Show best links per platform
      const bestLinks = SocialLinkExtractor.getBestLinksPerPlatform(socialSummary);
      if (bestLinks.length > 0) {
        console.log(`\n🏆 BEST SOCIAL LINKS (One per platform):`);
        console.log(`${'─'.repeat(60)}`);
        bestLinks.forEach((link, index) => {
          const confidenceIcon = link.confidence > 70 ? '🟢' : link.confidence > 40 ? '🟡' : '🔴';
          const verifiedIcon = link.verified ? ' ✅' : '';
          console.log(`${index + 1}. ${confidenceIcon} ${link.platform.toUpperCase()}${verifiedIcon}: ${link.url}`);
          console.log(`   📊 Confidence: ${link.confidence}% | Relevance: ${link.relevanceScore}%`);
          if (link.username) console.log(`   🏷️  @${link.username}`);
        });
      }
    }
    
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
    if (showSocialLinks) {
      console.log(`   ✅ Comprehensive social media link extraction and analysis`);
    }
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
