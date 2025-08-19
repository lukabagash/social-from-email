import { PersonEvidence, PersonCluster } from '../person-analysis/analyzer';
import { GoogleSearchResult } from '../google-search/scraper';
import { ScrapedData } from '../web-scraper/general-scraper';
import { ExtractedKeywords } from '../advanced-nlp/keyword-extractor';

// Import K-means clustering library
const KMeans = require('ml-kmeans');

export interface AdvancedPersonCluster extends PersonCluster {
  // Enhanced clustering data
  clusterCentroid: number[]; // Feature vector representing cluster center
  clusterSize: number;
  intraClusterSimilarity: number; // How similar items in cluster are (0-1)
  distinguishingFeatures: string[]; // Features that make this cluster unique
  
  // Advanced evidence
  advancedEvidence: {
    keywords: ExtractedKeywords;
    contentSimilarity: number; // 0-1
    temporalRelevance: number; // 0-1 (how recent/relevant the information is)
    sourceCredibility: number; // 0-1
  };
  
  // Relationship mapping
  connections: Array<{
    type: 'same_person' | 'related_person' | 'unrelated';
    targetClusterId: number;
    confidence: number; // 0-1
    evidence: string[];
  }>;
}

export interface ClusteringFeatures {
  // Identity features
  nameMatch: number; // 0-1
  emailMatch: number; // 0-1
  phoneMatch: number; // 0-1
  
  // Professional features
  titleSimilarity: number; // 0-1
  companySimilarity: number; // 0-1
  skillsOverlap: number; // 0-1
  
  // Social features
  socialPlatformOverlap: number; // 0-1
  locationSimilarity: number; // 0-1
  
  // Content features
  topicSimilarity: number; // 0-1
  keywordDensity: number; // 0-1
  sentimentAlignment: number; // 0-1
  
  // Temporal features
  activityRecency: number; // 0-1
  contentFreshness: number; // 0-1
  
  // Trust features
  sourceTrustScore: number; // 0-1
  domainAuthority: number; // 0-1
}

export class AdvancedKMeansClusterer {
  private targetFirstName: string;
  private targetLastName: string;
  private targetEmail: string;
  
  constructor(firstName: string, lastName: string, email: string) {
    this.targetFirstName = firstName.toLowerCase();
    this.targetLastName = lastName.toLowerCase();
    this.targetEmail = email.toLowerCase();
  }

  public performAdvancedClustering(
    searchResults: GoogleSearchResult[],
    scrapedData: ScrapedData[],
    extractedKeywords: ExtractedKeywords[]
  ): AdvancedPersonCluster[] {
    console.log('🤖 Starting Advanced K-means Clustering Analysis...');
    
    // Step 1: Create feature vectors for each source
    const featureVectors = this.createFeatureVectors(searchResults, scrapedData, extractedKeywords);
    
    // Step 2: Determine optimal number of clusters
    const optimalK = this.determineOptimalClusters(featureVectors);
    console.log(`📊 Optimal number of clusters determined: ${optimalK}`);
    
    // Step 3: Perform K-means clustering
    const clusters = this.performKMeansClustering(featureVectors, optimalK);
    
    // Step 4: Convert to AdvancedPersonClusters
    const advancedClusters = this.createAdvancedPersonClusters(
      clusters, 
      searchResults, 
      scrapedData, 
      extractedKeywords,
      featureVectors
    );
    
    // Step 5: Analyze cluster relationships
    const clustersWithRelationships = this.analyzeClusterRelationships(advancedClusters);
    
    // Step 6: Calculate advanced confidence scores
    const finalClusters = this.calculateAdvancedConfidence(clustersWithRelationships);
    
    console.log(`✅ Advanced clustering completed: ${finalClusters.length} clusters identified`);
    
    return finalClusters.sort((a, b) => b.confidence - a.confidence);
  }

  private createFeatureVectors(
    searchResults: GoogleSearchResult[],
    scrapedData: ScrapedData[],
    extractedKeywords: ExtractedKeywords[]
  ): Array<{
    features: ClusteringFeatures;
    vector: number[];
    sourceIndex: number;
    searchResult: GoogleSearchResult;
    scrapedData?: ScrapedData;
    keywords?: ExtractedKeywords;
  }> {
    const vectors: Array<{
      features: ClusteringFeatures;
      vector: number[];
      sourceIndex: number;
      searchResult: GoogleSearchResult;
      scrapedData?: ScrapedData;
      keywords?: ExtractedKeywords;
    }> = [];

    for (let i = 0; i < searchResults.length; i++) {
      const searchResult = searchResults[i];
      const scraped = scrapedData.find(d => d.url === searchResult.url);
      const keywords = extractedKeywords[i];
      
      // Skip LinkedIn as requested
      if (searchResult.domain.includes('linkedin.com')) {
        continue;
      }

      const features = this.calculateFeatures(searchResult, scraped, keywords);
      const vector = this.featuresToVector(features);
      
      vectors.push({
        features,
        vector,
        sourceIndex: i,
        searchResult,
        scrapedData: scraped,
        keywords
      });
    }

    return vectors;
  }

  private calculateFeatures(
    searchResult: GoogleSearchResult,
    scrapedData?: ScrapedData,
    keywords?: ExtractedKeywords
  ): ClusteringFeatures {
    const text = `${searchResult.title} ${searchResult.snippet} ${scrapedData?.content.paragraphs.join(' ') || ''}`.toLowerCase();
    
    return {
      // Identity features
      nameMatch: this.calculateNameMatch(text, keywords?.names || []),
      emailMatch: this.calculateEmailMatch(text, keywords?.emails || []),
      phoneMatch: this.calculatePhoneMatch(keywords?.phones || []),
      
      // Professional features
      titleSimilarity: this.calculateTitleRelevance(keywords?.titles || []),
      companySimilarity: this.calculateCompanyRelevance(keywords?.companies || []),
      skillsOverlap: this.calculateSkillsRelevance(keywords?.skills || []),
      
      // Social features
      socialPlatformOverlap: this.calculateSocialRelevance(keywords?.socialProfiles || []),
      locationSimilarity: this.calculateLocationRelevance(keywords?.locations || []),
      
      // Content features
      topicSimilarity: this.calculateTopicRelevance(keywords?.topics || []),
      keywordDensity: this.calculateKeywordDensity(text),
      sentimentAlignment: this.calculateSentimentAlignment(keywords?.sentiments || []),
      
      // Temporal features
      activityRecency: this.calculateActivityRecency(scrapedData),
      contentFreshness: this.calculateContentFreshness(text),
      
      // Trust features
      sourceTrustScore: this.calculateSourceTrust(searchResult.domain),
      domainAuthority: this.calculateDomainAuthority(searchResult.domain)
    };
  }

  private featuresToVector(features: ClusteringFeatures): number[] {
    return [
      features.nameMatch,
      features.emailMatch,
      features.phoneMatch,
      features.titleSimilarity,
      features.companySimilarity,
      features.skillsOverlap,
      features.socialPlatformOverlap,
      features.locationSimilarity,
      features.topicSimilarity,
      features.keywordDensity,
      features.sentimentAlignment,
      features.activityRecency,
      features.contentFreshness,
      features.sourceTrustScore,
      features.domainAuthority
    ];
  }

  private determineOptimalClusters(featureVectors: any[]): number {
    if (featureVectors.length <= 2) return 1;
    if (featureVectors.length <= 4) return 2;
    
    // Use elbow method to find optimal K
    const maxK = Math.min(6, Math.floor(featureVectors.length / 2));
    const wcss: number[] = []; // Within-cluster sum of squares
    
    for (let k = 1; k <= maxK; k++) {
      try {
        const kmeans = KMeans(featureVectors.map(v => v.vector), k, {
          initialization: 'random',
          maxIterations: 100
        });
        
        // Calculate WCSS
        let totalWCSS = 0;
        for (let i = 0; i < kmeans.clusters.length; i++) {
          const clusterPoints = featureVectors.filter((_, idx) => kmeans.clusters[idx] === i);
          const centroid = kmeans.centroids[i];
          
          for (const point of clusterPoints) {
            const distance = this.euclideanDistance(point.vector, centroid);
            totalWCSS += distance * distance;
          }
        }
        
        wcss.push(totalWCSS);
      } catch (error) {
        wcss.push(Infinity);
      }
    }
    
    // Find elbow point (largest decrease in WCSS)
    let optimalK = 1;
    let maxImprovement = 0;
    
    for (let i = 1; i < wcss.length; i++) {
      const improvement = wcss[i - 1] - wcss[i];
      if (improvement > maxImprovement) {
        maxImprovement = improvement;
        optimalK = i + 1;
      }
    }
    
    // Ensure we don't cluster too aggressively
    return Math.min(optimalK, 3);
  }

  private performKMeansClustering(featureVectors: any[], k: number): any {
    try {
      return KMeans(featureVectors.map(v => v.vector), k, {
        initialization: 'kmeans++',
        maxIterations: 300,
        tolerance: 1e-4
      });
    } catch (error) {
      console.warn('K-means clustering failed, falling back to simple clustering');
      // Fallback to simple distance-based clustering
      return this.fallbackClustering(featureVectors, k);
    }
  }

  private fallbackClustering(featureVectors: any[], k: number): any {
    const clusters = Array(featureVectors.length).fill(0);
    const centroids = [];
    
    // Simple distance-based clustering
    for (let i = 0; i < k; i++) {
      centroids.push(featureVectors[i % featureVectors.length].vector);
    }
    
    for (let i = 0; i < featureVectors.length; i++) {
      let minDistance = Infinity;
      let assignedCluster = 0;
      
      for (let j = 0; j < centroids.length; j++) {
        const distance = this.euclideanDistance(featureVectors[i].vector, centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          assignedCluster = j;
        }
      }
      
      clusters[i] = assignedCluster;
    }
    
    return { clusters, centroids };
  }

  private createAdvancedPersonClusters(
    clusterResult: any,
    searchResults: GoogleSearchResult[],
    scrapedData: ScrapedData[],
    extractedKeywords: ExtractedKeywords[],
    featureVectors: any[]
  ): AdvancedPersonCluster[] {
    const { clusters, centroids } = clusterResult;
    const advancedClusters: AdvancedPersonCluster[] = [];
    
    // Group feature vectors by cluster
    const clusterGroups: { [key: number]: any[] } = {};
    clusters.forEach((clusterId: number, index: number) => {
      if (!clusterGroups[clusterId]) {
        clusterGroups[clusterId] = [];
      }
      clusterGroups[clusterId].push(featureVectors[index]);
    });
    
    // Create advanced clusters
    Object.keys(clusterGroups).forEach((clusterIdStr, index) => {
      const clusterId = parseInt(clusterIdStr);
      const clusterVectors = clusterGroups[clusterId];
      
      // Merge evidence from all sources in cluster
      const mergedEvidence = this.mergeEvidenceFromCluster(clusterVectors);
      
      // Calculate cluster metrics
      const intraClusterSimilarity = this.calculateIntraClusterSimilarity(clusterVectors);
      const distinguishingFeatures = this.findDistinguishingFeatures(clusterVectors, centroids[clusterId]);
      
      // Create advanced person cluster
      const advancedCluster: AdvancedPersonCluster = {
        confidence: 0, // Will be calculated later
        personEvidence: mergedEvidence,
        sources: clusterVectors.map(v => ({
          url: v.searchResult.url,
          title: v.searchResult.title,
          snippet: v.searchResult.snippet,
          domain: v.searchResult.domain,
          evidenceContributed: this.getEvidenceContributed(v.keywords),
          relevanceScore: this.calculateRelevanceScore(v.features)
        })),
        potentialVariations: this.extractNameVariations(clusterVectors),
        
        // Advanced clustering data
        clusterCentroid: centroids[clusterId],
        clusterSize: clusterVectors.length,
        intraClusterSimilarity,
        distinguishingFeatures,
        
        // Advanced evidence
        advancedEvidence: {
          keywords: this.mergeKeywords(clusterVectors.map(v => v.keywords).filter(k => k)),
          contentSimilarity: this.calculateContentSimilarity(clusterVectors),
          temporalRelevance: this.calculateTemporalRelevance(clusterVectors),
          sourceCredibility: this.calculateSourceCredibility(clusterVectors)
        },
        
        // Relationships (will be filled later)
        connections: []
      };
      
      advancedClusters.push(advancedCluster);
    });
    
    return advancedClusters;
  }

  private analyzeClusterRelationships(clusters: AdvancedPersonCluster[]): AdvancedPersonCluster[] {
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const relationship = this.determineRelationshipType(clusters[i], clusters[j]);
        
        clusters[i].connections.push({
          type: relationship.type,
          targetClusterId: j,
          confidence: relationship.confidence,
          evidence: relationship.evidence
        });
        
        clusters[j].connections.push({
          type: relationship.type,
          targetClusterId: i,
          confidence: relationship.confidence,
          evidence: relationship.evidence
        });
      }
    }
    
    return clusters;
  }

  private calculateAdvancedConfidence(clusters: AdvancedPersonCluster[]): AdvancedPersonCluster[] {
    return clusters.map(cluster => {
      let confidence = 0;
      
      // Base confidence from clustering quality
      confidence += cluster.intraClusterSimilarity * 25;
      
      // Evidence quality
      confidence += this.getEvidenceQualityScore(cluster.personEvidence) * 30;
      
      // Source credibility
      confidence += cluster.advancedEvidence.sourceCredibility * 20;
      
      // Content similarity within cluster
      confidence += cluster.advancedEvidence.contentSimilarity * 15;
      
      // Temporal relevance
      confidence += cluster.advancedEvidence.temporalRelevance * 10;
      
      cluster.confidence = Math.min(Math.round(confidence), 100);
      return cluster;
    });
  }

  // Helper methods for feature calculation
  private calculateNameMatch(text: string, names: string[]): number {
    const targetName = `${this.targetFirstName} ${this.targetLastName}`;
    
    if (text.includes(targetName)) return 1.0;
    if (text.includes(this.targetFirstName) && text.includes(this.targetLastName)) return 0.8;
    if (text.includes(this.targetFirstName) || text.includes(this.targetLastName)) return 0.4;
    
    // Check extracted names
    for (const name of names) {
      if (name.toLowerCase().includes(this.targetFirstName) && name.toLowerCase().includes(this.targetLastName)) {
        return 0.9;
      }
    }
    
    return 0.0;
  }

  private calculateEmailMatch(text: string, emails: string[]): number {
    if (text.includes(this.targetEmail)) return 1.0;
    
    for (const email of emails) {
      if (email.toLowerCase() === this.targetEmail) return 1.0;
      if (email.toLowerCase().includes(this.targetFirstName) || email.toLowerCase().includes(this.targetLastName)) {
        return 0.6;
      }
    }
    
    return 0.0;
  }

  private calculatePhoneMatch(phones: string[]): number {
    // Simple phone match - would need target phone for proper comparison
    return phones.length > 0 ? 0.5 : 0.0;
  }

  private calculateTitleRelevance(titles: string[]): number {
    if (titles.length === 0) return 0.0;
    
    // Check for professional titles
    const professionalTitles = ['director', 'manager', 'engineer', 'developer', 'ceo', 'cto', 'president'];
    const relevantTitles = titles.filter(title => 
      professionalTitles.some(pt => title.toLowerCase().includes(pt))
    );
    
    return Math.min(relevantTitles.length / titles.length, 1.0);
  }

  private calculateCompanyRelevance(companies: string[]): number {
    return companies.length > 0 ? Math.min(companies.length * 0.3, 1.0) : 0.0;
  }

  private calculateSkillsRelevance(skills: string[]): number {
    return Math.min(skills.length * 0.1, 1.0);
  }

  private calculateSocialRelevance(profiles: any[]): number {
    return Math.min(profiles.length * 0.2, 1.0);
  }

  private calculateLocationRelevance(locations: string[]): number {
    return locations.length > 0 ? 0.5 : 0.0;
  }

  private calculateTopicRelevance(topics: string[]): number {
    return Math.min(topics.length * 0.05, 1.0);
  }

  private calculateKeywordDensity(text: string): number {
    const targetWords = [this.targetFirstName, this.targetLastName, this.targetEmail];
    const words = text.split(/\s+/);
    const targetCount = words.filter(word => 
      targetWords.some(target => word.toLowerCase().includes(target))
    ).length;
    
    return Math.min(targetCount / Math.max(words.length, 1), 1.0);
  }

  private calculateSentimentAlignment(sentiments: any[]): number {
    if (sentiments.length === 0) return 0.5;
    
    const avgSentiment = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    // Convert sentiment score (-1 to 1) to alignment score (0 to 1)
    return (avgSentiment + 1) / 2;
  }

  private calculateActivityRecency(scrapedData?: ScrapedData): number {
    // Would need timestamp analysis for proper implementation
    return scrapedData ? 0.7 : 0.3;
  }

  private calculateContentFreshness(text: string): number {
    // Check for recent date mentions
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear, currentYear - 1, currentYear - 2];
    
    for (const year of recentYears) {
      if (text.includes(year.toString())) {
        return 0.8;
      }
    }
    
    return 0.4;
  }

  private calculateSourceTrust(domain: string): number {
    const trustedDomains = [
      'linkedin.com', 'github.com', 'medium.com', 'stackoverflow.com',
      'researchgate.net', 'academia.edu', 'crunchbase.com'
    ];
    
    if (trustedDomains.some(trusted => domain.includes(trusted))) {
      return 0.9;
    }
    
    // Check for common professional domains
    if (domain.includes('.edu') || domain.includes('.org')) {
      return 0.8;
    }
    
    return 0.6;
  }

  private calculateDomainAuthority(domain: string): number {
    // Simplified domain authority calculation
    const highAuthority = ['google.com', 'github.com', 'linkedin.com', 'medium.com'];
    const mediumAuthority = ['twitter.com', 'facebook.com', 'instagram.com'];
    
    if (highAuthority.some(ha => domain.includes(ha))) return 0.9;
    if (mediumAuthority.some(ma => domain.includes(ma))) return 0.7;
    
    return 0.5;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  private calculateIntraClusterSimilarity(clusterVectors: any[]): number {
    if (clusterVectors.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < clusterVectors.length; i++) {
      for (let j = i + 1; j < clusterVectors.length; j++) {
        const distance = this.euclideanDistance(clusterVectors[i].vector, clusterVectors[j].vector);
        const similarity = 1 / (1 + distance); // Convert distance to similarity
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  private findDistinguishingFeatures(clusterVectors: any[], centroid: number[]): string[] {
    const featureNames = [
      'nameMatch', 'emailMatch', 'phoneMatch', 'titleSimilarity', 'companySimilarity',
      'skillsOverlap', 'socialPlatformOverlap', 'locationSimilarity', 'topicSimilarity',
      'keywordDensity', 'sentimentAlignment', 'activityRecency', 'contentFreshness',
      'sourceTrustScore', 'domainAuthority'
    ];
    
    const distinguishing: string[] = [];
    
    for (let i = 0; i < centroid.length; i++) {
      if (centroid[i] > 0.7) { // High feature value
        distinguishing.push(featureNames[i]);
      }
    }
    
    return distinguishing;
  }

  private mergeEvidenceFromCluster(clusterVectors: any[]): PersonEvidence {
    const evidence: PersonEvidence = {};
    
    // Merge evidence from all sources in cluster
    for (const vector of clusterVectors) {
      if (vector.keywords) {
        if (!evidence.name && vector.keywords.names.length > 0) {
          evidence.name = vector.keywords.names[0];
        }
        if (!evidence.email && vector.keywords.emails.length > 0) {
          evidence.email = vector.keywords.emails[0];
        }
        if (!evidence.phone && vector.keywords.phones.length > 0) {
          evidence.phone = vector.keywords.phones[0];
        }
        if (!evidence.title && vector.keywords.titles.length > 0) {
          evidence.title = vector.keywords.titles[0];
        }
        if (!evidence.company && vector.keywords.companies.length > 0) {
          evidence.company = vector.keywords.companies[0];
        }
        if (!evidence.location && vector.keywords.locations.length > 0) {
          evidence.location = vector.keywords.locations[0];
        }
        
        // Merge arrays
        if (!evidence.skills) evidence.skills = [];
        evidence.skills.push(...vector.keywords.skills);
        
        if (!evidence.socialProfiles) evidence.socialProfiles = [];
        evidence.socialProfiles.push(...vector.keywords.socialProfiles);
        
        if (!evidence.education) evidence.education = [];
        evidence.education.push(...vector.keywords.education);
      }
    }
    
    // Remove duplicates
    if (evidence.skills) evidence.skills = [...new Set(evidence.skills)];
    if (evidence.education) evidence.education = [...new Set(evidence.education)];
    
    return evidence;
  }

  private getEvidenceContributed(keywords?: ExtractedKeywords): string[] {
    if (!keywords) return [];
    
    const contributions: string[] = [];
    if (keywords.names.length > 0) contributions.push('names');
    if (keywords.emails.length > 0) contributions.push('emails');
    if (keywords.phones.length > 0) contributions.push('phones');
    if (keywords.titles.length > 0) contributions.push('titles');
    if (keywords.companies.length > 0) contributions.push('companies');
    if (keywords.skills.length > 0) contributions.push('skills');
    if (keywords.socialProfiles.length > 0) contributions.push('social_profiles');
    
    return contributions;
  }

  private calculateRelevanceScore(features: ClusteringFeatures): number {
    return Math.round(
      (features.nameMatch * 30 +
       features.emailMatch * 25 +
       features.titleSimilarity * 15 +
       features.companySimilarity * 10 +
       features.sourceTrustScore * 10 +
       features.keywordDensity * 10)
    );
  }

  private extractNameVariations(clusterVectors: any[]): string[] {
    const variations = new Set<string>();
    
    for (const vector of clusterVectors) {
      if (vector.keywords && vector.keywords.names) {
        vector.keywords.names.forEach((name: string) => variations.add(name));
      }
    }
    
    return Array.from(variations);
  }

  private mergeKeywords(keywordArrays: ExtractedKeywords[]): ExtractedKeywords {
    const merged: ExtractedKeywords = {
      names: [], emails: [], phones: [], locations: [], titles: [], companies: [],
      industries: [], skills: [], interests: [], achievements: [], education: [],
      certifications: [], socialProfiles: [], websites: [], topics: [], sentiments: [],
      keyPhrases: [], namedEntities: [], relationships: []
    };
    
    for (const keywords of keywordArrays.filter(k => k)) {
      Object.keys(merged).forEach(key => {
        if (Array.isArray(keywords[key as keyof ExtractedKeywords])) {
          (merged[key as keyof ExtractedKeywords] as any[]).push(...(keywords[key as keyof ExtractedKeywords] as any[]));
        }
      });
    }
    
    // Remove duplicates
    Object.keys(merged).forEach(key => {
      if (Array.isArray(merged[key as keyof ExtractedKeywords])) {
        (merged[key as keyof ExtractedKeywords] as any[]) = [...new Set(merged[key as keyof ExtractedKeywords] as any[])];
      }
    });
    
    return merged;
  }

  private calculateContentSimilarity(clusterVectors: any[]): number {
    // Calculate average content similarity within cluster
    return Math.random() * 0.3 + 0.7; // Placeholder
  }

  private calculateTemporalRelevance(clusterVectors: any[]): number {
    // Calculate temporal relevance of cluster
    return Math.random() * 0.2 + 0.8; // Placeholder
  }

  private calculateSourceCredibility(clusterVectors: any[]): number {
    const avgCredibility = clusterVectors.reduce((sum, v) => sum + v.features.sourceTrustScore, 0) / clusterVectors.length;
    return avgCredibility;
  }

  private determineRelationshipType(cluster1: AdvancedPersonCluster, cluster2: AdvancedPersonCluster): {
    type: 'same_person' | 'related_person' | 'unrelated';
    confidence: number;
    evidence: string[];
  } {
    const evidence: string[] = [];
    let confidence = 0;
    
    // Compare evidence between clusters
    if (cluster1.personEvidence.email === cluster2.personEvidence.email && cluster1.personEvidence.email) {
      evidence.push('same email');
      confidence += 0.8;
    }
    
    if (cluster1.personEvidence.phone === cluster2.personEvidence.phone && cluster1.personEvidence.phone) {
      evidence.push('same phone');
      confidence += 0.7;
    }
    
    if (cluster1.personEvidence.name === cluster2.personEvidence.name && cluster1.personEvidence.name) {
      evidence.push('same name');
      confidence += 0.6;
    }
    
    if (cluster1.personEvidence.company === cluster2.personEvidence.company && cluster1.personEvidence.company) {
      evidence.push('same company');
      confidence += 0.3;
    }
    
    // Determine relationship type
    let type: 'same_person' | 'related_person' | 'unrelated' = 'unrelated';
    
    if (confidence > 0.6) {
      type = 'same_person';
    } else if (confidence > 0.2) {
      type = 'related_person';
    }
    
    return { type, confidence, evidence };
  }

  private getEvidenceQualityScore(evidence: PersonEvidence): number {
    let score = 0;
    
    if (evidence.email) score += 0.3;
    if (evidence.name) score += 0.2;
    if (evidence.phone) score += 0.2;
    if (evidence.title) score += 0.1;
    if (evidence.company) score += 0.1;
    if (evidence.socialProfiles && evidence.socialProfiles.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }
}
