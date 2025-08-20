import { GoogleSearchResult } from '../hybrid-search/ultimate-scraper';
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
  // Advanced evidence properties
  careerProgression?: string[];
  industryExpertise?: string[];
  publications?: string[];
  languages?: string[];
  coordinates?: string;
  employmentPeriod?: string;
  responsibilities?: string[];
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
    
    // Use the new extractPersonBio method from StateOfTheArtPersonExtractor
    let consolidatedBio: any = null;
    if (scrapedData.length > 0) {
      const firstResult = scrapedData[0];
      // Convert content object to string
      const contentText = [
        ...firstResult.content.paragraphs,
        ...firstResult.content.headings.h1,
        ...firstResult.content.headings.h2,
        ...firstResult.content.headings.h3
      ].join(' ');
      
      consolidatedBio = this.enhancedKeywordExtractor.extractPersonBio(
        firstResult.title || '',
        '', // snippet not available in ScrapedData
        contentText,
        firstResult.url,
        this.targetFirstName,
        this.targetLastName,
        this.targetEmail
      );
    }
    
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
    console.log(`🔍 🧠 Advanced search result evidence extraction for: ${searchResult.url}`);
    
    // Use state-of-the-art bio extraction even for search results
    const personalBio = this.enhancedKeywordExtractor.extractPersonBio(
      searchResult.title,
      searchResult.snippet,
      '', // Search results don't have full content
      searchResult.url,
      this.targetFirstName,
      this.targetLastName,
      this.targetEmail
    );

    const evidence: PersonEvidence = {};

    // Map comprehensive bio data to evidence structure
    if (personalBio.names && personalBio.names.length > 0) {
      evidence.name = personalBio.names[0].full;
    }

    if (personalBio.emails && personalBio.emails.length > 0) {
      const relevantEmail = personalBio.emails.find(e => e.verified) || personalBio.emails[0];
      evidence.email = relevantEmail.address;
    }

    if (personalBio.professional.currentRole) {
      evidence.title = personalBio.professional.currentRole.title;
      evidence.company = personalBio.professional.currentRole.company.name;
    }

    if (personalBio.locations.current) {
      evidence.location = `${personalBio.locations.current.city}, ${personalBio.locations.current.country}`;
    }

    // Advanced skills with categorization and proficiency
    if (personalBio.professional.skills && personalBio.professional.skills.length > 0) {
      evidence.skills = personalBio.professional.skills.map(skill => 
        `${skill.name} (${skill.category}${skill.proficiency ? `, ${skill.proficiency}` : ''})`
      );
    }

    // Advanced education with institutional details
    if (personalBio.education.degrees && personalBio.education.degrees.length > 0) {
      evidence.education = personalBio.education.degrees.map(degree => 
        `${degree.level} in ${degree.field} from ${degree.institution.name}`
      );
    }

    // Fallback to basic extraction if state-of-the-art yields minimal results
    if (!evidence.name || (!evidence.title && !evidence.company)) {
      console.log(`⚠️  Advanced extraction yielded minimal results for search result, applying basic fallback...`);
      
      // Extract from search snippet only (for LinkedIn)
      if (searchResult.snippet) {
        if (!evidence.name) evidence.name = this.extractNameFromText(searchResult.snippet);
        if (!evidence.email) evidence.email = this.extractEmailFromText(searchResult.snippet);
        if (!evidence.title) evidence.title = this.extractTitleFromText(searchResult.snippet);
        if (!evidence.company) evidence.company = this.extractCompanyFromText(searchResult.snippet);
        if (!evidence.location) evidence.location = this.extractLocationFromText(searchResult.snippet);
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
    }

    console.log(`✅ Advanced search result evidence: ${Object.keys(evidence).filter(k => evidence[k as keyof PersonEvidence]).join(', ')}`);

    return evidence;
  }

  private extractEvidenceFromSource(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    console.log(`🔍 📊 Source-specific evidence extraction for: ${searchResult.url}`);
    
    // Start with platform-specific extraction based on URL domain
    const evidence = this.extractPlatformSpecificEvidence(searchResult, scrapedData);
    
    // Enhance with title and snippet extraction
    this.enhanceEvidenceFromSearchMetadata(evidence, searchResult);
    
    // Add scraped content analysis if available
    if (scrapedData) {
      this.enhanceEvidenceFromScrapedContent(evidence, scrapedData, searchResult);
    }
    
    // Log what evidence was actually found for this specific source
    const extractedFields = Object.keys(evidence).filter(k => evidence[k as keyof PersonEvidence]);
    console.log(`✅ Source evidence extracted for ${searchResult.domain}: ${extractedFields.join(', ')}`);
    
    return evidence;
  }

  private extractPlatformSpecificEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    const domain = searchResult.domain.toLowerCase();
    
    // Platform-specific extraction logic
    if (domain.includes('linkedin.com')) {
      return this.extractLinkedInEvidence(searchResult, scrapedData);
    } else if (domain.includes('github.com')) {
      return this.extractGitHubEvidence(searchResult, scrapedData);
    } else if (domain.includes('facebook.com')) {
      return this.extractFacebookEvidence(searchResult, scrapedData);
    } else if (domain.includes('instagram.com')) {
      return this.extractInstagramEvidence(searchResult, scrapedData);
    } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return this.extractTwitterEvidence(searchResult, scrapedData);
    } else if (domain.includes('youtube.com')) {
      return this.extractYouTubeEvidence(searchResult, scrapedData);
    } else if (domain.includes('.edu')) {
      return this.extractAcademicEvidence(searchResult, scrapedData);
    } else {
      return this.extractGenericWebEvidence(searchResult, scrapedData);
    }
  }

  private extractLinkedInEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract name from LinkedIn title patterns
    const titleMatch = searchResult.title.match(/^([^-|]+)(?:-|•|\|)/);
    if (titleMatch) {
      const nameCandidate = titleMatch[1].trim();
      if (this.isNameRelevant(nameCandidate)) {
        evidence.name = nameCandidate;
      }
    }
    
    // Extract title and company from LinkedIn title/snippet
    const titleCompanyMatch = searchResult.snippet.match(/(.+?)\s+at\s+(.+?)(?:\s+\||$)/);
    if (titleCompanyMatch) {
      evidence.title = titleCompanyMatch[1].trim();
      evidence.company = titleCompanyMatch[2].trim();
    }
    
    // Extract location from LinkedIn snippet
    const locationMatch = searchResult.snippet.match(/(?:Location:|Based in|Located in)\s*([^•\n]+)/i);
    if (locationMatch) {
      evidence.location = locationMatch[1].trim();
    }
    
    // Always add target email for LinkedIn profiles
    evidence.email = this.targetEmail;
    
    // Add platform info
    evidence.socialProfiles = [{
      platform: 'LinkedIn',
      url: searchResult.url,
      username: this.extractUsernameFromUrl(searchResult.url)
    }];
    
    return evidence;
  }

  private extractGitHubEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract username from GitHub URL
    const usernameMatch = searchResult.url.match(/github\.com\/([^\/]+)/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      evidence.socialProfiles = [{
        platform: 'GitHub',
        url: searchResult.url,
        username: username
      }];
    }
    
    // Extract name from GitHub title
    const nameMatch = searchResult.title.match(/^([^(]+)(?:\(|·|GitHub)/);
    if (nameMatch) {
      const nameCandidate = nameMatch[1].trim();
      if (this.isNameRelevant(nameCandidate)) {
        evidence.name = nameCandidate;
      }
    }
    
    // Extract technical info from GitHub snippet
    if (searchResult.snippet.toLowerCase().includes('repositories')) {
      evidence.skills = ['Software Development', 'Programming'];
    }
    
    // Add target email
    evidence.email = this.targetEmail;
    
    // Extract programming languages and technologies from scraped content
    if (scrapedData) {
      const content = this.extractTextFromScrapedContent(scrapedData.content);
      evidence.skills = this.extractTechnicalSkillsFromContent(content);
    }
    
    return evidence;
  }

  private extractFacebookEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract name from Facebook title
    const nameMatch = searchResult.title.match(/^([^|]+)(?:\||Facebook)/);
    if (nameMatch) {
      const nameCandidate = nameMatch[1].trim();
      if (this.isNameRelevant(nameCandidate)) {
        evidence.name = nameCandidate;
      }
    }
    
    // Extract location from Facebook snippet
    const locationMatch = searchResult.snippet.match(/(?:Lives in|From)\s+([^•\n]+)/i);
    if (locationMatch) {
      evidence.location = locationMatch[1].trim();
    }
    
    // Add target email
    evidence.email = this.targetEmail;
    
    // Add platform info
    evidence.socialProfiles = [{
      platform: 'Facebook',
      url: searchResult.url,
      username: this.extractUsernameFromUrl(searchResult.url)
    }];
    
    return evidence;
  }

  private extractInstagramEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract username from Instagram URL
    const usernameMatch = searchResult.url.match(/instagram\.com\/([^\/]+)/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      evidence.socialProfiles = [{
        platform: 'Instagram',
        url: searchResult.url,
        username: username
      }];
    }
    
    // Extract name from Instagram title
    const nameMatch = searchResult.title.match(/^([^(@]+)(?:@|\()/);
    if (nameMatch) {
      const nameCandidate = nameMatch[1].trim();
      if (this.isNameRelevant(nameCandidate)) {
        evidence.name = nameCandidate;
      }
    }
    
    // Add target email
    evidence.email = this.targetEmail;
    
    return evidence;
  }

  private extractTwitterEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract username from Twitter URL
    const usernameMatch = searchResult.url.match(/(?:twitter\.com|x\.com)\/([^\/]+)/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      evidence.socialProfiles = [{
        platform: 'Twitter',
        url: searchResult.url,
        username: username
      }];
    }
    
    // Extract name from Twitter title
    const nameMatch = searchResult.title.match(/^([^(@]+)(?:@|\()/);
    if (nameMatch) {
      const nameCandidate = nameMatch[1].trim();
      if (this.isNameRelevant(nameCandidate)) {
        evidence.name = nameCandidate;
      }
    }
    
    // Add target email
    evidence.email = this.targetEmail;
    
    return evidence;
  }

  private extractYouTubeEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract channel name from YouTube title
    const nameMatch = searchResult.title.match(/^([^-]+)(?:-|YouTube)/);
    if (nameMatch) {
      const nameCandidate = nameMatch[1].trim();
      if (this.isNameRelevant(nameCandidate)) {
        evidence.name = nameCandidate;
      }
    }
    
    // Add platform info
    evidence.socialProfiles = [{
      platform: 'YouTube',
      url: searchResult.url,
      username: this.extractUsernameFromUrl(searchResult.url) || 'Unknown'
    }];
    
    // Extract content type from snippet
    if (searchResult.snippet.toLowerCase().includes('videos')) {
      evidence.skills = ['Content Creation', 'Video Production'];
    }
    
    // Add target email
    evidence.email = this.targetEmail;
    
    return evidence;
  }

  private extractAcademicEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Extract name from academic title
    const nameMatch = searchResult.title.match(/^([^-|]+)(?:-|\|)/);
    if (nameMatch) {
      const nameCandidate = nameMatch[1].trim();
      if (this.isNameRelevant(nameCandidate)) {
        evidence.name = nameCandidate;
      }
    }
    
    // Extract institution from domain
    const domainParts = searchResult.domain.split('.');
    if (domainParts.length > 2) {
      const institution = domainParts[0].replace(/^www\./, '');
      evidence.affiliations = [`${institution} (academic institution)`];
    }
    
    // Extract academic info from snippet
    if (searchResult.snippet.toLowerCase().includes('student')) {
      evidence.title = 'Student';
    }
    if (searchResult.snippet.toLowerCase().includes('professor')) {
      evidence.title = 'Professor';
    }
    
    // Add target email
    evidence.email = this.targetEmail;
    
    return evidence;
  }

  private extractGenericWebEvidence(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Use basic extraction for generic websites
    evidence.name = this.extractNameFromText(searchResult.title + ' ' + searchResult.snippet);
    evidence.email = this.extractEmailFromText(searchResult.snippet) || this.targetEmail;
    evidence.title = this.extractTitleFromText(searchResult.snippet);
    evidence.company = this.extractCompanyFromText(searchResult.snippet);
    evidence.location = this.extractLocationFromText(searchResult.snippet);
    
    return evidence;
  }

  private enhanceEvidenceFromSearchMetadata(evidence: PersonEvidence, searchResult: GoogleSearchResult): void {
    // Enhance with target email if not already set
    if (!evidence.email) {
      evidence.email = this.targetEmail;
    }
    
    // Enhance name if not found
    if (!evidence.name) {
      const nameFromTitle = this.extractNameFromText(searchResult.title);
      const nameFromSnippet = this.extractNameFromText(searchResult.snippet);
      evidence.name = nameFromTitle || nameFromSnippet;
    }
    
    // Extract phone numbers from snippet
    if (!evidence.phone) {
      evidence.phone = this.extractPhoneFromText(searchResult.snippet);
    }
  }

  private enhanceEvidenceFromScrapedContent(evidence: PersonEvidence, scrapedData: ScrapedData, searchResult: GoogleSearchResult): void {
    const content = this.extractTextFromScrapedContent(scrapedData.content);
    
    // Enhance phone if found in scraped content
    if (!evidence.phone && scrapedData.content.contactInfo?.phones.length > 0) {
      evidence.phone = scrapedData.content.contactInfo.phones[0];
    }
    
    // Enhance social profiles from scraped links (filter out navigation)
    if (scrapedData.content.contactInfo?.socialLinks) {
      const relevantSocialLinks = scrapedData.content.contactInfo.socialLinks.filter(link => 
        this.isRelevantSocialLink(link.url)
      );
      
      if (relevantSocialLinks.length > 0) {
        if (!evidence.socialProfiles) evidence.socialProfiles = [];
        relevantSocialLinks.forEach(link => {
          const exists = evidence.socialProfiles!.some(existing => existing.url === link.url);
          if (!exists) {
            evidence.socialProfiles!.push({
              platform: link.platform,
              url: link.url,
              username: this.extractUsernameFromUrl(link.url)
            });
          }
        });
      }
    }
    
    // Extract skills from content
    if (!evidence.skills || evidence.skills.length === 0) {
      evidence.skills = this.extractSkillsFromText(content);
    }
    
    // Extract education from content
    if (!evidence.education || evidence.education.length === 0) {
      evidence.education = this.extractEducationFromText(content);
    }
  }

  private extractTechnicalSkillsFromContent(content: string): string[] {
    const skills: string[] = [];
    const technicalKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'typescript', 'html', 'css',
      'docker', 'kubernetes', 'aws', 'git', 'sql', 'mongodb', 'postgresql',
      'machine learning', 'ai', 'data science', 'backend', 'frontend', 'fullstack'
    ];
    
    const lowerContent = content.toLowerCase();
    technicalKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        skills.push(keyword);
      }
    });
    
    return skills.slice(0, 10); // Limit to 10 skills
  }

  private extractSkillsFromText(text: string): string[] {
    const skills: string[] = [];
    const skillPatterns = [
      /(?:skilled in|proficient in|experienced with|expert in)\s+([^.]+)/gi,
      /(?:technologies|skills):\s*([^.]+)/gi
    ];
    
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const skillText = match.replace(pattern, '$1').trim();
          if (skillText.length > 2 && skillText.length < 100) {
            skills.push(skillText);
          }
        });
      }
    });
    
    return skills.slice(0, 5);
  }

  private extractEducationFromText(text: string): string[] {
    const education: string[] = [];
    const eduPatterns = [
      /(?:graduated from|degree from|studied at|attended)\s+([^.]+)/gi,
      /(?:bachelor|master|phd|doctorate)(?:'s)?\s+(?:of|in)\s+([^.]+)/gi
    ];
    
    eduPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const eduText = match.trim();
          if (eduText.length > 5 && eduText.length < 200) {
            education.push(eduText);
          }
        });
      }
    });
    
    return education.slice(0, 3);
  }

  private extractPhoneFromText(text: string): string | undefined {
    const phonePatterns = [
      /\+?1?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
      /\+?(\d{1,3})[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})/
    ];
    
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        const phone = match[0].replace(/[^\d+]/g, '');
        if (phone.length >= 10 && phone.length <= 15) {
          return phone;
        }
      }
    }
    
    return undefined;
  }

  private isRelevantSocialLink(url: string): boolean {
    // Filter out navigation and generic social media links
    const irrelevantPatterns = [
      '/login', '/signup', '/help', '/privacy', '/terms', '/about',
      '/careers', '/business', '/developers', '/legal', '/policies',
      '/accounts/login', '/accounts/signup', '/explore', '/web/lite'
    ];
    
    return !irrelevantPatterns.some(pattern => url.includes(pattern)) && 
           url.length < 200; // Exclude extremely long URLs
  }

  private extractBasicEvidenceFromSource(searchResult: GoogleSearchResult, scrapedData?: ScrapedData): PersonEvidence {
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
      
      // Evidence quality bonuses with enhanced categories
      if (cluster.personEvidence.email && this.isEmailRelevant(cluster.personEvidence.email)) {
        confidence += 25;
      }
      
      if (cluster.personEvidence.name && this.isNameRelevant(cluster.personEvidence.name)) {
        confidence += 20;
      }
      
      // Enhanced evidence scoring
      if (cluster.personEvidence.phone) confidence += 10;
      if (cluster.personEvidence.company) confidence += 8;
      if (cluster.personEvidence.title) confidence += 8;
      if (cluster.personEvidence.location) confidence += 6;
      
      // Advanced social profiles scoring
      if (cluster.personEvidence.socialProfiles && cluster.personEvidence.socialProfiles.length > 0) {
        const socialScore = Math.min(cluster.personEvidence.socialProfiles.length * 5, 15);
        confidence += socialScore;
        
        // Bonus for professional platforms
        const hasProfessional = cluster.personEvidence.socialProfiles.some(p => 
          ['linkedin', 'github'].includes(p.platform.toLowerCase())
        );
        if (hasProfessional) confidence += 8;
      }
      
      // Advanced skills scoring
      if (cluster.personEvidence.skills && cluster.personEvidence.skills.length > 0) {
        const skillsScore = Math.min(cluster.personEvidence.skills.length * 2, 12);
        confidence += skillsScore;
        
        // Bonus for categorized skills
        const hasCategories = cluster.personEvidence.skills.some(skill => 
          skill.includes('(') && skill.includes(')')
        );
        if (hasCategories) confidence += 5;
      }
      
      // Advanced education scoring
      if (cluster.personEvidence.education && cluster.personEvidence.education.length > 0) {
        const eduScore = Math.min(cluster.personEvidence.education.length * 4, 15);
        confidence += eduScore;
        
        // Bonus for detailed education (with institutions)
        const hasInstitutions = cluster.personEvidence.education.some(edu => 
          edu.includes('from ')
        );
        if (hasInstitutions) confidence += 6;
      }
      
      // Advanced achievements scoring
      if (cluster.personEvidence.achievements && cluster.personEvidence.achievements.length > 0) {
        const achievementScore = Math.min(cluster.personEvidence.achievements.length * 3, 12);
        confidence += achievementScore;
        
        // Bonus for categorized achievements
        const hasTypes = cluster.personEvidence.achievements.some(ach => 
          ach.includes('(') && ach.includes(')')
        );
        if (hasTypes) confidence += 4;
      }
      
      // Advanced affiliations scoring
      if (cluster.personEvidence.affiliations && cluster.personEvidence.affiliations.length > 0) {
        const affiliationScore = Math.min(cluster.personEvidence.affiliations.length * 2, 10);
        confidence += affiliationScore;
        
        // Bonus for diverse affiliations
        const hasCompanies = cluster.personEvidence.affiliations.some(aff => 
          aff.includes('Inc') || aff.includes('Corp') || aff.includes('LLC')
        );
        const hasUniversities = cluster.personEvidence.affiliations.some(aff => 
          aff.includes('University') || aff.includes('College')
        );
        if (hasCompanies && hasUniversities) confidence += 5;
      }
      
      // Advanced websites scoring
      if (cluster.personEvidence.websites && cluster.personEvidence.websites.length > 0) {
        const websiteScore = Math.min(cluster.personEvidence.websites.length * 3, 8);
        confidence += websiteScore;
      }
      
      // Average source relevance score
      const avgRelevance = cluster.sources.reduce((sum, src) => sum + src.relevanceScore, 0) / cluster.sources.length;
      confidence += avgRelevance * 0.2; // 20% of average relevance
      
      // Domain diversity bonus
      const uniqueDomains = new Set(cluster.sources.map(src => src.domain)).size;
      confidence += Math.min(uniqueDomains * 3, 12);
      
      // Evidence richness bonus - reward comprehensive profiles
      const evidenceTypes = [
        cluster.personEvidence.name,
        cluster.personEvidence.email,
        cluster.personEvidence.phone,
        cluster.personEvidence.title,
        cluster.personEvidence.company,
        cluster.personEvidence.location,
        cluster.personEvidence.socialProfiles,
        cluster.personEvidence.skills,
        cluster.personEvidence.education,
        cluster.personEvidence.achievements,
        cluster.personEvidence.affiliations,
        cluster.personEvidence.websites
      ].filter(Boolean).length;
      
      if (evidenceTypes >= 8) {
        confidence += 10; // Comprehensive profile bonus
      } else if (evidenceTypes >= 6) {
        confidence += 6; // Good profile bonus
      } else if (evidenceTypes >= 4) {
        confidence += 3; // Moderate profile bonus
      }
      
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
    const contributed: string[] = [];
    
    // Return actual evidence data instead of just categories
    
    // Core Identity Evidence - show actual values
    if (evidence.name) {
      contributed.push(`name: "${evidence.name}"`);
    }
    
    if (evidence.email) {
      contributed.push(`email: "${evidence.email}"`);
      
      // Email domain analysis for additional context
      const emailDomain = evidence.email.split('@')[1];
      if (emailDomain) {
        if (emailDomain.includes('.edu')) {
          contributed.push(`domain: academic (.edu)`);
        } else if (emailDomain.includes('.gov')) {
          contributed.push(`domain: government (.gov)`);
        } else if (emailDomain.includes('gmail') || emailDomain.includes('yahoo') || emailDomain.includes('outlook')) {
          contributed.push(`domain: personal (${emailDomain})`);
        } else {
          contributed.push(`domain: professional (${emailDomain})`);
        }
      }
    }
    
    if (evidence.phone) {
      contributed.push(`phone: "${evidence.phone}"`);
    }
    // Professional Identity Evidence - show actual values
    if (evidence.title) {
      contributed.push(`title: "${evidence.title}"`);
    }
    
    if (evidence.company) {
      contributed.push(`company: "${evidence.company}"`);
    }

    // Geographic and Location Evidence - show actual values
    if (evidence.location) {
      contributed.push(`location: "${evidence.location}"`);
    }

    // Digital Footprint Evidence - show actual values
    if (evidence.socialProfiles && evidence.socialProfiles.length > 0) {
      evidence.socialProfiles.forEach(profile => {
        contributed.push(`social: ${profile.platform} (${profile.username || 'username N/A'})`);
      });
    }

    // Skills and Expertise Evidence - show actual values
    if (evidence.skills && evidence.skills.length > 0) {
      contributed.push(`skills: [${evidence.skills.slice(0, 3).join(', ')}${evidence.skills.length > 3 ? `, +${evidence.skills.length - 3} more` : ''}]`);
    }

    // Educational Background Evidence - show actual values
    if (evidence.education && evidence.education.length > 0) {
      contributed.push(`education: [${evidence.education.slice(0, 2).join(', ')}${evidence.education.length > 2 ? `, +${evidence.education.length - 2} more` : ''}]`);
    }

    // Achievements and Recognition Evidence - show actual values
    if (evidence.achievements && evidence.achievements.length > 0) {
      contributed.push(`achievements: [${evidence.achievements.slice(0, 2).join(', ')}${evidence.achievements.length > 2 ? `, +${evidence.achievements.length - 2} more` : ''}]`);
    }

    // Organizational Affiliations Evidence - show actual values
    if (evidence.affiliations && evidence.affiliations.length > 0) {
      contributed.push(`affiliations: [${evidence.affiliations.slice(0, 3).join(', ')}${evidence.affiliations.length > 3 ? `, +${evidence.affiliations.length - 3} more` : ''}]`);
    }

    // Web Presence and Digital Assets Evidence - show actual values
    if (evidence.websites && evidence.websites.length > 0) {
      contributed.push(`websites: [${evidence.websites.slice(0, 2).join(', ')}${evidence.websites.length > 2 ? `, +${evidence.websites.length - 2} more` : ''}]`);
    }

    // Advanced Evidence Categories - show actual values if available
    if (evidence.careerProgression && evidence.careerProgression.length > 0) {
      contributed.push(`career: [${evidence.careerProgression.slice(0, 2).join(', ')}${evidence.careerProgression.length > 2 ? `, +${evidence.careerProgression.length - 2} more` : ''}]`);
    }

    if (evidence.industryExpertise && evidence.industryExpertise.length > 0) {
      contributed.push(`expertise: [${evidence.industryExpertise.slice(0, 2).join(', ')}${evidence.industryExpertise.length > 2 ? `, +${evidence.industryExpertise.length - 2} more` : ''}]`);
    }

    if (evidence.publications && evidence.publications.length > 0) {
      contributed.push(`publications: [${evidence.publications.slice(0, 2).join(', ')}${evidence.publications.length > 2 ? `, +${evidence.publications.length - 2} more` : ''}]`);
    }

    if (evidence.languages && evidence.languages.length > 0) {
      contributed.push(`languages: [${evidence.languages.join(', ')}]`);
    }

    if (evidence.coordinates) {
      contributed.push(`coordinates: ${evidence.coordinates}`);
    }

    if (evidence.employmentPeriod) {
      contributed.push(`employment: ${evidence.employmentPeriod}`);
    }

    if (evidence.responsibilities && evidence.responsibilities.length > 0) {
      contributed.push(`responsibilities: [${evidence.responsibilities.slice(0, 2).join(', ')}${evidence.responsibilities.length > 2 ? `, +${evidence.responsibilities.length - 2} more` : ''}]`);
    }

    return contributed;
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
        const achievementText = achievement.achievement;
        if (!enhanced.achievements!.includes(achievementText)) {
          enhanced.achievements!.push(achievementText);
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
    
    // Add biographical insights with defensive programming
    let biographicalSummary = {};
    
    if (consolidatedBio && consolidatedBio.insights) {
      // Direct structure
      biographicalSummary = {
        careerStage: consolidatedBio.insights.careerStage || 'unknown',
        professionalSeniority: consolidatedBio.professional?.seniority || 'unknown',
        industryExpertise: consolidatedBio.insights.industryExpertise || [],
        educationLevel: consolidatedBio.education?.degrees?.length > 0 
          ? consolidatedBio.education.degrees[0].level 
          : 'unknown',
        thoughtLeadership: consolidatedBio.insights.thoughtLeadership || 'none',
        digitalSavviness: consolidatedBio.insights.digitalSavviness || 'medium',
        geographicMobility: consolidatedBio.insights.geographicMobility || 'unknown',
        keySkills: consolidatedBio.professional?.skills?.slice(0, 5).map((s: any) => s.name) || [],
        achievementsCount: consolidatedBio.professional?.achievements?.length || 0,
        educationInstitutions: consolidatedBio.education?.institutions?.length || 0,
        socialPresence: consolidatedBio.digitalFootprint?.socialProfiles?.length || 0,
        biographicalConfidence: consolidatedBio.resolution?.confidence || 0.5
      };
    } else if (consolidatedBio?.consolidatedBio?.insights) {
      // Nested structure
      biographicalSummary = {
        careerStage: consolidatedBio.consolidatedBio.insights.careerStage || 'unknown',
        professionalSeniority: consolidatedBio.consolidatedBio.professional?.seniority || 'unknown',
        industryExpertise: consolidatedBio.consolidatedBio.insights.industryExpertise || [],
        educationLevel: consolidatedBio.consolidatedBio.education?.degrees?.length > 0 
          ? consolidatedBio.consolidatedBio.education.degrees[0].level 
          : 'unknown',
        thoughtLeadership: consolidatedBio.consolidatedBio.insights.thoughtLeadership || 'none',
        digitalSavviness: consolidatedBio.consolidatedBio.insights.digitalSavviness || 'medium',
        geographicMobility: consolidatedBio.consolidatedBio.insights.geographicMobility || 'unknown',
        keySkills: consolidatedBio.consolidatedBio.professional?.skills?.slice(0, 5).map((s: any) => s.name) || [],
        achievementsCount: consolidatedBio.consolidatedBio.professional?.achievements?.length || 0,
        educationInstitutions: consolidatedBio.consolidatedBio.education?.institutions?.length || 0,
        socialPresence: consolidatedBio.consolidatedBio.digitalFootprint?.socialProfiles?.length || 0,
        biographicalConfidence: consolidatedBio.confidence || 0.5
      };
    } else {
      // Fallback for missing biographical data
      biographicalSummary = {
        careerStage: 'unknown',
        professionalSeniority: 'unknown',
        industryExpertise: [],
        educationLevel: 'unknown',
        thoughtLeadership: 'none',
        digitalSavviness: 'medium',
        geographicMobility: 'unknown',
        keySkills: [],
        achievementsCount: 0,
        educationInstitutions: 0,
        socialPresence: 0,
        biographicalConfidence: 0.5
      };
      console.log('  ⚠️  Missing biographical insights, using fallback data');
    }
    
    return {
      ...basicSummary,
      biographicalInsights: biographicalSummary,
      enhancementMethod: 'advanced_biographical_profiling'
    };
  }
}
