import { GoogleSearchResult } from '../google-search/scraper';
import { ScrapedData } from '../web-scraper/general-scraper';
import { SiteDiscoveryEngine } from '../site-discovery/site-finder';
import { AdvancedInfoExtractor, ExtractedKeywords } from '../advanced-nlp/keyword-extractor';
import { EnhancedKeywordExtractor, PersonBio } from '../advanced-nlp/enhanced-keyword-extractor';
import { AdvancedPersonClusterer, ClusteringResult } from '../advanced-clustering/advanced-clusterer';

export interface PersonEvidence {
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
  }>;
  websites?: string[];
  affiliations?: string[];
  skills?: string[];
  education?: string[];
  achievements?: string[];
}

export interface PersonCluster {
  confidence: number; // 0-100
  personEvidence: PersonEvidence;
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
    domain: string;
    evidenceContributed: string[];
    relevanceScore: number;
  }>;
  potentialVariations: string[]; // Different name variations found
  metadata?: {
    biographicalInsights?: {
      careerStage: string;
      industryExpertise: string[];
      thoughtLeadership: string;
      digitalSavviness: string;
      professionalSeniority: string;
      educationLevel: string;
      geographicMobility: string;
    };
    [key: string]: any;
  };
}

export interface PersonAnalysisResult {
  inputPerson: {
    firstName: string;
    lastName: string;
    email: string;
  };
  identifiedPersons: PersonCluster[];
  advancedClustering?: ClusteringResult; // Enhanced clustering results
  siteDiscovery: {
    discoveredSites: string[];
    searchedPlatforms: string[];
    linkedinSnippet?: string; // LinkedIn description from Google search
  };
  keywordAnalysis: {
    extractedKeywords: ExtractedKeywords[];
    topKeywords: string[];
    identifiedTopics: string[];
  };
  summary: {
    totalSources: number;
    highConfidencePersons: number; // confidence > 70
    mediumConfidencePersons: number; // confidence 40-70
    lowConfidencePersons: number; // confidence < 40
    topDomains: Array<{ domain: string; count: number }>;
    biographicalInsights?: {
      careerStage?: string;
      professionalSeniority?: string;
      industryExpertise?: string[];
      educationLevel?: string;
      thoughtLeadership?: string;
      digitalSavviness?: string;
      geographicMobility?: string;
      keySkills?: string[];
      achievementsCount?: number;
      educationInstitutions?: number;
      socialPresence?: number;
      biographicalConfidence?: number;
    };
    enhancementMethod?: string;
  };
  analysis: {
    likelyIsSamePerson: boolean;
    mainPersonConfidence: number;
    reasonsForMultiplePeople: string[];
    recommendedActions: string[];
    clusteringMethod: 'basic' | 'advanced_clustering';
    advancedInsights?: {
      strongestEvidenceTypes: string[];
      crossPlatformConsistency: number; // 0-1
      temporalConsistency: number; // 0-1
      professionalCoherence: number; // 0-1
    };
  };
}

export class PersonAnalyzer {
  private targetFirstName: string;
  private targetLastName: string;
  private targetEmail: string;
  private advancedInfoExtractor: AdvancedInfoExtractor;
  private enhancedKeywordExtractor: EnhancedKeywordExtractor;

  constructor(firstName: string, lastName: string, email: string) {
    this.targetFirstName = firstName.toLowerCase();
    this.targetLastName = lastName.toLowerCase();
    this.targetEmail = email.toLowerCase();
    this.advancedInfoExtractor = new AdvancedInfoExtractor();
    this.enhancedKeywordExtractor = new EnhancedKeywordExtractor();
  }

  // Main analysis method
  public analyzePersons(searchResults: GoogleSearchResult[], scrapedData: ScrapedData[]): PersonAnalysisResult {
    console.log(`\n🔍 ENHANCED PERSON ANALYSIS: ${this.targetFirstName} ${this.targetLastName} (${this.targetEmail})`);
    console.log(`${'='.repeat(80)}`);

    // Step 1: Site Discovery - find LinkedIn snippet and other discovered sites
    const siteDiscovery = this.performSiteDiscovery(searchResults);
    
    // Step 2: Advanced Keyword Extraction for each source
    console.log('🔤 Extracting keywords and analyzing content...');
    const extractedKeywords = this.extractAdvancedKeywords(searchResults, scrapedData);
    const keywordAnalysis = this.analyzeKeywords(extractedKeywords);
    
    // Step 2.5: Enhanced Biographical Profiling
    console.log('🧠 Extracting enhanced biographical profiles...');
    const personalBios = this.extractPersonalBios(searchResults, scrapedData);
    const consolidatedBio = this.enhancedKeywordExtractor.analyzePersonBioComprehensively(personalBios);
    
    // Step 3: Perform enhanced clustering using biographical dimensions
    console.log('🤖 Performing enhanced clustering with biographical dimensions...');
    
    // Enhanced clustering using biographical data as dimensions
    const allEvidence = this.extractEvidenceFromSources(searchResults, scrapedData);
    
    // Convert allEvidence to enhanced format
    const enhancedEvidenceInput = allEvidence.map(item => ({
      evidence: item.evidence,
      source: item.source.url,
      sourceType: (item.source.domain.includes('linkedin') || item.source.domain.includes('facebook') ? 'scraped' : 'search') as 'search' | 'scraped',
      originalSource: item.source // Keep original source data
    }));
    
    const enhancedEvidence = this.enrichEvidenceWithBiographicalData(enhancedEvidenceInput, personalBios);
    const personClusters = this.clusterEvidenceWithBiographicalDimensions(enhancedEvidence, consolidatedBio);
    const rankedClusters = this.calculateEnhancedConfidenceScores(personClusters, consolidatedBio);
    
    // Step 4: Generate enhanced analysis with biographical insights
    const analysis = this.generateAdvancedAnalysis(rankedClusters, undefined, 'advanced_clustering');
    
    // Step 5: Create enhanced summary with bio insights
    const summary = this.createEnhancedSummary(searchResults, rankedClusters, consolidatedBio);

    return {
      inputPerson: {
        firstName: this.targetFirstName,
        lastName: this.targetLastName,
        email: this.targetEmail
      },
      identifiedPersons: rankedClusters,
      siteDiscovery,
      keywordAnalysis,
      summary,
      analysis
    };
  }

  private performSiteDiscovery(searchResults: GoogleSearchResult[]): {
    discoveredSites: string[];
    searchedPlatforms: string[];
    linkedinSnippet?: string;
  } {
    const discoveredSites: string[] = [];
    const searchedPlatforms = SiteDiscoveryEngine.getSearchSites('all');
    let linkedinSnippet: string | undefined;
    
    // Find LinkedIn snippet (but don't scrape)
    const linkedinResult = searchResults.find(result => result.domain.includes('linkedin.com'));
    if (linkedinResult) {
      linkedinSnippet = linkedinResult.snippet;
      console.log(`📋 LinkedIn snippet captured: "${linkedinSnippet.substring(0, 100)}..."`);
    }
    
    // Discover unique domains
    const domains = [...new Set(searchResults.map(result => result.domain))];
    discoveredSites.push(...domains);
    
    return {
      discoveredSites,
      searchedPlatforms,
      linkedinSnippet
    };
  }

  private extractAdvancedKeywords(searchResults: GoogleSearchResult[], scrapedData: ScrapedData[]): ExtractedKeywords[] {
    const extractedKeywords: ExtractedKeywords[] = [];
    
    for (let i = 0; i < searchResults.length; i++) {
      const searchResult = searchResults[i];
      const scraped = scrapedData.find(data => data.url === searchResult.url);
      
      const keywords = this.advancedInfoExtractor.extractKeywordInfo(
        searchResult.title,
        searchResult.snippet,
        scraped?.content.paragraphs.join(' ') || '',
        searchResult.url,
        this.targetFirstName,
        this.targetLastName,
        this.targetEmail
      );
      
      extractedKeywords.push(keywords);
    }
    
    return extractedKeywords;
  }

  private analyzeKeywords(extractedKeywords: ExtractedKeywords[]): {
    extractedKeywords: ExtractedKeywords[];
    topKeywords: string[];
    identifiedTopics: string[];
  } {
    // Combine all keywords
    const allTopics = new Set<string>();
    const allKeywords = new Set<string>();
    
    extractedKeywords.forEach(keywords => {
      keywords.topics.forEach(topic => allTopics.add(topic));
      keywords.keyPhrases.forEach(phrase => allKeywords.add(phrase));
      keywords.skills.forEach(skill => allKeywords.add(skill));
      keywords.companies.forEach(company => allKeywords.add(company));
    });
    
    // Get top keywords by frequency
    const keywordFreq: { [key: string]: number } = {};
    extractedKeywords.forEach(keywords => {
      [...keywords.keyPhrases, ...keywords.skills, ...keywords.topics].forEach(keyword => {
        keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
      });
    });
    
    const topKeywords = Object.entries(keywordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([keyword]) => keyword);
    
    return {
      extractedKeywords,
      topKeywords,
      identifiedTopics: Array.from(allTopics).slice(0, 10)
    };
  }

  private extractEvidenceFromSources(searchResults: GoogleSearchResult[], scrapedData: ScrapedData[]): Array<{
    source: {
      url: string;
      title: string;
      snippet: string;
      domain: string;
    };
    evidence: PersonEvidence;
    relevanceScore: number;
  }> {
    const evidenceList: Array<{
      source: {
        url: string;
        title: string;
        snippet: string;
        domain: string;
      };
      evidence: PersonEvidence;
      relevanceScore: number;
    }> = [];

    for (let i = 0; i < searchResults.length; i++) {
      const searchResult = searchResults[i];
      const scrapedInfo = scrapedData.find(data => data.url === searchResult.url);
      
      // Skip LinkedIn for scraping but keep for evidence from snippets
      if (searchResult.domain.includes('linkedin.com')) {
        console.log(`⏭️  Skipping LinkedIn scraping, using snippet: ${searchResult.url}`);
        
        // Extract evidence from LinkedIn snippet only
        const evidence = this.extractEvidenceFromSearchResult(searchResult);
        const relevanceScore = this.calculateSourceRelevance(searchResult, undefined, evidence);

        evidenceList.push({
          source: {
            url: searchResult.url,
            title: searchResult.title,
            snippet: searchResult.snippet,
            domain: searchResult.domain
          },
          evidence,
          relevanceScore
        });
        continue;
      }

      const evidence = this.extractEvidenceFromSource(searchResult, scrapedInfo);
      const relevanceScore = this.calculateSourceRelevance(searchResult, scrapedInfo, evidence);

      evidenceList.push({
        source: {
          url: searchResult.url,
          title: searchResult.title,
          snippet: searchResult.snippet,
          domain: searchResult.domain
        },
        evidence,
        relevanceScore
      });
    }

    return evidenceList;
  }

  private extractEvidenceFromSearchResult(searchResult: GoogleSearchResult): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract from search snippet only (for LinkedIn)
    if (searchResult.snippet) {
      evidence.name = this.extractNameFromText(searchResult.snippet);
      evidence.email = this.extractEmailFromText(searchResult.snippet);
      evidence.title = this.extractTitleFromText(searchResult.snippet);
      evidence.company = this.extractCompanyFromText(searchResult.snippet);
      evidence.location = this.extractLocationFromText(searchResult.snippet);
    }

    // Extract from search title
    if (searchResult.title) {
      const nameFromTitle = this.extractNameFromText(searchResult.title);
      if (nameFromTitle && !evidence.name) {
        evidence.name = nameFromTitle;
      }
      
      const titleFromTitle = this.extractTitleFromText(searchResult.title);
      if (titleFromTitle && !evidence.title) {
        evidence.title = titleFromTitle;
      }
    }

    return evidence;
  }

  private extractEvidenceFromSource(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract from search snippet
    if (searchResult.snippet) {
      evidence.name = this.extractNameFromText(searchResult.snippet);
      evidence.email = this.extractEmailFromText(searchResult.snippet);
      evidence.title = this.extractTitleFromText(searchResult.snippet);
      evidence.company = this.extractCompanyFromText(searchResult.snippet);
      evidence.location = this.extractLocationFromText(searchResult.snippet);
    }

    // Extract from search title
    if (searchResult.title) {
      const nameFromTitle = this.extractNameFromText(searchResult.title);
      if (nameFromTitle && !evidence.name) {
        evidence.name = nameFromTitle;
      }
      
      const titleFromTitle = this.extractTitleFromText(searchResult.title);
      if (titleFromTitle && !evidence.title) {
        evidence.title = titleFromTitle;
      }
    }

    // Extract from scraped data if available
    if (scrapedData) {
      // Get additional emails
      if (scrapedData.content.contactInfo.emails.length > 0) {
        const relevantEmails = scrapedData.content.contactInfo.emails.filter(email => 
          this.isEmailRelevant(email)
        );
        if (relevantEmails.length > 0) {
          evidence.email = relevantEmails[0]; // Take the most relevant one
        }
      }

      // Get phone numbers
      if (scrapedData.content.contactInfo.phones.length > 0) {
        evidence.phone = scrapedData.content.contactInfo.phones[0];
      }

      // Get social profiles
      if (scrapedData.content.contactInfo.socialLinks.length > 0) {
        evidence.socialProfiles = scrapedData.content.contactInfo.socialLinks.map(link => ({
          platform: link.platform,
          url: link.url,
          username: this.extractUsernameFromUrl(link.url)
        }));
      }

      // Extract additional information from page content
      const pageText = scrapedData.content.paragraphs.join(' ');
      
      // Try to find more detailed information
      if (!evidence.name && pageText) {
        evidence.name = this.extractNameFromText(pageText);
      }
      
      if (!evidence.title && pageText) {
        evidence.title = this.extractTitleFromText(pageText);
      }
      
      if (!evidence.company && pageText) {
        evidence.company = this.extractCompanyFromText(pageText);
      }

      // Extract skills from headings and content
      evidence.skills = this.extractSkillsFromContent(scrapedData);
      
      // Extract education information
      evidence.education = this.extractEducationFromContent(scrapedData);
      
      // Extract affiliations
      evidence.affiliations = this.extractAffiliationsFromContent(scrapedData);
    }

    return evidence;
  }

  private calculateSourceRelevance(searchResult: GoogleSearchResult, scrapedData?: ScrapedData, evidence?: PersonEvidence): number {
    let score = 0;
    
    // Base score for having basic information
    score += 10;
    
    // Name matching in title or snippet
    const nameInTitle = this.containsTargetName(searchResult.title);
    const nameInSnippet = this.containsTargetName(searchResult.snippet);
    
    if (nameInTitle) score += 30;
    if (nameInSnippet) score += 20;
    
    // Email matching
    const emailInTitle = searchResult.title.toLowerCase().includes(this.targetEmail);
    const emailInSnippet = searchResult.snippet.toLowerCase().includes(this.targetEmail);
    
    if (emailInTitle) score += 40;
    if (emailInSnippet) score += 30;
    
    // Domain trust score
    const domainScore = this.getDomainTrustScore(searchResult.domain);
    score += domainScore;
    
    // Evidence quality score
    if (evidence) {
      if (evidence.email && this.isEmailRelevant(evidence.email)) score += 25;
      if (evidence.name && this.isNameRelevant(evidence.name)) score += 20;
      if (evidence.title) score += 10;
      if (evidence.company) score += 10;
      if (evidence.phone) score += 15;
      if (evidence.socialProfiles && evidence.socialProfiles.length > 0) score += 15;
    }
    
    // Scraped data richness
    if (scrapedData) {
      if (scrapedData.content.contactInfo.emails.length > 0) score += 10;
      if (scrapedData.content.contactInfo.socialLinks.length > 0) score += 10;
      if (scrapedData.content.headings.h1.length > 0) score += 5;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  private clusterEvidenceIntoPersions(evidenceList: Array<{
    source: any;
    evidence: PersonEvidence;
    relevanceScore: number;
  }>): PersonCluster[] {
    const clusters: PersonCluster[] = [];
    
    for (const item of evidenceList) {
      let addedToCluster = false;
      
      // Try to add to existing cluster
      for (const cluster of clusters) {
        if (this.shouldAddToCluster(item.evidence, cluster)) {
          this.addEvidenceToCluster(item, cluster);
          addedToCluster = true;
          break;
        }
      }
      
      // Create new cluster if not added to existing
      if (!addedToCluster) {
        const newCluster: PersonCluster = {
          confidence: 0, // Will be calculated later
          personEvidence: { ...item.evidence },
          sources: [{
            url: item.source.url,
            title: item.source.title,
            snippet: item.source.snippet,
            domain: item.source.domain,
            evidenceContributed: this.getEvidenceContributed(item.evidence),
            relevanceScore: item.relevanceScore
          }],
          potentialVariations: item.evidence.name ? [item.evidence.name] : []
        };
        clusters.push(newCluster);
      }
    }
    
    return clusters;
  }

  private shouldAddToCluster(evidence: PersonEvidence, cluster: PersonCluster): boolean {
    let matchScore = 0;
    let totalChecks = 0;
    
    // Check email match
    if (evidence.email && cluster.personEvidence.email) {
      totalChecks++;
      if (evidence.email.toLowerCase() === cluster.personEvidence.email.toLowerCase()) {
        matchScore += 3; // Email is a strong indicator
      }
    }
    
    // Check name similarity
    if (evidence.name && cluster.personEvidence.name) {
      totalChecks++;
      if (this.areNamesSimilar(evidence.name, cluster.personEvidence.name)) {
        matchScore += 2;
      }
    }
    
    // Check phone match
    if (evidence.phone && cluster.personEvidence.phone) {
      totalChecks++;
      if (evidence.phone === cluster.personEvidence.phone) {
        matchScore += 2;
      }
    }
    
    // Check company/title similarity
    if (evidence.company && cluster.personEvidence.company) {
      totalChecks++;
      if (this.areStringsSimilar(evidence.company, cluster.personEvidence.company)) {
        matchScore += 1;
      }
    }
    
    if (evidence.title && cluster.personEvidence.title) {
      totalChecks++;
      if (this.areStringsSimilar(evidence.title, cluster.personEvidence.title)) {
        matchScore += 1;
      }
    }
    
    // Check social profile overlap
    if (evidence.socialProfiles && cluster.personEvidence.socialProfiles) {
      for (const social1 of evidence.socialProfiles) {
        for (const social2 of cluster.personEvidence.socialProfiles) {
          if (social1.platform === social2.platform && social1.username === social2.username) {
            matchScore += 2;
            totalChecks++;
            break;
          }
        }
      }
    }
    
    // Require at least 50% match if we have checks, or any strong indicator
    return totalChecks > 0 && (matchScore >= Math.ceil(totalChecks * 0.5) || matchScore >= 2);
  }

  private addEvidenceToCluster(item: {
    source: any;
    evidence: PersonEvidence;
    relevanceScore: number;
  }, cluster: PersonCluster) {
    // Merge evidence
    this.mergePersonEvidence(cluster.personEvidence, item.evidence);
    
    // Add source
    cluster.sources.push({
      url: item.source.url,
      title: item.source.title,
      snippet: item.source.snippet,
      domain: item.source.domain,
      evidenceContributed: this.getEvidenceContributed(item.evidence),
      relevanceScore: item.relevanceScore
    });
    
    // Add name variation if different
    if (item.evidence.name && !cluster.potentialVariations.includes(item.evidence.name)) {
      cluster.potentialVariations.push(item.evidence.name);
    }
  }

  private calculateConfidenceScores(clusters: PersonCluster[]): PersonCluster[] {
    return clusters.map(cluster => {
      let confidence = 0;
      
      // Base confidence from number of sources
      confidence += Math.min(cluster.sources.length * 15, 45);
      
      // Evidence quality bonuses
      if (cluster.personEvidence.email && this.isEmailRelevant(cluster.personEvidence.email)) {
        confidence += 25;
      }
      
      if (cluster.personEvidence.name && this.isNameRelevant(cluster.personEvidence.name)) {
        confidence += 20;
      }
      
      if (cluster.personEvidence.phone) confidence += 10;
      if (cluster.personEvidence.company) confidence += 8;
      if (cluster.personEvidence.title) confidence += 8;
      if (cluster.personEvidence.socialProfiles && cluster.personEvidence.socialProfiles.length > 0) {
        confidence += Math.min(cluster.personEvidence.socialProfiles.length * 5, 15);
      }
      
      // Average source relevance score
      const avgRelevance = cluster.sources.reduce((sum, src) => sum + src.relevanceScore, 0) / cluster.sources.length;
      confidence += avgRelevance * 0.2; // 20% of average relevance
      
      // Domain diversity bonus
      const uniqueDomains = new Set(cluster.sources.map(src => src.domain)).size;
      confidence += Math.min(uniqueDomains * 3, 12);
      
      cluster.confidence = Math.min(Math.round(confidence), 100);
      return cluster;
    }).sort((a, b) => b.confidence - a.confidence);
  }

  private generateAdvancedAnalysis(
    basicClusters: PersonCluster[], 
    advancedClusters: undefined,
    clusteringMethod: 'basic' | 'advanced_clustering' = 'basic'
  ): PersonAnalysisResult['analysis'] {
    const clusters = basicClusters;
    const highConfidenceClusters = clusters.filter(c => c.confidence > 70);
    const mediumConfidenceClusters = clusters.filter(c => c.confidence >= 40 && c.confidence <= 70);
    
    const likelyIsSamePerson = highConfidenceClusters.length === 1 && mediumConfidenceClusters.length === 0;
    const mainPersonConfidence = clusters.length > 0 ? clusters[0].confidence : 0;
    
    const reasonsForMultiplePeople: string[] = [];
    const recommendedActions: string[] = [];
    
    if (clusters.length > 1) {
      reasonsForMultiplePeople.push(`Found ${clusters.length} distinct identity clusters`);
      
      if (highConfidenceClusters.length > 1) {
        reasonsForMultiplePeople.push(`Multiple high-confidence identities (${highConfidenceClusters.length})`);
      }
      
      // Check for conflicting information
      const allEmails = clusters.flatMap(c => c.personEvidence.email ? [c.personEvidence.email] : []);
      const uniqueEmails = new Set(allEmails);
      if (uniqueEmails.size > 1) {
        reasonsForMultiplePeople.push(`Different email addresses found: ${Array.from(uniqueEmails).join(', ')}`);
      }
      
      const allCompanies = clusters.flatMap(c => c.personEvidence.company ? [c.personEvidence.company] : []);
      const uniqueCompanies = new Set(allCompanies);
      if (uniqueCompanies.size > 1) {
        reasonsForMultiplePeople.push(`Different companies: ${Array.from(uniqueCompanies).join(', ')}`);
      }
    }
    
    // Recommendations
    if (mainPersonConfidence < 50) {
      recommendedActions.push('Low confidence - consider searching with additional terms');
    }
    
    if (clusters.length > 2) {
      recommendedActions.push('Multiple identities detected - manual verification recommended');
    }
    
    if (clusters.some(c => c.sources.length === 1)) {
      recommendedActions.push('Some identities have single sources - gather more evidence');
    }
    
    return {
      likelyIsSamePerson,
      mainPersonConfidence,
      reasonsForMultiplePeople,
      recommendedActions,
      clusteringMethod
    };
  }

  private createSummary(searchResults: GoogleSearchResult[], clusters: PersonCluster[]): PersonAnalysisResult['summary'] {
    const domainCounts = searchResults.reduce((acc, result) => {
      if (!result.domain.includes('linkedin.com')) { // Exclude LinkedIn from summary
        acc[result.domain] = (acc[result.domain] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));
    
    return {
      totalSources: searchResults.filter(r => !r.domain.includes('linkedin.com')).length,
      highConfidencePersons: clusters.filter(c => c.confidence > 70).length,
      mediumConfidencePersons: clusters.filter(c => c.confidence >= 40 && c.confidence <= 70).length,
      lowConfidencePersons: clusters.filter(c => c.confidence < 40).length,
      topDomains
    };
  }

  // Helper methods for text analysis
  private extractNameFromText(text: string): string | undefined {
    const fullName = `${this.targetFirstName} ${this.targetLastName}`;
    
    // Look for exact name match
    const regex = new RegExp(`\\b${this.targetFirstName}\\s+${this.targetLastName}\\b`, 'i');
    if (regex.test(text)) {
      return fullName;
    }
    
    // Look for variations
    const variations = [
      `${this.targetLastName}, ${this.targetFirstName}`,
      `${this.targetFirstName.charAt(0)}. ${this.targetLastName}`,
      `${this.targetFirstName} ${this.targetLastName.charAt(0)}.`
    ];
    
    for (const variation of variations) {
      if (text.toLowerCase().includes(variation.toLowerCase())) {
        return fullName;
      }
    }
    
    return undefined;
  }

  private extractEmailFromText(text: string): string | undefined {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    
    if (!emails || emails.length === 0) {
      return undefined;
    }
    
    // Prefer the target email if found
    if (emails.includes(this.targetEmail)) {
      return this.targetEmail;
    }
    
    // Return any relevant email
    return emails.find(email => this.isEmailRelevant(email));
  }

  private extractTitleFromText(text: string): string | undefined {
    const titlePatterns = [
      /(?:CEO|CTO|CFO|COO|President|Director|Manager|Engineer|Developer|Designer|Analyst|Consultant|Founder|Owner)\b/gi,
      /\b(?:Senior|Lead|Principal|Head of|VP of|Vice President)\s+[A-Za-z\s]+/gi
    ];
    
    for (const pattern of titlePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        return matches[0];
      }
    }
    
    return undefined;
  }

  private extractCompanyFromText(text: string): string | undefined {
    // This is simplified - in practice, you'd want more sophisticated company extraction
    const companyPatterns = [
      /\bat\s+([A-Z][a-zA-Z\s&.,-]+(?:Inc|LLC|Corp|Company|Co\.|Corporation|Ltd|Limited))/gi,
      /\bworks?\s+(?:at|for)\s+([A-Z][a-zA-Z\s&.,-]+)/gi
    ];
    
    for (const pattern of companyPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        return matches[1];
      }
    }
    
    return undefined;
  }

  private extractLocationFromText(text: string): string | undefined {
    // Simplified location extraction
    const locationPatterns = [
      /\b(?:in|from|based in|located in)\s+([A-Z][a-zA-Z\s,]+(?:, [A-Z]{2}|, [A-Z][a-zA-Z\s]+))/gi
    ];
    
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        return matches[1];
      }
    }
    
    return undefined;
  }

  private extractSkillsFromContent(data: ScrapedData): string[] {
    const skills: string[] = [];
    
    // Extract from headings
    const allHeadings = [...data.content.headings.h1, ...data.content.headings.h2, ...data.content.headings.h3];
    
    const skillKeywords = ['skills', 'expertise', 'technologies', 'tools', 'languages'];
    for (const heading of allHeadings) {
      if (skillKeywords.some(keyword => heading.toLowerCase().includes(keyword))) {
        // This heading might be followed by skills
        skills.push(heading);
      }
    }
    
    return skills.slice(0, 10); // Limit to 10
  }

  private extractEducationFromContent(data: ScrapedData): string[] {
    const education: string[] = [];
    
    const eduKeywords = ['university', 'college', 'school', 'education', 'degree', 'bachelor', 'master', 'phd'];
    const pageText = data.content.paragraphs.join(' ').toLowerCase();
    
    for (const keyword of eduKeywords) {
      if (pageText.includes(keyword)) {
        education.push(keyword);
      }
    }
    
    return [...new Set(education)].slice(0, 5);
  }

  private extractAffiliationsFromContent(data: ScrapedData): string[] {
    const affiliations: string[] = [];
    
    // Extract from social links
    if (data.content.contactInfo.socialLinks) {
      affiliations.push(...data.content.contactInfo.socialLinks.map(link => link.platform));
    }
    
    return [...new Set(affiliations)];
  }

  private extractUsernameFromUrl(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      // For most social platforms, username is in the path
      if (pathParts.length > 0) {
        return pathParts[0];
      }
    } catch {
      // Invalid URL
    }
    
    return undefined;
  }

  // Helper methods for comparison
  private containsTargetName(text: string): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return lowerText.includes(this.targetFirstName) && lowerText.includes(this.targetLastName);
  }

  private isEmailRelevant(email: string): boolean {
    return email.toLowerCase() === this.targetEmail || 
           email.toLowerCase().includes(this.targetFirstName) || 
           email.toLowerCase().includes(this.targetLastName);
  }

  private isNameRelevant(name: string): boolean {
    const lowerName = name.toLowerCase();
    return lowerName.includes(this.targetFirstName) && lowerName.includes(this.targetLastName);
  }

  private areNamesSimilar(name1: string, name2: string): boolean {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    // Exact match
    if (n1 === n2) return true;
    
    // Check if both contain target first and last name
    const containsTarget1 = n1.includes(this.targetFirstName) && n1.includes(this.targetLastName);
    const containsTarget2 = n2.includes(this.targetFirstName) && n2.includes(this.targetLastName);
    
    return containsTarget1 && containsTarget2;
  }

  private areStringsSimilar(str1: string, str2: string): boolean {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Simple similarity check
    return s1 === s2 || s1.includes(s2) || s2.includes(s1);
  }

  private getDomainTrustScore(domain: string): number {
    const trustedDomains = [
      'linkedin.com', 'github.com', 'medium.com', 'stackoverflow.com',
      'twitter.com', 'facebook.com', 'instagram.com', 'youtube.com'
    ];
    
    const score = trustedDomains.some(trusted => domain.includes(trusted)) ? 15 : 5;
    return score;
  }

  private mergePersonEvidence(target: PersonEvidence, source: PersonEvidence) {
    if (source.name && !target.name) target.name = source.name;
    if (source.email && !target.email) target.email = source.email;
    if (source.title && !target.title) target.title = source.title;
    if (source.company && !target.company) target.company = source.company;
    if (source.location && !target.location) target.location = source.location;
    if (source.phone && !target.phone) target.phone = source.phone;
    
    if (source.socialProfiles) {
      if (!target.socialProfiles) target.socialProfiles = [];
      
      // Add unique social profiles
      for (const social of source.socialProfiles) {
        const exists = target.socialProfiles.some(existing => 
          existing.platform === social.platform && existing.url === social.url
        );
        if (!exists) {
          target.socialProfiles.push(social);
        }
      }
    }
    
    if (source.skills) {
      if (!target.skills) target.skills = [];
      target.skills.push(...source.skills);
      target.skills = [...new Set(target.skills)]; // Remove duplicates
    }
    
    if (source.education) {
      if (!target.education) target.education = [];
      target.education.push(...source.education);
      target.education = [...new Set(target.education)];
    }
    
    if (source.affiliations) {
      if (!target.affiliations) target.affiliations = [];
      target.affiliations.push(...source.affiliations);
      target.affiliations = [...new Set(target.affiliations)];
    }
  }

  private getEvidenceContributed(evidence: PersonEvidence): string[] {
    const contributions: string[] = [];
    
    if (evidence.name) contributions.push('name');
    if (evidence.email) contributions.push('email');
    if (evidence.title) contributions.push('title');
    if (evidence.company) contributions.push('company');
    if (evidence.location) contributions.push('location');
    if (evidence.phone) contributions.push('phone');
    if (evidence.socialProfiles && evidence.socialProfiles.length > 0) contributions.push('social_profiles');
    if (evidence.skills && evidence.skills.length > 0) contributions.push('skills');
    if (evidence.education && evidence.education.length > 0) contributions.push('education');
    
    return contributions;
  }

  // Enhanced biographical profiling methods
  private extractPersonalBios(searchResults: GoogleSearchResult[], scrapedData: ScrapedData[]): PersonBio[] {
    const bios: PersonBio[] = [];
    
    console.log(`  📑 Extracting biographical data from ${searchResults.length + scrapedData.length} sources...`);
    
    // Extract from search results
    for (const result of searchResults) {
      const bio = this.enhancedKeywordExtractor.extractPersonBio(
        result.title,
        result.snippet,
        '', // Search results don't have full content
        result.url,
        this.targetFirstName,
        this.targetLastName,
        this.targetEmail
      );
      bios.push(bio);
    }
    
    // Extract from scraped data (more detailed)
    for (const scraped of scrapedData) {
      const contentText = this.extractTextFromScrapedContent(scraped.content);
      const bio = this.enhancedKeywordExtractor.extractPersonBio(
        scraped.title,
        scraped.metadata.description || '',
        contentText,
        scraped.url,
        this.targetFirstName,
        this.targetLastName,
        this.targetEmail
      );
      bios.push(bio);
    }
    
    console.log(`  ✅ Extracted ${bios.length} biographical profiles`);
    return bios;
  }

  private extractTextFromScrapedContent(content: any): string {
    // Extract text from the structured content object
    let text = '';
    
    if (content.headings) {
      text += Object.values(content.headings).flat().join(' ') + ' ';
    }
    
    if (content.paragraphs) {
      text += content.paragraphs.join(' ') + ' ';
    }
    
    if (content.links) {
      text += content.links.map((link: any) => link.text).join(' ') + ' ';
    }
    
    return text.trim();
  }

  private enrichEvidenceWithBiographicalData(
    evidenceList: Array<{ evidence: PersonEvidence; source: string; sourceType: 'search' | 'scraped'; originalSource?: any }>, 
    personalBios: PersonBio[]
  ): Array<{ evidence: PersonEvidence; source: string; sourceType: 'search' | 'scraped'; bio?: PersonBio; originalSource?: any }> {
    console.log('  🔗 Enriching evidence with biographical dimensions...');
    
    return evidenceList.map((item, index) => {
      const correspondingBio = personalBios[index] || personalBios[0]; // Fallback to first bio
      return {
        ...item,
        bio: correspondingBio
      };
    });
  }

  private clusterEvidenceWithBiographicalDimensions(
    enrichedEvidence: Array<{ evidence: PersonEvidence; source: string; sourceType: 'search' | 'scraped'; bio?: PersonBio; originalSource?: any }>,
    consolidatedBio: any
  ): PersonCluster[] {
    console.log('  🧮 Clustering with biographical dimensions...');
    
    // Convert to format expected by existing clustering method while preserving source info
    const basicEvidence = enrichedEvidence.map(item => ({
      evidence: item.evidence,
      source: item.originalSource || {
        url: item.source,
        title: 'Unknown Title',
        snippet: '',
        domain: new URL(item.source).hostname
      },
      relevanceScore: 80 // Default relevance score for biographical enhanced evidence
    }));
    
    const basicClusters = this.clusterEvidenceIntoPersions(basicEvidence);
    
    // Enhance clusters with biographical data
    const enhancedClusters = basicClusters.map(cluster => {
      // Find the most relevant bio for this cluster
      const relevantBios = enrichedEvidence
        .filter(item => this.shouldAddToCluster(item.evidence, cluster))
        .map(item => item.bio)
        .filter(bio => bio !== undefined);
      
      if (relevantBios.length > 0) {
        const bio = relevantBios[0]!;
        
        // Enhance cluster with biographical insights
        cluster.personEvidence = this.enhanceEvidenceWithBiographicalData(cluster.personEvidence, bio);
        
        // Add biographical metadata
        cluster.metadata = {
          ...cluster.metadata,
          biographicalInsights: {
            careerStage: bio.insights.careerStage,
            industryExpertise: bio.insights.industryExpertise,
            thoughtLeadership: bio.insights.thoughtLeadership,
            digitalSavviness: bio.insights.digitalSavviness,
            professionalSeniority: bio.professional.seniority || 'unknown',
            educationLevel: bio.education.degrees.length > 0 ? bio.education.degrees[0].level : 'unknown',
            geographicMobility: bio.insights.geographicMobility
          }
        };
      }
      
      return cluster;
    });
    
    return enhancedClusters;
  }

  private enhanceEvidenceWithBiographicalData(evidence: PersonEvidence, bio: PersonBio): PersonEvidence {
    // Enhance existing evidence with biographical data
    const enhanced = { ...evidence };
    
    // Enhance skills with bio skills
    if (bio.professional.skills.length > 0) {
      enhanced.skills = enhanced.skills || [];
      bio.professional.skills.forEach(skill => {
        if (!enhanced.skills!.includes(skill.name)) {
          enhanced.skills!.push(skill.name);
        }
      });
    }
    
    // Enhance education with bio education
    if (bio.education.degrees.length > 0) {
      enhanced.education = enhanced.education || [];
      bio.education.degrees.forEach(degree => {
        const educationEntry = `${degree.level} in ${degree.field} from ${degree.institution}`;
        if (!enhanced.education!.includes(educationEntry)) {
          enhanced.education!.push(educationEntry);
        }
      });
    }
    
    // Enhance location with bio location
    if (bio.locations.current && !enhanced.location) {
      enhanced.location = `${bio.locations.current.city}, ${bio.locations.current.country}`;
    }
    
    // Enhance with bio achievements
    if (bio.professional.achievements.length > 0) {
      enhanced.achievements = enhanced.achievements || [];
      bio.professional.achievements.forEach(achievement => {
        if (!enhanced.achievements!.includes(achievement)) {
          enhanced.achievements!.push(achievement);
        }
      });
    }
    
    return enhanced;
  }

  private calculateEnhancedConfidenceScores(clusters: PersonCluster[], consolidatedBio: any): PersonCluster[] {
    console.log('  📊 Calculating enhanced confidence scores...');
    
    // Start with basic confidence calculation
    const basicScored = this.calculateConfidenceScores(clusters);
    
    // Enhance with biographical confidence factors
    return basicScored.map(cluster => {
      let biographicalBonus = 0;
      
      // Bonus for biographical consistency
      if (cluster.metadata?.biographicalInsights) {
        const insights = cluster.metadata.biographicalInsights;
        
        // Career stage consistency bonus
        if (insights.careerStage && insights.careerStage !== 'unknown') {
          biographicalBonus += 5;
        }
        
        // Professional seniority consistency bonus
        if (insights.professionalSeniority && insights.professionalSeniority !== 'unknown') {
          biographicalBonus += 5;
        }
        
        // Industry expertise bonus
        if (insights.industryExpertise && insights.industryExpertise.length > 0) {
          biographicalBonus += 3;
        }
        
        // Education level bonus
        if (insights.educationLevel && insights.educationLevel !== 'unknown') {
          biographicalBonus += 3;
        }
        
        // Thought leadership bonus
        if (insights.thoughtLeadership && insights.thoughtLeadership !== 'none') {
          biographicalBonus += 4;
        }
      }
      
      // Apply biographical bonus (max 20 points)
      cluster.confidence = Math.min(cluster.confidence + Math.min(biographicalBonus, 20), 100);
      
      return cluster;
    });
  }

  private createEnhancedSummary(searchResults: GoogleSearchResult[], clusters: PersonCluster[], consolidatedBio: any): any {
    console.log('  📋 Creating enhanced summary with biographical insights...');
    
    // Start with basic summary
    const basicSummary = this.createSummary(searchResults, clusters);
    
    // Add biographical insights
    const biographicalSummary = {
      careerStage: consolidatedBio.consolidatedBio.insights.careerStage,
      professionalSeniority: consolidatedBio.consolidatedBio.professional.seniority,
      industryExpertise: consolidatedBio.consolidatedBio.insights.industryExpertise,
      educationLevel: consolidatedBio.consolidatedBio.education.degrees.length > 0 
        ? consolidatedBio.consolidatedBio.education.degrees[0].level 
        : 'unknown',
      thoughtLeadership: consolidatedBio.consolidatedBio.insights.thoughtLeadership,
      digitalSavviness: consolidatedBio.consolidatedBio.insights.digitalSavviness,
      geographicMobility: consolidatedBio.consolidatedBio.insights.geographicMobility,
      keySkills: consolidatedBio.consolidatedBio.professional.skills.slice(0, 5).map((s: any) => s.name),
      achievementsCount: consolidatedBio.consolidatedBio.professional.achievements.length,
      educationInstitutions: consolidatedBio.consolidatedBio.education.institutions.length,
      socialPresence: consolidatedBio.consolidatedBio.digitalFootprint.socialProfiles.length,
      biographicalConfidence: consolidatedBio.confidence
    };
    
    return {
      ...basicSummary,
      biographicalInsights: biographicalSummary,
      enhancementMethod: 'advanced_biographical_profiling'
    };
  }
}
