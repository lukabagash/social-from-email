#!/usr/bin/env node

import { EnhancedOSINTAnalyzer } from './enhanced-osint/enhanced-analyzer';
import * as readline from 'readline';

interface CLIOptions {
  firstName?: string;
  lastName?: string;
  email?: string;
  maxResults?: number;
  includeLinkedIn?: boolean;
  includeSocialMedia?: boolean;
  enableClustering?: boolean;
  enableNLP?: boolean;
  exportResults?: boolean;
  humanBehavior?: boolean;
  verbose?: boolean;
}

class EnhancedOSINTCLI {
  public analyzer: EnhancedOSINTAnalyzer;
  private rl: readline.Interface;

  constructor() {
    this.analyzer = new EnhancedOSINTAnalyzer();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 Enhanced OSINT Analyzer CLI');
    console.log('==============================');
    console.log('');
    
    try {
      await this.analyzer.setup();
      console.log('✅ Enhanced OSINT system initialized successfully');
      console.log('');
      
      await this.showMenu();
    } catch (error) {
      console.error('❌ Failed to initialize enhanced OSINT system:', error);
      process.exit(1);
    }
  }

  private async showMenu() {
    console.log('📋 Available Options:');
    console.log('1. Run Enhanced Person Analysis');
    console.log('2. Test Enhanced Google Scraper');
    console.log('3. Test Enhanced LinkedIn Scraper');
    console.log('4. Test Enhanced Web Scraper');
    console.log('5. Run Interactive Analysis');
    console.log('6. Exit');
    console.log('');

    const choice = await this.askQuestion('Select an option (1-6): ');
    
    switch (choice.trim()) {
      case '1':
        await this.runPersonAnalysis();
        break;
      case '2':
        await this.testGoogleScraper();
        break;
      case '3':
        await this.testLinkedInScraper();
        break;
      case '4':
        await this.testWebScraper();
        break;
      case '5':
        await this.runInteractiveAnalysis();
        break;
      case '6':
        await this.exit();
        break;
      default:
        console.log('Invalid option. Please try again.');
        await this.showMenu();
    }
  }

  private async runPersonAnalysis() {
    console.log('\\n🔍 Enhanced Person Analysis');
    console.log('============================');
    
    const firstName = await this.askQuestion('Enter first name: ');
    const lastName = await this.askQuestion('Enter last name: ');
    const email = await this.askQuestion('Enter email (optional): ');
    
    const options = {
      maxResults: 20,
      includeDeepAnalysis: true,
      includeSocialMedia: true,
      includeLinkedIn: true,
      includeProfessionalSites: true,
      includeContactDiscovery: true,
      enableClustering: true,
      enableNLP: true,
      humanBehavior: true,
      randomizeFingerprints: true,
      useAdvancedDetection: true,
      exportResults: true,
    };

    try {
      console.log('\\n🚀 Starting enhanced analysis...');
      const startTime = Date.now();
      
      const result = await this.analyzer.analyzePersonComprehensive(
        firstName.trim(),
        lastName.trim(),
        email.trim() || undefined,
        options
      );

      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log('\\n📊 Enhanced Analysis Results:');
      console.log('==============================');
      console.log(`⏱️  Duration: ${duration}s`);
      console.log(`🎯 Overall Confidence: ${result.confidence.overall}%`);
      console.log(`📈 Name Confidence: ${result.confidence.name}%`);
      console.log(`🌐 Social Confidence: ${result.confidence.social}%`);
      console.log(`💼 Professional Confidence: ${result.confidence.professional}%`);
      console.log(`📞 Contact Confidence: ${result.confidence.contact}%`);
      console.log('');
      
      console.log('📋 Summary:');
      console.log(`   Name: ${result.summary.mostLikelyName}`);
      console.log(`   Occupation: ${result.summary.primaryOccupation || 'Unknown'}`);
      console.log(`   Company: ${result.summary.primaryCompany || 'Unknown'}`);
      console.log(`   Location: ${result.summary.primaryLocation || 'Unknown'}`);
      console.log(`   Verification: ${result.summary.verificationLevel}`);
      console.log('');
      
      console.log('📊 Sources Found:');
      console.log(`   Google Results: ${result.sources.googleResults.length}`);
      console.log(`   LinkedIn Profiles: ${result.sources.linkedinProfiles.length}`);
      console.log(`   Social Media: ${result.sources.socialMedia.length}`);
      console.log(`   Professional Sites: ${result.sources.professionalSites.length}`);
      console.log(`   Additional Sites: ${result.sources.additionalSites.length}`);
      console.log('');
      
      console.log('✨ Enhanced Features Used:');
      result.metadata.enhancedFeatures.forEach(feature => {
        console.log(`   ✅ ${feature}`);
      });
      console.log('');
      
      if (result.analysis.companies.length > 0) {
        console.log('🏢 Companies Found:');
        result.analysis.companies.slice(0, 5).forEach(company => {
          console.log(`   • ${company}`);
        });
        console.log('');
      }
      
      if (result.analysis.locations.length > 0) {
        console.log('📍 Locations Found:');
        result.analysis.locations.slice(0, 5).forEach(location => {
          console.log(`   • ${location}`);
        });
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error);
    }
    
    await this.askQuestion('\\nPress Enter to return to menu...');
    await this.showMenu();
  }

  private async testGoogleScraper() {
    console.log('\\n🔍 Testing Enhanced Google Scraper');
    console.log('===================================');
    
    const query = await this.askQuestion('Enter search query: ');
    
    try {
      console.log('🚀 Performing enhanced Google search...');
      const startTime = Date.now();
      
      // Access the Google scraper directly
      const googleScraper = (this.analyzer as any).googleScraper;
      const results = await googleScraper.searchGoogle(query, {
        maxResults: 10,
        includeSnippets: true,
        humanBehavior: true,
        randomizeViewport: true,
        blockResources: true,
      });
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log(`\\n✅ Found ${results.length} results in ${duration}s`);
      console.log('');
      
      results.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   🔗 ${result.url}`);
        console.log(`   🌐 ${result.domain}`);
        if (result.snippet) {
          console.log(`   📝 ${result.snippet.substring(0, 100)}...`);
        }
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Enhanced Google search failed:', error);
    }
    
    await this.askQuestion('Press Enter to return to menu...');
    await this.showMenu();
  }

  private async testLinkedInScraper() {
    console.log('\\n🔍 Testing Enhanced LinkedIn Scraper');
    console.log('====================================');
    
    const firstName = await this.askQuestion('Enter first name: ');
    const lastName = await this.askQuestion('Enter last name: ');
    
    try {
      console.log('🚀 Performing enhanced LinkedIn search...');
      const startTime = Date.now();
      
      // Access the LinkedIn scraper directly
      const linkedinScraper = (this.analyzer as any).linkedinScraper;
      const profiles = await linkedinScraper.searchPersonLinkedIn(firstName, lastName, {
        maxResults: 5,
        includeDetails: true,
        humanBehavior: true,
        randomizeViewport: true,
        blockResources: true,
      });
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log(`\\n✅ Found ${profiles.length} LinkedIn profiles in ${duration}s`);
      console.log('');
      
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name}`);
        console.log(`   💼 ${profile.title || 'No title'}`);
        console.log(`   🏢 ${profile.company || 'No company'}`);
        console.log(`   📍 ${profile.location || 'No location'}`);
        console.log(`   🔗 ${profile.profileUrl}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Enhanced LinkedIn search failed:', error);
    }
    
    await this.askQuestion('Press Enter to return to menu...');
    await this.showMenu();
  }

  private async testWebScraper() {
    console.log('\\n🌐 Testing Enhanced Web Scraper');
    console.log('===============================');
    
    const url = await this.askQuestion('Enter URL to scrape: ');
    
    try {
      console.log('🚀 Scraping website with enhanced anti-detection...');
      const startTime = Date.now();
      
      // Access the web scraper directly
      const webScraper = (this.analyzer as any).webScraper;
      const result = await webScraper.scrapeWebsite(url);
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      console.log(`\\n✅ Successfully scraped in ${duration}s`);
      console.log('');
      console.log(`📝 Title: ${result.title || 'No title'}`);
      console.log(`📄 Description: ${result.description || 'No description'}`);
      console.log(`🔤 Content Length: ${result.content?.length || 0} characters`);
      console.log(`🖼️  Images: ${result.images?.length || 0}`);
      console.log(`🔗 Links: ${result.links?.length || 0}`);
      console.log('');
      
      if (result.content && result.content.length > 200) {
        console.log('📝 Content Preview:');
        console.log(result.content.substring(0, 200) + '...');
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Enhanced web scraping failed:', error);
    }
    
    await this.askQuestion('Press Enter to return to menu...');
    await this.showMenu();
  }

  private async runInteractiveAnalysis() {
    console.log('\\n🎯 Interactive Enhanced Analysis');
    console.log('================================');
    
    const firstName = await this.askQuestion('Enter first name: ');
    const lastName = await this.askQuestion('Enter last name: ');
    const email = await this.askQuestion('Enter email (optional): ');
    
    console.log('\\n🔧 Configuration Options:');
    const maxResults = parseInt(await this.askQuestion('Max results (default 20): ') || '20');
    const includeLinkedIn = (await this.askQuestion('Include LinkedIn? (y/n, default y): ') || 'y').toLowerCase() === 'y';
    const includeSocial = (await this.askQuestion('Include social media? (y/n, default y): ') || 'y').toLowerCase() === 'y';
    const enableClustering = (await this.askQuestion('Enable clustering? (y/n, default y): ') || 'y').toLowerCase() === 'y';
    const enableNLP = (await this.askQuestion('Enable NLP analysis? (y/n, default y): ') || 'y').toLowerCase() === 'y';
    const humanBehavior = (await this.askQuestion('Use human behavior simulation? (y/n, default y): ') || 'y').toLowerCase() === 'y';
    
    const options = {
      maxResults,
      includeLinkedIn,
      includeSocialMedia: includeSocial,
      enableClustering,
      enableNLP,
      humanBehavior,
      randomizeFingerprints: true,
      useAdvancedDetection: true,
      exportResults: true,
    };

    try {
      console.log('\\n🚀 Running customized enhanced analysis...');
      const result = await this.analyzer.analyzePersonComprehensive(
        firstName.trim(),
        lastName.trim(),
        email.trim() || undefined,
        options
      );

      console.log('\\n📊 Interactive Analysis Complete!');
      console.log(`🎯 Overall Confidence: ${result.confidence.overall}%`);
      console.log(`📊 Total Sources: ${result.metadata.totalSources}`);
      console.log(`⏱️  Duration: ${Math.round(result.metadata.searchDuration / 1000)}s`);
      console.log(`✨ Features Used: ${result.metadata.enhancedFeatures.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Interactive analysis failed:', error);
    }
    
    await this.askQuestion('\\nPress Enter to return to menu...');
    await this.showMenu();
  }

  private async exit() {
    console.log('\\n👋 Closing Enhanced OSINT Analyzer...');
    await this.analyzer.close();
    this.rl.close();
    console.log('✅ Enhanced system closed successfully');
    process.exit(0);
  }

  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
const cli = new EnhancedOSINTCLI();

if (args.length >= 2) {
  // Direct command line usage
  const [firstName, lastName, email] = args;
  
  console.log('🚀 Enhanced OSINT Analysis (Command Line Mode)');
  console.log('==============================================');
  
  cli.analyzer.setup().then(async () => {
    try {
      const result = await cli.analyzer.analyzePersonComprehensive(
        firstName,
        lastName,
        email,
        {
          maxResults: 20,
          includeDeepAnalysis: true,
          includeSocialMedia: true,
          includeLinkedIn: true,
          enableClustering: true,
          enableNLP: true,
          humanBehavior: true,
          exportResults: true,
        }
      );
      
      console.log('\\n📊 Enhanced Analysis Results:');
      console.log(`🎯 Overall Confidence: ${result.confidence.overall}%`);
      console.log(`📊 Total Sources: ${result.metadata.totalSources}`);
      console.log(`⏱️  Duration: ${Math.round(result.metadata.searchDuration / 1000)}s`);
      console.log(`✨ Enhanced Features: ${result.metadata.enhancedFeatures.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      await cli.analyzer.close();
      process.exit(0);
    }
  });
} else {
  // Interactive mode
  cli.start();
}

export { EnhancedOSINTCLI };
