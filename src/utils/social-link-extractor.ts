#!/usr/bin/env node

import { PersonAnalysisResult, PersonCluster } from '../person-analysis/enhanced-analyzer';

export interface SocialLink {
  platform: string;
  url: string;
  username?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
  posts?: number;
  engagement?: number;
  lastActivity?: string;
  confidence: number; // From the parent cluster confidence
  personId?: string; // Identifier for which person this belongs to
  sourceCount: number; // How many sources contributed to this cluster
  relevanceScore: number; // Average relevance of sources for this cluster
}

export interface SocialLinkSummary {
  totalSocialLinks: number;
  highConfidenceLinks: SocialLink[]; // Confidence > 70%
  mediumConfidenceLinks: SocialLink[]; // Confidence 40-70%
  lowConfidenceLinks: SocialLink[]; // Confidence < 40%
  platformBreakdown: Record<string, number>;
  uniquePlatforms: string[];
  consolidatedLinks: SocialLink[]; // Deduplicated and ranked
}

export class SocialLinkExtractor {
  
  /**
   * Extract all social media links from analysis results with confidence levels
   */
  static extractSocialLinks(analysisResult: PersonAnalysisResult): SocialLinkSummary {
    const allSocialLinks: SocialLink[] = [];
    
    // Extract social links from each identified person cluster
    analysisResult.identifiedPersons.forEach((cluster, personIndex) => {
      if (cluster.personEvidence.socialProfiles) {
        cluster.personEvidence.socialProfiles.forEach(profile => {
          // Calculate average relevance score from cluster sources
          const avgRelevance = cluster.sources.length > 0 
            ? cluster.sources.reduce((sum, src) => sum + src.relevanceScore, 0) / cluster.sources.length
            : 0;

          const socialLink: SocialLink = {
            platform: profile.platform,
            url: profile.url,
            username: profile.username,
            verified: profile.verified,
            followers: profile.followers,
            following: profile.following,
            posts: profile.posts,
            engagement: profile.engagement,
            lastActivity: profile.lastActivity,
            confidence: cluster.confidence,
            personId: `person_${personIndex + 1}`,
            sourceCount: cluster.sources.length,
            relevanceScore: Math.round(avgRelevance)
          };
          
          allSocialLinks.push(socialLink);
        });
      }
    });

    // Categorize by confidence levels
    const highConfidenceLinks = allSocialLinks.filter(link => link.confidence > 70);
    const mediumConfidenceLinks = allSocialLinks.filter(link => link.confidence >= 40 && link.confidence <= 70);
    const lowConfidenceLinks = allSocialLinks.filter(link => link.confidence < 40);

    // Platform breakdown
    const platformBreakdown: Record<string, number> = {};
    allSocialLinks.forEach(link => {
      const platform = link.platform.toLowerCase();
      platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
    });

    const uniquePlatforms = Object.keys(platformBreakdown);

    // Consolidate and deduplicate links (prioritize by confidence and relevance)
    const consolidatedLinks = this.consolidateLinks(allSocialLinks);

    return {
      totalSocialLinks: allSocialLinks.length,
      highConfidenceLinks,
      mediumConfidenceLinks,
      lowConfidenceLinks,
      platformBreakdown,
      uniquePlatforms,
      consolidatedLinks
    };
  }

  /**
   * Consolidate duplicate links and prioritize by confidence and relevance
   */
  private static consolidateLinks(links: SocialLink[]): SocialLink[] {
    const linkMap = new Map<string, SocialLink>();
    
    links.forEach(link => {
      const key = link.url.toLowerCase();
      const existing = linkMap.get(key);
      
      if (!existing || link.confidence > existing.confidence || 
          (link.confidence === existing.confidence && link.relevanceScore > existing.relevanceScore)) {
        linkMap.set(key, link);
      }
    });
    
    return Array.from(linkMap.values()).sort((a, b) => {
      // Sort by confidence first, then by relevance score
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.relevanceScore - a.relevanceScore;
    });
  }

  /**
   * Print a formatted summary of social links with confidence levels
   */
  static printSocialLinkSummary(summary: SocialLinkSummary, detailed: boolean = false): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔗 SOCIAL MEDIA LINKS SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    
    console.log(`📊 Overview:`);
    console.log(`   Total Social Links Found: ${summary.totalSocialLinks}`);
    console.log(`   🟢 High Confidence (>70%): ${summary.highConfidenceLinks.length}`);
    console.log(`   🟡 Medium Confidence (40-70%): ${summary.mediumConfidenceLinks.length}`);
    console.log(`   🔴 Low Confidence (<40%): ${summary.lowConfidenceLinks.length}`);
    console.log(`   🌐 Unique Platforms: ${summary.uniquePlatforms.length}`);

    // Platform breakdown
    if (Object.keys(summary.platformBreakdown).length > 0) {
      console.log(`\n📱 Platform Breakdown:`);
      Object.entries(summary.platformBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([platform, count]) => {
          console.log(`   ${platform}: ${count} link${count > 1 ? 's' : ''}`);
        });
    }

    // Print consolidated links (best candidates)
    if (summary.consolidatedLinks.length > 0) {
      console.log(`\n🎯 RECOMMENDED SOCIAL LINKS (Consolidated & Ranked):`);
      console.log(`${'─'.repeat(80)}`);
      
      summary.consolidatedLinks.forEach((link, index) => {
        const confidenceIcon = link.confidence > 70 ? '🟢' : link.confidence > 40 ? '🟡' : '🔴';
        const verifiedIcon = link.verified ? ' ✅' : '';
        
        console.log(`${index + 1}. ${confidenceIcon} ${link.platform.toUpperCase()}${verifiedIcon}`);
        console.log(`   🌐 URL: ${link.url}`);
        console.log(`   📊 Confidence: ${link.confidence}% | Relevance: ${link.relevanceScore}%`);
        console.log(`   👤 Person: ${link.personId} | Sources: ${link.sourceCount}`);
        
        if (link.username) {
          console.log(`   🏷️  Username: @${link.username}`);
        }
        
        if (detailed) {
          if (link.followers !== undefined) {
            console.log(`   👥 Followers: ${link.followers.toLocaleString()}`);
          }
          if (link.following !== undefined) {
            console.log(`   🔄 Following: ${link.following.toLocaleString()}`);
          }
          if (link.posts !== undefined) {
            console.log(`   📝 Posts: ${link.posts.toLocaleString()}`);
          }
          if (link.engagement !== undefined) {
            console.log(`   📈 Engagement: ${link.engagement}%`);
          }
          if (link.lastActivity) {
            console.log(`   🕒 Last Activity: ${link.lastActivity}`);
          }
        }
        console.log();
      });
    }

    // High confidence links section
    if (summary.highConfidenceLinks.length > 0) {
      console.log(`\n🟢 HIGH CONFIDENCE LINKS (${summary.highConfidenceLinks.length}):`);
      console.log(`${'─'.repeat(60)}`);
      
      summary.highConfidenceLinks.forEach((link, index) => {
        const verifiedIcon = link.verified ? ' ✅' : '';
        console.log(`   ${index + 1}. ${link.platform}: ${link.url}${verifiedIcon}`);
        console.log(`      Confidence: ${link.confidence}% | ${link.personId} | ${link.sourceCount} sources`);
      });
    }

    // Medium confidence links (if any)
    if (summary.mediumConfidenceLinks.length > 0) {
      console.log(`\n🟡 MEDIUM CONFIDENCE LINKS (${summary.mediumConfidenceLinks.length}):`);
      console.log(`${'─'.repeat(60)}`);
      
      summary.mediumConfidenceLinks.forEach((link, index) => {
        console.log(`   ${index + 1}. ${link.platform}: ${link.url}`);
        console.log(`      Confidence: ${link.confidence}% | ${link.personId}`);
      });
    }

    // Show low confidence links only if detailed view is requested
    if (detailed && summary.lowConfidenceLinks.length > 0) {
      console.log(`\n🔴 LOW CONFIDENCE LINKS (${summary.lowConfidenceLinks.length}):`);
      console.log(`${'─'.repeat(60)}`);
      
      summary.lowConfidenceLinks.forEach((link, index) => {
        console.log(`   ${index + 1}. ${link.platform}: ${link.url}`);
        console.log(`      Confidence: ${link.confidence}% | ${link.personId}`);
      });
    }

    console.log(`\n💡 Recommendation: Focus on 🟢 High Confidence links for reliable social media presence.`);
  }

  /**
   * Export social links to JSON format
   */
  static exportToJSON(summary: SocialLinkSummary, filePath?: string): string {
    const exportData = {
      summary: {
        totalSocialLinks: summary.totalSocialLinks,
        highConfidenceCount: summary.highConfidenceLinks.length,
        mediumConfidenceCount: summary.mediumConfidenceLinks.length,
        lowConfidenceCount: summary.lowConfidenceLinks.length,
        uniquePlatforms: summary.uniquePlatforms,
        platformBreakdown: summary.platformBreakdown
      },
      consolidatedLinks: summary.consolidatedLinks,
      allLinks: {
        highConfidence: summary.highConfidenceLinks,
        mediumConfidence: summary.mediumConfidenceLinks,
        lowConfidence: summary.lowConfidenceLinks
      },
      generatedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    if (filePath) {
      const fs = require('fs');
      fs.writeFileSync(filePath, jsonString);
      console.log(`📄 Social links exported to: ${filePath}`);
    }
    
    return jsonString;
  }

  /**
   * Get only the best social links (highest confidence per platform)
   */
  static getBestLinksPerPlatform(summary: SocialLinkSummary): SocialLink[] {
    const bestLinks = new Map<string, SocialLink>();
    
    summary.consolidatedLinks.forEach(link => {
      const platform = link.platform.toLowerCase();
      const existing = bestLinks.get(platform);
      
      if (!existing || link.confidence > existing.confidence) {
        bestLinks.set(platform, link);
      }
    });
    
    return Array.from(bestLinks.values()).sort((a, b) => b.confidence - a.confidence);
  }
}
