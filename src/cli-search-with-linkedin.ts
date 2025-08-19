#!/usr/bin/env node

import { GoogleSearchScraper } from './google-search/scraper.js';
import { LinkedInProfileScraper } from './linkedin/scraper.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface LinkedInScrapingResult {
  url: string;
  profile?: any;
  error?: string;
}

interface EnhancedSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  linkedinData?: any;
}

async function scrapeLinkedInProfiles(linkedinUrls: string[]): Promise<LinkedInScrapingResult[]> {
  if (linkedinUrls.length === 0) {
    return [];
  }

  const liAtCookie = process.env.LI_AT;
  if (!liAtCookie) {
    console.log('⚠️  LI_AT cookie not found in .env file. Skipping LinkedIn profile scraping.');
    return linkedinUrls.map(url => ({ url, error: 'No LI_AT cookie configured' }));
  }

  const linkedinScraper = new LinkedInProfileScraper({
    sessionCookieValue: liAtCookie,
    keepAlive: true,
    headless: true,
    timeout: 20000
  });

  const results: LinkedInScrapingResult[] = [];

  try {
    console.log('🔧 Setting up LinkedIn scraper...');
    await linkedinScraper.setup();

    for (let i = 0; i < linkedinUrls.length; i++) {
      const url = linkedinUrls[i];
      console.log(`📊 Scraping LinkedIn profile ${i + 1}/${linkedinUrls.length}: ${url}`);
      
      try {
        const profile = await linkedinScraper.run(url);
        results.push({ url, profile });
        
        // Add delay between scrapes to be respectful
        if (i < linkedinUrls.length - 1) {
          console.log('⏳ Waiting 3 seconds before next scrape...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error: any) {
        console.log(`❌ Failed to scrape ${url}: ${error.message}`);
        results.push({ url, error: error.message });
      }
    }
  } catch (error: any) {
    console.log(`❌ LinkedIn scraper setup failed: ${error.message}`);
    return linkedinUrls.map(url => ({ url, error: 'Scraper setup failed' }));
  } finally {
    await linkedinScraper.close();
  }

  return results;
}

function formatLinkedInProfile(profile: any): string {
  const { userProfile, experiences, education, skills } = profile;
  
  let output = '';
  
  // User Profile
  output += `\n    👤 Profile Information:\n`;
  output += `       Name: ${userProfile.fullName || 'N/A'}\n`;
  output += `       Title: ${userProfile.title || 'N/A'}\n`;
  if (userProfile.location) {
    const loc = userProfile.location;
    const locationStr = [loc.city, loc.province, loc.country].filter(Boolean).join(', ');
    output += `       Location: ${locationStr}\n`;
  }
  if (userProfile.description) {
    output += `       About: ${userProfile.description.substring(0, 200)}${userProfile.description.length > 200 ? '...' : ''}\n`;
  }
  
  // Recent Experience
  if (experiences && experiences.length > 0) {
    output += `\n    💼 Recent Experience:\n`;
    const recentExperiences = experiences.slice(0, 3);
    recentExperiences.forEach((exp: any) => {
      output += `       • ${exp.title || 'N/A'} at ${exp.company || 'N/A'}`;
      if (exp.startDate) {
        const duration = exp.endDateIsPresent ? 'Present' : exp.endDate || 'N/A';
        output += ` (${exp.startDate} - ${duration})`;
      }
      output += '\n';
    });
  }
  
  // Education
  if (education && education.length > 0) {
    output += `\n    🎓 Education:\n`;
    education.slice(0, 2).forEach((edu: any) => {
      output += `       • ${edu.degreeName || 'N/A'} at ${edu.schoolName || 'N/A'}`;
      if (edu.fieldOfStudy) {
        output += ` (${edu.fieldOfStudy})`;
      }
      output += '\n';
    });
  }
  
  // Top Skills
  if (skills && skills.length > 0) {
    output += `\n    🎯 Top Skills:\n`;
    const topSkills = skills
      .filter((skill: any) => skill.skillName)
      .sort((a: any, b: any) => (b.endorsementCount || 0) - (a.endorsementCount || 0))
      .slice(0, 5);
    
    const skillNames = topSkills.map((skill: any) => skill.skillName).join(', ');
    output += `       ${skillNames}\n`;
  }
  
  return output;
}

function displayResults(results: EnhancedSearchResult[], detailed: boolean = false) {
  if (results.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`\n📊 Found ${results.length} search results:\n`);

  if (detailed) {
    // Group by domain for detailed view
    const grouped = results.reduce((acc: any, result) => {
      if (!acc[result.domain]) {
        acc[result.domain] = [];
      }
      acc[result.domain].push(result);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([domain, domainResults]: [string, any]) => {
      console.log(`🌐 ${domain.toUpperCase()} (${domainResults.length} result${domainResults.length > 1 ? 's' : ''})`);
      
      domainResults.forEach((result: EnhancedSearchResult, index: number) => {
        console.log(`\n  ${index + 1}. ${result.title}`);
        console.log(`     🔗 ${result.url}`);
        if (result.snippet) {
          console.log(`     📝 ${result.snippet}`);
        }
        
        // Show LinkedIn profile data if available
        if (result.linkedinData) {
          console.log(`\n    🔍 LinkedIn Profile Details:`);
          console.log(formatLinkedInProfile(result.linkedinData));
        }
      });
      
      console.log(''); // Empty line between domains
    });
  } else {
    // Simple list view
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   🔗 ${result.url}`);
      console.log(`   🌐 ${result.domain}`);
      if (result.snippet) {
        console.log(`   📝 ${result.snippet.substring(0, 150)}${result.snippet.length > 150 ? '...' : ''}`);
      }
      
      // Show LinkedIn profile data if available (simplified)
      if (result.linkedinData && result.linkedinData.userProfile) {
        const profile = result.linkedinData.userProfile;
        console.log(`   👤 ${profile.fullName || 'N/A'} - ${profile.title || 'N/A'}`);
      }
      
      console.log('');
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node dist/cli-search-with-linkedin.cjs <firstName> [lastName] [email] [--detailed]');
    console.log('Examples:');
    console.log('  node dist/cli-search-with-linkedin.cjs "Elon Musk"');
    console.log('  node dist/cli-search-with-linkedin.cjs Luka Bagashvili bagash_l2@denison.edu --detailed');
    process.exit(1);
  }

  const detailed = args.includes('--detailed');
  const searchArgs = args.filter(arg => arg !== '--detailed');
  
  let firstName = '';
  let lastName = '';
  let email = '';

  if (searchArgs.length === 1) {
    // Single argument - could be "FirstName LastName" or just FirstName
    const nameParts = searchArgs[0].split(' ');
    if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else {
      firstName = searchArgs[0];
    }
  } else if (searchArgs.length >= 2) {
    firstName = searchArgs[0];
    lastName = searchArgs[1];
    email = searchArgs[2] || '';
  }

  if (!firstName) {
    console.log('❌ Please provide at least a first name');
    process.exit(1);
  }

  console.log(`🔍 Google Search with LinkedIn: ${firstName}${lastName ? ' ' + lastName : ''}${email ? ' (' + email + ')' : ''}`);
  console.log('================================================================================');

  const scraper = new GoogleSearchScraper();
  
  try {
    console.log('� Google scraper initialized...');
    await scraper.setup();
    
    console.log(`🔍 Mode: ${detailed ? 'Detailed with variations' : 'Basic search'}`);
    
    let results;
    if (detailed) {
      results = await scraper.searchPersonWithVariations(firstName, lastName, email, { 
        maxResults: 5,
        includeSnippets: true 
      });
    } else {
      results = await scraper.searchPerson(firstName, lastName, email, { 
        maxResults: 10,
        includeSnippets: true 
      });
    }

    console.log(`✅ Found ${results.length} search result(s):`);

    // Extract LinkedIn URLs
    const linkedinUrls = results
      .filter(result => result.domain.includes('linkedin.com') && result.url.includes('/in/'))
      .map(result => result.url);

    console.log(`🔗 Found ${linkedinUrls.length} LinkedIn profile(s)`);

    // Scrape LinkedIn profiles
    let linkedinResults: LinkedInScrapingResult[] = [];
    if (linkedinUrls.length > 0) {
      console.log('🕷️  Starting LinkedIn profile scraping...');
      linkedinResults = await scrapeLinkedInProfiles(linkedinUrls);
    }

    // Combine results with LinkedIn data
    const enhancedResults: EnhancedSearchResult[] = results.map(result => {
      const linkedinResult = linkedinResults.find(lr => lr.url === result.url);
      return {
        ...result,
        linkedinData: linkedinResult?.profile
      };
    });

    // Display results
    displayResults(enhancedResults, detailed);

    // Summary of LinkedIn scraping
    if (linkedinResults.length > 0) {
      const successful = linkedinResults.filter(r => r.profile).length;
      const failed = linkedinResults.filter(r => r.error).length;
      console.log(`\n📈 LinkedIn Scraping Summary:`);
      console.log(`   ✅ Successfully scraped: ${successful} profile(s)`);
      if (failed > 0) {
        console.log(`   ❌ Failed to scrape: ${failed} profile(s)`);
      }
    }

    console.log('\n🔚 Search completed and browser closed');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
