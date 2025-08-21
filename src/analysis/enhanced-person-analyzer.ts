/**
 * Enhanced Person Analyzer with Automatic Pipeline
 * 
 * This module integrates URL validation, evidence normalization, TF-IDF vectorization,
 * HDBSCAN clustering, and entity resolution for robust person identification.
 */

import { GoogleSearchResult } from '../hybrid-search/ultimate-scraper';
import { ScrapedData } from '../web-scraper/general-scraper';
import { URLValidator } from '../utils/url-validator';
import { EvidenceNormalizer, NormalizedEvidence } from '../utils/evidence-normalizer';
import { TFIDFVectorizer, TFIDFVector } from '../utils/tfidf-vectorizer';
import { HDBSCANClusterer, ClusterResult } from '../utils/hdbscan-clusterer';
import { EntityResolver, EntityCluster } from '../utils/entity-resolver';

export interface EnhancedPersonResult {
  inputPerson: {
    firstName: string;
    lastName: string;
    email: string;
  };
  identifiedPersons: EnhancedPersonCluster[];
  processingStats: {
    totalURLsFound: number;
    validURLsProcessed: number;
    filteredOutURLs: number;
    vectorDimensions: number;
    clustersFound: number;
    outlierCount: number;
    entityResolutionTime: number;
    totalProcessingTime: number;
  };
  qualityMetrics: {
    averageConfidence: number;
    profileConsistency: number;
    handleDeduplication: number;
  };
}

export interface EnhancedPersonCluster {
  personId: string;
  confidence: number;
  profiles: EnhancedProfile[];
  canonicalSocialHandle?: {
    platform: string;
    handle: string;
    url: string;
    confidence: number;
  };
  alternateHandles: Array<{
    platform: string;
    handle: string;
    status: 'accepted' | 'rejected';
    reason: string;
  }>;
  topTFIDFTerms: string[];
  entityMatches: string[];
  rationale: string;
  isOutlier: boolean;
}

export interface EnhancedProfile {
  url: string;
  platform: string;
  title: string;
  evidence: NormalizedEvidence;
  relevanceScore: number;
  whyIncluded: string;
  whyNotFiltered: string;
}

export interface ProcessingOptions {
  // URL Filtering
  enableURLValidation: boolean;
  strictProfilePatterns: boolean;
  
  // Evidence Normalization
  unicodeNormalization: boolean;
  aggressiveDeduplication: boolean;
  
  // Vectorization
  minDocFreq: number;
  maxDocFreq: number;
  svdComponents: number;
  useL2Normalization: boolean;
  
  // Clustering
  minClusterSize: number;
  clusteringMetric: 'euclidean' | 'cosine';
  autoOutlierDetection: boolean;
  
  // Entity Resolution
  entityResolutionEnabled: boolean;
  handleDeduplication: boolean;
  multiAccountDetection: boolean;
  
  // Output
  verboseLogging: boolean;
  includeRationale: boolean;
}

export class EnhancedPersonAnalyzer {
  private targetFirstName: string;
  private targetLastName: string;
  private targetEmail: string;
  private options: ProcessingOptions;

  constructor(firstName: string, lastName: string, email: string, options: Partial<ProcessingOptions> = {}) {
    this.targetFirstName = firstName.toLowerCase().trim();
    this.targetLastName = lastName.toLowerCase().trim();
    this.targetEmail = email.toLowerCase().trim();
    
    this.options = {
      // URL Filtering - default to aggressive filtering
      enableURLValidation: true,
      strictProfilePatterns: true,
      
      // Evidence Normalization - default to comprehensive
      unicodeNormalization: true,
      aggressiveDeduplication: true,
      
      // Vectorization - sane defaults for TF-IDF
      minDocFreq: 2,
      maxDocFreq: 0.8,
      svdComponents: 200,
      useL2Normalization: true,
      
      // Clustering - auto-k with reasonable defaults
      minClusterSize: 12,
      clusteringMetric: 'euclidean',
      autoOutlierDetection: true,
      
      // Entity Resolution - enable for deduplication
      entityResolutionEnabled: true,
      handleDeduplication: true,
      multiAccountDetection: true,
      
      // Output - clean logging
      verboseLogging: false,
      includeRationale: true,
      
      ...options
    };
  }

  /**
   * Main analysis method with fully automatic pipeline
   */
  async analyzePersonAutomatic(
    searchResults: GoogleSearchResult[], 
    scrapedData: ScrapedData[]
  ): Promise<EnhancedPersonResult> {
    const startTime = Date.now();
    
    if (this.options.verboseLogging) {
      console.log(`\n🤖 ENHANCED AUTOMATIC PERSON ANALYSIS`);
      console.log(`👤 Target: ${this.targetFirstName} ${this.targetLastName} (${this.targetEmail})`);
      console.log(`📊 Input: ${searchResults.length} search results, ${scrapedData.length} scraped pages`);
      console.log(`${'='.repeat(80)}`);
    }

    // Step 1: URL Validation and Filtering
    console.log(`🔍 Step 1: URL validation and filtering...`);
    const { validResults, filteredCount, validationStats } = this.validateAndFilterURLs(searchResults, scrapedData);
    
    // Step 2: Evidence Normalization
    console.log(`📝 Step 2: Evidence extraction and normalization...`);
    const normalizedEvidence = this.extractNormalizedEvidence(validResults);
    
    // Step 3: TF-IDF Vectorization
    console.log(`🔢 Step 3: TF-IDF vectorization with dimensionality reduction...`);
    const vectors = await this.vectorizeEvidence(normalizedEvidence, validResults);
    
    // Step 4: HDBSCAN Clustering
    console.log(`🎯 Step 4: HDBSCAN clustering with auto-k detection...`);
    const clusterResult = await this.performHDBSCANClustering(vectors);
    
    // Step 5: Entity Resolution
    console.log(`🔗 Step 5: Entity resolution and handle deduplication...`);
    const entityResolutionStart = Date.now();
    const entityClusters = this.options.entityResolutionEnabled ? 
      await this.performEntityResolution(vectors, normalizedEvidence, clusterResult) :
      this.convertClustersToEntities(vectors, normalizedEvidence, clusterResult);
    const entityResolutionTime = Date.now() - entityResolutionStart;
    
    // Step 6: Generate Enhanced Results
    console.log(`📊 Step 6: Generating enhanced analysis results...`);
    const enhancedClusters = this.generateEnhancedClusters(entityClusters, vectors, validResults);
    
    const totalTime = Date.now() - startTime;
    
    const result: EnhancedPersonResult = {
      inputPerson: {
        firstName: this.targetFirstName,
        lastName: this.targetLastName,
        email: this.targetEmail
      },
      identifiedPersons: enhancedClusters,
      processingStats: {
        totalURLsFound: searchResults.length,
        validURLsProcessed: validResults.length,
        filteredOutURLs: filteredCount,
        vectorDimensions: vectors.length > 0 ? vectors[0].features.length : 0,
        clustersFound: clusterResult.clusterCount,
        outlierCount: clusterResult.outliers.length,
        entityResolutionTime,
        totalProcessingTime: totalTime
      },
      qualityMetrics: this.calculateQualityMetrics(enhancedClusters)
    };

    this.logResults(result);
    return result;
  }

  /**
   * Step 1: Validate and filter URLs
   */
  private validateAndFilterURLs(
    searchResults: GoogleSearchResult[], 
    scrapedData: ScrapedData[]
  ): { validResults: Array<{searchResult: GoogleSearchResult, scrapedData?: ScrapedData}>, filteredCount: number, validationStats: any } {
    const validResults: Array<{searchResult: GoogleSearchResult, scrapedData?: ScrapedData}> = [];
    let filteredCount = 0;
    const validationStats = {
      blacklisted: 0,
      invalidPattern: 0,
      validProfiles: 0,
      validOther: 0
    };

    searchResults.forEach(searchResult => {
      if (this.options.enableURLValidation) {
        const validation = URLValidator.validateURL(searchResult.url);
        
        if (!validation.isValid) {
          filteredCount++;
          if (validation.reason?.includes('blacklist')) {
            validationStats.blacklisted++;
          } else {
            validationStats.invalidPattern++;
          }
          
          if (this.options.verboseLogging) {
            console.log(`❌ Filtered: ${searchResult.url} - ${validation.reason}`);
          }
          return;
        }
        
        if (validation.isPersonProfile) {
          validationStats.validProfiles++;
        } else {
          validationStats.validOther++;
        }
        
        if (this.options.verboseLogging && validation.isPersonProfile) {
          console.log(`✅ Valid profile: ${validation.platform} - ${searchResult.url}`);
        }
      }
      
      const scrapedMatch = scrapedData.find(scraped => scraped.url === searchResult.url);
      validResults.push({
        searchResult,
        scrapedData: scrapedMatch
      });
    });

    console.log(`📊 URL Validation: ${validResults.length} valid, ${filteredCount} filtered`);
    console.log(`   - Profiles: ${validationStats.validProfiles}, Other: ${validationStats.validOther}`);
    console.log(`   - Blacklisted: ${validationStats.blacklisted}, Invalid: ${validationStats.invalidPattern}`);

    return { validResults, filteredCount, validationStats };
  }

  /**
   * Step 2: Extract and normalize evidence
   */
  private extractNormalizedEvidence(
    validResults: Array<{searchResult: GoogleSearchResult, scrapedData?: ScrapedData}>
  ): NormalizedEvidence[] {
    return validResults.map(({ searchResult, scrapedData }) => {
      // Combine search result and scraped content
      const combinedText = [
        searchResult.title,
        searchResult.snippet,
        ...(scrapedData?.content.paragraphs || []),
        ...(scrapedData?.content.headings.h1 || []),
        ...(scrapedData?.content.headings.h2 || []),
        ...(scrapedData?.content.headings.h3 || [])
      ].join(' ');

      const evidence = EvidenceNormalizer.normalizeEvidence(combinedText, searchResult.url);
      
      // Add metadata from scraped contact info if available
      if (scrapedData?.content.contactInfo) {
        const contactInfo = scrapedData.content.contactInfo;
        
        // Add emails from scraped data
        contactInfo.emails.forEach(email => {
          if (!evidence.emails.includes(email.toLowerCase())) {
            evidence.emails.push(email.toLowerCase());
          }
        });
        
        // Add phones from scraped data
        contactInfo.phones.forEach(phone => {
          const normalizedPhone = phone.replace(/\D/g, '');
          if (!evidence.phones.includes(normalizedPhone)) {
            evidence.phones.push(normalizedPhone);
          }
        });
        
        // Add social links as handles
        contactInfo.socialLinks.forEach(social => {
          const validation = URLValidator.validateURL(social.url);
          if (validation.isPersonProfile && validation.handle) {
            const existingHandle = evidence.handles.find(h => 
              h.platform === validation.platform && h.handle === validation.handle
            );
            if (!existingHandle) {
              evidence.handles.push({
                platform: validation.platform!,
                handle: validation.handle,
                url: validation.normalizedUrl || social.url
              });
            }
          }
        });
      }

      return evidence;
    });
  }

  /**
   * Step 3: TF-IDF Vectorization
   */
  private async vectorizeEvidence(
    evidenceList: NormalizedEvidence[], 
    validResults: Array<{searchResult: GoogleSearchResult, scrapedData?: ScrapedData}>
  ): Promise<TFIDFVector[]> {
    const vectorizer = new TFIDFVectorizer({
      minDocFreq: this.options.minDocFreq,
      maxDocFreq: this.options.maxDocFreq,
      svdComponents: this.options.svdComponents,
      l2Normalize: this.options.useL2Normalization,
      useUnigrams: true,
      useBigrams: true
    });

    const evidenceWithMetadata = evidenceList.map((evidence, index) => {
      const result = validResults[index];
      const validation = URLValidator.validateURL(result.searchResult.url);
      
      return {
        evidence,
        url: result.searchResult.url,
        platform: validation.platform,
        handle: validation.handle
      };
    });

    const vectors = await vectorizer.vectorizeEvidenceCollection(evidenceWithMetadata);
    
    if (this.options.verboseLogging) {
      const featureImportance = vectorizer.getFeatureImportance().slice(0, 10);
      console.log(`📈 Top TF-IDF features: ${featureImportance.map(f => f.term).join(', ')}`);
    }

    return vectors;
  }

  /**
   * Step 4: HDBSCAN Clustering
   */
  private async performHDBSCANClustering(vectors: TFIDFVector[]): Promise<ClusterResult> {
    const clusterer = new HDBSCANClusterer({
      minClusterSize: this.options.minClusterSize,
      metric: this.options.clusteringMetric
    });

    const result = await clusterer.cluster(vectors);
    
    console.log(`🎯 HDBSCAN Results: ${result.clusterCount} clusters, ${result.outliers.length} outliers`);
    
    if (result.clusterCount === 0) {
      console.log(`⚠️  No clusters found. Treating all data as outliers.`);
    }

    return result;
  }

  /**
   * Step 5: Entity Resolution
   */
  private async performEntityResolution(
    vectors: TFIDFVector[], 
    evidenceList: NormalizedEvidence[], 
    clusterResult: ClusterResult
  ): Promise<EntityCluster[]> {
    const resolver = new EntityResolver({
      cosineSimilarityThreshold: 0.3,
      jaccardThreshold: 0.25,
      enableMultiAccountDetection: this.options.multiAccountDetection
    });

    const entityClusters = await resolver.resolveEntities(vectors, evidenceList);
    
    // Mark outliers from HDBSCAN
    entityClusters.forEach(cluster => {
      cluster.nodes.forEach(node => {
        if (clusterResult.outliers.includes(node.vectorIndex)) {
          // Mark as outlier cluster if most nodes are outliers
          const outlierCount = cluster.nodes.filter(n => 
            clusterResult.outliers.includes(n.vectorIndex)
          ).length;
          
          if (outlierCount > cluster.nodes.length / 2) {
            cluster.confidence *= 0.5; // Reduce confidence for outlier-heavy clusters
          }
        }
      });
    });

    return entityClusters;
  }

  /**
   * Convert HDBSCAN clusters to entity format (fallback when entity resolution is disabled)
   */
  private convertClustersToEntities(
    vectors: TFIDFVector[], 
    evidenceList: NormalizedEvidence[], 
    clusterResult: ClusterResult
  ): EntityCluster[] {
    const clusterMap = new Map<number, number[]>();
    
    clusterResult.clusterLabels.forEach((label, index) => {
      if (label !== -1) { // Skip outliers
        if (!clusterMap.has(label)) {
          clusterMap.set(label, []);
        }
        clusterMap.get(label)!.push(index);
      }
    });

    return Array.from(clusterMap.entries()).map(([label, indices]) => ({
      nodes: indices.map(index => ({
        vectorIndex: index,
        vector: vectors[index],
        evidence: evidenceList[index],
        url: vectors[index].metadata.url,
        platform: vectors[index].metadata.platform,
        handle: vectors[index].metadata.handle
      })),
      canonicalHandle: undefined,
      alternateHandles: [],
      confidence: clusterResult.confidence[indices[0]] || 0.5,
      entityId: `cluster_${label}`
    }));
  }

  /**
   * Step 6: Generate enhanced clusters
   */
  private generateEnhancedClusters(
    entityClusters: EntityCluster[], 
    vectors: TFIDFVector[], 
    validResults: Array<{searchResult: GoogleSearchResult, scrapedData?: ScrapedData}>
  ): EnhancedPersonCluster[] {
    return entityClusters.map((cluster, index) => {
      // Create profiles
      const profiles: EnhancedProfile[] = cluster.nodes.map(node => {
        const validResult = validResults[node.vectorIndex];
        const validation = URLValidator.validateURL(node.url);
        
        return {
          url: node.url,
          platform: validation.platform || 'Unknown',
          title: validResult.searchResult.title,
          evidence: node.evidence,
          relevanceScore: node.evidence.confidence * 100,
          whyIncluded: `Evidence confidence: ${(node.evidence.confidence * 100).toFixed(1)}%`,
          whyNotFiltered: validation.reason || 'Passed URL validation'
        };
      });

      // Generate top TF-IDF terms for this cluster
      const topTerms = this.extractTopTermsForCluster(cluster, vectors);
      
      // Generate entity matches rationale
      const entityMatches = this.generateEntityMatches(cluster);
      
      // Generate rationale
      const rationale = this.generateRationale(cluster, topTerms, entityMatches);
      
      // Determine if cluster should be considered outlier
      const isOutlier = cluster.nodes.length < this.options.minClusterSize / 2;

      return {
        personId: cluster.entityId,
        confidence: Math.round(cluster.confidence * 100),
        profiles,
        canonicalSocialHandle: cluster.canonicalHandle,
        alternateHandles: cluster.alternateHandles,
        topTFIDFTerms: topTerms,
        entityMatches,
        rationale,
        isOutlier
      };
    }).filter(cluster => !cluster.isOutlier || cluster.confidence > 30); // Filter out low-confidence outliers
  }

  /**
   * Extract top TF-IDF terms for a cluster
   */
  private extractTopTermsForCluster(cluster: EntityCluster, vectors: TFIDFVector[]): string[] {
    const clusterVectors = cluster.nodes.map(node => vectors[node.vectorIndex]);
    const allKeywords = new Set<string>();
    
    cluster.nodes.forEach(node => {
      node.evidence.keywords.forEach(keyword => allKeywords.add(keyword));
    });

    return Array.from(allKeywords).slice(0, 10);
  }

  /**
   * Generate entity matches description
   */
  private generateEntityMatches(cluster: EntityCluster): string[] {
    const matches: string[] = [];
    
    // Collect all unique values
    const names = new Set<string>();
    const emails = new Set<string>();
    const orgs = new Set<string>();
    const locations = new Set<string>();
    
    cluster.nodes.forEach(node => {
      node.evidence.names.forEach(name => names.add(name));
      node.evidence.emails.forEach(email => emails.add(email));
      node.evidence.organizations.forEach(org => orgs.add(org));
      node.evidence.locations.forEach(loc => locations.add(loc));
    });

    if (names.size > 0) matches.push(`names: ${Array.from(names).slice(0, 3).join(', ')}`);
    if (emails.size > 0) matches.push(`emails: ${Array.from(emails).slice(0, 2).join(', ')}`);
    if (orgs.size > 0) matches.push(`organizations: ${Array.from(orgs).slice(0, 2).join(', ')}`);
    if (locations.size > 0) matches.push(`locations: ${Array.from(locations).slice(0, 2).join(', ')}`);

    return matches;
  }

  /**
   * Generate human-readable rationale
   */
  private generateRationale(cluster: EntityCluster, topTerms: string[], entityMatches: string[]): string {
    const parts: string[] = [];
    
    // Cluster size and confidence
    parts.push(`Identified from ${cluster.nodes.length} profiles with ${(cluster.confidence * 100).toFixed(1)}% confidence`);
    
    // Top evidence
    if (topTerms.length > 0) {
      parts.push(`Key terms: ${topTerms.slice(0, 5).join(', ')}`);
    }
    
    // Entity matches
    if (entityMatches.length > 0) {
      parts.push(`Matched on: ${entityMatches.slice(0, 3).join('; ')}`);
    }
    
    // Canonical handle
    if (cluster.canonicalHandle) {
      parts.push(`Primary ${cluster.canonicalHandle.platform} handle: @${cluster.canonicalHandle.handle}`);
    }
    
    // Alternate handles
    const acceptedAlts = cluster.alternateHandles.filter(h => h.status === 'accepted');
    const rejectedAlts = cluster.alternateHandles.filter(h => h.status === 'rejected');
    
    if (acceptedAlts.length > 0) {
      parts.push(`Additional accounts: ${acceptedAlts.map(h => `@${h.handle}`).join(', ')}`);
    }
    
    if (rejectedAlts.length > 0) {
      parts.push(`Rejected duplicates: ${rejectedAlts.length} handle(s)`);
    }

    return parts.join('. ');
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(clusters: EnhancedPersonCluster[]): { averageConfidence: number, profileConsistency: number, handleDeduplication: number } {
    if (clusters.length === 0) {
      return { averageConfidence: 0, profileConsistency: 0, handleDeduplication: 0 };
    }

    const avgConfidence = clusters.reduce((sum, c) => sum + c.confidence, 0) / clusters.length;
    
    // Profile consistency: how many clusters have canonical handles
    const clustersWithHandles = clusters.filter(c => c.canonicalSocialHandle).length;
    const profileConsistency = clustersWithHandles / clusters.length;
    
    // Handle deduplication: ratio of rejected to total alternate handles
    const totalAlternates = clusters.reduce((sum, c) => sum + c.alternateHandles.length, 0);
    const rejectedAlternates = clusters.reduce((sum, c) => 
      sum + c.alternateHandles.filter(h => h.status === 'rejected').length, 0);
    const handleDeduplication = totalAlternates > 0 ? rejectedAlternates / totalAlternates : 1;

    return {
      averageConfidence: Math.round(avgConfidence),
      profileConsistency: Math.round(profileConsistency * 100),
      handleDeduplication: Math.round(handleDeduplication * 100)
    };
  }

  /**
   * Log results summary
   */
  private logResults(result: EnhancedPersonResult): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 ENHANCED PERSON ANALYSIS COMPLETE`);
    console.log(`${'='.repeat(80)}`);
    
    console.log(`📊 Processing Summary:`);
    console.log(`   Input URLs: ${result.processingStats.totalURLsFound}`);
    console.log(`   Valid URLs processed: ${result.processingStats.validURLsProcessed}`);
    console.log(`   Filtered out: ${result.processingStats.filteredOutURLs}`);
    console.log(`   Vector dimensions: ${result.processingStats.vectorDimensions}`);
    console.log(`   Clusters found: ${result.processingStats.clustersFound}`);
    console.log(`   Outliers detected: ${result.processingStats.outlierCount}`);
    console.log(`   Processing time: ${(result.processingStats.totalProcessingTime / 1000).toFixed(2)}s`);
    
    console.log(`\n📈 Quality Metrics:`);
    console.log(`   Average confidence: ${result.qualityMetrics.averageConfidence}%`);
    console.log(`   Profile consistency: ${result.qualityMetrics.profileConsistency}%`);
    console.log(`   Handle deduplication: ${result.qualityMetrics.handleDeduplication}%`);
    
    console.log(`\n👤 Identified Persons: ${result.identifiedPersons.length}`);
    
    result.identifiedPersons.forEach((person, index) => {
      const confidenceIcon = person.confidence > 70 ? '🟢' : person.confidence > 40 ? '🟡' : '🔴';
      
      console.log(`\n${confidenceIcon} PERSON ${index + 1} (${person.personId}) - ${person.confidence}% confidence`);
      console.log(`   Profiles: ${person.profiles.length}`);
      
      if (person.canonicalSocialHandle) {
        console.log(`   📱 Primary: ${person.canonicalSocialHandle.platform} @${person.canonicalSocialHandle.handle}`);
      }
      
      if (person.alternateHandles.length > 0) {
        const accepted = person.alternateHandles.filter(h => h.status === 'accepted');
        const rejected = person.alternateHandles.filter(h => h.status === 'rejected');
        if (accepted.length > 0) {
          console.log(`   ✅ Additional: ${accepted.map(h => `@${h.handle}`).join(', ')}`);
        }
        if (rejected.length > 0) {
          console.log(`   ❌ Rejected: ${rejected.length} duplicate(s)`);
        }
      }
      
      console.log(`   🔍 Rationale: ${person.rationale}`);
      
      // Show top domains
      const domains = [...new Set(person.profiles.map(p => new URL(p.url).hostname))];
      console.log(`   🌐 Domains: ${domains.slice(0, 3).join(', ')}${domains.length > 3 ? '...' : ''}`);
    });
  }
}
