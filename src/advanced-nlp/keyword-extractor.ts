import * as natural from 'natural';
const keywordExtractor = require('keyword-extractor');
import nlp from 'compromise';

export interface ExtractedKeywords {
  // Core identifying information
  names: string[];
  emails: string[];
  phones: string[];
  locations: string[];
  
  // Professional information
  titles: string[];
  companies: string[];
  industries: string[];
  skills: string[];
  
  // Personal information
  interests: string[];
  achievements: string[];
  education: string[];
  certifications: string[];
  
  // Social and web presence
  socialProfiles: Array<{
    platform: string;
    url: string;
    username?: string;
  }>;
  websites: string[];
  
  // Content analysis
  topics: string[];
  sentiments: Array<{
    text: string;
    score: number; // -1 to 1
  }>;
  
  // Advanced analysis
  keyPhrases: string[];
  namedEntities: string[];
  relationships: Array<{
    person: string;
    relation: string;
    context: string;
  }>;
}

export class AdvancedInfoExtractor {
  private stemmer = natural.PorterStemmer;
  private tokenizer = new natural.WordTokenizer();
  private sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

  public extractKeywordInfo(
    title: string,
    snippet: string,
    content: string,
    url: string,
    targetFirstName: string,
    targetLastName: string,
    targetEmail: string
  ): ExtractedKeywords {
    const fullText = `${title} ${snippet} ${content}`.toLowerCase();
    const doc = nlp(fullText);
    
    const result: ExtractedKeywords = {
      names: this.extractNames(fullText, targetFirstName, targetLastName),
      emails: this.extractEmails(fullText),
      phones: this.extractPhones(fullText),
      locations: this.extractLocations(doc, fullText),
      titles: this.extractTitles(fullText),
      companies: this.extractCompanies(doc, fullText),
      industries: this.extractIndustries(fullText),
      skills: this.extractSkills(fullText),
      interests: this.extractInterests(fullText),
      achievements: this.extractAchievements(fullText),
      education: this.extractEducation(fullText),
      certifications: this.extractCertifications(fullText),
      socialProfiles: this.extractSocialProfiles(content, url),
      websites: this.extractWebsites(fullText),
      topics: this.extractTopics(fullText),
      sentiments: this.analyzeSentiment(fullText),
      keyPhrases: this.extractKeyPhrases(fullText),
      namedEntities: this.extractNamedEntities(doc),
      relationships: this.extractRelationships(doc, targetFirstName, targetLastName)
    };

    return this.filterAndRankResults(result, targetFirstName, targetLastName, targetEmail);
  }

  private extractNames(text: string, targetFirstName: string, targetLastName: string): string[] {
    const names = new Set<string>();
    
    // Target name variations
    const targetVariations = [
      `${targetFirstName} ${targetLastName}`,
      `${targetLastName}, ${targetFirstName}`,
      `${targetFirstName.charAt(0)}. ${targetLastName}`,
      `${targetFirstName} ${targetLastName.charAt(0)}.`,
      targetFirstName,
      targetLastName
    ];
    
    for (const variation of targetVariations) {
      if (text.includes(variation.toLowerCase())) {
        names.add(variation);
      }
    }
    
    // Find other names using regex
    const nameRegex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const foundNames = text.match(nameRegex) || [];
    
    foundNames.forEach(name => {
      if (name.toLowerCase().includes(targetFirstName) || name.toLowerCase().includes(targetLastName)) {
        names.add(name);
      }
    });
    
    return Array.from(names);
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }

  private extractPhones(text: string): string[] {
    const phoneRegexes = [
      /(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}/g,
      /(\+1\s?)?[0-9]{3}[\.\-\s]?[0-9]{3}[\.\-\s]?[0-9]{4}/g,
      /(\+[1-9]\d{1,14})/g // International format
    ];
    
    const phones = new Set<string>();
    phoneRegexes.forEach(regex => {
      const matches = text.match(regex) || [];
      matches.forEach(phone => phones.add(phone.trim()));
    });
    
    return Array.from(phones);
  }

  private extractLocations(doc: any, text: string): string[] {
    const locations = new Set<string>();
    
    // Use compromise to find places
    const places = doc.places().out('array');
    places.forEach((place: string) => locations.add(place));
    
    // Common location patterns
    const locationPatterns = [
      /\b(?:in|from|based in|located in|lives in)\s+([A-Z][a-zA-Z\s,]+(?:, [A-Z]{2}|, [A-Z][a-zA-Z\s]+))/gi,
      /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\b/g, // City, State
      /\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/g // City, Country
    ];
    
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = match.replace(/^(?:in|from|based in|located in|lives in)\s+/i, '');
        locations.add(cleaned);
      });
    });
    
    return Array.from(locations);
  }

  private extractTitles(text: string): string[] {
    const titlePatterns = [
      // Job titles
      /\b(?:CEO|CTO|CFO|COO|CIO|CISO|VP|Vice President|President|Director|Manager|Lead|Senior|Principal|Head of|Chief)\b[^.!?]*?(?=\b(?:at|of|for|with|in)\b|\.|$)/gi,
      // Professional titles
      /\b(?:Engineer|Developer|Designer|Analyst|Consultant|Architect|Specialist|Coordinator|Administrator|Executive|Officer)\b/gi,
      // Academic titles
      /\b(?:Professor|Dr\.?|PhD|Ph\.D\.?|MD|M\.D\.?)\b[^.!?]*?(?=\.|$)/gi
    ];
    
    const titles = new Set<string>();
    titlePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => titles.add(match.trim()));
    });
    
    return Array.from(titles);
  }

  private extractCompanies(doc: any, text: string): string[] {
    const companies = new Set<string>();
    
    // Use compromise to find organizations
    const orgs = doc.organizations().out('array');
    orgs.forEach((org: string) => companies.add(org));
    
    // Company patterns
    const companyPatterns = [
      /\b(?:at|works? (?:at|for)|employed (?:at|by))\s+([A-Z][a-zA-Z\s&.,-]+(?:Inc|LLC|Corp|Company|Co\.|Corporation|Ltd|Limited))/gi,
      /\b([A-Z][a-zA-Z\s&.,-]+(?:Inc|LLC|Corp|Company|Co\.|Corporation|Ltd|Limited))\b/gi
    ];
    
    companyPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = match.replace(/^(?:at|works? (?:at|for)|employed (?:at|by))\s+/i, '');
        companies.add(cleaned);
      });
    });
    
    return Array.from(companies);
  }

  private extractIndustries(text: string): string[] {
    const industries = [
      'technology', 'software', 'hardware', 'IT', 'tech', 'computing', 'data science',
      'finance', 'banking', 'investment', 'accounting', 'financial services',
      'healthcare', 'medical', 'pharmaceutical', 'biotechnology', 'health tech',
      'education', 'teaching', 'academic', 'research', 'university',
      'marketing', 'advertising', 'digital marketing', 'social media',
      'consulting', 'business consulting', 'management consulting',
      'sales', 'business development', 'customer success',
      'design', 'graphic design', 'UX', 'UI', 'user experience',
      'media', 'journalism', 'broadcasting', 'entertainment',
      'manufacturing', 'construction', 'engineering', 'mechanical',
      'legal', 'law', 'attorney', 'lawyer', 'legal services',
      'retail', 'e-commerce', 'consumer goods', 'fashion',
      'real estate', 'property', 'real estate investment'
    ];
    
    return industries.filter(industry => 
      text.includes(industry.toLowerCase())
    );
  }

  private extractSkills(text: string): string[] {
    const skillKeywords = [
      // Programming languages
      'javascript', 'python', 'java', 'typescript', 'react', 'node.js', 'angular', 'vue.js',
      'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'c++', 'c#', '.net',
      // Technologies
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'jenkins', 'terraform',
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      // Skills
      'machine learning', 'artificial intelligence', 'data analysis', 'analytics',
      'project management', 'agile', 'scrum', 'kanban', 'devops',
      'digital marketing', 'seo', 'sem', 'social media marketing',
      'graphic design', 'photoshop', 'illustrator', 'figma', 'sketch',
      'communication', 'leadership', 'team management', 'public speaking'
    ];
    
    return skillKeywords.filter(skill => 
      text.includes(skill.toLowerCase())
    );
  }

  private extractInterests(text: string): string[] {
    const interestKeywords = [
      'hobby', 'interest', 'passion', 'love', 'enjoy', 'like',
      'travel', 'photography', 'music', 'art', 'sports', 'fitness',
      'reading', 'writing', 'cooking', 'gaming', 'technology',
      'volunteering', 'charity', 'community', 'environment'
    ];
    
    const interests = new Set<string>();
    
    interestKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        // Extract context around the keyword
        const regex = new RegExp(`\\b\\w*${keyword}\\w*\\b[^.!?]*`, 'gi');
        const matches = text.match(regex) || [];
        matches.forEach(match => interests.add(match.trim()));
      }
    });
    
    return Array.from(interests).slice(0, 10);
  }

  private extractAchievements(text: string): string[] {
    const achievementPatterns = [
      /\b(?:won|awarded|received|earned|achieved|accomplished|recognized|certified|published|presented|launched|founded|created|built|developed|led|managed)\b[^.!?]*[.!?]/gi,
      /\b(?:award|prize|recognition|certification|degree|diploma|patent|publication|project|achievement)\b[^.!?]*[.!?]/gi
    ];
    
    const achievements = new Set<string>();
    achievementPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => achievements.add(match.trim()));
    });
    
    return Array.from(achievements).slice(0, 10);
  }

  private extractEducation(text: string): string[] {
    const educationPatterns = [
      /\b(?:university|college|school|institute|academy)\s+of\s+[a-zA-Z\s]+/gi,
      /\b[a-zA-Z\s]+\s+(?:university|college|school|institute|academy)\b/gi,
      /\b(?:bachelor|master|phd|doctorate|mba|degree)\s+(?:of|in|from)\s+[a-zA-Z\s]+/gi,
      /\b(?:graduated|studied|attended|alumnus|alumni)\s+(?:from|at)\s+[a-zA-Z\s]+/gi
    ];
    
    const education = new Set<string>();
    educationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => education.add(match.trim()));
    });
    
    return Array.from(education).slice(0, 5);
  }

  private extractCertifications(text: string): string[] {
    const certificationPatterns = [
      /\b(?:certified|certification|certificate)\s+[a-zA-Z\s]+/gi,
      /\b[a-zA-Z\s]+\s+(?:certified|certification|certificate)\b/gi,
      /\b(?:AWS|Azure|Google Cloud|Salesforce|Microsoft|Oracle|Cisco|PMI|PMP|Scrum Master|Six Sigma)\s+[a-zA-Z\s]*\b/gi
    ];
    
    const certifications = new Set<string>();
    certificationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => certifications.add(match.trim()));
    });
    
    return Array.from(certifications).slice(0, 5);
  }

  private extractSocialProfiles(content: string, url: string): Array<{platform: string; url: string; username?: string}> {
    const socialPatterns = [
      { platform: 'Twitter', pattern: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi },
      { platform: 'LinkedIn', pattern: /linkedin\.com\/in\/([a-zA-Z0-9\-]+)/gi },
      { platform: 'GitHub', pattern: /github\.com\/([a-zA-Z0-9\-]+)/gi },
      { platform: 'Instagram', pattern: /instagram\.com\/([a-zA-Z0-9_.]+)/gi },
      { platform: 'Facebook', pattern: /facebook\.com\/([a-zA-Z0-9.]+)/gi },
      { platform: 'YouTube', pattern: /youtube\.com\/(?:c\/|channel\/|user\/)?([a-zA-Z0-9\-_]+)/gi },
      { platform: 'Medium', pattern: /medium\.com\/@([a-zA-Z0-9\-_.]+)/gi },
      { platform: 'Behance', pattern: /behance\.net\/([a-zA-Z0-9\-_]+)/gi },
      { platform: 'Dribbble', pattern: /dribbble\.com\/([a-zA-Z0-9\-_]+)/gi }
    ];
    
    const profiles: Array<{platform: string; url: string; username?: string}> = [];
    const text = `${content} ${url}`;
    
    socialPatterns.forEach(({ platform, pattern }) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        profiles.push({
          platform,
          url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
          username: match[1]
        });
      }
    });
    
    return profiles;
  }

  private extractWebsites(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
    const urls = text.match(urlRegex) || [];
    
    return [...new Set(urls)].slice(0, 10);
  }

  private extractTopics(text: string): string[] {
    // Use keyword extractor to find important topics
    const extractionResult = keywordExtractor.extract(text, {
      language: 'english',
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true
    });
    
    return extractionResult.slice(0, 15);
  }

  private analyzeSentiment(text: string): Array<{text: string; score: number}> {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentiments: Array<{text: string; score: number}> = [];
    
    sentences.slice(0, 5).forEach(sentence => {
      const tokens = this.tokenizer.tokenize(sentence.toLowerCase());
      const score = this.sentiment.getSentiment(tokens);
      sentiments.push({
        text: sentence.trim(),
        score: score
      });
    });
    
    return sentiments;
  }

  private extractKeyPhrases(text: string): string[] {
    const doc = nlp(text);
    
    // Extract noun phrases
    const nounPhrases = doc.match('#Noun+').out('array');
    
    // Extract verb phrases
    const verbPhrases = doc.match('#Verb #Noun+').out('array');
    
    // Combine and filter
    const allPhrases = [...nounPhrases, ...verbPhrases]
      .filter(phrase => phrase.length > 3)
      .filter(phrase => !['the', 'and', 'for', 'with', 'this', 'that'].includes(phrase.toLowerCase()));
    
    return [...new Set(allPhrases)].slice(0, 10);
  }

  private extractNamedEntities(doc: any): string[] {
    const entities = new Set<string>();
    
    // Get people, places, organizations
    doc.people().forEach((person: any) => entities.add(person.text()));
    doc.places().forEach((place: any) => entities.add(place.text()));
    doc.organizations().forEach((org: any) => entities.add(org.text()));
    
    return Array.from(entities);
  }

  private extractRelationships(doc: any, targetFirstName: string, targetLastName: string): Array<{person: string; relation: string; context: string}> {
    const relationships: Array<{person: string; relation: string; context: string}> = [];
    
    // Simple relationship extraction
    const relationshipPatterns = [
      /\b(works? with|colleague|partner|co-?founder|teammate|manager|supervisor|employee|assistant)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(works? with|is a colleague|partner|co-?founder|teammate|manager|supervisor)/gi
    ];
    
    const text = doc.text();
    relationshipPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const relation = match[1];
        const person = match[2] || match[1];
        
        if (person.toLowerCase() !== `${targetFirstName} ${targetLastName}`.toLowerCase()) {
          relationships.push({
            person,
            relation,
            context: match[0]
          });
        }
      }
    });
    
    return relationships.slice(0, 5);
  }

  private filterAndRankResults(result: ExtractedKeywords, targetFirstName: string, targetLastName: string, targetEmail: string): ExtractedKeywords {
    // Filter and rank results based on relevance to target person
    const isRelevant = (text: string) => {
      const lowerText = text.toLowerCase();
      return lowerText.includes(targetFirstName.toLowerCase()) ||
             lowerText.includes(targetLastName.toLowerCase()) ||
             lowerText.includes(targetEmail.toLowerCase());
    };
    
    // Keep only relevant or high-quality results
    return {
      ...result,
      names: result.names.filter(name => isRelevant(name)),
      emails: result.emails.filter(email => email.toLowerCase().includes(targetFirstName.toLowerCase()) || 
                                            email.toLowerCase().includes(targetLastName.toLowerCase()) ||
                                            email === targetEmail),
      titles: result.titles.slice(0, 3), // Keep top 3 titles
      companies: result.companies.slice(0, 3), // Keep top 3 companies
      skills: result.skills.slice(0, 10), // Keep top 10 skills
      interests: result.interests.slice(0, 5), // Keep top 5 interests
      achievements: result.achievements.slice(0, 5), // Keep top 5 achievements
      keyPhrases: result.keyPhrases.slice(0, 8), // Keep top 8 key phrases
      topics: result.topics.slice(0, 10) // Keep top 10 topics
    };
  }
}
