/**
 * Entity Resolution for Person Identification
 * 
 * This module provides lightweight entity resolution using k-NN graph construction
 * and connected components to identify the same person across multiple profiles.
 */

import { TFIDFVector, TFIDFVectorizer } from './tfidf-vectorizer';
import { NormalizedEvidence } from './evidence-normalizer';

export interface EntityMatch {
  similarity: number;
  reasons: string[];
  confidence: number;
}

export interface EntityNode {
  vectorIndex: number;
  vector: TFIDFVector;
  evidence: NormalizedEvidence;
  url: string;
  platform?: string;
  handle?: string;
}

export interface EntityCluster {
  nodes: EntityNode[];
  canonicalHandle?: {
    platform: string;
    handle: string;
    url: string;
    confidence: number;
    reason: string;
  };
  alternateHandles: Array<{
    platform: string;
    handle: string;
    url: string;
    confidence: number;
    status: 'accepted' | 'rejected';
    reason: string;
  }>;
  confidence: number;
  entityId: string;
}

export interface EntityResolutionOptions {
  cosineSimilarityThreshold: number;   // Minimum cosine similarity (0.3-0.7)
  jaccardThreshold: number;            // Minimum Jaccard similarity (0.2-0.5)
  handleMatchWeight: number;           // Weight for handle matches (0.3)
  emailMatchWeight: number;            // Weight for email matches (0.4)
  nameMatchWeight: number;             // Weight for name matches (0.2)
  domainMatchWeight: number;           // Weight for domain matches (0.1)
  levenshteinThreshold: number;        // Max Levenshtein distance for names (2-3)
  enableMultiAccountDetection: boolean; // Detect legitimate multi-accounts
}

export class EntityResolver {
  private options: EntityResolutionOptions;

  constructor(options: Partial<EntityResolutionOptions> = {}) {
    this.options = {
      cosineSimilarityThreshold: 0.4,
      jaccardThreshold: 0.3,
      handleMatchWeight: 0.3,
      emailMatchWeight: 0.4,
      nameMatchWeight: 0.2,
      domainMatchWeight: 0.1,
      levenshteinThreshold: 3,
      enableMultiAccountDetection: true,
      ...options
    };
  }

  /**
   * Resolve entities from TF-IDF vectors using k-NN graph and connected components
   */
  async resolveEntities(vectors: TFIDFVector[], evidenceList: NormalizedEvidence[]): Promise<EntityCluster[]> {
    console.log(`🔗 Starting entity resolution on ${vectors.length} profiles...`);
    console.log(`📊 Thresholds: cosine=${this.options.cosineSimilarityThreshold}, jaccard=${this.options.jaccardThreshold}`);

    if (vectors.length !== evidenceList.length) {
      throw new Error('Vectors and evidence lists must have the same length');
    }

    // Step 1: Create entity nodes
    const nodes = this.createEntityNodes(vectors, evidenceList);

    // Step 2: Build k-NN graph with combined similarity
    const graph = this.buildKNNGraph(nodes);

    // Step 3: Find connected components
    const components = this.findConnectedComponents(graph, nodes);

    // Step 4: Resolve handles within each component
    const entityClusters = this.resolveHandlesInComponents(components);

    console.log(`✅ Entity resolution complete: ${entityClusters.length} entities identified`);
    this.logResolutionSummary(entityClusters);

    return entityClusters;
  }

  /**
   * Create entity nodes from vectors and evidence
   */
  private createEntityNodes(vectors: TFIDFVector[], evidenceList: NormalizedEvidence[]): EntityNode[] {
    return vectors.map((vector, index) => ({
      vectorIndex: index,
      vector,
      evidence: evidenceList[index],
      url: vector.metadata.url,
      platform: vector.metadata.platform,
      handle: vector.metadata.handle
    }));
  }

  /**
   * Build k-NN graph using combined feature similarity
   */
  private buildKNNGraph(nodes: EntityNode[]): Map<number, Set<number>> {
    const graph = new Map<number, Set<number>>();
    const n = nodes.length;

    // Initialize graph
    for (let i = 0; i < n; i++) {
      graph.set(i, new Set());
    }

    // Calculate pairwise similarities and build edges
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const match = this.calculateEntityMatch(nodes[i], nodes[j]);
        
        if (match.similarity >= this.options.cosineSimilarityThreshold || match.confidence >= 0.6) {
          graph.get(i)!.add(j);
          graph.get(j)!.add(i);
        }
      }
    }

    return graph;
  }

  /**
   * Calculate comprehensive entity match between two nodes
   */
  private calculateEntityMatch(node1: EntityNode, node2: EntityNode): EntityMatch {
    const reasons: string[] = [];
    let totalScore = 0;
    let weightSum = 0;

    // 1. Cosine similarity of TF-IDF vectors
    const cosineSim = TFIDFVectorizer.cosineSimilarity(
      node1.vector.features,
      node2.vector.features
    );
    totalScore += cosineSim * 0.4;
    weightSum += 0.4;
    if (cosineSim > 0.5) {
      reasons.push(`high_vector_similarity(${cosineSim.toFixed(2)})`);
    }

    // 2. Jaccard similarity of tokens
    const allTokens1 = this.extractAllTokens(node1.evidence);
    const allTokens2 = this.extractAllTokens(node2.evidence);
    const jaccardSim = TFIDFVectorizer.jaccardSimilarity(allTokens1, allTokens2);
    totalScore += jaccardSim * 0.3;
    weightSum += 0.3;
    if (jaccardSim > 0.3) {
      reasons.push(`token_overlap(${jaccardSim.toFixed(2)})`);
    }

    // 3. Handle matches
    const handleMatch = this.calculateHandleMatch(node1.evidence, node2.evidence);
    if (handleMatch.score > 0) {
      totalScore += handleMatch.score * this.options.handleMatchWeight;
      weightSum += this.options.handleMatchWeight;
      reasons.push(handleMatch.reason);
    }

    // 4. Email matches
    const emailMatch = this.calculateEmailMatch(node1.evidence, node2.evidence);
    if (emailMatch.score > 0) {
      totalScore += emailMatch.score * this.options.emailMatchWeight;
      weightSum += this.options.emailMatchWeight;
      reasons.push(emailMatch.reason);
    }

    // 5. Name matches (with Levenshtein distance)
    const nameMatch = this.calculateNameMatch(node1.evidence, node2.evidence);
    if (nameMatch.score > 0) {
      totalScore += nameMatch.score * this.options.nameMatchWeight;
      weightSum += this.options.nameMatchWeight;
      reasons.push(nameMatch.reason);
    }

    // 6. Domain matches
    const domainMatch = this.calculateDomainMatch(node1.evidence, node2.evidence);
    if (domainMatch.score > 0) {
      totalScore += domainMatch.score * this.options.domainMatchWeight;
      weightSum += this.options.domainMatchWeight;
      reasons.push(domainMatch.reason);
    }

    // 7. Location/organization overlap
    const contextMatch = this.calculateContextMatch(node1.evidence, node2.evidence);
    if (contextMatch.score > 0) {
      totalScore += contextMatch.score * 0.1;
      weightSum += 0.1;
      reasons.push(contextMatch.reason);
    }

    const finalSimilarity = weightSum > 0 ? totalScore / weightSum : 0;
    const confidence = Math.min(1, finalSimilarity + (reasons.length * 0.05));

    return {
      similarity: finalSimilarity,
      reasons,
      confidence
    };
  }

  /**
   * Extract all tokens from evidence for Jaccard similarity
   */
  private extractAllTokens(evidence: NormalizedEvidence): string[] {
    const tokens: string[] = [];
    
    tokens.push(...evidence.names.map(n => n.toLowerCase()));
    tokens.push(...evidence.emails.map(e => e.toLowerCase()));
    tokens.push(...evidence.handles.map(h => h.handle.toLowerCase()));
    tokens.push(...evidence.organizations.map(o => o.toLowerCase()));
    tokens.push(...evidence.locations.map(l => l.toLowerCase()));
    tokens.push(...evidence.domains.map(d => d.toLowerCase()));
    tokens.push(...evidence.keywords.map(k => k.toLowerCase()));

    return tokens;
  }

  /**
   * Calculate handle match score
   */
  private calculateHandleMatch(evidence1: NormalizedEvidence, evidence2: NormalizedEvidence): {score: number, reason: string} {
    for (const handle1 of evidence1.handles) {
      for (const handle2 of evidence2.handles) {
        // Exact handle match
        if (handle1.handle.toLowerCase() === handle2.handle.toLowerCase()) {
          if (handle1.platform === handle2.platform) {
            return { score: 1.0, reason: `exact_handle_match(${handle1.platform}:${handle1.handle})` };
          } else {
            return { score: 0.9, reason: `cross_platform_handle(${handle1.handle})` };
          }
        }
        
        // Similar handles (Levenshtein distance)
        const distance = this.levenshteinDistance(handle1.handle.toLowerCase(), handle2.handle.toLowerCase());
        if (distance <= 2 && Math.min(handle1.handle.length, handle2.handle.length) > 3) {
          const similarity = 1 - (distance / Math.max(handle1.handle.length, handle2.handle.length));
          return { score: similarity * 0.8, reason: `similar_handle(${handle1.handle}≈${handle2.handle})` };
        }
      }
    }
    
    return { score: 0, reason: '' };
  }

  /**
   * Calculate email match score
   */
  private calculateEmailMatch(evidence1: NormalizedEvidence, evidence2: NormalizedEvidence): {score: number, reason: string} {
    for (const email1 of evidence1.emails) {
      for (const email2 of evidence2.emails) {
        if (email1.toLowerCase() === email2.toLowerCase()) {
          return { score: 1.0, reason: `exact_email_match(${email1})` };
        }
        
        // Same domain
        const domain1 = email1.split('@')[1];
        const domain2 = email2.split('@')[1];
        if (domain1 && domain2 && domain1 === domain2) {
          return { score: 0.3, reason: `same_email_domain(${domain1})` };
        }
      }
    }
    
    return { score: 0, reason: '' };
  }

  /**
   * Calculate name match score using Levenshtein distance
   */
  private calculateNameMatch(evidence1: NormalizedEvidence, evidence2: NormalizedEvidence): {score: number, reason: string} {
    for (const name1 of evidence1.names) {
      for (const name2 of evidence2.names) {
        const distance = this.levenshteinDistance(name1.toLowerCase(), name2.toLowerCase());
        const maxLength = Math.max(name1.length, name2.length);
        
        if (distance <= this.options.levenshteinThreshold && maxLength > 5) {
          const similarity = 1 - (distance / maxLength);
          if (similarity > 0.7) {
            return { score: similarity, reason: `similar_name(${name1}≈${name2})` };
          }
        }
        
        // Check if names contain each other
        if (name1.toLowerCase().includes(name2.toLowerCase()) || name2.toLowerCase().includes(name1.toLowerCase())) {
          return { score: 0.6, reason: `name_substring(${name1}⊇${name2})` };
        }
      }
    }
    
    return { score: 0, reason: '' };
  }

  /**
   * Calculate domain match score
   */
  private calculateDomainMatch(evidence1: NormalizedEvidence, evidence2: NormalizedEvidence): {score: number, reason: string} {
    const commonDomains = evidence1.domains.filter(d1 => 
      evidence2.domains.some(d2 => d1.toLowerCase() === d2.toLowerCase())
    );
    
    if (commonDomains.length > 0) {
      return { score: 0.5, reason: `shared_domain(${commonDomains[0]})` };
    }
    
    return { score: 0, reason: '' };
  }

  /**
   * Calculate context match (location, organization overlap)
   */
  private calculateContextMatch(evidence1: NormalizedEvidence, evidence2: NormalizedEvidence): {score: number, reason: string} {
    const commonOrgs = evidence1.organizations.filter(o1 =>
      evidence2.organizations.some(o2 => o1.toLowerCase() === o2.toLowerCase())
    );
    
    const commonLocs = evidence1.locations.filter(l1 =>
      evidence2.locations.some(l2 => l1.toLowerCase() === l2.toLowerCase())
    );
    
    if (commonOrgs.length > 0) {
      return { score: 0.7, reason: `shared_org(${commonOrgs[0]})` };
    }
    
    if (commonLocs.length > 0) {
      return { score: 0.4, reason: `shared_location(${commonLocs[0]})` };
    }
    
    return { score: 0, reason: '' };
  }

  /**
   * Find connected components in the k-NN graph
   */
  private findConnectedComponents(graph: Map<number, Set<number>>, nodes: EntityNode[]): EntityNode[][] {
    const visited = new Set<number>();
    const components: EntityNode[][] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i)) {
        const component = this.dfsComponent(graph, i, visited, nodes);
        components.push(component);
      }
    }
    
    return components;
  }

  /**
   * DFS to find connected component
   */
  private dfsComponent(graph: Map<number, Set<number>>, start: number, visited: Set<number>, nodes: EntityNode[]): EntityNode[] {
    const component: EntityNode[] = [];
    const stack = [start];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      
      visited.add(current);
      component.push(nodes[current]);
      
      const neighbors = graph.get(current) || new Set();
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }
    
    return component;
  }

  /**
   * Resolve handles within each connected component
   */
  private resolveHandlesInComponents(components: EntityNode[][]): EntityCluster[] {
    return components.map((component, index) => {
      const entityId = `entity_${index + 1}`;
      
      // Collect all handles from the component
      const allHandles: Array<{
        platform: string;
        handle: string;
        url: string;
        node: EntityNode;
        frequency: number;
        evidenceWeight: number;
      }> = [];
      
      component.forEach(node => {
        node.evidence.handles.forEach(handle => {
          allHandles.push({
            platform: handle.platform,
            handle: handle.handle,
            url: handle.url,
            node,
            frequency: 1,
            evidenceWeight: node.evidence.confidence
          });
        });
      });
      
      // Group handles by platform and handle
      const handleGroups = new Map<string, typeof allHandles>();
      allHandles.forEach(handle => {
        const key = `${handle.platform}:${handle.handle}`.toLowerCase();
        if (!handleGroups.has(key)) {
          handleGroups.set(key, []);
        }
        handleGroups.get(key)!.push(handle);
      });
      
      // Calculate voting scores for Instagram handles
      const instagramHandles = Array.from(handleGroups.entries())
        .filter(([key]) => key.startsWith('instagram:'))
        .map(([key, handles]) => {
          const frequency = handles.length;
          const avgWeight = handles.reduce((sum, h) => sum + h.evidenceWeight, 0) / handles.length;
          const votingScore = frequency * avgWeight;
          
          return {
            platform: 'Instagram',
            handle: handles[0].handle,
            url: handles[0].url,
            votingScore,
            frequency,
            avgWeight,
            handles
          };
        })
        .sort((a, b) => b.votingScore - a.votingScore);
      
      // Elect canonical Instagram handle
      let canonicalHandle: EntityCluster['canonicalHandle'];
      const alternateHandles: EntityCluster['alternateHandles'] = [];
      
      if (instagramHandles.length > 0) {
        const best = instagramHandles[0];
        canonicalHandle = {
          platform: best.platform,
          handle: best.handle,
          url: best.url,
          confidence: Math.min(1, best.votingScore),
          reason: `highest_vote(freq=${best.frequency}, weight=${best.avgWeight.toFixed(2)})`
        };
        
        // Process alternates
        instagramHandles.slice(1).forEach(alt => {
          const isLegitimate = this.options.enableMultiAccountDetection && 
                               this.detectLegitimateMultiAccount(best, alt, component);
          
          alternateHandles.push({
            platform: alt.platform,
            handle: alt.handle,
            url: alt.url,
            confidence: Math.min(1, alt.votingScore),
            status: isLegitimate ? 'accepted' : 'rejected',
            reason: isLegitimate ? 'legitimate_multi_account' : 'insufficient_evidence'
          });
        });
      }
      
      // Calculate overall cluster confidence
      const avgNodeConfidence = component.reduce((sum, node) => sum + node.evidence.confidence, 0) / component.length;
      const handleConsistency = canonicalHandle ? 0.2 : 0;
      const clusterConfidence = Math.min(1, avgNodeConfidence + handleConsistency);
      
      return {
        nodes: component,
        canonicalHandle,
        alternateHandles,
        confidence: clusterConfidence,
        entityId
      };
    });
  }

  /**
   * Detect if an alternate handle represents a legitimate multi-account
   */
  private detectLegitimateMultiAccount(canonical: any, alternate: any, component: EntityNode[]): boolean {
    // Check for explicit multi-account evidence
    const multiAccountKeywords = ['alt', 'alternative', 'backup', 'second', 'business', 'personal'];
    
    const hasMultiAccountEvidence = component.some(node => 
      node.evidence.keywords.some(keyword => 
        multiAccountKeywords.some(mac => keyword.toLowerCase().includes(mac))
      )
    );
    
    // Check for different contexts (business vs personal)
    const hasContextDifference = canonical.handles.some((h: any) => h.node.evidence.organizations.length > 0) &&
                                alternate.handles.some((h: any) => h.node.evidence.organizations.length === 0);
    
    return hasMultiAccountEvidence || hasContextDifference;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Log resolution summary
   */
  private logResolutionSummary(entityClusters: EntityCluster[]): void {
    console.log(`\n📋 Entity Resolution Summary:`);
    console.log(`   Total entities: ${entityClusters.length}`);
    
    entityClusters.forEach((cluster, index) => {
      console.log(`   ${cluster.entityId}: ${cluster.nodes.length} profiles, confidence=${(cluster.confidence * 100).toFixed(1)}%`);
      
      if (cluster.canonicalHandle) {
        console.log(`     📱 Canonical: ${cluster.canonicalHandle.platform} @${cluster.canonicalHandle.handle}`);
      }
      
      if (cluster.alternateHandles.length > 0) {
        cluster.alternateHandles.forEach(alt => {
          const status = alt.status === 'accepted' ? '✅' : '❌';
          console.log(`     ${status} Alternate: ${alt.platform} @${alt.handle} (${alt.reason})`);
        });
      }
    });
  }
}
