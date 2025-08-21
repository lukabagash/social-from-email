/**
 * Evidence Normalization and Validation for Person Identification
 * 
 * This module provides comprehensive evidence normalization including Unicode NFKC,
 * text cleaning, and entity validation for consistent person identification.
 */

import { URLValidator } from './url-validator';

export interface NormalizedEvidence {
  names: string[];
  emails: string[];
  phones: string[];
  locations: string[];
  organizations: string[];
  domains: string[];
  handles: Array<{platform: string, handle: string, url: string}>;
  keywords: string[];
  years: number[];
  urls: string[];
  confidence: number;
}

export interface EvidenceToken {
  type: 'name' | 'email' | 'phone' | 'location' | 'organization' | 'domain' | 'handle' | 'keyword' | 'year' | 'url';
  value: string;
  confidence: number;
  source: string;
  platform?: string;
}

export class EvidenceNormalizer {
  
  /**
   * Normalizes and validates evidence from scraped content
   */
  static normalizeEvidence(rawText: string, sourceUrl: string): NormalizedEvidence {
    // Step 1: Unicode normalization (NFKC)
    const normalizedText = this.normalizeUnicode(rawText);
    
    // Step 2: Extract and validate tokens
    const tokens = this.extractTokens(normalizedText, sourceUrl);
    
    // Step 3: Deduplicate and organize
    const evidence = this.organizeTokens(tokens);
    
    // Step 4: Calculate confidence score
    evidence.confidence = this.calculateEvidenceConfidence(evidence, sourceUrl);
    
    return evidence;
  }

  /**
   * Normalize Unicode text using NFKC form and clean whitespace
   */
  static normalizeUnicode(text: string): string {
    return text
      .normalize('NFKC')  // Unicode NFKC normalization
      .toLowerCase()      // Lowercase
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();            // Remove leading/trailing whitespace
  }

  /**
   * Extract structured tokens from normalized text
   */
  static extractTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    // Extract names (2-4 word combinations that look like person names)
    const nameTokens = this.extractNameTokens(text, sourceUrl);
    tokens.push(...nameTokens);
    
    // Extract emails
    const emailTokens = this.extractEmailTokens(text, sourceUrl);
    tokens.push(...emailTokens);
    
    // Extract phone numbers
    const phoneTokens = this.extractPhoneTokens(text, sourceUrl);
    tokens.push(...phoneTokens);
    
    // Extract locations
    const locationTokens = this.extractLocationTokens(text, sourceUrl);
    tokens.push(...locationTokens);
    
    // Extract organizations
    const orgTokens = this.extractOrganizationTokens(text, sourceUrl);
    tokens.push(...orgTokens);
    
    // Extract domains
    const domainTokens = this.extractDomainTokens(text, sourceUrl);
    tokens.push(...domainTokens);
    
    // Extract social handles
    const handleTokens = this.extractHandleTokens(text, sourceUrl);
    tokens.push(...handleTokens);
    
    // Extract years
    const yearTokens = this.extractYearTokens(text, sourceUrl);
    tokens.push(...yearTokens);
    
    // Extract URLs
    const urlTokens = this.extractURLTokens(text, sourceUrl);
    tokens.push(...urlTokens);
    
    // Extract salient keywords
    const keywordTokens = this.extractSalientKeywords(text, sourceUrl);
    tokens.push(...keywordTokens);
    
    return tokens;
  }

  /**
   * Extract name tokens with confidence scoring
   */
  private static extractNameTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    // Pattern for names (Title case words)
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g;
    const matches = text.match(namePattern) || [];
    
    matches.forEach(match => {
      const name = this.normalizeUnicode(match);
      const confidence = this.calculateNameConfidence(name, sourceUrl);
      
      if (confidence > 0.3) {  // Only include reasonably confident names
        tokens.push({
          type: 'name',
          value: name,
          confidence,
          source: sourceUrl
        });
      }
    });
    
    return tokens;
  }

  /**
   * Extract and validate email tokens
   */
  private static extractEmailTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailPattern) || [];
    
    matches.forEach(match => {
      const email = match.toLowerCase().trim();
      const confidence = this.calculateEmailConfidence(email, sourceUrl);
      
      if (confidence > 0.5) {
        tokens.push({
          type: 'email',
          value: email,
          confidence,
          source: sourceUrl
        });
      }
    });
    
    return tokens;
  }

  /**
   * Extract and normalize phone numbers
   */
  private static extractPhoneTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    const phonePatterns = [
      /\b\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,  // US format
      /\b\+?([0-9]{1,3})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})\b/g  // International
    ];
    
    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const phone = this.normalizePhoneNumber(match);
        if (phone && this.validatePhoneNumber(phone)) {
          tokens.push({
            type: 'phone',
            value: phone,
            confidence: 0.8,
            source: sourceUrl
          });
        }
      });
    });
    
    return tokens;
  }

  /**
   * Extract location tokens
   */
  private static extractLocationTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    // Common location patterns
    const locationPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/g,  // City, State/Country
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+area\b/gi,  // "San Francisco area"
      /\bbased in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,  // "based in Location"
      /\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,  // "from Location"
    ];
    
    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const location = this.normalizeUnicode(match[1] || match[0]);
        if (this.validateLocation(location)) {
          tokens.push({
            type: 'location',
            value: location,
            confidence: 0.7,
            source: sourceUrl
          });
        }
      }
    });
    
    return tokens;
  }

  /**
   * Extract organization/company tokens
   */
  private static extractOrganizationTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    // Organization patterns
    const orgPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited)\b/g,
      /\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,  // "at Company"
      /\bworks? at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /\bemployed by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    ];
    
    orgPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const org = this.normalizeUnicode(match[1]);
        if (this.validateOrganization(org)) {
          tokens.push({
            type: 'organization',
            value: org,
            confidence: 0.8,
            source: sourceUrl
          });
        }
      }
    });
    
    return tokens;
  }

  /**
   * Extract domain tokens
   */
  private static extractDomainTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    const domainPattern = /\b([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;
    const matches = text.match(domainPattern) || [];
    
    matches.forEach(match => {
      const domain = match.toLowerCase();
      if (this.validateDomain(domain)) {
        tokens.push({
          type: 'domain',
          value: domain,
          confidence: 0.6,
          source: sourceUrl
        });
      }
    });
    
    return tokens;
  }

  /**
   * Extract social media handles
   */
  private static extractHandleTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    // Extract handles using URLValidator
    const socialHandles = URLValidator.extractSocialHandles(text);
    
    socialHandles.forEach(({ platform, handle, confidence }) => {
      if (URLValidator.validateSocialHandle(handle, platform)) {
        tokens.push({
          type: 'handle',
          value: handle,
          confidence,
          source: sourceUrl,
          platform
        });
      }
    });
    
    return tokens;
  }

  /**
   * Extract year tokens
   */
  private static extractYearTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const matches = text.match(yearPattern) || [];
    
    matches.forEach(match => {
      const year = parseInt(match, 10);
      if (year >= 1950 && year <= new Date().getFullYear() + 1) {
        tokens.push({
          type: 'year',
          value: year.toString(),
          confidence: 0.9,
          source: sourceUrl
        });
      }
    });
    
    return tokens;
  }

  /**
   * Extract and validate URL tokens
   */
  private static extractURLTokens(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const matches = text.match(urlPattern) || [];
    
    matches.forEach(match => {
      const validation = URLValidator.validateURL(match);
      if (validation.isValid) {
        tokens.push({
          type: 'url',
          value: validation.normalizedUrl || match,
          confidence: validation.isPersonProfile ? 0.9 : 0.6,
          source: sourceUrl,
          platform: validation.platform
        });
      }
    });
    
    return tokens;
  }

  /**
   * Extract salient keywords (excluding common stop words)
   */
  private static extractSalientKeywords(text: string, sourceUrl: string): EvidenceToken[] {
    const tokens: EvidenceToken[] = [];
    
    // Extended stop words list for generic terms
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with',
      'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'they', 'we', 'you',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'about', 'up', 'out', 'if', 'what', 'when', 'where',
      'who', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
      'very', 'just', 'now', 'here', 'there', 'then', 'than', 'get', 'got', 'new', 'use',
      'work', 'first', 'well', 'way', 'even', 'back', 'good', 'see', 'know', 'come',
      'its', 'over', 'think', 'also', 'your', 'after', 'through', 'take', 'two', 'our',
      // Social media specific
      'follow', 'like', 'share', 'comment', 'post', 'profile', 'page', 'account', 'user',
      'login', 'signup', 'register', 'features', 'help', 'about', 'contact', 'privacy',
      'terms', 'policy', 'blog', 'news', 'explore', 'discover', 'trending', 'popular'
    ]);
    
    const words = text.split(/\s+/).filter(word => word.length > 2);
    const wordCounts: { [key: string]: number } = {};
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
      }
    });
    
    // Extract significant keywords (appear multiple times or are domain-specific)
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count >= 2 || this.isDomainSpecificKeyword(word)) {
        tokens.push({
          type: 'keyword',
          value: word,
          confidence: Math.min(0.9, 0.3 + (count * 0.1)),
          source: sourceUrl
        });
      }
    });
    
    return tokens;
  }

  /**
   * Organize tokens into structured evidence
   */
  private static organizeTokens(tokens: EvidenceToken[]): NormalizedEvidence {
    const evidence: NormalizedEvidence = {
      names: [],
      emails: [],
      phones: [],
      locations: [],
      organizations: [],
      domains: [],
      handles: [],
      keywords: [],
      years: [],
      urls: [],
      confidence: 0
    };
    
    // Group and deduplicate tokens
    const tokenGroups: { [key: string]: EvidenceToken[] } = {};
    tokens.forEach(token => {
      const key = `${token.type}:${token.value}`;
      if (!tokenGroups[key]) {
        tokenGroups[key] = [];
      }
      tokenGroups[key].push(token);
    });
    
    // Take best token from each group
    Object.values(tokenGroups).forEach(group => {
      const bestToken = group.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      switch (bestToken.type) {
        case 'name':
          evidence.names.push(bestToken.value);
          break;
        case 'email':
          evidence.emails.push(bestToken.value);
          break;
        case 'phone':
          evidence.phones.push(bestToken.value);
          break;
        case 'location':
          evidence.locations.push(bestToken.value);
          break;
        case 'organization':
          evidence.organizations.push(bestToken.value);
          break;
        case 'domain':
          evidence.domains.push(bestToken.value);
          break;
        case 'handle':
          evidence.handles.push({
            platform: bestToken.platform || 'Unknown',
            handle: bestToken.value,
            url: `https://${bestToken.platform?.toLowerCase()}.com/${bestToken.value}`
          });
          break;
        case 'keyword':
          evidence.keywords.push(bestToken.value);
          break;
        case 'year':
          evidence.years.push(parseInt(bestToken.value, 10));
          break;
        case 'url':
          evidence.urls.push(bestToken.value);
          break;
      }
    });
    
    return evidence;
  }

  // Validation and confidence calculation methods
  
  private static calculateNameConfidence(name: string, sourceUrl: string): number {
    let confidence = 0.5;
    
    // Boost for reasonable length
    if (name.length >= 5 && name.length <= 50) confidence += 0.2;
    
    // Boost for multiple words
    const words = name.split(' ');
    if (words.length >= 2 && words.length <= 4) confidence += 0.2;
    
    // Boost for proper capitalization
    if (words.every(word => /^[A-Z][a-z]+$/.test(word))) confidence += 0.1;
    
    // Penalty for common non-names
    const nonNames = ['admin', 'user', 'test', 'sample', 'demo', 'example'];
    if (nonNames.some(nonName => name.toLowerCase().includes(nonName))) confidence -= 0.5;
    
    return Math.max(0, Math.min(1, confidence));
  }

  private static calculateEmailConfidence(email: string, sourceUrl: string): number {
    let confidence = 0.7;
    
    // Boost for reasonable length
    if (email.length >= 5 && email.length <= 100) confidence += 0.1;
    
    // Boost for common domains
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (commonDomains.some(domain => email.endsWith(domain))) confidence += 0.1;
    
    // Boost for edu domains
    if (email.includes('.edu')) confidence += 0.1;
    
    // Penalty for obvious spam patterns
    if (/noreply|no-reply|donotreply/.test(email)) confidence -= 0.5;
    
    return Math.max(0, Math.min(1, confidence));
  }

  private static calculateEvidenceConfidence(evidence: NormalizedEvidence, sourceUrl: string): number {
    let confidence = 0;
    let totalWeight = 0;
    
    // Weight different types of evidence
    const weights = {
      names: 0.3,
      emails: 0.25,
      handles: 0.2,
      organizations: 0.1,
      locations: 0.05,
      phones: 0.1
    };
    
    Object.entries(weights).forEach(([type, weight]) => {
      const items = evidence[type as keyof typeof weights] as any[];
      if (items && items.length > 0) {
        confidence += weight;
        totalWeight += weight;
      }
    });
    
    // Normalize confidence
    return totalWeight > 0 ? confidence / totalWeight : 0;
  }

  // Helper validation methods
  
  private static normalizePhoneNumber(phone: string): string {
    return phone.replace(/\D/g, ''); // Remove all non-digits
  }

  private static validatePhoneNumber(phone: string): boolean {
    return phone.length >= 10 && phone.length <= 15;
  }

  private static validateLocation(location: string): boolean {
    return location.length >= 2 && location.length <= 100 && 
           !/^\d+$/.test(location); // Not just numbers
  }

  private static validateOrganization(org: string): boolean {
    return org.length >= 2 && org.length <= 100;
  }

  private static validateDomain(domain: string): boolean {
    return /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.([a-zA-Z]{2,}\.)*[a-zA-Z]{2,}$/.test(domain) &&
           domain.length <= 253;
  }

  private static isDomainSpecificKeyword(word: string): boolean {
    const domainKeywords = [
      // Technical
      'developer', 'engineer', 'programmer', 'analyst', 'architect', 'scientist',
      'manager', 'director', 'consultant', 'specialist', 'researcher',
      // Academic
      'professor', 'student', 'graduate', 'phd', 'masters', 'bachelor',
      'university', 'college', 'research', 'academic',
      // Business
      'founder', 'ceo', 'cto', 'entrepreneur', 'executive', 'leader',
      'coordinator', 'associate', 'senior', 'junior'
    ];
    
    return domainKeywords.includes(word.toLowerCase());
  }
}
