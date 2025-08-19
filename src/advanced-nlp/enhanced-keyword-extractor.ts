/**
 * Enhanced Keyword Extractor for Advanced Person Profiling
 * 
 * This module provides comprehensive biographical data extraction using advanced NLP techniques:
 * - Educational background extraction
 * - Professional experience analysis
 * - Company and role identification
 * - Geographic location detection
 * - Personality and interest profiling
 * - Achievement and certification tracking
 * - Social network analysis
 * - Temporal data extraction (career progression)
 */

import * as natural from 'natural';
import nlp from 'compromise';
import keywordExtractor from 'keyword-extractor';

// Enhanced data structures for comprehensive person profiling
export interface PersonBio {
  // Core identification
  names: PersonName[];
  emails: string[];
  phones: string[];
  
  // Professional information
  professional: ProfessionalProfile;
  
  // Educational background
  education: EducationalProfile;
  
  // Geographic information
  locations: LocationProfile;
  
  // Personal traits and interests
  personal: PersonalProfile;
  
  // Online presence
  digitalFootprint: DigitalFootprint;
  
  // Temporal data
  timeline: LifeTimeline;
  
  // Advanced insights
  insights: PersonInsights;
}

export interface PersonName {
  full: string;
  first: string;
  last: string;
  middle?: string;
  nicknames: string[];
  variations: string[];
  confidence: number;
}

export interface ProfessionalProfile {
  currentRole?: {
    title: string;
    company: string;
    industry: string;
    description?: string;
    startDate?: string;
    confidence: number;
  };
  previousRoles: Array<{
    title: string;
    company: string;
    industry?: string;
    duration?: string;
    achievements?: string[];
    confidence: number;
  }>;
  skills: Array<{
    name: string;
    category: 'technical' | 'soft' | 'domain' | 'language';
    proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    confidence: number;
  }>;
  industries: string[];
  seniority?: 'entry' | 'mid' | 'senior' | 'executive' | 'founder';
  specializations: string[];
  achievements: string[];
  certifications: string[];
}

export interface EducationalProfile {
  degrees: Array<{
    level: 'high_school' | 'associates' | 'bachelors' | 'masters' | 'doctorate' | 'professional';
    field: string;
    institution: string;
    graduationYear?: number;
    honors?: string[];
    confidence: number;
  }>;
  institutions: string[];
  courses: string[];
  certifications: string[];
  academicAchievements: string[];
}

export interface LocationProfile {
  current?: {
    city: string;
    state?: string;
    country: string;
    confidence: number;
  };
  previous: Array<{
    city: string;
    state?: string;
    country: string;
    timeframe?: string;
    confidence: number;
  }>;
  workLocations: string[];
  travelHistory: string[];
}

export interface PersonalProfile {
  interests: Array<{
    category: string;
    items: string[];
    confidence: number;
  }>;
  hobbies: string[];
  values: string[];
  personalityTraits: string[];
  languages: Array<{
    language: string;
    proficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
  }>;
  familyReferences: string[];
  personalAchievements: string[];
}

export interface DigitalFootprint {
  socialProfiles: Array<{
    platform: string;
    url: string;
    username?: string;
    followers?: number;
    activity?: string;
    confidence: number;
  }>;
  websites: string[];
  publications: string[];
  mentions: Array<{
    source: string;
    context: string;
    date?: string;
  }>;
  digitalReputationScore: number;
}

export interface LifeTimeline {
  events: Array<{
    date: string | null;
    event: string;
    category: 'education' | 'career' | 'personal' | 'achievement';
    source: string;
    confidence: number;
  }>;
  careerProgression: Array<{
    role: string;
    company: string;
    startDate?: string;
    endDate?: string;
  }>;
  educationTimeline: Array<{
    institution: string;
    program: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export interface PersonInsights {
  careerStage: 'student' | 'early_career' | 'mid_career' | 'senior' | 'executive' | 'retired';
  industryExpertise: string[];
  geographicMobility: 'local' | 'regional' | 'national' | 'international';
  digitalSavviness: 'low' | 'medium' | 'high';
  networkingActivity: 'low' | 'medium' | 'high';
  thoughtLeadership: 'none' | 'emerging' | 'established' | 'recognized';
  entrepreneurialIndicators: string[];
  leadershipIndicators: string[];
  innovationIndicators: string[];
  communityInvolvement: string[];
}

export class EnhancedKeywordExtractor {
  private readonly stemmer = natural.PorterStemmer;
  private readonly tokenizer = new natural.WordTokenizer();
  private readonly sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  
  // Advanced pattern libraries
  private readonly educationPatterns = {
    degrees: [
      'bachelor', 'ba', 'bs', 'bsc', 'bachelor\'s', 'undergraduate',
      'master', 'ma', 'ms', 'msc', 'master\'s', 'graduate',
      'phd', 'doctorate', 'ph.d', 'doctoral', 'dphil',
      'mba', 'jd', 'md', 'law degree', 'medical degree',
      'associate', 'aa', 'as', 'aas', 'diploma',
      'certificate', 'certification', 'professional certificate'
    ],
    institutions: [
      'university', 'college', 'institute', 'school', 'academy',
      'polytechnic', 'community college', 'tech school'
    ],
    fields: [
      'computer science', 'engineering', 'business', 'marketing', 'finance',
      'psychology', 'medicine', 'law', 'education', 'biology', 'chemistry',
      'physics', 'mathematics', 'literature', 'history', 'economics',
      'communications', 'journalism', 'design', 'art', 'music'
    ]
  };

  private readonly professionalPatterns = {
    seniority: [
      'ceo', 'cto', 'cfo', 'coo', 'vp', 'vice president', 'president',
      'director', 'senior director', 'managing director',
      'manager', 'senior manager', 'team lead', 'lead',
      'senior', 'principal', 'staff', 'chief',
      'head of', 'founder', 'co-founder', 'owner'
    ],
    roles: [
      'developer', 'engineer', 'architect', 'designer', 'analyst',
      'consultant', 'manager', 'coordinator', 'specialist',
      'administrator', 'executive', 'associate', 'assistant',
      'researcher', 'scientist', 'professor', 'teacher',
      'sales', 'marketing', 'finance', 'operations'
    ],
    industries: [
      'technology', 'software', 'healthcare', 'finance', 'banking',
      'consulting', 'education', 'retail', 'manufacturing',
      'automotive', 'aerospace', 'telecommunications', 'media',
      'entertainment', 'real estate', 'construction', 'energy',
      'pharmaceutical', 'biotechnology', 'agriculture'
    ]
  };

  private readonly locationPatterns = {
    indicators: [
      'based in', 'located in', 'from', 'lives in', 'residing in',
      'working from', 'remote from', 'headquarters in', 'office in'
    ]
  };

  public extractPersonBio(
    title: string,
    snippet: string,
    content: string,
    url: string,
    targetFirstName: string,
    targetLastName: string,
    targetEmail: string
  ): PersonBio {
    const fullText = `${title} ${snippet} ${content}`;
    const doc = nlp(fullText);
    
    console.log(`🧠 Enhanced bio extraction for ${targetFirstName} ${targetLastName}`);
    
    return {
      names: this.extractPersonNames(fullText, targetFirstName, targetLastName),
      emails: this.extractEmails(fullText),
      phones: this.extractPhones(fullText),
      professional: this.extractProfessionalProfile(doc, fullText),
      education: this.extractEducationalProfile(doc, fullText),
      locations: this.extractLocationProfile(doc, fullText),
      personal: this.extractPersonalProfile(doc, fullText),
      digitalFootprint: this.extractDigitalFootprint(content, url),
      timeline: this.extractLifeTimeline(doc, fullText),
      insights: this.generatePersonInsights(doc, fullText)
    };
  }

  private extractPersonNames(text: string, targetFirstName: string, targetLastName: string): PersonName[] {
    const names: PersonName[] = [];
    const lowerText = text.toLowerCase();
    
    // Primary target name
    const variations = this.generateNameVariations(targetFirstName, targetLastName);
    let foundVariations: string[] = [];
    let nicknames: string[] = [];
    
    variations.forEach(variation => {
      if (lowerText.includes(variation.toLowerCase())) {
        foundVariations.push(variation);
      }
    });
    
    // Look for nicknames and aliases
    const nicknamePatterns = [
      `${targetFirstName} "([^"]+)"`,
      `${targetFirstName} \\(([^)]+)\\)`,
      `also known as ([\\w\\s]+)`,
      `aka ([\\w\\s]+)`,
      `goes by ([\\w\\s]+)`
    ];
    
    nicknamePatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          const nickname = match.replace(regex, '$1').trim();
          if (nickname) nicknames.push(nickname);
        });
      }
    });
    
    names.push({
      full: `${targetFirstName} ${targetLastName}`,
      first: targetFirstName,
      last: targetLastName,
      nicknames,
      variations: foundVariations,
      confidence: foundVariations.length > 0 ? 0.9 : 0.5
    });
    
    return names;
  }

  private generateNameVariations(firstName: string, lastName: string): string[] {
    return [
      `${firstName} ${lastName}`,
      `${lastName}, ${firstName}`,
      `${firstName} ${lastName.charAt(0)}.`,
      `${firstName.charAt(0)}. ${lastName}`,
      `${firstName.charAt(0)}${lastName}`,
      firstName,
      lastName,
      `${firstName.toLowerCase()} ${lastName.toLowerCase()}`,
      `${firstName.toUpperCase()} ${lastName.toUpperCase()}`
    ];
  }

  private extractProfessionalProfile(doc: any, text: string): ProfessionalProfile {
    const lowerText = text.toLowerCase();
    const profile: ProfessionalProfile = {
      previousRoles: [],
      skills: [],
      industries: [],
      specializations: [],
      achievements: [],
      certifications: []
    };

    // Extract current role
    const currentRolePatterns = [
      'currently\\s+(working as|employed as|serves as)?\\s*([^.]+)',
      'current position[:\\s]+([^.]+)',
      'works as\\s+([^.]+)',
      'is a\\s+([^.]+)\\s+at\\s+([^.]+)',
      '(\\w+)\\s+at\\s+(\\w+[\\w\\s]+)',
    ];

    for (const pattern of currentRolePatterns) {
      const regex = new RegExp(pattern, 'gi');
      const match = lowerText.match(regex);
      if (match) {
        const roleInfo = this.parseRoleInfo(match[0]);
        if (roleInfo.title && roleInfo.company) {
          profile.currentRole = {
            title: roleInfo.title,
            company: roleInfo.company,
            industry: this.identifyIndustry(text),
            confidence: 0.8
          };
          break;
        }
      }
    }

    // Extract skills
    profile.skills = this.extractSkills(text);
    
    // Extract industries
    profile.industries = this.extractIndustries(text);
    
    // Extract certifications
    profile.certifications = this.extractCertifications(text);
    
    // Extract achievements
    profile.achievements = this.extractAchievements(text);
    
    // Determine seniority
    profile.seniority = this.determineSeniority(text);

    return profile;
  }

  private parseRoleInfo(roleText: string): { title?: string; company?: string } {
    // Enhanced role parsing logic
    const atIndex = roleText.toLowerCase().indexOf(' at ');
    if (atIndex !== -1) {
      const title = roleText.substring(0, atIndex).trim();
      const company = roleText.substring(atIndex + 4).trim();
      return { title, company };
    }
    
    return { title: roleText.trim() };
  }

  private extractSkills(text: string): Array<{ name: string; category: 'technical' | 'soft' | 'domain' | 'language'; proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert'; confidence: number }> {
    const skills: Array<{ name: string; category: 'technical' | 'soft' | 'domain' | 'language'; proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert'; confidence: number }> = [];
    
    // Technical skills patterns
    const technicalSkills = [
      'javascript', 'python', 'java', 'c++', 'react', 'angular', 'vue',
      'node.js', 'typescript', 'sql', 'mongodb', 'postgresql', 'aws',
      'azure', 'docker', 'kubernetes', 'git', 'agile', 'scrum'
    ];
    
    // Soft skills patterns
    const softSkills = [
      'leadership', 'communication', 'teamwork', 'problem solving',
      'project management', 'analytical thinking', 'creativity',
      'adaptability', 'time management', 'negotiation'
    ];
    
    const lowerText = text.toLowerCase();
    
    technicalSkills.forEach(skill => {
      if (lowerText.includes(skill)) {
        skills.push({
          name: skill,
          category: 'technical',
          confidence: 0.8
        });
      }
    });
    
    softSkills.forEach(skill => {
      if (lowerText.includes(skill)) {
        skills.push({
          name: skill,
          category: 'soft',
          confidence: 0.7
        });
      }
    });
    
    return skills;
  }

  private extractEducationalProfile(doc: any, text: string): EducationalProfile {
    const profile: EducationalProfile = {
      degrees: [],
      institutions: [],
      courses: [],
      certifications: [],
      academicAchievements: []
    };

    const lowerText = text.toLowerCase();
    
    // Extract degrees
    this.educationPatterns.degrees.forEach(degree => {
      if (lowerText.includes(degree)) {
        const degreeMatch = this.findDegreeContext(text, degree);
        if (degreeMatch) {
          profile.degrees.push(degreeMatch);
        }
      }
    });
    
    // Extract institutions
    const institutionPatterns = [
      '(university of [\\w\\s]+)',
      '([\\w\\s]+ university)',
      '([\\w\\s]+ college)',
      '([\\w\\s]+ institute)'
    ];
    
    institutionPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          profile.institutions.push(match.trim());
        });
      }
    });

    return profile;
  }

  private findDegreeContext(text: string, degree: string): any {
    // Enhanced degree context extraction
    const degreeRegex = new RegExp(`(${degree})\\s+in\\s+([\\w\\s]+)\\s+from\\s+([\\w\\s]+)`, 'gi');
    const match = text.match(degreeRegex);
    
    if (match) {
      return {
        level: this.categorizeDegreeLevel(degree),
        field: match[0].split(' in ')[1]?.split(' from ')[0]?.trim() || '',
        institution: match[0].split(' from ')[1]?.trim() || '',
        confidence: 0.8
      };
    }
    
    return null;
  }

  private categorizeDegreeLevel(degree: string): 'high_school' | 'associates' | 'bachelors' | 'masters' | 'doctorate' | 'professional' {
    const lowerDegree = degree.toLowerCase();
    
    if (lowerDegree.includes('phd') || lowerDegree.includes('doctorate')) return 'doctorate';
    if (lowerDegree.includes('master') || lowerDegree.includes('mba')) return 'masters';
    if (lowerDegree.includes('bachelor')) return 'bachelors';
    if (lowerDegree.includes('associate')) return 'associates';
    if (lowerDegree.includes('md') || lowerDegree.includes('jd')) return 'professional';
    
    return 'bachelors'; // default
  }

  private extractLocationProfile(doc: any, text: string): LocationProfile {
    const profile: LocationProfile = {
      previous: [],
      workLocations: [],
      travelHistory: []
    };

    // Use compromise to find places
    const places = doc.places().out('array');
    
    // Enhanced location extraction with context
    this.locationPatterns.indicators.forEach(indicator => {
      const pattern = `${indicator}\\s+([\\w\\s,]+)`;
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        matches.forEach(match => {
          const location = match.replace(new RegExp(indicator, 'gi'), '').trim();
          const locationParts = location.split(',').map(part => part.trim());
          
          if (locationParts.length >= 2) {
            const cityState = locationParts[0];
            const country = locationParts[1] || 'United States';
            
            if (indicator.includes('based') || indicator.includes('lives')) {
              profile.current = {
                city: cityState,
                country,
                confidence: 0.8
              };
            }
          }
        });
      }
    });

    return profile;
  }

  private extractPersonalProfile(doc: any, text: string): PersonalProfile {
    const profile: PersonalProfile = {
      interests: [],
      hobbies: [],
      values: [],
      personalityTraits: [],
      languages: [],
      familyReferences: [],
      personalAchievements: []
    };

    // Extract interests and hobbies
    const interestPatterns = [
      'interested in ([^.]+)',
      'passionate about ([^.]+)',
      'enjoys ([^.]+)',
      'hobbies include ([^.]+)',
      'loves ([^.]+)'
    ];

    interestPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          const interest = match.replace(regex, '$1').trim();
          profile.interests.push({
            category: 'general',
            items: [interest],
            confidence: 0.7
          });
        });
      }
    });

    return profile;
  }

  private extractDigitalFootprint(content: string, url: string): DigitalFootprint {
    const footprint: DigitalFootprint = {
      socialProfiles: [],
      websites: [],
      publications: [],
      mentions: [],
      digitalReputationScore: 0.5
    };

    // Extract social media profiles
    const socialPatterns = [
      { platform: 'LinkedIn', regex: /linkedin\.com\/in\/([^\s]+)/gi },
      { platform: 'Twitter', regex: /twitter\.com\/([^\s]+)/gi },
      { platform: 'GitHub', regex: /github\.com\/([^\s]+)/gi },
      { platform: 'Facebook', regex: /facebook\.com\/([^\s]+)/gi }
    ];

    socialPatterns.forEach(({ platform, regex }) => {
      const matches = content.match(regex);
      if (matches) {
        matches.forEach(match => {
          footprint.socialProfiles.push({
            platform,
            url: match,
            confidence: 0.9
          });
        });
      }
    });

    return footprint;
  }

  private extractLifeTimeline(doc: any, text: string): LifeTimeline {
    const timeline: LifeTimeline = {
      events: [],
      careerProgression: [],
      educationTimeline: []
    };

    // Extract dates from text using regex patterns instead of compromise-dates
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const dates = text.match(yearPattern) || [];
    
    // Extract temporal events
    const eventPatterns = [
      'in (\\d{4}) ([^.]+)',
      'since (\\d{4}) ([^.]+)',
      'from (\\d{4}) to (\\d{4}) ([^.]+)'
    ];

    eventPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          timeline.events.push({
            date: match.match(/\d{4}/)?.[0] || null,
            event: match,
            category: 'career',
            source: 'text_extraction',
            confidence: 0.6
          });
        });
      }
    });

    return timeline;
  }

  private generatePersonInsights(doc: any, text: string): PersonInsights {
    const insights: PersonInsights = {
      careerStage: this.determineCareerStage(text),
      industryExpertise: this.extractIndustries(text),
      geographicMobility: 'regional',
      digitalSavviness: 'medium',
      networkingActivity: 'medium',
      thoughtLeadership: 'none',
      entrepreneurialIndicators: [],
      leadershipIndicators: [],
      innovationIndicators: [],
      communityInvolvement: []
    };

    // Determine thought leadership
    const thoughtLeadershipIndicators = [
      'published', 'author', 'speaker', 'keynote', 'expert',
      'thought leader', 'influencer', 'consultant'
    ];

    const lowerText = text.toLowerCase();
    const foundIndicators = thoughtLeadershipIndicators.filter(indicator => 
      lowerText.includes(indicator)
    );

    if (foundIndicators.length > 2) {
      insights.thoughtLeadership = 'established';
    } else if (foundIndicators.length > 0) {
      insights.thoughtLeadership = 'emerging';
    }

    return insights;
  }

  // Helper methods
  private extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }

  private extractPhones(text: string): string[] {
    const phoneRegexes = [
      /(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
      /(\+1\s?)?[0-9]{3}[\.\-\s]?[0-9]{3}[\.\-\s]?[0-9]{4}/g,
      /(\+[1-9]\d{1,14})/g
    ];
    
    const phones = new Set<string>();
    phoneRegexes.forEach(regex => {
      const matches = text.match(regex) || [];
      matches.forEach(phone => phones.add(phone.trim()));
    });
    
    return Array.from(phones);
  }

  private identifyIndustry(text: string): string {
    const lowerText = text.toLowerCase();
    
    for (const industry of this.professionalPatterns.industries) {
      if (lowerText.includes(industry)) {
        return industry;
      }
    }
    
    return 'Unknown';
  }

  private extractIndustries(text: string): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    this.professionalPatterns.industries.forEach(industry => {
      if (lowerText.includes(industry)) {
        found.push(industry);
      }
    });
    
    return found;
  }

  private extractCertifications(text: string): string[] {
    const certPatterns = [
      'certified ([^.]+)',
      'certification in ([^.]+)',
      'licensed ([^.]+)',
      'accredited ([^.]+)'
    ];
    
    const certifications: string[] = [];
    
    certPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          certifications.push(match.trim());
        });
      }
    });
    
    return certifications;
  }

  private extractAchievements(text: string): string[] {
    const achievementPatterns = [
      'awarded ([^.]+)',
      'recognized for ([^.]+)',
      'achieved ([^.]+)',
      'accomplished ([^.]+)',
      'won ([^.]+)'
    ];
    
    const achievements: string[] = [];
    
    achievementPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          achievements.push(match.trim());
        });
      }
    });
    
    return achievements;
  }

  private determineSeniority(text: string): 'entry' | 'mid' | 'senior' | 'executive' | 'founder' {
    const lowerText = text.toLowerCase();
    
    const executiveKeywords = ['ceo', 'cto', 'cfo', 'president', 'vp', 'vice president'];
    const seniorKeywords = ['senior', 'principal', 'lead', 'manager', 'director'];
    const founderKeywords = ['founder', 'co-founder', 'owner', 'entrepreneur'];
    
    if (founderKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'founder';
    }
    
    if (executiveKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'executive';
    }
    
    if (seniorKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'senior';
    }
    
    return 'mid';
  }

  private determineCareerStage(text: string): 'student' | 'early_career' | 'mid_career' | 'senior' | 'executive' | 'retired' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('student') || lowerText.includes('studying')) {
      return 'student';
    }
    
    if (lowerText.includes('retired') || lowerText.includes('retirement')) {
      return 'retired';
    }
    
    // Use years of experience if mentioned
    const yearsMatch = lowerText.match(/(\d+)\s+years?\s+of\s+experience/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years < 3) return 'early_career';
      if (years < 8) return 'mid_career';
      if (years < 15) return 'senior';
      return 'executive';
    }
    
    return this.determineSeniority(text) === 'executive' ? 'executive' : 'mid_career';
  }

  // Advanced bio analysis method
  public analyzePersonBioComprehensively(bios: PersonBio[]): {
    consolidatedBio: PersonBio;
    confidence: number;
    inconsistencies: string[];
    recommendations: string[];
  } {
    console.log(`🔬 Analyzing ${bios.length} bio sources for comprehensive profiling...`);
    
    // Consolidation logic here
    const consolidatedBio = this.consolidateBios(bios);
    const confidence = this.calculateBioConfidence(bios);
    const inconsistencies = this.findBioInconsistencies(bios);
    const recommendations = this.generateBioRecommendations(bios, inconsistencies);
    
    return {
      consolidatedBio,
      confidence,
      inconsistencies,
      recommendations
    };
  }

  private consolidateBios(bios: PersonBio[]): PersonBio {
    // Implementation for consolidating multiple bio sources
    // This would merge and prioritize information from different sources
    return bios[0]; // Simplified for now
  }

  private calculateBioConfidence(bios: PersonBio[]): number {
    // Calculate overall confidence based on source consistency
    return 0.8; // Simplified for now
  }

  private findBioInconsistencies(bios: PersonBio[]): string[] {
    // Find conflicting information between sources
    return []; // Simplified for now
  }

  private generateBioRecommendations(bios: PersonBio[], inconsistencies: string[]): string[] {
    // Generate recommendations for improving data quality
    return [
      'Cross-reference professional information with LinkedIn',
      'Verify educational background through institution websites',
      'Confirm current role through company website'
    ];
  }

  // Consolidate biographical data from multiple sources
  public consolidateBiographicalData(bios: PersonBio[]): {
    consolidatedBio: PersonBio;
    confidence: number;
    inconsistencies: string[];
    recommendations: string[];
  } {
    if (bios.length === 0) {
      return {
        consolidatedBio: this.createEmptyPersonBio(),
        confidence: 0,
        inconsistencies: [],
        recommendations: ['No biographical data available']
      };
    }

    const consolidatedBio = this.mergePersonBios(bios);
    const confidence = this.calculateConsolidationConfidence(bios);
    const inconsistencies = this.findBioInconsistencies(bios);
    const recommendations = this.generateBioRecommendations(bios, inconsistencies);

    return {
      consolidatedBio,
      confidence,
      inconsistencies,
      recommendations
    };
  }

  private createEmptyPersonBio(): PersonBio {
    return {
      names: [],
      emails: [],
      phones: [],
      professional: {
        previousRoles: [],
        skills: [],
        industries: [],
        specializations: [],
        achievements: [],
        certifications: []
      },
      education: {
        degrees: [],
        institutions: [],
        courses: [],
        certifications: [],
        academicAchievements: []
      },
      locations: {
        previous: [],
        workLocations: [],
        travelHistory: []
      },
      personal: {
        interests: [],
        hobbies: [],
        values: [],
        personalityTraits: [],
        languages: [],
        familyReferences: [],
        personalAchievements: []
      },
      digitalFootprint: {
        socialProfiles: [],
        websites: [],
        publications: [],
        mentions: [],
        digitalReputationScore: 0.5
      },
      timeline: {
        events: [],
        careerProgression: [],
        educationTimeline: []
      },
      insights: {
        careerStage: 'early_career',
        industryExpertise: [],
        geographicMobility: 'local',
        digitalSavviness: 'medium',
        networkingActivity: 'medium',
        thoughtLeadership: 'none',
        entrepreneurialIndicators: [],
        leadershipIndicators: [],
        innovationIndicators: [],
        communityInvolvement: []
      }
    };
  }

  private mergePersonBios(bios: PersonBio[]): PersonBio {
    const merged = this.createEmptyPersonBio();
    
    // Merge data from all bios, prioritizing the most confident sources
    bios.forEach(bio => {
      // Merge names
      bio.names.forEach(name => {
        const existing = merged.names.find(n => n.full === name.full);
        if (!existing || name.confidence > existing.confidence) {
          merged.names = merged.names.filter(n => n.full !== name.full);
          merged.names.push(name);
        }
      });

      // Merge professional info
      if (bio.professional.currentRole && 
          (!merged.professional.currentRole || 
           bio.professional.currentRole.confidence > merged.professional.currentRole.confidence)) {
        merged.professional.currentRole = bio.professional.currentRole;
      }

      // Merge skills
      bio.professional.skills.forEach(skill => {
        const existing = merged.professional.skills.find(s => s.name === skill.name);
        if (!existing) {
          merged.professional.skills.push(skill);
        }
      });

      // Merge other professional data
      merged.professional.industries = [...new Set([...merged.professional.industries, ...bio.professional.industries])];
      merged.professional.achievements = [...new Set([...merged.professional.achievements, ...bio.professional.achievements])];

      // Merge education
      bio.education.degrees.forEach(degree => {
        const existing = merged.education.degrees.find(d => 
          d.institution === degree.institution && d.field === degree.field
        );
        if (!existing) {
          merged.education.degrees.push(degree);
        }
      });

      // Merge locations
      if (bio.locations.current && !merged.locations.current) {
        merged.locations.current = bio.locations.current;
      }

      // Merge insights (take the most advanced)
      if (bio.insights.careerStage !== 'early_career') {
        merged.insights.careerStage = bio.insights.careerStage;
      }
      if (bio.insights.thoughtLeadership !== 'none') {
        merged.insights.thoughtLeadership = bio.insights.thoughtLeadership;
      }
      merged.insights.industryExpertise = [...new Set([...merged.insights.industryExpertise, ...bio.insights.industryExpertise])];
    });

    return merged;
  }

  private calculateConsolidationConfidence(bios: PersonBio[]): number {
    if (bios.length === 0) return 0;
    if (bios.length === 1) return 0.7;
    
    // Higher confidence with more consistent sources
    const averageDataPoints = bios.reduce((sum, bio) => {
      let points = 0;
      if (bio.names.length > 0) points++;
      if (bio.professional.currentRole) points++;
      if (bio.education.degrees.length > 0) points++;
      if (bio.locations.current) points++;
      return sum + points;
    }, 0) / bios.length;

    return Math.min(0.5 + (averageDataPoints / 4) * 0.4, 0.9);
  }
}

export default EnhancedKeywordExtractor;
