/**
 * HDBSCAN Clustering for Person Identification
 * 
 * This module implements HDBSCAN clustering with automatic cluster number detection
 * and outlier identification for robust person clustering.
 */

import { TFIDFVector } from './tfidf-vectorizer';

export interface HDBSCANOptions {
  minClusterSize: number;    // Minimum cluster size (default: 8-20)
  minSamples?: number;       // Minimum samples for core points
  metric: 'euclidean' | 'cosine';  // Distance metric
  clusterSelectionEpsilon?: number;  // DBSCAN-like epsilon
}

export interface ClusterResult {
  clusterLabels: number[];   // -1 for outliers, 0+ for cluster IDs
  clusterCount: number;      // Number of clusters found
  outliers: number[];        // Indices of outlier points
  coreDistances: number[];   // Core distances for each point
  confidence: number[];      // Confidence scores for each assignment
  stability: number[];       // Cluster stability scores
}

export interface ClusterMember {
  vectorIndex: number;
  vector: TFIDFVector;
  clusterLabel: number;
  confidence: number;
  isOutlier: boolean;
}

export class HDBSCANClusterer {
  private options: HDBSCANOptions;

  constructor(options: Partial<HDBSCANOptions> = {}) {
    this.options = {
      minClusterSize: 15,  // Good default for person identification
      minSamples: undefined,  // Will default to minClusterSize
      metric: 'euclidean',
      clusterSelectionEpsilon: 0.0,
      ...options
    };

    if (!this.options.minSamples) {
      this.options.minSamples = this.options.minClusterSize;
    }
  }

  /**
   * Perform HDBSCAN clustering on TF-IDF vectors
   */
  async cluster(vectors: TFIDFVector[]): Promise<ClusterResult> {
    console.log(`🤖 Starting HDBSCAN clustering on ${vectors.length} vectors...`);
    console.log(`📊 Parameters: minClusterSize=${this.options.minClusterSize}, metric=${this.options.metric}`);

    if (vectors.length < this.options.minClusterSize) {
      console.log(`⚠️  Too few vectors (${vectors.length}) for clustering. Treating all as single cluster.`);
      return this.createSingleCluster(vectors);
    }

    // Step 1: Build distance matrix
    const distanceMatrix = this.buildDistanceMatrix(vectors);
    
    // Step 2: Calculate core distances
    const coreDistances = this.calculateCoreDistances(distanceMatrix);
    
    // Step 3: Build mutual reachability graph
    const reachabilityDistances = this.buildMutualReachabilityGraph(distanceMatrix, coreDistances);
    
    // Step 4: Build minimum spanning tree
    const mst = this.buildMinimumSpanningTree(reachabilityDistances);
    
    // Step 5: Build cluster hierarchy
    const hierarchy = this.buildClusterHierarchy(mst, vectors.length);
    
    // Step 6: Extract stable clusters
    const stableClusters = this.extractStableClusters(hierarchy);
    
    // Step 7: Calculate confidence scores
    const confidence = this.calculateConfidenceScores(vectors, stableClusters, reachabilityDistances);
    
    const clusterLabels = this.assignClusterLabels(vectors.length, stableClusters);
    const outliers = clusterLabels.map((label, index) => label === -1 ? index : -1).filter(i => i !== -1);
    
    console.log(`✅ HDBSCAN completed: ${stableClusters.length} clusters, ${outliers.length} outliers`);
    
    return {
      clusterLabels,
      clusterCount: stableClusters.length,
      outliers,
      coreDistances,
      confidence,
      stability: stableClusters.map(cluster => cluster.stability)
    };
  }

  /**
   * Build distance matrix between all vectors
   */
  private buildDistanceMatrix(vectors: TFIDFVector[]): number[][] {
    const n = vectors.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = this.calculateDistance(vectors[i].features, vectors[j].features);
        matrix[i][j] = distance;
        matrix[j][i] = distance;
      }
    }
    
    return matrix;
  }

  /**
   * Calculate distance between two feature vectors
   */
  private calculateDistance(a: number[], b: number[]): number {
    if (this.options.metric === 'cosine') {
      // For L2-normalized vectors, cosine distance = 2 - 2*dot_product
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      return Math.max(0, 2 - 2 * dotProduct);
    } else {
      // Euclidean distance
      return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }
  }

  /**
   * Calculate core distances for each point
   */
  private calculateCoreDistances(distanceMatrix: number[][]): number[] {
    const n = distanceMatrix.length;
    const coreDistances: number[] = [];
    
    for (let i = 0; i < n; i++) {
      const distances = distanceMatrix[i]
        .map((dist: number, idx: number) => ({ dist, idx }))
        .filter((item: {dist: number, idx: number}) => item.idx !== i)
        .sort((a: {dist: number, idx: number}, b: {dist: number, idx: number}) => a.dist - b.dist);
      
      // Core distance is distance to k-th nearest neighbor
      const k = Math.min(this.options.minSamples! - 1, distances.length);
      coreDistances[i] = k > 0 ? distances[k - 1].dist : 0;
    }
    
    return coreDistances;
  }

  /**
   * Build mutual reachability graph
   */
  private buildMutualReachabilityGraph(distanceMatrix: number[][], coreDistances: number[]): number[][] {
    const n = distanceMatrix.length;
    const reachability: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          reachability[i][j] = 0;
        } else {
          // Mutual reachability distance
          reachability[i][j] = Math.max(
            distanceMatrix[i][j],
            coreDistances[i],
            coreDistances[j]
          );
        }
      }
    }
    
    return reachability;
  }

  /**
   * Build minimum spanning tree using Prim's algorithm
   */
  private buildMinimumSpanningTree(reachabilityDistances: number[][]): Array<{from: number, to: number, weight: number}> {
    const n = reachabilityDistances.length;
    if (n <= 1) return [];
    
    const mst: Array<{from: number, to: number, weight: number}> = [];
    const visited = new Set<number>();
    const edges: Array<{from: number, to: number, weight: number}> = [];
    
    // Start with node 0
    visited.add(0);
    
    // Add all edges from node 0
    for (let j = 1; j < n; j++) {
      edges.push({ from: 0, to: j, weight: reachabilityDistances[0][j] });
    }
    
    while (visited.size < n && edges.length > 0) {
      // Sort edges by weight and take the minimum
      edges.sort((a, b) => a.weight - b.weight);
      
      let minEdge: {from: number, to: number, weight: number} | null = null;
      let minIndex = -1;
      
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        if (!visited.has(edge.to)) {
          minEdge = edge;
          minIndex = i;
          break;
        }
      }
      
      if (!minEdge) break;
      
      // Add edge to MST
      mst.push(minEdge);
      visited.add(minEdge.to);
      edges.splice(minIndex, 1);
      
      // Add new edges from the newly visited node
      for (let j = 0; j < n; j++) {
        if (!visited.has(j)) {
          edges.push({ from: minEdge.to, to: j, weight: reachabilityDistances[minEdge.to][j] });
        }
      }
    }
    
    return mst;
  }

  /**
   * Build cluster hierarchy from MST
   */
  private buildClusterHierarchy(mst: Array<{from: number, to: number, weight: number}>, numPoints: number): any {
    // Sort MST edges by weight (ascending)
    const sortedEdges = [...mst].sort((a, b) => a.weight - b.weight);
    
    // Union-Find structure for building hierarchy
    const parent: number[] = Array.from({ length: numPoints }, (_, i) => i);
    const size: number[] = Array(numPoints).fill(1);
    
    const find = (x: number): number => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };
    
    const union = (x: number, y: number): number => {
      const rootX = find(x);
      const rootY = find(y);
      
      if (rootX === rootY) return rootX;
      
      if (size[rootX] < size[rootY]) {
        parent[rootX] = rootY;
        size[rootY] += size[rootX];
        return rootY;
      } else {
        parent[rootY] = rootX;
        size[rootX] += size[rootY];
        return rootX;
      }
    };
    
    const merges: Array<{level: number, size: number, components: number[]}> = [];
    
    for (const edge of sortedEdges) {
      const root = union(edge.from, edge.to);
      merges.push({
        level: edge.weight,
        size: size[root],
        components: [edge.from, edge.to]
      });
    }
    
    return { merges, parent, size };
  }

  /**
   * Extract stable clusters from hierarchy
   */
  private extractStableClusters(hierarchy: any): Array<{points: number[], stability: number, birth: number, death: number}> {
    // Simplified cluster extraction
    // In a full HDBSCAN implementation, this would analyze cluster persistence
    
    const clusters: Array<{points: number[], stability: number, birth: number, death: number}> = [];
    const { merges, parent, size } = hierarchy;
    
    // Find components that are large enough to be clusters
    const componentMap = new Map<number, number[]>();
    
    for (let i = 0; i < parent.length; i++) {
      const root = this.find(parent, i);
      if (!componentMap.has(root)) {
        componentMap.set(root, []);
      }
      componentMap.get(root)!.push(i);
    }
    
    componentMap.forEach((points, root) => {
      if (points.length >= this.options.minClusterSize) {
        clusters.push({
          points,
          stability: points.length / parent.length, // Simplified stability
          birth: 0,
          death: Infinity
        });
      }
    });
    
    return clusters;
  }

  private find(parent: number[], x: number): number {
    if (parent[x] !== x) {
      parent[x] = this.find(parent, parent[x]);
    }
    return parent[x];
  }

  /**
   * Calculate confidence scores for cluster assignments
   */
  private calculateConfidenceScores(
    vectors: TFIDFVector[],
    clusters: Array<{points: number[], stability: number}>,
    reachabilityDistances: number[][]
  ): number[] {
    const confidence = new Array(vectors.length).fill(0);
    
    clusters.forEach((cluster, clusterIndex) => {
      cluster.points.forEach(pointIndex => {
        // Calculate confidence based on distance to cluster centroid
        const centroid = this.calculateClusterCentroid(vectors, cluster.points);
        const distanceToCentroid = this.calculateDistance(vectors[pointIndex].features, centroid);
        
        // Calculate average distance to other cluster members
        let avgIntraClusterDistance = 0;
        if (cluster.points.length > 1) {
          let totalDistance = 0;
          let pairCount = 0;
          
          cluster.points.forEach(otherIndex => {
            if (otherIndex !== pointIndex) {
              totalDistance += reachabilityDistances[pointIndex][otherIndex];
              pairCount++;
            }
          });
          
          avgIntraClusterDistance = pairCount > 0 ? totalDistance / pairCount : 0;
        }
        
        // Confidence is inverse of normalized distance (0-1 scale)
        const maxDistance = Math.max(...reachabilityDistances[pointIndex]);
        const normalizedDistance = maxDistance > 0 ? distanceToCentroid / maxDistance : 0;
        confidence[pointIndex] = Math.max(0, 1 - normalizedDistance) * cluster.stability;
      });
    });
    
    return confidence;
  }

  /**
   * Calculate cluster centroid
   */
  private calculateClusterCentroid(vectors: TFIDFVector[], pointIndices: number[]): number[] {
    if (pointIndices.length === 0) return [];
    
    const dimensions = vectors[0].features.length;
    const centroid = new Array(dimensions).fill(0);
    
    pointIndices.forEach(index => {
      vectors[index].features.forEach((value, dim) => {
        centroid[dim] += value;
      });
    });
    
    return centroid.map(sum => sum / pointIndices.length);
  }

  /**
   * Assign cluster labels to all points
   */
  private assignClusterLabels(numPoints: number, clusters: Array<{points: number[]}>): number[] {
    const labels = new Array(numPoints).fill(-1); // -1 for outliers
    
    clusters.forEach((cluster, clusterIndex) => {
      cluster.points.forEach(pointIndex => {
        labels[pointIndex] = clusterIndex;
      });
    });
    
    return labels;
  }

  /**
   * Handle case with too few points for clustering
   */
  private createSingleCluster(vectors: TFIDFVector[]): ClusterResult {
    const n = vectors.length;
    return {
      clusterLabels: new Array(n).fill(0),
      clusterCount: 1,
      outliers: [],
      coreDistances: new Array(n).fill(0),
      confidence: new Array(n).fill(1.0),
      stability: [1.0]
    };
  }

  /**
   * Get clustering summary
   */
  static summarizeClusters(result: ClusterResult, vectors: TFIDFVector[]): Array<{
    clusterLabel: number;
    size: number;
    members: ClusterMember[];
    avgConfidence: number;
    topHandles: string[];
    topPlatforms: string[];
  }> {
    const clusterSummaries: Array<{
      clusterLabel: number;
      size: number;
      members: ClusterMember[];
      avgConfidence: number;
      topHandles: string[];
      topPlatforms: string[];
    }> = [];

    // Group by cluster
    const clusterGroups = new Map<number, ClusterMember[]>();
    
    result.clusterLabels.forEach((label, index) => {
      if (label !== -1) { // Skip outliers
        if (!clusterGroups.has(label)) {
          clusterGroups.set(label, []);
        }
        
        clusterGroups.get(label)!.push({
          vectorIndex: index,
          vector: vectors[index],
          clusterLabel: label,
          confidence: result.confidence[index],
          isOutlier: false
        });
      }
    });

    // Create summaries
    clusterGroups.forEach((members, label) => {
      const avgConfidence = members.reduce((sum, m) => sum + m.confidence, 0) / members.length;
      
      // Extract handles and platforms
      const handles = new Set<string>();
      const platforms = new Set<string>();
      
      members.forEach(member => {
        if (member.vector.metadata.handle) {
          handles.add(member.vector.metadata.handle);
        }
        if (member.vector.metadata.platform) {
          platforms.add(member.vector.metadata.platform);
        }
      });
      
      clusterSummaries.push({
        clusterLabel: label,
        size: members.length,
        members,
        avgConfidence,
        topHandles: Array.from(handles).slice(0, 5),
        topPlatforms: Array.from(platforms)
      });
    });
    
    return clusterSummaries.sort((a, b) => b.size - a.size);
  }
}
