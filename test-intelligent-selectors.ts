#!/usr/bin/env ts-node

/**
 * Quick test script to demonstrate intelligent selectors working
 */

import { CrawleeSearchEngine } from './src/crawlee-search/search-engine';

async function testIntelligentSelectors() {
  console.log('🧪 Testing Intelligent Selector System');
  console.log('=====================================\n');

  // Test with intelligent selectors enabled
  const intelligentEngine = new CrawleeSearchEngine({
    maxResultsPerEngine: 5,
    searchEngines: ['duckduckgo'],
    useIntelligentSelectors: true,
    selectorCacheEnabled: true,
    maxConcurrency: 1,
    requestTimeout: 15,
    retries: 1
  });

  try {
    await intelligentEngine.initialize();
    console.log('✅ Intelligent selector engine initialized\n');

    const results = await intelligentEngine.searchMultipleQueries(['Luka Bagashvili']);
    
    console.log(`📊 Results: ${results.length} found`);
    
    // Show selector statistics
    const stats = intelligentEngine.getSelectorStats();
    console.log(`\n🎯 Selector Statistics:`);
    console.log(`   Total cache entries: ${stats.total}`);
    console.log(`   Successful selectors: ${stats.successful}`);
    console.log(`   Failed selectors: ${stats.failed}`);
    
    // Show sample results with selector metadata
    console.log('\n📋 Sample Results with Selector Info:');
    results.slice(0, 3).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Selector Type: ${result.metadata.selectorType || 'unknown'}`);
      console.log(`   Selector Used: ${result.metadata.selectorUsed?.substring(0, 50)}...`);
    });

    await intelligentEngine.close();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await intelligentEngine.close();
  }
}

// Run the test
if (require.main === module) {
  testIntelligentSelectors().catch(console.error);
}
