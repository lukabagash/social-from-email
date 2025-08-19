import { EnhancedWebScraper } from '../web-scraper/enhanced-scraper';
import { EnhancedGoogleSearchScraper } from '../google-search/enhanced-scraper';
import { EnhancedLinkedInScraper } from '../linkedin/enhanced-scraper';
import { SiteFinder } from '../site-discovery/site-finder';
import * as fs from 'fs';
import * as path from 'path';

export interface EnhancedOSINTResult {
  timestamp: string;
  query: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  confidence: {
    overall: number;
    name: number;
    social: number;
    professional: number;
    contact: number;
  };
  summary: {
    mostLikelyName: string;
    primaryOccupation?: string;
    primaryLocation?: string;
    primaryCompany?: string;
    socialMediaPresence: string[];
    professionalNetworks: string[];
    contactMethods: string[];
    verificationLevel: 'high' | 'medium' | 'low' | 'unverified';
  };
  sources: {
    googleResults: any[];
    linkedinProfiles: any[];
    socialMedia: any[];
    professionalSites: any[];
    contactInfo: any[];
    additionalSites: any[];
  };
  analysis: {
    nameVariations: string[];
    locations: string[];
    companies: string[];
    jobTitles: string[];
    skills: string[];
    interests: string[];
    connections: string[];
    timelineEvents: Array<{
      date?: string;
      event: string;
      source: string;
      confidence: number;
    }>;
  };
  clusters: {
    profileClusters: any[];
    contentClusters: any[];
    relationshipClusters: any[];
  };
  metadata: {
    searchDuration: number;
    totalSources: number;
    uniqueUrls: number;
    processingTime: number;
    enhancedFeatures: string[];
  };
}

export interface EnhancedOSINTOptions {
  maxDepth?: number;
  maxResults?: number;
  includeDeepAnalysis?: boolean;
  includeSocialMedia?: boolean;
  includeLinkedIn?: boolean;
  includeProfessionalSites?: boolean;
  includeContactDiscovery?: boolean;
  enableClustering?: boolean;
  enableNLP?: boolean;
  humanBehavior?: boolean;
  randomizeFingerprints?: boolean;
  useAdvancedDetection?: boolean;
  timeout?: number;
  exportResults?: boolean;
  exportPath?: string;
}

export class EnhancedOSINTAnalyzer {
  private webScraper: EnhancedWebScraper;
  private googleScraper: EnhancedGoogleSearchScraper;
  private linkedinScraper: EnhancedLinkedInScraper;

  constructor() {
    this.webScraper = new EnhancedWebScraper();
    this.googleScraper = new EnhancedGoogleSearchScraper();
    this.linkedinScraper = new EnhancedLinkedInScraper();
  }

  async setup(): Promise<void> {
    console.log('🚀 Initializing Enhanced OSINT Analyzer...');
    
    await Promise.all([
      this.webScraper.setup(),
      this.googleScraper.setup(),
      this.linkedinScraper.setup(),
    ]);

    console.log('✅ Enhanced OSINT Analyzer ready');
  }

  async close(): Promise<void> {
    await Promise.all([
      this.webScraper.close(),
      this.googleScraper.close(),
      this.linkedinScraper.close(),
    ]);
  }

  async analyzePersonComprehensive(
    firstName: string,
    lastName: string,
    email?: string,
    options: EnhancedOSINTOptions = {}
  ): Promise<EnhancedOSINTResult> {
    const startTime = Date.now();
    console.log(`🔍 Starting Enhanced OSINT Analysis for: ${firstName} ${lastName}`);
    if (email) console.log(`📧 Email: ${email}`);

    const {
      maxDepth = 3,
      maxResults = 50,
      includeDeepAnalysis = true,
      includeSocialMedia = true,
      includeLinkedIn = true,
      includeProfessionalSites = true,
      includeContactDiscovery = true,
      enableClustering = true,
      enableNLP = true,
      humanBehavior = true,
      randomizeFingerprints = true,
      useAdvancedDetection = true,
      timeout = 60000,
      exportResults = false,
      exportPath = './exports',
    } = options;

    const result: EnhancedOSINTResult = {
      timestamp: new Date().toISOString(),
      query: { firstName, lastName, email },
      confidence: {
        overall: 0,
        name: 0,
        social: 0,
        professional: 0,
        contact: 0,
      },
      summary: {
        mostLikelyName: `${firstName} ${lastName}`,
        socialMediaPresence: [],
        professionalNetworks: [],
        contactMethods: [],
        verificationLevel: 'unverified',
      },
      sources: {
        googleResults: [],
        linkedinProfiles: [],
        socialMedia: [],
        professionalSites: [],
        contactInfo: [],
        additionalSites: [],
      },
      analysis: {
        nameVariations: [],
        locations: [],
        companies: [],
        jobTitles: [],
        skills: [],
        interests: [],
        connections: [],
        timelineEvents: [],
      },
      clusters: {
        profileClusters: [],
        contentClusters: [],
        relationshipClusters: [],
      },
      metadata: {
        searchDuration: 0,
        totalSources: 0,
        uniqueUrls: 0,
        processingTime: 0,
        enhancedFeatures: [],
      },
    };

    try {
      // Phase 1: Enhanced Google Search
      console.log('📍 Phase 1: Enhanced Google Search Analysis');
      const googleOptions = {
        maxResults: maxResults,
        includeSnippets: true,
        humanBehavior,
        randomizeViewport: randomizeFingerprints,
        blockResources: useAdvancedDetection,
        timeout,
      };

      const googleResults = await this.googleScraper.searchPersonWithVariations(
        firstName,
        lastName,
        email,
        googleOptions
      );

      result.sources.googleResults = googleResults;
      result.metadata.enhancedFeatures.push('Advanced Google Search');
      console.log(`   ✅ Found ${googleResults.length} Google results`);

      // Phase 2: Enhanced LinkedIn Search
      if (includeLinkedIn) {
        console.log('📍 Phase 2: Enhanced LinkedIn Analysis');
        try {
          const linkedinOptions = {
            maxResults: Math.min(maxResults, 20),
            includeDetails: includeDeepAnalysis,
            humanBehavior,
            randomizeViewport: randomizeFingerprints,
            blockResources: useAdvancedDetection,
            timeout,
          };

          const linkedinProfiles = await this.linkedinScraper.searchPersonLinkedIn(
            firstName,
            lastName,
            linkedinOptions
          );

          result.sources.linkedinProfiles = linkedinProfiles;
          result.metadata.enhancedFeatures.push('Enhanced LinkedIn Search');
          console.log(`   ✅ Found ${linkedinProfiles.length} LinkedIn profiles`);
        } catch (error) {
          console.warn('⚠️ LinkedIn search failed:', error);
        }
      }

      // Phase 3: Basic Site Discovery
      console.log('📍 Phase 3: Basic Site Discovery');
      try {
        // Simulate basic site discovery by extracting domains from Google results
        const discoveredSites = googleResults.map(result => ({
          url: result.url,
          domain: result.domain,
          platform: this.detectPlatform(result.url),
          source: 'google_search',
        })).filter(site => site.platform);

        // Categorize discovered sites
        for (const site of discoveredSites) {
          if (site.platform) {
            const platform = site.platform.toLowerCase();
            if (['facebook', 'twitter', 'instagram', 'tiktok', 'snapchat'].includes(platform)) {
              result.sources.socialMedia.push(site);
            } else if (['linkedin', 'github', 'behance', 'dribbble'].includes(platform)) {
              result.sources.professionalSites.push(site);
            } else {
              result.sources.additionalSites.push(site);
            }
          }
        }

        result.metadata.enhancedFeatures.push('Basic Site Discovery');
        console.log(`   ✅ Discovered ${discoveredSites.length} potential sites`);
      } catch (error) {
        console.warn('⚠️ Site discovery failed:', error);
      }

      // Phase 4: Enhanced Deep Web Scraping
      if (includeDeepAnalysis) {
        console.log('📍 Phase 4: Enhanced Deep Web Scraping');
        const urlsToScrape = [
          ...googleResults.map(r => r.url),
          ...result.sources.linkedinProfiles.map(p => p.profileUrl),
          ...result.sources.socialMedia.map(s => s.url),
          ...result.sources.professionalSites.map(p => p.url),
          ...result.sources.additionalSites.map(a => a.url),
        ].filter(Boolean).slice(0, maxResults);

        const uniqueUrls = [...new Set(urlsToScrape)];
        result.metadata.uniqueUrls = uniqueUrls.length;

        let scrapedCount = 0;
        for (const url of uniqueUrls.slice(0, Math.min(20, maxResults))) {
          try {
            console.log(`   🌐 Scraping ${scrapedCount + 1}/${Math.min(20, uniqueUrls.length)}: ${url.substring(0, 50)}...`);
            
            const scrapedData = await this.webScraper.scrapeWebsite(url);

            if (scrapedData) {
              // Extract relevant information for analysis
              const relevantContent = this.extractRelevantContent(scrapedData, firstName, lastName);
              if (relevantContent) {
                result.sources.additionalSites.push({
                  url,
                  content: relevantContent,
                  scrapedAt: new Date().toISOString(),
                });
              }
              scrapedCount++;
            }

            // Add delay between scrapes
            if (scrapedCount < uniqueUrls.length) {
              await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
            }
          } catch (error) {
            console.warn(`   ⚠️ Failed to scrape ${url}:`, error);
          }
        }

        result.metadata.enhancedFeatures.push('Enhanced Deep Web Scraping');
        console.log(`   ✅ Successfully scraped ${scrapedCount} sites`);
      }

      // Phase 5: Basic Text Analysis
      if (enableNLP) {
        console.log('📍 Phase 5: Basic Text Analysis');
        const allText = this.extractAllText(result);
        
        try {
          // Simple keyword extraction
          const words = allText.toLowerCase().split(/\s+/);
          const wordCount = new Map<string, number>();
          
          words.forEach(word => {
            if (word.length > 3) {
              wordCount.set(word, (wordCount.get(word) || 0) + 1);
            }
          });
          
          // Extract most common words as keywords
          const commonWords = Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word]) => word);
          
          // Simple entity extraction based on patterns
          const companyPattern = /(?:at|@|works? at|employed by)\s+([A-Z][a-zA-Z\s]+)/gi;
          const locationPattern = /(?:in|from|located in|based in)\s+([A-Z][a-zA-Z\s,]+)/gi;
          
          let match;
          while ((match = companyPattern.exec(allText)) !== null) {
            if (match[1] && match[1].trim().length > 2) {
              result.analysis.companies.push(match[1].trim());
            }
          }
          
          while ((match = locationPattern.exec(allText)) !== null) {
            if (match[1] && match[1].trim().length > 2) {
              result.analysis.locations.push(match[1].trim());
            }
          }
          
          // Remove duplicates
          result.analysis.companies = [...new Set(result.analysis.companies)];
          result.analysis.locations = [...new Set(result.analysis.locations)];
          result.analysis.skills = commonWords.slice(0, 10);

          result.metadata.enhancedFeatures.push('Basic Text Analysis');
          console.log(`   ✅ Extracted ${commonWords.length} keywords and ${result.analysis.companies.length + result.analysis.locations.length} entities`);
        } catch (error) {
          console.warn('⚠️ Text analysis failed:', error);
        }
      }

      // Phase 6: Basic Clustering Analysis
      if (enableClustering) {
        console.log('📍 Phase 6: Basic Clustering Analysis');
        try {
          const clusteringData = this.prepareClusteringData(result);
          
          // Simple clustering based on domain similarity
          const profileClusters = this.simpleClusterProfiles(clusteringData.profiles);
          const contentClusters = this.simpleClusterContent(clusteringData.content);
          
          result.clusters.profileClusters = profileClusters;
          result.clusters.contentClusters = contentClusters;

          result.metadata.enhancedFeatures.push('Basic Clustering');
          console.log(`   ✅ Generated ${profileClusters.length} profile clusters and ${contentClusters.length} content clusters`);
        } catch (error) {
          console.warn('⚠️ Clustering analysis failed:', error);
        }
      }

      // Phase 7: Confidence Assessment & Summary Generation
      console.log('📍 Phase 7: Confidence Assessment & Summary Generation');
      this.calculateConfidenceScores(result);
      this.generateSummary(result);

      // Phase 8: Export Results
      if (exportResults) {
        console.log('📍 Phase 8: Exporting Results');
        await this.exportResults(result, exportPath);
      }

      // Calculate metadata
      const endTime = Date.now();
      result.metadata.searchDuration = endTime - startTime;
      result.metadata.processingTime = endTime - startTime;
      result.metadata.totalSources = Object.values(result.sources).flat().length;

      console.log(`🎯 Enhanced OSINT Analysis Complete!`);
      console.log(`   ⏱️  Duration: ${Math.round(result.metadata.searchDuration / 1000)}s`);
      console.log(`   📊 Total Sources: ${result.metadata.totalSources}`);
      console.log(`   🎯 Overall Confidence: ${result.confidence.overall}%`);
      console.log(`   ✨ Enhanced Features: ${result.metadata.enhancedFeatures.join(', ')}`);

      return result;

    } catch (error) {
      console.error('❌ Enhanced OSINT Analysis failed:', error);
      throw error;
    }
  }

  private extractRelevantContent(scrapedData: any, firstName: string, lastName: string): any {
    if (!scrapedData?.content) return null;

    const content = scrapedData.content.toLowerCase();
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();

    // Check if content is relevant to the person
    if (content.includes(fullName) || 
        (content.includes(firstNameLower) && content.includes(lastNameLower))) {
      return {
        title: scrapedData.title,
        description: scrapedData.description,
        content: scrapedData.content,
        metadata: scrapedData.metadata,
        relevanceScore: this.calculateRelevanceScore(content, firstName, lastName),
      };
    }

    return null;
  }

  private calculateRelevanceScore(content: string, firstName: string, lastName: string): number {
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const contentLower = content.toLowerCase();
    
    let score = 0;
    
    // Full name mentions (highest weight)
    const fullNameMatches = (contentLower.match(new RegExp(fullName, 'g')) || []).length;
    score += fullNameMatches * 10;
    
    // Individual name mentions
    const firstNameMatches = (contentLower.match(new RegExp(firstName.toLowerCase(), 'g')) || []).length;
    const lastNameMatches = (contentLower.match(new RegExp(lastName.toLowerCase(), 'g')) || []).length;
    score += (firstNameMatches + lastNameMatches) * 2;
    
    // Professional keywords
    const professionalKeywords = ['work', 'job', 'career', 'company', 'position', 'role', 'experience'];
    for (const keyword of professionalKeywords) {
      if (contentLower.includes(keyword)) score += 1;
    }
    
    // Contact keywords
    const contactKeywords = ['email', 'phone', 'contact', 'address', 'linkedin', 'twitter'];
    for (const keyword of contactKeywords) {
      if (contentLower.includes(keyword)) score += 2;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  private extractAllText(result: EnhancedOSINTResult): string {
    const texts: string[] = [];
    
    // Extract from Google results
    result.sources.googleResults.forEach(r => {
      if (r.title) texts.push(r.title);
      if (r.snippet) texts.push(r.snippet);
    });
    
    // Extract from LinkedIn profiles
    result.sources.linkedinProfiles.forEach(p => {
      if (p.name) texts.push(p.name);
      if (p.title) texts.push(p.title);
      if (p.company) texts.push(p.company);
      if (p.summary) texts.push(p.summary);
    });
    
    // Extract from scraped content
    result.sources.additionalSites.forEach(s => {
      if (s.content?.content) texts.push(s.content.content);
      if (s.content?.title) texts.push(s.content.title);
      if (s.content?.description) texts.push(s.content.description);
    });
    
    return texts.join(' ');
  }

  private prepareClusteringData(result: EnhancedOSINTResult): any {
    return {
      profiles: [
        ...result.sources.linkedinProfiles,
        ...result.sources.socialMedia,
        ...result.sources.professionalSites,
      ],
      content: [
        ...result.sources.googleResults,
        ...result.sources.additionalSites.map(s => s.content).filter(Boolean),
      ],
    };
  }

  private calculateConfidenceScores(result: EnhancedOSINTResult): void {
    // Name confidence
    const nameMatches = result.sources.googleResults.filter(r => 
      r.title.toLowerCase().includes(result.query.firstName.toLowerCase()) &&
      r.title.toLowerCase().includes(result.query.lastName.toLowerCase())
    ).length;
    result.confidence.name = Math.min((nameMatches / 10) * 100, 100);

    // Social confidence
    result.confidence.social = Math.min((result.sources.socialMedia.length / 5) * 100, 100);

    // Professional confidence
    result.confidence.professional = Math.min((result.sources.linkedinProfiles.length / 3) * 100, 100);

    // Contact confidence
    const contactSources = result.sources.contactInfo.length + 
                          (result.query.email ? 1 : 0) +
                          result.sources.linkedinProfiles.length;
    result.confidence.contact = Math.min((contactSources / 5) * 100, 100);

    // Overall confidence (weighted average)
    result.confidence.overall = Math.round(
      (result.confidence.name * 0.3 +
       result.confidence.social * 0.2 +
       result.confidence.professional * 0.3 +
       result.confidence.contact * 0.2)
    );
  }

  private generateSummary(result: EnhancedOSINTResult): void {
    // Most likely name (from LinkedIn or most frequent)
    if (result.sources.linkedinProfiles.length > 0) {
      result.summary.mostLikelyName = result.sources.linkedinProfiles[0].name;
    }

    // Primary occupation
    const titles = result.sources.linkedinProfiles.map(p => p.title).filter(Boolean);
    if (titles.length > 0) {
      result.summary.primaryOccupation = titles[0];
    }

    // Primary company
    const companies = result.sources.linkedinProfiles.map(p => p.company).filter(Boolean);
    if (companies.length > 0) {
      result.summary.primaryCompany = companies[0];
    }

    // Primary location
    const locations = result.sources.linkedinProfiles.map(p => p.location).filter(Boolean);
    if (locations.length > 0) {
      result.summary.primaryLocation = locations[0];
    }

    // Social media presence
    result.summary.socialMediaPresence = result.sources.socialMedia.map(s => s.platform || 'Unknown').filter(Boolean);

    // Professional networks
    result.summary.professionalNetworks = result.sources.professionalSites.map(p => p.platform || 'LinkedIn').filter(Boolean);

    // Contact methods
    result.summary.contactMethods = [];
    if (result.query.email) result.summary.contactMethods.push('Email');
    if (result.sources.linkedinProfiles.length > 0) result.summary.contactMethods.push('LinkedIn');

    // Verification level
    if (result.confidence.overall >= 80) {
      result.summary.verificationLevel = 'high';
    } else if (result.confidence.overall >= 60) {
      result.summary.verificationLevel = 'medium';
    } else if (result.confidence.overall >= 40) {
      result.summary.verificationLevel = 'low';
    } else {
      result.summary.verificationLevel = 'unverified';
    }
  }

  private async exportResults(result: EnhancedOSINTResult, exportPath: string): Promise<void> {
    try {
      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }

      const fileName = `enhanced-osint-${result.query.firstName}-${result.query.lastName}-${Date.now()}.json`;
      const filePath = path.join(exportPath, fileName);

      fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
      console.log(`📁 Results exported to: ${filePath}`);
    } catch (error) {
      console.error('❌ Failed to export results:', error);
    }
  }

  private detectPlatform(url: string): string | null {
    const domain = url.toLowerCase();
    
    if (domain.includes('linkedin.com')) return 'LinkedIn';
    if (domain.includes('facebook.com')) return 'Facebook';
    if (domain.includes('twitter.com') || domain.includes('x.com')) return 'Twitter';
    if (domain.includes('instagram.com')) return 'Instagram';
    if (domain.includes('github.com')) return 'GitHub';
    if (domain.includes('youtube.com')) return 'YouTube';
    if (domain.includes('tiktok.com')) return 'TikTok';
    if (domain.includes('snapchat.com')) return 'Snapchat';
    if (domain.includes('behance.net')) return 'Behance';
    if (domain.includes('dribbble.com')) return 'Dribbble';
    
    return null;
  }

  private simpleClusterProfiles(profiles: any[]): any[] {
    // Simple clustering by platform/domain
    const clusters = new Map<string, any[]>();
    
    for (const profile of profiles) {
      const platform = profile.platform || 'unknown';
      if (!clusters.has(platform)) {
        clusters.set(platform, []);
      }
      clusters.get(platform)!.push(profile);
    }
    
    return Array.from(clusters.entries()).map(([platform, items]) => ({
      type: 'platform',
      name: platform,
      items,
      size: items.length,
    }));
  }

  private simpleClusterContent(content: any[]): any[] {
    // Simple clustering by content type or domain
    const clusters = new Map<string, any[]>();
    
    for (const item of content) {
      let category = 'general';
      
      if (item.url) {
        const domain = new URL(item.url).hostname;
        category = domain;
      } else if (item.title) {
        if (item.title.toLowerCase().includes('linkedin')) category = 'professional';
        else if (item.title.toLowerCase().includes('facebook')) category = 'social';
        else if (item.title.toLowerCase().includes('twitter')) category = 'social';
      }
      
      if (!clusters.has(category)) {
        clusters.set(category, []);
      }
      clusters.get(category)!.push(item);
    }
    
    return Array.from(clusters.entries()).map(([category, items]) => ({
      type: 'content',
      name: category,
      items,
      size: items.length,
    }));
  }
}
