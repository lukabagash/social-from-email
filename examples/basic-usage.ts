/**
 * Basic usage examples for social-from-email
 */

import { quickSearch, comprehensiveSearch, extractSocialLinks } from '../src/api.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Example 1: Quick search for social profiles
async function basicExample() {
  console.log('🔍 Example 1: Quick Search');
  console.log('=' .repeat(50));
  
  try {
    const result = await quickSearch(
      'John',
      'Doe', 
      'john.doe@example.com',
      10  // Number of queries (REQUIRED)
    );
    
    console.log(`✅ Found ${result.analysis.identifiedPersons.length} person(s)`);
    console.log(`⏱️ Execution time: ${result.executionTime}ms`);
    console.log(`🔗 Social links: ${result.socialLinks?.totalSocialLinks || 0}`);
    
    // Display main person's information
    if (result.analysis.identifiedPersons.length > 0) {
      const mainPerson = result.analysis.identifiedPersons[0];
      console.log(`\n👤 Main Identity (${mainPerson.confidence}% confidence):`);
      console.log(`   Name: ${mainPerson.personEvidence.name || 'N/A'}`);
      console.log(`   Title: ${mainPerson.personEvidence.title || 'N/A'}`);
      console.log(`   Company: ${mainPerson.personEvidence.company || 'N/A'}`);
      console.log(`   Location: ${mainPerson.personEvidence.location || 'N/A'}`);
      
      if (mainPerson.personEvidence.socialProfiles?.length) {
        console.log(`\n🌐 Social Profiles:`);
        mainPerson.personEvidence.socialProfiles.forEach(profile => {
          console.log(`   ${profile.platform}: ${profile.url}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 2: Comprehensive analysis with all features
async function advancedExample() {
  console.log('\n\n🔍 Example 2: Comprehensive Analysis');
  console.log('=' .repeat(50));
  
  try {
    const result = await comprehensiveSearch(
      'Jane',
      'Smith',
      'jane.smith@techcompany.com',
      20  // Number of queries (REQUIRED)
    );
    
    console.log(`✅ Comprehensive analysis completed`);
    console.log(`📊 Analysis confidence: ${result.analysis.analysis.mainPersonConfidence}%`);
    console.log(`🔍 Sources analyzed: ${result.analysis.summary.totalSources}`);
    console.log(`🌐 Domains found: ${result.analysis.summary.topDomains.length}`);
    
    // Show all identified persons
    result.analysis.identifiedPersons.forEach((person, index) => {
      console.log(`\n👤 Person ${index + 1} (${person.confidence}% confidence):`);
      console.log(`   Sources: ${person.sources.length}`);
      
      const evidence = person.personEvidence;
      if (evidence.name) console.log(`   Name: ${evidence.name}`);
      if (evidence.title) console.log(`   Title: ${evidence.title}`);
      if (evidence.company) console.log(`   Company: ${evidence.company}`);
      if (evidence.location) console.log(`   Location: ${evidence.location}`);
      if (evidence.skills?.length) {
        console.log(`   Skills: ${evidence.skills.slice(0, 3).join(', ')}${evidence.skills.length > 3 ? '...' : ''}`);
      }
    });
    
    // Show social links summary
    if (result.socialLinks) {
      console.log(`\n🔗 Social Links Summary:`);
      console.log(`   Total links: ${result.socialLinks.totalSocialLinks}`);
      console.log(`   High confidence: ${result.socialLinks.highConfidenceLinks.length}`);
      console.log(`   Platforms: ${result.socialLinks.uniquePlatforms.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 3: Social links only
async function socialLinksExample() {
  console.log('\n\n🔍 Example 3: Extract Social Links Only');
  console.log('=' .repeat(50));
  
  try {
    const socialSummary = await extractSocialLinks(
      'Mark',
      'Wilson',
      'mark.wilson@designagency.com',
      15  // Number of queries (REQUIRED)
    );
    
    console.log(`✅ Social links extraction completed`);
    console.log(`🔗 Total social links: ${socialSummary.totalSocialLinks}`);
    console.log(`📊 Platform breakdown:`);
    
    Object.entries(socialSummary.platformBreakdown).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} link(s)`);
    });
    
    console.log(`\n🏆 High confidence links:`);
    socialSummary.highConfidenceLinks.slice(0, 5).forEach((link, index) => {
      console.log(`   ${index + 1}. ${link.platform}: ${link.url} (${link.confidence}%)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Social From Email - Usage Examples');
  console.log('=' .repeat(60));
  
  await basicExample();
  await advancedExample();
  await socialLinksExample();
  
  console.log('\n\n✅ All examples completed!');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export { basicExample, advancedExample, socialLinksExample, runAllExamples };
