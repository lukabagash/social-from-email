#!/usr/bin/env node
import { SiteDiscoveryEngine } from "./site-discovery/site-finder";

function printQueries(queries: string[], title: string, maxQueries: number = 20) {
  console.log(`\n${title}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total queries generated: ${queries.length}`);
  console.log(`Showing first ${Math.min(maxQueries, queries.length)} queries:\n`);
  
  queries.slice(0, maxQueries).forEach((query, index) => {
    console.log(`${(index + 1).toString().padStart(3)}: ${query}`);
  });
  
  if (queries.length > maxQueries) {
    console.log(`... and ${queries.length - maxQueries} more queries`);
  }
}

function main() {
  const firstName = "John";
  const lastName = "Doe";
  const email = "john.doe@example.com";
  
  console.log("🔍 OSINT QUERY ORDER COMPARISON");
  console.log("=" .repeat(80));
  console.log(`Test Person: ${firstName} ${lastName} (${email})`);
  
  // 1. Social-First Priority (Optimized)
  const socialFirstQueries = SiteDiscoveryEngine.generatePrioritizedQueries(
    firstName, lastName, email, 'social-first'
  );
  printQueries(socialFirstQueries, "🔗 SOCIAL-FIRST OPTIMIZATION (Best for quick social media discovery)", 15);
  
  // 2. Professional Priority
  const professionalQueries = SiteDiscoveryEngine.generatePrioritizedQueries(
    firstName, lastName, email, 'professional'
  );
  printQueries(professionalQueries, "💼 PROFESSIONAL FOCUS (Best for business context)", 15);
  
  // 3. Original Comprehensive (Now optimized order)
  const comprehensiveQueries = SiteDiscoveryEngine.generateSearchQueries(
    firstName, lastName, email
  );
  printQueries(comprehensiveQueries, "🌐 COMPREHENSIVE SEARCH (All patterns, optimized order)", 25);
  
  // Show the differences
  console.log("\n📊 COMPARISON SUMMARY");
  console.log("=" .repeat(60));
  console.log(`🔗 Social-First:     ${socialFirstQueries.length} queries (focused on social media)`);
  console.log(`💼 Professional:     ${professionalQueries.length} queries (focused on business)`);
  console.log(`🌐 Comprehensive:    ${comprehensiveQueries.length} queries (all patterns)`);
  
  console.log("\n🎯 OPTIMIZATION HIGHLIGHTS:");
  console.log("✅ Social media sites (LinkedIn, Twitter, Facebook) are searched FIRST");
  console.log("✅ High-success patterns (username formats) prioritized early");
  console.log("✅ Deep searches (file types, location) moved to later tiers");
  console.log("✅ Email-based searches strategically positioned");
  console.log("✅ Professional terms optimized for business discovery");
  
  console.log("\n💡 RECOMMENDED USAGE:");
  console.log("• Use --priority=social-first with 10-20 queries for fast social discovery");
  console.log("• Use --priority=professional with 15-25 queries for business research");
  console.log("• Use --priority=comprehensive with 50+ queries for thorough investigation");
}

main();
