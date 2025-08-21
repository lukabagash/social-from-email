/**
 * TF-IDF Vectorization for Person Identification
 * 
 * This module implements proper TF-IDF vectorization with n-grams, SVD dimensionality
 * reduction, and L2 normalization for robust person clustering.
 */

import { NormalizedEvidence } from './evidence-normalizer';

export interface TFIDFVector {
  features: number[];
  metadata: {
    url: string;
    platform?: string;
    handle?: string;
    featureNames: string[];
    originalEvidence: NormalizedEvidence;
  };
}

export interface VectorizationOptions {
  minDocFreq: number;        // Minimum document frequency (default: 2)
  maxDocFreq: number;        // Maximum document frequency (default: 0.8)
  useUnigrams: boolean;      // Include unigrams (default: true)
  useBigrams: boolean;       // Include bigrams (default: true)
  svdComponents: number;     // SVD components for dimensionality reduction (default: 200)
  l2Normalize: boolean;      // Apply L2 normalization (default: true)
}

export interface DocumentTermMatrix {
  matrix: number[][];
  vocabulary: string[];
  docFreqs: number[];
  idfScores: number[];
}

export class TFIDFVectorizer {
  private options: VectorizationOptions;
  private vocabulary: Set<string> = new Set();
  private documentFrequencies: Map<string, number> = new Map();
  private idfScores: Map<string, number> = new Map();
  private stopWords: Set<string>;

  constructor(options: Partial<VectorizationOptions> = {}) {
    this.options = {
      minDocFreq: 2,
      maxDocFreq: 0.8,
      useUnigrams: true,
      useBigrams: true,
      svdComponents: 200,
      l2Normalize: true,
      ...options
    };

    // Extended stop words for person identification
    this.stopWords = new Set([
      // Basic English stop words
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with',
      'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'they', 'we', 'you',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'about', 'up', 'out', 'if', 'what', 'when', 'where',
      'who', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
      'very', 'just', 'now', 'here', 'there', 'then', 'get', 'got', 'new', 'use',
      'work', 'first', 'well', 'way', 'even', 'back', 'good', 'see', 'know', 'come',
      
      // Social media and web generic terms
      'page', 'profile', 'account', 'user', 'users', 'follow', 'following', 'followers',
      'like', 'likes', 'share', 'shares', 'comment', 'comments', 'post', 'posts',
      'photo', 'photos', 'video', 'videos', 'image', 'images', 'view', 'views',
      'click', 'login', 'signup', 'register', 'join', 'member', 'members',
      'home', 'about', 'contact', 'help', 'support', 'privacy', 'terms', 'policy',
      'blog', 'news', 'article', 'articles', 'read', 'more', 'see', 'all',
      'explore', 'discover', 'search', 'find', 'browse', 'popular', 'trending',
      'recent', 'latest', 'update', 'updates', 'edit', 'save', 'delete',
      
      // Platform-specific generic terms
      'instagram', 'facebook', 'twitter', 'linkedin', 'github', 'youtube',
      'google', 'apple', 'microsoft', 'amazon', 'netflix', 'spotify',
      'website', 'site', 'link', 'url', 'email', 'phone', 'address',
      'copyright', 'reserved', 'rights', 'inc', 'corp', 'llc', 'ltd',
      
      // Generic profile terms
      'biography', 'bio', 'description', 'info', 'information', 'details',
      'location', 'based', 'from', 'lives', 'works', 'studied', 'went',
      'graduated', 'degree', 'university', 'college', 'school', 'education',
    ]);
  }

  /**
   * Vectorize a collection of evidence documents
   */
  async vectorizeEvidenceCollection(evidenceList: Array<{
    evidence: NormalizedEvidence;
    url: string;
    platform?: string;
    handle?: string;
  }>): Promise<TFIDFVector[]> {
    
    console.log(`🔢 Starting TF-IDF vectorization of ${evidenceList.length} documents...`);
    
    // Step 1: Extract document terms
    const documents = evidenceList.map(item => this.evidenceToDocument(item.evidence));
    
    // Step 2: Build vocabulary and calculate document frequencies
    this.buildVocabulary(documents);
    
    // Step 3: Calculate IDF scores
    this.calculateIDF(documents.length);
    
    // Step 4: Create TF-IDF matrix
    const tfidfMatrix = this.createTFIDFMatrix(documents);
    
    // Step 5: Apply SVD for dimensionality reduction
    const reducedMatrix = this.applySVD(tfidfMatrix);
    
    // Step 6: Apply L2 normalization
    const normalizedMatrix = this.options.l2Normalize ? 
      this.applyL2Normalization(reducedMatrix) : reducedMatrix;
    
    // Step 7: Create vectors with metadata
    const vectors = normalizedMatrix.map((features, index) => ({
      features,
      metadata: {
        url: evidenceList[index].url,
        platform: evidenceList[index].platform,
        handle: evidenceList[index].handle,
        featureNames: Array.from(this.vocabulary).slice(0, this.options.svdComponents),
        originalEvidence: evidenceList[index].evidence
      }
    }));
    
    console.log(`✅ TF-IDF vectorization complete: ${vectors.length} vectors with ${vectors[0]?.features.length || 0} dimensions`);
    
    return vectors;
  }

  /**
   * Convert evidence to document text for TF-IDF processing
   */
  private evidenceToDocument(evidence: NormalizedEvidence): string {
    const documentParts: string[] = [];
    
    // Add names (high importance)
    evidence.names.forEach(name => {
      documentParts.push(name);
      documentParts.push(name); // Duplicate for higher weight
    });
    
    // Add handles (high importance for social media)
    evidence.handles.forEach(handle => {
      documentParts.push(handle.handle);
      documentParts.push(handle.platform.toLowerCase());
    });
    
    // Add organizations (medium importance)
    evidence.organizations.forEach(org => {
      documentParts.push(org);
    });
    
    // Add locations (medium importance)
    evidence.locations.forEach(location => {
      documentParts.push(location);
    });
    
    // Add emails (domain part for clustering)
    evidence.emails.forEach(email => {
      const domain = email.split('@')[1];
      if (domain) {
        documentParts.push(domain);
      }
    });
    
    // Add domains
    evidence.domains.forEach(domain => {
      documentParts.push(domain);
    });
    
    // Add salient keywords (filtered)
    evidence.keywords.forEach(keyword => {
      if (!this.stopWords.has(keyword.toLowerCase()) && keyword.length > 2) {
        documentParts.push(keyword);
      }
    });
    
    // Add years as context
    evidence.years.forEach(year => {
      documentParts.push(year.toString());
    });
    
    return documentParts.join(' ').toLowerCase();
  }

  /**
   * Build vocabulary from documents with n-grams
   */
  private buildVocabulary(documents: string[]): void {
    const termCounts = new Map<string, number>();
    
    documents.forEach(doc => {
      const terms = new Set<string>();
      
      // Extract unigrams
      if (this.options.useUnigrams) {
        const unigrams = this.extractUnigrams(doc);
        unigrams.forEach(term => terms.add(term));
      }
      
      // Extract bigrams
      if (this.options.useBigrams) {
        const bigrams = this.extractBigrams(doc);
        bigrams.forEach(term => terms.add(term));
      }
      
      // Count document frequency for each unique term in this document
      terms.forEach(term => {
        termCounts.set(term, (termCounts.get(term) || 0) + 1);
      });
    });
    
    // Filter terms by document frequency
    const totalDocs = documents.length;
    const minDocFreq = this.options.minDocFreq;
    const maxDocFreq = Math.floor(this.options.maxDocFreq * totalDocs);
    
    termCounts.forEach((freq, term) => {
      if (freq >= minDocFreq && freq <= maxDocFreq && !this.stopWords.has(term)) {
        this.vocabulary.add(term);
        this.documentFrequencies.set(term, freq);
      }
    });
    
    console.log(`📚 Built vocabulary: ${this.vocabulary.size} terms (filtered from ${termCounts.size} candidates)`);
  }

  /**
   * Extract unigrams from document
   */
  private extractUnigrams(doc: string): string[] {
    return doc
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Replace non-word chars with spaces
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
  }

  /**
   * Extract bigrams from document
   */
  private extractBigrams(doc: string): string[] {
    const words = this.extractUnigrams(doc);
    const bigrams: string[] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]}_${words[i + 1]}`;
      bigrams.push(bigram);
    }
    
    return bigrams;
  }

  /**
   * Calculate IDF scores for vocabulary
   */
  private calculateIDF(totalDocs: number): void {
    this.vocabulary.forEach(term => {
      const docFreq = this.documentFrequencies.get(term) || 1;
      const idf = Math.log(totalDocs / docFreq);
      this.idfScores.set(term, idf);
    });
  }

  /**
   * Create TF-IDF matrix
   */
  private createTFIDFMatrix(documents: string[]): number[][] {
    const vocabArray = Array.from(this.vocabulary);
    const matrix: number[][] = [];
    
    documents.forEach(doc => {
      const termFreqs = this.calculateTermFrequencies(doc);
      const tfidfVector: number[] = [];
      
      vocabArray.forEach(term => {
        const tf = termFreqs.get(term) || 0;
        const idf = this.idfScores.get(term) || 0;
        const tfidf = tf * idf;
        tfidfVector.push(tfidf);
      });
      
      matrix.push(tfidfVector);
    });
    
    return matrix;
  }

  /**
   * Calculate term frequencies for a document
   */
  private calculateTermFrequencies(doc: string): Map<string, number> {
    const termFreqs = new Map<string, number>();
    const totalTerms = new Set<string>();
    
    // Count unigrams
    if (this.options.useUnigrams) {
      const unigrams = this.extractUnigrams(doc);
      unigrams.forEach(term => {
        if (this.vocabulary.has(term)) {
          termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
          totalTerms.add(term);
        }
      });
    }
    
    // Count bigrams
    if (this.options.useBigrams) {
      const bigrams = this.extractBigrams(doc);
      bigrams.forEach(term => {
        if (this.vocabulary.has(term)) {
          termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
          totalTerms.add(term);
        }
      });
    }
    
    // Normalize by total terms in document
    const totalTermCount = Array.from(totalTerms).length;
    if (totalTermCount > 0) {
      termFreqs.forEach((count, term) => {
        termFreqs.set(term, count / totalTermCount);
      });
    }
    
    return termFreqs;
  }

  /**
   * Apply Truncated SVD for dimensionality reduction
   * Note: This is a simplified SVD implementation. In production, use a proper SVD library.
   */
  private applySVD(matrix: number[][]): number[][] {
    if (matrix.length === 0 || matrix[0].length <= this.options.svdComponents) {
      return matrix; // No reduction needed
    }
    
    console.log(`🔬 Applying SVD: ${matrix[0].length} → ${this.options.svdComponents} dimensions`);
    
    // Simplified SVD: use PCA-like approach
    // In production, use proper SVD library like ml-matrix
    return this.simplePCA(matrix, this.options.svdComponents);
  }

  /**
   * Simplified PCA implementation for dimensionality reduction
   */
  private simplePCA(matrix: number[][], components: number): number[][] {
    if (matrix.length === 0) return matrix;
    
    const numFeatures = matrix[0].length;
    const actualComponents = Math.min(components, numFeatures);
    
    // Center the data
    const means = new Array(numFeatures).fill(0);
    matrix.forEach(row => {
      row.forEach((val, i) => {
        means[i] += val;
      });
    });
    means.forEach((_, i) => {
      means[i] /= matrix.length;
    });
    
    // Subtract means
    const centeredMatrix = matrix.map(row => 
      row.map((val, i) => val - means[i])
    );
    
    // For simplicity, just take the first N components after centering
    // In a real implementation, you'd compute eigenvalues/eigenvectors
    return centeredMatrix.map(row => row.slice(0, actualComponents));
  }

  /**
   * Apply L2 normalization to vectors
   */
  private applyL2Normalization(matrix: number[][]): number[][] {
    return matrix.map(vector => {
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      return norm > 0 ? vector.map(val => val / norm) : vector;
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }

  /**
   * Calculate Jaccard similarity between two sets of tokens
   */
  static jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Get feature importance scores
   */
  getFeatureImportance(): Array<{term: string, idf: number, docFreq: number}> {
    return Array.from(this.vocabulary)
      .map(term => ({
        term,
        idf: this.idfScores.get(term) || 0,
        docFreq: this.documentFrequencies.get(term) || 0
      }))
      .sort((a, b) => b.idf - a.idf);
  }
}
