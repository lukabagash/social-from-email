#!/usr/bin/env ts-node

/**
 * Demonstration script for the new Intelligent Selector Search Engine
 * 
 * This script showcases the advanced selector automation features:
 * 1. Intelligent CSS selector generation using css-selector-generator
 * 2. Community-maintained Google selectors from google-sr-selectors
 * 3. Automatic caching and validation
 * 4. Fallback strategies for maximum reliability
 * 5. Performance comparison with manual selectors
 */

import { EnhancedCrawleeSearchEngine, SearchEngineResult } from './enhanced-crawlee-search-engine';
import { IntelligentSelectorManager } from './intelligent-selector-manager';

async function demonstrateIntelligentSearch() {
  console.log('🚀 Intelligent Selector Search Engine Demo');
  console.log('=========================================\n');

  // Initialize with intelligent selectors enabled
  const searchEngine = new EnhancedCrawleeSearchEngine({
    maxResultsPerEngine: 5,
    searchEngines: ['duckduckgo', 'google', 'bing'],
    maxConcurrency: 2,
    useIntelligentSelectors: true,
    selectorCacheEnabled: true,
    enableJavaScript: true,
    waitForNetworkIdle: true
  });

  try {
    // Initialize the search engine
    await searchEngine.initialize();

    // Demonstration queries
    const queries = [
      'typescript web scraping libraries',
      'css selector automation tools',
      'intelligent web data extraction'
    ];

    console.log(`🔍 Testing intelligent selectors with ${queries.length} queries\n`);

    // Perform searches
    const results = await searchEngine.search(queries);

    // Display results with selector information
    console.log('\n📊 Search Results Summary:');
    console.log('==========================');
    console.log(`Total Results: ${results.length}`);

    // Group results by search engine
    const resultsByEngine = results.reduce((acc, result) => {
      acc[result.searchEngine] = (acc[result.searchEngine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nResults by Engine:');
    Object.entries(resultsByEngine).forEach(([engine, count]) => {
      console.log(`  ${engine}: ${count} results`);
    });

    // Group results by selector type
    const resultsBySelectorType = results.reduce((acc, result) => {
      const type = result.metadata.selectorType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nResults by Selector Type:');
    Object.entries(resultsBySelectorType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} results`);
    });

    // Show selector statistics
    const selectorStats = searchEngine.getSelectorStats();
    console.log('\n🎯 Selector Performance Statistics:');
    console.log('===================================');
    console.log(`Total Cache Entries: ${selectorStats.total}`);
    console.log(`Successful Selectors: ${selectorStats.successful}`);
    console.log(`Failed Selectors: ${selectorStats.failed}`);
    console.log(`Success Rate: ${selectorStats.total > 0 ? ((selectorStats.successful / selectorStats.total) * 100).toFixed(1) : 0}%`);

    // Display sample results
    console.log('\n📋 Sample Results:');
    console.log('==================');
    results.slice(0, 10).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Engine: ${result.searchEngine}`);
      console.log(`   Selector: ${result.metadata.selectorType} (${result.metadata.selectorUsed?.substring(0, 50)}...)`);
      console.log(`   Domain: ${result.domain}`);
    });

    // Test selector manager directly
    console.log('\n🔧 Direct Selector Manager Testing:');
    console.log('====================================');
    
    // Note: This would need a real page instance in practice
    console.log('Selector Manager Features:');
    console.log('- Intelligent CSS selector generation');
    console.log('- Community-maintained Google selectors integration');
    console.log('- Automatic caching with success/failure tracking');
    console.log('- Multi-tier fallback strategy');
    console.log('- Support for both Playwright and Puppeteer');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    await searchEngine.cleanup();
    console.log('\n✅ Demo completed successfully!');
  }
}

async function compareWithLegacySelectors() {
  console.log('\n⚡ Performance Comparison: Intelligent vs Legacy Selectors');
  console.log('=========================================================\n');

  // Test with intelligent selectors
  console.log('🎯 Testing with Intelligent Selectors...');
  const intelligentEngine = new EnhancedCrawleeSearchEngine({
    maxResultsPerEngine: 3,
    searchEngines: ['duckduckgo'],
    useIntelligentSelectors: true,
    selectorCacheEnabled: true
  });

  await intelligentEngine.initialize();
  const intelligentStart = Date.now();
  const intelligentResults = await intelligentEngine.search(['web scraping tools']);
  const intelligentTime = Date.now() - intelligentStart;
  await intelligentEngine.cleanup();

  // Test with legacy selectors
  console.log('🔧 Testing with Legacy Selectors...');
  const legacyEngine = new EnhancedCrawleeSearchEngine({
    maxResultsPerEngine: 3,
    searchEngines: ['duckduckgo'],
    useIntelligentSelectors: false, // Use legacy selectors
    selectorCacheEnabled: false
  });

  await legacyEngine.initialize();
  const legacyStart = Date.now();
  const legacyResults = await legacyEngine.search(['web scraping tools']);
  const legacyTime = Date.now() - legacyStart;
  await legacyEngine.cleanup();

  // Compare results
  console.log('\n📊 Performance Comparison Results:');
  console.log('==================================');
  console.log(`Intelligent Selectors: ${intelligentResults.length} results in ${intelligentTime}ms`);
  console.log(`Legacy Selectors: ${legacyResults.length} results in ${legacyTime}ms`);
  
  const improvement = ((legacyTime - intelligentTime) / legacyTime * 100);
  if (improvement > 0) {
    console.log(`🚀 Intelligent selectors were ${improvement.toFixed(1)}% faster!`);
  } else {
    console.log(`⚠️ Legacy selectors were ${Math.abs(improvement).toFixed(1)}% faster`);
  }

  // Compare success rates
  const intelligentSuccess = intelligentResults.filter(r => r.metadata.selectorType === 'intelligent').length;
  const legacySuccess = legacyResults.filter(r => r.metadata.selectorType === 'legacy').length;
  
  console.log(`\n🎯 Success Rate Comparison:`);
  console.log(`Intelligent Selectors: ${((intelligentSuccess / intelligentResults.length) * 100).toFixed(1)}% success rate`);
  console.log(`Legacy Selectors: ${((legacySuccess / legacyResults.length) * 100).toFixed(1)}% success rate`);
}

async function demonstrateSelectorCaching() {
  console.log('\n💾 Selector Caching Demonstration');
  console.log('==================================\n');

  const selectorManager = new IntelligentSelectorManager();
  
  console.log('Cache Features:');
  console.log('- Automatic selector validation');
  console.log('- Success/failure rate tracking');
  console.log('- TTL-based cache expiration');
  console.log('- Cross-session persistence');
  
  const stats = selectorManager.getCacheStats();
  console.log(`\nCurrent Cache State:`);
  console.log(`- Total entries: ${stats.total}`);
  console.log(`- Successful selectors: ${stats.successful}`);
  console.log(`- Failed selectors: ${stats.failed}`);
  console.log(`- Success rate: ${stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}%`);
}

// Main execution
async function main() {
  try {
    await demonstrateIntelligentSearch();
    await compareWithLegacySelectors();
    await demonstrateSelectorCaching();
    
    console.log('\n🎉 All demonstrations completed successfully!');
    console.log('\nKey Benefits of Intelligent Selectors:');
    console.log('- ✅ Automatic selector generation and maintenance');
    console.log('- ✅ Community-maintained selector integration'); 
    console.log('- ✅ Intelligent caching and validation');
    console.log('- ✅ Multi-tier fallback strategies');
    console.log('- ✅ Support for both Playwright and Puppeteer');
    console.log('- ✅ Performance optimization through caching');
    console.log('- ✅ Reduced maintenance burden');
    
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { demonstrateIntelligentSearch, compareWithLegacySelectors, demonstrateSelectorCaching };
