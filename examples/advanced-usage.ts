/**
 * Advanced usage examples showcasing custom configurations
 */

import { 
  searchAndAnalyzePerson,
  validatePersonInput,
  validateEmail,
  exportSocialLinksToFile
} from '../src/api';

// Example 1: Custom search configuration
async function customSearchExample() {
  console.log('🔧 Example 1: Custom Search Configuration');
  console.log('=' .repeat(50));
  
  try {
    const result = await searchAndAnalyzePerson(
      {
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.johnson@startup.io'
      },
      {
        // Search Options
        queryCount: 25,                    // Execute 25 search queries (REQUIRED)
        detailed: true,                    // Enhanced search depth
        priority: 'professional',          // Focus on professional platforms
        useAdvancedClustering: true        // Use ML clustering
      },
      {
        // Analysis Options
        includeExtended: true,             // Biographical insights
        includeTechnical: true,            // Technical metrics
        includeKeywords: true,             // Keyword analysis
        includeSocialLinks: true           // Social media extraction
      }
    );
    
    console.log(`✅ Custom search completed`);
    console.log(`🎯 Clustering method: ${result.analysis.analysis.clusteringMethod}`);
    console.log(`📊 Main person confidence: ${result.analysis.analysis.mainPersonConfidence}%`);
    console.log(`🕐 Execution time: ${(result.executionTime / 1000).toFixed(2)} seconds`);
    
    // Show biographical insights if available
    const insights = result.analysis.summary.biographicalInsights;
    if (insights) {
      console.log(`\n🧠 Biographical Insights:`);
      if (insights.careerStage) console.log(`   Career Stage: ${insights.careerStage}`);
      if (insights.professionalSeniority) console.log(`   Seniority: ${insights.professionalSeniority}`);
      if (insights.industryExpertise?.length) {
        console.log(`   Industry Expertise: ${insights.industryExpertise.join(', ')}`);
      }
      if (insights.keySkills?.length) {
        console.log(`   Key Skills: ${insights.keySkills.slice(0, 5).join(', ')}`);
      }
    }
    
    // Show keyword analysis
    if (result.analysis.keywordAnalysis.topKeywords.length > 0) {
      console.log(`\n🔤 Top Keywords: ${result.analysis.keywordAnalysis.topKeywords.slice(0, 5).join(', ')}`);
    }
    
    // Export social links to file
    if (result.socialLinks) {
      const filename = `./exports/alex-johnson-social-links.json`;
      exportSocialLinksToFile(result.socialLinks, filename);
      console.log(`💾 Social links exported to: ${filename}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 2: Validation and error handling
async function validationExample() {
  console.log('\n\n✅ Example 2: Input Validation');
  console.log('=' .repeat(50));
  
  // Test email validation
  const emails = [
    'valid@example.com',
    'also.valid+test@company.co.uk',
    'invalid-email',
    '@invalid.com',
    'missing-domain@'
  ];
  
  console.log('📧 Email Validation Tests:');
  emails.forEach(email => {
    const isValid = validateEmail(email);
    console.log(`   ${isValid ? '✅' : '❌'} ${email}`);
  });
  
  // Test person input validation
  const testInputs = [
    { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    { firstName: 'J', lastName: 'Doe', email: 'j@example.com' },
    { firstName: 'John', lastName: 'D', email: 'john@example.com' },
    { firstName: 'John', lastName: 'Doe', email: 'invalid-email' },
    { firstName: '', lastName: 'Doe', email: 'john@example.com' }
  ];
  
  console.log('\n👤 Person Input Validation Tests:');
  testInputs.forEach((input, index) => {
    const validation = validatePersonInput(input);
    console.log(`   Test ${index + 1}: ${validation.valid ? '✅' : '❌'}`);
    if (!validation.valid) {
      console.log(`     Errors: ${validation.errors.join(', ')}`);
    }
  });
}

// Example 3: Different search priorities comparison
async function searchPriorityComparison() {
  console.log('\n\n🎯 Example 3: Search Priority Comparison');
  console.log('=' .repeat(50));
  
  const person = {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@techcorp.com'
  };
  
  const priorities: Array<'social-first' | 'professional' | 'comprehensive'> = [
    'social-first',
    'professional',
    'comprehensive'
  ];
  
  for (const priority of priorities) {
    try {
      console.log(`\n🔍 Testing ${priority.toUpperCase()} priority...`);
      
      const result = await searchAndAnalyzePerson(
        person,
        {
          queryCount: 10,  // Limit for faster comparison
          priority: priority,
          detailed: false
        },
        {
          includeSocialLinks: true
        }
      );
      
      console.log(`   ⏱️ Time: ${(result.executionTime / 1000).toFixed(2)}s`);
      console.log(`   👥 Persons found: ${result.analysis.identifiedPersons.length}`);
      console.log(`   📊 Confidence: ${result.analysis.analysis.mainPersonConfidence}%`);
      console.log(`   🔗 Social links: ${result.socialLinks?.totalSocialLinks || 0}`);
      console.log(`   🌐 Top domains: ${result.analysis.summary.topDomains.slice(0, 3).map(d => d.domain).join(', ')}`);
      
    } catch (error) {
      console.error(`   ❌ Error with ${priority}:`, error instanceof Error ? error.message : error);
    }
  }
}

// Example 4: Working with individual person clusters
async function personClusterAnalysis() {
  console.log('\n\n👥 Example 4: Person Cluster Analysis');
  console.log('=' .repeat(50));
  
  try {
    const result = await searchAndAnalyzePerson(
      {
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'michael.rodriguez@consultancy.com'
      },
      {
        queryCount: 18,                    // Number of queries (REQUIRED)
        detailed: true,
        useAdvancedClustering: true
      },
      {
        includeExtended: true
      }
    );
    
    console.log(`🔍 Found ${result.analysis.identifiedPersons.length} person clusters`);
    
    result.analysis.identifiedPersons.forEach((cluster, index) => {
      console.log(`\n👤 Cluster ${index + 1}:`);
      console.log(`   🎯 Confidence: ${cluster.confidence}%`);
      console.log(`   📊 Sources: ${cluster.sources.length}`);
      
      const evidence = cluster.personEvidence;
      console.log(`   📝 Evidence:`);
      if (evidence.name) console.log(`     Name: ${evidence.name}`);
      if (evidence.title) console.log(`     Title: ${evidence.title}`);
      if (evidence.company) console.log(`     Company: ${evidence.company}`);
      if (evidence.location) console.log(`     Location: ${evidence.location}`);
      if (evidence.phone) console.log(`     Phone: ${evidence.phone}`);
      
      // Show social profiles for this cluster
      if (evidence.socialProfiles?.length) {
        console.log(`   🌐 Social Profiles:`);
        evidence.socialProfiles.forEach(profile => {
          console.log(`     ${profile.platform}: ${profile.url}`);
          if (profile.followers) console.log(`       Followers: ${profile.followers}`);
        });
      }
      
      // Show top sources
      console.log(`   📚 Top Sources:`);
      cluster.sources.slice(0, 3).forEach(source => {
        console.log(`     • ${source.domain} (${source.relevanceScore}% relevance)`);
        console.log(`       ${source.title}`);
      });
    });
    
    // Analysis summary
    console.log(`\n📈 Analysis Summary:`);
    console.log(`   Same person likelihood: ${result.analysis.analysis.likelyIsSamePerson ? 'Yes' : 'No'}`);
    console.log(`   Clustering method: ${result.analysis.analysis.clusteringMethod}`);
    
    if (result.analysis.analysis.reasonsForMultiplePeople.length > 0) {
      console.log(`   Reasons for multiple identities:`);
      result.analysis.analysis.reasonsForMultiplePeople.forEach(reason => {
        console.log(`     • ${reason}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example 5: Performance monitoring
async function performanceExample() {
  console.log('\n\n⚡ Example 5: Performance Monitoring');
  console.log('=' .repeat(50));
  
  const testCases = [
    { queries: 5, detailed: false, clustering: false },
    { queries: 10, detailed: true, clustering: false },
    { queries: 15, detailed: true, clustering: true }
  ];
  
  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`\n🧪 Test Case ${index + 1}: ${testCase.queries} queries, detailed: ${testCase.detailed}, ML clustering: ${testCase.clustering}`);
      
      const startTime = Date.now();
      
      const result = await searchAndAnalyzePerson(
        {
          firstName: 'Emma',
          lastName: 'Thompson',
          email: 'emma.thompson@media.com'
        },
        {
          queryCount: testCase.queries,
          detailed: testCase.detailed,
          useAdvancedClustering: testCase.clustering
        },
        {
          includeSocialLinks: true
        }
      );
      
      const endTime = Date.now();
      
      console.log(`   ⏱️ Total time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
      console.log(`   🔍 Persons found: ${result.analysis.identifiedPersons.length}`);
      console.log(`   📊 Sources: ${result.analysis.summary.totalSources}`);
      console.log(`   🔗 Social links: ${result.socialLinks?.totalSocialLinks || 0}`);
      console.log(`   💾 Memory efficiency: ${result.metadata ? 'Optimized' : 'Standard'}`);
      
    } catch (error) {
      console.error(`   ❌ Test case ${index + 1} failed:`, error instanceof Error ? error.message : error);
    }
  }
}

// Run all advanced examples
async function runAdvancedExamples() {
  console.log('🚀 Social From Email - Advanced Usage Examples');
  console.log('=' .repeat(60));
  
  await customSearchExample();
  await validationExample();
  await searchPriorityComparison();
  await personClusterAnalysis();
  await performanceExample();
  
  console.log('\n\n✅ All advanced examples completed!');
  console.log('\n💡 Tips:');
  console.log('   • Use social-first priority for personal branding research');
  console.log('   • Use professional priority for B2B lead generation');
  console.log('   • Use comprehensive priority for thorough investigations');
  console.log('   • Enable ML clustering for complex identity resolution');
  console.log('   • Monitor execution time vs. accuracy trade-offs');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdvancedExamples().catch(console.error);
}

export {
  customSearchExample,
  validationExample,
  searchPriorityComparison,
  personClusterAnalysis,
  performanceExample,
  runAdvancedExamples
};
