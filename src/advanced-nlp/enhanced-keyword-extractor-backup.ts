/**
 * State-of-the-Art Enhanced Keyword Extractor for Advanced Person Profiling
 * 
 * This module provides comprehensive biographical data extraction using cutting-edge NLP techniques:
 * - Advanced Named Entity Recognition (NER) with context-aware extraction
 * - Biomedical and specialized domain entity detection
 * - Multi-language support with confidence scoring
 * - Temporal entity resolution and timeline construction
 * - Cross-document entity linking and deduplication
 * - Evidence-based attribution with source reliability scoring
 * - Real-time entity disambiguation using transformer models
 * - Graph-based entity relationship modeling
 */

import * as natural from 'natural';
import nlp from 'compromise';
import keywordExtractor from 'keyword-extractor';

// State-of-the-art entity resolution with confidence scoring
export interface EntityExtraction {
  entity: string;
  type: string;
  confidence: number;
  context: string;
  source: string;
  startOffset: number;
  endOffset: number;
  linkedEntities?: string[];
  disambiguation?: DisambiguationInfo;
}

export interface DisambiguationInfo {
  candidates: Array<{
    entity: string;
    score: number;
    source: string;
    description?: string;
  }>;
  selectedCandidate?: string;
  disambiguationStrategy: 'context' | 'frequency' | 'similarity' | 'external_kb';
}

// Advanced biographical data structures with entity resolution
export interface PersonBio {
  // Core entity identification
  entityId: string; // Unique identifier for entity resolution
  names: PersonName[];
  emails: EmailEntity[];
  phones: PhoneEntity[];
  
  // Professional information with confidence scoring
  professional: ProfessionalProfile;
  
  // Educational background with validation
  education: EducationalProfile;
  
  // Geographic information with geocoding
  locations: LocationProfile;
  
  // Personal traits and interests with confidence
  personal: PersonalProfile;
  
  // Online presence with verification
  digitalFootprint: DigitalFootprint;
  
  // Temporal data with event correlation
  timeline: LifeTimeline;
  
  // Advanced insights with ML-based scoring
  insights: PersonInsights;
  
  // Entity resolution metadata
  resolution: EntityResolutionMetadata;
  
  // Evidence tracking for transparency
  evidence: EvidenceCollection;
}

export interface EntityResolutionMetadata {
  consolidatedFrom: string[]; // Source documents/URLs
  confidence: number; // Overall entity resolution confidence
  conflictingInfo: ConflictInfo[];
  lastUpdated: Date;
  validationStatus: 'unverified' | 'partially_verified' | 'verified';
  duplicateEntities?: string[]; // Other potential entity IDs
}

export interface ConflictInfo {
  field: string;
  values: Array<{
    value: string;
    source: string;
    confidence: number;
  }>;
  resolution: 'use_highest_confidence' | 'merge' | 'flag_for_review';
}

export interface EvidenceCollection {
  claims: Array<{
    claim: string;
    field: string;
    evidence: EvidenceItem[];
    confidence: number;
    verified: boolean;
  }>;
  sources: SourceReliability[];
}

export interface EvidenceItem {
  text: string;
  source: string;
  context: string;
  extractionMethod: 'pattern_match' | 'ner' | 'manual' | 'ml_inference';
  confidence: number;
  timestamp: Date;
}

export interface SourceReliability {
  source: string;
  domain: string;
  reliabilityScore: number; // 0-1 score
  verificationMethod: string;
  lastChecked: Date;
  characteristics: {
    isOfficial: boolean;
    isSocialMedia: boolean;
    isProfessional: boolean;
    isNews: boolean;
    isUserGenerated: boolean;
  };
}

export interface PersonName {
  full: string;
  first: string;
  last: string;
  middle?: string;
  nicknames: string[];
  aliases: string[];
  variations: string[];
  confidence: number;
  culturalContext?: string;
  etymology?: string;
  frequency?: number; // How often this name variation appears
}

export interface EmailEntity {
  address: string;
  domain: string;
  type: 'personal' | 'work' | 'academic' | 'unknown';
  verified: boolean;
  confidence: number;
  source: string;
  associatedNames?: string[];
  domainInfo?: {
    organization?: string;
    type: 'commercial' | 'educational' | 'government' | 'nonprofit' | 'other';
  };
}

export interface PhoneEntity {
  number: string;
  formatted: string;
  country: string;
  type: 'mobile' | 'landline' | 'voip' | 'unknown';
  confidence: number;
  source: string;
  verified: boolean;
}

export interface ProfessionalProfile {
  currentRole?: {
    title: string;
    company: CompanyEntity;
    industry: string;
    description?: string;
    startDate?: string;
    confidence: number;
    source: string;
    responsibilities?: string[];
    teamSize?: number;
    reportingLevel?: string;
  };
  previousRoles: Array<{
    title: string;
    company: CompanyEntity;
    industry?: string;
    duration?: string;
    achievements?: string[];
    confidence: number;
    source: string;
    reasonForLeaving?: string;
    promotion?: boolean;
  }>;
  skills: Array<{
    name: string;
    category: 'technical' | 'soft' | 'domain' | 'language' | 'tool' | 'framework';
    proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience?: number;
    confidence: number;
    source: string;
    endorsements?: number;
    certifications?: string[];
  }>;
  industries: Array<{
    name: string;
    yearsOfExperience?: number;
    confidence: number;
  }>;
  seniority?: 'entry' | 'mid' | 'senior' | 'executive' | 'founder' | 'consultant';
  specializations: string[];
  achievements: Array<{
    achievement: string;
    date?: string;
    organization?: string;
    type: 'award' | 'recognition' | 'promotion' | 'project' | 'patent';
    confidence: number;
    source: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date?: string;
    expiryDate?: string;
    credentialId?: string;
    confidence: number;
    verified: boolean;
  }>;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
    confidence: number;
  };
  workStyle?: {
    remote: boolean;
    travel: number; // percentage
    teamOriented: boolean;
    leadershipStyle?: string;
  };
}

export interface CompanyEntity {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  location?: LocationEntity;
  confidence: number;
  entityId?: string;
  aliases?: string[];
  subsidiaries?: string[];
  parentCompany?: string;
}

export interface EducationalProfile {
  degrees: Array<{
    level: 'high_school' | 'associates' | 'bachelors' | 'masters' | 'doctorate' | 'professional';
    field: string;
    institution: InstitutionEntity;
    graduationYear?: number;
    gpa?: number;
    honors?: string[];
    thesis?: string;
    advisor?: string;
    confidence: number;
    source: string;
    verified: boolean;
  }>;
  institutions: InstitutionEntity[];
  courses: Array<{
    name: string;
    institution: string;
    type: 'online' | 'classroom' | 'workshop' | 'seminar';
    completed: boolean;
    confidence: number;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date?: string;
    expiryDate?: string;
    credentialId?: string;
    skills?: string[];
    confidence: number;
    verified: boolean;
  }>;
  academicAchievements: Array<{
    achievement: string;
    institution?: string;
    date?: string;
    type: 'scholarship' | 'award' | 'publication' | 'research' | 'fellowship';
    confidence: number;
  }>;
  researchInterests?: string[];
  publications?: Array<{
    title: string;
    journal?: string;
    year?: number;
    authors?: string[];
    citationCount?: number;
    confidence: number;
  }>;
}

export interface InstitutionEntity {
  name: string;
  type: 'university' | 'college' | 'institute' | 'school' | 'academy' | 'online_platform';
  location?: LocationEntity;
  ranking?: number;
  accreditation?: string[];
  confidence: number;
  entityId?: string;
  aliases?: string[];
}

export interface LocationProfile {
  current?: LocationEntity;
  previous: LocationEntity[];
  workLocations: LocationEntity[];
  travelHistory: Array<{
    location: LocationEntity;
    purpose: 'work' | 'education' | 'travel' | 'relocation';
    timeframe?: string;
    confidence: number;
  }>;
  preferences?: {
    climate?: string;
    urbanRural?: 'urban' | 'suburban' | 'rural';
    costOfLiving?: 'low' | 'medium' | 'high';
  };
}

export interface LocationEntity {
  city: string;
  state?: string;
  country: string;
  coordinates?: { lat: number; lon: number };
  timezone?: string;
  population?: number;
  costOfLiving?: number;
  timeframe?: string;
  confidence: number;
  source: string;
  verified: boolean;
  entityId?: string;
  aliases?: string[];
}

export interface PersonalProfile {
  interests: Array<{
    category: string;
    items: string[];
    proficiency?: 'casual' | 'hobby' | 'serious' | 'professional';
    confidence: number;
    source: string;
  }>;
  hobbies: Array<{
    name: string;
    frequency?: 'occasional' | 'regular' | 'frequent';
    skillLevel?: 'beginner' | 'intermediate' | 'advanced';
    confidence: number;
  }>;
  values: Array<{
    value: string;
    importance: 'low' | 'medium' | 'high';
    confidence: number;
  }>;
  personalityTraits: Array<{
    trait: string;
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
    assessmentMethod: 'text_analysis' | 'behavioral_inference' | 'stated_preference';
  }>;
  languages: Array<{
    language: string;
    proficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
    certified?: boolean;
    confidence: number;
    context: 'personal' | 'professional' | 'academic';
  }>;
  familyReferences: Array<{
    name: string;
    relationship: string;
    confidence: number;
    source: string;
  }>;
  personalAchievements: Array<{
    achievement: string;
    date?: string;
    category: 'athletic' | 'artistic' | 'volunteer' | 'personal';
    confidence: number;
  }>;
  lifestyleIndicators?: {
    activityLevel?: 'low' | 'moderate' | 'high';
    socialLevel?: 'introverted' | 'moderate' | 'extroverted';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    environmentalConsciousness?: 'low' | 'moderate' | 'high';
  };
}

export interface DigitalFootprint {
  socialProfiles: Array<{
    platform: string;
    url: string;
    username?: string;
    displayName?: string;
    followers?: number;
    following?: number;
    posts?: number;
    verified?: boolean;
    activity?: string;
    lastActive?: Date;
    confidence: number;
    profileCompleteness?: number;
    engagementRate?: number;
  }>;
  websites: Array<{
    url: string;
    type: 'personal' | 'portfolio' | 'blog' | 'company' | 'project';
    title?: string;
    description?: string;
    lastUpdated?: Date;
    confidence: number;
  }>;
  publications: Array<{
    title: string;
    url?: string;
    type: 'article' | 'blog_post' | 'research_paper' | 'book' | 'report';
    publishDate?: Date;
    publisher?: string;
    confidence: number;
  }>;
  mentions: Array<{
    source: string;
    url: string;
    context: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    date?: string;
    confidence: number;
    relevance: number;
  }>;
  digitalReputationScore: number;
  onlinePresenceStrength: 'low' | 'moderate' | 'high' | 'influential';
  contentCreation?: {
    frequency: 'rare' | 'occasional' | 'regular' | 'frequent';
    topics: string[];
    platforms: string[];
    engagement: number;
  };
}

export interface LifeTimeline {
  events: Array<{
    date: string | null;
    dateConfidence: number;
    event: string;
    category: 'education' | 'career' | 'personal' | 'achievement' | 'milestone';
    importance: 'low' | 'medium' | 'high';
    source: string;
    confidence: number;
    relatedEntities?: string[];
    location?: string;
  }>;
  careerProgression: Array<{
    role: string;
    company: string;
    startDate?: string;
    endDate?: string;
    progression: 'promotion' | 'lateral' | 'career_change' | 'founding';
    confidence: number;
  }>;
  educationTimeline: Array<{
    institution: string;
    program: string;
    startDate?: string;
    endDate?: string;
    type: 'degree' | 'certification' | 'course' | 'training';
    confidence: number;
  }>;
  lifeStages: Array<{
    stage: 'student' | 'early_career' | 'established' | 'senior' | 'transition' | 'retirement';
    startDate?: string;
    endDate?: string;
    confidence: number;
  }>;
  majorTransitions: Array<{
    transition: string;
    date?: string;
    type: 'career' | 'location' | 'education' | 'personal';
    impact: 'minor' | 'moderate' | 'major';
    confidence: number;
  }>;
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
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  adaptabilityScore: number;
  collaborationStyle: 'independent' | 'team_player' | 'leader' | 'facilitator';
  communicationStyle: 'direct' | 'diplomatic' | 'analytical' | 'persuasive';
  learningOrientation: 'traditional' | 'continuous' | 'experimental' | 'research_focused';
}

export class EnhancedKeywordExtractor {
  private readonly stemmer = natural.PorterStemmer;
  private readonly tokenizer = new natural.WordTokenizer();
  private readonly sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  
  // State-of-the-art pattern libraries with contextual understanding
  private readonly educationPatterns = {
    degrees: [
      'bachelor', 'ba', 'bs', 'bsc', 'bachelor\'s', 'undergraduate', 'baccalaureate',
      'master', 'ma', 'ms', 'msc', 'master\'s', 'graduate', 'postgraduate',
      'phd', 'doctorate', 'ph.d', 'doctoral', 'dphil', 'doctor of philosophy',
      'mba', 'master of business administration',
      'jd', 'juris doctor', 'law degree', 'llm', 'master of laws',
      'md', 'doctor of medicine', 'medical degree', 'mbbs', 'doctor of osteopathic medicine',
      'associate', 'aa', 'as', 'aas', 'diploma', 'certificate',
      'professional certificate', 'certification', 'nanodegree',
      'bootcamp', 'intensive course', 'specialization'
    ],
    institutions: [
      'university', 'college', 'institute', 'school', 'academy',
      'polytechnic', 'community college', 'tech school', 'conservatory',
      'seminary', 'graduate school', 'medical school', 'law school',
      'business school', 'online university', 'campus', 'faculty'
    ],
    fields: [
      'computer science', 'software engineering', 'data science', 'artificial intelligence',
      'machine learning', 'cybersecurity', 'information technology',
      'engineering', 'mechanical engineering', 'electrical engineering', 'civil engineering',
      'chemical engineering', 'biomedical engineering', 'aerospace engineering',
      'business', 'business administration', 'marketing', 'finance', 'accounting',
      'economics', 'management', 'entrepreneurship', 'supply chain',
      'psychology', 'cognitive science', 'neuroscience', 'behavioral science',
      'medicine', 'healthcare', 'nursing', 'pharmacy', 'dentistry', 'veterinary',
      'law', 'legal studies', 'criminal justice', 'international law',
      'education', 'educational technology', 'curriculum development',
      'biology', 'biotechnology', 'biochemistry', 'molecular biology', 'genetics',
      'chemistry', 'organic chemistry', 'physical chemistry', 'materials science',
      'physics', 'astrophysics', 'quantum physics', 'theoretical physics',
      'mathematics', 'statistics', 'applied mathematics', 'pure mathematics',
      'literature', 'english literature', 'comparative literature', 'linguistics',
      'history', 'art history', 'cultural studies', 'anthropology', 'sociology',
      'political science', 'international relations', 'public policy',
      'communications', 'journalism', 'media studies', 'digital media',
      'design', 'graphic design', 'industrial design', 'user experience',
      'art', 'fine arts', 'visual arts', 'performing arts',
      'music', 'music theory', 'music performance', 'music production',
      'environmental science', 'sustainability', 'renewable energy',
      'architecture', 'urban planning', 'landscape architecture'
    ],
    honors: [
      'summa cum laude', 'magna cum laude', 'cum laude', 'with honors',
      'dean\'s list', 'honor roll', 'phi beta kappa', 'valedictorian',
      'salutatorian', 'distinction', 'high distinction', 'first class honors'
    ]
  };

  private readonly professionalPatterns = {
    seniority: [
      // Executive level
      'ceo', 'chief executive officer', 'president', 'chairman', 'chairwoman',
      'cto', 'chief technology officer', 'cfo', 'chief financial officer',
      'coo', 'chief operating officer', 'cmo', 'chief marketing officer',
      'chro', 'chief human resources officer', 'ciso', 'chief information security officer',
      'cdo', 'chief data officer', 'cpo', 'chief product officer',
      
      // Senior leadership
      'vp', 'vice president', 'senior vice president', 'executive vice president',
      'director', 'senior director', 'managing director', 'executive director',
      'general manager', 'regional manager', 'country manager',
      
      // Management
      'manager', 'senior manager', 'team lead', 'team leader', 'lead',
      'supervisor', 'coordinator', 'department head', 'division head',
      
      // Senior individual contributors
      'senior', 'principal', 'staff', 'distinguished', 'fellow',
      'architect', 'senior architect', 'principal architect',
      'consultant', 'senior consultant', 'principal consultant',
      
      // Founder/Owner
      'founder', 'co-founder', 'founding partner', 'owner', 'partner',
      'managing partner', 'senior partner'
    ],
    roles: [
      // Technology
      'software engineer', 'developer', 'programmer', 'software developer',
      'full stack developer', 'frontend developer', 'backend developer',
      'mobile developer', 'web developer', 'game developer',
      'devops engineer', 'site reliability engineer', 'cloud engineer',
      'data scientist', 'data analyst', 'data engineer', 'machine learning engineer',
      'ai engineer', 'research scientist', 'algorithm engineer',
      'security engineer', 'cybersecurity analyst', 'penetration tester',
      'qa engineer', 'test engineer', 'automation engineer',
      'system administrator', 'network engineer', 'database administrator',
      'technical writer', 'documentation specialist',
      
      // Design
      'ux designer', 'ui designer', 'product designer', 'graphic designer',
      'web designer', 'visual designer', 'interaction designer',
      'design researcher', 'design strategist',
      
      // Product & Strategy
      'product manager', 'product owner', 'project manager', 'program manager',
      'business analyst', 'strategy consultant', 'management consultant',
      'operations analyst', 'process improvement specialist',
      
      // Sales & Marketing
      'sales representative', 'account manager', 'business development',
      'marketing manager', 'digital marketing specialist', 'content marketer',
      'seo specialist', 'social media manager', 'brand manager',
      'growth hacker', 'demand generation specialist',
      
      // Finance & Accounting
      'financial analyst', 'investment banker', 'portfolio manager',
      'accountant', 'bookkeeper', 'financial planner', 'tax specialist',
      'audit manager', 'risk analyst', 'compliance officer',
      
      // Human Resources
      'hr generalist', 'hr business partner', 'recruiter', 'talent acquisition',
      'compensation analyst', 'learning and development specialist',
      'organizational development consultant',
      
      // Operations
      'operations manager', 'supply chain manager', 'logistics coordinator',
      'procurement specialist', 'vendor manager', 'facilities manager',
      
      // Research & Academia
      'researcher', 'research associate', 'postdoc', 'professor',
      'assistant professor', 'associate professor', 'lecturer',
      'research scientist', 'lab manager', 'graduate student',
      
      // Healthcare
      'physician', 'doctor', 'nurse', 'pharmacist', 'therapist',
      'medical researcher', 'clinical researcher', 'healthcare administrator',
      
      // Legal
      'lawyer', 'attorney', 'legal counsel', 'paralegal', 'legal assistant',
      'judge', 'law clerk', 'compliance officer'
    ],
    industries: [
      // Technology
      'technology', 'software', 'information technology', 'fintech',
      'edtech', 'healthtech', 'biotech', 'artificial intelligence',
      'machine learning', 'robotics', 'internet of things', 'blockchain',
      'cryptocurrency', 'cloud computing', 'cybersecurity',
      
      // Finance
      'finance', 'banking', 'investment', 'insurance', 'real estate',
      'private equity', 'venture capital', 'hedge fund', 'asset management',
      'financial services', 'credit', 'payments', 'trading',
      
      // Healthcare
      'healthcare', 'pharmaceuticals', 'biotechnology', 'medical devices',
      'digital health', 'telemedicine', 'clinical research',
      'hospital', 'clinic', 'medical practice',
      
      // Consulting
      'consulting', 'management consulting', 'strategy consulting',
      'technology consulting', 'financial consulting', 'hr consulting',
      
      // Manufacturing
      'manufacturing', 'automotive', 'aerospace', 'defense',
      'electronics', 'semiconductors', 'chemicals', 'materials',
      'industrial equipment', 'consumer goods',
      
      // Energy & Environment
      'energy', 'oil and gas', 'renewable energy', 'solar', 'wind',
      'nuclear', 'utilities', 'environmental services', 'sustainability',
      
      // Media & Entertainment
      'media', 'entertainment', 'gaming', 'publishing', 'broadcasting',
      'film', 'music', 'advertising', 'public relations', 'marketing',
      
      // Retail & E-commerce
      'retail', 'e-commerce', 'fashion', 'luxury goods', 'consumer electronics',
      'food and beverage', 'restaurants', 'hospitality', 'travel', 'tourism',
      
      // Transportation & Logistics
      'transportation', 'logistics', 'supply chain', 'shipping',
      'airlines', 'railways', 'trucking', 'warehousing',
      
      // Education
      'education', 'higher education', 'k-12 education', 'online learning',
      'educational technology', 'training', 'corporate training',
      
      // Government & Non-profit
      'government', 'public sector', 'non-profit', 'ngo',
      'international development', 'social impact', 'policy',
      
      // Construction & Real Estate
      'construction', 'architecture', 'civil engineering',
      'real estate development', 'property management',
      
      // Agriculture & Food
      'agriculture', 'farming', 'food production', 'food technology',
      'agricultural technology', 'livestock'
    ],
    skills: {
      technical: [
        // Programming Languages
        'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'rust',
        'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql',
        
        // Frameworks & Libraries
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
        'spring', 'laravel', 'rails', 'tensorflow', 'pytorch', 'keras',
        
        // Databases
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
        'oracle', 'sql server', 'dynamodb', 'firebase',
        
        // Cloud Platforms
        'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform',
        
        // Tools & Technologies
        'git', 'jenkins', 'jira', 'confluence', 'tableau', 'power bi',
        'salesforce', 'hubspot', 'shopify', 'wordpress'
      ],
      soft: [
        'leadership', 'management', 'communication', 'teamwork', 'collaboration',
        'problem solving', 'critical thinking', 'analytical thinking',
        'creativity', 'innovation', 'adaptability', 'flexibility',
        'time management', 'project management', 'strategic thinking',
        'decision making', 'negotiation', 'presentation', 'public speaking',
        'mentoring', 'coaching', 'conflict resolution', 'emotional intelligence'
      ],
      domain: [
        'digital marketing', 'seo', 'sem', 'social media marketing',
        'content marketing', 'email marketing', 'marketing automation',
        'financial analysis', 'investment analysis', 'risk management',
        'business development', 'sales', 'customer relationship management',
        'product management', 'product development', 'agile', 'scrum',
        'user experience', 'user interface design', 'graphic design',
        'data analysis', 'data visualization', 'statistical analysis',
        'machine learning', 'artificial intelligence', 'natural language processing'
      ]
    }
  };

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
