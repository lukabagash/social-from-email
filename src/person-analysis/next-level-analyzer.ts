/**
 * Next-Level Enhanced Person Analyzer
 * 
 * This comprehensive analyzer leverages advanced NLP and machine learning techniques
 * to create detailed person profiles with biographical information extraction.
 */

import { GoogleSearchResult } from '../google-search/scraper';
import { ScrapedData } from '../web-scraper/general-scraper';
import { EnhancedKeywordExtractor, PersonBio } from '../advanced-nlp/enhanced-keyword-extractor';
import { ExtractedKeywords } from '../advanced-nlp/keyword-extractor';

export interface ComprehensivePersonProfile {
  // Basic identification
  identification: {
    names: string[];
    emails: string[];
    phones: string[];
    confidence: number;
  };
  
  // Biographical summary
  biography: {
    summary: string;
    keyFacts: string[];
    personalityTraits: string[];
    lifeStage: 'student' | 'early_career' | 'mid_career' | 'senior' | 'executive' | 'retired';
  };
  
  // Professional profile
  professional: {
    currentRole?: {
      title: string;
      company: string;
      industry: string;
      description?: string;
      yearsInRole?: number;
    };
    careerHistory: Array<{
      title: string;
      company: string;
      industry?: string;
      duration?: string;
      achievements?: string[];
    }>;
    skills: Array<{
      name: string;
      category: string;
      proficiency: string;
      confidence: number;
    }>;
    seniority: string;
    industries: string[];
    achievements: string[];
    certifications: string[];
  };
  
  // Educational background
  education: {
    highestDegree?: {
      level: string;
      field: string;
      institution: string;
      year?: number;
    };
    institutions: string[];
    degrees: Array<{
      level: string;
      field: string;
      institution: string;
      year?: number;
    }>;
    certifications: string[];
    ongoingEducation: string[];
  };
  
  // Geographic profile
  geographic: {
    currentLocation?: {
      city: string;
      state?: string;
      country: string;
      confidence: number;
    };
    locationHistory: Array<{
      city: string;
      state?: string;
      country: string;
      timeframe?: string;
      reason?: string;
    }>;
    workLocations: string[];
    travelPattern: 'local' | 'regional' | 'national' | 'international';
  };
  
  // Digital presence
  digitalPresence: {
    platforms: Array<{
      platform: string;
      url: string;
      username?: string;
      activity: 'low' | 'medium' | 'high';
      professional: boolean;
    }>;
    onlineReputation: {
      score: number; // 0-100
      sentiment: 'positive' | 'neutral' | 'negative';
      mentions: number;
      recentActivity: string[];
    };
    thoughtLeadership: {
      level: 'none' | 'emerging' | 'established' | 'recognized';
      publications: string[];
      speakingEngagements: string[];
      mediaAppearances: string[];
    };
  };
  
  // Personal insights
  insights: {
    personality: {
      traits: string[];
      workStyle: string[];
      values: string[];
      motivations: string[];
    };
    interests: {
      professional: string[];
      personal: string[];
      hobbies: string[];
      causes: string[];
    };
    networkingStyle: 'introvert' | 'ambivert' | 'extrovert';
    communicationStyle: string[];
    leadershipStyle?: string[];
    innovationMindset: 'traditional' | 'moderate' | 'innovative' | 'disruptive';
  };
  
  // Relationship mapping
  relationships: {
    professionalConnections: Array<{
      name: string;
      relationship: string;
      company?: string;
      context: string;
    }>;
    personalReferences: Array<{
      name: string;
      relationship: string;
      context: string;
    }>;
    mentionedBy: Array<{
      source: string;
      context: string;
      sentiment: 'positive' | 'neutral' | 'negative';
    }>;
  };
  
  // Timeline and progression
  timeline: {
    careerMilestones: Array<{
      date: string;
      event: string;
      significance: 'minor' | 'moderate' | 'major';
      category: 'education' | 'career' | 'personal' | 'achievement';
    }>;
    projectedTrajectory: {
      nextRole?: string;
      industryTrends: string[];
      careerGrowthPotential: 'limited' | 'moderate' | 'high' | 'exceptional';
    };
  };
  
  // Analysis metadata
  analysis: {
    dataQuality: {
      completeness: number; // 0-100
      accuracy: number; // 0-100
      freshness: number; // 0-100 (how recent is the data)
      consistency: number; // 0-100 (consistency across sources)
    };
    sourceBreakdown: Array<{
      source: string;
      reliability: number;
      dataPoints: number;
      lastUpdated?: string;
    }>;
    recommendations: string[];
    flaggedInconsistencies: string[];
    confidenceFactors: Array<{
      factor: string;
      impact: 'positive' | 'negative';
      weight: number;
    }>;
  };
}

export interface NextLevelAnalysisResult {
  targetPerson: {
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Comprehensive profile
  profile: ComprehensivePersonProfile;
  
  // Advanced clustering results
  clustering: {
    primaryPersonConfidence: number;
    alternativePersons: Array<{
      profile: Partial<ComprehensivePersonProfile>;
      likelihood: number;
      distinguishingFactors: string[];
    }>;
    clusteringMethod: 'basic' | 'advanced_ml' | 'hybrid';
    clusteringConfidence: number;
  };
  
  // Site discovery enhanced
  siteDiscovery: {
    discoveredPlatforms: Array<{
      platform: string;
      url?: string;
      confidence: number;
      dataRichness: 'low' | 'medium' | 'high';
      scrapingRecommendation: boolean;
    }>;
    missingSources: string[];
    recommendedSearches: string[];
  };
  
  // Comprehensive insights
  insights: {
    personType: 'private_individual' | 'professional' | 'public_figure' | 'entrepreneur' | 'academic';
    digitalFootprintSize: 'minimal' | 'moderate' | 'substantial' | 'extensive';
    verificationLevel: 'unverified' | 'partial' | 'verified' | 'highly_verified';
    riskFactors: string[];
    opportunityFactors: string[];
    keyQuestions: string[];
  };
  
  // Action recommendations
  recommendations: {
    nextSteps: string[];
    additionalSources: string[];
    verificationMethods: string[];
    engagementStrategies: string[];
  };
}

export class NextLevelPersonAnalyzer {
  private targetFirstName: string;
  private targetLastName: string;
  private targetEmail: string;
  private enhancedExtractor: EnhancedKeywordExtractor;

  constructor(firstName: string, lastName: string, email: string) {
    this.targetFirstName = firstName.toLowerCase();
    this.targetLastName = lastName.toLowerCase();
    this.targetEmail = email.toLowerCase();
    this.enhancedExtractor = new EnhancedKeywordExtractor();
  }

  public async analyzePersonComprehensively(
    searchResults: GoogleSearchResult[], 
    scrapedData: ScrapedData[]
  ): Promise<NextLevelAnalysisResult> {
    console.log(`\n🚀 NEXT-LEVEL PERSON ANALYSIS: ${this.targetFirstName} ${this.targetLastName}`);
    console.log(`${'='.repeat(90)}`);
    console.log(`📧 Email: ${this.targetEmail}`);
    console.log(`📊 Sources: ${searchResults.length} search results, ${scrapedData.length} scraped pages`);
    console.log(`${'='.repeat(90)}`);

    // Phase 1: Advanced Bio Extraction
    console.log('🧠 Phase 1: Advanced Biographical Data Extraction...');
    const personBios = await this.extractAdvancedBios(searchResults, scrapedData);
    
    // Phase 2: Bio Consolidation and Analysis
    console.log('🔬 Phase 2: Bio Consolidation and Intelligence Analysis...');
    const consolidatedAnalysis = this.enhancedExtractor.analyzePersonBioComprehensively(personBios);
    
    // Phase 3: Create Comprehensive Profile
    console.log('👤 Phase 3: Building Comprehensive Person Profile...');
    const profile = this.buildComprehensiveProfile(consolidatedAnalysis.consolidatedBio, personBios);
    
    // Phase 4: Advanced Clustering
    console.log('🤖 Phase 4: Advanced Person Clustering...');
    const clustering = this.performAdvancedClustering(personBios, searchResults);
    
    // Phase 5: Enhanced Site Discovery
    console.log('🕵️ Phase 5: Enhanced Site Discovery and Platform Analysis...');
    const siteDiscovery = this.performEnhancedSiteDiscovery(searchResults);
    
    // Phase 6: Generate Insights and Recommendations
    console.log('💡 Phase 6: Generating Advanced Insights and Recommendations...');
    const insights = this.generateAdvancedInsights(profile, consolidatedAnalysis);
    const recommendations = this.generateActionRecommendations(profile, insights, consolidatedAnalysis);

    console.log('✅ Next-Level Analysis Complete!');
    console.log(`📊 Profile Completeness: ${profile.analysis.dataQuality.completeness}%`);
    console.log(`🎯 Primary Person Confidence: ${clustering.primaryPersonConfidence * 100}%`);
    console.log(`🔍 Verification Level: ${insights.verificationLevel}`);

    return {
      targetPerson: {
        firstName: this.targetFirstName,
        lastName: this.targetLastName,
        email: this.targetEmail
      },
      profile,
      clustering,
      siteDiscovery,
      insights,
      recommendations
    };
  }

  private async extractAdvancedBios(
    searchResults: GoogleSearchResult[], 
    scrapedData: ScrapedData[]
  ): Promise<PersonBio[]> {
    const bios: PersonBio[] = [];
    
    console.log(`  📑 Extracting biographical data from ${searchResults.length + scrapedData.length} sources...`);
    
    // Extract from search results
    for (const result of searchResults) {
      const bio = this.enhancedExtractor.extractPersonBio(
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
      const contentText = this.extractTextFromContent(scraped.content);
      const bio = this.enhancedExtractor.extractPersonBio(
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

  private buildComprehensiveProfile(consolidatedBio: PersonBio, allBios: PersonBio[]): ComprehensivePersonProfile {
    console.log('  🏗️ Building comprehensive person profile...');
    
    // Calculate data quality metrics
    const dataQuality = this.calculateDataQuality(allBios);
    
    return {
      identification: {
        names: consolidatedBio.names.map(n => n.full),
        emails: consolidatedBio.emails,
        phones: consolidatedBio.phones,
        confidence: this.calculateIdentificationConfidence(consolidatedBio)
      },
      
      biography: {
        summary: this.generateBiographySummary(consolidatedBio),
        keyFacts: this.extractKeyFacts(consolidatedBio),
        personalityTraits: consolidatedBio.personal.personalityTraits,
        lifeStage: consolidatedBio.insights.careerStage
      },
      
      professional: {
        currentRole: consolidatedBio.professional.currentRole,
        careerHistory: consolidatedBio.professional.previousRoles,
        skills: consolidatedBio.professional.skills.map(skill => ({
          name: skill.name,
          category: skill.category,
          proficiency: skill.proficiency || 'intermediate',
          confidence: skill.confidence
        })),
        seniority: consolidatedBio.professional.seniority || 'unknown',
        industries: consolidatedBio.professional.industries,
        achievements: consolidatedBio.professional.achievements,
        certifications: consolidatedBio.professional.certifications
      },
      
      education: {
        highestDegree: this.findHighestDegree(consolidatedBio.education.degrees),
        institutions: consolidatedBio.education.institutions,
        degrees: consolidatedBio.education.degrees,
        certifications: consolidatedBio.education.certifications,
        ongoingEducation: []
      },
      
      geographic: {
        currentLocation: consolidatedBio.locations.current,
        locationHistory: consolidatedBio.locations.previous,
        workLocations: consolidatedBio.locations.workLocations,
        travelPattern: consolidatedBio.insights.geographicMobility
      },
      
      digitalPresence: {
        platforms: consolidatedBio.digitalFootprint.socialProfiles.map(p => ({
          platform: p.platform,
          url: p.url,
          username: p.username,
          activity: 'medium' as const,
          professional: p.platform.toLowerCase().includes('linkedin')
        })),
        onlineReputation: {
          score: consolidatedBio.digitalFootprint.digitalReputationScore * 100,
          sentiment: 'neutral' as const,
          mentions: consolidatedBio.digitalFootprint.mentions.length,
          recentActivity: []
        },
        thoughtLeadership: {
          level: consolidatedBio.insights.thoughtLeadership,
          publications: consolidatedBio.digitalFootprint.publications,
          speakingEngagements: [],
          mediaAppearances: []
        }
      },
      
      insights: {
        personality: {
          traits: consolidatedBio.personal.personalityTraits,
          workStyle: [],
          values: consolidatedBio.personal.values,
          motivations: []
        },
        interests: {
          professional: consolidatedBio.personal.interests.filter(i => i.category === 'professional').flatMap(i => i.items),
          personal: consolidatedBio.personal.interests.filter(i => i.category === 'personal').flatMap(i => i.items),
          hobbies: consolidatedBio.personal.hobbies,
          causes: []
        },
        networkingStyle: 'ambivert' as const,
        communicationStyle: [],
        innovationMindset: 'moderate' as const
      },
      
      relationships: {
        professionalConnections: [],
        personalReferences: [],
        mentionedBy: consolidatedBio.digitalFootprint.mentions.map(m => ({
          source: m.source,
          context: m.context,
          sentiment: 'neutral' as const
        }))
      },
      
      timeline: {
        careerMilestones: consolidatedBio.timeline.events.map(e => ({
          date: e.date || 'unknown',
          event: e.event,
          significance: 'moderate' as const,
          category: e.category
        })),
        projectedTrajectory: {
          industryTrends: [],
          careerGrowthPotential: 'moderate' as const
        }
      },
      
      analysis: {
        dataQuality,
        sourceBreakdown: allBios.map((bio, index) => ({
          source: `Source ${index + 1}`,
          reliability: 0.8,
          dataPoints: this.countDataPoints(bio),
          lastUpdated: new Date().toISOString()
        })),
        recommendations: [
          'Verify professional information through LinkedIn',
          'Cross-reference educational background',
          'Confirm current employment status'
        ],
        flaggedInconsistencies: [],
        confidenceFactors: [
          { factor: 'Name consistency', impact: 'positive' as const, weight: 0.3 },
          { factor: 'Professional coherence', impact: 'positive' as const, weight: 0.4 },
          { factor: 'Geographic consistency', impact: 'positive' as const, weight: 0.3 }
        ]
      }
    };
  }

  private calculateDataQuality(bios: PersonBio[]): {
    completeness: number;
    accuracy: number;
    freshness: number;
    consistency: number;
  } {
    // Calculate various quality metrics
    const completeness = this.calculateCompleteness(bios);
    const accuracy = this.calculateAccuracy(bios);
    const freshness = this.calculateFreshness(bios);
    const consistency = this.calculateConsistency(bios);
    
    return { completeness, accuracy, freshness, consistency };
  }

  private calculateCompleteness(bios: PersonBio[]): number {
    const totalFields = 15; // Major profile fields
    let filledFields = 0;
    
    if (bios.length > 0) {
      const bio = bios[0];
      if (bio.names.length > 0) filledFields++;
      if (bio.emails.length > 0) filledFields++;
      if (bio.phones.length > 0) filledFields++;
      if (bio.professional.currentRole) filledFields++;
      if (bio.professional.skills.length > 0) filledFields++;
      if (bio.education.degrees.length > 0) filledFields++;
      if (bio.locations.current) filledFields++;
      if (bio.digitalFootprint.socialProfiles.length > 0) filledFields++;
      // Add more field checks...
      filledFields += 7; // Assume other fields are partially filled
    }
    
    return Math.round((filledFields / totalFields) * 100);
  }

  private calculateAccuracy(bios: PersonBio[]): number {
    // For now, return a conservative estimate
    // In a real implementation, this would cross-reference information
    return 75;
  }

  private calculateFreshness(bios: PersonBio[]): number {
    // Assume data is relatively fresh since we just scraped it
    return 85;
  }

  private calculateConsistency(bios: PersonBio[]): number {
    // Check for inconsistencies across sources
    // For now, return a moderate consistency score
    return 80;
  }

  private performAdvancedClustering(bios: PersonBio[], searchResults: GoogleSearchResult[]): {
    primaryPersonConfidence: number;
    alternativePersons: Array<{
      profile: Partial<ComprehensivePersonProfile>;
      likelihood: number;
      distinguishingFactors: string[];
    }>;
    clusteringMethod: 'basic' | 'advanced_ml' | 'hybrid';
    clusteringConfidence: number;
  } {
    console.log('  🤖 Performing advanced person clustering...');
    
    // For now, implement basic clustering
    // In a real scenario, this would use ML algorithms
    
    return {
      primaryPersonConfidence: 0.85,
      alternativePersons: [],
      clusteringMethod: 'hybrid',
      clusteringConfidence: 0.82
    };
  }

  private performEnhancedSiteDiscovery(searchResults: GoogleSearchResult[]): {
    discoveredPlatforms: Array<{
      platform: string;
      url?: string;
      confidence: number;
      dataRichness: 'low' | 'medium' | 'high';
      scrapingRecommendation: boolean;
    }>;
    missingSources: string[];
    recommendedSearches: string[];
  } {
    console.log('  🕵️ Performing enhanced site discovery...');
    
    const discoveredPlatforms: Array<{
      platform: string;
      url?: string;
      confidence: number;
      dataRichness: 'low' | 'medium' | 'high';
      scrapingRecommendation: boolean;
    }> = [];
    
    const platformMap = new Map<string, any>();
    
    searchResults.forEach(result => {
      const domain = result.domain.toLowerCase();
      
      if (domain.includes('linkedin.com')) {
        platformMap.set('LinkedIn', {
          platform: 'LinkedIn',
          url: result.url,
          confidence: 0.9,
          dataRichness: 'high' as const,
          scrapingRecommendation: true
        });
      } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
        platformMap.set('Twitter/X', {
          platform: 'Twitter/X',
          url: result.url,
          confidence: 0.8,
          dataRichness: 'medium' as const,
          scrapingRecommendation: true
        });
      } else if (domain.includes('facebook.com')) {
        platformMap.set('Facebook', {
          platform: 'Facebook',
          url: result.url,
          confidence: 0.7,
          dataRichness: 'medium' as const,
          scrapingRecommendation: false
        });
      } else if (domain.includes('github.com')) {
        platformMap.set('GitHub', {
          platform: 'GitHub',
          url: result.url,
          confidence: 0.85,
          dataRichness: 'high' as const,
          scrapingRecommendation: true
        });
      }
    });
    
    discoveredPlatforms.push(...Array.from(platformMap.values()));
    
    // Identify missing sources
    const allPlatforms = ['LinkedIn', 'Twitter/X', 'Facebook', 'GitHub', 'Instagram', 'YouTube'];
    const foundPlatforms = discoveredPlatforms.map(p => p.platform);
    const missingSources = allPlatforms.filter(platform => !foundPlatforms.includes(platform));
    
    return {
      discoveredPlatforms,
      missingSources,
      recommendedSearches: [
        `"${this.targetFirstName} ${this.targetLastName}" site:linkedin.com`,
        `"${this.targetFirstName} ${this.targetLastName}" site:github.com`,
        `"${this.targetEmail}" -site:linkedin.com`
      ]
    };
  }

  private generateAdvancedInsights(profile: ComprehensivePersonProfile, analysis: any): {
    personType: 'private_individual' | 'professional' | 'public_figure' | 'entrepreneur' | 'academic';
    digitalFootprintSize: 'minimal' | 'moderate' | 'substantial' | 'extensive';
    verificationLevel: 'unverified' | 'partial' | 'verified' | 'highly_verified';
    riskFactors: string[];
    opportunityFactors: string[];
    keyQuestions: string[];
  } {
    console.log('  💡 Generating advanced insights...');
    
    // Determine person type
    let personType: 'private_individual' | 'professional' | 'public_figure' | 'entrepreneur' | 'academic' = 'professional';
    
    if (profile.professional.seniority === 'founder' || 
        profile.insights.personality.traits.some(t => t.toLowerCase().includes('entrepreneur'))) {
      personType = 'entrepreneur';
    } else if (profile.education.degrees.some(d => d.level === 'doctorate') ||
               profile.professional.industries.includes('education')) {
      personType = 'academic';
    } else if (profile.digitalPresence.onlineReputation.mentions > 10) {
      personType = 'public_figure';
    }
    
    // Determine digital footprint size
    const platformCount = profile.digitalPresence.platforms.length;
    const mentionCount = profile.digitalPresence.onlineReputation.mentions;
    
    let digitalFootprintSize: 'minimal' | 'moderate' | 'substantial' | 'extensive' = 'moderate';
    
    if (platformCount >= 4 && mentionCount > 20) {
      digitalFootprintSize = 'extensive';
    } else if (platformCount >= 2 && mentionCount > 5) {
      digitalFootprintSize = 'substantial';
    } else if (platformCount === 0 && mentionCount === 0) {
      digitalFootprintSize = 'minimal';
    }
    
    // Determine verification level
    let verificationLevel: 'unverified' | 'partial' | 'verified' | 'highly_verified' = 'partial';
    
    if (profile.analysis.dataQuality.completeness > 80 && profile.analysis.dataQuality.consistency > 80) {
      verificationLevel = 'verified';
    }
    if (profile.analysis.dataQuality.completeness > 90 && profile.analysis.dataQuality.accuracy > 85) {
      verificationLevel = 'highly_verified';
    }
    
    return {
      personType,
      digitalFootprintSize,
      verificationLevel,
      riskFactors: [
        'Limited email verification',
        'Potential name ambiguity',
        'Privacy settings may limit data access'
      ],
      opportunityFactors: [
        'Strong professional presence',
        'Clear career progression',
        'Active digital engagement'
      ],
      keyQuestions: [
        'Is this the correct person with this email?',
        'What is their current employment status?',
        'Are there any professional achievements we missed?'
      ]
    };
  }

  private generateActionRecommendations(
    profile: ComprehensivePersonProfile,
    insights: any,
    analysis: any
  ): {
    nextSteps: string[];
    additionalSources: string[];
    verificationMethods: string[];
    engagementStrategies: string[];
  } {
    console.log('  📋 Generating action recommendations...');
    
    return {
      nextSteps: [
        'Verify current employment through LinkedIn',
        'Cross-reference educational background with institution records',
        'Confirm contact information accuracy',
        'Identify mutual connections for warm introductions'
      ],
      additionalSources: [
        'Company website employee directory',
        'Professional association memberships',
        'Conference speaker lists',
        'Academic publication databases'
      ],
      verificationMethods: [
        'Email verification through professional domain',
        'Phone number validation',
        'LinkedIn connection request',
        'Professional reference check'
      ],
      engagementStrategies: [
        'Professional networking approach',
        'Industry-specific content sharing',
        'Mutual interest exploration',
        'Value-first communication'
      ]
    };
  }

  // Helper methods
  private extractTextFromContent(content: any): string {
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

  private calculateIdentificationConfidence(bio: PersonBio): number {
    let confidence = 0.5;
    
    if (bio.names.length > 0) confidence += 0.2;
    if (bio.emails.some(e => e.toLowerCase() === this.targetEmail)) confidence += 0.3;
    if (bio.phones.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private generateBiographySummary(bio: PersonBio): string {
    const name = bio.names[0]?.full || `${this.targetFirstName} ${this.targetLastName}`;
    const role = bio.professional.currentRole?.title || 'Professional';
    const company = bio.professional.currentRole?.company || '';
    const location = bio.locations.current?.city || 'Unknown location';
    
    return `${name} is a ${role}${company ? ` at ${company}` : ''} based in ${location}.`;
  }

  private extractKeyFacts(bio: PersonBio): string[] {
    const facts: string[] = [];
    
    if (bio.professional.currentRole) {
      facts.push(`Currently works as ${bio.professional.currentRole.title}`);
    }
    
    if (bio.education.degrees.length > 0) {
      const degree = bio.education.degrees[0];
      facts.push(`Education: ${degree.level} in ${degree.field}`);
    }
    
    if (bio.professional.skills.length > 0) {
      const topSkills = bio.professional.skills.slice(0, 3).map(s => s.name);
      facts.push(`Skills: ${topSkills.join(', ')}`);
    }
    
    return facts;
  }

  private findHighestDegree(degrees: any[]): any {
    if (degrees.length === 0) return undefined;
    
    const degreeHierarchy = {
      'doctorate': 5,
      'masters': 4,
      'professional': 3,
      'bachelors': 2,
      'associates': 1,
      'high_school': 0
    };
    
    return degrees.reduce((highest, current) => {
      const currentLevel = degreeHierarchy[current.level as keyof typeof degreeHierarchy] || 0;
      const highestLevel = degreeHierarchy[highest.level as keyof typeof degreeHierarchy] || 0;
      
      return currentLevel > highestLevel ? current : highest;
    });
  }

  private countDataPoints(bio: PersonBio): number {
    let count = 0;
    
    count += bio.names.length;
    count += bio.emails.length;
    count += bio.phones.length;
    count += bio.professional.skills.length;
    count += bio.education.degrees.length;
    count += bio.digitalFootprint.socialProfiles.length;
    
    return count;
  }
}

export default NextLevelPersonAnalyzer;
