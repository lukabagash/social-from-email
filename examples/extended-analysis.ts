import { performExtendedAnalysis } from '../dist/index.js';

// Test the new performExtendedAnalysis API function
const person = {
  firstName: "Luka",
  lastName: "Bagashvili",
  email: "bagash_l2@denison.edu"
};

const queryCount = 3;

console.log('🎯 EXTENDED ANALYSIS WITH LINK DISCOVERY');
console.log('================================================================================');
console.log(`👤 Target: ${person.firstName} ${person.lastName}`);
console.log(`📧 Email: ${person.email}`);
console.log(`🔢 Query Count: ${queryCount}`);
console.log(`🔍 Mode: Extended Analysis (Biographical Intelligence)`);
console.log(`🚀 API Function: performExtendedAnalysis`);
console.log('================================================================================\n');

try {
  console.log('🔍 Starting Extended Analysis...');
  const startTime = Date.now();
  
  const result = await performExtendedAnalysis(
    person.firstName,
    person.lastName, 
    person.email,
    queryCount
  );
  
  const endTime = Date.now();
  console.log(`✅ Analysis completed in ${endTime - startTime}ms\n`);
  
  // Display basic results
  console.log('📊 ANALYSIS SUMMARY:');
  console.log('================================================================================');
  console.log(`   Person Confidence: ${result.personConfidence}%`);
  console.log(`   Total Sources: ${result.totalSources}`);
  console.log(`   Analysis Method: ${result.metadata.enhancementMethod}`);
  console.log('');
  
  // Display biographical insights if available
  if (result.biographicalAnalysis) {
    console.log('🧠 BIOGRAPHICAL ANALYSIS:');
    console.log('────────────────────────────────────────────────────────────');
    console.log(`   Career Stage: ${result.biographicalAnalysis.careerStage}`);
    console.log(`   Seniority Level: ${result.biographicalAnalysis.seniorityLevel}`);
    console.log(`   Education Level: ${result.biographicalAnalysis.educationLevel}`);
    console.log(`   Thought Leadership: ${result.biographicalAnalysis.thoughtLeadership}`);
    console.log(`   Digital Presence: ${result.biographicalAnalysis.digitalPresence}`);
    console.log(`   Geographic Mobility: ${result.biographicalAnalysis.geographicMobility}`);
    if (result.biographicalAnalysis.industryExpertise.length > 0) {
      console.log(`   Industry Expertise: ${result.biographicalAnalysis.industryExpertise.join(', ')}`);
    }
    console.log('');
  }
  
  // Focus on links found - extract all URLs and social profiles
  console.log('🔗 LINKS DISCOVERED:');
  console.log('================================================================================');
  
  const allLinks = new Set<string>();
  const socialProfiles = new Map<string, { url: string; username?: string; platform: string }[]>();
  
  // Extract links from supporting sources
  result.supportingSources.forEach(source => {
    allLinks.add(source.url);
  });
  
  // Extract social profiles from person evidence
  if (result.personEvidence.socialProfiles) {
    result.personEvidence.socialProfiles.forEach(social => {
      allLinks.add(social.url);
      
      const platform = social.platform.toLowerCase();
      if (!socialProfiles.has(platform)) {
        socialProfiles.set(platform, []);
      }
      socialProfiles.get(platform)!.push({
        url: social.url,
        username: social.username,
        platform: social.platform
      });
    });
  }
  
  // Extract additional websites
  if (result.personEvidence.websites) {
    result.personEvidence.websites.forEach(website => {
      allLinks.add(website);
    });
  }
  
  // Display social profiles by platform
  if (socialProfiles.size > 0) {
    console.log('📱 SOCIAL PROFILES BY PLATFORM:');
    console.log('────────────────────────────────────────────────────────────');
    
    for (const [platform, profiles] of socialProfiles.entries()) {
      console.log(`\n🔗 ${platform.toUpperCase()} (${profiles.length} profile${profiles.length > 1 ? 's' : ''}):`);
      profiles.forEach(profile => {
        let profileInfo = `   • ${profile.url}`;
        if (profile.username) {
          profileInfo += ` (@${profile.username})`;
        }
        console.log(profileInfo);
      });
    }
    console.log('');
  }
  
  // Display all unique links found
  const linksByDomain = new Map<string, string[]>();
  
  allLinks.forEach(link => {
    try {
      const domain = new URL(link).hostname;
      if (!linksByDomain.has(domain)) {
        linksByDomain.set(domain, []);
      }
      linksByDomain.get(domain)!.push(link);
    } catch (e) {
      // Invalid URL, skip
    }
  });
  
  console.log('🌐 ALL LINKS BY DOMAIN:');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`📊 Total Unique Links: ${allLinks.size}`);
  console.log(`🏷️  Unique Domains: ${linksByDomain.size}\n`);
  
  // Sort domains by number of links
  const sortedDomains = Array.from(linksByDomain.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedDomains.forEach(([domain, links]) => {
    console.log(`🌐 ${domain.toUpperCase()} (${links.length} link${links.length > 1 ? 's' : ''}):`);
    links.forEach(link => {
      console.log(`   • ${link}`);
    });
    console.log('');
  });
  
  // Display supporting sources with evidence
  console.log('📊 SUPPORTING SOURCES WITH EVIDENCE:');
  console.log('================================================================================');
  
  result.supportingSources.forEach((source, index) => {
    console.log(`${index + 1}. ${source.title}`);
    console.log(`   🔗 ${source.url}`);
    console.log(`   🏷️  Domain: ${source.domain}`);
    console.log(`   📊 Relevance: ${source.relevanceScore}%`);
    
    if (Object.keys(source.evidence).length > 0) {
      console.log(`   💡 Evidence Found:`);
      Object.entries(source.evidence).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          console.log(`      ${key}: [${value.join(', ')}]`);
        } else {
          console.log(`      ${key}: ${value}`);
        }
      });
    }
    console.log('');
  });
  
  // Summary statistics
  console.log('📈 LINK DISCOVERY STATISTICS:');
  console.log('================================================================================');
  console.log(`🔗 Total Unique Links: ${allLinks.size}`);
  console.log(`🌐 Unique Domains: ${linksByDomain.size}`);
  console.log(`📱 Social Platforms: ${socialProfiles.size}`);
  console.log(`📊 Supporting Sources: ${result.supportingSources.length}`);
  console.log(`⏱️  Analysis Time: ${endTime - startTime}ms`);
  console.log(`🎯 Person Confidence: ${result.personConfidence}%`);
  
} catch (error) {
  console.error('❌ Extended Analysis Failed:', error.message);
  console.error('Stack trace:', error.stack);
}
