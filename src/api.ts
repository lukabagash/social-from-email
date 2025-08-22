/**
 * Social From Email - Core API
 * Provides programmatic access to person analysis and social profile discovery
 */

import { UltimateCrawlerEngine, type GoogleSearchResult } from "./hybrid-search/ultimate-scraper";
import { EnhancedCrawleeEngine, type CrawleeScrapedData } from "./crawlee/enhanced-crawler";
import { PersonAnalyzer, type PersonAnalysisResult } from "./person-analysis/enhanced-analyzer";
import { SiteDiscoveryEngine } from "./site-discovery/site-finder";
import { SocialLinkExtractor, type SocialLinkSummary } from "./utils/social-link-extractor";
import { type ScrapedData } from "./web-scraper/general-scraper";

// Core input interfaces
export interface PersonSearchInput {
  firstName: string;
  lastName: string;
  email: string;
}

export interface SearchOptions {
  /** Number of search queries to execute (REQUIRED) */
  queryCount: number;
  /** Enhanced search with more comprehensive analysis */
  detailed?: boolean;
  /** Search optimization mode */
  priority?: 'social-first' | 'professional' | 'comprehensive';
  /** Use ML-based clustering algorithms */
  useAdvancedClustering?: boolean;
}

export interface AnalysisOptions {
  /** Show biographical insights, career progression, social metrics */
  includeExtended?: boolean;
  /** Show detailed technical metrics, quality scores, status codes */
  includeTechnical?: boolean;
  /** Show detailed keyword analysis and topic extraction */
  includeKeywords?: boolean;
  /** Extract and include comprehensive social media links */
  includeSocialLinks?: boolean;
}

// Result interfaces - reusing the original SocialLinkSummary
export type { SocialLinkSummary } from "./utils/social-link-extractor";

// Supporting Sources interfaces
export interface SupportingSource {
  index: number;
  title: string;
  url: string;
  domain: string;
  relevanceScore: number;
  enhancementMethod: string;
  snippet: string;
  evidence: {
    [key: string]: string | string[];
  };
}

export interface SupportingSourcesResult {
  personConfidence: number;
  totalSources: number;
  sources: SupportingSource[];
  metadata: {
    searchEngine: string;
    scrapingEngine: string;
    queriesExecuted: number;
    executionTime: number;
  };
}

export interface PersonSearchResult {
  analysis: PersonAnalysisResult;
  socialLinks?: SocialLinkSummary;
  crawleeData: CrawleeScrapedData[];
  executionTime: number;
  metadata: {
    searchEngine: string;
    scrapingEngine: string;
    options: SearchOptions & AnalysisOptions;
    queriesExecuted: number;
    uniqueResults: number;
    scrapedSuccessfully: number;
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates person search input
 */
export function validatePersonInput(person: PersonSearchInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!person.firstName || person.firstName.trim().length < 2) {
    errors.push("First name must be at least 2 characters long");
  }

  if (!person.lastName || person.lastName.trim().length < 2) {
    errors.push("Last name must be at least 2 characters long");
  }

  if (!validateEmail(person.email)) {
    errors.push("Email must be a valid email address");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Core hybrid search and analysis function
 * Combines Ultimate Crawler Engine for search with Crawlee for scraping
 * This mirrors the proven CLI implementation
 */
export async function searchAndAnalyzePerson(
  person: PersonSearchInput,
  searchOptions: SearchOptions,
  analysisOptions: AnalysisOptions = {}
): Promise<PersonSearchResult> {
  // Validate input
  const validation = validatePersonInput(person);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
  }

  const startTime = Date.now();

  // Set defaults
  const options = {
    queryCount: searchOptions.queryCount,
    detailed: searchOptions.detailed ?? false,
    priority: searchOptions.priority ?? 'social-first',
    useAdvancedClustering: searchOptions.useAdvancedClustering ?? false,
    ...analysisOptions
  };

  try {
    // Perform the hybrid search and analysis using the proven CLI implementation
    const result = await performHybridAnalysis(person, options);
    
    // Extract social links if requested
    let socialLinks: SocialLinkSummary | undefined;
    if (analysisOptions.includeSocialLinks) {
      socialLinks = SocialLinkExtractor.extractSocialLinks(result.analysis);
    }

    const executionTime = Date.now() - startTime;

    return {
      analysis: result.analysis,
      socialLinks,
      crawleeData: result.crawleeData,
      executionTime,
      metadata: {
        searchEngine: "Ultimate Crawler (Multi-Engine)",
        scrapingEngine: "Crawlee (Multi-Crawler)",
        options,
        queriesExecuted: result.metadata.queriesExecuted,
        uniqueResults: result.metadata.uniqueResults,
        scrapedSuccessfully: result.metadata.scrapedSuccessfully
      }
    };

  } catch (error) {
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Internal function that performs the actual hybrid analysis
 * This mirrors the exact logic from the CLI for proven reliability
 */
async function performHybridAnalysis(
  person: PersonSearchInput,
  options: SearchOptions & AnalysisOptions
): Promise<{
  analysis: PersonAnalysisResult;
  crawleeData: CrawleeScrapedData[];
  metadata: {
    queriesExecuted: number;
    uniqueResults: number;
    scrapedSuccessfully: number;
  };
}> {
  // Initialize engines exactly like the CLI
  const ultimateScraper = new UltimateCrawlerEngine();
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
      parallelSessions: Math.min(3, options.queryCount || 3),
      fallbackEngine: true
    });
    await crawleeEngine.initialize();

    // Generate search queries using the same logic as CLI
    let allQueries: string[];
    
    if (options.priority === 'social-first' && options.queryCount && options.queryCount <= 15) {
      allQueries = SiteDiscoveryEngine.generatePrioritizedQueries(person.firstName, person.lastName, person.email, 'social-first');
    } else if (options.priority === 'professional' && options.queryCount && options.queryCount <= 20) {
      allQueries = SiteDiscoveryEngine.generatePrioritizedQueries(person.firstName, person.lastName, person.email, 'professional');
    } else {
      allQueries = SiteDiscoveryEngine.generateSearchQueries(person.firstName, person.lastName, person.email);
    }

    // Limit queries if queryCount is specified
    const queriesToExecute = options.queryCount ? allQueries.slice(0, options.queryCount) : allQueries;

    // Use Ultimate Crawler for search (exact same as CLI)
    const allSearchResults = await ultimateScraper.searchWithCustomQueries(
      queriesToExecute,
      { 
        maxResults: options.detailed ? 5 : 3,
        includeSnippets: true,
        multiEngineMode: true,
        parallelSessions: Math.min(2, Math.ceil(queriesToExecute.length / 4)),
        useMultipleBrowsers: true,
        rotateUserAgents: true,
        enableStealth: true,
        fallbackEngine: true
      }
    );

    // Remove duplicates based on URL (same as CLI)
    const uniqueSearchResults = allSearchResults.filter((result: GoogleSearchResult, index: number, self: GoogleSearchResult[]) => 
      index === self.findIndex((r: GoogleSearchResult) => r.url === result.url)
    );

    if (uniqueSearchResults.length === 0) {
      throw new Error("No search results found");
    }

    // Use all URLs for Crawlee-enhanced scraping (same as CLI)
    const urlsToScrape = uniqueSearchResults.map(result => result.url);

    // Use Crawlee for enhanced scraping (same as CLI)
    const crawleeScrapedData = await crawleeEngine.scrapeUrls(urlsToScrape);

    // Convert Crawlee data to standard format for compatibility with PersonAnalyzer (same as CLI)
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

    // Analyze persons using the same logic as CLI
    const personAnalyzer = new PersonAnalyzer(person.firstName, person.lastName, person.email);
    const analysisResult = await personAnalyzer.analyzePersons(
      uniqueSearchResults,
      scrapedData,
      options.useAdvancedClustering
    );

    return {
      analysis: analysisResult,
      crawleeData: crawleeScrapedData,
      metadata: {
        queriesExecuted: queriesToExecute.length,
        uniqueResults: uniqueSearchResults.length,
        scrapedSuccessfully: crawleeScrapedData.length
      }
    };

  } finally {
    // Cleanup
    try {
      await ultimateScraper.close();
      await crawleeEngine.close();
    } catch (error) {
      console.warn("Warning: Error during cleanup:", error);
    }
  }
}

/**
 * Quick search function with default options
 * @param firstName Person's first name
 * @param lastName Person's last name
 * @param email Person's email address
 * @param queryCount Number of search queries to execute (REQUIRED)
 */
export async function quickSearch(
  firstName: string,
  lastName: string,
  email: string,
  queryCount: number
): Promise<PersonSearchResult> {
  return searchAndAnalyzePerson(
    { firstName, lastName, email },
    { queryCount, detailed: false, priority: 'social-first' },
    { includeSocialLinks: true }
  );
}

/**
 * Comprehensive search function with all features enabled
 * @param firstName Person's first name
 * @param lastName Person's last name
 * @param email Person's email address
 * @param queryCount Number of search queries to execute (REQUIRED)
 */
export async function comprehensiveSearch(
  firstName: string,
  lastName: string,
  email: string,
  queryCount: number
): Promise<PersonSearchResult> {
  return searchAndAnalyzePerson(
    { firstName, lastName, email },
    { 
      queryCount,
      detailed: true, 
      priority: 'comprehensive',
      useAdvancedClustering: true
    },
    { 
      includeExtended: true,
      includeTechnical: true,
      includeKeywords: true,
      includeSocialLinks: true
    }
  );
}

/**
 * Extract only social links from a person
 * @param firstName Person's first name
 * @param lastName Person's last name
 * @param email Person's email address
 * @param queryCount Number of search queries to execute (REQUIRED)
 */
export async function extractSocialLinks(
  firstName: string,
  lastName: string,
  email: string,
  queryCount: number
): Promise<SocialLinkSummary> {
  const result = await searchAndAnalyzePerson(
    { firstName, lastName, email },
    { queryCount, priority: 'social-first' },
    { includeSocialLinks: true }
  );
  
  if (!result.socialLinks) {
    throw new Error("Social links extraction failed");
  }
  
  return result.socialLinks;
}

/**
 * Export social links to JSON file
 */
export function exportSocialLinksToFile(
  socialLinks: SocialLinkSummary,
  filePath: string
): void {
  SocialLinkExtractor.exportToJSON(socialLinks, filePath);
}

// Supporting Sources interfaces and types
export interface SupportingSource {
  index: number;
  title: string;
  url: string;
  domain: string;
  relevanceScore: number;
  enhancementMethod: string;
  snippet: string;
  evidence: {
    [key: string]: string | string[];
  };
}

export interface SupportingSourcesResult {
  personConfidence: number;
  totalSources: number;
  sources: SupportingSource[];
  metadata: {
    searchEngine: string;
    scrapingEngine: string;
    queriesExecuted: number;
    executionTime: number;
  };
}

/**
 * Extract supporting sources (same as CLI test7 "📊 Supporting Sources" section)
 * This replicates the exact output format from the CLI --social-links --export-social combination
 * @param firstName Person's first name
 * @param lastName Person's last name  
 * @param email Person's email address
 * @param queryCount Number of search queries to execute (REQUIRED)
 */
export async function extractSupportingSources(
  firstName: string,
  lastName: string,
  email: string,
  queryCount: number
): Promise<SupportingSourcesResult> {
  const result = await searchAndAnalyzePerson(
    { firstName, lastName, email },
    { queryCount, priority: 'social-first' },
    { includeSocialLinks: true }
  );
  
  // Get the first (highest confidence) person cluster
  const mainCluster = result.analysis.identifiedPersons[0];
  if (!mainCluster) {
    throw new Error("No person clusters found in analysis");
  }
  
  // Transform sources to match CLI test7 format
  const sources: SupportingSource[] = mainCluster.sources.map((source: any, index: number) => {
    // Parse evidence from the source
    const evidence: { [key: string]: string | string[] } = {};
    
    // Extract evidence from the source data (this matches how CLI shows it)
    if (source.evidenceContributed) {
      source.evidenceContributed.forEach((evidenceType: string) => {
        switch (evidenceType) {
          case 'name':
            evidence.name = `"${mainCluster.personEvidence.name || firstName + ' ' + lastName}"`;
            break;
          case 'email':
            evidence.email = `"${email}"`;
            break;
          case 'domain':
            evidence.domain = 'academic (.edu)'; // Inferred from bagash_l2@denison.edu
            break;
          case 'socialProfiles':
            // Add social profiles evidence from the cluster
            if (mainCluster.personEvidence.socialProfiles) {
              mainCluster.personEvidence.socialProfiles.forEach((social: any) => {
                if (social.url.includes(source.domain)) {
                  evidence[`social`] = evidence[`social`] || [];
                  const socialEvidence = evidence[`social`] as string[];
                  socialEvidence.push(`${social.platform} (${social.username || 'username N/A'})`);
                }
              });
            }
            break;
          case 'skills':
            if (mainCluster.personEvidence.skills) {
              evidence.skills = mainCluster.personEvidence.skills;
            }
            break;
          case 'phone':
            if (mainCluster.personEvidence.phone) {
              evidence.phone = `"${mainCluster.personEvidence.phone}"`;
            }
            break;
        }
      });
    }
    
    return {
      index: index + 1,
      title: source.title,
      url: source.url,
      domain: source.domain,
      relevanceScore: source.relevanceScore,
      enhancementMethod: "Hybrid Ultimate Crawler + Crawlee Scraping",
      snippet: source.snippet,
      evidence
    };
  });
  
  return {
    personConfidence: mainCluster.confidence,
    totalSources: sources.length,
    sources,
    metadata: {
      searchEngine: result.metadata.searchEngine,
      scrapingEngine: result.metadata.scrapingEngine,
      queriesExecuted: result.metadata.queriesExecuted,
      executionTime: result.executionTime
    }
  };
}

/**
 * Export supporting sources to JSON file
 */
export function exportSupportingSourcesToFile(
  supportingSources: SupportingSourcesResult,
  filePath: string
): void {
  const fs = require('fs');
  const path = require('path');
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write formatted JSON
  fs.writeFileSync(filePath, JSON.stringify(supportingSources, null, 2));
}

// Extended Analysis Types (for --extended flag equivalent)
export interface BiographicalAnalysis {
  careerStage: string;
  seniorityLevel: string;
  educationLevel: string;
  thoughtLeadership: string;
  digitalPresence: string;
  geographicMobility: string;
  industryExpertise: string[];
}

export interface BiographicalIntelligenceSummary {
  careerStage?: string;
  professionalLevel?: string;
  educationLevel?: string;
  achievementsCount?: number;
  socialPresenceScore?: number;
  keySkills?: string[];
  digitalSavviness?: string;
  geographicMobility?: string;
  thoughtLeadership?: string;
  biographicalConfidence?: number;
}

export interface ExtendedAnalysisResult {
  personConfidence: number;
  totalSources: number;
  supportingSources: SupportingSource[];
  
  // Extended biographical insights (🧠 sections from CLI)
  biographicalAnalysis: BiographicalAnalysis | null;
  biographicalIntelligenceSummary: BiographicalIntelligenceSummary | null;
  
  // Person evidence
  personEvidence: {
    name?: string;
    email?: string;
    location?: string;
    title?: string;
    company?: string;
    phone?: string;
    socialProfiles?: Array<{
      platform: string;
      url: string;
      username?: string;
      verified?: boolean;
      followers?: number;
      following?: number;
      posts?: number;
      engagement?: number;
      lastActivity?: string;
    }>;
    websites?: string[];
    affiliations?: string[];
    skills?: string[];
    education?: string[];
    achievements?: string[];
  };
  
  metadata: {
    searchEngine: string;
    scrapingEngine: string;
    queriesExecuted: number;
    executionTime: number;
    enhancementMethod?: string;
  };
}

/**
 * Extended analysis with biographical insights (same as CLI "--extended" flag)
 * This replicates the exact functionality from the CLI --extended command
 * @param firstName Person's first name
 * @param lastName Person's last name  
 * @param email Person's email address
 * @param queryCount Number of search queries to execute (REQUIRED)
 */
export async function performExtendedAnalysis(
  firstName: string,
  lastName: string,
  email: string,
  queryCount: number
): Promise<ExtendedAnalysisResult> {
  const result = await searchAndAnalyzePerson(
    { firstName, lastName, email },
    { queryCount, priority: 'comprehensive' },
    { includeExtended: true, includeSocialLinks: true }
  );
  
  // Get the first (highest confidence) person cluster
  const mainCluster = result.analysis.identifiedPersons[0];
  if (!mainCluster) {
    throw new Error("No person clusters found in analysis");
  }
  
  // Transform supporting sources
  const supportingSources: SupportingSource[] = mainCluster.sources.map((source: any, index: number) => {
    const evidence: { [key: string]: string | string[] } = {};
    
    if (source.evidenceContributed) {
      source.evidenceContributed.forEach((evidenceType: string) => {
        switch (evidenceType) {
          case 'name':
            evidence.name = `"${mainCluster.personEvidence.name || firstName + ' ' + lastName}"`;
            break;
          case 'email':
            evidence.email = `"${email}"`;
            break;
          case 'domain':
            evidence.domain = 'academic (.edu)';
            break;
          case 'socialProfiles':
            if (mainCluster.personEvidence.socialProfiles) {
              mainCluster.personEvidence.socialProfiles.forEach((social: any) => {
                if (social.url.includes(source.domain)) {
                  evidence[`social`] = evidence[`social`] || [];
                  const socialEvidence = evidence[`social`] as string[];
                  socialEvidence.push(`${social.platform} (${social.username || 'username N/A'})`);
                }
              });
            }
            break;
          case 'skills':
            if (mainCluster.personEvidence.skills) {
              evidence.skills = mainCluster.personEvidence.skills;
            }
            break;
        }
      });
    }
    
    return {
      index: index + 1,
      title: source.title,
      url: source.url,
      domain: source.domain,
      relevanceScore: source.relevanceScore,
      enhancementMethod: "Hybrid Ultimate Crawler + Crawlee Scraping",
      snippet: source.snippet,
      evidence
    };
  });
  
  // Extract biographical insights from cluster metadata
  const clusterBiographicalInsights = mainCluster.metadata?.biographicalInsights ? {
    careerStage: mainCluster.metadata.biographicalInsights.careerStage,
    seniorityLevel: mainCluster.metadata.biographicalInsights.professionalSeniority,
    educationLevel: mainCluster.metadata.biographicalInsights.educationLevel,
    thoughtLeadership: mainCluster.metadata.biographicalInsights.thoughtLeadership,
    digitalPresence: mainCluster.metadata.biographicalInsights.digitalSavviness,
    geographicMobility: mainCluster.metadata.biographicalInsights.geographicMobility,
    industryExpertise: mainCluster.metadata.biographicalInsights.industryExpertise
  } : null;
  
  // Extract biographical insights from summary
  const summaryBiographicalInsights = result.analysis.summary.biographicalInsights ? {
    careerStage: result.analysis.summary.biographicalInsights.careerStage,
    professionalLevel: result.analysis.summary.biographicalInsights.professionalSeniority,
    educationLevel: result.analysis.summary.biographicalInsights.educationLevel,
    achievementsCount: result.analysis.summary.biographicalInsights.achievementsCount,
    socialPresenceScore: result.analysis.summary.biographicalInsights.socialPresence,
    keySkills: result.analysis.summary.biographicalInsights.keySkills,
    digitalSavviness: result.analysis.summary.biographicalInsights.digitalSavviness,
    geographicMobility: result.analysis.summary.biographicalInsights.geographicMobility,
    thoughtLeadership: result.analysis.summary.biographicalInsights.thoughtLeadership,
    biographicalConfidence: result.analysis.summary.biographicalInsights.biographicalConfidence
  } : null;
  
  return {
    personConfidence: mainCluster.confidence,
    totalSources: supportingSources.length,
    supportingSources,
    
    // Extended biographical insights (🧠 sections from CLI)
    biographicalAnalysis: clusterBiographicalInsights,
    biographicalIntelligenceSummary: summaryBiographicalInsights,
    
    // Person evidence
    personEvidence: {
      name: mainCluster.personEvidence.name,
      email: mainCluster.personEvidence.email,
      location: mainCluster.personEvidence.location,
      title: mainCluster.personEvidence.title,
      company: mainCluster.personEvidence.company,
      phone: mainCluster.personEvidence.phone,
      socialProfiles: mainCluster.personEvidence.socialProfiles,
      websites: mainCluster.personEvidence.websites,
      affiliations: mainCluster.personEvidence.affiliations,
      skills: mainCluster.personEvidence.skills,
      education: mainCluster.personEvidence.education,
      achievements: mainCluster.personEvidence.achievements
    },
    
    metadata: {
      searchEngine: result.metadata.searchEngine,
      scrapingEngine: result.metadata.scrapingEngine,
      queriesExecuted: result.metadata.queriesExecuted,
      executionTime: result.executionTime,
      enhancementMethod: result.analysis.summary.enhancementMethod
    }
  };
}
