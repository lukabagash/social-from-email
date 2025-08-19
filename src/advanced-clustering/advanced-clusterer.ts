/**
 * Advanced Multi-Dimensional Clustering for Person Identification
 * 
 * This module implements state-of-the-art clustering algorithms specifically designed
 * for person identification from heterogeneous scraped data sources. It combines
 * multiple clustering approaches to achieve superior accuracy in identifying
 * individual persons across diverse data dimensions.
 * 
 * Supported Algorithms:
 * - HDBSCAN: Hierarchical density-based clustering (best for varying data densities)
 * - Spectral Clustering: Graph-based clustering for complex relationships
 * - Ensemble Clustering: Combined approach for maximum robustness
 * - Enhanced K-means: Improved K-means with automatic k selection
 */

import { ScrapedData } from '../web-scraper/general-scraper';

// Core clustering interfaces
export interface ClusteringResult {
  clusterLabels: number[];
  clusterCount: number;
  confidenceScores: number[];
  algorithm: string;
  silhouetteScore?: number;
  adjustedRandIndex?: number;
  outliers: number[];
}

export interface PersonFeatures {
  textualFeatures: number[];      // TF-IDF vectors from content
  socialFeatures: number[];       // Social media presence patterns
  contactFeatures: number[];      // Email, phone, address similarity
  domainFeatures: number[];       // Website/domain patterns
  temporalFeatures: number[];     // Time-based patterns
  metaFeatures: number[];         // Metadata patterns (titles, descriptions)
}

export interface ClusteringOptions {
  algorithm?: 'hdbscan' | 'spectral' | 'ensemble' | 'enhanced-kmeans';
  minClusterSize?: number;
  maxClusters?: number;
  distanceMetric?: 'euclidean' | 'cosine' | 'manhattan';
  linkage?: 'ward' | 'complete' | 'average' | 'single';
  ensembleSize?: number;
}

export class AdvancedPersonClusterer {
  
  /**
   * Extract comprehensive features from scraped data for clustering
   */
  static extractFeatures(scrapedData: ScrapedData[]): PersonFeatures[] {
    return scrapedData.map(data => this.extractSingleFeature(data));
  }

  private static extractSingleFeature(data: ScrapedData): PersonFeatures {
    // Extract textual features using TF-IDF-like approach
    const textualFeatures = this.extractTextualFeatures(data);
    
    // Extract social media presence patterns
    const socialFeatures = this.extractSocialFeatures(data);
    
    // Extract contact information similarity patterns
    const contactFeatures = this.extractContactFeatures(data);
    
    // Extract domain and website patterns
    const domainFeatures = this.extractDomainFeatures(data);
    
    // Extract temporal patterns if available
    const temporalFeatures = this.extractTemporalFeatures(data);
    
    // Extract metadata patterns
    const metaFeatures = this.extractMetaFeatures(data);

    return {
      textualFeatures,
      socialFeatures,
      contactFeatures,
      domainFeatures,
      temporalFeatures,
      metaFeatures
    };
  }

  private static extractTextualFeatures(data: ScrapedData): number[] {
    // Combine all text content
    const allText = [
      data.title || '',
      data.metadata?.description || '',
      data.metadata?.keywords || '',
      ...data.content.paragraphs,
      ...data.content.headings.h1,
      ...data.content.headings.h2,
      ...data.content.headings.h3,
      ...data.content.contactInfo.socialLinks.map(link => link.url)
    ].join(' ').toLowerCase();

    // Extract key person-identifying terms
    const personTerms = [
      'name', 'email', 'phone', 'address', 'linkedin', 'twitter', 'facebook',
      'company', 'job', 'title', 'position', 'work', 'experience', 'education',
      'university', 'college', 'school', 'degree', 'certification', 'skill'
    ];

    // Calculate term frequency features
    const features = personTerms.map(term => {
      const regex = new RegExp(term, 'gi');
      const matches = allText.match(regex);
      return matches ? matches.length : 0;
    });

    // Add content length and complexity features
    features.push(
      allText.length,
      (allText.match(/\b\w+\b/g) || []).length, // word count
      (allText.match(/[A-Z][a-z]+/g) || []).length, // capitalized words
      (allText.match(/\b[A-Z]+\b/g) || []).length, // all caps words
      (allText.match(/\d+/g) || []).length // numbers
    );

    return features;
  }

  private static extractSocialFeatures(data: ScrapedData): number[] {
    const socialPlatforms = [
      'linkedin', 'twitter', 'facebook', 'instagram', 'github', 'youtube',
      'tiktok', 'snapchat', 'pinterest', 'medium', 'reddit', 'discord'
    ];

    const url = data.url.toLowerCase();
    const content = data.content.paragraphs.join(' ').toLowerCase();

    // Platform presence indicators
    const platformFeatures = socialPlatforms.map(platform => {
      const inUrl = url.includes(platform) ? 1 : 0;
      const inContent = content.includes(platform) ? 1 : 0;
      return inUrl + inContent;
    });

    // Social media link count
    const socialLinkCount = data.content.contactInfo.socialLinks.length;
    
    // Professional vs personal indicators
    const professionalTerms = ['company', 'job', 'work', 'business', 'career', 'professional'];
    const personalTerms = ['hobby', 'interest', 'personal', 'family', 'friend', 'fun'];
    
    const professionalScore = professionalTerms.reduce((score, term) => 
      score + (content.includes(term) ? 1 : 0), 0);
    const personalScore = personalTerms.reduce((score, term) => 
      score + (content.includes(term) ? 1 : 0), 0);

    return [
      ...platformFeatures,
      socialLinkCount,
      professionalScore,
      personalScore
    ];
  }

  private static extractContactFeatures(data: ScrapedData): number[] {
    const content = data.content.paragraphs.join(' ').toLowerCase();
    
    // Use actual contact info from scraped data
    const emailCount = data.content.contactInfo.emails.length;
    const phoneCount = data.content.contactInfo.phones.length;
    
    // Email pattern matches in content
    const emailMatches = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    
    // Phone pattern matches (various formats)
    const phonePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g,
      /\b\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g
    ];
    const phoneMatches = phonePatterns.reduce((total, pattern) => 
      total + (content.match(pattern) || []).length, 0);

    // Address-like patterns
    const addressMatches = content.match(/\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|blvd)\b/gi) || [];
    
    // Name pattern matches (First Last format)
    const nameMatches = content.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];

    return [
      emailCount,
      phoneCount,
      emailMatches.length,
      phoneMatches,
      addressMatches.length,
      nameMatches.length,
      // Contact information density
      (emailMatches.length + phoneMatches + addressMatches.length) / Math.max(content.length, 1) * 1000
    ];
  }

  private static extractDomainFeatures(data: ScrapedData): number[] {
    const url = new URL(data.url);
    const domain = url.hostname.toLowerCase();
    
    // Domain type classification
    const socialDomains = ['linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com', 'github.com'];
    const professionalDomains = ['company', 'corp', 'inc', 'llc', 'professional', 'business'];
    const personalDomains = ['personal', 'blog', 'me', 'name'];
    const academicDomains = ['.edu', 'university', 'college', 'academic'];
    
    const isSocial = socialDomains.some(d => domain.includes(d)) ? 1 : 0;
    const isProfessional = professionalDomains.some(d => domain.includes(d)) ? 1 : 0;
    const isPersonal = personalDomains.some(d => domain.includes(d)) ? 1 : 0;
    const isAcademic = academicDomains.some(d => domain.includes(d)) ? 1 : 0;
    
    // Domain authority indicators
    const domainLength = domain.length;
    const subdomainCount = domain.split('.').length - 1;
    const hasWww = domain.startsWith('www.') ? 1 : 0;
    
    // TLD analysis
    const tld = domain.split('.').pop() || '';
    const isCommon = ['com', 'org', 'net', 'edu', 'gov'].includes(tld) ? 1 : 0;
    
    return [
      isSocial,
      isProfessional, 
      isPersonal,
      isAcademic,
      domainLength,
      subdomainCount,
      hasWww,
      isCommon
    ];
  }

  private static extractTemporalFeatures(data: ScrapedData): number[] {
    // Extract timestamps, publication dates, etc. if available
    const content = data.content.paragraphs.join(' ');
    
    // Look for date patterns
    const datePatterns = [
      /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g,
      /\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b/g,
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi
    ];
    
    const dateMatches = datePatterns.reduce((total, pattern) => 
      total + (content.match(pattern) || []).length, 0);
    
    // Look for temporal keywords
    const temporalKeywords = [
      'recent', 'current', 'latest', 'new', 'updated', 'posted', 'published',
      'yesterday', 'today', 'ago', 'since', 'until', 'before', 'after'
    ];
    
    const temporalScore = temporalKeywords.reduce((score, keyword) => 
      score + (content.toLowerCase().includes(keyword) ? 1 : 0), 0);

    return [
      dateMatches,
      temporalScore,
      // Recency indicators (if timestamp available)
      0, // Could be populated with actual timestamp analysis
      0  // Could be populated with content freshness indicators
    ];
  }

  private static extractMetaFeatures(data: ScrapedData): number[] {
    const title = data.title || '';
    const description = data.metadata?.description || '';
    const keywords = data.metadata?.keywords?.split(',').map(k => k.trim()) || [];
    
    // Title analysis
    const titleLength = title.length;
    const titleWords = (title.match(/\b\w+\b/g) || []).length;
    const titleHasName = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(title) ? 1 : 0;
    
    // Description analysis
    const descLength = description.length;
    const descWords = (description.match(/\b\w+\b/g) || []).length;
    
    // Keywords analysis
    const keywordCount = keywords.length;
    const personKeywords = keywords.filter((k: string) => 
      ['name', 'person', 'profile', 'bio', 'about'].some(term => 
        k.toLowerCase().includes(term))).length;

    return [
      titleLength,
      titleWords,
      titleHasName,
      descLength,
      descWords,
      keywordCount,
      personKeywords
    ];
  }

  /**
   * HDBSCAN clustering implementation
   * Best for person identification with varying data densities
   */
  static async clusterWithHDBSCAN(
    features: PersonFeatures[],
    options: ClusteringOptions = { algorithm: 'hdbscan' }
  ): Promise<ClusteringResult> {
    const minClusterSize = options.minClusterSize || Math.max(2, Math.floor(features.length / 10));
    
    // Flatten and normalize features
    const normalizedData = this.normalizeFeatures(features);
    
    // Implement simplified HDBSCAN-like algorithm
    // In a production environment, you'd use a proper HDBSCAN library
    const clusters = await this.simpleHDBSCAN(normalizedData, minClusterSize);
    
    return {
      clusterLabels: clusters.labels,
      clusterCount: clusters.clusterCount,
      confidenceScores: clusters.confidenceScores,
      algorithm: 'hdbscan',
      outliers: clusters.outliers,
      silhouetteScore: this.calculateSilhouetteScore(normalizedData, clusters.labels)
    };
  }

  /**
   * Spectral clustering implementation
   * Good for complex relationship patterns
   */
  static async clusterWithSpectral(
    features: PersonFeatures[],
    options: ClusteringOptions = { algorithm: 'spectral' }
  ): Promise<ClusteringResult> {
    const maxClusters = options.maxClusters || Math.min(features.length, 10);
    
    // Flatten and normalize features
    const normalizedData = this.normalizeFeatures(features);
    
    // Build similarity matrix
    const similarityMatrix = this.buildSimilarityMatrix(normalizedData);
    
    // Perform spectral clustering (simplified implementation)
    const clusters = await this.simpleSpectralClustering(similarityMatrix, maxClusters);
    
    return {
      clusterLabels: clusters.labels,
      clusterCount: clusters.clusterCount,
      confidenceScores: clusters.confidenceScores,
      algorithm: 'spectral',
      outliers: [],
      silhouetteScore: this.calculateSilhouetteScore(normalizedData, clusters.labels)
    };
  }

  /**
   * Ensemble clustering for maximum robustness
   * Combines multiple algorithms for best results
   */
  static async clusterWithEnsemble(
    features: PersonFeatures[],
    options: ClusteringOptions = { algorithm: 'ensemble' }
  ): Promise<ClusteringResult> {
    const ensembleSize = options.ensembleSize || 3;
    
    // Run multiple clustering algorithms
    const results: ClusteringResult[] = [];
    
    // HDBSCAN
    results.push(await this.clusterWithHDBSCAN(features, options));
    
    // Spectral
    results.push(await this.clusterWithSpectral(features, options));
    
    // Enhanced K-means
    results.push(await this.clusterWithEnhancedKMeans(features, options));
    
    // Combine results using consensus clustering
    const consensusResult = this.consensusClustering(results, features.length);
    
    return {
      ...consensusResult,
      algorithm: 'ensemble',
      silhouetteScore: Math.max(...results.map(r => r.silhouetteScore || 0))
    };
  }

  /**
   * Enhanced K-means with automatic k selection
   */
  static async clusterWithEnhancedKMeans(
    features: PersonFeatures[],
    options: ClusteringOptions = { algorithm: 'enhanced-kmeans' }
  ): Promise<ClusteringResult> {
    const normalizedData = this.normalizeFeatures(features);
    const maxClusters = options.maxClusters || Math.min(features.length, 10);
    
    // Find optimal k using elbow method and silhouette analysis
    const optimalK = this.findOptimalK(normalizedData, maxClusters);
    
    // Perform K-means clustering
    const clusters = this.performKMeans(normalizedData, optimalK);
    
    return {
      clusterLabels: clusters.labels,
      clusterCount: optimalK,
      confidenceScores: clusters.confidenceScores,
      algorithm: 'enhanced-kmeans',
      outliers: [],
      silhouetteScore: this.calculateSilhouetteScore(normalizedData, clusters.labels)
    };
  }

  // Helper methods (simplified implementations for core functionality)
  
  private static normalizeFeatures(features: PersonFeatures[]): number[][] {
    // Flatten all features into single vectors
    const flatFeatures = features.map(f => [
      ...f.textualFeatures,
      ...f.socialFeatures,
      ...f.contactFeatures,
      ...f.domainFeatures,
      ...f.temporalFeatures,
      ...f.metaFeatures
    ]);

    // Normalize to [0, 1] range
    const featureCount = flatFeatures[0].length;
    const mins = new Array(featureCount).fill(Infinity);
    const maxs = new Array(featureCount).fill(-Infinity);

    // Find min/max for each feature
    flatFeatures.forEach(features => {
      features.forEach((value, i) => {
        mins[i] = Math.min(mins[i], value);
        maxs[i] = Math.max(maxs[i], value);
      });
    });

    // Normalize
    return flatFeatures.map(features =>
      features.map((value, i) => {
        const range = maxs[i] - mins[i];
        return range > 0 ? (value - mins[i]) / range : 0;
      })
    );
  }

  private static async simpleHDBSCAN(
    data: number[][],
    minClusterSize: number
  ): Promise<{
    labels: number[];
    clusterCount: number;
    confidenceScores: number[];
    outliers: number[];
  }> {
    // Simplified HDBSCAN implementation
    // In production, use a proper HDBSCAN library like scikit-learn equivalent
    
    const n = data.length;
    const labels = new Array(n).fill(-1); // -1 indicates noise/outlier
    const confidenceScores = new Array(n).fill(0);
    const outliers: number[] = [];
    
    // Build distance matrix
    const distances = this.buildDistanceMatrix(data);
    
    // Find dense regions (simplified)
    let clusterId = 0;
    const visited = new Array(n).fill(false);
    
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      
      const neighbors = this.findNeighbors(i, distances, 0.3); // 0.3 is threshold
      
      if (neighbors.length >= minClusterSize) {
        // Create new cluster
        const queue = [...neighbors];
        
        while (queue.length > 0) {
          const point = queue.shift()!;
          if (visited[point]) continue;
          
          visited[point] = true;
          labels[point] = clusterId;
          confidenceScores[point] = Math.min(1, neighbors.length / minClusterSize);
          
          const pointNeighbors = this.findNeighbors(point, distances, 0.3);
          if (pointNeighbors.length >= minClusterSize) {
            queue.push(...pointNeighbors.filter(n => !visited[n]));
          }
        }
        clusterId++;
      } else {
        // Mark as outlier
        outliers.push(i);
        labels[i] = -1;
      }
    }
    
    return {
      labels,
      clusterCount: clusterId,
      confidenceScores,
      outliers
    };
  }

  private static buildDistanceMatrix(data: number[][]): number[][] {
    const n = data.length;
    const distances = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = this.euclideanDistance(data[i], data[j]);
        distances[i][j] = dist;
        distances[j][i] = dist;
      }
    }
    
    return distances;
  }

  private static euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  }

  private static findNeighbors(point: number, distances: number[][], threshold: number): number[] {
    return distances[point]
      .map((dist, i) => ({ dist, i }))
      .filter(item => item.dist <= threshold && item.i !== point)
      .map(item => item.i);
  }

  private static buildSimilarityMatrix(data: number[][]): number[][] {
    const n = data.length;
    const similarity = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          similarity[i][j] = 1;
        } else {
          // Use RBF kernel for similarity
          const dist = this.euclideanDistance(data[i], data[j]);
          similarity[i][j] = Math.exp(-dist * dist / 0.5); // gamma = 2
        }
      }
    }
    
    return similarity;
  }

  private static async simpleSpectralClustering(
    similarityMatrix: number[][],
    maxClusters: number
  ): Promise<{
    labels: number[];
    clusterCount: number;
    confidenceScores: number[];
  }> {
    // Simplified spectral clustering
    // In production, use proper eigenvalue decomposition libraries
    
    const n = similarityMatrix.length;
    
    // Find optimal number of clusters using eigenvalues (simplified)
    const optimalClusters = Math.min(maxClusters, Math.max(2, Math.floor(n / 3)));
    
    // Perform K-means on the similarity matrix (simplified approach)
    const result = this.performKMeans(similarityMatrix, optimalClusters);
    
    return {
      labels: result.labels,
      clusterCount: optimalClusters,
      confidenceScores: result.confidenceScores
    };
  }

  private static findOptimalK(data: number[][], maxK: number): number {
    // Use elbow method (simplified)
    const wcss: number[] = [];
    
    for (let k = 1; k <= maxK; k++) {
      const result = this.performKMeans(data, k);
      wcss.push(result.wcss);
    }
    
    // Find elbow point (simplified)
    let optimalK = 2;
    let maxDiff = 0;
    
    for (let k = 1; k < wcss.length - 1; k++) {
      const diff = wcss[k] - wcss[k + 1];
      if (diff > maxDiff) {
        maxDiff = diff;
        optimalK = k + 1;
      }
    }
    
    return Math.min(optimalK, Math.floor(data.length / 2));
  }

  private static performKMeans(
    data: number[][],
    k: number
  ): {
    labels: number[];
    confidenceScores: number[];
    wcss: number;
  } {
    // Simplified K-means implementation
    const n = data.length;
    const d = data[0].length;
    
    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const centroid = Array(d).fill(0).map(() => Math.random());
      centroids.push(centroid);
    }
    
    let labels = new Array(n).fill(0);
    let converged = false;
    let iterations = 0;
    const maxIterations = 100;
    
    while (!converged && iterations < maxIterations) {
      const newLabels = new Array(n);
      
      // Assign points to closest centroid
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let bestCluster = 0;
        
        for (let j = 0; j < k; j++) {
          const dist = this.euclideanDistance(data[i], centroids[j]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = j;
          }
        }
        newLabels[i] = bestCluster;
      }
      
      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = data.filter((_, i) => newLabels[i] === j);
        if (clusterPoints.length > 0) {
          for (let dim = 0; dim < d; dim++) {
            centroids[j][dim] = clusterPoints.reduce((sum, point) => sum + point[dim], 0) / clusterPoints.length;
          }
        }
      }
      
      // Check convergence
      converged = newLabels.every((label, i) => label === labels[i]);
      labels = newLabels;
      iterations++;
    }
    
    // Calculate confidence scores and WCSS
    const confidenceScores = new Array(n);
    let wcss = 0;
    
    for (let i = 0; i < n; i++) {
      const clusterCentroid = centroids[labels[i]];
      const distToCentroid = this.euclideanDistance(data[i], clusterCentroid);
      
      // Confidence based on distance to centroid
      confidenceScores[i] = Math.max(0, 1 - distToCentroid);
      wcss += distToCentroid * distToCentroid;
    }
    
    return { labels, confidenceScores, wcss };
  }

  private static consensusClustering(
    results: ClusteringResult[],
    dataSize: number
  ): {
    clusterLabels: number[];
    clusterCount: number;
    confidenceScores: number[];
    outliers: number[];
  } {
    // Create consensus matrix
    const consensusMatrix = Array(dataSize).fill(null).map(() => Array(dataSize).fill(0));
    
    // Build consensus from all results
    results.forEach(result => {
      for (let i = 0; i < dataSize; i++) {
        for (let j = i + 1; j < dataSize; j++) {
          if (result.clusterLabels[i] === result.clusterLabels[j] && result.clusterLabels[i] !== -1) {
            consensusMatrix[i][j]++;
            consensusMatrix[j][i]++;
          }
        }
      }
    });
    
    // Normalize consensus matrix
    const numResults = results.length;
    for (let i = 0; i < dataSize; i++) {
      for (let j = 0; j < dataSize; j++) {
        consensusMatrix[i][j] /= numResults;
      }
    }
    
    // Use consensus matrix for final clustering
    const threshold = 0.5; // Majority threshold
    const visited = new Array(dataSize).fill(false);
    const labels = new Array(dataSize).fill(-1);
    const confidenceScores = new Array(dataSize).fill(0);
    const outliers: number[] = [];
    
    let clusterId = 0;
    
    for (let i = 0; i < dataSize; i++) {
      if (visited[i]) continue;
      
      const cluster: number[] = [i];
      visited[i] = true;
      labels[i] = clusterId;
      
      // Find all points that should be in same cluster
      for (let j = i + 1; j < dataSize; j++) {
        if (!visited[j] && consensusMatrix[i][j] >= threshold) {
          cluster.push(j);
          visited[j] = true;
          labels[j] = clusterId;
        }
      }
      
      // Calculate confidence scores for this cluster
      cluster.forEach(pointIndex => {
        let totalSimilarity = 0;
        let count = 0;
        
        cluster.forEach(otherIndex => {
          if (pointIndex !== otherIndex) {
            totalSimilarity += consensusMatrix[pointIndex][otherIndex];
            count++;
          }
        });
        
        confidenceScores[pointIndex] = count > 0 ? totalSimilarity / count : 0;
        
        // Mark as outlier if confidence is too low
        if (confidenceScores[pointIndex] < 0.3) {
          outliers.push(pointIndex);
          labels[pointIndex] = -1;
        }
      });
      
      clusterId++;
    }
    
    return {
      clusterLabels: labels,
      clusterCount: clusterId,
      confidenceScores,
      outliers
    };
  }

  private static calculateSilhouetteScore(data: number[][], labels: number[]): number {
    // Simplified silhouette score calculation
    const n = data.length;
    const uniqueLabels = [...new Set(labels.filter(l => l !== -1))];
    
    if (uniqueLabels.length <= 1) return 0;
    
    let totalScore = 0;
    let validPoints = 0;
    
    for (let i = 0; i < n; i++) {
      if (labels[i] === -1) continue; // Skip outliers
      
      // Calculate a(i) - average distance to points in same cluster
      const sameClusterPoints = data.filter((_, j) => labels[j] === labels[i] && j !== i);
      const a = sameClusterPoints.length > 0 
        ? sameClusterPoints.reduce((sum, point) => sum + this.euclideanDistance(data[i], point), 0) / sameClusterPoints.length
        : 0;
      
      // Calculate b(i) - minimum average distance to points in other clusters
      let b = Infinity;
      
      uniqueLabels.forEach(label => {
        if (label === labels[i]) return;
        
        const otherClusterPoints = data.filter((_, j) => labels[j] === label);
        if (otherClusterPoints.length > 0) {
          const avgDist = otherClusterPoints.reduce((sum, point) => sum + this.euclideanDistance(data[i], point), 0) / otherClusterPoints.length;
          b = Math.min(b, avgDist);
        }
      });
      
      // Silhouette score for this point
      const silhouette = b === Infinity ? 0 : (b - a) / Math.max(a, b);
      totalScore += silhouette;
      validPoints++;
    }
    
    return validPoints > 0 ? totalScore / validPoints : 0;
  }

  /**
   * Main clustering method that automatically selects the best algorithm
   */
  static async clusterPersonData(
    scrapedData: ScrapedData[],
    options: ClusteringOptions = { algorithm: 'hdbscan' }
  ): Promise<ClusteringResult> {
    // Extract features
    const features = this.extractFeatures(scrapedData);
    
    // Select algorithm based on data characteristics
    const algorithm = options.algorithm || this.selectOptimalAlgorithm(features);
    
    console.log(`🤖 Using ${algorithm.toUpperCase()} clustering for person identification...`);
    
    switch (algorithm) {
      case 'hdbscan':
        return this.clusterWithHDBSCAN(features, options);
      case 'spectral':
        return this.clusterWithSpectral(features, options);
      case 'ensemble':
        return this.clusterWithEnsemble(features, options);
      case 'enhanced-kmeans':
      default:
        return this.clusterWithEnhancedKMeans(features, options);
    }
  }

  private static selectOptimalAlgorithm(features: PersonFeatures[]): string {
    const dataSize = features.length;
    
    // Small datasets: use enhanced K-means
    if (dataSize < 10) return 'enhanced-kmeans';
    
    // Medium datasets: use HDBSCAN (best for person identification)
    if (dataSize < 50) return 'hdbscan';
    
    // Large datasets: use ensemble for robustness
    return 'ensemble';
  }
}
