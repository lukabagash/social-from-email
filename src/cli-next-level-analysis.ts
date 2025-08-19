#!/usr/bin/env node

/**
 * CLI for Next-Level Enhanced Person Analysis
 * 
 * This command demonstrates the advanced biographical profiling capabilities
 * with comprehensive keyword extraction and person intelligence analysis.
 */

import { GoogleSearchScraper } from './google-search/scraper';
import { GeneralWebScraper, type ScrapedData } from './web-scraper/general-scraper';
import { NextLevelPersonAnalyzer } from './person-analysis/next-level-analyzer';

interface CLIOptions {
  firstName: string;
  lastName: string;
  email: string;
  maxSearchResults?: number;
  maxScrapePages?: number;
  outputFile?: string;
}

class NextLevelCLI {
  private searchScraper: GoogleSearchScraper;
  private webScraper: GeneralWebScraper;

  constructor() {
    this.searchScraper = new GoogleSearchScraper();
    this.webScraper = new GeneralWebScraper();
  }

  async executeAnalysis(options: CLIOptions): Promise<void> {
    console.log('🚀 NEXT-LEVEL ENHANCED PERSON ANALYSIS');
    console.log('=====================================');
    console.log(`Target: ${options.firstName} ${options.lastName}`);
    console.log(`Email: ${options.email}`);
    console.log('=====================================\n');

    try {
      // Phase 1: Setup
      console.log('🔧 Phase 1: Setting up analysis tools...');
      await this.searchScraper.setup();
      console.log('✅ Search scraper ready');
      console.log('✅ Web scraper ready');
      console.log('✅ Next-level analyzer ready\n');

      // Phase 2: Advanced Search Strategy
      console.log('🔍 Phase 2: Executing advanced search strategy...');
      const searchQueries = this.generateAdvancedSearchQueries(
        options.firstName, 
        options.lastName, 
        options.email
      );
      
      console.log(`📋 Generated ${searchQueries.length} search queries:`);
      searchQueries.forEach((query, index) => {
        console.log(`   ${index + 1}. "${query}"`);
      });
      console.log();

      // Execute searches
      let allSearchResults: any[] = [];
      
      for (const [index, query] of searchQueries.entries()) {
        console.log(`🔎 Executing search ${index + 1}/${searchQueries.length}: "${query}"`);
        
        try {
          const results = await this.searchScraper.searchGoogle(query, {
            maxResults: options.maxSearchResults || 10,
            includeSnippets: true
          });
          
          console.log(`   ✅ Found ${results.length} results`);
          allSearchResults.push(...results);
          
          // Add delay between searches to avoid rate limiting
          if (index < searchQueries.length - 1) {
            console.log('   ⏳ Waiting 3 seconds before next search...');
            await this.delay(3000);
          }
        } catch (error) {
          console.log(`   ❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Remove duplicates
      const uniqueResults = this.removeDuplicateResults(allSearchResults);
      console.log(`\\n📊 Total unique search results: ${uniqueResults.length}`);

      // Phase 3: Intelligent Web Scraping
      console.log('\\n🕷️ Phase 3: Intelligent web scraping...');
      const prioritizedUrls = this.prioritizeUrlsForScraping(uniqueResults, options.maxScrapePages || 5);
      
      console.log(`🎯 Selected ${prioritizedUrls.length} high-value URLs for scraping:`);
      prioritizedUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
      console.log();

      const scrapedData: ScrapedData[] = [];
      
      for (const [index, url] of prioritizedUrls.entries()) {
        console.log(`🔍 Scraping ${index + 1}/${prioritizedUrls.length}: ${url}`);
        
        try {
          const data = await this.webScraper.scrapeWebsite(url);
          scrapedData.push(data);
          console.log(`   ✅ Successfully scraped ${data.content.paragraphs.length} paragraphs`);
          
          // Add delay between scrapes
          if (index < prioritizedUrls.length - 1) {
            console.log('   ⏳ Waiting 2 seconds before next scrape...');
            await this.delay(2000);
          }
        } catch (error) {
          console.log(`   ❌ Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`\\n📈 Successfully scraped ${scrapedData.length} pages`);

      // Phase 4: Next-Level Analysis
      console.log('\\n🧠 Phase 4: Next-Level Person Analysis...');
      const analyzer = new NextLevelPersonAnalyzer(
        options.firstName,
        options.lastName,
        options.email
      );

      const analysisResult = await analyzer.analyzePersonComprehensively(
        uniqueResults,
        scrapedData
      );

      // Phase 5: Enhanced Results Display
      console.log('\\n🎨 Phase 5: Displaying enhanced analysis results...');
      this.displayComprehensiveResults(analysisResult);

      // Phase 6: Save Results (if requested)
      if (options.outputFile) {
        console.log(`\\n💾 Phase 6: Saving results to ${options.outputFile}...`);
        await this.saveResults(analysisResult, options.outputFile);
        console.log('✅ Results saved successfully');
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      // Cleanup
      console.log('\\n🧹 Cleaning up...');
      await this.searchScraper.close();
      console.log('✅ Analysis complete!');
    }
  }

  private generateAdvancedSearchQueries(firstName: string, lastName: string, email: string): string[] {
    const queries = [
      // Core identity searches
      `"${firstName} ${lastName}"`,
      `"${firstName} ${lastName}" "${email}"`,
      
      // Professional context searches
      `"${firstName} ${lastName}" linkedin`,
      `"${firstName} ${lastName}" site:linkedin.com`,
      `"${firstName} ${lastName}" "currently works" OR "works at" OR "employed at"`,
      `"${firstName} ${lastName}" "position" OR "role" OR "title"`,
      
      // Educational background searches
      `"${firstName} ${lastName}" "university" OR "college" OR "graduated"`,
      `"${firstName} ${lastName}" "degree" OR "education" OR "studied"`,
      
      // Achievements and recognition searches
      `"${firstName} ${lastName}" "award" OR "recognition" OR "achievement"`,
      `"${firstName} ${lastName}" "published" OR "author" OR "speaker"`,
      
      // Social media and digital presence
      `"${firstName} ${lastName}" site:github.com`,
      `"${firstName} ${lastName}" site:twitter.com OR site:x.com`,
      `"${firstName} ${lastName}" "profile" OR "about"`,
      
      // Email-specific searches
      `"${email}" -site:linkedin.com`,
      `"${email}" "contact" OR "bio" OR "about"`,
      
      // Industry and specialization searches
      `"${firstName} ${lastName}" "expert" OR "specialist" OR "consultant"`,
      `"${firstName} ${lastName}" "CEO" OR "founder" OR "director" OR "manager"`
    ];

    return queries;
  }

  private removeDuplicateResults(results: any[]): any[] {
    const seen = new Set();
    return results.filter(result => {
      const key = result.url + result.title;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private prioritizeUrlsForScraping(results: any[], maxUrls: number): string[] {
    // Score URLs based on their potential value
    const scoredUrls = results.map(result => ({
      url: result.url,
      score: this.calculateUrlScore(result)
    }));

    // Sort by score (highest first) and take top URLs
    scoredUrls.sort((a, b) => b.score - a.score);
    
    return scoredUrls.slice(0, maxUrls).map(item => item.url);
  }

  private calculateUrlScore(result: any): number {
    let score = 0;
    const domain = result.domain?.toLowerCase() || '';
    const title = result.title?.toLowerCase() || '';
    const snippet = result.snippet?.toLowerCase() || '';

    // High-value domains
    if (domain.includes('linkedin.com')) score += 10;
    if (domain.includes('github.com')) score += 8;
    if (domain.includes('company website indicators')) score += 7;
    if (domain.includes('university') || domain.includes('edu')) score += 6;
    
    // Professional indicators in title/snippet
    if (title.includes('ceo') || title.includes('founder') || title.includes('director')) score += 5;
    if (snippet.includes('work') || snippet.includes('employ') || snippet.includes('position')) score += 3;
    if (snippet.includes('education') || snippet.includes('degree') || snippet.includes('university')) score += 3;
    
    // Biographical indicators
    if (snippet.includes('about') || snippet.includes('bio') || snippet.includes('profile')) score += 4;
    if (snippet.length > 100) score += 2; // Longer snippets often have more info
    
    return score;
  }

  private displayComprehensiveResults(result: any): void {
    console.log('\\n🎯 COMPREHENSIVE PERSON ANALYSIS RESULTS');
    console.log('==========================================');
    
    // Basic identification
    console.log('\\n👤 IDENTIFICATION:');
    console.log(`Names: ${result.profile.identification.names.join(', ')}`);
    console.log(`Emails: ${result.profile.identification.emails.join(', ')}`);
    console.log(`Phones: ${result.profile.identification.phones.join(', ')}`);
    console.log(`Confidence: ${Math.round(result.profile.identification.confidence * 100)}%`);
    
    // Biographical summary
    console.log('\\n📖 BIOGRAPHY:');
    console.log(`Summary: ${result.profile.biography.summary}`);
    console.log(`Life Stage: ${result.profile.biography.lifeStage}`);
    if (result.profile.biography.keyFacts.length > 0) {
      console.log('Key Facts:');
      result.profile.biography.keyFacts.forEach((fact: string, index: number) => {
        console.log(`  ${index + 1}. ${fact}`);
      });
    }
    
    // Professional profile
    console.log('\\n💼 PROFESSIONAL PROFILE:');
    if (result.profile.professional.currentRole) {
      const role = result.profile.professional.currentRole;
      console.log(`Current Role: ${role.title} at ${role.company}`);
      console.log(`Industry: ${role.industry}`);
    }
    
    console.log(`Seniority Level: ${result.profile.professional.seniority}`);
    console.log(`Industries: ${result.profile.professional.industries.join(', ')}`);
    
    if (result.profile.professional.skills.length > 0) {
      console.log('Top Skills:');
      result.profile.professional.skills.slice(0, 5).forEach((skill: any, index: number) => {
        console.log(`  ${index + 1}. ${skill.name} (${skill.category}, ${skill.proficiency})`);
      });
    }
    
    // Educational background
    console.log('\\n🎓 EDUCATION:');
    if (result.profile.education.highestDegree) {
      const degree = result.profile.education.highestDegree;
      console.log(`Highest Degree: ${degree.level} in ${degree.field} from ${degree.institution}`);
    }
    console.log(`Institutions: ${result.profile.education.institutions.join(', ')}`);
    
    // Geographic profile
    console.log('\\n🌍 GEOGRAPHIC PROFILE:');
    if (result.profile.geographic.currentLocation) {
      const loc = result.profile.geographic.currentLocation;
      console.log(`Current Location: ${loc.city}, ${loc.country} (${Math.round(loc.confidence * 100)}% confidence)`);
    }
    console.log(`Travel Pattern: ${result.profile.geographic.travelPattern}`);
    
    // Digital presence
    console.log('\\n💻 DIGITAL PRESENCE:');
    console.log(`Platforms Found: ${result.profile.digitalPresence.platforms.length}`);
    result.profile.digitalPresence.platforms.forEach((platform: any) => {
      console.log(`  • ${platform.platform}: ${platform.url} (${platform.activity} activity)`);
    });
    
    const reputation = result.profile.digitalPresence.onlineReputation;
    console.log(`Online Reputation Score: ${reputation.score}/100 (${reputation.sentiment})`);
    console.log(`Thought Leadership Level: ${result.profile.digitalPresence.thoughtLeadership.level}`);
    
    // Advanced insights
    console.log('\\n🔍 ADVANCED INSIGHTS:');
    console.log(`Person Type: ${result.insights.personType}`);
    console.log(`Digital Footprint Size: ${result.insights.digitalFootprintSize}`);
    console.log(`Verification Level: ${result.insights.verificationLevel}`);
    console.log(`Innovation Mindset: ${result.profile.insights.innovationMindset}`);
    
    // Data quality assessment
    console.log('\\n📊 DATA QUALITY ASSESSMENT:');
    const quality = result.profile.analysis.dataQuality;
    console.log(`Completeness: ${quality.completeness}%`);
    console.log(`Accuracy: ${quality.accuracy}%`);
    console.log(`Freshness: ${quality.freshness}%`);
    console.log(`Consistency: ${quality.consistency}%`);
    
    // Recommendations
    console.log('\\n💡 RECOMMENDATIONS:');
    console.log('Next Steps:');
    result.recommendations.nextSteps.forEach((step: string, index: number) => {
      console.log(`  ${index + 1}. ${step}`);
    });
    
    console.log('\\nAdditional Sources to Explore:');
    result.recommendations.additionalSources.forEach((source: string, index: number) => {
      console.log(`  ${index + 1}. ${source}`);
    });
    
    console.log('\\nVerification Methods:');
    result.recommendations.verificationMethods.forEach((method: string, index: number) => {
      console.log(`  ${index + 1}. ${method}`);
    });
  }

  private async saveResults(result: any, filename: string): Promise<void> {
    const fs = await import('fs/promises');
    const beautifiedResult = JSON.stringify(result, null, 2);
    await fs.writeFile(filename, beautifiedResult, 'utf-8');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: npm run next-level-analysis <firstName> <lastName> <email> [maxSearchResults] [maxScrapePages] [outputFile]');
    console.log('');
    console.log('Example:');
    console.log('  npm run next-level-analysis "Luka" "Bagashvili" "luka.yep@gmail.com" 15 6 "luka-analysis.json"');
    console.log('');
    console.log('Advanced Example:');
    console.log('  npm run next-level-analysis "John" "Smith" "j.smith@company.com" 20 8 "john-comprehensive-profile.json"');
    process.exit(1);
  }

  const options: CLIOptions = {
    firstName: args[0],
    lastName: args[1], 
    email: args[2],
    maxSearchResults: args[3] ? parseInt(args[3]) : 12,
    maxScrapePages: args[4] ? parseInt(args[4]) : 5,
    outputFile: args[5]
  };

  const cli = new NextLevelCLI();
  
  try {
    await cli.executeAnalysis(options);
  } catch (error) {
    console.error('\\n❌ Next-Level Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
